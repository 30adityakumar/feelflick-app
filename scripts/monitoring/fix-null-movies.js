// scripts/monitoring/fix-null-movies.js
const { supabase } = require('../utils/supabase');
const Logger = require('../utils/logger');
const tmdbClient = require('../utils/tmdb-client');

const logger = new Logger('fix-null-movies.log');

async function findNullMovies() {
  logger.info('Finding movies with NULL data...');
  
  const { data, error } = await supabase
    .from('movies')
    .select('tmdb_id, title, release_date, popularity, vote_average, overview, poster_path, status')
    .or('title.is.null,release_date.is.null,popularity.is.null,overview.is.null');
  
  if (error) {
    logger.error('Error fetching NULL movies:', error);
    return [];
  }
  
  logger.info(`Found ${data.length} movies with NULL data`);
  return data;
}

async function refetchMovieData(tmdbId) {
  try {
    logger.info(`Refetching data for TMDB ID: ${tmdbId}`);
    
    const movieData = await tmdbClient.getMovie(tmdbId);
    
    if (!movieData || !movieData.id) {
      logger.warning(`No data found for TMDB ID ${tmdbId} - might be deleted`);
      return null;
    }
    
    logger.info(`  ✓ Found: "${movieData.title}" (${movieData.release_date})`);
    
    return {
      title: movieData.title,
      original_title: movieData.original_title,
      release_date: movieData.release_date || null,
      release_year: movieData.release_date ? parseInt(movieData.release_date.split('-')[0]) : null,
      runtime: movieData.runtime || null,
      overview: movieData.overview || null,
      tagline: movieData.tagline || null,
      poster_path: movieData.poster_path || null,
      backdrop_path: movieData.backdrop_path || null,
      popularity: movieData.popularity || 0,
      vote_average: movieData.vote_average || 0,
      vote_count: movieData.vote_count || 0,
      budget: movieData.budget || 0,
      revenue: movieData.revenue || 0,
      status: 'complete', // Mark as complete now that we have data
      original_language: movieData.original_language || 'en',
      imdb_id: movieData.imdb_id || null,
      homepage: movieData.homepage || null,
      adult: movieData.adult || false,
      last_tmdb_sync: new Date().toISOString()
    };
  } catch (error) {
    if (error.message === 'TMDB_NOT_FOUND') {
      logger.warning(`Movie ${tmdbId} not found on TMDB (404)`);
      return null;
    }
    logger.error(`Error refetching movie ${tmdbId}:`, error.message);
    return null;
  }
}

async function updateMovie(tmdbId, movieData) {
  const { error } = await supabase
    .from('movies')
    .update(movieData)
    .eq('tmdb_id', tmdbId);
  
  if (error) {
    logger.error(`Error updating movie ${tmdbId}:`, error);
    return false;
  }
  
  logger.success(`✓ Updated movie ${tmdbId}: ${movieData.title}`);
  return true;
}

async function deleteInvalidMovie(tmdbId) {
  const { error } = await supabase
    .from('movies')
    .delete()
    .eq('tmdb_id', tmdbId);
  
  if (error) {
    logger.error(`Error deleting movie ${tmdbId}:`, error);
    return false;
  }
  
  logger.warning(`✗ Deleted invalid movie ${tmdbId}`);
  return true;
}

async function fixNullMovies() {
  const startTime = Date.now();
  
  logger.section('🔧 FIX NULL MOVIES');
  
  const nullMovies = await findNullMovies();
  
  if (nullMovies.length === 0) {
    logger.success('No NULL movies found!');
    return;
  }
  
  logger.info(`\nFound ${nullMovies.length} movies with NULL data:`);
  nullMovies.forEach(m => {
    logger.info(`  - TMDB ${m.tmdb_id}: title=${m.title ? 'OK' : 'NULL'}, date=${m.release_date ? 'OK' : 'NULL'}, pop=${m.popularity ? 'OK' : 'NULL'}, status=${m.status || 'NULL'}`);
  });
  
  let fixed = 0;
  let deleted = 0;
  let failed = 0;
  
  for (const movie of nullMovies) {
    logger.info(`\nProcessing TMDB ID: ${movie.tmdb_id}`);
    
    const movieData = await refetchMovieData(movie.tmdb_id);
    
    if (movieData) {
      const success = await updateMovie(movie.tmdb_id, movieData);
      if (success) {
        fixed++;
      } else {
        failed++;
      }
    } else {
      const success = await deleteInvalidMovie(movie.tmdb_id);
      if (success) {
        deleted++;
      } else {
        failed++;
      }
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  logger.section('📊 SUMMARY');
  logger.info(`Total NULL movies processed: ${nullMovies.length}`);
  logger.success(`Fixed: ${fixed}`);
  if (deleted > 0) {
    logger.warning(`Deleted (invalid): ${deleted}`);
  }
  if (failed > 0) {
    logger.error(`Failed: ${failed}`);
  }
  logger.info(`Duration: ${duration}s`);
  logger.info(`TMDB API calls: ${tmdbClient.getRequestCount()}`);
}

// Run if called directly
if (require.main === module) {
  fixNullMovies()
    .then(() => {
      logger.success('\n✅ Done!');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { fixNullMovies, findNullMovies };
