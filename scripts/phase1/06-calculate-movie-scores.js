// scripts/phase1/06-calculate-movie-scores.js
// 
// ============================================================================
// FEELFLICK MOVIE SCORING ENGINE - PRODUCTION GRADE (FIXED)
// ============================================================================
// 
// FIXES APPLIED:
// ✓ Removed double-penalty in calculateQualityScore
// ✓ Fixed cult status detection to use raw ratings
// ✓ Added has_scores flag updates
// ✓ Optimized calculateCultStatus to accept pre-computed quality
// ✓ Added director popularity to starpower calculation
// ✓ Enhanced VFX detection with budget proxy
// ✓ Added world cinema boost for non-English films
// ✓ Populated legacy enum fields for backward compatibility
//
// ============================================================================

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  BATCH_SIZE: 100,
  LOG_INTERVAL: 500,
  MIN_VOTE_THRESHOLD: 10,
  EXTERNAL_RATING_WEIGHT: 0.45,
  TMDB_WEIGHT: 0.25,
  CAST_WEIGHT: 0.15,
  FRESHNESS_WEIGHT: 0.10,
  ENGAGEMENT_WEIGHT: 0.05,
};

// Genre-based mood scoring
const GENRE_SCORES = {
  pacing: {
    28: 9, 12: 8, 16: 6, 35: 7, 80: 6, 99: 4, 18: 4, 10751: 6, 14: 7,
    36: 3, 27: 7, 10402: 6, 9648: 5, 10749: 5, 878: 7, 10770: 5, 53: 8,
    10752: 6, 37: 5
  },
  intensity: {
    28: 8, 12: 7, 16: 4, 35: 3, 80: 7, 99: 5, 18: 6, 10751: 3, 14: 6,
    36: 4, 27: 9, 10402: 4, 9648: 7, 10749: 4, 878: 7, 10770: 5, 53: 9,
    10752: 8, 37: 5
  },
  emotional_depth: {
    28: 4, 12: 5, 16: 6, 35: 3, 80: 6, 99: 7, 18: 9, 10751: 5, 14: 6,
    36: 7, 27: 5, 10402: 6, 9648: 6, 10749: 8, 878: 6, 10770: 5, 53: 5,
    10752: 7, 37: 5
  }
};

const VFX_KEYWORDS = new Set([
  'cgi', 'visual effects', 'special effects', 'motion capture', 
  '3d', 'imax', 'animation', 'creature', 'monster', 'superhero',
  'alien', 'space', 'science fiction', 'fantasy world', 'vfx',
  'computer animation', 'digital effects', 'spectacle'
]);

const CULT_KEYWORDS = new Set([
  'cult', 'underground', 'indie', 'arthouse', 'experimental',
  'midnight movie', 'controversial', 'banned', 'obscure', 'b movie',
  'grindhouse', 'exploitation', 'transgressive', 'avant garde',
  'independent film', 'art film'
]);

// ============================================================================
// HELPER: ENUM MAPPERS (for legacy fields)
// ============================================================================

function scoreToVFXEnum(score) {
  if (score >= 80) return 'spectacle';
  if (score >= 60) return 'high';
  if (score >= 40) return 'moderate';
  if (score >= 20) return 'low';
  return 'minimal';
}

function scoreToStarpowerEnum(score) {
  if (score >= 80) return 'mega_stars';
  if (score >= 60) return 'a_list';
  if (score >= 40) return 'b_list';
  if (score >= 20) return 'character_actors';
  return 'no_stars';
}

// ============================================================================
// GENRE-BASED MOOD SCORING
// ============================================================================

function calculateGenreScores(genres, runtime, voteAverage) {
  if (!genres || genres.length === 0) {
    return { pacing: 5, intensity: 5, emotional_depth: 5 };
  }

  let pacingSum = 0, intensitySum = 0, depthSum = 0;
  
  for (const genreId of genres) {
    pacingSum += GENRE_SCORES.pacing[genreId] || 5;
    intensitySum += GENRE_SCORES.intensity[genreId] || 5;
    depthSum += GENRE_SCORES.emotional_depth[genreId] || 5;
  }

  let pacing = pacingSum / genres.length;
  let intensity = intensitySum / genres.length;
  let depth = depthSum / genres.length;

  // Runtime adjustments
  if (runtime) {
    if (runtime < 90) pacing = Math.min(10, pacing + 1);
    if (runtime > 150) pacing = Math.max(1, pacing - 1);
  }

  // Quality adjustment for emotional depth
  if (voteAverage) {
    if (voteAverage >= 8.0) depth = Math.min(10, depth + 1);
    if (voteAverage < 6.0) depth = Math.max(1, depth - 1);
  }

  return {
    pacing: Math.round(pacing),
    intensity: Math.round(intensity),
    emotional_depth: Math.round(depth)
  };
}

