// scripts/phase1/07-calculate-movie-scores-v2.js
// 
// ============================================================================
// FEELFLICK MOVIE SCORING ENGINE V2 - PRODUCTION GRADE
// ============================================================================
// 
// KEY IMPROVEMENTS OVER V1:
// ✓ Pure ff_rating - only quality signals (removed starpower, freshness, engagement)
// ✓ Genre-normalized rating - scores relative to genre peers
// ✓ Discovery potential - dedicated score for hidden gems detection
// ✓ Accessibility score - how "easy" is this to watch?
// ✓ Enhanced mood scores - keyword-based adjustments
// ✓ Dialogue density & attention demand - computed from signals
// ✓ Director style signatures - for known auteurs
// ✓ Polarization score - critic vs audience divergence
//
// NEW FIELDS ADDED:
// - ff_rating_genre_normalized (NUMERIC 0-10)
// - discovery_potential (INTEGER 0-100)
// - accessibility_score (INTEGER 0-100)
// - polarization_score (INTEGER 0-100)
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
  
  // ff_rating weights (V2: PURE QUALITY ONLY)
  FF_WEIGHTS: {
    IMDB: 0.40,
    RT: 0.25,
    METACRITIC: 0.20,
    TMDB: 0.15
  }
};

// ============================================================================
// GENRE STATISTICS (Pre-computed from typical movie databases)
// These represent average ratings and standard deviations per genre
// Used for genre-normalized scoring
// ============================================================================

const GENRE_STATS = {
  28:    { name: 'Action',          mean: 6.2, stdDev: 1.0 },
  12:    { name: 'Adventure',       mean: 6.4, stdDev: 1.0 },
  16:    { name: 'Animation',       mean: 6.8, stdDev: 1.1 },
  35:    { name: 'Comedy',          mean: 6.1, stdDev: 1.1 },
  80:    { name: 'Crime',           mean: 6.5, stdDev: 1.1 },
  99:    { name: 'Documentary',     mean: 7.2, stdDev: 1.0 },
  18:    { name: 'Drama',           mean: 6.9, stdDev: 1.1 },
  10751: { name: 'Family',          mean: 6.3, stdDev: 1.0 },
  14:    { name: 'Fantasy',         mean: 6.3, stdDev: 1.1 },
  36:    { name: 'History',         mean: 7.0, stdDev: 1.0 },
  27:    { name: 'Horror',          mean: 5.8, stdDev: 1.2 },
  10402: { name: 'Music',           mean: 6.7, stdDev: 1.1 },
  9648:  { name: 'Mystery',         mean: 6.5, stdDev: 1.1 },
  10749: { name: 'Romance',         mean: 6.4, stdDev: 1.1 },
  878:   { name: 'Science Fiction', mean: 6.4, stdDev: 1.2 },
  10770: { name: 'TV Movie',        mean: 5.8, stdDev: 1.2 },
  53:    { name: 'Thriller',        mean: 6.3, stdDev: 1.1 },
  10752: { name: 'War',             mean: 7.0, stdDev: 1.0 },
  37:    { name: 'Western',         mean: 6.6, stdDev: 1.1 }
};

// ============================================================================
// GENRE-BASED MOOD SCORING (Base values)
// ============================================================================

const GENRE_MOOD_SCORES = {
  pacing: {
    28: 8, 12: 7, 16: 6, 35: 7, 80: 6, 99: 4, 18: 4, 10751: 6, 14: 6,
    36: 3, 27: 7, 10402: 5, 9648: 5, 10749: 5, 878: 6, 10770: 5, 53: 7,
    10752: 5, 37: 5
  },
  intensity: {
    28: 8, 12: 6, 16: 4, 35: 3, 80: 7, 99: 4, 18: 5, 10751: 2, 14: 5,
    36: 4, 27: 9, 10402: 3, 9648: 6, 10749: 3, 878: 6, 10770: 4, 53: 8,
    10752: 8, 37: 5
  },
  emotional_depth: {
    28: 3, 12: 4, 16: 6, 35: 3, 80: 6, 99: 7, 18: 9, 10751: 5, 14: 5,
    36: 7, 27: 4, 10402: 6, 9648: 5, 10749: 7, 878: 5, 10770: 4, 53: 4,
    10752: 7, 37: 5
  }
};

// ============================================================================
// KEYWORD-BASED MOOD MODIFIERS
// These adjust the base genre scores based on specific keywords
// ============================================================================

