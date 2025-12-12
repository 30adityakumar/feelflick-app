// scripts/pipeline/08-generate-embeddings.js

const Logger = require('../utils/logger');
const openaiClient = require('../utils/openai-client');
const { supabase, updateMovie, addToRetryQueue } = require('../utils/supabase');

const logger = new Logger('08-generate-embeddings.log');

const BATCH_SIZE = 50; // Process in batches for efficiency

/**
 * Generate embedding for a single movie
 */
async function generateEmbedding(movie) {
  try {
    logger.debug(`Generating embedding for: ${movie.title}`);

    // Generate embedding
    const embedding = await openaiClient.generateEmbedding(movie);

    // Convert array to Postgres vector format: '[0.1, 0.2, ...]'
    const vectorString = `[${embedding.join(',')}]`;

    // Update movie with embedding
    await updateMovie(movie.id, {
      embedding: vectorString,
      has_embeddings: true,
      last_embedding_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    logger.debug(`✓ Embedding generated for: ${movie.title}`);

    return { success: true };

  } catch (error) {
    logger.error(`✗ Failed to generate embedding for ${movie.title}:`, { error: error.message });

    // Add to retry queue
    if (error.message === 'OPENAI_RATE_LIMIT') {
      logger.warn('Rate limit hit, will retry later');
      await addToRetryQueue(movie.tmdb_id, 'generate_embedding', error, 1); // High priority
    } else {
      await addToRetryQueue(movie.tmdb_id, 'generate_embedding', error);
    }

    return { success: false, error: error.message };
  }
}

/**
 * Generate embeddings in batch
 */
async function generateEmbeddingsBatch(movies) {
  try {
    logger.debug(`Generating batch of ${movies.length} embeddings`);

    // Generate embeddings
    const embeddings = await openaiClient.generateEmbeddingsBatch(movies);

    // Update all movies
    const updates = movies.map((movie, index) => {
      const vectorString = `[${embeddings[index].join(',')}]`;
      return {
        id: movie.id,
        embedding: vectorString,
        has_embeddings: true,
        last_embedding_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    // Bulk update using upsert
    const { error } = await supabase
      .from('movies')
      .upsert(updates, { onConflict: 'id' });

    if (error) {
      throw new Error(`Batch update failed: ${error.message}`);
    }

    logger.debug(`✓ Batch of ${movies.length} embeddings generated`);

    return { success: true, count: movies.length };

  } catch (error) {
    logger.error(`✗ Failed to generate batch embeddings:`, { error: error.message });

    // Fallback: try individual generation
    logger.info('Falling back to individual generation...');
    let successCount = 0;
    for (const movie of movies) {
      const result = await generateEmbedding(movie);
      if (result.success) successCount++;
    }

    return { success: false, partial: successCount, error: error.message };
  }
}

/**
 * Main execution
 */
async function main(options = {}) {
  const startTime = Date.now();
  const useBatch = options.batch !== false; // Default true
  const maxMovies = options.limit || 5000;
  
  logger.section('🤖 GENERATE EMBEDDINGS (OpenAI)');
  logger.info('Started at: ' + new Date().toISOString());
  logger.info(`Batch mode: ${useBatch ? 'enabled' : 'disabled'}`);
  logger.info(`Max movies: ${maxMovies}`);

  try {
    // Get movies needing embeddings
    // Priority 1: New movies without embeddings
    // Priority 2: Movies with stale embeddings (scored after last embedding)
    const { data: movies, error } = await supabase
      .from('movies')
      .select('id, tmdb_id, title, overview, runtime, vote_average, vote_count, popularity, primary_genre, release_year, pacing_score, intensity_score, emotional_depth_score, star_power, vfx_level, cult_status, keywords, genres, top3_cast_avg, has_embeddings, last_embedding_at, last_scored_at')
      .eq('has_scores', true) // Must have scores first
      .or('has_embeddings.is.false,last_embedding_at.lt.last_scored_at')
      .order('vote_count', { ascending: false })
      .limit(maxMovies);

    if (error) {
      throw new Error(`Failed to fetch movies: ${error.message}`);
    }

    if (!movies || movies.length === 0) {
      logger.info('✓ No movies need embeddings');
      return;
    }

    logger.info(`Found ${movies.length} movies needing embeddings`);
    
    // Estimate cost
    const estimatedCost = (movies.length * 0.00001).toFixed(4);
    logger.info(`Estimated cost: $${estimatedCost}\n`);

    // Process movies
    let successCount = 0;
    let failCount = 0;

    if (useBatch) {
      // Process in batches
      for (let i = 0; i < movies.length; i += BATCH_SIZE) {
        const batch = movies.slice(i, Math.min(i + BATCH_SIZE, movies.length));
        
        logger.info(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(movies.length / BATCH_SIZE)} (${batch.length} movies)`);
        
        const result = await generateEmbeddingsBatch(batch);
        
        if (result.success) {
          successCount += result.count;
        } else if (result.partial) {
          successCount += result.partial;
          failCount += batch.length - result.partial;
        } else {
          failCount += batch.length;
        }

        // Progress update
        logger.info(`Progress: ${Math.min(i + BATCH_SIZE, movies.length)}/${movies.length} (${successCount} success, ${failCount} failed)`);
      }
    } else {
      // Process individually
      for (let i = 0; i < movies.length; i++) {
        const movie = movies[i];
        
        if (i > 0 && i % 50 === 0) {
          logger.info(`Progress: ${i}/${movies.length} (${successCount} success, ${failCount} failed)`);
        }

        const result = await generateEmbedding(movie);
        
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const actualCost = openaiClient.getTotalCost();
    
    logger.section('📊 SUMMARY');
    logger.info(`Total movies processed: ${movies.length}`);
    logger.success(`✓ Successful: ${successCount}`);
    if (failCount > 0) {
      logger.error(`✗ Failed: ${failCount}`);
    }
    logger.info(`\nOpenAI API usage:`);
    logger.info(`  - Requests: ${openaiClient.getRequestCount()}`);
    logger.info(`  - Actual cost: $${actualCost}`);
    logger.info(`Duration: ${duration}s`);
    logger.info(`Average: ${(successCount / (duration / 60)).toFixed(1)} embeddings/minute`);

    logger.success('\n✅ Embedding generation complete!');
    logger.info(`Log file: ${logger.getLogFilePath()}`);

  } catch (error) {
    logger.error('Fatal error:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  if (args.includes('--no-batch')) {
    options.batch = false;
  }
  
  if (args.includes('--limit')) {
    const limitIndex = args.indexOf('--limit');
    options.limit = parseInt(args[limitIndex + 1]) || 5000;
  }

  main(options);
}

module.exports = { generateEmbedding, generateEmbeddingsBatch };
