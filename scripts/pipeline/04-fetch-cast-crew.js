// scripts/pipeline/04-fetch-cast-crew.js

/**
 * ============================================================================
 * STEP 04: FETCH CAST & CREW FROM TMDB
 * ============================================================================
 * 
 * Purpose:
 *   Fetch cast and crew data from TMDB and populate people/movie_people tables
 *   
 * Input:
 *   - Movies with has_credits=false and fetched_at IS NOT NULL
 *   
 * Output:
 *   - people table populated with actors/directors
 *   - movie_people table populated with relationships
 *   - Movies updated with has_credits=true, cast_count, crew_count
 *   
 * Options:
 *   --limit=N     Process max N movies (default: 200)
 *   --dry-run     Simulate without making changes
 * 
 * Schema:
 *   people (id, name, popularity)
 *   movie_people (movie_id, person_id, job, character, billing_order, department)
 * 
 * ============================================================================
 */

require('dotenv').config();

const Logger = require('../utils/logger');
const tmdbClient = require('../utils/tmdb-client');
const { supabase } = require('../utils/supabase');

const logger = new Logger('04-fetch-cast-crew.log');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  DEFAULT_LIMIT: 200,
  MAX_CAST_MEMBERS: 15,      // Top 15 cast members
  MAX_CREW_MEMBERS: 20,      // Top 20 crew members (includes directors, writers, etc.)
  RATE_LIMIT_DELAY_MS: 250,
  BATCH_SIZE: 50             // Process in batches for progress tracking
};

// ============================================================================
// ADD MISSING METHOD TO TMDB CLIENT
// ============================================================================

/**
 * IMPORTANT: Add this method to your scripts/utils/tmdb-client.js:
 * 
 * async getMovieCredits(movieId) {
 *   return this.request(`/movie/${movieId}/credits`);
 * }
 */

// ============================================================================
// PROCESS CAST & CREW FOR ONE MOVIE
// ============================================================================

