// scripts/pipeline/06-fetch-external-ratings.js

const Logger = require('../utils/logger');
const omdbClient = require('../utils/omdb-client');
const { supabase, addToRetryQueue } = require('../utils/supabase');

const logger = new Logger('06-fetch-external-ratings.log');

/**
 * Fetch external ratings for a single movie
 */
async function fetchExternalRatings(movie) {
  try {
    if (!movie.imdb_id) {
      logger.warn(`No IMDb ID for: ${movie.title} - skipping`);
      return { success: false, reason: 'no_imdb_id' };
    }

    logger.debug(`Fetching ratings for: ${movie.title} (${movie.imdb_id})`);

    // Fetch from OMDb
    const ratings = await omdbClient.getRatings(movie.imdb_id);

    // Insert or update ratings_external table
    const { error: upsertError } = await supabase
      .from('ratings_external')
      .upsert({
        movie_id: movie.id,
        imdb_rating: ratings.imdb_rating,
        imdb_votes: ratings.imdb_votes,
        rt_rating: ratings.rt_rating,
        metacritic_score: ratings.metacritic_score,
        fetched_at: new Date().toISOString()
      }, {
        onConflict: 'movie_id'
      });

    if (upsertError) {
      throw new Error(`Failed to upsert ratings: ${upsertError.message}`);
    }

    logger.debug(`✓ Fetched ratings for: ${movie.title}`, {
      imdb: ratings.imdb_rating,
      rt: ratings.rt_rating,
      metacritic: ratings.metacritic_score
    });

    return {
      success: true,
      ratings
    };

  } catch (error) {
    // Handle quota exceeded
    if (error.message === 'OMDB_QUOTA_EXCEEDED') {
      logger.error('OMDb quota exceeded - stopping');
      throw error; // Propagate to stop processing
    }

    logger.error(`✗ Failed to fetch ratings for ${movie.title}:`, { error: error.message });

    // Add to retry queue
    await addToRetryQueue(movie.tmdb_id, 'fetch_external_ratings', error);

    return { success: false, error: error.message };
  }
}

/**
 * Main execution
 */
async function main(options = {}) {
  const startTime = Date.now();
  const maxMovies = options.limit || 1000; // Default limit per run
  const prioritizePopular = options.prioritizePopular !== false; // Default true
  
  logger.section('⭐ FETCH EXTERNAL RATINGS (OMDb)');
  logger.info('Started at: ' + new Date().toISOString());
  logger.info(`Max movies per run: ${maxMovies}`);
  logger.info(`OMDb quota remaining: ${omdbClient.getQuotaRemaining()}/1000`);

  try {
    // Get movies needing ratings
    // Priority 1: New movies (never fetched)
    // Priority 2: Stale ratings (>30 days old)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('movies')
      .select(`
        id,
        tmdb_id,
        title,
        imdb_id,
        vote_count,
        popularity,
        ratings_external (
          fetched_at
        )
      `)
      .not('imdb_id', 'is', null);

    // Filter: no ratings OR stale ratings
    if (options.forceRefresh) {
      // Refresh all
      logger.info('Mode: Force refresh all ratings');
    } else {
      // Only fetch missing or stale
      query = query.or(`ratings_external.is.null,ratings_external.fetched_at.lt.${thirtyDaysAgo}`);
    }

    // Order by popularity to prioritize important movies
    if (prioritizePopular) {
      query = query.order('vote_count', { ascending: false });
    }

    query = query.limit(maxMovies);

    const { data: movies, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch movies: ${error.message}`);
    }

    if (!movies || movies.length === 0) {
      logger.info('✓ No movies need external ratings updates');
      return;
    }

    logger.info(`Found ${movies.length} movies needing ratings`);
    logger.info(`Processing up to ${Math.min(movies.length, omdbClient.getQuotaRemaining())} movies (quota limit)\n`);

    // Process movies
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;
    const ratingsCollected = {
      imdb: 0,
      rt: 0,
      metacritic: 0
    };

    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];

      // Check quota before each request
      if (omdbClient.getQuotaRemaining() <= 0) {
        logger.warn(`\n⚠️  OMDb quota exhausted. Stopping at ${i}/${movies.length} movies.`);
        break;
      }
      
      if (i > 0 && i % 50 === 0) {
        logger.info(`Progress: ${i}/${movies.length} | Success: ${successCount}, Skip: ${skipCount}, Fail: ${failCount} | Quota: ${omdbClient.getQuotaRemaining()}`);
      }

      const result = await fetchExternalRatings(movie);
      
      if (result.success) {
        successCount++;
        if (result.ratings.imdb_rating) ratingsCollected.imdb++;
        if (result.ratings.rt_rating) ratingsCollected.rt++;
        if (result.ratings.metacritic_score) ratingsCollected.metacritic++;
      } else if (result.reason === 'no_imdb_id') {
        skipCount++;
      } else {
        failCount++;
      }

      // Stop if quota exceeded
      if (result.error === 'OMDB_QUOTA_EXCEEDED') {
        break;
      }
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logger.section('📊 SUMMARY');
    logger.info(`Total movies processed: ${successCount + skipCount + failCount}`);
    logger.success(`✓ Successful: ${successCount}`);
    if (skipCount > 0) {
      logger.warn(`⊘ Skipped (no IMDb ID): ${skipCount}`);
    }
    if (failCount > 0) {
      logger.error(`✗ Failed: ${failCount}`);
    }
    logger.info(`\nRatings collected:`);
    logger.info(`  - IMDb: ${ratingsCollected.imdb}`);
    logger.info(`  - Rotten Tomatoes: ${ratingsCollected.rt}`);
    logger.info(`  - Metacritic: ${ratingsCollected.metacritic}`);
    logger.info(`\nOMDb API usage:`);
    logger.info(`  - Requests made: ${omdbClient.getRequestCount()}`);
    logger.info(`  - Quota remaining: ${omdbClient.getQuotaRemaining()}/1000`);
    logger.info(`Duration: ${duration}s`);

    logger.success('\n✅ External ratings fetch complete!');
    logger.info(`Log file: ${logger.getLogFilePath()}`);

  } catch (error) {
    logger.error('Fatal error:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {};
  
  if (args.includes('--limit')) {
    const limitIndex = args.indexOf('--limit');
    options.limit = parseInt(args[limitIndex + 1]) || 1000;
  }
  
  if (args.includes('--force-refresh')) {
    options.forceRefresh = true;
  }
  
  if (args.includes('--no-priority')) {
    options.prioritizePopular = false;
  }

  main(options);
}

module.exports = { fetchExternalRatings };
