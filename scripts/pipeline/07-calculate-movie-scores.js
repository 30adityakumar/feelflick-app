// scripts/pipeline/07-calculate-movie-scores.js

/**
 * ============================================================================
 * STEP 07: CALCULATE MOVIE SCORES V2
 * ============================================================================
 * 
 * Purpose:
 *   Calculate all movie scoring metrics using V2 algorithm
 *   
 * Input:
 *   - Movies with status='fetching' and has_scores=false
 *   
 * Output:
 *   - All scoring fields calculated
 *   - has_scores=true
 *   - Status updated to 'scoring' → ready for embeddings
 *   
 * Scores Calculated:
 *   - ff_rating (0-10) - Pure quality score
 *   - ff_rating_genre_normalized (0-10) - Relative to genre
 *   - quality_score (0-100)
 *   - pacing_score, intensity_score, emotional_depth_score (1-10)
 *   - dialogue_density, attention_demand (0-100)
 *   - vfx_level_score, cult_status_score, starpower_score (0-100)
 *   - discovery_potential (0-100) - NEW
 *   - accessibility_score (0-100) - NEW
 *   - polarization_score (0-100) - NEW
 * 
 * ============================================================================
 */

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

  // ff_rating weights (V3: includes Trakt, reduced IMDb dominance)
  // Missing sources are handled by the weighted-average normalization —
  // weights for absent sources simply don't contribute to totalWeight.
  FF_WEIGHTS: {
    IMDB:       0.28,
    RT:         0.22,
    METACRITIC: 0.20,
    TMDB:       0.10,
    TRAKT:      0.07,
  },

  // Bayesian prior constants — pull low-vote films toward the global mean.
  // With N votes the rating is: (N*rating + PRIOR*mean) / (N + PRIOR)
  // So at N=0 you get the mean; at N=PRIOR you're halfway; at N>>PRIOR you
  // get the real rating. This replaces the old blunt confidence penalties.
  BAYESIAN: {
    IMDB_PRIOR:        1500,   // ~1.5k votes to halve the prior pull
    IMDB_MEAN:         6.5,    // global IMDb average across all films
    TMDB_PRIOR:        500,
    TMDB_MEAN:         6.5,
    TRAKT_PRIOR:       1000,
    TRAKT_MEAN:        7.0,    // Trakt community skews cinephile (rates higher)
  },

  // Language bias: non-English IMDb scores are systematically deflated
  // because the English-speaking majority rates foreign films lower.
  LANGUAGE_BIAS_CORRECTION: {
    hi: 0.40,  // Hindi — historically heavily underrated on IMDb
    ta: 0.40,
    te: 0.40,
    ml: 0.35,
    bn: 0.35,
    pa: 0.35,
    ur: 0.35,
    ko: 0.20,
    ja: 0.15,
    zh: 0.25,
    yue: 0.25,
    fa: 0.25,
    th: 0.20,
    vi: 0.20,
    _default: 0.15,  // any other non-English
  },
};

// ============================================================================
// GENRE STATISTICS
// Pre-computed from typical movie databases
// These represent average ratings and standard deviations per genre
// Used for genre-normalized scoring
// ============================================================================

