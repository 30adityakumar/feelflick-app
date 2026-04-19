// scripts/pipeline/06-fetch-external-ratings.js

/**
 * ============================================================================
 * STEP 06: FETCH EXTERNAL RATINGS (OMDb)
 * ============================================================================
 *
 * Purpose:
 *   Fetch IMDb, Rotten Tomatoes, and Metacritic ratings from OMDb API
 *
 * Input:
 *   - Movies with imdb_id but no external ratings
 *
 * Output:
 *   - ratings_external table populated
 *   - Status remains 'fetching' (ready for step 07 - scoring)
 *
 * Options:
 *   --limit=N     Process max N movies (default: 100)
 *   --dry-run     Simulate without making changes
 *
 * Rate Limits:
 *   OMDb Free: 1,000 requests/day
 *   Delay: 100ms between requests (no per-second limit, only daily)
 *
 * ============================================================================
 */

require('dotenv').config();

const Logger = require('../utils/logger');
const { supabase } = require('../utils/supabase');
const axios = require('axios');

const logger = new Logger('06-fetch-external-ratings.log');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  DEFAULT_LIMIT: 100,
  OMDB_API_KEY: process.env.OMDB_API_KEY,
  OMDB_API_URL: 'https://www.omdbapi.com/',
  RATE_LIMIT_DELAY_MS: 100,
  REQUEST_TIMEOUT_MS: 10000,
  MAX_RETRIES: 2
};

// ============================================================================
// GET EXISTING RATED MOVIE IDS (PAGINATED)
// ============================================================================

/**
 * Paginate through ratings_external to build a Set of movie IDs that
 * should NOT be re-fetched. Rows with fetch_error_type='quota_exhausted'
 * are excluded so they get retried on the next run.
 * @returns {Promise<Set<number>>}
 */
async function getExistingRatedMovieIds() {
  const ids = new Set();
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('ratings_external')
      .select('movie_id, fetch_error_type')
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`Failed to fetch existing ratings: ${error.message}`);
    if (!data || data.length === 0) break;

    // WHY: quota_exhausted rows were transient failures — retry them
    data.forEach(r => {
      if (r.fetch_error_type !== 'quota_exhausted') ids.add(r.movie_id);
    });

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return ids;
}

// ============================================================================
// FETCH FROM OMDB WITH RETRY
// ============================================================================

