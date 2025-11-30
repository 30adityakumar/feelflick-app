require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function calculateQualityScore(movie, externalRatings) {
  let totalScore = 0;
  let totalWeight = 0;

  // TMDB Rating (weight: 3)
  if (movie.vote_average && movie.vote_count >= 50) {
    totalScore += (movie.vote_average / 10) * 100 * 3;
    totalWeight += 3;
  }

  // IMDb Rating (weight: 4) - most trusted
  if (externalRatings?.imdb_rating) {
    totalScore += (externalRatings.imdb_rating / 10) * 100 * 4;
    totalWeight += 4;
  }

  // Rotten Tomatoes (weight: 2)
  if (externalRatings?.rt_rating) {
    const rtScore = parseInt(externalRatings.rt_rating.replace('%', ''));
    totalScore += rtScore * 2;
    totalWeight += 2;
  }

  // Metacritic (weight: 2)
  if (externalRatings?.metacritic_score) {
    totalScore += externalRatings.metacritic_score * 2;
    totalWeight += 2;
  }

  // Calculate weighted average (0-100 scale)
  const qualityScore = totalWeight > 0 ? totalScore / totalWeight : 0;

  // Popularity boost (up to +10 points for very popular movies)
  const popularityBoost = Math.min(movie.popularity / 100, 10);

  // Vote count confidence (reduce score if low vote count)
  let confidence = 1.0;
  if (movie.vote_count < 100) confidence = 0.7;
  else if (movie.vote_count < 500) confidence = 0.85;

  return Math.round((qualityScore * confidence + popularityBoost) * 10) / 10;
}

async function calculateQualityScores() {
  console.log('🎯 Calculating combined quality scores...\n');

  // Get all movies
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, vote_average, vote_count, popularity');

  if (error) {
    console.error('❌ Error fetching movies:', error.message);
    return;
  }

  console.log(`Processing ${movies.length} movies\n`);

  let updated = 0;

  for (const movie of movies) {
    // Get external ratings if available
    const { data: externalRatings } = await supabase
      .from('ratings_external')
      .select('imdb_rating, rt_rating, metacritic_score')
      .eq('movie_id', movie.id)
      .single();

    const qualityScore = calculateQualityScore(movie, externalRatings);

    // Update movie with quality score
    const { error: updateError } = await supabase
    .from('movies')
    .update({ quality_score: qualityScore })
    .eq('id', movie.id);

    if (updateError) {
    console.error(`❌ Error updating ${movie.id}:`, updateError.message);
    }

    updated++;
    if (updated % 100 === 0) {
      console.log(`✅ Calculated ${updated} scores...`);
    }
  }

  console.log(`\n✨ Complete! Calculated ${updated} quality scores`);
  console.log('\nNext: We need to add quality_score column to movies table');
}

calculateQualityScores().catch(console.error);