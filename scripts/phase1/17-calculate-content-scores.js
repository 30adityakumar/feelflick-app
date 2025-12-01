// calculate-content-scores.js
// Calculates 5 content dimensions using heuristic algorithms
// Run with: node calculate-content-scores.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================================
// SCORING ALGORITHMS
// ============================================================================

/**
 * Calculate pacing_score (0-100: slow burn → fast-paced)
 * Signals: runtime, genre, keywords, action density
 */
function calculatePacingScore(movie, genres, keywords) {
  let score = 50; // Neutral baseline

  // Runtime signal (30% weight)
  // Very long (>150min) = slower, very short (<90min) = faster
  if (movie.runtime) {
    if (movie.runtime < 85) score += 20;
    else if (movie.runtime < 100) score += 10;
    else if (movie.runtime > 150) score -= 20;
    else if (movie.runtime > 130) score -= 10;
  }

  // Genre signal (40% weight)
  const genreNames = genres.map(g => g.toLowerCase());
  if (genreNames.includes('action')) score += 25;
  if (genreNames.includes('thriller')) score += 15;
  if (genreNames.includes('adventure')) score += 10;
  if (genreNames.includes('horror')) score += 10;
  if (genreNames.includes('drama')) score -= 15;
  if (genreNames.includes('documentary')) score -= 20;
  if (genreNames.includes('romance')) score -= 10;
  if (genreNames.includes('history')) score -= 15;

  // Keyword signals (30% weight)
  const keywordNames = keywords.map(k => k.toLowerCase());
  const fastKeywords = ['fast paced', 'action', 'chase', 'explosion', 'battle', 'fight', 'race', 'heist', 'adrenaline'];
  const slowKeywords = ['slow burn', 'contemplative', 'meditative', 'dialogue', 'philosophical', 'slow cinema', 'character study', 'chamber piece'];
  
  fastKeywords.forEach(kw => {
    if (keywordNames.some(k => k.includes(kw))) score += 5;
  });
  
  slowKeywords.forEach(kw => {
    if (keywordNames.some(k => k.includes(kw))) score -= 5;
  });

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate intensity_score (0-100: light/feel-good → heavy/dark)
 * Signals: genre, keywords, rating themes
 */
function calculateIntensityScore(movie, genres, keywords) {
  let score = 50; // Neutral baseline

  // Genre signal (50% weight)
  const genreNames = genres.map(g => g.toLowerCase());
  if (genreNames.includes('horror')) score += 30;
  if (genreNames.includes('thriller')) score += 20;
  if (genreNames.includes('war')) score += 25;
  if (genreNames.includes('crime')) score += 15;
  if (genreNames.includes('mystery')) score += 10;
  if (genreNames.includes('comedy')) score -= 20;
  if (genreNames.includes('family')) score -= 25;
  if (genreNames.includes('animation')) score -= 15;
  if (genreNames.includes('romance')) score -= 10;

  // Keyword signals (40% weight)
  const keywordNames = keywords.map(k => k.toLowerCase());
  const intenseKeywords = ['violence', 'dark', 'disturbing', 'brutal', 'graphic', 'psychological', 'intense', 'gory', 'suspense', 'murder', 'death', 'revenge', 'torture'];
  const lightKeywords = ['feel good', 'lighthearted', 'uplifting', 'heartwarming', 'wholesome', 'cozy', 'peaceful', 'gentle', 'sweet', 'innocent'];
  
  intenseKeywords.forEach(kw => {
    if (keywordNames.some(k => k.includes(kw))) score += 5;
  });
  
  lightKeywords.forEach(kw => {
    if (keywordNames.some(k => k.includes(kw))) score -= 5;
  });

  // Adult content modifier (10% weight)
  if (movie.adult) score += 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate emotional_depth_score (0-100: shallow entertainment → profound)
 * Signals: rating correlation, genre, keywords, critical acclaim
 */
function calculateEmotionalDepthScore(movie, genres, keywords) {
  let score = 50; // Neutral baseline

  // Rating quality signal (30% weight)
  // High rating + many votes often indicates substance
  if (movie.vote_average >= 8.0 && movie.vote_count > 500) score += 25;
  else if (movie.vote_average >= 7.5 && movie.vote_count > 200) score += 15;
  else if (movie.vote_average < 6.0) score -= 15;

  // Genre signal (30% weight)
  const genreNames = genres.map(g => g.toLowerCase());
  if (genreNames.includes('drama')) score += 20;
  if (genreNames.includes('documentary')) score += 25;
  if (genreNames.includes('history')) score += 15;
  if (genreNames.includes('war')) score += 10;
  if (genreNames.includes('action')) score -= 15;
  if (genreNames.includes('comedy')) score -= 5;

  // Keyword signals (40% weight)
  const keywordNames = keywords.map(k => k.toLowerCase());
  const deepKeywords = ['philosophical', 'existential', 'thought provoking', 'profound', 'meaningful', 'deep', 'complex', 'intellectual', 'meditation', 'human condition', 'mortality', 'identity', 'consciousness'];
  const shallowKeywords = ['mindless', 'popcorn', 'escapism', 'spectacle', 'eye candy', 'guilty pleasure'];
  
  deepKeywords.forEach(kw => {
    if (keywordNames.some(k => k.includes(kw))) score += 5;
  });
  
  shallowKeywords.forEach(kw => {
    if (keywordNames.some(k => k.includes(kw))) score -= 5;
  });

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate dialogue_density (0-100: visual storytelling → dialogue-heavy)
 * Signals: genre, keywords, runtime patterns
 */
function calculateDialogueDensity(movie, genres, keywords) {
  let score = 50; // Neutral baseline

  // Genre signal (40% weight)
  const genreNames = genres.map(g => g.toLowerCase());
  if (genreNames.includes('drama')) score += 20;
  if (genreNames.includes('thriller') && !genreNames.includes('action')) score += 15;
  if (genreNames.includes('mystery')) score += 10;
  if (genreNames.includes('comedy') && !genreNames.includes('action')) score += 10;
  if (genreNames.includes('action')) score -= 20;
  if (genreNames.includes('animation')) score -= 15;
  if (genreNames.includes('adventure') && genreNames.includes('action')) score -= 15;
  if (genreNames.includes('war')) score -= 10;

  // Keyword signals (50% weight)
  const keywordNames = keywords.map(k => k.toLowerCase());
  const dialogueKeywords = ['dialogue', 'conversation', 'chamber piece', 'one location', 'single location', 'talky', 'verbal', 'debate', 'discussion', 'talking'];
  const visualKeywords = ['visual', 'spectacle', 'action packed', 'silent', 'wordless', 'minimal dialogue', 'show don\'t tell'];
  
  dialogueKeywords.forEach(kw => {
    if (keywordNames.some(k => k.includes(kw))) score += 8;
  });
  
  visualKeywords.forEach(kw => {
    if (keywordNames.some(k => k.includes(kw))) score -= 8;
  });

  // Runtime signal (10% weight) - longer dramas tend to be more dialogue-heavy
  if (movie.runtime && genreNames.includes('drama')) {
    if (movie.runtime > 140) score += 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate attention_demand (0-100: background-able → requires focus)
 * Combination of pacing, dialogue, and narrative complexity
 */
function calculateAttentionDemand(movie, genres, keywords, pacingScore, dialogueDensity) {
  let score = 50; // Neutral baseline

  // Inverse pacing contribution (30% weight)
  // Slow-paced films often require more focus
  score += (100 - pacingScore) * 0.15;

  // Dialogue density contribution (20% weight)
  // Dialogue-heavy requires listening
  score += dialogueDensity * 0.2;

  // Genre signal (30% weight)
  const genreNames = genres.map(g => g.toLowerCase());
  if (genreNames.includes('thriller')) score += 15;
  if (genreNames.includes('mystery')) score += 15;
  if (genreNames.includes('science fiction')) score += 10;
  if (genreNames.includes('documentary')) score += 10;
  if (genreNames.includes('comedy')) score -= 10;
  if (genreNames.includes('action') && !genreNames.includes('thriller')) score -= 5;
  if (genreNames.includes('family')) score -= 15;

  // Keyword signals (20% weight)
  const keywordNames = keywords.map(k => k.toLowerCase());
  const focusKeywords = ['complex', 'nonlinear', 'puzzle', 'mindbender', 'twist', 'time travel', 'multilayered', 'intricate', 'cerebral', 'confusing'];
  const easyKeywords = ['straightforward', 'simple', 'predictable', 'formulaic', 'easy viewing'];
  
  focusKeywords.forEach(kw => {
    if (keywordNames.some(k => k.includes(kw))) score += 5;
  });
  
  easyKeywords.forEach(kw => {
    if (keywordNames.some(k => k.includes(kw))) score -= 5;
  });

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================================
// MAIN PROCESSING
// ============================================================================

async function processMovie(movie) {
  try {
    // Fetch genres for this movie
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

    // Fetch keywords for this movie
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

    // Calculate all scores
    const pacing_score = calculatePacingScore(movie, genreNames, keywordNames);
    const intensity_score = calculateIntensityScore(movie, genreNames, keywordNames);
    const emotional_depth_score = calculateEmotionalDepthScore(movie, genreNames, keywordNames);
    const dialogue_density = calculateDialogueDensity(movie, genreNames, keywordNames);
    const attention_demand = calculateAttentionDemand(movie, genreNames, keywordNames, pacing_score, dialogue_density);

    // Update movie with calculated scores
    const { error: updateError } = await supabase
      .from('movies')
      .update({
        pacing_score,
        intensity_score,
        emotional_depth_score,
        dialogue_density,
        attention_demand,
        last_scored_at: new Date().toISOString()
      })
      .eq('id', movie.id);

    if (updateError) {
      console.error(`❌ Error updating movie ${movie.id}:`, updateError.message);
      return null;
    }

    return {
      id: movie.id,
      title: movie.title,
      pacing_score,
      intensity_score,
      emotional_depth_score,
      dialogue_density,
      attention_demand
    };
  } catch (error) {
    console.error(`❌ Error processing movie ${movie.id}:`, error.message);
    return null;
  }
}

async function calculateAllScores() {
  console.log('🎬 Starting content score calculation...\n');

  // Fetch all movies (or batch if needed)
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title, runtime, vote_average, vote_count, adult')
    .order('popularity', { ascending: false }); // Process popular movies first

  if (error) {
    console.error('❌ Error fetching movies:', error.message);
    return;
  }

  console.log(`📊 Processing ${movies.length} movies\n`);
  console.log('Priority: Popular movies first (better keywords/data)\n');

  let processed = 0;
  let successful = 0;
  const batchSize = 10; // Process 10 at a time to avoid rate limits

  for (let i = 0; i < movies.length; i += batchSize) {
    const batch = movies.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(processMovie));
    
    successful += results.filter(r => r !== null).length;
    processed += batch.length;

    if (processed % 100 === 0) {
      console.log(`✅ Processed ${processed}/${movies.length} (${successful} successful)`);
    }

    // Rate limiting - small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n✨ Complete! Scored ${successful}/${movies.length} movies`);
  console.log('\n📋 Sample check:');
  
  // Show some examples
  const { data: samples } = await supabase
    .from('movies')
    .select('title, pacing_score, intensity_score, emotional_depth_score, dialogue_density, attention_demand')
    .not('pacing_score', 'is', null)
    .order('popularity', { ascending: false })
    .limit(5);

  console.table(samples);
}

// ============================================================================
// RUN
// ============================================================================

if (require.main === module) {
  calculateAllScores()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  calculatePacingScore,
  calculateIntensityScore,
  calculateEmotionalDepthScore,
  calculateDialogueDensity,
  calculateAttentionDemand
};