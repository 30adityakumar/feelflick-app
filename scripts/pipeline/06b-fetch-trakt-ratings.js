// scripts/pipeline/06b-fetch-trakt-ratings.js

/**
 * ============================================================================
 * STEP 06b: FETCH TRAKT.TV RATINGS
 * ============================================================================
 *
 * Purpose:
 *   Fetch community ratings from Trakt.tv for movies that have an IMDb ID.
 *   Trakt's user base skews cinephile (similar to Letterboxd), making it a
 *   higher-signal source than TMDB's broad community average.
 *
 * Input:
 *   Movies with imdb_id set and no existing trakt_rating in ratings_external.
 *
 * Output:
 *   ratings_external.trakt_rating, trakt_votes, trakt_fetched_at populated.
 *
 * Prerequisites:
 *   - TRAKT_CLIENT_ID in .env
 *     Register a free app at: https://trakt.tv/oauth/applications/new
 *
 * Options:
 *   --limit=N         Max movies to process (default: 200)
 *   --dry-run         Simulate without writing to database
 *   --force           Re-fetch even if trakt_rating already exists
 *   --refresh-stale   Only re-fetch rows older than 90 days
 *
 * Rate limits:
 *   Trakt free tier: 1,000 req / 5 min. This script uses 350ms between
 *   requests (~171 req/min), well within limits.
 *
 * ============================================================================
 */

require('dotenv').config();

const Logger      = require('../utils/logger');
const { supabase } = require('../utils/supabase');
const traktClient = require('../utils/trakt-client');

const logger = new Logger('06b-fetch-trakt-ratings.log');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  DEFAULT_LIMIT: 200,
  LOG_INTERVAL:  50,
};

// ============================================================================
// FETCH MOVIES THAT NEED TRAKT RATINGS
// ============================================================================

/**
 * Build a Set of movie IDs that should be skipped (already have trakt data).
 * Paginates through ratings_external in 1000-row chunks.
 * @param {boolean} staleOnly - When true, only skip rows that are fresh (<90 days)
 * @returns {Promise<Set<number>>}
 */
