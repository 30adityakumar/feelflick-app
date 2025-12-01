// calculate-metadata.js
// Calculates star_power, quality_score, vfx_level, cult_status
// Run with: node calculate-metadata.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================================
// METADATA CALCULATIONS
// ============================================================================

/**
 * Calculate star_power from cast popularity
 * Uses top 3 billed actors for calculation
 */
async function calculateStarPower(movieId) {
  const { data: cast } = await supabase
    .from('movie_people')
    .select('person_id, billing_order')
    .eq('movie_id', movieId)
    .eq('job', 'Actor')
    .order('billing_order', { ascending: true })
    .limit(10);

  if (!cast || cast.length === 0) return 'no_stars';

  const { data: people } = await supabase
    .from('people')
    .select('id, popularity')
    .in('id', cast.map(c => c.person_id));

  if (!people || people.length === 0) return 'no_stars';

  // Get top 3 billed actors' average popularity
  const popularityMap = Object.fromEntries(people.map(p => [p.id, p.popularity || 0]));
  const top3Popularities = cast
    .slice(0, 3)
    .map(c => popularityMap[c.person_id] || 0);
  
  const avgTop3 = top3Popularities.reduce((a, b) => a + b, 0) / top3Popularities.length;
  const maxPopularity = Math.max(...top3Popularities);

  // Store cast metadata for future use
  await supabase
    .from('movie_cast_metadata')
    .upsert({
      movie_id: movieId,
      avg_cast_popularity: avgTop3,
      max_cast_popularity: maxPopularity,
      top_3_cast_avg: avgTop3,
      cast_count: cast.length,
      calculated_at: new Date().toISOString()
    });

  // Classify star power
  if (maxPopularity >= 100) return 'mega_stars';
  if (avgTop3 >= 50) return 'a_list';
  if (avgTop3 >= 30) return 'b_list';
  if (avgTop3 >= 10) return 'character_actors';
  return 'no_stars';
}

/**
 * Calculate quality_score (0-100) from multiple rating sources
 * Weighted average: IMDb (4), TMDB (3), RT (2), Metacritic (2)
 */
async function calculateQualityScore(movie) {
  let totalScore = 0;
  let totalWeight = 0;

  // TMDB Rating (weight: 3)
  if (movie.vote_average && movie.vote_count >= 50) {
    totalScore += (movie.vote_average / 10) * 100 * 3;
    totalWeight += 3;
  }

  // External ratings
  const { data: externalRatings } = await supabase
    .from('ratings_external')
    .select('imdb_rating, rt_rating, metacritic_score')
    .eq('movie_id', movie.id)
    .single();

  if (externalRatings) {
    // IMDb Rating (weight: 4) - most trusted
    if (externalRatings.imdb_rating) {
      totalScore += (externalRatings.imdb_rating / 10) * 100 * 4;
      totalWeight += 4;
    }

    // Rotten Tomatoes (weight: 2)
    if (externalRatings.rt_rating) {
      const rtScore = parseInt(externalRatings.rt_rating.replace('%', ''));
      totalScore += rtScore * 2;
      totalWeight += 2;
    }

    // Metacritic (weight: 2)
    if (externalRatings.metacritic_score) {
      totalScore += externalRatings.metacritic_score * 2;
      totalWeight += 2;
    }
  }

  if (totalWeight === 0) return null; // No ratings available

  // Calculate weighted average (0-100 scale)
  const baseScore = totalScore / totalWeight;

  // Popularity boost (up to +5 points for very popular movies)
  const popularityBoost = Math.min(movie.popularity / 100 * 5, 5);

  // Vote count confidence multiplier (reduce score if low vote count)
  let confidence = 1.0;
  if (movie.vote_count < 100) confidence = 0.7;
  else if (movie.vote_count < 500) confidence = 0.85;
  else if (movie.vote_count < 1000) confidence = 0.95;

  const finalScore = (baseScore * confidence) + popularityBoost;
  return Math.min(100, Math.round(finalScore * 10) / 10);
}

/**
 * Calculate VFX level from budget and genre
 */
function calculateVFXLevel(movie, genres) {
  const budget = movie.budget || 0;
  const genreNames = genres.map(g => g.toLowerCase());

  // Base classification from budget
  let baseLevel;
  if (budget < 1000000) baseLevel = 'minimal';
  else if (budget < 10000000) baseLevel = 'low';
  else if (budget < 50000000) baseLevel = 'moderate';
  else if (budget < 100000000) baseLevel = 'high';
  else baseLevel = 'spectacle';

  // Adjust for VFX-heavy genres
  const vfxGenres = ['science fiction', 'fantasy', 'animation', 'adventure'];
  const hasVFXGenre = genreNames.some(g => vfxGenres.includes(g));

  if (hasVFXGenre && baseLevel === 'low') return 'moderate';
  if (hasVFXGenre && baseLevel === 'moderate') return 'high';
  
  return baseLevel;
}

/**
 * Detect cult classic status
 * Criteria: High rating + low popularity + old + sustained votes + indie feel
 */
