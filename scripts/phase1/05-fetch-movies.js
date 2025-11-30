require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Delay helper to avoid rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchMovieDetails(tmdbId) {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching movie ${tmdbId}:`, error.message);
    return null;
  }
}

async function insertMovie(movie) {
  const movieData = {
    tmdb_id: movie.id,
    title: movie.title,
    original_title: movie.original_title,
    release_date: movie.release_date || null,
    overview: movie.overview,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    runtime: movie.runtime,
    vote_average: movie.vote_average,
    vote_count: movie.vote_count,
    popularity: movie.popularity,
    original_language: movie.original_language,
    adult: movie.adult,
    budget: movie.budget,
    revenue: movie.revenue,
    status: movie.status,
    tagline: movie.tagline,
    homepage: movie.homepage,
    imdb_id: movie.imdb_id
  };

  const { data, error } = await supabase
    .from('movies')
    .upsert(movieData, { onConflict: 'tmdb_id' })
    .select();

  if (error) {
    console.error(`❌ Error inserting ${movie.title}:`, error.message);
    return null;
  }

  // Insert genres
  if (movie.genres && data && data[0]) {
    for (const genre of movie.genres) {
      await supabase
        .from('movie_genres')
        .upsert(
          { movie_id: data[0].id, genre_id: genre.id },
          { onConflict: 'movie_id,genre_id' }
        );
    }
  }

  return data ? data[0] : null;
}

async function fetchMovies() {
  console.log('🎥 Fetching movies from TMDB...\n');
  console.log('This will take ~10-15 minutes for 2000 movies\n');

  const genreIds = [28, 12, 16, 35, 80, 18, 14, 27, 10749, 878, 53, 9648, 36, 10752, 37];
  let totalMovies = 0;
  const movieIds = new Set();

  try {
    // Get popular movies per genre
    for (const genreId of genreIds) {
      console.log(`\n📂 Fetching genre ${genreId}...`);

      for (let page = 1; page <= 10; page++) {
        const response = await axios.get(
          `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&vote_count.gte=100&vote_average.gte=6.0&page=${page}`
        );

        for (const movie of response.data.results) {
          movieIds.add(movie.id);
        }

        await delay(250); // Rate limiting
      }
    }

    console.log(`\n✅ Found ${movieIds.size} unique movies\n`);
    console.log('📥 Fetching detailed data and inserting...\n');

    let count = 0;
    for (const tmdbId of movieIds) {
      const movieDetails = await fetchMovieDetails(tmdbId);
      
      if (movieDetails) {
        const inserted = await insertMovie(movieDetails);
        if (inserted) {
          count++;
          if (count % 50 === 0) {
            console.log(`✅ Inserted ${count} movies...`);
          }
        }
      }

      await delay(250); // Rate limiting
    }

    console.log(`\n✨ Complete! Inserted ${count} movies`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fetchMovies().catch(console.error);