async function fetchMoviesNeedingTrakt(limit, force, staleOnly = false) {
  // Get all trakt-processed movie_ids first (paginated like step 06)
  const processedIds = new Set();
  if (!force) {
    let from = 0;
    const page = 1000;
    const staleThreshold = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
    while (true) {
      const { data, error } = await supabase
        .from('ratings_external')
        .select('movie_id, trakt_rating, trakt_fetched_at')
        .range(from, from + page - 1);
      if (error) throw new Error(`Failed to fetch existing ratings: ${error.message}`);
      if (!data || data.length === 0) break;
      for (const r of data) {
        if (staleOnly) {
          // Only skip rows that are NOT stale (i.e. already fresh)
          if (r.trakt_rating != null && r.trakt_fetched_at > staleThreshold) {
            processedIds.add(r.movie_id);
          }
        } else {
          if (r.trakt_rating != null) processedIds.add(r.movie_id);
        }
      }
      if (data.length < page) break;
      from += page;
    }
  }

  // Fetch candidates from movies, paginate if needed
  const out = [];
  let from = 0;
  const page = 1000;
  while (out.length < limit) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, title, imdb_id, popularity')
      .not('imdb_id', 'is', null)
      .order('popularity', { ascending: false })
      .range(from, from + page - 1);
    if (error) throw new Error(`Failed to fetch movies: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const m of data) {
      if (!processedIds.has(m.id)) {
        out.push(m);
        if (out.length >= limit) break;
      }
    }
    if (data.length < page) break;
    from += page;
  }
  return out;
}

// ============================================================================
// UPSERT TRAKT DATA INTO ratings_external
// ============================================================================

async function saveTrakt(movie, traktData) {
  const { error } = await supabase
    .from('ratings_external')
    .upsert({
      movie_id: movie.id,
      trakt_rating: Math.round(traktData.rating * 100) / 100,
      trakt_votes: traktData.votes,
      trakt_fetched_at: new Date().toISOString(),
    }, { onConflict: 'movie_id' });
  if (error) throw new Error(`Upsert failed: ${error.message}`);
}

async function markTraktAttempted(movie) {
  const { error } = await supabase
    .from('ratings_external')
    .upsert({
      movie_id: movie.id,
      trakt_fetched_at: new Date().toISOString(),
    }, { onConflict: 'movie_id' });
  if (error) logger.warn(`markTraktAttempted failed: ${error.message}`);
}

// ============================================================================
// PROCESS A SINGLE MOVIE
// ============================================================================

async function processMovie(movie, dryRun) {
  try {
    logger.debug(`  Fetching Trakt rating for: ${movie.title} (${movie.imdb_id})`);

    if (dryRun) {
      logger.debug(`  [DRY RUN] Would fetch ${movie.imdb_id}`);
      return { success: true, skipped: false, dryRun: true };
    }

    const traktData = await traktClient.getMovieRatings(movie.imdb_id);

    if (!traktData) {
      // 404 from Trakt
      logger.debug(`  ⊘ ${movie.title}: not found on Trakt`);
      await markTraktAttempted(movie);
      return { success: true, skipped: true };
    }

    if (!traktData.rating || traktData.votes === 0) {
      // Movie exists but has no community rating yet
      logger.debug(`  ⊘ ${movie.title}: no Trakt rating yet (0 votes)`);
      await markTraktAttempted(movie);
      return { success: true, skipped: true };
    }

    await saveTrakt(movie, traktData);

    logger.debug(
      `  ✓ ${movie.title}: ${traktData.rating.toFixed(2)}/10 (${traktData.votes.toLocaleString()} votes)`
    );

    return { success: true, skipped: false, rating: traktData.rating, votes: traktData.votes };

  } catch (err) {
    logger.error(`  ✗ ${movie.title} (${movie.imdb_id}): ${err.message}`);
    return { success: false, error: err.message };
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function fetchTraktRatings(options = {}) {
  const startTime = Date.now();
  const limit        = options.limit        ?? CONFIG.DEFAULT_LIMIT;
  const dryRun       = options.dryRun       ?? false;
  const force        = options.force        ?? false;
  const refreshStale = options.refreshStale ?? false;

  logger.section('🎬 STEP 06b: FETCH TRAKT.TV RATINGS');
  logger.info(`Limit:         ${limit}`);
  logger.info(`Dry run:       ${dryRun}`);
  logger.info(`Force:         ${force}`);
  logger.info(`Refresh stale: ${refreshStale}`);

  if (!traktClient.isConfigured) {
    logger.warn('⚠️  TRAKT_CLIENT_ID is not set in environment.');
    logger.warn('   Register a free app at https://trakt.tv/oauth/applications/new');
    logger.warn('   Skipping Trakt ratings for now.');
    return { success: true, skipped: true };
  }

  // Load movies
  logger.info('\nLoading movies without Trakt ratings...');
  let movies;
  try {
    movies = await fetchMoviesNeedingTrakt(limit, force, refreshStale);
  } catch (err) {
    logger.error(`Failed to load movies: ${err.message}`);
    return { success: false, error: err.message };
  }

  if (movies.length === 0) {
    logger.success('✓ No movies need Trakt ratings. All up to date.');
    return { success: true, processed: 0 };
  }

  logger.info(`Found ${movies.length} movies to process.\n`);

  // Process
  const stats = { processed: 0, fetched: 0, notFound: 0, failed: 0 };

  for (const movie of movies) {
    const result = await processMovie(movie, dryRun);

    stats.processed++;

    if (result.success && !result.skipped && !result.dryRun) stats.fetched++;
    else if (result.skipped) stats.notFound++;
    else if (!result.success) stats.failed++;

    if (stats.processed % CONFIG.LOG_INTERVAL === 0) {
      logger.info(
        `Progress: ${stats.processed}/${movies.length} | ` +
        `Fetched: ${stats.fetched} | Not on Trakt: ${stats.notFound} | Failed: ${stats.failed}`
      );
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  logger.section('📊 STEP 06b SUMMARY');
  logger.info(`Movies processed : ${stats.processed}`);
  logger.info(`Ratings fetched  : ${stats.fetched}`);
  logger.info(`Not on Trakt     : ${stats.notFound}`);
  if (stats.failed > 0) logger.warn(`Failed           : ${stats.failed}`);
  logger.info(`Trakt API calls  : ${traktClient.getRequestCount()}`);
  logger.info(`Duration         : ${duration}s`);

  // Coverage logging
  try {
    const { count: totalEligible } = await supabase
      .from('movies')
      .select('id', { count: 'exact', head: true })
      .not('imdb_id', 'is', null);
    const { count: withTrakt } = await supabase
      .from('ratings_external')
      .select('movie_id', { count: 'exact', head: true })
      .not('trakt_rating', 'is', null);
    if (totalEligible != null && withTrakt != null && totalEligible > 0) {
      logger.info(`\nTrakt coverage: ${withTrakt}/${totalEligible} movies have Trakt ratings (${((withTrakt / totalEligible) * 100).toFixed(1)}%)`);
    }
  } catch (coverageErr) {
    logger.warn(`Coverage query failed: ${coverageErr.message}`);
  }

  if (stats.failed === 0) {
    logger.success('\n✅ Step 06b completed successfully');
  } else {
    logger.warn(`\n⚠️  Step 06b completed with ${stats.failed} failures`);
  }

  return { success: stats.failed < stats.processed, ...stats, duration: parseFloat(duration) };
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const options = {
    limit:        CONFIG.DEFAULT_LIMIT,
    dryRun:       false,
    force:        false,
    refreshStale: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--limit='))  options.limit  = parseInt(arg.split('=')[1]);
    if (arg === '--dry-run')         options.dryRun = true;
    if (arg === '--force')           options.force  = true;
    if (arg === '--refresh-stale')   options.refreshStale = true;
  }

  const result = await fetchTraktRatings(options);
  process.exit(result.success ? 0 : 1);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { fetchTraktRatings };