async function processCastCrew(movie, dryRun = false) {
  try {
    logger.debug(`  Processing: ${movie.title} (TMDB ${movie.tmdb_id})`);

    if (dryRun) {
      return { success: true, castCount: 10, crewCount: 15, peopleCount: 20 };
    }

    // Read credits from the movie row (populated by step 02)
    const credits = movie.credits_raw;

    if (!credits || (!credits.cast && !credits.crew)) {
      logger.warn(`  ⚠️ No credits found for ${movie.title}`);

      // Mark as processed even if empty (avoid re-processing)
      await supabase
        .from('movies')
        .update({
          has_credits: true,
          cast_count: 0,
          crew_count: 0,
          credits_raw: null,
          status: 'incomplete',
          updated_at: new Date().toISOString()
        })
        .eq('id', movie.id);

      return { success: true, castCount: 0, crewCount: 0, peopleCount: 0 };
    }

    // Process cast (top N)
    const cast = (credits.cast || []).slice(0, CONFIG.MAX_CAST_MEMBERS);

    // Process crew (find director and top crew)
    const crew = credits.crew || [];
    const allDirectors = crew
      .filter(c => c.job === 'Director')
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    const director = allDirectors[0] || null;
    const coDirectors = allDirectors.slice(1, 3);

    const writer = crew
      .filter(c => c.job === 'Writer' || c.job === 'Screenplay')
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))[0] || null;

    const cinematographer = crew
      .filter(c => c.job === 'Director of Photography' || c.job === 'Cinematographer')
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))[0] || null;

    const otherCrew = crew
      .filter(c => ['Producer', 'Writer', 'Screenplay', 'Director of Photography', 'Original Music Composer', 'Editor'].includes(c.job))
      .slice(0, CONFIG.MAX_CREW_MEMBERS);

    // Combine all people (cast + crew)
    const allPeople = new Map();

    // Add cast
    cast.forEach(person => {
      if (person.id && person.name) {
        allPeople.set(person.id, {
          id: person.id,
          name: person.name,
          popularity: person.popularity || 0,
          profile_path: person.profile_path || null
        });
      }
    });

    // Add crew (directors, writer, cinematographer, other)
    const crewToAdd = [
      ...(director ? [director] : []),
      ...coDirectors,
      ...(writer ? [writer] : []),
      ...(cinematographer ? [cinematographer] : []),
      ...otherCrew
    ];
    crewToAdd.forEach(person => {
      if (person.id && person.name) {
        allPeople.set(person.id, {
          id: person.id,
          name: person.name,
          popularity: person.popularity || 0,
          profile_path: person.profile_path || null
        });
      }
    });

    // 1. UPSERT PEOPLE (with conflict resolution)
    if (allPeople.size > 0) {
      const peopleArray = Array.from(allPeople.values());

      const { error: peopleError } = await supabase
        .from('people')
        .upsert(peopleArray, {
          onConflict: 'id',
          ignoreDuplicates: false  // Update popularity if changed
        });

      if (peopleError) {
        throw new Error(`Failed to upsert people: ${peopleError.message}`);
      }
    }

    // 2. CREATE MOVIE-PEOPLE RELATIONSHIPS
    const moviePeopleLinks = [];

    // Add cast relationships
    cast.forEach((person, index) => {
      if (person.id) {
        moviePeopleLinks.push({
          movie_id: movie.id,
          person_id: person.id,
          job: 'Acting',
          character: person.character || null,
          billing_order: index,
          department: 'Acting'
        });
      }
    });

    // Add director relationships
    if (director) {
      moviePeopleLinks.push({
        movie_id: movie.id,
        person_id: director.id,
        job: 'Director',
        character: null,
        billing_order: null,
        department: 'Directing'
      });
    }

    coDirectors.forEach(person => {
      if (person.id) {
        moviePeopleLinks.push({
          movie_id: movie.id,
          person_id: person.id,
          job: 'Director',
          character: null,
          billing_order: null,
          department: 'Directing'
        });
      }
    });

    // Add writer relationship
    if (writer) {
      moviePeopleLinks.push({
        movie_id: movie.id,
        person_id: writer.id,
        job: 'Writer',
        character: null,
        billing_order: null,
        department: 'Writing'
      });
    }

    // Add other crew relationships
    otherCrew.forEach(person => {
      if (person.id) {
        moviePeopleLinks.push({
          movie_id: movie.id,
          person_id: person.id,
          job: person.job,
          character: null,
          billing_order: null,
          department: person.department || 'Crew'
        });
      }
    });

    // Deduplicate links — same person can appear in both explicit roles and otherCrew
    const linkMap = new Map();
    for (const link of moviePeopleLinks) {
      const key = `${link.movie_id}:${link.person_id}:${link.job}`;
      // WHY: first entry wins (explicit writer/director added before otherCrew)
      if (!linkMap.has(key)) {
        linkMap.set(key, link);
      }
    }
    const dedupedLinks = Array.from(linkMap.values());

    // Insert relationships (ignoreDuplicates: false to refresh on re-runs)
    if (dedupedLinks.length > 0) {
      const { error: linksError } = await supabase
        .from('movie_people')
        .upsert(dedupedLinks, {
          onConflict: 'movie_id,person_id,job',
          ignoreDuplicates: false
        });

      if (linksError) {
        throw new Error(`Failed to insert movie_people links: ${linksError.message}`);
      }
    }

    // 3. UPDATE MOVIE RECORD
    const updateData = {
      cast_count: cast.length,
      crew_count: crew.length,
      director_count: coDirectors.length + (director ? 1 : 0),
      has_credits: true,
      credits_raw: null, // Reclaim storage
      updated_at: new Date().toISOString()
    };

    // Add lead actor info
    if (cast.length > 0) {
      updateData.lead_actor_name = cast[0].name;
      updateData.lead_actor_popularity = cast[0].popularity || 0;
      updateData.lead_actor_character = cast[0].character || null;
    }

    // Add director info
    if (director) {
      updateData.director_name = director.name;
      updateData.director_popularity = director.popularity || 0;
    }

    // Add co-directors
    if (coDirectors.length > 0) {
      updateData.co_directors = coDirectors.map(d => d.name).join(', ');
    }

    // Add writer info
    if (writer) {
      updateData.writer_name = writer.name;
      updateData.writer_popularity = writer.popularity || 0;
    }

    // Add cinematographer info
    if (cinematographer) {
      updateData.cinematographer_name = cinematographer.name;
    }

    const { error: updateError } = await supabase
      .from('movies')
      .update(updateData)
      .eq('id', movie.id);

    if (updateError) {
      throw new Error(`Failed to update movie: ${updateError.message}`);
    }

    logger.success(`  ✓ ${movie.title}: ${cast.length} cast, ${crew.length} crew, ${allPeople.size} people`);

    return {
      success: true,
      castCount: cast.length,
      crewCount: crew.length,
      peopleCount: allPeople.size
    };

  } catch (error) {
    logger.error(`  ✗ Failed for ${movie.title}: ${error.message}`);

    // Update movie with error (but don't mark has_credits=true so we retry)
    await supabase
      .from('movies')
      .update({
        last_error: error.message,
        error_type: 'credits_fetch_error',
        last_error_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', movie.id);

    return { success: false, error: error.message };
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function fetchCastCrew(options = {}) {
  const startTime = Date.now();
  
  const config = {
    limit: options.limit || CONFIG.DEFAULT_LIMIT,
    force: options.force || false,
    dryRun: options.dryRun || false
  };
  
  logger.section('🎭 FETCH CAST & CREW FROM TMDB');
  logger.info(`Limit: ${config.limit} movies`);
  logger.info(`Dry run: ${config.dryRun ? 'YES' : 'NO'}\n`);
  
  try {
    // Get movies needing cast/crew
    let movieQuery = supabase
      .from('movies')
      .select('id, tmdb_id, title, vote_count, popularity, credits_raw')
      .not('fetched_at', 'is', null)  // Must have basic metadata first
      .order('vote_count', { ascending: false })
      .order('popularity', { ascending: false })
      .limit(config.limit);

    if (config.force) {
      // Reprocess any film with fresh credits_raw, regardless of has_credits.
      // Filter on last_tmdb_sync (today) to avoid scanning the large credits_raw column.
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      movieQuery = movieQuery
        .not('credits_raw', 'is', null)
        .gte('last_tmdb_sync', today.toISOString());
      logger.info('Mode: Force reprocess (films with fresh credits_raw from today)');
    } else {
      movieQuery = movieQuery.eq('has_credits', false);
    }

    const { data: movies, error } = await movieQuery;
    
    if (error) {
      throw new Error(`Failed to fetch movies: ${error.message}`);
    }
    
    if (!movies || movies.length === 0) {
      logger.info('✓ No movies need cast/crew fetching');
      return { success: true, stats: { processed: 0, success: 0, failed: 0 } };
    }
    
    logger.info(`Found ${movies.length} movies needing cast/crew\n`);
    
    // Stats
    const stats = {
      total: movies.length,
      success: 0,
      failed: 0,
      totalCast: 0,
      totalCrew: 0,
      totalPeople: 0
    };
    
    // Process movies
    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];
      
      // Progress logging
      if (i > 0 && i % 25 === 0) {
        logger.info(`\nProgress: ${i}/${movies.length} (${stats.success} success, ${stats.failed} failed)`);
      }
      
      logger.debug(`${i + 1}/${movies.length} ${movie.title}`);
      
      const result = await processCastCrew(movie, config.dryRun);
      
      if (result.success) {
        stats.success++;
        stats.totalCast += result.castCount;
        stats.totalCrew += result.crewCount;
        stats.totalPeople += result.peopleCount;
      } else {
        stats.failed++;
      }
      
      // Rate limiting
      if (!config.dryRun) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.RATE_LIMIT_DELAY_MS));
      }
    }
    
    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logger.section('📊 SUMMARY');
    logger.info(`Total movies: ${stats.total}`);
    logger.success(`✓ Successfully processed: ${stats.success}`);
    
    if (stats.failed > 0) {
      logger.error(`✗ Failed: ${stats.failed}`);
    }
    
    logger.info(`\nCast & Crew Stats:`);
    logger.info(`  Total cast members: ${stats.totalCast}`);
    logger.info(`  Total crew members: ${stats.totalCrew}`);
    logger.info(`  Unique people added: ${stats.totalPeople}`);
    logger.info(`  Avg cast per movie: ${(stats.totalCast / stats.success).toFixed(1)}`);
    logger.info(`  Avg crew per movie: ${(stats.totalCrew / stats.success).toFixed(1)}`);
    
    logger.info(`\nTMDB API calls: ${tmdbClient.getRequestCount()}`);
    logger.info(`Duration: ${duration}s`);
    logger.info(`Average: ${(stats.success / (duration / 60)).toFixed(1)} movies/minute`);
    
    if (stats.success > 0) {
      logger.success('\n✅ Cast/crew fetch complete! Run step 05 to calculate cast metadata.');
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
│ Step 04: Fetch Cast & Crew from TMDB                           │
└─────────────────────────────────────────────────────────────────┘

USAGE:
  node scripts/pipeline/04-fetch-cast-crew.js [options]

OPTIONS:
  --limit=N     Process max N movies (default: ${CONFIG.DEFAULT_LIMIT})
  --force       Reprocess any film with credits_raw (regardless of has_credits)
  --dry-run     Simulate without making changes
  --help, -h    Show this help message

EXAMPLES:
  # Fetch cast/crew for 200 movies
  node scripts/pipeline/04-fetch-cast-crew.js
  
  # Fetch for 100 movies
  node scripts/pipeline/04-fetch-cast-crew.js --limit=100
  
  # Dry run
  node scripts/pipeline/04-fetch-cast-crew.js --dry-run

NOTE:
  This script requires tmdbClient.getMovieCredits() method.
  Add this to scripts/utils/tmdb-client.js:
  
  async getMovieCredits(movieId) {
    return this.request(\`/movie/\${movieId}/credits\`);
  }
`);
    process.exit(0);
  }
  
  // Execute
  fetchCastCrew(options)
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

module.exports = fetchCastCrew;
