// scripts/pipeline/02-fetch-movie-metadata.js

const Logger = require('../utils/logger');
const tmdbClient = require('../utils/tmdb-client');
const { supabase, updateMovie, addToRetryQueue } = require('../utils/supabase');

const logger = new Logger('02-fetch-movie-metadata.log');

/**
 * Parse TMDB movie response into database format
 */
function parseMovieData(tmdbData) {
  // Extract genres
  const genres = tmdbData.genres?.map(g => g.name) || [];
  const primaryGenre = genres[0] || null;

  // Extract keywords
  const keywords = tmdbData.keywords?.keywords?.map(k => k.name) || [];

  // Extract cast/crew counts
  const castCount = tmdbData.credits?.cast?.length || 0;
  const crewCount = tmdbData.credits?.crew?.length || 0;

  // Extract lead actor
  const leadActor = tmdbData.credits?.cast?.[0];
  const leadActorName = leadActor?.name || null;
  const leadActorPopularity = leadActor?.popularity || null;
  const leadActorCharacter = leadActor?.character || null;

  // Extract director
  const directors = tmdbData.credits?.crew?.filter(c => c.job === 'Director') || [];
  const directorName = directors[0]?.name || null;
  const directorPopularity = directors[0]?.popularity || null;
  const directorCount = directors.length;
  const coDirectors = directors.length > 1 
    ? directors.slice(1).map(d => d.name).join(', ') 
    : null;

  // Extract trailer
  const videos = tmdbData.videos?.results || [];
  const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  const trailerYoutubeKey = trailer?.key || null;
  const trailerName = trailer?.name || null;

  // Extract external IDs
  const externalIds = tmdbData.external_ids || {};

  // Release year
  const releaseYear = tmdbData.release_date 
    ? parseInt(tmdbData.release_date.split('-')[0]) 
    : null;

  return {
    title: tmdbData.title,
    original_title: tmdbData.original_title,
    release_date: tmdbData.release_date || null,
    release_year: releaseYear,
    overview: tmdbData.overview || null,
    poster_path: tmdbData.poster_path,
    backdrop_path: tmdbData.backdrop_path,
    runtime: tmdbData.runtime || null,
    vote_average: tmdbData.vote_average || null,
    vote_count: tmdbData.vote_count || 0,
    popularity: tmdbData.popularity || null,
    original_language: tmdbData.original_language,
    adult: tmdbData.adult || false,
    budget: tmdbData.budget || null,
    revenue: tmdbData.revenue || null,
    status: 'fetching',
    tagline: tmdbData.tagline || null,
    homepage: tmdbData.homepage || null,
    imdb_id: externalIds.imdb_id || null,
    wikidata_id: externalIds.wikidata_id || null,
    facebook_id: externalIds.facebook_id || null,
    instagram_id: externalIds.instagram_id || null,
    twitter_id: externalIds.twitter_id || null,
    
    // Genres and keywords as JSON
    genres: JSON.stringify(genres),
    primary_genre: primaryGenre,
    genre_count: genres.length,
    keywords: JSON.stringify(keywords),
    keyword_count: keywords.length,
    
    // Cast/crew metadata
    cast_count: castCount,
    crew_count: crewCount,
    lead_actor_name: leadActorName,
    lead_actor_popularity: leadActorPopularity,
    lead_actor_character: leadActorCharacter,
    director_name: directorName,
    director_popularity: directorPopularity,
    director_count: directorCount,
    co_directors: coDirectors,
    
    // Trailer
    trailer_youtube_key: trailerYoutubeKey,
    trailer_name: trailerName,
    
    // Timestamps and flags
    last_tmdb_sync: new Date().toISOString(),
    fetched_at: new Date().toISOString(),
    has_credits: castCount > 0,
    has_keywords: keywords.length > 0,
    
    // Store full JSON for reference
    json_data: JSON.stringify({
      belongs_to_collection: tmdbData.belongs_to_collection,
      production_companies: tmdbData.production_companies,
      production_countries: tmdbData.production_countries,
      spoken_languages: tmdbData.spoken_languages
    })
  };
}

/**
 * Fetch metadata for movies needing updates
 */