// ============================================================================
// QUALITY SCORE (0-100) - FIXED: No double penalty
// ============================================================================

function calculateQualityScore(movie, externalRatings) {
  let score = 0;
  let weight = 0;

  // IMDB rating (40% weight)
  if (externalRatings?.imdb_rating) {
    const imdbNorm = (externalRatings.imdb_rating / 10) * 100;
    const voteCount = externalRatings.imdb_votes || 0;
    
    // Confidence factor (not a penalty, just weight adjustment)
    const confidence = Math.min(1, voteCount / 50000);
    const actualWeight = 0.4 * (0.5 + 0.5 * confidence);
    
    score += imdbNorm * actualWeight;
    weight += actualWeight;
  }

  // Rotten Tomatoes (25%)
  if (externalRatings?.rt_rating) {
    const rtScore = parseInt(externalRatings.rt_rating);
    if (!isNaN(rtScore)) {
      score += rtScore * 0.25;
      weight += 0.25;
    }
  }

  // Metacritic (20%)
  if (externalRatings?.metacritic_score) {
    score += externalRatings.metacritic_score * 0.20;
    weight += 0.20;
  }

  // TMDB vote_average (15%)
  if (movie.vote_average) {
    const tmdbNorm = (movie.vote_average / 10) * 100;
    const voteCount = movie.vote_count || 0;
    const confidence = Math.min(1, voteCount / 1000);
    const actualWeight = 0.15 * (0.3 + 0.7 * confidence);
    
    score += tmdbNorm * actualWeight;
    weight += actualWeight;
  }

  // FIXED: No final confidence penalty (already in weights)
  const qualityScore = weight > 0 ? score / weight : 50;
  return Math.round(qualityScore);
}

// ============================================================================
// VFX LEVEL (0-100) - ENHANCED: Uses budget
// ============================================================================

function calculateVFXLevel(movie, genres, keywords) {
  let vfxScore = 0;

  // Genre base scores
  const vfxGenres = {
    878: 70,  // Science Fiction
    14: 60,   // Fantasy
    28: 50,   // Action
    12: 45,   // Adventure
    16: 40    // Animation
  };

  for (const genreId of genres) {
    if (vfxGenres[genreId]) {
      vfxScore = Math.max(vfxScore, vfxGenres[genreId]);
    }
  }

  // Keyword boost
  const keywordNames = keywords.map(k => k.name.toLowerCase());
  const vfxMatches = keywordNames.filter(k => 
    Array.from(VFX_KEYWORDS).some(vfxKw => k.includes(vfxKw))
  ).length;

  if (vfxMatches > 0) {
    vfxScore += Math.min(30, vfxMatches * 10);
  }

  // ENHANCED: Budget proxy
  const hasBudget = movie.budget && movie.budget > 0;
  if (hasBudget) {
    // High budget films (>$100M) likely have high VFX
    if (movie.budget >= 100000000) vfxScore += 15;
    else if (movie.budget >= 50000000) vfxScore += 10;
    else if (movie.budget >= 20000000) vfxScore += 5;
  } else {
    // Fallback: popularity + vote count
    if (movie.popularity > 50 && movie.vote_count > 5000) {
      vfxScore += 10;
    }
  }

  return Math.min(100, Math.round(vfxScore));
}

// ============================================================================
// CULT STATUS (0-100) - FIXED: Uses raw rating, accepts quality param
// ============================================================================

