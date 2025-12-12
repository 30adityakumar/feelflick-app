// Test version - only discover 3 movies
require('dotenv').config();
const Logger = require('../utils/logger');
const tmdbClient = require('../utils/tmdb-client');
const { createMovie, getMovieByTmdbId } = require('../utils/supabase');

const logger = new Logger('test-discover-limited.log');

async function main() {
  logger.section('🔍 LIMITED DISCOVER TEST (3 MOVIES)');
  logger.info('Started at: ' + new Date().toISOString());
  
  try {
    const discovered = [];
    const existing = [];
    
    // Get trending movies (we'll only process 3)
    logger.info('Fetching trending movies...');
    const trending = await tmdbClient.getTrending('week', 1);
    const moviesToProcess = trending.results.slice(0, 3);
    
    logger.info(`Processing ${moviesToProcess.length} movies\n`);
    
    for (const tmdbMovie of moviesToProcess) {
      logger.info(`Checking: ${tmdbMovie.title} (${tmdbMovie.id})`);
      
      const existingMovie = await getMovieByTmdbId(tmdbMovie.id);
      
      if (existingMovie) {
        existing.push(tmdbMovie.id);
        logger.debug(`  Already exists (DB ID: ${existingMovie.id})`);
      } else {
        const newMovie = await createMovie(tmdbMovie.id);
        discovered.push({
          tmdb_id: tmdbMovie.id,
          title: tmdbMovie.title,
          db_id: newMovie.id
        });
        logger.success(`  ✓ Added! DB ID: ${newMovie.id}`);
      }
    }
    
    logger.section('📊 SUMMARY');
    logger.success(`✓ New movies discovered: ${discovered.length}`);
    logger.info(`Already in database: ${existing.length}`);
    logger.info(`TMDB API calls: ${tmdbClient.getRequestCount()}`);
    
    if (discovered.length > 0) {
      logger.info('\nNewly added:');
      discovered.forEach((m, i) => {
        logger.info(`  ${i + 1}. ${m.title} (TMDB: ${m.tmdb_id})`);
      });
    }
    
    logger.success('\n✅ Limited discovery test complete!');
    
    return {
      discovered: discovered.length,
      existing: existing.length
    };
    
  } catch (error) {
    logger.error('Fatal error:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

main();
