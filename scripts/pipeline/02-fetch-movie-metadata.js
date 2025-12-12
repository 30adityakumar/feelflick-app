// scripts/pipeline/02-fetch-movie-metadata.js

/**
 * ============================================================================
 * STEP 02: FETCH MOVIE METADATA FROM TMDB
 * ============================================================================
 * 
 * Purpose:
 *   Fetch complete movie metadata from TMDB for movies with status='pending'
 *   
 * Input:
 *   - Movies with status='pending' (created by step 01)
 *   
 * Output:
 *   - Movies with full TMDB metadata (title, overview, runtime, etc.)
 *   - Status updated to 'fetching' (ready for genres/keywords)
 *   
 * Options:
 *   --limit=N          Process max N movies (default: 1000)
 *   --stale-metadata   Update movies with old metadata (30+ days)
 *   --force            Force update even if metadata exists
 *   --dry-run          Simulate without making changes
 * 
 * ============================================================================
 */

require('dotenv').config();

const Logger = require('../utils/logger');
const tmdbClient = require('../utils/tmdb-client');
const { supabase } = require('../utils/supabase');

const logger = new Logger('02-fetch-movie-metadata.log');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  DEFAULT_LIMIT: 1000,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 5000,
  RATE_LIMIT_DELAY_MS: 250,
  STALE_THRESHOLD_DAYS: 30,
  BATCH_UPDATE_SIZE: 100
};

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

function classifyError(error) {
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('404') || message.includes('not found')) {
    return 'tmdb_not_found';
  }
  if (message.includes('429') || message.includes('rate limit')) {
    return 'tmdb_rate_limit';
  }
  if (message.includes('timeout')) {
    return 'timeout';
  }
  if (message.includes('network')) {
    return 'network_error';
  }
  if (message.includes('invalid') || message.includes('validation')) {
    return 'validation_error';
  }
  
  return 'unknown';
}

// ============================================================================
// FETCH WITH RETRY
// ============================================================================

