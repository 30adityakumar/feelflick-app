require('dotenv').config();
const { supabase } = require('../utils/supabase');
const Logger = require('../utils/logger');
const axios = require('axios');

const logger = new Logger('06-fetch-external-ratings.log');
const OMDB_API_KEY = process.env.OMDB_API_KEY;
const OMDB_API_URL = 'http://www.omdbapi.com/';

async function main() {
  logger.info('');
  logger.info('FETCH EXTERNAL RATINGS (OMDb)');
  logger.info('='.repeat(70));
  logger.info('Started at:', new Date().toISOString());
  
  if (!OMDB_API_KEY) {
    logger.error('OMDB_API_KEY not set in environment');
    process.exit(1);
  }
  
  try {
    // Get movies with IMDb ID but no external ratings
    // First, get all movies with imdb_id
    const { data: allMovies, error: moviesError } = await supabase
      .from('movies')
      .select('id, tmdb_id, title, imdb_id')
      .not('imdb_id', 'is', null)
      .order('vote_count', { ascending: false })
      .limit(500);
    
    if (moviesError) throw moviesError;
    
    // Check which ones already have external ratings
    const { data: existingRatings, error: ratingsError } = await supabase
      .from('ratings_external')
      .select('movie_id');
    
    if (ratingsError) throw ratingsError;
    
    const ratedIds = new Set(existingRatings.map(r => r.movie_id));
    const moviesNeeding = allMovies.filter(m => !ratedIds.has(m.id)).slice(0, 100);
    
    logger.info(`Found ${moviesNeeding.length} movies needing external ratings`);
    
    let processed = 0;
    let failed = 0;
    
    for (const movie of moviesNeeding) {
      try {
        logger.info(`${processed + 1}/${moviesNeeding.length} Fetching ratings for "${movie.title}"`);
        
        // Call OMDb API
        const response = await axios.get(OMDB_API_URL, {
          params: {
            apikey: OMDB_API_KEY,
            i: movie.imdb_id,
            plot: 'short'
          },
          timeout: 10000
        });
        
        if (response.data.Response === 'False') {
          logger.warn(`OMDb: ${response.data.Error} for ${movie.title}`);
          failed++;
          
          // Still insert a record to mark as attempted
          await supabase.from('ratings_external').insert({
            movie_id: movie.id,
            imdb_id: movie.imdb_id,
            fetched_at: new Date().toISOString()
          });
          
          continue;
        }
        
        const data = response.data;
        
        // Parse ratings
        const imdbRating = parseFloat(data.imdbRating) || null;
        const imdbVotes = parseInt(data.imdbVotes?.replace(/,/g, '')) || null;
        
        const rtRating = data.Ratings?.find(r => r.Source === 'Rotten Tomatoes')?.Value || null;
        const metacriticScore = data.Ratings?.find(r => r.Source === 'Metacritic')?.Value
          ? parseInt(data.Ratings.find(r => r.Source === 'Metacritic').Value) 
          : null;
        
        // Insert into ratings_external
        await supabase
          .from('ratings_external')
          .insert({
            movie_id: movie.id,
            imdb_id: movie.imdb_id,
            imdb_rating: imdbRating,
            imdb_votes: imdbVotes,
            rt_rating: rtRating,
            metacritic_score: metacriticScore,
            fetched_at: new Date().toISOString()
          });
        
        processed++;
        logger.success(`${processed}/${moviesNeeding.length} Fetched ratings for "${movie.title}"`);
        
        // Rate limit: 1 request per second (OMDb free tier)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (err) {
        logger.error(`Failed to fetch ratings for ${movie.title}:`, err.message);
        failed++;
      }
    }
    
    logger.info('');
    logger.info('SUMMARY');
    logger.info('='.repeat(70));
    logger.info('Movies processed:', processed);
    logger.info('Failed:', failed);
    logger.success('External ratings fetch complete!');
    
  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