const KEYWORD_MOOD_MODIFIERS = {
  // Pacing modifiers (positive = faster, negative = slower)
  'slow burn': { pacing: -3, attention: 15 },
  'fast-paced': { pacing: 2, attention: -10 },
  'atmospheric': { pacing: -2, depth: 1, attention: 10 },
  'action packed': { pacing: 3, intensity: 1 },
  'meditative': { pacing: -3, depth: 2, attention: 15 },
  'non-stop action': { pacing: 3, intensity: 2 },
  'leisurely paced': { pacing: -2 },
  'brisk': { pacing: 1 },
  
  // Intensity modifiers
  'suspenseful': { intensity: 2, attention: 10 },
  'tense': { intensity: 2 },
  'lighthearted': { intensity: -2, depth: -1 },
  'disturbing': { intensity: 3, depth: 1 },
  'feel-good': { intensity: -2, depth: -1 },
  'violent': { intensity: 2 },
  'gore': { intensity: 3 },
  'graphic violence': { intensity: 3 },
  'psychological': { intensity: 1, depth: 2, attention: 15 },
  'dark': { intensity: 1, depth: 1 },
  'gritty': { intensity: 1 },
  'brutal': { intensity: 2 },
  'harrowing': { intensity: 2, depth: 1 },
  'heartwarming': { intensity: -1, depth: 1 },
  'uplifting': { intensity: -1 },
  'cozy': { intensity: -2 },
  
  // Depth modifiers
  'character study': { depth: 3, pacing: -1, attention: 15 },
  'thought-provoking': { depth: 2, attention: 15 },
  'philosophical': { depth: 3, attention: 20 },
  'popcorn': { depth: -2, attention: -15 },
  'mindless': { depth: -2, attention: -20 },
  'introspective': { depth: 2, pacing: -1 },
  'emotional': { depth: 2 },
  'tearjerker': { depth: 2, intensity: 1 },
  'profound': { depth: 3, attention: 15 },
  'existential': { depth: 3, attention: 20 },
  'coming of age': { depth: 2 },
  'family drama': { depth: 2 },
  'social commentary': { depth: 2, attention: 10 },
  'political': { depth: 1, attention: 10 },
  
  // Attention/complexity modifiers
  'complex plot': { attention: 20, depth: 1 },
  'nonlinear': { attention: 20, pacing: -1 },
  'nonlinear timeline': { attention: 25 },
  'multiple storylines': { attention: 15 },
  'twist ending': { attention: 10 },
  'unreliable narrator': { attention: 20, depth: 1 },
  'puzzle': { attention: 20 },
  'cerebral': { attention: 20, depth: 2 },
  'experimental': { attention: 25, depth: 1 },
  'avant garde': { attention: 25, depth: 1 },
  'arthouse': { attention: 20, depth: 2, pacing: -1 },
  'art film': { attention: 20, depth: 2 },
  'surreal': { attention: 20, depth: 1 },
  'ambiguous': { attention: 15, depth: 1 },
  'open ending': { attention: 10 },
  'simple': { attention: -15 },
  'straightforward': { attention: -10 },
  
  // Dialogue modifiers
  'dialogue-driven': { dialogue: 25, pacing: -1 },
  'witty dialogue': { dialogue: 20 },
  'fast dialogue': { dialogue: 15, pacing: 1 },
  'minimal dialogue': { dialogue: -25 },
  'visual storytelling': { dialogue: -20 },
  'silent': { dialogue: -30 },
  'talky': { dialogue: 20, pacing: -1 }
};

// ============================================================================
// DIRECTOR STYLE SIGNATURES
// Known auteurs with distinct styles that override/blend with calculated scores
// ============================================================================