async function fetchMovieWithRetry(tmdbId, retryCount = 0) {
  try {
    const details = await tmdbClient.getMovie(tmdbId);
    
    // Validate required fields
    if (!details.id || !details.title) {
      throw new Error('Invalid movie data: missing required fields');
    }
    
    return { success: true, data: details };
    
  } catch (error) {
    const errorType = classifyError(error);
    
    // Don't retry if movie not found
    if (errorType === 'tmdb_not_found') {
      return { 
        success: false, 
        error: error.message, 
        errorType,
        shouldRetry: false 
      };
    }
    
    // Retry on rate limits and network errors
    if (retryCount < CONFIG.MAX_RETRIES && 
        (errorType === 'tmdb_rate_limit' || errorType === 'network_error')) {
      
      const delay = CONFIG.RETRY_DELAY_MS * Math.pow(2, retryCount);
      logger.warn(`  Retry ${retryCount + 1}/${CONFIG.MAX_RETRIES} for TMDB ID ${tmdbId} (${errorType}) - waiting ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchMovieWithRetry(tmdbId, retryCount + 1);
    }
    
    return { 
      success: false, 
      error: error.message, 
      errorType,
      shouldRetry: retryCount < CONFIG.MAX_RETRIES 
    };
  }
}

// ============================================================================
// TRANSFORM TMDB DATA
// ============================================================================

function transformMovieData(tmdbData) {
  return {
    // Basic info
    title: tmdbData.title || null,
    original_title: tmdbData.original_title || null,
    original_language: tmdbData.original_language || null,
    overview: tmdbData.overview || null,
    tagline: tmdbData.tagline || null,
    
    // Release info
    release_date: tmdbData.release_date || null,
    release_year: tmdbData.release_date 
      ? parseInt(tmdbData.release_date.split('-')[0]) 
      : null,
    
    // Media
    poster_path: tmdbData.poster_path || null,
    backdrop_path: tmdbData.backdrop_path || null,
    
    // Metrics
    runtime: tmdbData.runtime || null,
    popularity: tmdbData.popularity || null,
    vote_average: tmdbData.vote_average || null,
    vote_count: tmdbData.vote_count || null,
    
    // Financial
    budget: tmdbData.budget || null,
    revenue: tmdbData.revenue || null,
    
    // Status & Links
    adult: tmdbData.adult || false,
    imdb_id: tmdbData.imdb_id || null,
    homepage: tmdbData.homepage || null,
    
    // Store genres and keywords as JSONB arrays (strings only)
    genres: tmdbData.genres?.length > 0 
      ? tmdbData.genres.map(g => g.name) 
      : null,
    keywords: null, // Will be fetched in step 03
    
    // Timestamps
    fetched_at: new Date().toISOString(),
    last_tmdb_sync: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    
    // Status progression
    status: 'fetching', // Move to next stage
    
    // Clear any previous errors
    last_error: null,
    error_type: null,
    last_error_at: null
  };
}

// ============================================================================
// UPDATE MOVIE WITH ERROR
// ============================================================================

async function updateMovieError(movieId, errorData) {
  const { error } = await supabase
    .from('movies')
    .update({
      status: 'error',
      error_type: errorData.errorType,
      last_error: errorData.error,
      last_error_at: new Date().toISOString(),
      retry_count: supabase.raw('COALESCE(retry_count, 0) + 1'),
      updated_at: new Date().toISOString()
    })
    .eq('id', movieId);
  
  if (error) {
    logger.error(`  Failed to update error for movie ${movieId}: ${error.message}`);
  }
}

// ============================================================================
// BATCH UPDATE MOVIES
// ============================================================================

async function batchUpdateMovies(updates) {
  if (updates.length === 0) return { success: true, count: 0 };
  
  try {
    const { error } = await supabase
      .from('movies')
      .upsert(updates, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });
    
    if (error) throw error;
    
    return { success: true, count: updates.length };
  } catch (error) {
    logger.error(`Batch update failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// GET MOVIES TO FETCH
// ============================================================================

async function getMoviesToFetch(options) {
  let query = supabase
    .from('movies')
    .select('id, tmdb_id, title, retry_count, last_tmdb_sync')
    .order('vote_count', { ascending: false, nullsFirst: false })
    .order('popularity', { ascending: false, nullsFirst: false })
    .limit(options.limit);
  
  if (options.staleMetadata) {
    // Fetch movies with old metadata (30+ days)
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - CONFIG.STALE_THRESHOLD_DAYS);
    
    query = query
      .lt('last_tmdb_sync', staleDate.toISOString())
      .in('status', ['fetching', 'scoring', 'embedding', 'complete']);
    
    logger.info('Mode: Refresh stale metadata (30+ days old)');
    
  } else if (options.force) {
    // Force update any movie
    logger.info('Mode: Force update (all movies)');
    
  } else {
    // Default: Only fetch pending movies
    query = query.eq('status', 'pending');
    logger.info('Mode: Fetch new movies (status=pending)');
  }
  
  // Exclude movies with too many errors (unless force mode)
  if (!options.force) {
    query = query.or('retry_count.is.null,retry_count.lt.5');
  }
  
  const { data: movies, error } = await query;
  
  if (error) {
    throw new Error(`Failed to fetch movies: ${error.message}`);
  }
  
  return movies || [];
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function fetchMovieMetadata(options = {}) {
  const startTime = Date.now();
  
  // Parse options
  const config = {
    limit: options.limit || CONFIG.DEFAULT_LIMIT,
    staleMetadata: options.staleMetadata || false,
    force: options.force || false,
    dryRun: options.dryRun || false
  };
  
  logger.section('📥 FETCH MOVIE METADATA FROM TMDB');
  logger.info(`Limit: ${config.limit} movies`);
  logger.info(`Dry run: ${config.dryRun ? 'YES' : 'NO'}`);
  logger.info('');
  
  try {
    // Get movies to fetch
    const movies = await getMoviesToFetch(config);
    
    if (movies.length === 0) {
      logger.info('✓ No movies need metadata fetching');
      return { success: true, stats: { processed: 0, success: 0, failed: 0 } };
    }
    
    logger.info(`Found ${movies.length} movies needing metadata\n`);
    
    // Stats
    const stats = {
      total: movies.length,
      success: 0,
      failed: 0,
      notFound: 0,
      rateLimit: 0,
      updated: 0
    };
    
    // Batch updates buffer
    const batchUpdates = [];
    
    // Process each movie
    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];
      
      // Progress logging
      if (i > 0 && i % 50 === 0) {
        logger.info(`Progress: ${i}/${movies.length} (${stats.success} success, ${stats.failed} failed)`);
        
        // Flush batch updates
        if (batchUpdates.length > 0 && !config.dryRun) {
          await batchUpdateMovies(batchUpdates);
          batchUpdates.length = 0;
        }
      }
      
      try {
        logger.debug(`${i + 1}/${movies.length} Fetching: ${movie.title || `TMDB ${movie.tmdb_id}`}`);
        
        if (config.dryRun) {
          stats.success++;
          continue;
        }
        
        // Fetch movie details with retry
        const result = await fetchMovieWithRetry(movie.tmdb_id);
        
        if (result.success) {
          // Transform and prepare update
          const updateData = transformMovieData(result.data);
          updateData.id = movie.id;
          
          batchUpdates.push(updateData);
          stats.success++;
          
          logger.success(`  ✓ ${result.data.title} (${result.data.release_date?.substring(0, 4) || 'N/A'})`);
          
        } else {
          // Handle error
          await updateMovieError(movie.id, result);
          stats.failed++;
          
          if (result.errorType === 'tmdb_not_found') {
            stats.notFound++;
            logger.warn(`  ⚠️ Not found: TMDB ID ${movie.tmdb_id}`);
          } else if (result.errorType === 'tmdb_rate_limit') {
            stats.rateLimit++;
            logger.error(`  ✗ Rate limited: TMDB ID ${movie.tmdb_id}`);
          } else {
            logger.error(`  ✗ Error: ${result.error}`);
          }
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, CONFIG.RATE_LIMIT_DELAY_MS));
        
      } catch (error) {
        logger.error(`  ✗ Unexpected error for movie ${movie.id}: ${error.message}`);
        stats.failed++;
      }
    }
    
    // Flush remaining batch updates
    if (batchUpdates.length > 0 && !config.dryRun) {
      logger.info('\nFlushing final batch updates...');
      const result = await batchUpdateMovies(batchUpdates);
      if (result.success) {
        stats.updated += result.count;
        logger.success(`✓ Updated ${result.count} movies`);
      }
    } else {
      stats.updated = stats.success;
    }
    
    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logger.section('📊 SUMMARY');
    logger.info(`Total movies: ${stats.total}`);
    logger.success(`✓ Successfully fetched: ${stats.success}`);
    
    if (stats.failed > 0) {
      logger.error(`✗ Failed: ${stats.failed}`);
      if (stats.notFound > 0) {
        logger.warn(`  - Not found: ${stats.notFound}`);
      }
      if (stats.rateLimit > 0) {
        logger.warn(`  - Rate limited: ${stats.rateLimit}`);
      }
    }
    
    logger.info(`TMDB API calls: ${tmdbClient.getRequestCount()}`);
    logger.info(`Duration: ${duration}s`);
    logger.info(`Average: ${(stats.success / (duration / 60)).toFixed(1)} movies/minute`);
    
    if (stats.success > 0) {
      logger.success('\n✅ Metadata fetch complete! Run step 03 to fetch genres/keywords.');
    } else {
      logger.warn('\n⚠️ No movies were successfully fetched');
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
    staleMetadata: args.includes('--stale-metadata'),
    force: args.includes('--force'),
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
│ Step 02: Fetch Movie Metadata from TMDB                        │
└─────────────────────────────────────────────────────────────────┘

USAGE:
  node scripts/pipeline/02-fetch-movie-metadata.js [options]

OPTIONS:
  --limit=N          Process max N movies (default: ${CONFIG.DEFAULT_LIMIT})
  --stale-metadata   Update movies with old metadata (30+ days)
  --force            Force update even if metadata exists
  --dry-run          Simulate without making changes
  --help, -h         Show this help message

EXAMPLES:
  # Fetch metadata for 500 new movies
  node scripts/pipeline/02-fetch-movie-metadata.js --limit=500
  
  # Refresh stale metadata
  node scripts/pipeline/02-fetch-movie-metadata.js --stale-metadata --limit=200
  
  # Force update all movies
  node scripts/pipeline/02-fetch-movie-metadata.js --force --limit=100
  
  # Dry run
  node scripts/pipeline/02-fetch-movie-metadata.js --dry-run
`);
    process.exit(0);
  }
  
  // Execute
  fetchMovieMetadata(options)
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

module.exports = fetchMovieMetadata;