async function fetchMovieMetadata(options = {}) {
  const { limit = 100, dryRun = false, updateStale = false } = options;

  logger.section('📥 FETCH MOVIE METADATA FROM TMDB');
  logger.info(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  logger.info(`Limit: ${limit} movies`);
  logger.info(`Update stale: ${updateStale ? 'YES' : 'NO'}`);

  const stats = {
    movies_found: 0,
    movies_fetched: 0,
    movies_updated: 0,
    movies_failed: 0,
    errors: []
  };

  // Get movies that need metadata
  let query = supabase
    .from('movies')
    .select('id, tmdb_id, title, last_tmdb_sync')
    .eq('is_valid', true)
    .order('vote_count', { ascending: false })
    .limit(limit);

  if (updateStale) {
    // Update movies with stale metadata (>90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    query = query.lt('last_tmdb_sync', ninetyDaysAgo);
  } else {
    // Only fetch movies that have never been fetched
    query = query.or('status.eq.pending,last_tmdb_sync.is.null');
  }

  const { data: movies, error } = await query;

  if (error) {
    logger.error('Failed to fetch movies from database:', { error: error.message });
    return { success: false, stats };
  }

  stats.movies_found = movies.length;
  logger.info(`📊 Found ${movies.length} movies needing metadata`);

  if (movies.length === 0) {
    logger.warn('⚠️  No movies found. Database is up to date.');
    return { success: true, stats };
  }

  // Fetch metadata for each movie
  logger.info('\n🔄 Fetching metadata from TMDB...\n');

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    const progress = `[${i + 1}/${movies.length}]`;

    logger.info(`${progress} Fetching: ${movie.title || movie.tmdb_id}`);

    try {
      // Fetch from TMDB with all append_to_response data
      const tmdbData = await tmdbClient.getMovie(
        movie.tmdb_id,
        'credits,keywords,external_ids,videos'
      );

      stats.movies_fetched++;

      // Parse into database format
      const parsedData = parseMovieData(tmdbData);

      if (!dryRun) {
        // Update in database
        await updateMovie(movie.id, parsedData);
        stats.movies_updated++;
        
        logger.success(`${progress} ✅ Updated: ${parsedData.title}`);
      } else {
        logger.info(`${progress} [DRY RUN] Would update: ${parsedData.title}`);
      }

    } catch (error) {
      stats.movies_failed++;
      stats.errors.push({
        tmdb_id: movie.tmdb_id,
        title: movie.title,
        error: error.message
      });

      if (error.message === 'TMDB_NOT_FOUND') {
        logger.warn(`${progress} ⚠️  Not found on TMDB: ${movie.tmdb_id}`);
        
        if (!dryRun) {
          // Mark as invalid
          await updateMovie(movie.id, {
            is_valid: false,
            status: 'error',
            error_type: 'tmdb_not_found',
            last_error: 'Movie not found on TMDB',
            last_error_at: new Date().toISOString()
          });
        }
      } else if (error.message === 'TMDB_RATE_LIMIT') {
        logger.error(`${progress} ❌ Rate limit hit, stopping`);
        break;
      } else {
        logger.error(`${progress} ❌ Failed: ${error.message}`);
        
        if (!dryRun) {
          await addToRetryQueue(movie.tmdb_id, 'fetch_metadata', error, 2);
        }
      }
    }
  }

  // Summary
  logger.section('📊 METADATA FETCH SUMMARY');
  logger.info(`Movies found: ${stats.movies_found}`);
  logger.info(`Movies fetched: ${stats.movies_fetched}`);
  logger.info(`Movies updated: ${stats.movies_updated}`);
  logger.info(`Movies failed: ${stats.movies_failed}`);
  logger.info(`TMDB API calls: ${tmdbClient.getRequestCount()}`);

  if (stats.errors.length > 0 && stats.errors.length <= 10) {
    logger.warn('\n⚠️  Errors:');
    stats.errors.forEach(err => {
      logger.warn(`   ${err.tmdb_id}: ${err.error}`);
    });
  } else if (stats.errors.length > 10) {
    logger.warn(`\n⚠️  ${stats.errors.length} errors occurred (too many to display)`);
  }

  if (stats.movies_updated > 0) {
    logger.success('\n✅ Metadata fetch complete! Run step 03 to process genres/keywords.');
  }

  return {
    success: stats.movies_failed < stats.movies_fetched * 0.1, // Less than 10% failure
    stats
  };
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const updateStale = args.includes('--update-stale');
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 100;

  fetchMovieMetadata({ limit, dryRun, updateStale })
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      logger.error('Fatal error:', { error: error.message });
      process.exit(1);
    });
}

module.exports = fetchMovieMetadata;
