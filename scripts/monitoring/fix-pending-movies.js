const { supabase } = require('../utils/supabase');
const Logger = require('../utils/logger');

const logger = new Logger('fix-pending-movies.log');

async function fixPendingMovies() {
  logger.info('Finding pending movies...');
  
  const { data: movies } = await supabase
    .from('movies')
    .select('*')
    .eq('status', 'pending');
  
  logger.info(`Found ${movies.length} pending movies:\n`);
  
  movies.forEach(m => {
    logger.info(`TMDB ${m.tmdb_id}: ${m.title || 'NO TITLE'}`);
    logger.info(`  - Has embeddings: ${m.has_embeddings}`);
    logger.info(`  - Has scores: ${m.has_scores}`);
    logger.info(`  - Has cast: ${m.has_cast_metadata}`);
    logger.info(`  - Has keywords: ${m.has_keywords}`);
    logger.info(`  - FF Rating: ${m.ff_rating || 'NULL'}\n`);
  });
  
  // Fix their status
  logger.info('Setting all to complete status...');
  
  const { error } = await supabase
    .from('movies')
    .update({ status: 'complete' })
    .eq('status', 'pending')
    .not('title', 'is', null);
  
  if (error) {
    logger.error('Error updating:', error);
  } else {
    logger.success('✓ Updated all pending movies to complete');
  }
}

fixPendingMovies()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