function calculateCultStatus(movie, keywords, externalRatings, qualityScore) {
  let cultScore = 0;

  // Keyword detection
  const keywordNames = keywords.map(k => k.name.toLowerCase());
  const cultMatches = keywordNames.filter(k =>
    Array.from(CULT_KEYWORDS).some(cultKw => k.includes(cultKw))
  ).length;

  if (cultMatches > 0) {
    cultScore += Math.min(40, cultMatches * 15);
  }

  // FIXED: Use raw quality (not vote-penalized) for hidden gem detection
  const rawQuality = externalRatings?.imdb_rating 
    ? externalRatings.imdb_rating * 10 
    : qualityScore || (movie.vote_average || 5) * 10;

  // Hidden gems: high quality but low mainstream appeal
  if (rawQuality >= 70 && movie.popularity < 20) {
    cultScore += 30;
  } else if (rawQuality >= 65 && movie.popularity < 10) {
    cultScore += 25;
  } else if (rawQuality >= 60 && movie.popularity < 5) {
    cultScore += 20;
  }

  // Age factor: older films with sustained engagement
  if (movie.release_date) {
    const releaseYear = new Date(movie.release_date).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - releaseYear;
    
    if (age > 20 && movie.vote_count > 1000) {
      cultScore += 15;
    } else if (age > 30 && movie.vote_count > 500) {
      cultScore += 20; // Very old cult classics
    }
  }

  // ENHANCED: World cinema boost (non-English hidden gems)
  if (movie.original_language && movie.original_language !== 'en' && rawQuality >= 65) {
    cultScore += 10;
  }

  return Math.min(100, Math.round(cultScore));
}

// ============================================================================
// STARPOWER (0-100) - ENHANCED: Includes director popularity
// ============================================================================

function calculateStarpower(castMetadata, movie) {
  let score = 0;

  // Cast starpower (70% weight)
  if (castMetadata) {
    // Top 3 cast average (most important)
    if (castMetadata.top_3_cast_avg) {
      score += Math.min(45, castMetadata.top_3_cast_avg * 1.8);
    }

    // Max cast popularity (star ceiling)
    if (castMetadata.max_cast_popularity) {
      score += Math.min(20, castMetadata.max_cast_popularity * 1.2);
    }

    // Average cast popularity (ensemble)
    if (castMetadata.avg_cast_popularity) {
      score += Math.min(10, castMetadata.avg_cast_popularity * 1.5);
    }
  }

  // ENHANCED: Director popularity (30% weight)
  if (movie.director_popularity && movie.director_popularity > 0) {
    score += Math.min(25, movie.director_popularity * 1.5);
  }

  return Math.min(100, Math.round(score));
}

// ============================================================================
// FF_RATING (0-10) - FeelFlick's proprietary score
// ============================================================================

