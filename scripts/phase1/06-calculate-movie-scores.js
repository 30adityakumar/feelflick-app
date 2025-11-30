// scripts/phase1/06-calculate-movie-scores.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Genre-based scoring rules
const GENRE_SCORES = {
  // Pacing (1-10): How fast/slow the movie feels
  pacing: {
    28: 9,   // Action - very fast
    12: 8,   // Adventure - fast
    16: 6,   // Animation - moderate-fast
    35: 7,   // Comedy - moderate-fast
    80: 6,   // Crime - moderate
    99: 4,   // Documentary - slow
    18: 4,   // Drama - slow
    10751: 6, // Family - moderate
    14: 7,   // Fantasy - moderate-fast
    36: 3,   // History - very slow
    27: 7,   // Horror - moderate-fast
    10402: 6, // Music - moderate
    9648: 5,  // Mystery - moderate
    10749: 5, // Romance - moderate
    878: 7,   // Science Fiction - moderate-fast
    10770: 5, // TV Movie - moderate
    53: 8,    // Thriller - fast
    10752: 6, // War - moderate
    37: 5     // Western - moderate
  },
  // Intensity (1-10): How intense/demanding the viewing experience
  intensity: {
    28: 8,   // Action
    12: 7,   // Adventure
    16: 4,   // Animation
    35: 3,   // Comedy
    80: 7,   // Crime
    99: 5,   // Documentary
    18: 6,   // Drama
    10751: 3, // Family
    14: 6,   // Fantasy
    36: 4,   // History
    27: 9,   // Horror
    10402: 4, // Music
    9648: 7,  // Mystery
    10749: 4, // Romance
    878: 7,   // Science Fiction
    10770: 5, // TV Movie
    53: 9,    // Thriller
    10752: 8, // War
    37: 5     // Western
  },
  // Emotional Depth (1-10): How emotionally engaging/complex
  emotional_depth: {
    28: 4,   // Action
    12: 5,   // Adventure
    16: 6,   // Animation
    35: 3,   // Comedy
    80: 6,   // Crime
    99: 7,   // Documentary
    18: 9,   // Drama
    10751: 5, // Family
    14: 6,   // Fantasy
    36: 7,   // History
    27: 5,   // Horror
    10402: 6, // Music
    9648: 6,  // Mystery
    10749: 8, // Romance
    878: 6,   // Science Fiction
    10770: 5, // TV Movie
    53: 5,    // Thriller
    10752: 7, // War
    37: 5     // Western
  }
};

function calculateScores(genres, runtime, voteAverage) {
  if (!genres || genres.length === 0) {
    return { pacing: 5, intensity: 5, emotional_depth: 5 };
  }

  // Average genre scores
  let pacingSum = 0, intensitySum = 0, depthSum = 0;
  
  for (const genreId of genres) {
    pacingSum += GENRE_SCORES.pacing[genreId] || 5;
    intensitySum += GENRE_SCORES.intensity[genreId] || 5;
    depthSum += GENRE_SCORES.emotional_depth[genreId] || 5;
  }

  let pacing = Math.round(pacingSum / genres.length);
  let intensity = Math.round(intensitySum / genres.length);
  let depth = Math.round(depthSum / genres.length);

  // Runtime adjustments for pacing
  if (runtime) {
    if (runtime < 90) pacing = Math.min(10, pacing + 1);
    if (runtime > 150) pacing = Math.max(1, pacing - 1);
  }

  // Quality adjustment for emotional depth
  if (voteAverage) {
    if (voteAverage >= 8.0) depth = Math.min(10, depth + 1);
    if (voteAverage < 6.0) depth = Math.max(1, depth - 1);
  }

  return { pacing, intensity, emotional_depth: depth };
}

async function calculateMovieScores() {
  console.log('🧮 Calculating movie scores...\n');

  // Get all movies with their genres
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, tmdb_id, title, runtime, vote_average');

  if (error) {
    console.error('❌ Error fetching movies:', error.message);
    return;
  }

  console.log(`Found ${movies.length} movies to score\n`);

  let updated = 0;

  for (const movie of movies) {
    // Get genres for this movie
    const { data: movieGenres } = await supabase
      .from('movie_genres')
      .select('genre_id')
      .eq('movie_id', movie.id);

    const genreIds = movieGenres ? movieGenres.map(mg => mg.genre_id) : [];
    
    const scores = calculateScores(genreIds, movie.runtime, movie.vote_average);

    // Update movie with scores
    const { error: updateError } = await supabase
      .from('movies')
      .update({
        pacing_score: scores.pacing,
        intensity_score: scores.intensity,
        emotional_depth_score: scores.emotional_depth,
        last_scored_at: new Date().toISOString()
      })
      .eq('id', movie.id);

    if (updateError) {
      console.error(`❌ Error updating ${movie.title}:`, updateError.message);
    } else {
      updated++;
      if (updated % 100 === 0) {
        console.log(`✅ Scored ${updated} movies...`);
      }
    }
  }

  console.log(`\n✨ Complete! Scored ${updated} movies`);
}

calculateMovieScores().catch(console.error);