function isCultClassic(movie, keywords, starPower) {
  const age = new Date().getFullYear() - new Date(movie.release_date).getFullYear();
  
  // Basic criteria
  const highRating = movie.vote_average >= 7.5;
  const lowPopularity = movie.popularity < 60;
  const sustainedVotes = movie.vote_count >= 100; // People still care
  const notBrandNew = age >= 5; // At least 5 years old
  const indieIndicators = starPower === 'no_stars' || starPower === 'character_actors';
  const lowBudget = movie.budget > 0 && movie.budget < 5000000;

  // Keyword signals
  const keywordNames = keywords.map(k => k.toLowerCase());
  const cultKeywords = ['cult', 'underground', 'indie', 'independent', 'cult classic', 'midnight movie'];
  const hasCultKeywords = keywordNames.some(k => cultKeywords.some(ck => k.includes(ck)));

  // Must meet most criteria
  const score = [
    highRating,
    lowPopularity,
    sustainedVotes,
    notBrandNew,
    indieIndicators || lowBudget,
    hasCultKeywords
  ].filter(Boolean).length;

  return score >= 4; // Must meet 4+ of 6 criteria
}

// ============================================================================
// MAIN PROCESSING
// ============================================================================

async function processMovie(movie) {
  try {
    // Fetch genres
    const { data: movieGenres } = await supabase
      .from('movie_genres')
      .select('genre_id')
      .eq('movie_id', movie.id);

    const genreIds = movieGenres?.map(mg => mg.genre_id) || [];
    
    const { data: genres } = await supabase
      .from('genres')
      .select('name')
      .in('id', genreIds);

    const genreNames = genres?.map(g => g.name) || [];

    // Fetch keywords
    const { data: movieKeywords } = await supabase
      .from('movie_keywords')
      .select('keyword_id')
      .eq('movie_id', movie.id);

    const keywordIds = movieKeywords?.map(mk => mk.keyword_id) || [];
    
    const { data: keywords } = await supabase
      .from('keywords')
      .select('name')
      .in('id', keywordIds);

    const keywordNames = keywords?.map(k => k.name) || [];

    // Calculate metadata
    const star_power = await calculateStarPower(movie.id);
    const quality_score = await calculateQualityScore(movie);
    const vfx_level = calculateVFXLevel(movie, genreNames);
    const cult_status = isCultClassic(movie, keywordNames, star_power);

    // Update movie
    const { error: updateError } = await supabase
      .from('movies')
      .update({
        star_power,
        quality_score,
        vfx_level,
        cult_status
      })
      .eq('id', movie.id);

    if (updateError) {
      console.error(`❌ Error updating movie ${movie.id}:`, updateError.message);
      return null;
    }

    return {
      id: movie.id,
      title: movie.title,
      star_power,
      quality_score,
      vfx_level,
      cult_status
    };
  } catch (error) {
    console.error(`❌ Error processing movie ${movie.id}:`, error.message);
    return null;
  }
}

async function calculateAllMetadata() {
  console.log('🎬 Starting metadata calculation...\n');

  // Fetch all movies
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title, vote_average, vote_count, popularity, budget, release_date')
    .order('popularity', { ascending: false });

  if (error) {
    console.error('❌ Error fetching movies:', error.message);
    return;
  }

  console.log(`📊 Processing ${movies.length} movies\n`);

  let processed = 0;
  let successful = 0;
  const batchSize = 5; // Smaller batches due to multiple DB queries per movie

  for (let i = 0; i < movies.length; i += batchSize) {
    const batch = movies.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(processMovie));
    
    successful += results.filter(r => r !== null).length;
    processed += batch.length;

    if (processed % 50 === 0) {
      console.log(`✅ Processed ${processed}/${movies.length} (${successful} successful)`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n✨ Complete! Calculated metadata for ${successful}/${movies.length} movies`);
  
  // Show statistics
  const { data: stats } = await supabase.rpc('exec', {
    query: `
      SELECT 
        star_power,
        COUNT(*) as count,
        ROUND(AVG(quality_score), 1) as avg_quality
      FROM movies 
      WHERE star_power IS NOT NULL
      GROUP BY star_power
      ORDER BY 
        CASE star_power
          WHEN 'mega_stars' THEN 1
          WHEN 'a_list' THEN 2
          WHEN 'b_list' THEN 3
          WHEN 'character_actors' THEN 4
          WHEN 'no_stars' THEN 5
        END;
    `
  });

  console.log('\n📊 Star Power Distribution:');
  console.table(stats);

  const { count: cultCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('cult_status', true);

  console.log(`\n🎭 Cult Classics Detected: ${cultCount}`);

  // Show sample cult classics
  const { data: cultSamples } = await supabase
    .from('movies')
    .select('title, vote_average, popularity, release_date')
    .eq('cult_status', true)
    .order('vote_average', { ascending: false })
    .limit(10);

  console.log('\n🌟 Top Cult Classics:');
  console.table(cultSamples);
}

// ============================================================================
// RUN
// ============================================================================

if (require.main === module) {
  calculateAllMetadata()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  calculateStarPower,
  calculateQualityScore,
  calculateVFXLevel,
  isCultClassic
};