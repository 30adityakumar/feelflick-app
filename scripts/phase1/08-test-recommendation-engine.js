// scripts/phase1/08-test-recommendation-engine.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getRecommendations(moodId, viewingContextId, experienceTypeId, energyLevel = 5, intensityOpenness = 5, limit = 20) {
  console.log('\n🎬 Getting recommendations...');
  console.log(`Mood ID: ${moodId}, Context ID: ${viewingContextId}, Experience ID: ${experienceTypeId}`);
  console.log(`Energy: ${energyLevel}/10, Intensity Openness: ${intensityOpenness}/10\n`);

  // Get experience type preferences
  const { data: experience } = await supabase
    .from('experience_types')
    .select('preferred_genres, avoid_genres')
    .eq('id', experienceTypeId)
    .single();

  // Get viewing context filters
  const { data: context } = await supabase
    .from('viewing_contexts')
    .select('prefer_shorter_runtime')
    .eq('id', viewingContextId)
    .single();

  // Build query
  let query = supabase
    .from('movie_mood_scores')
    .select(`
      score,
      movie_id,
      movies:movie_id (
        id,
        title,
        poster_path,
        runtime,
        vote_average,
        popularity,
        release_date
      )
    `)
    .eq('mood_id', moodId)
    .gte('score', 30)
    .order('score', { ascending: false })
    .limit(100);

  const { data: candidates, error } = await query;

  if (error) {
    console.error('❌ Error fetching candidates:', error.message);
    return [];
  }

  console.log(`Found ${candidates.length} candidate movies\n`);

  // Score and filter candidates
  const scoredMovies = [];

  for (const candidate of candidates) {
    const movie = candidate.movies;
    if (!movie) continue;

    let finalScore = candidate.score;

    // Get movie genres
    const { data: movieGenres } = await supabase
      .from('movie_genres')
      .select('genre_id')
      .eq('movie_id', movie.id);

    const genreIds = movieGenres ? movieGenres.map(mg => mg.genre_id) : [];

    // Apply experience type boosts/penalties
    if (experience) {
      for (const genreId of genreIds) {
        if (experience.preferred_genres?.includes(genreId)) {
          finalScore += 10;
        }
        if (experience.avoid_genres?.includes(genreId)) {
          finalScore -= 20;
        }
      }
    }

    // Runtime filter for viewing context
    if (context?.prefer_shorter_runtime && movie.runtime > 120) {
      finalScore -= 10;
    }

    // Quality boost
    finalScore += (movie.vote_average - 6.0) * 5;

    // Skip if score too low
    if (finalScore < 30) continue;

    scoredMovies.push({
      ...movie,
      finalScore: Math.round(finalScore * 10) / 10,
      genres: genreIds
    });
  }

  // Sort by final score
  scoredMovies.sort((a, b) => b.finalScore - a.finalScore);

  // Return top N
  return scoredMovies.slice(0, limit);
}

async function testEngine() {
  console.log('🧪 Testing Recommendation Engine\n');
  console.log('='.repeat(60));

  // Test Case 1: Cozy + Alone + Escape
  console.log('\n📺 Test 1: Cozy mood, watching alone, want to escape');
  const test1 = await getRecommendations(1, 1, 1, 4, 5, 10);
  
  console.log('Top 10 recommendations:');
  test1.forEach((movie, idx) => {
    console.log(`${idx + 1}. ${movie.title} (Score: ${movie.finalScore}, Rating: ${movie.vote_average})`);
  });

  // Test Case 2: Adventurous + Friends + Zone Out
  console.log('\n\n📺 Test 2: Adventurous mood, with friends, want to zone out');
  const test2 = await getRecommendations(2, 3, 5, 8, 7, 10);
  
  console.log('Top 10 recommendations:');
  test2.forEach((movie, idx) => {
    console.log(`${idx + 1}. ${movie.title} (Score: ${movie.finalScore}, Rating: ${movie.vote_average})`);
  });

  // Test Case 3: Anxious + Partner + Laugh
  console.log('\n\n📺 Test 3: Anxious mood, with partner, want to laugh');
  const test3 = await getRecommendations(7, 2, 2, 3, 2, 10);
  
  console.log('Top 10 recommendations:');
  test3.forEach((movie, idx) => {
    console.log(`${idx + 1}. ${movie.title} (Score: ${movie.finalScore}, Rating: ${movie.vote_average})`);
  });

  console.log('\n\n✨ Testing complete!');
}

testEngine().catch(console.error);