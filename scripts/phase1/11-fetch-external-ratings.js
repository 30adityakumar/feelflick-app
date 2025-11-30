// scripts/phase1/11-fetch-external-ratings.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OMDB_API_KEY = process.env.OMDB_API_KEY || 'YOUR_OMDB_KEY'; // Get free key from omdbapi.com

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchOMDBRatings(imdbId) {
  if (!imdbId) return null;
  
  try {
    const response = await axios.get(
      `http://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}`
    );
    
    if (response.data.Response === 'True') {
      const ratings = {};
      
      // IMDb rating
      if (response.data.imdbRating && response.data.imdbRating !== 'N/A') {
        ratings.imdb_rating = parseFloat(response.data.imdbRating);
        ratings.imdb_votes = parseInt(response.data.imdbVotes?.replace(/,/g, '') || 0);
      }
      
      // Rotten Tomatoes
      const rtRating = response.data.Ratings?.find(r => r.Source === 'Rotten Tomatoes');
      if (rtRating) {
        ratings.rt_rating = rtRating.Value;
      }
      
      // Metacritic
      if (response.data.Metascore && response.data.Metascore !== 'N/A') {
        ratings.metacritic_score = parseInt(response.data.Metascore);
      }
      
      return ratings;
    }
  } catch (error) {
    console.error(`Error fetching OMDB for ${imdbId}:`, error.message);
  }
  
  return null;
}

async function fetchExternalRatings() {
  console.log('🎯 Fetching external ratings from OMDB...\n');
  console.log('NOTE: You need an OMDB API key. Get free key at: http://www.omdbapi.com/apikey.aspx\n');

  // Get movies with IMDb IDs
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, imdb_id, title')
    .not('imdb_id', 'is', null)
    .limit(1000); // Start with 1000 for testing

  if (error) {
    console.error('❌ Error fetching movies:', error.message);
    return;
  }

  console.log(`Found ${movies.length} movies with IMDb IDs\n`);

  let fetched = 0;
  let inserted = 0;

  for (const movie of movies) {
    const ratings = await fetchOMDBRatings(movie.imdb_id);
    
    if (ratings) {
      const { error: insertError } = await supabase
        .from('ratings_external')
        .upsert({
          movie_id: movie.id,
          ...ratings,
          fetched_at: new Date().toISOString()
        }, { onConflict: 'movie_id' });

      if (insertError) {
        console.error(`❌ Error inserting ratings for ${movie.title}:`, insertError.message);
      } else {
        inserted++;
        console.log(`✅ ${movie.title} - IMDb: ${ratings.imdb_rating || 'N/A'}, RT: ${ratings.rt_rating || 'N/A'}, MC: ${ratings.metacritic_score || 'N/A'}`);
      }
    }
    
    fetched++;
    if (fetched % 10 === 0) {
      console.log(`\nProgress: ${fetched}/${movies.length}...\n`);
    }
    
    await delay(1000); // OMDB rate limit: 1 request/second on free tier
  }

  console.log(`\n✨ Complete! Fetched ${inserted} external ratings`);
}

fetchExternalRatings().catch(console.error);