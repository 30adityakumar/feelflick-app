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
 *   --limit=N     Max movies to process (default: 200)
 *   --dry-run     Simulate without writing to database
 *   --force       Re-fetch even if trakt_rating already exists
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

async function fetchMoviesNeedingTrakt(limit, force) {
  // Join movies → ratings_external (LEFT JOIN so we catch movies with no row yet)
  // Filter: has imdb_id AND (no ratings_external row OR trakt_rating IS NULL)
  // unless --force, in which case fetch everything with an imdb_id

  let query = supabase
    .from('movies')
    .select(`
      id,
      title,
      imdb_id,
      popularity,
      ratings_external ( id, trakt_rating )
    `)
    .not('imdb_id', 'is', null)
    .order('popularity', { ascending: false })
    .limit(limit);

  if (!force) {
    // Only fetch movies where trakt_rating is missing
    // Supabase doesn't support NOT EXISTS natively in client; use a workaround:
    // Fetch all and filter client-side (limit is small enough)
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch movies: ${error.message}`);

  if (force) return data || [];

  // Client-side filter: no ratings_external row OR trakt_rating is null
  return (data || []).filter(m => {
    const re = Array.isArray(m.ratings_external) ? m.ratings_external[0] : m.ratings_external;
    return !re || re.trakt_rating === null || re.trakt_rating === undefined;
  });
}

// ============================================================================
// UPSERT TRAKT DATA INTO ratings_external
// ============================================================================

async function saveTrakt(movie, traktData) {
  const re = Array.isArray(movie.ratings_external)
    ? movie.ratings_external[0]
    : movie.ratings_external;

  const now = new Date().toISOString();

  if (re?.id) {
    // Row already exists — update the trakt columns only
    const { error } = await supabase
      .from('ratings_external')
      .update({
        trakt_rating:     Math.round(traktData.rating * 100) / 100,
        trakt_votes:      traktData.votes,
        trakt_fetched_at: now,
      })
      .eq('id', re.id);

    if (error) throw new Error(`Update failed: ${error.message}`);
  } else {
    // No ratings_external row yet — insert a minimal one with trakt data
    const { error } = await supabase
      .from('ratings_external')
      .insert({
        movie_id:         movie.id,
        trakt_rating:     Math.round(traktData.rating * 100) / 100,
        trakt_votes:      traktData.votes,
        trakt_fetched_at: now,
        fetched_at:       now,
      });

    if (error) throw new Error(`Insert failed: ${error.message}`);
  }
}

async function markTraktAttempted(movie) {
  const re = Array.isArray(movie.ratings_external)
    ? movie.ratings_external[0]
    : movie.ratings_external;

  const now = new Date().toISOString();

  if (re?.id) {
    await supabase
      .from('ratings_external')
      .update({ trakt_fetched_at: now })
      .eq('id', re.id);
  } else {
    await supabase
      .from('ratings_external')
      .insert({ movie_id: movie.id, fetched_at: now, trakt_fetched_at: now });
  }
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

    if (!traktData || !traktData.rating) {
      logger.debug(`  ⊘ ${movie.title}: not found on Trakt`);
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
  const limit     = options.limit   ?? CONFIG.DEFAULT_LIMIT;
  const dryRun    = options.dryRun  ?? false;
  const force     = options.force   ?? false;

  logger.section('🎬 STEP 06b: FETCH TRAKT.TV RATINGS');
  logger.info(`Limit:   ${limit}`);
  logger.info(`Dry run: ${dryRun}`);
  logger.info(`Force:   ${force}`);

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
    movies = await fetchMoviesNeedingTrakt(limit * 3, force); // over-fetch then slice
    movies = movies.slice(0, limit);
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
    limit:  CONFIG.DEFAULT_LIMIT,
    dryRun: false,
    force:  false,
  };

  for (const arg of args) {
    if (arg.startsWith('--limit='))  options.limit  = parseInt(arg.split('=')[1]);
    if (arg === '--dry-run')         options.dryRun = true;
    if (arg === '--force')           options.force  = true;
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
