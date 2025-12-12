// scripts/pipeline/03-fetch-genres-keywords.js

const Logger = require('../utils/logger');
const tmdbClient = require('../utils/tmdb-client');
const { supabase } = require('../utils/supabase');

const logger = new Logger('03-fetch-genres-keywords.log');

/**
 * Ensure genres table is populated with TMDB genres
 */
async function syncGenres() {
  logger.info('📚 Syncing genres from TMDB...');

  try {
    // Fetch genre list from TMDB
    const genreData = await tmdbClient.request('/genre/movie/list');
    const tmdbGenres = genreData.genres;

    logger.info(`   Found ${tmdbGenres.length} genres from TMDB`);

    // Upsert into genres table
    const { error } = await supabase
      .from('genres')
      .upsert(tmdbGenres, { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to sync genres: ${error.message}`);
    }

    logger.success(`   ✅ Synced ${tmdbGenres.length} genres`);
    return tmdbGenres;

  } catch (error) {
    logger.error(`   ❌ Failed to sync genres: ${error.message}`);
    throw error;
  }
}

/**
 * Process genres for movies
 */
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
      logger.warn(`   ⚠️  Failed to parse genres for movie ${movie.id}: ${error.message}`);
      stats.errors++;
    }
  }

  // Insert genre links in batches
  if (genreLinks.length > 0) {
    logger.info(`   Inserting ${genreLinks.length} genre links...`);

    const batchSize = 1000;
    for (let i = 0; i < genreLinks.length; i += batchSize) {
      const batch = genreLinks.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('movie_genres')
        .upsert(batch, { onConflict: 'movie_id,genre_id', ignoreDuplicates: true });

      if (error) {
        logger.error(`   ❌ Failed to insert genre batch: ${error.message}`);
        stats.errors++;
      } else {
        stats.genres_inserted += batch.length;
      }
    }
  }

  logger.success(`   ✅ Processed ${stats.movies_processed} movies, inserted ${stats.genres_inserted} genre links`);
  return stats;
}

/**
 * Process keywords for movies
 */
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
      logger.warn(`   ⚠️  Failed to parse keywords for movie ${movie.id}: ${error.message}`);
      stats.errors++;
    }
  }

  stats.unique_keywords = allKeywords.size;
  logger.info(`   Found ${stats.unique_keywords} unique keywords`);

  // Since we don't have keyword IDs from TMDB anymore, we need to handle this differently
  // We'll use the keyword name as a hash to generate consistent IDs
  const keywordsToUpsert = Array.from(allKeywords.values()).map(name => ({
    id: simpleHash(name), // Generate consistent ID from name
    name: name
  }));

  // Upsert keywords
  if (keywordsToUpsert.length > 0) {
    const batchSize = 1000;
    for (let i = 0; i < keywordsToUpsert.length; i += batchSize) {
      const batch = keywordsToUpsert.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('keywords')
        .upsert(batch, { onConflict: 'id', ignoreDuplicates: true });

      if (error) {
        logger.error(`   ❌ Failed to insert keyword batch: ${error.message}`);
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
    logger.info(`   Inserting ${keywordLinks.length} keyword links...`);

    const batchSize = 1000;
    for (let i = 0; i < keywordLinks.length; i += batchSize) {
      const batch = keywordLinks.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('movie_keywords')
        .upsert(batch, { onConflict: 'movie_id,keyword_id', ignoreDuplicates: true });

      if (error) {
        logger.error(`   ❌ Failed to insert keyword link batch: ${error.message}`);
        stats.errors++;
      } else {
        stats.keyword_links_inserted += batch.length;
      }
    }
  }

  logger.success(`   ✅ Processed ${stats.movies_processed} movies`);
  logger.success(`   ✅ Inserted ${stats.keywords_inserted} keywords, ${stats.keyword_links_inserted} links`);
  return stats;
}

/**
 * Simple hash function for generating keyword IDs
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Main function
 */
async function fetchGenresKeywords(options = {}) {
  const { limit = 1000, dryRun = false } = options;

  logger.section('🎭 PROCESS GENRES & KEYWORDS');
  logger.info(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  logger.info(`Limit: ${limit} movies`);

  const totalStats = {
    genres: null,
    keywords: null,
    success: true
  };

  // Sync genre master list
  if (!dryRun) {
    await syncGenres();
  }

  // Get movies that have metadata but haven't been processed
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title, genres, keywords')
    .not('genres', 'is', null)
    .eq('is_valid', true)
    .limit(limit);

  if (error) {
    logger.error('Failed to fetch movies:', { error: error.message });
    return { success: false, stats: totalStats };
  }

  logger.info(`📊 Found ${movies.length} movies to process`);

  if (movies.length === 0) {
    logger.warn('⚠️  No movies found to process');
    return { success: true, stats: totalStats };
  }

  if (!dryRun) {
    // Process genres
    totalStats.genres = await processGenres(movies);

    // Process keywords
    totalStats.keywords = await processKeywords(movies);
  } else {
    logger.warn('🚫 DRY RUN: Skipping genre/keyword processing');
  }

  // Summary
  logger.section('📊 PROCESSING SUMMARY');
  if (totalStats.genres) {
    logger.info(`Genres: ${totalStats.genres.genres_inserted} links created`);
  }
  if (totalStats.keywords) {
    logger.info(`Keywords: ${totalStats.keywords.unique_keywords} unique, ${totalStats.keywords.keyword_links_inserted} links created`);
  }

  logger.success('\n✅ Genre/keyword processing complete! Run step 04 to fetch cast/crew.');

  return {
    success: true,
    stats: totalStats
  };
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 1000;

  fetchGenresKeywords({ limit, dryRun })
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      logger.error('Fatal error:', { error: error.message });
      process.exit(1);
    });
}

module.exports = fetchGenresKeywords;
