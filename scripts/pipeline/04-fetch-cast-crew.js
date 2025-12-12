require('dotenv').config();
const { supabase } = require('../utils/supabase');
const tmdbClient = require('../utils/tmdb-client');
const Logger = require('../utils/logger');

const logger = new Logger('04-fetch-cast-crew.log');

async function main() {
  logger.info('');
  logger.info('FETCH CAST & CREW DATA');
  logger.info('======================================================================');
  logger.info('Started at:', new Date().toISOString());
  
  try {
    // Get movies needing cast/crew - INCREASED LIMIT
    const { data: movies, error } = await supabase
      .from('movies')
      .select('*')
      .eq('has_credits', false)
      .not('fetched_at', 'is', null)
      .order('vote_count', { ascending: false })
      .limit(200); // Increased from 100 to 200
    
    if (error) throw error;
    
    logger.info(`Found ${movies.length} movies needing cast/crew`);
    
    let processed = 0;
    let failed = 0;
    
    for (const movie of movies) {
      try {
        logger.info(`${processed + 1}/${movies.length} Fetching cast/crew for "${movie.title}"`);
        
        // Fetch from TMDB
        const credits = await tmdbClient.getMovieCredits(movie.tmdb_id);
        
        if (!credits) {
          logger.warn(`No credits found for ${movie.title}`);
          failed++;
          
          // Mark as having credits (even if empty) so we don't retry
          await supabase
            .from('movies')
            .update({ has_credits: true, cast_count: 0, crew_count: 0 })
            .eq('id', movie.id);
          
          continue;
        }
        
        // Process cast (top 15)
        const cast = credits.cast?.slice(0, 15) || [];
        const crew = credits.crew || [];
        
        // Find director
        const director = crew.find(c => c.job === 'Director');
        
        // Update movie record
        await supabase
          .from('movies')
          .update({
            cast_count: cast.length,
            crew_count: crew.length,
            lead_actor_name: cast[0]?.name || null,
            director_name: director?.name || null,
            has_credits: true
          })
          .eq('id', movie.id);
        
        // Insert cast members
        if (cast.length > 0) {
          const castInserts = cast.map((person, index) => ({
            movie_id: movie.id,
            person_name: person.name,
            character_name: person.character,
            order: index,
            popularity: person.popularity || 0
          }));
          
          await supabase.from('movie_cast').insert(castInserts);
        }
        
        // Insert crew (top 10)
        if (crew.length > 0) {
          const crewInserts = crew.slice(0, 10).map(person => ({
            movie_id: movie.id,
            person_name: person.name,
            job: person.job,
            department: person.department
          }));
          
          await supabase.from('movie_crew').insert(crewInserts);
        }
        
        processed++;
        logger.success(`${processed}/${movies.length} Processed "${movie.title}"`);
        
        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 250));
        
      } catch (err) {
        logger.error(`Failed to process ${movie.title}:`, err.message);
        failed++;
      }
    }
    
    logger.info('');
    logger.info('SUMMARY');
    logger.info('======================================================================');
    logger.info('Movies processed:', processed);
    logger.info('Failed:', failed);
    logger.success('Cast/crew fetch complete!');
    
  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
