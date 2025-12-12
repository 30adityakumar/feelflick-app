require('dotenv').config();
const { supabase } = require('../utils/supabase');

async function checkMovie(movieId) {
  console.log(`\n🎬 CHECKING MOVIE ID: ${movieId}\n`);
  
  // Get movie data
  const { data: movie } = await supabase
    .from('movies')
    .select('*')
    .eq('id', movieId)
    .single();
  
  if (!movie) {
    console.log('❌ Movie not found');
    return;
  }
  
  console.log(`Title: ${movie.title}`);
  console.log(`TMDB ID: ${movie.tmdb_id}`);
  console.log(`Status: ${movie.status}`);
  console.log(`Overall Score: ${movie.overall_score}`);
  
  // Check genres
  const { count: genreCount } = await supabase
    .from('movie_genres')
    .select('*', { count: 'exact', head: true })
    .eq('movie_id', movieId);
  
  console.log(`\nGenres: ${genreCount}`);
  
  // Check cast
  const { count: castCount } = await supabase
    .from('movie_people')
    .select('*', { count: 'exact', head: true })
    .eq('movie_id', movieId);
  
  console.log(`Cast/Crew: ${castCount}`);
  
  // Check keywords
  const { count: keywordCount } = await supabase
    .from('movie_keywords')
    .select('*', { count: 'exact', head: true })
    .eq('movie_id', movieId);
  
  console.log(`Keywords: ${keywordCount}`);
  
  // Check external ratings
  const { data: ratings } = await supabase
    .from('ratings_external')
    .select('*')
    .eq('movie_id', movieId)
    .single();
  
  if (ratings) {
    console.log(`\nExternal Ratings:`);
    console.log(`  IMDB: ${ratings.imdb_rating} (${ratings.imdb_votes} votes)`);
    console.log(`  Rotten Tomatoes: ${ratings.rotten_tomatoes_rating}`);
    console.log(`  Metacritic: ${ratings.metacritic_rating}`);
  }
  
  // Check mood scores
  const { count: moodCount } = await supabase
    .from('movie_mood_scores')
    .select('*', { count: 'exact', head: true })
    .eq('movie_id', movieId);
  
  console.log(`\nMood Scores: ${moodCount}`);
  
  console.log(`Embedding: ${movie.embedding ? '✅ Yes' : '❌ No'}`);
}

// Get movie ID from command line or use default
const movieId = process.argv[2] || 1;
checkMovie(movieId);
