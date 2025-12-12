const { supabase } = require('../utils/supabase');
const Logger = require('../utils/logger');
const tmdbClient = require('../utils/tmdb-client');

const logger = new Logger('fix-missing-keywords.log');

async function fixMissingKeywords() {
  logger.info('Finding movies without keywords...');
  
  const { data: movies, error } = await supabase
    .from('movies')
    .select('tmdb_id, title')
    .eq('has_keywords', false)
    .limit(100); // Process 100 at a time
  
  if (error) {
    logger.error('Error fetching movies:', error);
    return;
  }
  
  logger.info(`Found ${movies.length} movies without keywords`);
  
  let fixed = 0;
  let failed = 0;
  
  for (const movie of movies) {
    try {
      logger.info(`Fetching keywords for: ${movie.title} (${movie.tmdb_id})`);
      
      // Get keywords from TMDB
      const data = await tmdbClient.getMovie(movie.tmdb_id, 'keywords');
      const keywords = data.keywords?.keywords || [];
      
      // Update database
      const { error: updateError } = await supabase
        .from('movies')
        .update({
          keywords: keywords,
          keyword_count: keywords.length,
          has_keywords: true
        })
        .eq('tmdb_id', movie.tmdb_id);
      
      if (updateError) {
        logger.error(`Failed to update ${movie.tmdb_id}:`, updateError);
        failed++;
      } else {
        logger.success(`✓ Updated ${movie.title} with ${keywords.length} keywords`);
        fixed++;
      }
      
      // Rate limit
      await new Promise(r => setTimeout(r, 100));
      
    } catch (error) {
      logger.error(`Error processing ${movie.tmdb_id}:`, error.message);
      failed++;
    }
  }
  
  logger.section('SUMMARY');
  logger.info(`Fixed: ${fixed}`);
  logger.info(`Failed: ${failed}`);
}

fixMissingKeywords()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