const DIRECTOR_STYLES = {
  'andrei tarkovsky': { pacing: 2, intensity: 3, depth: 10, attention: 85, dialogue: 30 },
  'terrence malick': { pacing: 2, intensity: 3, depth: 9, attention: 80, dialogue: 25 },
  'david lynch': { pacing: 4, intensity: 7, depth: 8, attention: 90, dialogue: 50 },
  'stanley kubrick': { pacing: 4, intensity: 6, depth: 9, attention: 75, dialogue: 55 },
  'wong kar-wai': { pacing: 3, intensity: 4, depth: 9, attention: 70, dialogue: 40 },
  'ingmar bergman': { pacing: 3, intensity: 5, depth: 10, attention: 75, dialogue: 70 },
  'michael bay': { pacing: 9, intensity: 8, depth: 2, attention: 25, dialogue: 35 },
  'christopher nolan': { pacing: 6, intensity: 7, depth: 7, attention: 70, dialogue: 60 },
  'quentin tarantino': { pacing: 6, intensity: 8, depth: 5, attention: 55, dialogue: 85 },
  'denis villeneuve': { pacing: 4, intensity: 6, depth: 8, attention: 65, dialogue: 45 },
  'paul thomas anderson': { pacing: 4, intensity: 6, depth: 9, attention: 70, dialogue: 75 },
  'alfonso cuarón': { pacing: 5, intensity: 6, depth: 8, attention: 60, dialogue: 50 },
  'yorgos lanthimos': { pacing: 4, intensity: 6, depth: 8, attention: 75, dialogue: 55 },
  'ari aster': { pacing: 3, intensity: 9, depth: 7, attention: 70, dialogue: 45 },
  'robert eggers': { pacing: 4, intensity: 7, depth: 7, attention: 70, dialogue: 55 },
  'bong joon-ho': { pacing: 6, intensity: 7, depth: 8, attention: 60, dialogue: 55 },
  'park chan-wook': { pacing: 5, intensity: 8, depth: 7, attention: 65, dialogue: 50 },
  'hayao miyazaki': { pacing: 5, intensity: 4, depth: 8, attention: 45, dialogue: 50 },
  'wes anderson': { pacing: 6, intensity: 3, depth: 6, attention: 50, dialogue: 70 },
  'coen brothers': { pacing: 5, intensity: 5, depth: 6, attention: 55, dialogue: 70 },
  'joel coen': { pacing: 5, intensity: 5, depth: 6, attention: 55, dialogue: 70 },
  'ethan coen': { pacing: 5, intensity: 5, depth: 6, attention: 55, dialogue: 70 },
  'martin scorsese': { pacing: 6, intensity: 7, depth: 7, attention: 55, dialogue: 65 },
  'steven spielberg': { pacing: 7, intensity: 6, depth: 6, attention: 40, dialogue: 55 },
  'ridley scott': { pacing: 6, intensity: 7, depth: 5, attention: 45, dialogue: 50 },
  'guillermo del toro': { pacing: 5, intensity: 6, depth: 7, attention: 50, dialogue: 50 },
  'darren aronofsky': { pacing: 5, intensity: 8, depth: 8, attention: 70, dialogue: 50 },
  'gaspar noé': { pacing: 4, intensity: 9, depth: 6, attention: 75, dialogue: 40 },
  'lars von trier': { pacing: 4, intensity: 8, depth: 8, attention: 70, dialogue: 60 },
  'richard linklater': { pacing: 4, intensity: 3, depth: 7, attention: 50, dialogue: 85 },
  'sofia coppola': { pacing: 3, intensity: 3, depth: 7, attention: 55, dialogue: 45 },
  'spike jonze': { pacing: 5, intensity: 4, depth: 8, attention: 55, dialogue: 60 },
  'charlie kaufman': { pacing: 5, intensity: 5, depth: 9, attention: 80, dialogue: 70 },
  'akira kurosawa': { pacing: 5, intensity: 6, depth: 8, attention: 55, dialogue: 50 },
  'alfred hitchcock': { pacing: 6, intensity: 8, depth: 5, attention: 50, dialogue: 55 },
  'francis ford coppola': { pacing: 5, intensity: 7, depth: 8, attention: 55, dialogue: 60 },
  'sergio leone': { pacing: 4, intensity: 7, depth: 6, attention: 50, dialogue: 35 },
  'alejandro gonzález iñárritu': { pacing: 5, intensity: 7, depth: 8, attention: 65, dialogue: 55 },
  'david fincher': { pacing: 6, intensity: 7, depth: 6, attention: 60, dialogue: 60 },
  'spike lee': { pacing: 6, intensity: 6, depth: 7, attention: 55, dialogue: 70 },
  'greta gerwig': { pacing: 6, intensity: 4, depth: 7, attention: 45, dialogue: 75 },
  'barry jenkins': { pacing: 4, intensity: 5, depth: 9, attention: 55, dialogue: 55 },
  'chloé zhao': { pacing: 3, intensity: 4, depth: 8, attention: 55, dialogue: 45 },
  'kelly reichardt': { pacing: 2, intensity: 3, depth: 8, attention: 65, dialogue: 35 },
  'apichatpong weerasethakul': { pacing: 2, intensity: 2, depth: 8, attention: 80, dialogue: 25 },
  'michael haneke': { pacing: 3, intensity: 7, depth: 9, attention: 70, dialogue: 55 },
  'pedro almodóvar': { pacing: 5, intensity: 6, depth: 8, attention: 50, dialogue: 65 },
  'hirokazu kore-eda': { pacing: 3, intensity: 3, depth: 9, attention: 50, dialogue: 55 },
  'lee chang-dong': { pacing: 4, intensity: 5, depth: 9, attention: 60, dialogue: 55 },
  'asghar farhadi': { pacing: 5, intensity: 6, depth: 9, attention: 55, dialogue: 70 },
  'andrey zvyagintsev': { pacing: 3, intensity: 5, depth: 9, attention: 60, dialogue: 50 },
  'ruben östlund': { pacing: 5, intensity: 5, depth: 7, attention: 55, dialogue: 60 },
  'céline sciamma': { pacing: 4, intensity: 4, depth: 9, attention: 50, dialogue: 50 },
  'julia ducournau': { pacing: 5, intensity: 9, depth: 7, attention: 65, dialogue: 45 }
};

// ============================================================================
// VFX DETECTION KEYWORDS
// ============================================================================

const VFX_KEYWORDS = new Set([
  'cgi', 'visual effects', 'special effects', 'motion capture', 
  '3d', 'imax', 'animation', 'creature', 'monster', 'superhero',
  'alien', 'space', 'science fiction', 'fantasy world', 'vfx',
  'computer animation', 'digital effects', 'spectacle', 'disaster',
  'giant', 'dragon', 'magic', 'supernatural', 'futuristic',
  'post-apocalyptic', 'dystopia', 'robot', 'cyborg', 'transforming'
]);

// ============================================================================
// CULT DETECTION KEYWORDS
// ============================================================================

