// scripts/phase1/06-calculate-movie-scores.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mood preferences (from moods table)
const MOOD_PREFERENCES = {
  'Cozy': { pacing: 3, intensity: 2, emotional_depth: 5, preferred_genres: [35, 10749, 10751], avoid_genres: [27, 53] },
  'Adventurous': { pacing: 8, intensity: 7, emotional_depth: 5, preferred_genres: [12, 28, 14, 878], avoid_genres: [] },
  'Heartbroken': { pacing: 4, intensity: 6, emotional_depth: 9, preferred_genres: [18, 10749], avoid_genres: [35] },
  'Curious': { pacing: 5, intensity: 5, emotional_depth: 7, preferred_genres: [9648, 878, 99], avoid_genres: [28] },
  'Nostalgic': { pacing: 4, intensity: 3, emotional_depth: 6, preferred_genres: [18, 10749, 35], avoid_genres: [27, 53] },
  'Energized': { pacing: 9, intensity: 8, emotional_depth: 4, preferred_genres: [28, 12, 53], avoid_genres: [18] },
  'Anxious': { pacing: 2, intensity: 1, emotional_depth: 3, preferred_genres: [35, 10751, 16], avoid_genres: [27, 53, 80] },
  'Romantic': { pacing: 5, intensity: 5, emotional_depth: 7, preferred_genres: [10749, 35, 18], avoid_genres: [27, 28] },
  'Inspired': { pacing: 6, intensity: 6, emotional_depth: 7, preferred_genres: [18, 36, 99], avoid_genres: [27] },
  'Silly': { pacing: 7, intensity: 3, emotional_depth: 2, preferred_genres: [35, 16, 10751], avoid_genres: [27, 18, 53] },
  'Dark': { pacing: 6, intensity: 9, emotional_depth: 8, preferred_genres: [27, 53, 80], avoid_genres: [35, 10751] },
  'Overwhelmed': { pacing: 3, intensity: 1, emotional_depth: 2, preferred_genres: [16, 35, 10751], avoid_genres: [27, 53, 80, 18] }
};

function calculateMoodMatchScore(movie, movieGenres, mood, moodPrefs) {
  // Genre matching (40% weight)
  let genreScore = 0;
  
  for (const genreId of movieGenres) {
    if (moodPrefs.preferred_genres.includes(genreId)) {
      genreScore += 15;
    }
    if (moodPrefs.avoid_genres.includes(genreId)) {
      genreScore -= 30;
    }
  }
  genreScore = Math.max(0, Math.min(100, genreScore));

  // Pacing match (25% weight)
  const pacingDiff = Math.abs(movie.pacing_score - moodPrefs.pacing);
  const pacingScore = Math.max(0, 100 - (pacingDiff * 10));

  // Intensity match (20% weight)
  const intensityDiff = Math.abs(movie.intensity_score - moodPrefs.intensity);
  const intensityScore = Math.max(0, 100 - (intensityDiff * 10));

  // Emotional depth match (15% weight)
  const depthDiff = Math.abs(movie.emotional_depth_score - moodPrefs.emotional_depth);
  const depthScore = Math.max(0, 100 - (depthDiff * 10));

  // Weighted average
  const baseScore = (
    genreScore * 0.40 +
    pacingScore * 0.25 +
    intensityScore * 0.20 +
    depthScore * 0.15
  );

  // Quality boost
  const qualityMultiplier = 1 + Math.max(0, (movie.vote_average - 6.0) * 0.1);
  const popularityBoost = Math.min(movie.popularity / 100, 10);

  const finalScore = Math.min(100, (baseScore * qualityMultiplier) + popularityBoost);

  return {
    score: Math.round(finalScore * 10) / 10,
    genre_match_score: Math.round(genreScore * 10) / 10,
    pacing_match_score: Math.round(pacingScore * 10) / 10,
    intensity_match_score: Math.round(intensityScore * 10) / 10
  };
}

async function precomputeMoodScores() {
  console.log('🎯 Precomputing movie-mood scores...\n');

  // Get all moods
  const { data: moods, error: moodError } = await supabase
    .from('moods')
    .select('id, name')
    .eq('active', true);

  if (moodError) {
    console.error('❌ Error fetching moods:', moodError.message);
    return;
  }

  // Get all movies with scores
  const { data: movies, error: movieError } = await supabase
    .from('movies')
    .select('id, title, pacing_score, intensity_score, emotional_depth_score, vote_average, popularity')
    .not('pacing_score', 'is', null);

  if (movieError) {
    console.error('❌ Error fetching movies:', movieError.message);
    return;
  }

  console.log(`Processing ${moods.length} moods × ${movies.length} movies = ${moods.length * movies.length} scores\n`);

  let totalInserted = 0;

  for (const mood of moods) {
    const moodPrefs = MOOD_PREFERENCES[mood.name];
    if (!moodPrefs) {
      console.log(`⚠️  No preferences defined for ${mood.name}, skipping`);
      continue;
    }

    console.log(`\n📊 Processing mood: ${mood.name}`);
    let moodCount = 0;

    for (const movie of movies) {
      // Get movie genres
      const { data: movieGenres } = await supabase
        .from('movie_genres')
        .select('genre_id')
        .eq('movie_id', movie.id);

      const genreIds = movieGenres ? movieGenres.map(mg => mg.genre_id) : [];

      // Calculate scores
      const scores = calculateMoodMatchScore(movie, genreIds, mood, moodPrefs);

      // Insert into movie_mood_scores
      const { error: insertError } = await supabase
        .from('movie_mood_scores')
        .upsert({
          movie_id: movie.id,
          mood_id: mood.id,
          score: scores.score,
          genre_match_score: scores.genre_match_score,
          pacing_match_score: scores.pacing_match_score,
          intensity_match_score: scores.intensity_match_score,
          last_updated_at: new Date().toISOString()
        }, { onConflict: 'movie_id,mood_id' });

      if (insertError) {
        console.error(`❌ Error inserting score:`, insertError.message);
      } else {
        moodCount++;
        totalInserted++;
      }
    }

    console.log(`✅ Inserted ${moodCount} scores for ${mood.name}`);
  }

  console.log(`\n✨ Complete! Inserted ${totalInserted} mood-movie scores`);
}

precomputeMoodScores().catch(console.error);