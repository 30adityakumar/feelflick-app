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
 *   Delay: 1 second between requests
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
  OMDB_API_URL: 'http://www.omdbapi.com/',
  RATE_LIMIT_DELAY_MS: 1000,  // 1 request per second
  REQUEST_TIMEOUT_MS: 10000,  // 10 second timeout
  MAX_RETRIES: 2
};

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
      return { 
        success: false, 
        error: response.data.Error,
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
      
      // Still insert a record to mark as attempted (prevent re-fetching)
      await supabase
        .from('ratings_external')
        .insert({
          movie_id: movie.id,
          fetched_at: new Date().toISOString(),
          fetch_error: result.error
        });
      
      return { success: true, skipped: true };
    }
    
    // Parse ratings
    const ratings = parseOMDbRatings(result.data);
    
    // Insert into ratings_external
    const { error } = await supabase
      .from('ratings_external')
      .insert({
        movie_id: movie.id,
        ...ratings,
        fetched_at: new Date().toISOString()
      });
    
    if (error) {
      throw new Error(`Failed to insert ratings: ${error.message}`);
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
    // ✅ OPTIMIZED QUERY: Use LEFT JOIN instead of fetching all ratings
    // ✅ CORRECT (FIX):
    // First, get movies without ratings using a subquery approach
    const { data: existingRatings } = await supabase
      .from('ratings_external')
      .select('movie_id');

    const existingMovieIds = new Set(existingRatings?.map(r => r.movie_id) || []);

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
    const movies = allMovies
      .filter(m => !existingMovieIds.has(m.id))
      .slice(0, config.limit);

    
    if (error) {
      throw new Error(`Failed to fetch movies: ${error.message}`);
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
      with_imdb: 0,
      with_rt: 0,
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
        } else {
          stats.success++;
          
          if (result.ratings) {
            if (result.ratings.imdb_rating) stats.with_imdb++;
            if (result.ratings.rt_rating) stats.with_rt++;
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
      logger.warn(`⊘ Skipped (not found): ${stats.skipped}`);
    }
    
    if (stats.failed > 0) {
      logger.error(`✗ Failed: ${stats.failed}`);
    }
    
    logger.info(`\nRatings Coverage:`);
    logger.info(`  IMDb ratings: ${stats.with_imdb} (${(stats.with_imdb / stats.success * 100).toFixed(1)}%)`);
    logger.info(`  Rotten Tomatoes: ${stats.with_rt} (${(stats.with_rt / stats.success * 100).toFixed(1)}%)`);
    logger.info(`  Metacritic: ${stats.with_metacritic} (${(stats.with_metacritic / stats.success * 100).toFixed(1)}%)`);
    
    logger.info(`\nDuration: ${duration}s`);
    logger.info(`Average: ${(stats.success / (duration / 60)).toFixed(1)} movies/minute`);
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
  --limit=N     Process max N movies (default: ${CONFIG.DEFAULT_LIMIT})
  --dry-run     Simulate without making changes
  --help, -h    Show this help message

RATE LIMITS:
  OMDb Free Tier: 1,000 requests/day
  Script enforces: 1 request/second

EXAMPLES:
  # Fetch ratings for 100 movies
  node scripts/pipeline/06-fetch-external-ratings.js
  
  # Fetch for 50 movies
  node scripts/pipeline/06-fetch-external-ratings.js --limit=50
  
  # Dry run
  node scripts/pipeline/06-fetch-external-ratings.js --dry-run

NOTE:
  Requires OMDB_API_KEY in .env file
  Get your key at: http://www.omdbapi.com/apikey.aspx
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