const CULT_KEYWORDS = new Set([
  'cult', 'underground', 'indie', 'arthouse', 'experimental',
  'midnight movie', 'controversial', 'banned', 'obscure', 'b movie',
  'grindhouse', 'exploitation', 'transgressive', 'avant garde',
  'independent film', 'art film', 'cult classic', 'cult film',
  'surreal', 'psychedelic', 'subversive', 'unconventional'
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
// FF_RATING V2: PURE QUALITY SCORE (0-10)
// Only measures how "good" the film is - no starpower, freshness, engagement
// ============================================================================

function calculateFFRating(movie, externalRatings) {
  let totalScore = 0;
  let totalWeight = 0;

  // 1. IMDB (40% weight)
  if (externalRatings?.imdb_rating) {
    const imdbScore = externalRatings.imdb_rating;
    const voteCount = externalRatings.imdb_votes || 0;
    
    // Confidence based on vote count (logarithmic scale)
    const confidence = Math.min(1.0, Math.log10(voteCount + 1) / 5);
    const actualWeight = CONFIG.FF_WEIGHTS.IMDB * (0.5 + 0.5 * confidence);
    
    totalScore += imdbScore * actualWeight;
    totalWeight += actualWeight;
  }

  // 2. Rotten Tomatoes (25% weight)
  if (externalRatings?.rt_rating) {
    const rtPercent = parseInt(externalRatings.rt_rating);
    if (!isNaN(rtPercent)) {
      const rtScore = rtPercent / 10; // Convert 0-100 to 0-10
      totalScore += rtScore * CONFIG.FF_WEIGHTS.RT;
      totalWeight += CONFIG.FF_WEIGHTS.RT;
    }
  }

  // 3. Metacritic (20% weight)
  if (externalRatings?.metacritic_score) {
    const metaScore = externalRatings.metacritic_score / 10; // Convert 0-100 to 0-10
    totalScore += metaScore * CONFIG.FF_WEIGHTS.METACRITIC;
    totalWeight += CONFIG.FF_WEIGHTS.METACRITIC;
  }

  // 4. TMDB Community (15% weight)
  if (movie.vote_average) {
    const tmdbScore = movie.vote_average;
    const voteCount = movie.vote_count || 0;
    
    // Confidence based on vote count
    const confidence = Math.min(1.0, Math.log10(voteCount + 1) / 4);
    const actualWeight = CONFIG.FF_WEIGHTS.TMDB * (0.4 + 0.6 * confidence);
    
    totalScore += tmdbScore * actualWeight;
    totalWeight += actualWeight;
  }

  // Calculate weighted average
  let ffRating = totalWeight > 0 ? totalScore / totalWeight : 5.0;

  // Confidence penalty for films with no external ratings
  let confidence = 100;
  const hasExternalRatings = externalRatings && 
    (externalRatings.imdb_rating || externalRatings.rt_rating || externalRatings.metacritic_score);
  
  if (!hasExternalRatings) {
    const voteCount = movie.vote_count || 0;
    if (voteCount < 20) {
      confidence = 40;
      ffRating *= 0.7;
    } else if (voteCount < 100) {
      confidence = 60;
      ffRating *= 0.8;
    } else if (voteCount < 500) {
      confidence = 75;
      ffRating *= 0.9;
    } else {
      confidence = 85;
      ffRating *= 0.95;
    }
  }

  // Clamp to valid range
  ffRating = Math.max(1.0, Math.min(10.0, ffRating));
  ffRating = Math.round(ffRating * 10) / 10;

  return { rating: ffRating, confidence };
}

// ============================================================================
// GENRE-NORMALIZED RATING (0-10)
// How good is this film RELATIVE TO ITS GENRE?
// A 7.0 horror film is exceptional, a 7.0 drama is average
// ============================================================================

function calculateGenreNormalizedRating(ffRating, primaryGenreId) {
  const stats = GENRE_STATS[primaryGenreId];
  
  if (!stats) {
    // No stats for this genre, return raw rating
    return ffRating;
  }
  
  // Calculate z-score: how many standard deviations from genre mean?
  const zScore = (ffRating - stats.mean) / stats.stdDev;
  
  // Rescale to 0-10 scale centered at 6.5
  // z-score of 0 = genre average = 6.5
  // z-score of +2 = exceptional = ~9.5
  // z-score of -2 = poor = ~3.5
  const normalized = 6.5 + (zScore * 1.5);
  
  return Math.round(Math.max(1, Math.min(10, normalized)) * 10) / 10;
}

// ============================================================================
// QUALITY SCORE (0-100)
// Simplified version without double-penalty
// ============================================================================

function calculateQualityScore(movie, externalRatings) {
  let score = 0;
  let weight = 0;

  // IMDB rating (40% weight)
  if (externalRatings?.imdb_rating) {
    const imdbNorm = (externalRatings.imdb_rating / 10) * 100;
    const voteCount = externalRatings.imdb_votes || 0;
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

  const qualityScore = weight > 0 ? score / weight : 50;
  return Math.round(qualityScore);
}

// ============================================================================
// MOOD SCORES V2: KEYWORD-ENHANCED (pacing, intensity, depth 1-10)
// ============================================================================

function calculateMoodScores(movie, genres, keywords) {
  // Start with genre base scores
  let pacing = 0, intensity = 0, depth = 0;
  let dialogueDensity = 50, attentionDemand = 50;
  
  if (!genres || genres.length === 0) {
    return {
      pacing: 5,
      intensity: 5,
      emotional_depth: 5,
      dialogue_density: 50,
      attention_demand: 50
    };
  }

  // Calculate base from genres
  for (const genreId of genres) {
    pacing += GENRE_MOOD_SCORES.pacing[genreId] || 5;
    intensity += GENRE_MOOD_SCORES.intensity[genreId] || 5;
    depth += GENRE_MOOD_SCORES.emotional_depth[genreId] || 5;
  }
  
  pacing /= genres.length;
  intensity /= genres.length;
  depth /= genres.length;

  // Apply keyword modifiers
  const keywordNames = keywords.map(k => 
    typeof k === 'string' ? k.toLowerCase() : (k.name || '').toLowerCase()
  );
  
  for (const kw of keywordNames) {
    for (const [pattern, mods] of Object.entries(KEYWORD_MOOD_MODIFIERS)) {
      if (kw.includes(pattern)) {
        if (mods.pacing) pacing += mods.pacing;
        if (mods.intensity) intensity += mods.intensity;
        if (mods.depth) depth += mods.depth;
        if (mods.dialogue) dialogueDensity += mods.dialogue;
        if (mods.attention) attentionDemand += mods.attention;
      }
    }
  }

  // Runtime adjustment
  if (movie.runtime) {
    if (movie.runtime < 90) {
      pacing += 1;
      attentionDemand -= 10;
    }
    if (movie.runtime > 150) {
      pacing -= 1;
      attentionDemand += 15;
    }
    if (movie.runtime > 180) {
      attentionDemand += 15;
    }
  }

  // Director style override (30% blend if known director)
  if (movie.director_name) {
    const directorKey = movie.director_name.toLowerCase();
    const directorStyle = DIRECTOR_STYLES[directorKey];
    
    if (directorStyle) {
      // Blend 70% calculated + 30% director signature
      pacing = pacing * 0.7 + directorStyle.pacing * 0.3;
      intensity = intensity * 0.7 + directorStyle.intensity * 0.3;
      depth = depth * 0.7 + directorStyle.depth * 0.3;
      dialogueDensity = dialogueDensity * 0.6 + directorStyle.dialogue * 0.4;
      attentionDemand = attentionDemand * 0.6 + directorStyle.attention * 0.4;
    }
  }

  // Quality adjustment for emotional depth
  if (movie.vote_average) {
    if (movie.vote_average >= 8.0) depth = Math.min(10, depth + 1);
    if (movie.vote_average < 5.5) depth = Math.max(1, depth - 1);
  }

  return {
    pacing: Math.round(Math.max(1, Math.min(10, pacing))),
    intensity: Math.round(Math.max(1, Math.min(10, intensity))),
    emotional_depth: Math.round(Math.max(1, Math.min(10, depth))),
    dialogue_density: Math.round(Math.max(0, Math.min(100, dialogueDensity))),
    attention_demand: Math.round(Math.max(0, Math.min(100, attentionDemand)))
  };
}

// ============================================================================
// VFX LEVEL (0-100)
// ============================================================================

function calculateVFXLevel(movie, genres, keywords) {
  let vfxScore = 0;

  // Genre base scores
  const vfxGenres = {
    878: 70,  // Science Fiction
    14: 60,   // Fantasy
    28: 50,   // Action
    12: 45,   // Adventure
    16: 80    // Animation (always has "VFX" in some sense)
  };

  for (const genreId of genres) {
    if (vfxGenres[genreId]) {
      vfxScore = Math.max(vfxScore, vfxGenres[genreId]);
    }
  }

  // Keyword boost
  const keywordNames = keywords.map(k => 
    typeof k === 'string' ? k.toLowerCase() : (k.name || '').toLowerCase()
  );
  
  const vfxMatches = keywordNames.filter(k => 
    Array.from(VFX_KEYWORDS).some(vfxKw => k.includes(vfxKw))
  ).length;

  if (vfxMatches > 0) {
    vfxScore += Math.min(30, vfxMatches * 10);
  }

  // Budget proxy
  if (movie.budget && movie.budget > 0) {
    if (movie.budget >= 150000000) vfxScore += 20;
    else if (movie.budget >= 100000000) vfxScore += 15;
    else if (movie.budget >= 50000000) vfxScore += 10;
    else if (movie.budget >= 20000000) vfxScore += 5;
  } else {
    // Fallback: popularity + vote count as proxy for big production
    if (movie.popularity > 50 && movie.vote_count > 5000) {
      vfxScore += 10;
    }
  }

  return Math.min(100, Math.round(vfxScore));
}

// ============================================================================
// CULT STATUS (0-100)
// ============================================================================

function calculateCultStatus(movie, keywords, externalRatings, qualityScore) {
  let cultScore = 0;

  // Keyword detection
  const keywordNames = keywords.map(k => 
    typeof k === 'string' ? k.toLowerCase() : (k.name || '').toLowerCase()
  );
  
  const cultMatches = keywordNames.filter(k =>
    Array.from(CULT_KEYWORDS).some(cultKw => k.includes(cultKw))
  ).length;

  if (cultMatches > 0) {
    cultScore += Math.min(40, cultMatches * 15);
  }

  // Use raw quality for hidden gem detection
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

  // Age factor: older films with sustained engagement = cult following
  if (movie.release_date) {
    const releaseYear = new Date(movie.release_date).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - releaseYear;
    
    if (age > 30 && movie.vote_count > 500) {
      cultScore += 20;
    } else if (age > 20 && movie.vote_count > 1000) {
      cultScore += 15;
    }
  }

  // World cinema boost
  if (movie.original_language && movie.original_language !== 'en' && rawQuality >= 65) {
    cultScore += 10;
  }

  return Math.min(100, Math.round(cultScore));
}

// ============================================================================
// STARPOWER (0-100)
// ============================================================================

function calculateStarpower(movie) {
  let score = 0;

  // Top 3 cast average (most important)
  if (movie.top3_cast_avg) {
    score += Math.min(45, movie.top3_cast_avg * 1.8);
  }

  // Max cast popularity (star ceiling)
  if (movie.max_cast_popularity) {
    score += Math.min(20, movie.max_cast_popularity * 1.2);
  }

  // Average cast popularity (ensemble quality)
  if (movie.avg_cast_popularity) {
    score += Math.min(10, movie.avg_cast_popularity * 1.5);
  }

  // Director popularity bonus
  if (movie.director_popularity && movie.director_popularity > 0) {
    score += Math.min(25, movie.director_popularity * 1.5);
  }

  return Math.min(100, Math.round(score));
}

// ============================================================================
// POLARIZATION SCORE (0-100) - NEW
// Measures how divisive/controversial a film is
// High score = critics and audiences disagree, or very split opinions
// ============================================================================

function calculatePolarization(movie, externalRatings) {
  let polarization = 0;

  // Critic vs Audience gap (RT critics vs IMDB/TMDB)
  if (externalRatings?.rt_rating && movie.vote_average) {
    const rtScore = parseInt(externalRatings.rt_rating) / 10; // 0-10 scale
    const audienceScore = movie.vote_average;
    const gap = Math.abs(rtScore - audienceScore);
    
    // Large gap = polarizing
    if (gap >= 3) polarization += 40;
    else if (gap >= 2) polarization += 25;
    else if (gap >= 1.5) polarization += 15;
  }

  // Metacritic vs IMDB gap
  if (externalRatings?.metacritic_score && externalRatings?.imdb_rating) {
    const metaScore = externalRatings.metacritic_score / 10; // 0-10 scale
    const imdbScore = externalRatings.imdb_rating;
    const gap = Math.abs(metaScore - imdbScore);
    
    if (gap >= 2.5) polarization += 30;
    else if (gap >= 1.5) polarization += 18;
    else if (gap >= 1) polarization += 10;
  }

  // Vote variance proxy: high votes + middling score often = divisive
  // (People bother to vote on controversial films)
  if (movie.vote_count > 10000 && movie.vote_average >= 5.5 && movie.vote_average <= 7.5) {
    polarization += 15;
  }

  // Genre-based polarization (horror, arthouse tend to be more divisive)
  // This would need genre data passed in - simplified version
  if (movie.primary_genre) {
    const divisiveGenres = ['Horror', 'Documentary', 'Animation'];
    if (divisiveGenres.includes(movie.primary_genre)) {
      polarization += 10;
    }
  }

  return Math.min(100, Math.round(polarization));
}

// ============================================================================
// DISCOVERY POTENTIAL (0-100) - NEW
// How likely is this film to be a delightful discovery for users?
// Used primarily for hidden gems row
// ============================================================================

function calculateDiscoveryPotential(movie, ffRating, genreNormalizedRating, cultStatus) {
  let score = 0;

  // Quality is baseline requirement (must be good to be a good discovery)
  const qualityFactor = Math.max(0, (ffRating - 6) / 4); // 0-1 scale, 6+ gets points
  score += qualityFactor * 25;

  // Genre outperformance (the real hidden gem signal)
  // If genre-normalized is higher than raw rating, it's underrated for its genre
  const genreOutperformance = Math.max(0, genreNormalizedRating - ffRating);
  score += genreOutperformance * 10;

  // Obscurity boost (inverse popularity)
  const maxPop = 100;
  const obscurityFactor = Math.max(0, 1 - (movie.popularity / maxPop));
  score += obscurityFactor * 20;

  // World cinema boost (non-English often overlooked)
  if (movie.original_language && movie.original_language !== 'en') {
    score += 15;
    
    // Extra boost for non-western languages
    const westernLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt'];
    if (!westernLanguages.includes(movie.original_language)) {
      score += 5;
    }
  }

  // Low vote count + high rating = underseen gem
  if (movie.vote_count < 5000 && ffRating >= 7) {
    score += 15;
  } else if (movie.vote_count < 10000 && ffRating >= 7.5) {
    score += 10;
  }

  // Cult status synergy (cult films are good discoveries)
  score += (cultStatus || 0) * 0.15;

  // Older quality films (classics that younger audiences may have missed)
  if (movie.release_date) {
    const releaseYear = new Date(movie.release_date).getFullYear();
    const age = new Date().getFullYear() - releaseYear;
    
    if (age > 20 && ffRating >= 7.5) {
      score += 10;
    } else if (age > 30 && ffRating >= 7) {
      score += 12;
    }
  }

  return Math.round(Math.min(100, score));
}

// ============================================================================
// ACCESSIBILITY SCORE (0-100) - NEW
// How "easy" is this film to watch?
// High = casual viewing, Low = requires focus/commitment
// ============================================================================

function calculateAccessibility(movie, genres, moodScores) {
  let accessibility = 50; // baseline

  // Runtime: shorter = more accessible
  if (movie.runtime) {
    if (movie.runtime < 90) accessibility += 18;
    else if (movie.runtime < 100) accessibility += 12;
    else if (movie.runtime < 110) accessibility += 6;
    else if (movie.runtime > 150) accessibility -= 15;
    else if (movie.runtime > 130) accessibility -= 8;
    else if (movie.runtime > 120) accessibility -= 4;
  }

  // Pacing: faster = more accessible (easier to stay engaged)
  const pacingBoost = (moodScores.pacing - 5) * 3;
  accessibility += pacingBoost;

  // Attention demand: inverse relationship
  if (moodScores.attention_demand) {
    accessibility -= (moodScores.attention_demand - 50) * 0.3;
  }

  // Extreme intensity can reduce accessibility
  if (moodScores.intensity >= 9) accessibility -= 10;
  if (moodScores.intensity >= 8) accessibility -= 5;

  // Language: English = more accessible (no subtitles for most users)
  if (movie.original_language === 'en') {
    accessibility += 10;
  } else {
    accessibility -= 5;
  }

  // Genre adjustments
  const easyGenres = [35, 10751, 16, 12]; // Comedy, Family, Animation, Adventure
  const hardGenres = [99, 36, 10752];      // Documentary, History, War
  
  for (const genreId of genres) {
    if (easyGenres.includes(genreId)) accessibility += 6;
    if (hardGenres.includes(genreId)) accessibility -= 4;
  }

  // Popularity as proxy for mainstream appeal
  if (movie.popularity > 50) accessibility += 8;
  else if (movie.popularity > 20) accessibility += 4;
  else if (movie.popularity < 5) accessibility -= 8;

  // High starpower = more accessible (familiar faces)
  if (movie.max_cast_popularity > 30) accessibility += 5;

  return Math.round(Math.max(0, Math.min(100, accessibility)));
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function fetchAllMovieData() {
  console.log('📦 Fetching all movie data...\n');

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
        if (data.length < batchSize) break;
        from += batchSize;
      }
      
      return allData;
    };

    // Fetch movies
    const { data: movies, error: moviesError } = await supabase
      .from('movies')
      .select(`
        id, tmdb_id, title, runtime, vote_average, vote_count, 
        popularity, release_date, is_valid, budget, 
        original_language, director_name, director_popularity,
        primary_genre, genres, keywords,
        avg_cast_popularity, max_cast_popularity, top3_cast_avg
      `)
      .eq('is_valid', true)
      .limit(10000);

    if (moviesError) throw moviesError;

    // Fetch related data in parallel
    const [movieGenres, ratingsExternal] = await Promise.all([
      fetchAllRows('movie_genres', 'movie_id, genre_id'),
      fetchAllRows('ratings_external', 'movie_id, imdb_rating, imdb_votes, rt_rating, metacritic_score')
    ]);

    // Build lookup maps
    const genreMap = new Map();
    for (const mg of (movieGenres || [])) {
      if (!genreMap.has(mg.movie_id)) genreMap.set(mg.movie_id, []);
      genreMap.get(mg.movie_id).push(mg.genre_id);
    }

    const ratingsMap = new Map();
    for (const r of (ratingsExternal || [])) {
      ratingsMap.set(r.movie_id, r);
    }

    console.log(`✅ ${movies.length} valid movies`);
    console.log(`✅ ${genreMap.size} movies with genres`);
    console.log(`✅ ${ratingsMap.size} movies with external ratings\n`);

    return { movies, genreMap, ratingsMap };
  } catch (error) {
    console.error('❌ Error fetching data:', error.message);
    throw error;
  }
}

// ============================================================================
// MAIN SCORING PIPELINE
// ============================================================================

async function calculateMovieScores() {
  console.log('🎬 FeelFlick Movie Scoring Engine V2\n');
  console.log('='.repeat(70));
  console.log('\n');

  const startTime = Date.now();
  
  try {
    const { movies, genreMap, ratingsMap } = await fetchAllMovieData();

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
        // Get related data
        const genres = genreMap.get(movie.id) || [];
        const externalRatings = ratingsMap.get(movie.id);
        
        // Parse keywords from JSONB
        let keywords = [];
        if (movie.keywords) {
          if (Array.isArray(movie.keywords)) {
            keywords = movie.keywords;
          } else if (typeof movie.keywords === 'object') {
            keywords = Object.values(movie.keywords);
          }
        }

        // Get primary genre ID for normalization
        let primaryGenreId = null;
        if (movie.primary_genre) {
          // Find genre ID from name
          for (const [id, stats] of Object.entries(GENRE_STATS)) {
            if (stats.name.toLowerCase() === movie.primary_genre.toLowerCase()) {
              primaryGenreId = parseInt(id);
              break;
            }
          }
        }
        // Fallback to first genre
        if (!primaryGenreId && genres.length > 0) {
          primaryGenreId = genres[0];
        }

        // ============================================
        // CALCULATE ALL SCORES
        // ============================================

        // Core quality rating (PURE - no starpower/freshness)
        const ffResult = calculateFFRating(movie, externalRatings);
        
        // Genre-normalized rating
        const genreNormalizedRating = calculateGenreNormalizedRating(
          ffResult.rating, 
          primaryGenreId
        );
        
        // Quality score (0-100)
        const qualityScore = calculateQualityScore(movie, externalRatings);
        
        // Mood scores (enhanced with keywords)
        const moodScores = calculateMoodScores(movie, genres, keywords);
        
        // VFX level
        const vfxLevel = calculateVFXLevel(movie, genres, keywords);
        
        // Cult status
        const cultStatus = calculateCultStatus(movie, keywords, externalRatings, qualityScore);
        
        // Starpower (kept separate from ff_rating now)
        const starpower = calculateStarpower(movie);
        
        // NEW: Polarization
        const polarization = calculatePolarization(movie, externalRatings);
        
        // NEW: Discovery potential
        const discoveryPotential = calculateDiscoveryPotential(
          movie, 
          ffResult.rating, 
          genreNormalizedRating, 
          cultStatus
        );
        
        // NEW: Accessibility
        const accessibility = calculateAccessibility(movie, genres, moodScores);

        // Legacy enum mappings
        const vfxEnum = scoreToVFXEnum(vfxLevel);
        const starpowerEnum = scoreToStarpowerEnum(starpower);

        // Build update object
        updates.push({
          id: movie.id,
          
          // Core ratings
          ff_rating: ffResult.rating,
          ff_confidence: ffResult.confidence,
          ff_rating_genre_normalized: genreNormalizedRating,
          
          // Mood dimensions
          pacing_score: moodScores.pacing,
          intensity_score: moodScores.intensity,
          emotional_depth_score: moodScores.emotional_depth,
          dialogue_density: moodScores.dialogue_density,
          attention_demand: moodScores.attention_demand,
          
          // Quality metrics
          quality_score: qualityScore,
          vfx_level_score: vfxLevel,
          cult_status_score: cultStatus,
          starpower_score: starpower,
          
          // NEW scores
          polarization_score: polarization,
          discovery_potential: discoveryPotential,
          accessibility_score: accessibility,
          
          // Legacy enum fields
          vfx_level: vfxEnum,
          star_power: starpowerEnum,
          cult_status: cultStatus >= 50,
          
          // Metadata
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
        console.error(`❌ Error scoring movie ${movie.id} (${movie.title}):`, error.message);
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
        console.error(`❌ Final batch error:`, batchError.message);
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
    console.log(`\n🎯 V2 Scores calculated:`);
    console.log(`   ✓ ff_rating (0-10) - PURE quality (no starpower/freshness)`);
    console.log(`   ✓ ff_rating_genre_normalized (0-10) - NEW: relative to genre peers`);
    console.log(`   ✓ discovery_potential (0-100) - NEW: hidden gem detection`);
    console.log(`   ✓ accessibility_score (0-100) - NEW: ease of watching`);
    console.log(`   ✓ polarization_score (0-100) - NEW: divisiveness`);
    console.log(`   ✓ dialogue_density (0-100) - ENHANCED: keyword-based`);
    console.log(`   ✓ attention_demand (0-100) - ENHANCED: keyword-based`);
    console.log(`   ✓ pacing/intensity/depth - ENHANCED: keyword + director styles`);
    console.log('\n' + '='.repeat(70) + '\n');

    // Sample results
    await printSampleResults();

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// ============================================================================
// SAMPLE RESULTS PRINTER
// ============================================================================

async function printSampleResults() {
  console.log('📋 Sample scored movies:\n');
  
  // Top quality films
  console.log('🏆 TOP QUALITY (ff_rating):');
  const { data: topQuality } = await supabase
    .from('movies')
    .select('title, ff_rating, ff_rating_genre_normalized, ff_confidence, primary_genre')
    .not('ff_rating', 'is', null)
    .order('ff_rating', { ascending: false })
    .limit(5);

  if (topQuality) {
    topQuality.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.title}`);
      console.log(`      FF: ${m.ff_rating}/10 | Genre-Norm: ${m.ff_rating_genre_normalized}/10 | ${m.primary_genre}`);
    });
  }

  // Best genre-normalized (genre outperformers)
  console.log('\n💎 GENRE OUTPERFORMERS (ff_rating_genre_normalized > ff_rating):');
  const { data: genreOutperformers } = await supabase
    .from('movies')
    .select('title, ff_rating, ff_rating_genre_normalized, primary_genre, popularity')
    .not('ff_rating', 'is', null)
    .not('ff_rating_genre_normalized', 'is', null)
    .order('ff_rating_genre_normalized', { ascending: false })
    .limit(100);

  if (genreOutperformers) {
    const outperformers = genreOutperformers
      .filter(m => m.ff_rating_genre_normalized > m.ff_rating + 0.5)
      .slice(0, 5);
    
    outperformers.forEach((m, i) => {
      const diff = (m.ff_rating_genre_normalized - m.ff_rating).toFixed(1);
      console.log(`   ${i + 1}. ${m.title} (${m.primary_genre})`);
      console.log(`      FF: ${m.ff_rating}/10 → Genre-Norm: ${m.ff_rating_genre_normalized}/10 (+${diff})`);
    });
  }

  // Highest discovery potential
  console.log('\n🔍 HIGHEST DISCOVERY POTENTIAL:');
  const { data: topDiscovery } = await supabase
    .from('movies')
    .select('title, ff_rating, discovery_potential, popularity, original_language')
    .not('discovery_potential', 'is', null)
    .order('discovery_potential', { ascending: false })
    .limit(5);

  if (topDiscovery) {
    topDiscovery.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.title}`);
      console.log(`      Discovery: ${m.discovery_potential}/100 | FF: ${m.ff_rating} | Pop: ${m.popularity?.toFixed(1)} | Lang: ${m.original_language}`);
    });
  }

  // Most accessible
  console.log('\n🍿 MOST ACCESSIBLE (easy watches):');
  const { data: mostAccessible } = await supabase
    .from('movies')
    .select('title, accessibility_score, runtime, ff_rating, primary_genre')
    .not('accessibility_score', 'is', null)
    .gte('ff_rating', 7)
    .order('accessibility_score', { ascending: false })
    .limit(5);

  if (mostAccessible) {
    mostAccessible.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.title}`);
      console.log(`      Access: ${m.accessibility_score}/100 | ${m.runtime}min | FF: ${m.ff_rating} | ${m.primary_genre}`);
    });
  }

  // Most polarizing
  console.log('\n⚡ MOST POLARIZING:');
  const { data: mostPolarizing } = await supabase
    .from('movies')
    .select('title, polarization_score, ff_rating, vote_count')
    .not('polarization_score', 'is', null)
    .order('polarization_score', { ascending: false })
    .limit(5);

  if (mostPolarizing) {
    mostPolarizing.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.title}`);
      console.log(`      Polarization: ${m.polarization_score}/100 | FF: ${m.ff_rating} | Votes: ${m.vote_count?.toLocaleString()}`);
    });
  }

  // Slowest contemplative films
  console.log('\n🧘 SLOWEST & DEEPEST (contemplative cinema):');
  const { data: contemplative } = await supabase
    .from('movies')
    .select('title, pacing_score, emotional_depth_score, attention_demand, ff_rating')
    .not('pacing_score', 'is', null)
    .gte('ff_rating', 7)
    .lte('pacing_score', 3)
    .gte('emotional_depth_score', 8)
    .order('emotional_depth_score', { ascending: false })
    .limit(5);

  if (contemplative) {
    contemplative.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.title}`);
      console.log(`      Pacing: ${m.pacing_score}/10 | Depth: ${m.emotional_depth_score}/10 | Attention: ${m.attention_demand}/100`);
    });
  }

  console.log('\n');
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