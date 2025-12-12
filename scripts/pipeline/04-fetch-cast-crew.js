// scripts/pipeline/04-fetch-cast-crew.js

const Logger = require('../utils/logger');
const tmdbClient = require('../utils/tmdb-client');
const { 
  supabase, 
  getMoviesNeedingUpdate, 
  updateMovie,
  addToRetryQueue 
} = require('../utils/supabase');

const logger = new Logger('04-fetch-cast-crew.log');

// Important crew jobs to store
const IMPORTANT_CREW_JOBS = new Set([
  'Director',
  'Writer',
  'Screenplay',
  'Story',
  'Executive Producer',
  'Producer',
  'Director of Photography',
  'Original Music Composer',
  'Composer'
]);

/**
 * Process a single movie's cast and crew
 */
async function processCastCrew(movie) {
  try {
    logger.info(`Processing cast/crew for: ${movie.title} (tmdb_id: ${movie.tmdb_id})`);

    // Fetch movie with credits
    const tmdbData = await tmdbClient.getMovie(movie.tmdb_id, 'credits');
    
    if (!tmdbData.credits) {
      throw new Error('No credits data returned from TMDB');
    }

    const { cast = [], crew = [] } = tmdbData.credits;

    // Track people and relationships
    const peopleToUpsert = [];
    const moviePeopleToUpsert = [];

    // Process cast (actors)
    for (const member of cast) {
      if (!member.id) continue;

      // Add person
      peopleToUpsert.push({
        id: member.id,
        name: member.name,
        profile_path: member.profile_path,
        known_for_department: member.known_for_department || 'Acting',
        gender: member.gender,
        popularity: member.popularity || 0,
        json_data: {
          original_name: member.original_name,
          cast_id: member.cast_id,
          credit_id: member.credit_id
        }
      });

      // Add movie-person relationship
      moviePeopleToUpsert.push({
        movie_id: movie.id,
        person_id: member.id,
        job: 'Actor',
        character: member.character,
        department: 'Acting',
        billing_order: member.order
      });
    }

    // Process crew (important roles only)
    for (const member of crew) {
      if (!member.id || !member.job) continue;
      
      // Only store important crew jobs
      if (!IMPORTANT_CREW_JOBS.has(member.job)) continue;

      // Add person (if not already added from cast)
      if (!peopleToUpsert.find(p => p.id === member.id)) {
        peopleToUpsert.push({
          id: member.id,
          name: member.name,
          profile_path: member.profile_path,
          known_for_department: member.known_for_department || member.department,
          gender: member.gender,
          popularity: member.popularity || 0,
          json_data: {
            original_name: member.original_name,
            credit_id: member.credit_id
          }
        });
      }

      // Add movie-person relationship
      moviePeopleToUpsert.push({
        movie_id: movie.id,
        person_id: member.id,
        job: member.job,
        character: null,
        department: member.department,
        billing_order: null
      });
    }

    // Upsert people to database
    const uniquePeople = Array.from(
      new Map(allPeople.map(p => [p.tmdb_id, p])).values()
    );

    const { error: peopleError } = await supabase
      .from('people')
      .upsert(uniquePeople, { onConflict: 'tmdb_id' });

    // Upsert movie-people relationships
    if (moviePeopleToUpsert.length > 0) {
      // First, delete existing relationships for this movie
      await supabase
        .from('movie_people')
        .delete()
        .eq('movie_id', movie.id);

      // Insert new relationships
      const { error: relationError } = await supabase
        .from('movie_people')
        .insert(moviePeopleToUpsert);

      if (relationError) {
        throw new Error(`Failed to insert movie_people: ${relationError.message}`);
      }
    }

    // Update movie flags
    await updateMovie(movie.id, {
      has_credits: true,
      cast_count: cast.length,
      crew_count: crew.filter(c => IMPORTANT_CREW_JOBS.has(c.job)).length,
      // Store lead actor info in movies table for quick access
      lead_actor_name: cast[0]?.name || null,
      lead_actor_popularity: cast[0]?.popularity || null,
      lead_actor_character: cast[0]?.character || null,
      // Store director info
      director_name: crew.find(c => c.job === 'Director')?.name || null,
      director_popularity: crew.find(c => c.job === 'Director')?.popularity || null,
      director_count: crew.filter(c => c.job === 'Director').length,
      co_directors: crew
        .filter(c => c.job === 'Director')
        .slice(1)
        .map(c => c.name)
        .join(', ') || null,
      updated_at: new Date().toISOString()
    });

    logger.success(`✓ Processed ${cast.length} cast, ${moviePeopleToUpsert.filter(mp => mp.department !== 'Acting').length} crew for: ${movie.title}`);

    return {
      success: true,
      cast_count: cast.length,
      crew_count: moviePeopleToUpsert.filter(mp => mp.department !== 'Acting').length
    };

  } catch (error) {
    logger.error(`✗ Failed to process cast/crew for ${movie.title}:`, { error: error.message });

    // Add to retry queue
    await addToRetryQueue(movie.tmdb_id, 'fetch_cast_crew', error);

    // Update movie with error
    await updateMovie(movie.id, {
      last_error: error.message,
      last_error_at: new Date().toISOString(),
      error_type: error.message.includes('TMDB') ? 'tmdb_api_error' : 'unknown',
      retry_count: (movie.retry_count || 0) + 1
    });

    return { success: false, error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now();
  
  logger.section('🎬 FETCH CAST & CREW DATA');
  logger.info('Started at: ' + new Date().toISOString());

  try {
    // Get movies that need cast/crew data
    const movies = await getMoviesNeedingUpdate('no_credits', 1000);
    
    if (movies.length === 0) {
      logger.info('✓ No movies need cast/crew updates');
      return;
    }

    logger.info(`Found ${movies.length} movies needing cast/crew data`);

    // Process movies
    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];
      
      if (i > 0 && i % 50 === 0) {
        logger.info(`Progress: ${i}/${movies.length} (${successCount} success, ${failCount} failed)`);
      }

      const result = await processCastCrew(movie);
      
      if (result.success) {
        successCount++;
      } else {
        failCount++;
        errors.push({
          tmdb_id: movie.tmdb_id,
          title: movie.title,
          error: result.error
        });
      }
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logger.section('📊 SUMMARY');
    logger.info(`Total movies processed: ${movies.length}`);
    logger.success(`✓ Successful: ${successCount}`);
    if (failCount > 0) {
      logger.error(`✗ Failed: ${failCount}`);
    }
    logger.info(`Duration: ${duration}s`);
    logger.info(`TMDB API calls: ${tmdbClient.getRequestCount()}`);

    if (errors.length > 0 && errors.length <= 10) {
      logger.warn('\nFailed movies:');
      errors.forEach(e => {
        logger.warn(`  - ${e.title} (${e.tmdb_id}): ${e.error}`);
      });
    }

    logger.success('\n✅ Cast/crew fetch complete!');
    logger.info(`Log file: ${logger.getLogFilePath()}`);

  } catch (error) {
    logger.error('Fatal error:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { processCastCrew };
