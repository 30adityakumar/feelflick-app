// scripts/pipeline/03-fetch-genres-keywords.js

/**
 * ============================================================================
 * STEP 03: FETCH GENRES & KEYWORDS
 * ============================================================================
 * 
 * Purpose:
 *   Process genre and keyword data from movie metadata
 *   Populate genres, keywords, movie_genres, movie_keywords tables
 *   
 * Input:
 *   - Movies with status='fetching' (has metadata from step 02)
 *   
 * Output:
 *   - Genres/keywords processed
 *   - has_keywords=true
 *   - Status remains 'fetching' (ready for step 04 - cast/crew)
 *   
 * Options:
 *   --limit=N     Process max N movies (default: 1000)
 *   --dry-run     Simulate without making changes
 * 
 * ============================================================================
 */

const Logger = require('../utils/logger');
const tmdbClient = require('../utils/tmdb-client');
const { supabase } = require('../utils/supabase');

const logger = new Logger('03-fetch-genres-keywords.log');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  DEFAULT_LIMIT: 1000,
  BATCH_SIZE: 1000
};

// ============================================================================
// SIMPLE HASH FOR KEYWORD IDS
// ============================================================================

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// ============================================================================
// SYNC GENRES FROM TMDB
// ============================================================================

async function syncGenres() {
  logger.info('📚 Syncing genres from TMDB...');
  
  try {
    // Fetch genre list from TMDB
    const genreData = await tmdbClient.request('/genre/movie/list');
    const tmdbGenres = genreData.genres;
    
    logger.info(`  Found ${tmdbGenres.length} genres from TMDB`);
    
    // Upsert into genres table
    const { error } = await supabase
      .from('genres')
      .upsert(tmdbGenres, { onConflict: 'id' });
    
    if (error) {
      throw new Error(`Failed to sync genres: ${error.message}`);
    }
    
    logger.success(`  ✓ Synced ${tmdbGenres.length} genres`);
    return tmdbGenres;
    
  } catch (error) {
    logger.error(`  ✗ Failed to sync genres: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// PROCESS GENRES FOR MOVIES
// ============================================================================

async function processGenres(movies) {
  logger.info(`\n🎭 Processing genres for ${movies.length} movies...`);
  
  const stats = {
    movies_processed: 0,
    genres_inserted: 0,
    errors: 0
  };
  
  // First, ensure genres table is populated
  const genreMap = {};
  const { data: allGenres } = await supabase.from('genres').select('id, name');
  allGenres.forEach(g => {
    genreMap[g.name.toLowerCase()] = g.id;
  });
  
  // Process each movie's genres
  const genreLinks = [];
  
  for (const movie of movies) {
    try {
      if (!movie.genres) continue;
      
      const genres = typeof movie.genres === 'string' 
        ? JSON.parse(movie.genres) 
        : movie.genres;
      
      if (!Array.isArray(genres) || genres.length === 0) continue;
      
      // Set primary_genre (first genre)
      const primaryGenre = genres[0];
      await supabase
        .from('movies')
        .update({ primary_genre: primaryGenre })
        .eq('id', movie.id);
      
      for (const genreName of genres) {
        const genreId = genreMap[genreName.toLowerCase()];
        if (genreId) {
          genreLinks.push({
            movie_id: movie.id,
            genre_id: genreId
          });
        }
      }
      
      stats.movies_processed++;
      
    } catch (error) {
      logger.warn(`  ⚠️  Failed to parse genres for movie ${movie.id}: ${error.message}`);
      stats.errors++;
    }
  }
  
  // Insert genre links in batches
  if (genreLinks.length > 0) {
    logger.info(`  Inserting ${genreLinks.length} genre links...`);
    
    for (let i = 0; i < genreLinks.length; i += CONFIG.BATCH_SIZE) {
      const batch = genreLinks.slice(i, i + CONFIG.BATCH_SIZE);
      
      const { error } = await supabase
        .from('movie_genres')
        .upsert(batch, { 
          onConflict: 'movie_id,genre_id', 
          ignoreDuplicates: true 
        });
      
      if (error) {
        logger.error(`  ✗ Failed to insert genre batch: ${error.message}`);
        stats.errors++;
      } else {
        stats.genres_inserted += batch.length;
      }
    }
  }
  
  logger.success(`  ✓ Processed ${stats.movies_processed} movies, inserted ${stats.genres_inserted} genre links`);
  return stats;
}

// ============================================================================
// PROCESS KEYWORDS FOR MOVIES
// ============================================================================

async function processKeywords(movies) {
  logger.info(`\n🏷️  Processing keywords for ${movies.length} movies...`);
  
  const stats = {
    movies_processed: 0,
    unique_keywords: 0,
    keywords_inserted: 0,
    keyword_links_inserted: 0,
    errors: 0
  };
  
  const allKeywords = new Map(); // name -> { id, name }
  const keywordLinks = [];
  
  // Collect all unique keywords first
  for (const movie of movies) {
    try {
      if (!movie.keywords) continue;
      
      const keywords = typeof movie.keywords === 'string'
        ? JSON.parse(movie.keywords)
        : movie.keywords;
      
      if (!Array.isArray(keywords) || keywords.length === 0) continue;
      
      for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase();
        if (!allKeywords.has(keywordLower)) {
          allKeywords.set(keywordLower, keyword);
        }
      }
      
      stats.movies_processed++;
      
    } catch (error) {
      logger.warn(`  ⚠️  Failed to parse keywords for movie ${movie.id}: ${error.message}`);
      stats.errors++;
    }
  }
  
  stats.unique_keywords = allKeywords.size;
  logger.info(`  Found ${stats.unique_keywords} unique keywords`);
  
  // Generate consistent IDs from keyword names
  const keywordsToUpsert = Array.from(allKeywords.values()).map(name => ({
    id: simpleHash(name),
    name: name
  }));
  
  // Upsert keywords
  if (keywordsToUpsert.length > 0) {
    for (let i = 0; i < keywordsToUpsert.length; i += CONFIG.BATCH_SIZE) {
      const batch = keywordsToUpsert.slice(i, i + CONFIG.BATCH_SIZE);
      
      const { error } = await supabase
        .from('keywords')
        .upsert(batch, { 
          onConflict: 'id', 
          ignoreDuplicates: true 
        });
      
      if (error) {
        logger.error(`  ✗ Failed to insert keyword batch: ${error.message}`);
        stats.errors++;
      } else {
        stats.keywords_inserted += batch.length;
      }
    }
  }
  
  // Now create keyword-movie links
  for (const movie of movies) {
    try {
      if (!movie.keywords) continue;
      
      const keywords = typeof movie.keywords === 'string'
        ? JSON.parse(movie.keywords)
        : movie.keywords;
      
      if (!Array.isArray(keywords)) continue;
      
      for (const keyword of keywords) {
        keywordLinks.push({
          movie_id: movie.id,
          keyword_id: simpleHash(keyword)
        });
      }
      
    } catch (error) {
      // Already logged above
    }
  }
  
  // Insert keyword links
  if (keywordLinks.length > 0) {
    logger.info(`  Inserting ${keywordLinks.length} keyword links...`);
    
    for (let i = 0; i < keywordLinks.length; i += CONFIG.BATCH_SIZE) {
      const batch = keywordLinks.slice(i, i + CONFIG.BATCH_SIZE);
      
      const { error } = await supabase
        .from('movie_keywords')
        .upsert(batch, { 
          onConflict: 'movie_id,keyword_id', 
          ignoreDuplicates: true 
        });
      
      if (error) {
        logger.error(`  ✗ Failed to insert keyword link batch: ${error.message}`);
        stats.errors++;
      } else {
        stats.keyword_links_inserted += batch.length;
      }
    }
  }
  
  logger.success(`  ✓ Processed ${stats.movies_processed} movies`);
  logger.success(`  ✓ Inserted ${stats.keywords_inserted} keywords, ${stats.keyword_links_inserted} links`);
  
  return stats;
}

// ============================================================================
// UPDATE MOVIE STATUS
// ============================================================================

async function updateMoviesStatus(movieIds) {
  logger.info(`\n📝 Updating status for ${movieIds.length} movies...`);
  
  try {
    const { error } = await supabase
      .from('movies')
      .update({
        has_keywords: true,
        updated_at: new Date().toISOString()
        // Status stays 'fetching' - ready for step 04 (cast/crew)
      })
      .in('id', movieIds);
    
    if (error) throw error;
    
    logger.success(`  ✓ Updated ${movieIds.length} movies`);
    return true;
    
  } catch (error) {
    logger.error(`  ✗ Failed to update movie status: ${error.message}`);
    return false;
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function fetchGenresKeywords(options = {}) {
  const startTime = Date.now();
  
  const config = {
    limit: options.limit || CONFIG.DEFAULT_LIMIT,
    dryRun: options.dryRun || false
  };
  
  logger.section('🎭 PROCESS GENRES & KEYWORDS');
  logger.info(`Limit: ${config.limit} movies`);
  logger.info(`Dry run: ${config.dryRun ? 'YES' : 'NO'}\n`);
  
  const totalStats = {
    genres: null,
    keywords: null,
    success: true
  };
  
  try {
    // Sync genre master list
    if (!config.dryRun) {
      await syncGenres();
    }
    
    // Get movies with status='fetching' that have metadata but no keywords
    const { data: movies, error } = await supabase
      .from('movies')
      .select('id, title, genres, keywords, primary_genre')
      .eq('status', 'fetching')
      .eq('has_keywords', false)
      .not('genres', 'is', null)
      .limit(config.limit);
    
    if (error) {
      logger.error('Failed to fetch movies:', { error: error.message });
      return { success: false, stats: totalStats };
    }
    
    logger.info(`📊 Found ${movies.length} movies to process`);
    
    if (movies.length === 0) {
      logger.warn('⚠️  No movies found to process');
      return { success: true, stats: totalStats };
    }
    
    if (!config.dryRun) {
      // Process genres
      totalStats.genres = await processGenres(movies);
      
      // Process keywords
      totalStats.keywords = await processKeywords(movies);
      
      // Update movie status
      const movieIds = movies.map(m => m.id);
      await updateMoviesStatus(movieIds);
      
    } else {
      logger.warn('🚫 DRY RUN: Skipping genre/keyword processing');
    }
    
    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logger.section('📊 SUMMARY');
    logger.info(`Total movies: ${movies.length}`);
    
    if (totalStats.genres) {
      logger.info(`Genres: ${totalStats.genres.genres_inserted} links created`);
    }
    
    if (totalStats.keywords) {
      logger.info(`Keywords: ${totalStats.keywords.unique_keywords} unique, ${totalStats.keywords.keyword_links_inserted} links created`);
    }
    
    logger.info(`Duration: ${duration}s`);
    
    if (movies.length > 0) {
      logger.success('\n✅ Genre/keyword processing complete! Run step 04 to fetch cast/crew.');
    }
    
    logger.info(`\nLog file: ${logger.getLogFilePath()}`);
    
    return {
      success: true,
      stats: totalStats
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
│ Step 03: Process Genres & Keywords                             │
└─────────────────────────────────────────────────────────────────┘

USAGE:
  node scripts/pipeline/03-fetch-genres-keywords.js [options]

OPTIONS:
  --limit=N     Process max N movies (default: ${CONFIG.DEFAULT_LIMIT})
  --dry-run     Simulate without making changes
  --help, -h    Show this help message

EXAMPLES:
  # Process genres/keywords for 1000 movies
  node scripts/pipeline/03-fetch-genres-keywords.js
  
  # Process 500 movies
  node scripts/pipeline/03-fetch-genres-keywords.js --limit=500
  
  # Dry run
  node scripts/pipeline/03-fetch-genres-keywords.js --dry-run
`);
    process.exit(0);
  }
  
  // Execute
  fetchGenresKeywords(options)
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

module.exports = fetchGenresKeywords;
