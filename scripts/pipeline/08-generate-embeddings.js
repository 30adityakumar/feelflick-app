// scripts/pipeline/08-generate-embeddings.js

require('dotenv').config();
const Logger = require('../utils/logger');
const openaiClient = require('../utils/openai-client');
const { supabase, updateMovie } = require('../utils/supabase');

const logger = new Logger('08-generate-embeddings.log');

const BATCH_SIZE = 50; // Process in batches to avoid overwhelming OpenAI API
const MAX_MOVIES = 5000; // Maximum movies to process in one run
const DELAY_MS = 100; // Delay between batches to respect rate limits

async function main() {
  logger.section('🤖 GENERATE EMBEDDINGS (OpenAI)');
  logger.info(`Started at: ${new Date().toISOString()}`);
  logger.info(`Batch mode: enabled`);
  logger.info(`Max movies: ${MAX_MOVIES}`);

  try {
    // Fetch movies that need embeddings
    const { data: movies, error } = await supabase
      .from('movies')
      .select('id, tmdb_id, title, overview, genres, runtime, vote_average, primary_genre, keywords')
      .not('fetched_at', 'is', null) // Has metadata
      .is('embedding', null) // Missing embedding
      .order('vote_count', { ascending: false })
      .limit(MAX_MOVIES);

    if (error) {
      throw new Error(`Failed to fetch movies: ${error.message}`);
    }

    if (!movies || movies.length === 0) {
      logger.warn('No movies need embeddings. All done!');
      return { success: 0, failed: 0, skipped: 0 };
    }

    logger.info(`Found ${movies.length} movies needing embeddings\n`);

    const stats = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    // Process in batches
    for (let i = 0; i < movies.length; i += BATCH_SIZE) {
      const batch = movies.slice(i, i + BATCH_SIZE);

      for (const movie of batch) {
        try {
          // Build embedding text
          const genresText = Array.isArray(movie.genres)
            ? movie.genres.join(', ')
            : (movie.genres || '');
          
          const keywordsText = Array.isArray(movie.keywords)
            ? movie.keywords.slice(0, 10).join(', ')
            : '';

          const embeddingText = [
            movie.title,
            genresText,
            movie.primary_genre,
            keywordsText,
            movie.overview
          ]
            .filter(Boolean)
            .join('. ')
            .substring(0, 2000); // Limit to 2000 chars

          // Generate embedding
          const embedding = await openaiClient.generateEmbedding(embeddingText);

          // Update database
          await updateMovie(movie.id, {
            embedding: embedding
          });

          stats.success++;

          if (stats.success % 10 === 0) {
            logger.info(`Progress: ${stats.success}/${movies.length} embeddings generated`);
          }
        } catch (error) {
          stats.failed++;
          stats.errors.push({
            movie_id: movie.id,
            title: movie.title,
            error: error.message
          });

          logger.error(`✗ Failed for ${movie.title}:`, error.message);

          if (stats.failed > 10) {
            logger.error('Too many failures. Stopping.');
            break;
          }
        }
      }

      // Delay between batches
      if (i + BATCH_SIZE < movies.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }

    // Summary
    logger.section('📊 SUMMARY');
    logger.success(`✓ Successful: ${stats.success}`);
    if (stats.failed > 0) {
      logger.error(`✗ Failed: ${stats.failed}`);
    }
    
    logger.info(`OpenAI API calls: ${openaiClient.getRequestCount()}`);
    logger.info(`Total cost: $${openaiClient.getTotalCost()}`);
    logger.info(`Duration: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

    if (stats.errors.length > 0 && stats.errors.length <= 10) {
      logger.warn('\nErrors:');
      stats.errors.forEach(e => {
        logger.warn(`  - ${e.title}: ${e.error}`);
      });
    }

    logger.success('\n✅ Embedding generation complete!');
    logger.info(`Log file: ${logger.getLogFilePath()}`);

    return stats;
  } catch (error) {
    logger.error('Fatal error:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

const startTime = Date.now();

if (require.main === module) {
  main();
}

module.exports = { main };