function calculateFFRating(movie, externalRatings, castMetadata) {
  let totalScore = 0;
  let totalWeight = 0;

  // 1. EXTERNAL CRITICS (45% max)
  if (externalRatings?.imdb_rating) {
    const imdbScore = externalRatings.imdb_rating;
    const voteCount = externalRatings.imdb_votes || 0;
    const confidence = Math.min(1.0, Math.log10(voteCount + 1) / 5);
    const weight = CONFIG.EXTERNAL_RATING_WEIGHT * 0.56 * (0.4 + 0.6 * confidence);
    totalScore += imdbScore * weight;
    totalWeight += weight;
  }

  if (externalRatings?.rt_rating) {
    const rtPercent = parseInt(externalRatings.rt_rating);
    if (!isNaN(rtPercent)) {
      const rtScore = rtPercent / 10;
      const weight = CONFIG.EXTERNAL_RATING_WEIGHT * 0.27;
      totalScore += rtScore * weight;
      totalWeight += weight;
    }
  }

  if (externalRatings?.metacritic_score) {
    const metaScore = externalRatings.metacritic_score / 10;
    const weight = CONFIG.EXTERNAL_RATING_WEIGHT * 0.17;
    totalScore += metaScore * weight;
    totalWeight += weight;
  }

  // 2. TMDB COMMUNITY (25%)
  if (movie.vote_average) {
    const tmdbScore = movie.vote_average;
    const voteCount = movie.vote_count || 0;
    
    let confidence;
    if (voteCount < 50) confidence = 0.3;
    else if (voteCount < 500) confidence = 0.3 + (voteCount - 50) / 450 * 0.5;
    else if (voteCount < 5000) confidence = 0.8 + (voteCount - 500) / 4500 * 0.15;
    else confidence = Math.min(1.0, 0.95 + Math.log10(voteCount - 4999) / 20);
    
    const weight = CONFIG.TMDB_WEIGHT * confidence;
    totalScore += tmdbScore * weight;
    totalWeight += weight;
  }

  // 3. CAST STARPOWER (15%)
  if (castMetadata) {
    let starpowerScore = 5.0;
    
    if (castMetadata.top_3_cast_avg) {
      starpowerScore = Math.min(10, 5 + (castMetadata.top_3_cast_avg / 8));
    } else if (castMetadata.avg_cast_popularity) {
      starpowerScore = Math.min(10, 5 + (castMetadata.avg_cast_popularity / 6));
    }
    
    const castCount = castMetadata.cast_count || 0;
    const ensembleBonus = castCount >= 10 ? 0.3 : castCount >= 5 ? 0.15 : 0;
    starpowerScore = Math.min(10, starpowerScore + ensembleBonus);
    
    const weight = CONFIG.CAST_WEIGHT;
    totalScore += starpowerScore * weight;
    totalWeight += weight;
  }

  // 4. FRESHNESS (10%)
  let freshnessScore = 5.0;
  
  if (movie.release_date) {
    const releaseYear = new Date(movie.release_date).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - releaseYear;
    
    if (age <= 0) freshnessScore = 8.5;
    else if (age === 1) freshnessScore = 8.0;
    else if (age === 2) freshnessScore = 7.5;
    else if (age <= 5) freshnessScore = 7.0 - (age - 2) * 0.3;
    else if (age <= 10) freshnessScore = 6.0 - (age - 5) * 0.2;
    else if (age <= 20) freshnessScore = 5.0 - (age - 10) * 0.1;
    else freshnessScore = Math.max(3.0, 4.0 - (age - 20) * 0.05);
    
    if (age <= 2 && movie.popularity > 50) {
      freshnessScore = Math.min(10, freshnessScore + 0.5);
    }
  }
  
  const weight = CONFIG.FRESHNESS_WEIGHT;
  totalScore += freshnessScore * weight;
  totalWeight += weight;

  // 5. ENGAGEMENT (5%)
  const popularitySignal = Math.min(10, Math.log10((movie.popularity || 1) + 1) * 2);
  const voteSignal = Math.min(10, Math.log10((movie.vote_count || 1) + 1) * 1.5);
  const engagementScore = (popularitySignal + voteSignal) / 2;
  
  const engagementWeight = CONFIG.ENGAGEMENT_WEIGHT;
  totalScore += engagementScore * engagementWeight;
  totalWeight += engagementWeight;

  // FINAL
  let ffRating = totalWeight > 0 ? totalScore / totalWeight : 5.0;
  
  let confidencePenalty = 1.0;
  const hasExternalRatings = externalRatings && 
    (externalRatings.imdb_rating || externalRatings.rt_rating);
  
  if (!hasExternalRatings) {
    const voteCount = movie.vote_count || 0;
    if (voteCount < 20) confidencePenalty = 0.6;
    else if (voteCount < 100) confidencePenalty = 0.75;
    else if (voteCount < 500) confidencePenalty = 0.85;
    else confidencePenalty = 0.95;
  }
  
  ffRating *= confidencePenalty;
  ffRating = Math.max(1.0, Math.min(10.0, ffRating));
  ffRating = Math.round(ffRating * 10) / 10;

  return {
    rating: ffRating,
    confidence: Math.round(confidencePenalty * 100)
  };
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function fetchAllMovieData() {
  console.log('📦 Fetching all movie data in parallel...\n');

  try {
    // Helper to fetch all rows with pagination
    const fetchAllRows = async (table, select, batchSize = 1000) => {
      let allData = [];
      let from = 0;
      
      while (true) {
        const { data, error } = await supabase
          .from(table)
          .select(select)
          .range(from, from + batchSize - 1);
        
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allData = allData.concat(data);
        if (data.length < batchSize) break; // No more data
        from += batchSize;
      }
      
      return allData;
    };

    // Fetch movies (these have is_valid filter)
    const { data: movies, error: moviesError } = await supabase
      .from('movies')
      .select('id, tmdb_id, title, runtime, vote_average, vote_count, popularity, release_date, is_valid, budget, original_language, director_popularity')
      .eq('is_valid', true)
      .limit(10000);

    if (moviesError) throw moviesError;

    // Fetch junction tables (these need full pagination)
    const [movieGenres, movieKeywords, allKeywords, ratingsExternal, castMetadata] = await Promise.all([
      fetchAllRows('movie_genres', 'movie_id, genre_id'),
      fetchAllRows('movie_keywords', 'movie_id, keyword_id'),
      fetchAllRows('keywords', 'id, name'),
      fetchAllRows('ratings_external', 'movie_id, imdb_rating, imdb_votes, rt_rating, metacritic_score'),
      fetchAllRows('movie_cast_metadata', 'movie_id, avg_cast_popularity, max_cast_popularity, top_3_cast_avg, cast_count')
    ]);

    const genreMap = new Map();
    const keywordMap = new Map();
    const ratingsMap = new Map();
    const castMap = new Map();

    for (const mg of (movieGenres || [])) {
      if (!genreMap.has(mg.movie_id)) genreMap.set(mg.movie_id, []);
      genreMap.get(mg.movie_id).push(mg.genre_id);
    }

    // Build keyword map from IDs
    const keywordIdToName = new Map();
    for (const k of (allKeywords || [])) {
      keywordIdToName.set(k.id, { name: k.name });
    }

    for (const mk of (movieKeywords || [])) {
      if (!keywordMap.has(mk.movie_id)) keywordMap.set(mk.movie_id, []);
      const keyword = keywordIdToName.get(mk.keyword_id);
      if (keyword) keywordMap.get(mk.movie_id).push(keyword);
    }

    for (const r of (ratingsExternal || [])) {
      ratingsMap.set(r.movie_id, r);
    }

    for (const c of (castMetadata || [])) {
      castMap.set(c.movie_id, c);
    }

    console.log(`✅ ${movies.length} valid movies`);
    console.log(`✅ ${genreMap.size} movies with genres`);
    console.log(`✅ ${keywordMap.size} movies with keywords`);
    console.log(`✅ ${ratingsMap.size} movies with external ratings`);
    console.log(`✅ ${castMap.size} movies with cast metadata\n`);

    return { movies, genreMap, keywordMap, ratingsMap, castMap };
  } catch (error) {
    console.error('❌ Error fetching data:', error.message);
    throw error;
  }
}



// ============================================================================
// MAIN SCORING PIPELINE
// ============================================================================

async function calculateMovieScores() {
  console.log('🎬 FeelFlick Movie Scoring Engine - Production Grade (FIXED)\n');
  console.log('='.repeat(70));
  console.log('\n');

  const startTime = Date.now();
  
  try {
    const { movies, genreMap, keywordMap, ratingsMap, castMap } = await fetchAllMovieData();

    if (movies.length === 0) {
      console.log('⚠️  No valid movies found to score');
      return;
    }

    let updated = 0;
    let errors = 0;
    const updates = [];

    console.log('🧮 Calculating scores...\n');

    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];
      
      try {
        const genres = genreMap.get(movie.id) || [];
        const keywords = keywordMap.get(movie.id) || [];
        const externalRatings = ratingsMap.get(movie.id);
        const castMeta = castMap.get(movie.id);

        // Calculate all scores
        const genreScores = calculateGenreScores(genres, movie.runtime, movie.vote_average);
        const qualityScore = calculateQualityScore(movie, externalRatings);
        const vfxLevel = calculateVFXLevel(movie, genres, keywords);
        const cultStatus = calculateCultStatus(movie, keywords, externalRatings, qualityScore); // FIXED: Pass quality
        const starpower = calculateStarpower(castMeta, movie); // FIXED: Pass movie for director
        const ffResult = calculateFFRating(movie, externalRatings, castMeta);

        // Map scores to legacy enums
        const vfxEnum = scoreToVFXEnum(vfxLevel);
        const starpowerEnum = scoreToStarpowerEnum(starpower);

        updates.push({
          id: movie.id,
          
          // Core FeelFlick rating
          ff_rating: ffResult.rating,
          ff_confidence: ffResult.confidence,
          
          // Genre-based mood scores
          pacing_score: genreScores.pacing,
          intensity_score: genreScores.intensity,
          emotional_depth_score: genreScores.emotional_depth,
          
          // Derived quality metrics
          quality_score: qualityScore,
          vfx_level_score: vfxLevel,
          cult_status_score: cultStatus,
          starpower_score: starpower,
          
          // Legacy enum fields (for backward compatibility)
          vfx_level: vfxEnum,
          star_power: starpowerEnum,
          cult_status: cultStatus >= 50, // Boolean for legacy field
          
          // FIXED: Set has_scores flag
          has_scores: true,
          last_scored_at: new Date().toISOString()
        });

        // Batch upsert
        if (updates.length >= CONFIG.BATCH_SIZE) {
          const { error: batchError } = await supabase
            .from('movies')
            .upsert(updates);

          if (batchError) {
            console.error(`❌ Batch error:`, batchError.message);
            errors++;
          } else {
            updated += updates.length;
          }

          if (updated % CONFIG.LOG_INTERVAL === 0 || updated === movies.length) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            const rate = (updated / (Date.now() - startTime) * 1000).toFixed(1);
            const pct = ((updated / movies.length) * 100).toFixed(1);
            console.log(`  ✓ ${updated.toLocaleString()}/${movies.length.toLocaleString()} (${pct}%) • ${rate} movies/sec • ${elapsed}s elapsed`);
          }

          updates.length = 0;
        }
      } catch (error) {
        console.error(`❌ Error scoring movie ${movie.id}:`, error.message);
        errors++;
      }
    }

    // Final batch
    if (updates.length > 0) {
      const { error: batchError } = await supabase
        .from('movies')
        .upsert(updates);

      if (!batchError) {
        updated += updates.length;
      } else {
        errors++;
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const avgRate = (updated / (Date.now() - startTime) * 1000).toFixed(1);

    console.log('\n' + '='.repeat(70));
    console.log('✨ SCORING COMPLETE');
    console.log('='.repeat(70));
    console.log(`\n📊 Results:`);
    console.log(`   Total movies: ${movies.length.toLocaleString()}`);
    console.log(`   Successfully scored: ${updated.toLocaleString()}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Success rate: ${((updated / movies.length) * 100).toFixed(1)}%`);
    console.log(`\n⏱️  Performance:`);
    console.log(`   Total time: ${totalTime}s`);
    console.log(`   Average rate: ${avgRate} movies/second`);
    console.log(`\n🎯 Scores calculated:`);
    console.log(`   ✓ ff_rating (0-10) - FeelFlick's proprietary quality score`);
    console.log(`   ✓ ff_confidence (0-100) - statistical confidence level`);
    console.log(`   ✓ quality_score (0-100) - FIXED: no double penalty`);
    console.log(`   ✓ cult_status_score (0-100) - FIXED: uses raw ratings`);
    console.log(`   ✓ starpower_score (0-100) - ENHANCED: includes director`);
    console.log(`   ✓ vfx_level_score (0-100) - ENHANCED: uses budget`);
    console.log(`   ✓ has_scores flag - FIXED: now set to true`);
    console.log('\n' + '='.repeat(70) + '\n');

    // Sample results
    console.log('📋 Sample scored movies:\n');
    const { data: samples } = await supabase
      .from('movies')
      .select('title, ff_rating, ff_confidence, quality_score, starpower_score, cult_status_score')
      .not('ff_rating', 'is', null)
      .order('ff_rating', { ascending: false })
      .limit(5);

    if (samples && samples.length > 0) {
      samples.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.title}`);
        console.log(`      FF: ${m.ff_rating}/10 (${m.ff_confidence}% conf) | Quality: ${m.quality_score}/100`);
        console.log(`      Starpower: ${m.starpower_score}/100 | Cult: ${m.cult_status_score}/100\n`);
      });
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// ============================================================================
// ENTRY POINT
// ============================================================================

if (require.main === module) {
  calculateMovieScores()
    .then(() => {
      console.log('✅ Process complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Process failed:', error);
      process.exit(1);
    });
}

module.exports = { calculateMovieScores };