async function fetchFromOMDb(imdbId, retryCount = 0) {
  try {
    const response = await axios.get(CONFIG.OMDB_API_URL, {
      params: {
        apikey: CONFIG.OMDB_API_KEY,
        i: imdbId,
        plot: 'short'
      },
      timeout: CONFIG.REQUEST_TIMEOUT_MS
    });

    if (response.data.Response === 'False') {
      const errMsg = (response.data.Error || '').toLowerCase();
      let errorType = 'not_found';
      if (errMsg.includes('request limit') || errMsg.includes('limit reached')) {
        errorType = 'quota_exhausted';
      } else if (errMsg.includes('not found') || errMsg.includes('incorrect')) {
        errorType = 'not_found';
      } else {
        errorType = 'unknown';
      }

      return {
        success: false,
        error: response.data.Error,
        errorType,
        shouldRetry: false
      };
    }

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    if (retryCount < CONFIG.MAX_RETRIES &&
        (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {

      logger.warn(`  Retry ${retryCount + 1}/${CONFIG.MAX_RETRIES} for ${imdbId}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchFromOMDb(imdbId, retryCount + 1);
    }

    return {
      success: false,
      error: error.message,
      errorType: 'network',
      shouldRetry: false
    };
  }
}

// ============================================================================
// PARSE OMDB RATINGS
// ============================================================================

function parseOMDbRatings(data) {
  const ratings = {
    imdb_rating: null,
    imdb_votes: null,
    rt_rating: null,
    rt_critics_count: null,
    metacritic_score: null
  };

  // Parse IMDb rating
  if (data.imdbRating && data.imdbRating !== 'N/A') {
    ratings.imdb_rating = parseFloat(data.imdbRating);
  }

  // Parse IMDb votes
  if (data.imdbVotes && data.imdbVotes !== 'N/A') {
    ratings.imdb_votes = parseInt(data.imdbVotes.replace(/,/g, ''));
  }

  // Parse Rotten Tomatoes
  const rtRating = data.Ratings?.find(r => r.Source === 'Rotten Tomatoes');
  if (rtRating && rtRating.Value) {
    ratings.rt_rating = rtRating.Value; // Store as "85%" string
  }

  // Estimate RT critics count — OMDB doesn't expose the actual count.
  // WHY: calculateCriticRating gates on ≥20 reviews to avoid noisy scores.
  // Heuristic: if RT score exists and the film has ≥10k IMDb votes, it almost
  // certainly has ≥20 critic reviews (RT only surfaces scores with enough reviews).
  // Films with fewer IMDb votes get null (unknown count), which the scoring
  // engine treats conservatively.
  if (ratings.rt_rating != null && ratings.imdb_votes >= 10000) {
    ratings.rt_critics_count = 20; // conservative floor estimate
  }

  // Parse Metacritic
  const metaRating = data.Ratings?.find(r => r.Source === 'Metacritic');
  if (metaRating && metaRating.Value) {
    const metaScore = parseInt(metaRating.Value.split('/')[0]);
    if (!isNaN(metaScore)) {
      ratings.metacritic_score = metaScore;
    }
  }

  return ratings;
}

// ============================================================================
// PROCESS SINGLE MOVIE
// ============================================================================

async function processMovie(movie, dryRun = false) {
  try {
    logger.debug(`  Fetching ratings for: ${movie.title} (${movie.imdb_id})`);

    if (dryRun) {
      return { success: true };
    }

    // Fetch from OMDb
    const result = await fetchFromOMDb(movie.imdb_id);

    if (!result.success) {
      logger.warn(`  ⚠️  ${result.error} for ${movie.title}`);

      // Upsert a record to mark as attempted
      await supabase
        .from('ratings_external')
        .upsert({
          movie_id: movie.id,
          fetched_at: new Date().toISOString(),
          fetch_error: result.error || null,
          fetch_error_type: result.errorType || null
        }, { onConflict: 'movie_id' });

      return { success: true, skipped: true, errorType: result.errorType };
    }

    // Parse ratings
    const ratings = parseOMDbRatings(result.data);

    // Upsert into ratings_external (rt_critics_count included via spread)
    const { error } = await supabase
      .from('ratings_external')
      .upsert({
        movie_id: movie.id,
        ...ratings,
        fetched_at: new Date().toISOString(),
        fetch_error: null,
        fetch_error_type: null
      }, { onConflict: 'movie_id' });

    if (error) {
      throw new Error(`Failed to upsert ratings: ${error.message}`);
    }

    logger.success(`  ✓ ${movie.title}: IMDb ${ratings.imdb_rating || 'N/A'}, RT ${ratings.rt_rating || 'N/A'}, Meta ${ratings.metacritic_score || 'N/A'}`);

    return {
      success: true,
      ratings
    };

  } catch (error) {
    logger.error(`  ✗ Failed for ${movie.title}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function fetchExternalRatings(options = {}) {
  const startTime = Date.now();

  const config = {
    limit: options.limit || CONFIG.DEFAULT_LIMIT,
    retryNullRatings: options.retryNullRatings || false,
    dryRun: options.dryRun || false
  };

  logger.section('🎬 FETCH EXTERNAL RATINGS (OMDb)');
  logger.info(`Limit: ${config.limit} movies`);
  logger.info(`Dry run: ${config.dryRun ? 'YES' : 'NO'}`);

  // Check API key
  if (!CONFIG.OMDB_API_KEY) {
    logger.error('OMDB_API_KEY not set in environment');
    return { success: false, error: 'Missing API key' };
  }

  logger.info('API Key: ✓\n');

  try {
    let movies;

    if (config.retryNullRatings) {
      // Retry legacy rows: imdb_rating IS NULL and no error categorization
      logger.info('Mode: Retry null ratings (legacy rows without error categorization)');
      const { data: retryRows, error: retryErr } = await supabase
        .from('ratings_external')
        .select('movie_id, movies!inner(id, imdb_id, title)')
        .is('imdb_rating', null)
        .is('fetch_error_type', null)
        .limit(config.limit);

      if (retryErr) throw new Error(`Failed to fetch retry candidates: ${retryErr.message}`);

      movies = (retryRows || [])
        .filter(r => r.movies?.imdb_id)
        .map(r => ({ id: r.movies.id, imdb_id: r.movies.imdb_id, title: r.movies.title }));
    } else {
      // Paginated fetch of existing rated movie IDs
      const existingMovieIds = await getExistingRatedMovieIds();
      logger.info(`Existing ratings (excluding quota errors): ${existingMovieIds.size}`);

      const { data: allMovies, error } = await supabase
        .from('movies')
        .select('id, tmdb_id, title, imdb_id, vote_count')
        .not('imdb_id', 'is', null)
        .order('vote_count', { ascending: false })
        .limit(config.limit * 2);  // Fetch more to filter

      if (error) {
        throw new Error(`Failed to fetch movies: ${error.message}`);
      }

      // Filter out movies that already have ratings
      movies = allMovies
        .filter(m => !existingMovieIds.has(m.id))
        .slice(0, config.limit);
    }

    if (!movies || movies.length === 0) {
      logger.info('✓ No movies need external ratings');
      return { success: true, stats: { processed: 0, success: 0, failed: 0 } };
    }

    logger.info(`Found ${movies.length} movies needing external ratings\n`);

    // Stats
    const stats = {
      total: movies.length,
      success: 0,
      skipped: 0,
      failed: 0,
      quota_exhausted_count: 0,
      with_imdb: 0,
      with_rt: 0,
      with_rt_count: 0,
      with_metacritic: 0
    };

    // Process each movie
    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];

      // Progress logging
      if (i > 0 && i % 25 === 0) {
        logger.info(`\nProgress: ${i}/${movies.length} (${stats.success} success, ${stats.skipped} skipped, ${stats.failed} failed)`);
      }

      logger.debug(`${i + 1}/${movies.length} ${movie.title}`);

      const result = await processMovie(movie, config.dryRun);

      if (result.success) {
        if (result.skipped) {
          stats.skipped++;

          if (result.errorType === 'quota_exhausted') {
            stats.quota_exhausted_count++;
            logger.error(`  🛑 OMDB quota exhausted. Stopping run. Processed ${i}/${movies.length}.`);
            break;
          }
        } else {
          stats.success++;

          if (result.ratings) {
            if (result.ratings.imdb_rating) stats.with_imdb++;
            if (result.ratings.rt_rating) stats.with_rt++;
            if (result.ratings.rt_critics_count) stats.with_rt_count++;
            if (result.ratings.metacritic_score) stats.with_metacritic++;
          }
        }
      } else {
        stats.failed++;
      }

      // Rate limiting
      if (!config.dryRun && i < movies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.RATE_LIMIT_DELAY_MS));
      }
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    logger.section('📊 SUMMARY');
    logger.info(`Total movies: ${stats.total}`);
    logger.success(`✓ Successfully fetched: ${stats.success}`);

    if (stats.skipped > 0) {
      logger.warn(`⊘ Skipped (not found/errors): ${stats.skipped}`);
    }

    if (stats.quota_exhausted_count > 0) {
      logger.error(`🛑 Quota exhausted: ${stats.quota_exhausted_count} (these will be retried next run)`);
    }

    if (stats.failed > 0) {
      logger.error(`✗ Failed: ${stats.failed}`);
    }

    if (stats.success > 0) {
      logger.info(`\nRatings Coverage (this run):`);
      logger.info(`  IMDb ratings: ${stats.with_imdb} (${(stats.with_imdb / stats.success * 100).toFixed(1)}%)`);
      logger.info(`  Rotten Tomatoes: ${stats.with_rt} (${(stats.with_rt / stats.success * 100).toFixed(1)}%)`);
      logger.info(`  Metacritic: ${stats.with_metacritic} (${(stats.with_metacritic / stats.success * 100).toFixed(1)}%)`);
    }

    // Catalog coverage
    try {
      const { count: totalNeedingRatings } = await supabase
        .from('movies')
        .select('id', { count: 'exact', head: true })
        .not('imdb_id', 'is', null);
      const { count: withRatings } = await supabase
        .from('ratings_external')
        .select('movie_id', { count: 'exact', head: true })
        .not('imdb_rating', 'is', null);
      if (totalNeedingRatings != null && withRatings != null && totalNeedingRatings > 0) {
        logger.info(`\nCatalog coverage: ${withRatings}/${totalNeedingRatings} movies have IMDb ratings (${((withRatings / totalNeedingRatings) * 100).toFixed(1)}%)`);
      }
    } catch (coverageErr) {
      logger.warn(`Coverage query failed: ${coverageErr.message}`);
    }

    logger.info(`\nDuration: ${duration}s`);
    logger.info(`Average: ${stats.success > 0 ? (stats.success / (duration / 60)).toFixed(1) : 0} movies/minute`);
    logger.info(`OMDb API calls: ${stats.success + stats.skipped}`);

    if (stats.success > 0) {
      logger.success('\n✅ External ratings fetch complete! Run step 07 to calculate scores.');
    }

    logger.info(`\nLog file: ${logger.getLogFilePath()}`);

    return {
      success: stats.failed === 0 || stats.success > 0,
      stats
    };

  } catch (error) {
    logger.error('Fatal error:', { error: error.message, stack: error.stack });
    return { success: false, error: error.message };
  }
}

// ============================================================================
// CLI EXECUTION
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);

  const options = {
    dryRun: args.includes('--dry-run'),
    retryNullRatings: args.includes('--retry-null-ratings'),
    limit: CONFIG.DEFAULT_LIMIT
  };

  // Parse --limit=N
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  if (limitArg) {
    options.limit = parseInt(limitArg.split('=')[1]) || CONFIG.DEFAULT_LIMIT;
  }

  // Help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
┌─────────────────────────────────────────────────────────────────┐
│ Step 06: Fetch External Ratings (OMDb)                         │
└─────────────────────────────────────────────────────────────────┘

USAGE:
  node scripts/pipeline/06-fetch-external-ratings.js [options]

OPTIONS:
  --limit=N              Process max N movies (default: ${CONFIG.DEFAULT_LIMIT})
  --retry-null-ratings   Re-attempt OMDB for rows where imdb_rating is null and fetch_error_type is null (legacy rows)
  --dry-run              Simulate without making changes
  --help, -h             Show this help message

RATE LIMITS:
  OMDb Free Tier: 1,000 requests/day
  Script enforces: 100ms between requests

EXAMPLES:
  # Fetch ratings for 100 movies
  node scripts/pipeline/06-fetch-external-ratings.js

  # Fetch for 50 movies
  node scripts/pipeline/06-fetch-external-ratings.js --limit=50

  # Dry run
  node scripts/pipeline/06-fetch-external-ratings.js --dry-run

NOTE:
  Requires OMDB_API_KEY in .env file
  Get your key at: https://www.omdbapi.com/apikey.aspx
`);
    process.exit(0);
  }

  // Execute
  fetchExternalRatings(options)
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      logger.error('Fatal error:', { error: error.message });
      process.exit(1);
    });
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = fetchExternalRatings;