const GENRE_STATS = {
  28: { name: 'Action', mean: 6.2, stdDev: 1.0 },
  12: { name: 'Adventure', mean: 6.4, stdDev: 1.0 },
  16: { name: 'Animation', mean: 6.8, stdDev: 1.1 },
  35: { name: 'Comedy', mean: 6.1, stdDev: 1.1 },
  80: { name: 'Crime', mean: 6.5, stdDev: 1.1 },
  99: { name: 'Documentary', mean: 7.2, stdDev: 1.0 },
  18: { name: 'Drama', mean: 6.9, stdDev: 1.1 },
  10751: { name: 'Family', mean: 6.3, stdDev: 1.0 },
  14: { name: 'Fantasy', mean: 6.3, stdDev: 1.1 },
  36: { name: 'History', mean: 7.0, stdDev: 1.0 },
  27: { name: 'Horror', mean: 5.8, stdDev: 1.2 },
  10402: { name: 'Music', mean: 6.7, stdDev: 1.1 },
  9648: { name: 'Mystery', mean: 6.5, stdDev: 1.1 },
  10749: { name: 'Romance', mean: 6.4, stdDev: 1.1 },
  878: { name: 'Science Fiction', mean: 6.4, stdDev: 1.2 },
  10770: { name: 'TV Movie', mean: 5.8, stdDev: 1.2 },
  53: { name: 'Thriller', mean: 6.3, stdDev: 1.1 },
  10752: { name: 'War', mean: 7.0, stdDev: 1.0 },
  37: { name: 'Western', mean: 6.6, stdDev: 1.1 }
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

// Pre-compiled word-boundary regex for keyword matching.
// Prevents substring false positives (e.g. "brisk" matching "brisket").
const KEYWORD_PATTERN_REGEX = Object.fromEntries(
  Object.entries(KEYWORD_MOOD_MODIFIERS).map(([pattern, mods]) => [
    pattern,
    { regex: new RegExp(`\\b${pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i'), mods }
  ])
);

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

// Pre-compiled word-boundary regex for VFX and cult keyword Sets
const VFX_KEYWORD_REGEX = new Map(
  Array.from(VFX_KEYWORDS).map(kw => [
    kw,
    new RegExp(`\\b${kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i')
  ])
);

const CULT_KEYWORD_REGEX = new Map(
  Array.from(CULT_KEYWORDS).map(kw => [
    kw,
    new RegExp(`\\b${kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i')
  ])
);

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
// CRITIC RATING (0-100)
//
// Blends RT critics + Metacritic + IMDb (only if 50k+ votes, where IMDb
// functions more like an aggregate critics signal than a casual poll).
// Requires at least 1 source with enough reviews to produce a score.
// ============================================================================

function calculateCriticRating(externalRatings) {
  let score = 0, weight = 0, sources = 0;

  // RT critics (vouched: 20+ critic reviews)
  const rtCount = externalRatings?.rt_critics_count || 0;
  if (externalRatings?.rt_rating != null && rtCount >= 20) {
    const rt = parseInt(externalRatings.rt_rating);
    if (!isNaN(rt)) {
      score += rt * 0.45;
      weight += 0.45;
      sources++;
    }
  }

  // Metacritic (curated panel — always vouched)
  if (externalRatings?.metacritic_score != null) {
    score += externalRatings.metacritic_score * 0.35;
    weight += 0.35;
    sources++;
  }

  // IMDb as critic signal only if widely vetted
  const imdbVotes = externalRatings?.imdb_votes || 0;
  if (externalRatings?.imdb_rating != null && imdbVotes >= 50000) {
    const bayesian = (imdbVotes * externalRatings.imdb_rating + 20000 * 6.5) / (imdbVotes + 20000);
    score += bayesian * 10 * 0.20;
    weight += 0.20;
    sources++;
  }

  if (weight === 0 || sources < 1) return { rating: null, confidence: 0 };

  const rating = Math.round(score / weight);

  // Confidence: require 2+ sources OR MC alone for trust
  let confidence = 0;
  if (externalRatings?.rt_rating != null && rtCount >= 20) confidence += 30;
  if (externalRatings?.metacritic_score != null) confidence += 30;
  if (imdbVotes >= 50000) confidence += 20;
  if (rtCount >= 100) confidence += 10;
  if (imdbVotes >= 200000) confidence += 10;
  confidence = Math.min(100, confidence);
  if (sources === 1 && !externalRatings?.metacritic_score) confidence = Math.min(confidence, 55);

  return { rating: Math.max(0, Math.min(100, rating)), confidence };
}

// ============================================================================
// AUDIENCE RATING (0-100)
//
// Broad audience consensus from IMDb + TMDB + Trakt. All sources get Bayesian
// averaging to dampen low-vote noise. Non-English language bias correction
// applied to IMDb scores (same rationale as ff_rating).
// ============================================================================

function calculateAudienceRating(movie, externalRatings) {
  let score = 0, weight = 0, sources = 0, totalVotes = 0;

  // IMDb audience (always included if present, Bayesian)
  if (externalRatings?.imdb_rating != null) {
    const votes = externalRatings.imdb_votes || 0;
    const bayesian = (votes * externalRatings.imdb_rating + 2500 * 6.5) / (votes + 2500);
    const langBias = (movie.original_language && movie.original_language !== 'en') ? 0.3 : 0;
    const adjusted = Math.min(10, bayesian + langBias);
    score += adjusted * 10 * 0.50;
    weight += 0.50;
    sources++;
    totalVotes += votes;
  }

  // TMDB (light weight, Bayesian)
  if (movie.vote_average && (movie.vote_count || 0) >= 50) {
    const votes = movie.vote_count;
    const bayesian = (votes * movie.vote_average + 300 * 6.5) / (votes + 300);
    score += bayesian * 10 * 0.25;
    weight += 0.25;
    sources++;
    totalVotes += votes;
  }

  // Trakt (cinephile audience)
  if (externalRatings?.trakt_rating != null && (externalRatings.trakt_votes || 0) >= 100) {
    const votes = externalRatings.trakt_votes;
    const bayesian = (votes * externalRatings.trakt_rating + 500 * 7.0) / (votes + 500);
    score += bayesian * 10 * 0.25;
    weight += 0.25;
    sources++;
    totalVotes += votes;
  }

  if (weight === 0) return { rating: null, confidence: 0 };

  const rating = Math.round(score / weight);

  // Confidence: logarithmic in vote count + source diversity
  let confidence = Math.min(80, Math.log10(totalVotes + 1) * 20);
  confidence += (sources / 3) * 20;
  confidence = Math.min(100, Math.round(confidence));

  return { rating: Math.max(0, Math.min(100, rating)), confidence };
}

// ============================================================================
// FF_RATING V3: PURE QUALITY SCORE (0-10)
//
// Improvements over V2:
//   - Trakt.tv added as a 5th source (cinephile-skewed signal)
//   - Bayesian averaging replaces blunt confidence penalty:
//       bayesian = (votes * rating + PRIOR * mean) / (votes + PRIOR)
//     Low-vote films are pulled toward the global average instead of
//     multiplied by an arbitrary factor.
//   - Language bias correction: non-English IMDb scores receive a small
//     upward correction to offset the English-speaking majority effect.
//   - Recency discount: films < 6 months old have inflated/noisy scores
//     and receive a small uncertainty discount.
// ============================================================================

function calculateFFRating(movie, externalRatings) {
  const { FF_WEIGHTS: W, BAYESIAN: B } = CONFIG;
  let totalScore = 0;
  let totalWeight = 0;
  let sourceCount = 0;

  // 1. IMDb — Bayesian averaging + language bias correction
  if (externalRatings?.imdb_rating) {
    const rawRating = externalRatings.imdb_rating;
    const votes     = externalRatings.imdb_votes || 0;

    // Bayesian: pull toward prior mean for low-vote films
    let imdbScore = (votes * rawRating + B.IMDB_PRIOR * B.IMDB_MEAN)
                  / (votes + B.IMDB_PRIOR);

    // Language bias correction: non-English films are systematically
    // underrated on IMDb by English-speaking majority voters
    if (movie.original_language && movie.original_language !== 'en') {
      const biasMap = CONFIG.LANGUAGE_BIAS_CORRECTION;
      const correction = biasMap[movie.original_language] ?? biasMap._default;
      imdbScore = Math.min(10, imdbScore + correction);
    }

    totalScore  += imdbScore * W.IMDB;
    totalWeight += W.IMDB;
    sourceCount++;
  }

  // 2. Rotten Tomatoes critics score — already an aggregated % (no Bayesian needed)
  if (externalRatings?.rt_rating) {
    const rtPercent = parseInt(externalRatings.rt_rating);
    if (!isNaN(rtPercent)) {
      const rtScore = rtPercent / 10; // 0-100 → 0-10
      totalScore  += rtScore * W.RT;
      totalWeight += W.RT;
      sourceCount++;
    }
  }

  // 3. Metacritic — already an aggregated critics score (no Bayesian needed)
  if (externalRatings?.metacritic_score) {
    const metaScore = externalRatings.metacritic_score / 10; // 0-100 → 0-10
    totalScore  += metaScore * W.METACRITIC;
    totalWeight += W.METACRITIC;
    sourceCount++;
  }

  // 4. TMDB community — Bayesian averaging
  if (movie.vote_average) {
    const votes = movie.vote_count || 0;
    const tmdbScore = (votes * movie.vote_average + B.TMDB_PRIOR * B.TMDB_MEAN)
                    / (votes + B.TMDB_PRIOR);
    totalScore  += tmdbScore * W.TMDB;
    totalWeight += W.TMDB;
    // TMDB alone doesn't count as an "external" source for confidence
  }

  // 5. Trakt.tv — Bayesian averaging (cinephile community)
  if (externalRatings?.trakt_rating) {
    const votes = externalRatings.trakt_votes || 0;
    const traktScore = (votes * externalRatings.trakt_rating + B.TRAKT_PRIOR * B.TRAKT_MEAN)
                     / (votes + B.TRAKT_PRIOR);
    totalScore  += traktScore * W.TRAKT;
    totalWeight += W.TRAKT;
    sourceCount++;
  }

  // Weighted average (falls back to prior mean if no data at all)
  let ffRating = totalWeight > 0 ? totalScore / totalWeight : B.IMDB_MEAN;

  // Recency discount: very new films have noisy, vote-sparse scores
  if (movie.release_date) {
    const monthsOld = (Date.now() - new Date(movie.release_date).getTime())
                    / (1000 * 60 * 60 * 24 * 30);
    if (monthsOld < 3)      ffRating *= 0.96;
    else if (monthsOld < 6) ffRating *= 0.98;
  }

  // Confidence: how many real external critic/community sources do we have?
  // (Bayesian handles the vote-count uncertainty; this is just for reporting)
  let confidence;
  if (sourceCount >= 3)       confidence = 100;
  else if (sourceCount === 2) confidence = 85;
  else if (sourceCount === 1) confidence = 65;
  else                        confidence = 40; // TMDB only or nothing

  // Cap confidence when vote signals are suspiciously thin:
  //   - No TMDB votes at all (vote_count is null or 0): likely a data stub
  //   - Very few IMDb votes (<500): score may be driven by a small audience
  // These caps prevent obscure titles with sparse data from floating to the
  // top of recommendation pools despite technically having 3 source signals.
  const tmdbVotes = movie.vote_count || 0;
  const imdbVotes = externalRatings?.imdb_votes || 0;

  if (tmdbVotes === 0 && imdbVotes === 0) {
    confidence = Math.min(confidence, 40); // pure data stub
  } else if (tmdbVotes < 50 && imdbVotes < 500) {
    confidence = Math.min(confidence, 55); // very sparse
  } else if (tmdbVotes < 200 || imdbVotes < 1000) {
    confidence = Math.min(confidence, 70); // moderately sparse
  }

  ffRating = Math.round(Math.max(1.0, Math.min(10.0, ffRating)) * 10) / 10;

  return { rating: ffRating, confidence };
}

// ============================================================================
// BUILD LIVE GENRE STATS FROM ALREADY-SCORED MOVIES
//
// Called once at the start of each scoring run. Uses real ff_rating values
// from movies already in the DB (has_scores=true) to derive each genre's
// actual mean and standard deviation — far more accurate than the hardcoded
// GENRE_STATS fallback above, which is just a starting estimate.
//
// Falls back to GENRE_STATS when:
//   - The DB has no scored movies yet (first ever run)
//   - A genre has fewer than MIN_SAMPLES scored movies
// ============================================================================

const MIN_GENRE_SAMPLES = 30;

async function buildGenreStats() {
  console.log('\n📊 Building genre statistics from scored movies...');

  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, ff_rating')
    .eq('has_scores', true)
    .not('ff_rating', 'is', null)
    .limit(50000);

  if (error || !movies?.length) {
    console.log('  ⚠️  No scored movies found — using hardcoded fallback stats');
    return null;
  }

  const ratingMap = new Map(movies.map(m => [m.id, m.ff_rating]));
  const movieIds  = [...ratingMap.keys()];

  // Fetch genres in batches
  const genresByMovie = new Map();
  const BATCH = 2000;
  for (let i = 0; i < movieIds.length; i += BATCH) {
    const { data: rows } = await supabase
      .from('movie_genres')
      .select('movie_id, genre_id')
      .in('movie_id', movieIds.slice(i, i + BATCH));

    for (const row of (rows || [])) {
      if (!genresByMovie.has(row.movie_id)) genresByMovie.set(row.movie_id, []);
      genresByMovie.get(row.movie_id).push(row.genre_id);
    }
  }

  // Accumulate ff_rating values per genre
  const genreRatings = new Map();
  for (const [movieId, rating] of ratingMap) {
    for (const genreId of (genresByMovie.get(movieId) || [])) {
      if (!genreRatings.has(genreId)) genreRatings.set(genreId, []);
      genreRatings.get(genreId).push(rating);
    }
  }

  // Compute mean + stdDev; require MIN_GENRE_SAMPLES before trusting the data
  const liveStats = {};
  for (const [genreId, ratings] of genreRatings) {
    if (ratings.length < MIN_GENRE_SAMPLES) continue;

    const mean     = ratings.reduce((s, r) => s + r, 0) / ratings.length;
    const variance = ratings.reduce((s, r) => s + (r - mean) ** 2, 0) / ratings.length;
    const stdDev   = Math.max(0.5, Math.sqrt(variance)); // floor at 0.5 to avoid division chaos

    liveStats[genreId] = {
      name:    GENRE_STATS[genreId]?.name || `Genre ${genreId}`,
      mean:    Math.round(mean   * 100) / 100,
      stdDev:  Math.round(stdDev * 100) / 100,
      samples: ratings.length,
    };
  }

  const genreCount = Object.keys(liveStats).length;
  console.log(`  ✓ Stats computed for ${genreCount} genres from ${movies.length} scored movies`);

  if (genreCount > 0) {
    const top = Object.entries(liveStats)
      .sort(([, a], [, b]) => b.mean - a.mean)
      .slice(0, 4);
    for (const [, s] of top) {
      console.log(`    ${s.name.padEnd(20)} mean=${s.mean} ± ${s.stdDev}  (n=${s.samples})`);
    }
  }

  // Need at least 5 genres with real data to prefer live stats over hardcoded
  return genreCount >= 5 ? liveStats : null;
}

// ============================================================================
// GENRE-NORMALIZED RATING (0-10)
//
// How good is this film RELATIVE TO ITS GENRE PEERS?
//   A 7.0 horror film is exceptional. A 7.0 drama is average.
//
// V3 improvements:
//   - Uses live stats from the DB (falls back to hardcoded GENRE_STATS)
//   - Blends primary (70%) + secondary (30%) genre when both are available
//   - Rescaled to center at 5.0 (genre-average film = 5.0, not 6.5)
//
// Scale guide:
//   z=0  (genre average)   → 5.0
//   z=+2 (exceptional)     → 8.0
//   z=-2 (poor)            → 2.0
// ============================================================================

const GENRE_NORM_CENTER = 5.0;
const GENRE_NORM_SCALE  = 1.5;

function calculateGenreNormalizedRating(ffRating, primaryGenreId, secondaryGenreId, liveStats) {
  function normalizeForGenre(rating, genreId) {
    const stats = (liveStats && liveStats[genreId]) || GENRE_STATS[genreId];
    if (!stats) return null;

    const zScore = (rating - stats.mean) / (stats.stdDev || 1.0);
    return GENRE_NORM_CENTER + (zScore * GENRE_NORM_SCALE);
  }

  const primary   = primaryGenreId   ? normalizeForGenre(ffRating, primaryGenreId)   : null;
  const secondary = secondaryGenreId ? normalizeForGenre(ffRating, secondaryGenreId) : null;

  let normalized;
  if (primary !== null && secondary !== null) {
    normalized = primary * 0.70 + secondary * 0.30;
  } else if (primary !== null) {
    normalized = primary;
  } else {
    // No genre match in any stats source — pass ff_rating through unchanged
    return ffRating;
  }

  return Math.round(Math.max(1, Math.min(10, normalized)) * 10) / 10;
}

// ============================================================================
// ============================================================================
// MOOD SCORES V2: KEYWORD-ENHANCED (pacing, intensity, depth 1-10)
// ============================================================================

function calculateMoodScores(movie, genres, keywords) {
  // Prefer LLM-derived mood signals when available; fall back to heuristic calculation.
  if (movie.llm_pacing != null && movie.llm_intensity != null && movie.llm_emotional_depth != null) {
    return {
      pacing: Math.round(movie.llm_pacing / 10),            // normalize back to 1-10 for legacy field compat
      intensity: Math.round(movie.llm_intensity / 10),
      emotional_depth: Math.round(movie.llm_emotional_depth / 10),
      dialogue_density: movie.llm_dialogue_density ?? 50,
      attention_demand: movie.llm_attention_demand ?? 50,
      pacing_score_100: movie.llm_pacing,
      intensity_score_100: movie.llm_intensity,
      emotional_depth_score_100: movie.llm_emotional_depth,
      _source: 'llm',
    };
  }

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
    for (const { regex, mods } of Object.values(KEYWORD_PATTERN_REGEX)) {
      if (regex.test(kw)) {
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
    attention_demand: Math.round(Math.max(0, Math.min(100, attentionDemand))),
    pacing_score_100: Math.round(Math.max(0, Math.min(100, pacing * 10))),
    intensity_score_100: Math.round(Math.max(0, Math.min(100, intensity * 10))),
    emotional_depth_score_100: Math.round(Math.max(0, Math.min(100, depth * 10))),
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
    Array.from(VFX_KEYWORD_REGEX.values()).some(regex => regex.test(k))
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
    Array.from(CULT_KEYWORD_REGEX.values()).some(regex => regex.test(k))
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

  // Prefer popularity-sorted top 3 (stronger signal than billing-based)
  const top3 = movie.top3_popularity_rank_cast_avg || movie.top3_cast_avg || 0;
  if (top3) {
    score += Math.min(45, top3 * 1.8);
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

  // World cinema boost — gated by TMDB vote count.
  // The flat language bonus was causing famous regional films (Dangal, Parasite,
  // Spirited Away) to be mislabeled as "hidden gems". A film with 15k+ TMDB votes
  // has clear global recognition regardless of language.
  if (movie.original_language && movie.original_language !== 'en') {
    if (movie.vote_count < 1000) {
      score += 12; // Genuinely unknown outside home market
    } else if (movie.vote_count < 3000) {
      score += 6;  // Slightly known globally
    }
    // 3000+ TMDB votes → enough global recognition, no language advantage
  }

  // Low vote count + high rating = underseen gem
  // Tighter thresholds: 5000 was too generous (DDLJ, 3 Idiots had 2.5k–4.5k votes)
  if (movie.vote_count < 2000 && ffRating >= 7) {
    score += 15;
  } else if (movie.vote_count < 5000 && ffRating >= 7.5) {
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

  // Franchise films (Marvel, Fast & Furious, Star Wars, etc.) should not score as hidden gems
  if (movie.collection_id) {
    score = Math.max(0, score - 25);
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
      fetchAllRows('ratings_external', 'movie_id, imdb_rating, imdb_votes, rt_rating, rt_critics_count, metacritic_score')
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
// MAIN SCORING PIPELINE (MODIFIED)
// ============================================================================

async function calculateMovieScores(options = {}) {
  console.log('='.repeat(70));
  console.log('🎬 FeelFlick Movie Scoring Engine V3');
  console.log('='.repeat(70));
  console.log('');

  if (options.rescore) {
    console.log('🔄 Mode: RESCORE ALL eligible movies');
  } else if (options.rescoreOlderThanDays) {
    const threshold = new Date(Date.now() - options.rescoreOlderThanDays * 86400000);
    console.log(`🔄 Mode: RESCORE movies scored before ${threshold.toISOString().split('T')[0]}`);
  }
  console.log('');

  const startTime = Date.now();

  // Build live genre statistics from already-scored movies in the DB.
  // Falls back to hardcoded GENRE_STATS when there isn't enough data yet.
  const liveGenreStats = await buildGenreStats();

  try {
    // Exclude credits_raw (large JSON) — not used by scoring and causes query timeouts
    const SCORE_SELECT = 'id, title, original_title, release_date, overview, poster_path, backdrop_path, runtime, vote_average, vote_count, popularity, original_language, adult, budget, revenue, status, tagline, homepage, imdb_id, inserted_at, updated_at, tmdb_id, pacing_score, intensity_score, emotional_depth_score, last_scored_at, quality_score, star_power, vfx_level, cult_status, dialogue_density, attention_demand, release_year, genres, genre_count, primary_genre, keywords, keyword_count, cast_count, crew_count, avg_cast_popularity, max_cast_popularity, top3_cast_avg, lead_actor_name, lead_actor_popularity, lead_actor_character, director_name, director_popularity, director_count, co_directors, trailer_youtube_key, fetched_at, last_tmdb_sync, last_embedding_at, retry_count, last_error, last_error_at, error_type, has_embeddings, has_scores, has_credits, has_keywords, is_valid, starpower_score, ff_rating, ff_confidence, vfx_level_score, cult_status_score, ff_rating_genre_normalized, discovery_potential, accessibility_score, polarization_score, has_cast_metadata, ff_community_rating, ff_community_votes, ff_final_rating, spoken_languages, production_countries, production_companies, collection_id, collection_name, certification, writer_name, writer_popularity, cinematographer_name, top3_popularity_rank_cast_avg, cast_metadata_recomputed_at, pacing_score_100, intensity_score_100, emotional_depth_score_100, mood_tags, tone_tags, fit_profile, llm_pacing, llm_intensity, llm_emotional_depth, llm_dialogue_density, llm_attention_demand, llm_confidence, llm_enriched_at, llm_model_version, user_satisfaction_score, user_satisfaction_confidence, user_satisfaction_sample_size, user_satisfaction_computed_at, ff_critic_rating, ff_critic_confidence, ff_audience_rating, ff_audience_confidence, ff_community_confidence';

    let query = supabase
      .from('movies')
      .select(SCORE_SELECT)
      .eq('is_valid', true)
      .limit(options.limit || 10000);

    if (options.rescore) {
      // Rescore all eligible movies regardless of has_scores
      query = query.in('status', ['fetching', 'scoring', 'complete']);
    } else if (options.rescoreOlderThanDays) {
      const threshold = new Date(Date.now() - options.rescoreOlderThanDays * 86400000).toISOString();
      query = query
        .in('status', ['fetching', 'scoring', 'complete'])
        .or(`has_scores.eq.false,last_scored_at.lt.${threshold}`);
    } else {
      // Default: only unscored movies
      query = query
        .in('status', ['fetching', 'scoring'])
        .eq('has_scores', false);
    }

    const { data: movies, error: moviesError } = await query;
    
    if (moviesError) throw moviesError;
    
    if (!movies || movies.length === 0) {
      console.log('✓ No movies need scoring');
      return;
    }
    
    console.log(`Found ${movies.length} movies needing scores\n`);
    
    // Fetch related data (genres, keywords, ratings)
    console.log('📊 Fetching related data...');
    
    const movieIds = movies.map(m => m.id);
    
    // Batch fetch genres
    const genreMap = new Map();
    const GENRE_BATCH = 1000;
    for (let i = 0; i < movieIds.length; i += GENRE_BATCH) {
      const batch = movieIds.slice(i, i + GENRE_BATCH);
      const { data: genreData } = await supabase
        .from('movie_genres')
        .select('movie_id, genre_id')
        .in('movie_id', batch);
      
      genreData?.forEach(mg => {
        if (!genreMap.has(mg.movie_id)) {
          genreMap.set(mg.movie_id, []);
        }
        genreMap.get(mg.movie_id).push(mg.genre_id);
      });
    }
    
    // Batch fetch external ratings
    const ratingsMap = new Map();
    for (let i = 0; i < movieIds.length; i += GENRE_BATCH) {
      const batch = movieIds.slice(i, i + GENRE_BATCH);
      const { data: ratingsData } = await supabase
        .from('ratings_external')
        .select('movie_id, imdb_rating, imdb_votes, rt_rating, rt_critics_count, metacritic_score, trakt_rating, trakt_votes')
        .in('movie_id', batch);
      
      ratingsData?.forEach(r => {
        ratingsMap.set(r.movie_id, r);
      });
    }
    
    console.log(`✓ ${genreMap.size} movies with genres`);
    console.log(`✓ ${ratingsMap.size} movies with external ratings\n`);
    
    // Process movies
    let updated = 0;
    let errors = 0;
    const updates = [];
    
    console.log('🎯 Calculating scores...\n');
    
    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];
      
      try {
        // Get related data
        const genres = genreMap.get(movie.id) || [];
        const externalRatings = ratingsMap.get(movie.id);
        
        // Parse keywords
        let keywords = [];
        if (movie.keywords) {
          if (Array.isArray(movie.keywords)) {
            keywords = movie.keywords;
          } else if (typeof movie.keywords === 'object') {
            keywords = Object.values(movie.keywords);
          }
        }
        
        // Get primary + secondary genre IDs
        let primaryGenreId   = null;
        let secondaryGenreId = null;
        if (movie.primary_genre) {
          for (const [id, stats] of Object.entries(GENRE_STATS)) {
            if (stats.name.toLowerCase() === movie.primary_genre.toLowerCase()) {
              primaryGenreId = parseInt(id);
              break;
            }
          }
        }
        if (!primaryGenreId && genres.length > 0) primaryGenreId   = genres[0];
        if (genres.length > 1)                     secondaryGenreId = genres[1];

        // ✅ CALCULATE ALL SCORES (using your existing functions)
        const criticResult   = calculateCriticRating(externalRatings);
        const audienceResult = calculateAudienceRating(movie, externalRatings);
        const ffResult = calculateFFRating(movie, externalRatings);
        const genreNormalizedRating = calculateGenreNormalizedRating(
          ffResult.rating, primaryGenreId, secondaryGenreId, liveGenreStats
        );
        const moodScores = calculateMoodScores(movie, genres, keywords);
        const vfxLevel = calculateVFXLevel(movie, genres, keywords);
        const cultStatus = calculateCultStatus(movie, keywords, externalRatings, Math.round(ffResult.rating * 10));
        const starpower = calculateStarpower(movie);
        const polarization = calculatePolarization(movie, externalRatings);
        const discoveryPotential = calculateDiscoveryPotential(
          movie, ffResult.rating, genreNormalizedRating, cultStatus
        );
        const accessibility = calculateAccessibility(movie, genres, moodScores);
        
        // Legacy enum mappings
        const vfxEnum = scoreToVFXEnum(vfxLevel);
        const starpowerEnum = scoreToStarpowerEnum(starpower);
        
        // Build update object
        updates.push({
          id: movie.id,

          // Split ratings — coerce to integer for smallint columns
          ff_critic_rating:       criticResult.rating != null ? Math.round(criticResult.rating) : null,
          ff_critic_confidence:   criticResult.confidence != null ? Math.round(criticResult.confidence) : null,
          ff_audience_rating:     audienceResult.rating != null ? Math.round(audienceResult.rating) : null,
          ff_audience_confidence: audienceResult.confidence != null ? Math.round(audienceResult.confidence) : null,

          // ff_rating: DEPRECATED 2026-04-18 — no longer written. Use ff_audience_rating (0-100).
          ff_confidence: ffResult.confidence,
          ff_rating_genre_normalized: genreNormalizedRating,
          
          // Mood dimensions
          pacing_score: moodScores.pacing,
          intensity_score: moodScores.intensity,
          emotional_depth_score: moodScores.emotional_depth,
          dialogue_density: moodScores.dialogue_density,
          attention_demand: moodScores.attention_demand,
          
          // Mood dimensions (0-100 scale)
          pacing_score_100: moodScores.pacing_score_100,
          intensity_score_100: moodScores.intensity_score_100,
          emotional_depth_score_100: moodScores.emotional_depth_score_100,

          // Quality metrics
          quality_score: Math.round(ffResult.rating * 10),
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
          cult_status: cultStatus > 50,
          
          // Metadata
          has_scores: true,
          last_scored_at: new Date().toISOString(),
          
          // ✅ NEW: Update status to 'scoring'
          status: 'scoring'  // ← CRITICAL: Ready for embeddings
        });
        
        // Batch upsert
        if (updates.length >= CONFIG.BATCH_SIZE) {
          const { error: batchError } = await supabase
            .from('movies')
            .upsert(updates);
          
          if (!batchError) {
            updated += updates.length;
          } else {
            console.error(`❌ Batch error:`, batchError.message);
            errors++;
          }
          
          updates.length = 0;
        }
        
        // Progress logging
        if ((i + 1) % CONFIG.LOG_INTERVAL === 0 || i === movies.length - 1) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          const rate = ((updated + updates.length) / (Date.now() - startTime) * 1000).toFixed(1);
          const pct = ((i + 1) / movies.length * 100).toFixed(1);
          console.log(`${(i + 1).toLocaleString()}/${movies.length.toLocaleString()} (${pct}%) | ${rate} movies/sec | ${elapsed}s elapsed`);
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
        console.log(`\n✅ Final batch updated: ${updates.length} movies`);
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
    console.log(`  Total movies: ${movies.length.toLocaleString()}`);
    console.log(`  Successfully scored: ${updated.toLocaleString()}`);
    console.log(`  Errors: ${errors}`);
    console.log(`  Success rate: ${((updated / movies.length) * 100).toFixed(1)}%`);
    console.log(`\n⏱️  Performance:`);
    console.log(`  Total time: ${totalTime}s`);
    console.log(`  Average rate: ${avgRate} movies/second`);
    console.log(`\n🎯 V3 Scores calculated:`);
    console.log(`  ✓ ff_critic_rating (0-100) — RT + Metacritic + IMDb (50k+)`);
    console.log(`  ✓ ff_audience_rating (0-100) — IMDb + TMDB + Trakt Bayesian`);
    console.log(`  ✓ ff_audience_rating (0-100) — primary audience signal`);
    console.log(`  ✓ ff_rating_genre_normalized (0-10) — relative to genre peers`);
    console.log(`  ✓ discovery_potential (0-100) — hidden gem detection`);
    console.log(`  ✓ accessibility_score (0-100) — ease of watching`);
    console.log(`  ✓ polarization_score (0-100) — divisiveness`);
    console.log(`  ✓ dialogue_density (0-100) — keyword-based`);
    console.log(`  ✓ attention_demand (0-100) — keyword-based`);
    console.log(`  ✓ pacing/intensity/depth — keyword + director styles`);
    console.log(`  ✓ status updated to 'scoring' — ready for embeddings`);
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
// [KEEP ALL YOUR EXISTING HELPER FUNCTIONS]
// - printSampleResults()
// - scoreToVFXEnum()
// - scoreToStarpowerEnum()
// - All scoring calculation functions
// ============================================================================

// ============================================================================
// ENTRY POINT
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log('Usage: node 07-calculate-movie-scores.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --rescore                       Re-score all movies including already-scored');
    console.log('  --rescore-older-than=<days>      Re-score movies whose scores are older than N days');
    console.log('  --dry-run                       Log what would be scored without writing');
    console.log('  --limit=N                       Max movies to process');
    process.exit(0);
  }

  const options = {};
  if (args.includes('--rescore')) options.rescore = true;
  const rescoreAgeArg = args.find(a => a.startsWith('--rescore-older-than='));
  if (rescoreAgeArg) options.rescoreOlderThanDays = parseInt(rescoreAgeArg.split('=')[1], 10);
  if (args.includes('--dry-run')) options.dryRun = true;
  const limitArg = args.find(a => a.startsWith('--limit='));
  if (limitArg) options.limit = parseInt(limitArg.split('=')[1], 10);

  calculateMovieScores(options)
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