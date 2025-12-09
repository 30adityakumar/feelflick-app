// src/shared/services/recommendations.js
/**
 * FeelFlick Recommendation Engine
 * 
 * Strategy:
 * 1. Genre-based personalization using user preferences
 * 2. Similar movies from watch history
 * 3. Hybrid scoring for quality results
 * 
 * @module recommendations
 */

import { supabase } from '@/shared/lib/supabase/client'
import * as tmdb from '@/shared/api/tmdb'

// ============================================================================
// FEELFLICK RECOMMENDATION ENGINE v2 - CONSTANTS
// ============================================================================

/**
 * Language to Region mapping for "same region" matching
 */
const LANGUAGE_REGIONS = {
  // South Asian
  hi: 'south_asian', ta: 'south_asian', te: 'south_asian', ml: 'south_asian',
  bn: 'south_asian', pa: 'south_asian', mr: 'south_asian', kn: 'south_asian',
  // East Asian
  ko: 'east_asian', ja: 'east_asian', zh: 'east_asian', cn: 'east_asian',
  // Southeast Asian
  th: 'southeast_asian', id: 'southeast_asian', vi: 'southeast_asian', tl: 'southeast_asian',
  // European West
  fr: 'european_west', de: 'european_west', es: 'european_west', it: 'european_west',
  pt: 'european_west', nl: 'european_west',
  // European East
  pl: 'european_east', ru: 'european_east', cs: 'european_east', hu: 'european_east',
  // Nordic
  sv: 'nordic', da: 'nordic', no: 'nordic', fi: 'nordic',
  // Middle Eastern
  ar: 'middle_eastern', fa: 'middle_eastern', tr: 'middle_eastern', he: 'middle_eastern',
  // English
  en: 'anglophone'
}

/**
 * Likely-seen penalty weights per row type
 */
const LIKELY_SEEN_WEIGHTS = {
  hero: 0,
  quick_picks: 0.3,
  hidden_gems: 0.9,
  trending: 0.0,
  because_you_watched: 0.2,
  world_cinema: 0.5,
  favorite_genres: 0.4,
  slow_contemplative: 0.5,
  quick_watches: 0.4,
  visual_spectacles: 0.3,
  default: 0.4
}

/**
 * Minimum thresholds
 */
const THRESHOLDS = {
  MIN_FF_RATING: 6.5,
  MIN_FF_CONFIDENCE: 50,
  MIN_FILMS_FOR_LANGUAGE_PREF: 3,
  MIN_FILMS_FOR_AFFINITY: 2
}

// ============================================================================
// USER PROFILE COMPUTATION
// ============================================================================

/**
 * Compute comprehensive user profile from watch history and preferences
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} User profile object
 */
export async function computeUserProfile(userId) {
  try {
    // Fetch all data in parallel
    const [
      { data: watchHistory },
      { data: userPrefs },
      { data: userRatings }
    ] = await Promise.all([
      // Watch history with movie details
      supabase
        .from('user_history')
        .select(`
          movie_id,
          source,
          watched_at,
          movies!inner (
            id, original_language, runtime, release_year,
            pacing_score, intensity_score, emotional_depth_score,
            dialogue_density, attention_demand, vfx_level_score,
            ff_rating, director_name, lead_actor_name, genres, keywords
          )
        `)
        .eq('user_id', userId)
        .order('watched_at', { ascending: false })
        .limit(100),
      
      // Genre preferences
      supabase
        .from('user_preferences')
        .select('genre_id')
        .eq('user_id', userId),
      
      // User ratings (for quality preference)
      supabase
        .from('user_ratings')
        .select('movie_id, rating')
        .eq('user_id', userId)
    ])

    // Handle empty history (new user)
    if (!watchHistory || watchHistory.length === 0) {
      return buildEmptyProfile(userId, userPrefs)
    }

    // Separate onboarding favorites from regular history
    const onboardingMovies = watchHistory.filter(h => h.source === 'onboarding')
    const regularHistory = watchHistory.filter(h => h.source !== 'onboarding')

    // Build weighted movie list
    const weightedMovies = []
    
    // Onboarding favorites: weight 3x
    onboardingMovies.forEach(h => {
      if (h.movies) {
        weightedMovies.push({ ...h.movies, weight: 3.0, isOnboarding: true })
      }
    })
    
    // Regular history: recency weighted
    const now = new Date()
    regularHistory.forEach(h => {
      if (h.movies) {
        const watchedAt = new Date(h.watched_at)
        const daysSince = (now - watchedAt) / (1000 * 60 * 60 * 24)
        
        let weight = 1.0
        if (daysSince <= 30) weight = 2.0
        else if (daysSince <= 90) weight = 1.5
        
        weightedMovies.push({ ...h.movies, weight, isOnboarding: false })
      }
    })

    // Compute all profile components
    const languages = computeLanguageProfile(weightedMovies)
    const genres = computeGenreProfile(weightedMovies, userPrefs)
    const contentProfile = computeContentProfile(weightedMovies)
    const preferences = computePracticalPreferences(weightedMovies)
    const affinities = computePeopleAffinities(weightedMovies)
    const themes = computeThemeAffinities(weightedMovies)
    const qualityProfile = computeQualityProfile(weightedMovies, userRatings)

    return {
      userId,
      languages,
      genres,
      contentProfile,
      preferences,
      affinities,
      themes,
      qualityProfile,
      meta: {
        profileVersion: '2.0',
        computedAt: new Date().toISOString(),
        dataPoints: weightedMovies.length,
        confidence: weightedMovies.length >= 30 ? 'high' : 
                    weightedMovies.length >= 10 ? 'medium' : 'low'
      }
    }
  } catch (error) {
    console.error('[computeUserProfile] Error:', error)
    return buildEmptyProfile(userId, null)
  }
}

/**
 * Build empty profile for new users
 */
function buildEmptyProfile(userId, userPrefs) {
  return {
    userId,
    languages: {
      primary: null,
      secondary: null,
      distribution: {},
      openness: 'unknown',
      regionAffinity: null,
      distinctCount: 0
    },
    genres: {
      preferred: userPrefs?.map(p => p.genre_id) || [],
      secondary: [],
      avoided: []
    },
    contentProfile: {
      avgPacing: 5,
      avgIntensity: 5,
      avgEmotionalDepth: 5,
      avgDialogueDensity: 50,
      avgAttentionDemand: 50,
      avgVFX: 50
    },
    preferences: {
      avgRuntime: 120,
      runtimeRange: [80, 180],
      preferredDecades: ['2020s', '2010s'],
      toleratesClassics: true
    },
    affinities: { directors: [], actors: [] },
    themes: { preferred: [] },
    qualityProfile: {
      avgFFRating: 7.0,
      watchesHiddenGems: false,
      totalMoviesWatched: 0
    },
    meta: {
      profileVersion: '2.0',
      computedAt: new Date().toISOString(),
      dataPoints: 0,
      confidence: 'none'
    }
  }
}

// ============================================================================
// PROFILE COMPUTATION HELPERS
// ============================================================================

/**
 * Compute language preferences from watch history
 */
function computeLanguageProfile(weightedMovies) {
  const langCounts = {}
  let totalWeight = 0

  weightedMovies.forEach(m => {
    const lang = m.original_language
    if (lang) {
      langCounts[lang] = (langCounts[lang] || 0) + m.weight
      totalWeight += m.weight
    }
  })

  // Convert to distribution
  const distribution = {}
  Object.entries(langCounts).forEach(([lang, count]) => {
    distribution[lang] = Math.round((count / totalWeight) * 100) / 100
  })

  // Sort by weight
  const sorted = Object.entries(langCounts).sort((a, b) => b[1] - a[1])
  const primary = sorted[0]?.[0] || null
  const secondary = sorted[1]?.[1] >= totalWeight * 0.15 ? sorted[1]?.[0] : null

  // Determine openness
  const distinctCount = Object.keys(langCounts).length
  let openness = 'narrow'
  if (distinctCount >= 5) openness = 'adventurous'
  else if (distinctCount >= 3) openness = 'curious'

  return {
    primary,
    secondary,
    distribution,
    openness,
    regionAffinity: LANGUAGE_REGIONS[primary] || null,
    distinctCount
  }
}

/**
 * Compute genre preferences
 */
/**
 * TMDB Genre ID mapping
 */
const GENRE_NAME_TO_ID = {
  'action': 28, 'adventure': 12, 'animation': 16, 'comedy': 35,
  'crime': 80, 'documentary': 99, 'drama': 18, 'family': 10751,
  'fantasy': 14, 'history': 36, 'horror': 27, 'music': 10402,
  'mystery': 9648, 'romance': 10749, 'science fiction': 878, 'sci-fi': 878,
  'tv movie': 10770, 'thriller': 53, 'war': 10752, 'western': 37
}

/**
 * Extract genre ID from various formats
 */
function extractGenreId(g) {
  // Object format: {id: 28, name: "Action"}
  if (typeof g === 'object' && g !== null && g.id) {
    return typeof g.id === 'number' ? g.id : parseInt(g.id, 10)
  }
  
  // Direct number: 28
  if (typeof g === 'number') {
    return g
  }
  
  // Numeric string: "28"
  if (typeof g === 'string') {
    const parsed = parseInt(g, 10)
    if (!isNaN(parsed)) return parsed
    
    // Genre name string: "Action" → look up ID
    const normalized = g.toLowerCase().trim()
    if (GENRE_NAME_TO_ID[normalized]) {
      return GENRE_NAME_TO_ID[normalized]
    }
  }
  
  return null
}

/**
 * Compute genre preferences
 */
function computeGenreProfile(weightedMovies, userPrefs) {
  const genreCounts = {}

  // User preferences get 2x weight - these are always numeric IDs
  userPrefs?.forEach(p => {
    if (p.genre_id) {
      const id = typeof p.genre_id === 'number' ? p.genre_id : parseInt(p.genre_id, 10)
      if (!isNaN(id)) {
        genreCounts[id] = (genreCounts[id] || 0) + 2
      }
    }
  })

  // Watched movies
  weightedMovies.forEach(m => {
    const genres = m.genres || []
    genres.forEach(g => {
      const genreId = extractGenreId(g)
      if (genreId !== null && !isNaN(genreId)) {
        genreCounts[genreId] = (genreCounts[genreId] || 0) + m.weight
      }
    })
  })

  // Sort and categorize
  const sorted = Object.entries(genreCounts)
    .map(([id, count]) => [parseInt(id, 10), count])
    .filter(([id]) => !isNaN(id) && id > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)

  return {
    preferred: sorted.slice(0, 3),
    secondary: sorted.slice(3, 6),
    avoided: []
  }
}

/**
 * Compute content style preferences (pacing, intensity, etc.)
 */
function computeContentProfile(weightedMovies) {
  const sums = {
    pacing: 0, intensity: 0, depth: 0,
    dialogue: 0, attention: 0, vfx: 0
  }
  let totalWeight = 0

  weightedMovies.forEach(m => {
    const w = m.weight
    if (m.pacing_score != null) sums.pacing += m.pacing_score * w
    if (m.intensity_score != null) sums.intensity += m.intensity_score * w
    if (m.emotional_depth_score != null) sums.depth += m.emotional_depth_score * w
    if (m.dialogue_density != null) sums.dialogue += m.dialogue_density * w
    if (m.attention_demand != null) sums.attention += m.attention_demand * w
    if (m.vfx_level_score != null) sums.vfx += m.vfx_level_score * w
    totalWeight += w
  })

  if (totalWeight === 0) {
    return {
      avgPacing: 5, avgIntensity: 5, avgEmotionalDepth: 5,
      avgDialogueDensity: 50, avgAttentionDemand: 50, avgVFX: 50
    }
  }

  return {
    avgPacing: Math.round((sums.pacing / totalWeight) * 10) / 10,
    avgIntensity: Math.round((sums.intensity / totalWeight) * 10) / 10,
    avgEmotionalDepth: Math.round((sums.depth / totalWeight) * 10) / 10,
    avgDialogueDensity: Math.round(sums.dialogue / totalWeight),
    avgAttentionDemand: Math.round(sums.attention / totalWeight),
    avgVFX: Math.round(sums.vfx / totalWeight)
  }
}

/**
 * Compute practical preferences (runtime, era)
 */
function computePracticalPreferences(weightedMovies) {
  const runtimes = []
  const decades = {}

  weightedMovies.forEach(m => {
    if (m.runtime) runtimes.push(m.runtime)
    if (m.release_year) {
      const decade = Math.floor(m.release_year / 10) * 10 + 's'
      decades[decade] = (decades[decade] || 0) + m.weight
    }
  })

  // Runtime stats
  const avgRuntime = runtimes.length > 0
    ? Math.round(runtimes.reduce((a, b) => a + b, 0) / runtimes.length)
    : 120
  const minRuntime = Math.min(...runtimes, 80)
  const maxRuntime = Math.max(...runtimes, 180)

  // Top decades
  const sortedDecades = Object.entries(decades)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([d]) => d)

  // Check if user watches classics
  const hasOldFilms = weightedMovies.some(m => m.release_year && m.release_year < 1990)

  return {
    avgRuntime,
    runtimeRange: [minRuntime, maxRuntime],
    preferredDecades: sortedDecades.length > 0 ? sortedDecades : ['2020s', '2010s'],
    toleratesClassics: hasOldFilms
  }
}

/**
 * Compute director and actor affinities
 */
function computePeopleAffinities(weightedMovies) {
  const directors = {}
  const actors = {}

  weightedMovies.forEach(m => {
    if (m.director_name) {
      if (!directors[m.director_name]) {
        directors[m.director_name] = { count: 0, fromFavorites: false }
      }
      directors[m.director_name].count++
      if (m.isOnboarding) directors[m.director_name].fromFavorites = true
    }

    if (m.lead_actor_name) {
      if (!actors[m.lead_actor_name]) {
        actors[m.lead_actor_name] = { count: 0, fromFavorites: false }
      }
      actors[m.lead_actor_name].count++
      if (m.isOnboarding) actors[m.lead_actor_name].fromFavorites = true
    }
  })

  // Filter to those with 2+ appearances
  const topDirectors = Object.entries(directors)
    .filter(([_, data]) => data.count >= THRESHOLDS.MIN_FILMS_FOR_AFFINITY)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, data]) => ({ name, ...data }))

  const topActors = Object.entries(actors)
    .filter(([_, data]) => data.count >= THRESHOLDS.MIN_FILMS_FOR_AFFINITY)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, data]) => ({ name, ...data }))

  return { directors: topDirectors, actors: topActors }
}

/**
 * Compute theme/keyword preferences
 */
function computeThemeAffinities(weightedMovies) {
  const keywordCounts = {}

  weightedMovies.forEach(m => {
    const keywords = m.keywords || []
    keywords.forEach(kw => {
      const name = typeof kw === 'object' ? kw.name : kw
      if (name && typeof name === 'string') {
        const normalized = name.toLowerCase()
        keywordCounts[normalized] = (keywordCounts[normalized] || 0) + m.weight
      }
    })
  })

  // Top keywords appearing 3+ weighted times
  const preferred = Object.entries(keywordCounts)
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword]) => keyword)

  return { preferred }
}

/**
 * Compute quality preferences
 */
function computeQualityProfile(weightedMovies, userRatings) {
  let ratingSum = 0
  let ratingCount = 0
  let hiddenGemCount = 0

  weightedMovies.forEach(m => {
    if (m.ff_rating) {
      ratingSum += m.ff_rating
      ratingCount++
    }
    // Hidden gem = low popularity but they watched it
    if (m.popularity && m.popularity < 20) {
      hiddenGemCount++
    }
  })

  const avgFFRating = ratingCount > 0
    ? Math.round((ratingSum / ratingCount) * 10) / 10
    : 7.0

  return {
    avgFFRating,
    watchesHiddenGems: hiddenGemCount >= 3,
    totalMoviesWatched: weightedMovies.length
  }
}

/**
 * Get user's top seed films for similarity matching
 * Prioritizes: onboarding favorites > highly rated > recently watched
 */
/**
 * Get user's seed films - EVOLVING based on behavior
 * Prioritizes: explicit ratings > recent quality watches > onboarding (decaying)
 */
async function getSeedFilms(userId, profile) {
  if (!userId) return []

  try {
    // Get user's watch history
    const { data: history } = await supabase
      .from('user_history')
      .select(`
        movie_id,
        source,
        watched_at,
        movies!inner (
          id, title, director_name, lead_actor_name,
          genres, keywords, primary_genre,
          original_language, release_year,
          pacing_score, intensity_score, emotional_depth_score,
          ff_rating
        )
      `)
      .eq('user_id', userId)
      .order('watched_at', { ascending: false })
      .limit(100)

    // Get user ratings (high-rated movies are strongest seeds)
    const { data: ratings, error: ratingsError } = await supabase
      .from('user_ratings')
      .select('movie_id, rating')
      .eq('user_id', userId)
      .gte('rating', 4)
      .order('rated_at', { ascending: false })
      .limit(20)

    if (ratingsError) {
      console.log('[getSeedFilms] Ratings query info:', ratingsError.message)
    }

    if (!history || history.length === 0) return []

    const totalWatched = profile.qualityProfile?.totalMoviesWatched || history.length
    const now = new Date()
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)

    // Calculate onboarding weight decay
    let onboardingWeight = 3.0
    if (totalWatched >= 50) onboardingWeight = 1.0
    else if (totalWatched >= 30) onboardingWeight = 1.5
    else if (totalWatched >= 10) onboardingWeight = 2.0

    // Build weighted seed candidates
    const seedCandidates = []
    const ratedMovieIds = new Set((ratings || []).map(r => r.movie_id))

    history.forEach(h => {
      if (!h.movies) return
      
      const movie = h.movies
      const watchedAt = new Date(h.watched_at)
      const isRecent = watchedAt >= thirtyDaysAgo
      const isOnboarding = h.source === 'onboarding'
      const isHighlyRated = ratedMovieIds.has(movie.id)
      const isQuality = movie.ff_rating >= 7.0

      // Calculate seed weight
      let weight = 0

      if (isHighlyRated) {
        // User explicitly rated 4-5 stars - STRONGEST signal
        weight = 5.0
      } else if (isOnboarding) {
        // Onboarding favorites - decays over time
        weight = onboardingWeight
      } else if (isRecent && isQuality) {
        // Recent quality watch - good signal
        weight = 2.0
      } else if (isQuality) {
        // Older quality watch - weak signal
        weight = 1.0
      }

      if (weight > 0) {
        seedCandidates.push({ movie, weight })
      }
    })

    // Sort by weight and take top 5
    seedCandidates.sort((a, b) => b.weight - a.weight)
    
    const seeds = seedCandidates
      .slice(0, 5)
      .map(c => c.movie)

    console.log('[getSeedFilms] Seed selection:', {
      totalWatched,
      onboardingWeight,
      seeds: seeds.map(s => s.title)
    })

    return seeds
  } catch (error) {
    console.error('[getSeedFilms] Error:', error)
    return []
  }
}

// ============================================================================
// MOVIE SCORING ALGORITHM
// ============================================================================

/**
 * Score a movie for a user based on their profile AND seed similarity
 * @param {Object} movie - Movie object from database
 * @param {Object} profile - User profile from computeUserProfile
 * @param {string} rowType - Row context for likely-seen weighting
 * @param {Array} seedFilms - User's favorite films for similarity matching
 * @returns {Object} { score, breakdown, pickReason }
 */
export function scoreMovieForUser(movie, profile, rowType = 'default', seedFilms = []) {
  const breakdown = {}
  let score = 0

  // 1. BASE QUALITY (max 100)
  const baseQuality = (movie.ff_rating || 5) * 10
  breakdown.baseQuality = baseQuality
  score += baseQuality

  // 2. LANGUAGE MATCH (max 30)
  const langScore = scoreLangaugeMatch(movie, profile)
  breakdown.language = langScore
  score += langScore

  // 3. GENRE MATCH (max 25, can go negative)
  const genreScore = scoreGenreMatch(movie, profile)
  breakdown.genre = genreScore
  score += genreScore

  // 4. CONTENT STYLE MATCH (max 47)
  const contentScore = scoreContentMatch(movie, profile)
  breakdown.content = contentScore.total
  breakdown.contentDetail = contentScore.detail
  score += contentScore.total

  // 5. KEYWORD/THEME MATCH (max 15)
  const keywordScore = scoreKeywordMatch(movie, profile)
  breakdown.keywords = keywordScore
  score += keywordScore

  // 6. PEOPLE AFFINITY (max 55+ now)
  const peopleScore = scorePeopleMatch(movie, profile)
  breakdown.people = peopleScore.total
  breakdown.peopleDetail = peopleScore.detail
  score += peopleScore.total

  // 7. ERA MATCH (max 8)
  const eraScore = scoreEraMatch(movie, profile)
  breakdown.era = eraScore
  score += eraScore

  // 8. RUNTIME MATCH (max 7, can go negative)
  const runtimeScore = scoreRuntimeMatch(movie, profile)
  breakdown.runtime = runtimeScore
  score += runtimeScore

  // 9. RECENCY BOOST (max 15)
  const recencyScore = scoreRecency(movie)
  breakdown.recency = recencyScore
  score += recencyScore

  // 10. QUALITY BONUSES (max 17)
  const qualityBonus = scoreQualityBonuses(movie)
  breakdown.qualityBonus = qualityBonus
  score += qualityBonus

  // 11. SEED SIMILARITY BONUS (NEW - TMDB-style) (max ~100)
  const seedSimilarity = calculateSeedSimilarity(movie, seedFilms)
  breakdown.seedSimilarity = seedSimilarity.score
  breakdown.seedMatch = seedSimilarity.bestSeed?.title || null
  score += seedSimilarity.score

  // 12. LIKELY-SEEN PENALTY
  const likelySeen = calculateLikelySeenScore(movie, profile)
  const likelySeenWeight = LIKELY_SEEN_WEIGHTS[rowType] || LIKELY_SEEN_WEIGHTS.default
  const likelySeenPenalty = likelySeen * likelySeenWeight
  breakdown.likelySeen = likelySeen
  breakdown.likelySeenPenalty = -likelySeenPenalty

  // FINAL SCORE
  const finalScore = Math.max(0, score - likelySeenPenalty)
  
  // Determine pick reason - now includes seed-based reasons
  const pickReason = determinePickReason(movie, profile, breakdown, seedSimilarity)

  return {
    score: Math.round(finalScore * 10) / 10,
    positiveScore: Math.round(score * 10) / 10,
    breakdown,
    pickReason
  }
}

/**
 * Language matching score
 */
function scoreLangaugeMatch(movie, profile) {
  const movieLang = movie.original_language
  if (!movieLang || !profile.languages.primary) return 5 // Neutral

  // Primary language match
  if (movieLang === profile.languages.primary) return 30

  // Secondary language match
  if (movieLang === profile.languages.secondary) return 20

  // Same region match
  const movieRegion = LANGUAGE_REGIONS[movieLang]
  if (movieRegion && movieRegion === profile.languages.regionAffinity) return 12

  // Adventurous user bonus for foreign films
  if (profile.languages.openness === 'adventurous') return 5
  if (profile.languages.openness === 'curious') return 3

  return 0
}

/**
 * Genre matching score
 */
/**
 * Genre matching score
 */
function scoreGenreMatch(movie, profile) {
  const movieGenres = (movie.genres || [])
    .map(g => extractGenreId(g))
    .filter(id => id !== null && !isNaN(id))
  
  if (movieGenres.length === 0 || profile.genres.preferred.length === 0) return 0

  let score = 0

  // Check preferred genres (+8 each, max 24)
  const preferredMatches = movieGenres.filter(g => profile.genres.preferred.includes(g))
  score += Math.min(preferredMatches.length * 8, 24)

  // Primary genre bonus
  if (profile.genres.preferred[0] && movieGenres.includes(profile.genres.preferred[0])) {
    score += 5
  }

  // Check secondary genres (+3 each, max 9)
  const secondaryMatches = movieGenres.filter(g => profile.genres.secondary.includes(g))
  score += Math.min(secondaryMatches.length * 3, 9)

  // Avoided genre penalty
  const avoidedMatches = movieGenres.filter(g => profile.genres.avoided.includes(g))
  if (avoidedMatches.length > 0) score -= 25

  return score
}

/**
 * Content style matching (pacing, intensity, etc.)
 */
function scoreContentMatch(movie, profile) {
  const detail = {}
  let total = 0
  const p = profile.contentProfile

  // Pacing (max 10)
  if (movie.pacing_score != null) {
    const diff = Math.abs(movie.pacing_score - p.avgPacing)
    if (diff <= 1) { detail.pacing = 10; total += 10 }
    else if (diff <= 2) { detail.pacing = 6; total += 6 }
    else if (diff <= 3) { detail.pacing = 3; total += 3 }
    else detail.pacing = 0
  }

  // Intensity (max 8)
  if (movie.intensity_score != null) {
    const diff = Math.abs(movie.intensity_score - p.avgIntensity)
    if (diff <= 1) { detail.intensity = 8; total += 8 }
    else if (diff <= 2) { detail.intensity = 5; total += 5 }
    else if (diff <= 3) { detail.intensity = 2; total += 2 }
    else detail.intensity = 0
  }

  // Emotional depth (max 7)
  if (movie.emotional_depth_score != null) {
    const diff = Math.abs(movie.emotional_depth_score - p.avgEmotionalDepth)
    if (diff <= 1) { detail.depth = 7; total += 7 }
    else if (diff <= 2) { detail.depth = 4; total += 4 }
    else if (diff <= 3) { detail.depth = 2; total += 2 }
    else detail.depth = 0
  }

  // Dialogue density (max 8)
  if (movie.dialogue_density != null) {
    const diff = Math.abs(movie.dialogue_density - p.avgDialogueDensity)
    if (diff <= 10) { detail.dialogue = 8; total += 8 }
    else if (diff <= 20) { detail.dialogue = 5; total += 5 }
    else if (diff <= 30) { detail.dialogue = 2; total += 2 }
    else detail.dialogue = 0
  }

  // Attention demand (max 8)
  if (movie.attention_demand != null) {
    const diff = Math.abs(movie.attention_demand - p.avgAttentionDemand)
    if (diff <= 10) { detail.attention = 8; total += 8 }
    else if (diff <= 20) { detail.attention = 5; total += 5 }
    else if (diff <= 30) { detail.attention = 2; total += 2 }
    else detail.attention = 0
  }

  // VFX preference (max 6)
  if (movie.vfx_level_score != null) {
    const diff = Math.abs(movie.vfx_level_score - p.avgVFX)
    if (diff <= 15) { detail.vfx = 6; total += 6 }
    else if (diff <= 30) { detail.vfx = 3; total += 3 }
    else detail.vfx = 0
  }

  return { total, detail }
}

/**
 * Keyword/theme matching
 */
function scoreKeywordMatch(movie, profile) {
  const movieKeywords = (movie.keywords || [])
    .map(kw => (typeof kw === 'object' ? kw.name : kw)?.toLowerCase())
    .filter(Boolean)

  if (movieKeywords.length === 0 || profile.themes.preferred.length === 0) return 0

  let matches = 0
  profile.themes.preferred.forEach(theme => {
    // Fuzzy match: check if movie keyword includes the theme
    if (movieKeywords.some(kw => kw.includes(theme) || theme.includes(kw))) {
      matches++
    }
  })

  return Math.min(matches * 3, 15)
}

/**
 * Director and actor affinity matching
 */
/**
 * Director and actor affinity matching - HIGH VALUE SIGNAL
 */
function scorePeopleMatch(movie, profile) {
  const detail = { director: 0, actor: 0 }

  // Director match - THIS IS A STRONG SIGNAL
  if (movie.director_name && profile.affinities?.directors?.length > 0) {
    const dirAffinity = profile.affinities.directors.find(
      d => d.name.toLowerCase() === movie.director_name.toLowerCase()
    )
    if (dirAffinity) {
      // Scale by how many films user has seen from this director
      const countBonus = Math.min(dirAffinity.count * 5, 20) // up to +20 for 4+ films
      detail.director = dirAffinity.fromFavorites ? 35 + countBonus : 25 + countBonus
    }
  }

  // Lead actor match
  if (movie.lead_actor_name && profile.affinities?.actors?.length > 0) {
    const actorAffinity = profile.affinities.actors.find(
      a => a.name.toLowerCase() === movie.lead_actor_name.toLowerCase()
    )
    if (actorAffinity) {
      const countBonus = Math.min(actorAffinity.count * 3, 12)
      detail.actor = actorAffinity.fromFavorites ? 20 + countBonus : 15 + countBonus
    }
  }

  return { total: detail.director + detail.actor, detail }
}

// ============================================================================
// SEED-BASED SIMILARITY (TMDB-STYLE)
// ============================================================================

/**
 * Calculate similarity between a candidate movie and user's seed films
 * This mimics TMDB's "similar movies" approach
 */
function calculateSeedSimilarity(movie, seedFilms) {
  if (!seedFilms || seedFilms.length === 0) {
    return { score: 0, bestSeed: null, matchReasons: [] }
  }

  let bestScore = 0
  let bestSeed = null
  let bestReasons = []

  for (const seed of seedFilms) {
    let score = 0
    const reasons = []

    // Same director = strong signal
    if (movie.director_name && seed.director_name &&
        movie.director_name.toLowerCase() === seed.director_name.toLowerCase()) {
      score += 35
      reasons.push('same director')
    }

    // Genre overlap
    const movieGenres = (movie.genres || []).map(g => extractGenreId(g)).filter(Boolean)
    const seedGenres = (seed.genres || []).map(g => extractGenreId(g)).filter(Boolean)
    const genreOverlap = movieGenres.filter(g => seedGenres.includes(g)).length
    if (genreOverlap > 0) {
      const genreBonus = Math.min(genreOverlap * 8, 24)
      score += genreBonus
      if (genreOverlap >= 2) reasons.push('similar genres')
    }

    // Primary genre match (stronger signal)
    if (movie.primary_genre && seed.primary_genre &&
        movie.primary_genre.toLowerCase() === seed.primary_genre.toLowerCase()) {
      score += 10
    }

    // Keyword/theme overlap
    const movieKeywords = (movie.keywords || [])
      .map(k => (typeof k === 'object' ? k.name : k)?.toLowerCase())
      .filter(Boolean)
    const seedKeywords = (seed.keywords || [])
      .map(k => (typeof k === 'object' ? k.name : k)?.toLowerCase())
      .filter(Boolean)
    
    let keywordMatches = 0
    for (const mk of movieKeywords) {
      for (const sk of seedKeywords) {
        if (mk.includes(sk) || sk.includes(mk)) {
          keywordMatches++
          break
        }
      }
    }
    if (keywordMatches > 0) {
      const keywordBonus = Math.min(keywordMatches * 6, 30)
      score += keywordBonus
      if (keywordMatches >= 2) reasons.push('similar themes')
    }

    // Content style similarity (pacing, intensity, depth)
    if (movie.pacing_score != null && seed.pacing_score != null) {
      const pacingDiff = Math.abs(movie.pacing_score - seed.pacing_score)
      if (pacingDiff <= 1) score += 8
      else if (pacingDiff <= 2) score += 4
    }

    if (movie.intensity_score != null && seed.intensity_score != null) {
      const intensityDiff = Math.abs(movie.intensity_score - seed.intensity_score)
      if (intensityDiff <= 1) score += 8
      else if (intensityDiff <= 2) score += 4
    }

    if (movie.emotional_depth_score != null && seed.emotional_depth_score != null) {
      const depthDiff = Math.abs(movie.emotional_depth_score - seed.emotional_depth_score)
      if (depthDiff <= 1) score += 6
      else if (depthDiff <= 2) score += 3
    }

    // Same language
    if (movie.original_language === seed.original_language) {
      score += 5
    }

    // Similar era (within 10 years)
    if (movie.release_year && seed.release_year) {
      const yearDiff = Math.abs(movie.release_year - seed.release_year)
      if (yearDiff <= 5) score += 6
      else if (yearDiff <= 10) score += 3
    }

    // Track best match
    if (score > bestScore) {
      bestScore = score
      bestSeed = seed
      bestReasons = reasons
    }
  }

  return {
    score: bestScore,
    bestSeed,
    matchReasons: bestReasons
  }
}

/**
 * Era/decade matching
 */
function scoreEraMatch(movie, profile) {
  if (!movie.release_year) return 0

  const movieDecade = Math.floor(movie.release_year / 10) * 10 + 's'
  const prefs = profile.preferences.preferredDecades

  if (prefs.includes(movieDecade)) return 8

  // Adjacent decade
  const movieDecadeNum = parseInt(movieDecade)
  const hasAdjacent = prefs.some(d => {
    const prefNum = parseInt(d)
    return Math.abs(prefNum - movieDecadeNum) === 10
  })
  if (hasAdjacent) return 4

  // User tolerates classics
  if (movie.release_year < 1990 && profile.preferences.toleratesClassics) return 2

  return 0
}

/**
 * Runtime matching
 */
function scoreRuntimeMatch(movie, profile) {
  if (!movie.runtime) return 0

  const avg = profile.preferences.avgRuntime
  const [min, max] = profile.preferences.runtimeRange
  const runtime = movie.runtime

  // Perfect match
  if (Math.abs(runtime - avg) <= 15) return 7

  // Close match
  if (Math.abs(runtime - avg) <= 30) return 4

  // Within range
  if (runtime >= min && runtime <= max) return 2

  // Too long penalty
  if (runtime > max + 30) return -5

  return 0
}

/**
 * Recency boost for newer films
 */
function scoreRecency(movie) {
  if (!movie.release_year) return 0

  const currentYear = new Date().getFullYear()
  const age = currentYear - movie.release_year

  if (age === 0) return 15
  if (age === 1) return 10
  if (age <= 3) return 5

  return 0
}

/**
 * Quality bonuses
 */
function scoreQualityBonuses(movie) {
  let bonus = 0

  if (movie.quality_score >= 85) bonus += 8
  else if (movie.quality_score >= 75) bonus += 4

  if (movie.cult_status_score >= 50) bonus += 7
  else if (movie.cult_status_score >= 30) bonus += 3

  if (movie.ff_confidence >= 80) bonus += 2

  return bonus
}

// ============================================================================
// LIKELY-SEEN PENALTY SYSTEM
// ============================================================================

/**
 * Calculate how likely a user has already seen this movie elsewhere
 * @param {Object} movie - Movie object
 * @param {Object} profile - User profile
 * @returns {number} Likely-seen score (0-100)
 */
export function calculateLikelySeenScore(movie, profile) {
  let score = 0

  // 1. POPULARITY (max 40)
  const pop = movie.popularity || 0
  if (pop >= 100) score += 40
  else if (pop >= 60) score += 30
  else if (pop >= 30) score += 15
  else if (pop >= 10) score += 5

  // 2. VOTE COUNT (max 25)
  const votes = movie.vote_count || 0
  if (votes >= 10000) score += 25
  else if (votes >= 5000) score += 15
  else if (votes >= 2000) score += 10
  else if (votes >= 500) score += 5

  // 3. AGE + POPULARITY COMBO (max 15)
  const currentYear = new Date().getFullYear()
  const age = movie.release_year ? currentYear - movie.release_year : 0
  if (age > 10 && pop > 40) score += 15
  else if (age > 20 && votes > 5000) score += 10

  // 4. RECENCY DISCOUNT (negative)
  if (age === 0) score -= 25
  else if (age === 1) score -= 15
  else if (age <= 3) score -= 5

  // 5. LANGUAGE FACTOR
  const isEnglish = movie.original_language === 'en'
  const isUserLanguage = movie.original_language === profile.languages?.primary
  
  if (isEnglish && pop > 40) score += 10
  if (!isEnglish && !isUserLanguage) score -= 10

  // 6. REVENUE (max 20)
  const revenue = movie.revenue || 0
  if (revenue >= 1000000000) score += 20
  else if (revenue >= 500000000) score += 12
  else if (revenue >= 200000000) score += 6

  // 7. USER VOLUME MULTIPLIER
  const watched = profile.qualityProfile?.totalMoviesWatched || 0
  if (watched >= 100) score *= 1.3
  else if (watched >= 50) score *= 1.15

  // 8. AFFINITY DISCOUNT - If user loves this director/actor, they WANT more
  const hasDirectorAffinity = profile.affinities?.directors?.some(
    d => d.name.toLowerCase() === movie.director_name?.toLowerCase()
  )
  const hasActorAffinity = profile.affinities?.actors?.some(
    a => a.name.toLowerCase() === movie.lead_actor_name?.toLowerCase()
  )
  
  if (hasDirectorAffinity) {
    score *= 0.4  // 60% reduction - user clearly wants more from this director
  } else if (hasActorAffinity) {
    score *= 0.6  // 40% reduction
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score)))
}

// ============================================================================
// PICK REASON GENERATION
// ============================================================================

/**
 * Determine the best "pick reason" label for UI display
 * @param {Object} movie - Movie object
 * @param {Object} profile - User profile
 * @param {Object} breakdown - Score breakdown
 * @returns {Object} { label, type }
 */
/**
 * Determine the best "pick reason" label for UI display
 */
function determinePickReason(movie, profile, breakdown, seedSimilarity = {}) {
  // Priority 1: Strong seed match - "Because you loved [Film]"
  if (seedSimilarity.score >= 40 && seedSimilarity.bestSeed) {
    return {
      label: `Because you loved ${seedSimilarity.bestSeed.title}`,
      type: 'seed_similarity',
      seedTitle: seedSimilarity.bestSeed.title
    }
  }

  // Priority 2: Director affinity
  if (breakdown.peopleDetail?.director >= 25) {
    return {
      label: `Because you love ${movie.director_name}`,
      type: 'director_affinity'
    }
  }

  // Priority 3: Actor affinity
  if (breakdown.peopleDetail?.actor >= 15) {
    return {
      label: `Starring ${movie.lead_actor_name}`,
      type: 'actor_affinity'
    }
  }

  // Priority 4: Moderate seed match
  if (seedSimilarity.score >= 25 && seedSimilarity.bestSeed) {
    return {
      label: `Similar to ${seedSimilarity.bestSeed.title}`,
      type: 'seed_similar',
      seedTitle: seedSimilarity.bestSeed.title
    }
  }

  // Priority 5: Strong language + genre combo
  if (breakdown.language >= 20 && breakdown.genre >= 15) {
    return {
      label: 'Perfect for you',
      type: 'perfect_match'
    }
  }

  // Priority 6: Strong genre match alone
  if (breakdown.genre >= 20) {
    return {
      label: 'Right up your alley',
      type: 'genre_match'
    }
  }

  // Priority 7: Hidden gem
  if (movie.cult_status_score >= 50 && movie.popularity < 30) {
    return {
      label: 'Hidden gem',
      type: 'hidden_gem'
    }
  }

  // Priority 8: Quality pick
  if (movie.quality_score >= 85 || movie.ff_rating >= 7.5) {
    return {
      label: 'Critically acclaimed',
      type: 'quality'
    }
  }

  // Priority 9: Fresh release
  const currentYear = new Date().getFullYear()
  if (movie.release_year === currentYear) {
    return {
      label: 'Fresh pick',
      type: 'recency'
    }
  }

  // Priority 10: Content style match
  if (breakdown.content >= 35) {
    return {
      label: 'Matches your vibe',
      type: 'content_match'
    }
  }

  // Default
  return {
    label: 'Recommended for you',
    type: 'default'
  }
}

// ============================================================================
// HERO TOP PICK SELECTION
// ============================================================================

/**
 * Get personalized top pick for Hero section
 * NOW WITH: Embedding similarity, diversity constraints, impression tracking
 * 
 * @param {string} userId - User UUID
 * @param {Object} options - Optional overrides
 * @returns {Promise<Object>} { movie, pickReason, score, debug }
 */
export async function getTopPickForUser(userId, options = {}) {
  const {
    excludeIds = [],
    forceRefresh = false
  } = options

  console.log('[getTopPickForUser] Called with userId:', userId, 'excludeIds:', excludeIds)

  try {
    // Handle guest users - use fallback with empty profile
    if (!userId) {
      console.log('[getTopPickForUser] No userId, using fallback')
      return await getFallbackPick(null)
    }

    // 1. Compute user profile
    const profile = await computeUserProfile(userId)

    // 2. Get user's watched movie IDs to exclude
    const { data: watchedData } = await supabase
      .from('user_history')
      .select('movie_id')
      .eq('user_id', userId)

    const watchedIds = watchedData?.map(w => w.movie_id) || []
    const allExcludeIds = [...new Set([...watchedIds, ...excludeIds])]

    // 3. Get seed films FIRST (needed for embedding search)
    const seedFilms = await getSeedFilms(userId, profile)
    const seedIds = seedFilms.map(s => s.id).filter(Boolean)
    
    console.log('[getTopPickForUser] Seed films:', seedFilms.map(s => s.title))

    // 4. Fetch hero candidates - MULTIPLE POOLS
    const selectFields = `
      id, tmdb_id, title, overview, tagline,
      original_language, runtime, release_year, release_date,
      poster_path, backdrop_path, trailer_youtube_key,
      ff_rating, ff_confidence, quality_score, vote_average,
      pacing_score, intensity_score, emotional_depth_score,
      dialogue_density, attention_demand, vfx_level_score,
      cult_status_score, popularity, vote_count, revenue,
      director_name, lead_actor_name,
      genres, keywords, primary_genre
    `

    // Pool 1: Top rated films
    const { data: topRated } = await supabase
      .from('movies')
      .select(selectFields)
      .eq('is_valid', true)
      .not('backdrop_path', 'is', null)
      .gte('ff_rating', THRESHOLDS.MIN_FF_RATING)
      .gte('ff_confidence', THRESHOLDS.MIN_FF_CONFIDENCE)
      .order('ff_rating', { ascending: false })
      .limit(100)

    // Pool 2: Films from user's favorite directors
    const directorNames = profile.affinities.directors.map(d => d.name)
    let directorFilms = []
    if (directorNames.length > 0) {
      const { data: dirFilms } = await supabase
        .from('movies')
        .select(selectFields)
        .eq('is_valid', true)
        .not('backdrop_path', 'is', null)
        .in('director_name', directorNames)
        .gte('ff_rating', 6.0)
      directorFilms = dirFilms || []
    }

    // Pool 3: Recent high-quality films (last 2 years)
    const currentYear = new Date().getFullYear()
    const { data: recentFilms } = await supabase
      .from('movies')
      .select(selectFields)
      .eq('is_valid', true)
      .not('backdrop_path', 'is', null)
      .gte('ff_rating', 6.5)
      .gte('release_year', currentYear - 2)
      .limit(50)

    // Pool 4: EMBEDDING NEIGHBORS (semantic similarity to seeds) - NEW!
    let embeddingNeighbors = []
    if (seedIds.length > 0) {
      const { data: embeddingMatches, error: embError } = await supabase
        .rpc('match_movies_by_seeds', {
          seed_ids: seedIds,
          exclude_ids: allExcludeIds,
          match_count: 50,
          min_ff_rating: 6.0
        })
      
      if (embError) {
        console.warn('[getTopPickForUser] Embedding search error:', embError.message)
      } else {
        embeddingNeighbors = embeddingMatches || []
        console.log('[getTopPickForUser] Embedding neighbors found:', embeddingNeighbors.length)
      }
    }

    // Combine and deduplicate all pools
    const allCandidates = [
      ...(topRated || []), 
      ...(directorFilms || []), 
      ...(recentFilms || []),
      ...(embeddingNeighbors || [])
    ]
    
    // Deduplicate, but preserve embedding similarity if present
    const candidateMap = new Map()
    allCandidates.forEach(m => {
      if (!candidateMap.has(m.id)) {
        candidateMap.set(m.id, {
          ...m,
          _embeddingSimilarity: m.similarity || null,
          _matchedSeedId: m.matched_seed_id || null,
          _matchedSeedTitle: m.matched_seed_title || null
        })
      } else if (m.similarity && !candidateMap.get(m.id)._embeddingSimilarity) {
        // Update with embedding data if we didn't have it
        const existing = candidateMap.get(m.id)
        existing._embeddingSimilarity = m.similarity
        existing._matchedSeedId = m.matched_seed_id
        existing._matchedSeedTitle = m.matched_seed_title
      }
    })
    const candidates = Array.from(candidateMap.values())

    console.log('[getTopPickForUser] Candidate pools:', {
      topRated: topRated?.length || 0,
      directorFilms: directorFilms?.length || 0,
      recentFilms: recentFilms?.length || 0,
      embeddingNeighbors: embeddingNeighbors?.length || 0,
      totalUnique: candidates.length
    })

    console.log('[getTopPickForUser] Exclusion check:', {
      watchedIds: allExcludeIds.slice(0, 10),
      totalWatched: allExcludeIds.length,
      candidatesBefore: candidates.length
    })

    if (!candidates || candidates.length === 0) {
      return await getFallbackPick(profile)
    }

    // 5. Filter out watched/excluded movies
    const eligibleCandidates = candidates.filter(m => !allExcludeIds.includes(m.id))

    console.log('[getTopPickForUser] After exclusion:', {
      candidatesAfter: eligibleCandidates.length,
      excluded: candidates.length - eligibleCandidates.length
    })

    if (eligibleCandidates.length === 0) {
      return await getFallbackPick(profile)
    }

    // 6. Score all candidates with EMBEDDING SIMILARITY boost
    const scoredCandidates = eligibleCandidates.map(movie => {
      const result = scoreMovieForUser(movie, profile, 'hero', seedFilms)
      
      // EMBEDDING SIMILARITY BOOST (replaces/supplements rule-based seed similarity)
      let embeddingBoost = 0
      let embeddingReason = null
      
      if (movie._embeddingSimilarity) {
        // Scale: 0.5 similarity = 0 points, 0.7 = 40 points, 0.9 = 80 points
        const simNormalized = Math.max(0, movie._embeddingSimilarity - 0.5) / 0.4
        embeddingBoost = Math.round(simNormalized * 80)
        embeddingReason = {
          seedTitle: movie._matchedSeedTitle,
          similarity: movie._embeddingSimilarity
        }
      }
      
      return {
        movie,
        ...result,
        score: result.score + embeddingBoost,
        embeddingBoost,
        embeddingReason,
        breakdown: {
          ...result.breakdown,
          embeddingSimilarity: embeddingBoost
        }
      }
    })

    // Sort by personalization score
    scoredCandidates.sort((a, b) => b.score - a.score)

    // 7. Stage 2: Hero-specific adjustments on top 30
    const top30 = scoredCandidates.slice(0, 30).map(candidate => {
      let heroScore = candidate.score
      const movie = candidate.movie
      
      // Freshness boost for Hero
      const age = movie.release_year ? currentYear - movie.release_year : 10
      if (age === 0) heroScore += 20
      else if (age === 1) heroScore += 12
      else if (age <= 3) heroScore += 5
      
      // Variety boost - favor films from different directors than seeds
      const seedDirectors = seedFilms.map(s => s.director_name?.toLowerCase()).filter(Boolean)
      if (movie.director_name && !seedDirectors.includes(movie.director_name.toLowerCase())) {
        heroScore += 8
      }

      return {
        ...candidate,
        heroScore,
        originalScore: candidate.score
      }
    })

    // Sort by hero-adjusted score
    top30.sort((a, b) => b.heroScore - a.heroScore)

    // 8. DIVERSITY FILTER - NEW!
    const diverseTop5 = applyDiversityFilter(top30, seedFilms)

    // 9. Weighted random from diverse top 5
    const selected = weightedRandomSelect(diverseTop5)
    selected.score = selected.heroScore

    // 10. Determine final pick reason (prioritize embedding match)
    if (selected.embeddingReason && selected.embeddingBoost >= 30) {
      selected.pickReason = {
        label: `Because you loved ${selected.embeddingReason.seedTitle}`,
        type: 'embedding_similarity',
        seedTitle: selected.embeddingReason.seedTitle,
        similarity: selected.embeddingReason.similarity
      }
    }

    console.log('[getTopPickForUser] Profile confidence:', profile.meta.confidence)
    console.log('[getTopPickForUser] Top 5 picks (diverse, hero-adjusted):', diverseTop5.map(c => ({
      title: c.movie.title,
      heroScore: c.heroScore,
      originalScore: c.originalScore,
      embeddingBoost: c.embeddingBoost,
      embeddingSeed: c.embeddingReason?.seedTitle,
      reason: c.pickReason.label,
      year: c.movie.release_year,
      director: c.movie.director_name,
      genre: c.movie.primary_genre
    })))
    console.log('[getTopPickForUser] Selected:', selected.movie.title, '| Reason:', selected.pickReason.label)

    // 11. LOG IMPRESSION (async, don't await)
    logImpression(userId, selected, 'hero').catch(err => 
      console.warn('[getTopPickForUser] Failed to log impression:', err.message)
    )

    return {
      movie: selected.movie,
      pickReason: selected.pickReason,
      score: selected.score,
      debug: {
        profileConfidence: profile.meta.confidence,
        candidatesScored: scoredCandidates.length,
        embeddingNeighborsUsed: embeddingNeighbors.length,
        top5Scores: diverseTop5.map(c => ({ 
          title: c.movie.title, 
          score: c.heroScore,
          embeddingBoost: c.embeddingBoost,
          reason: c.pickReason.type 
        }))
      }
    }

  } catch (error) {
    console.error('[getTopPickForUser] Error:', error)
    return await getFallbackPick(null)
  }
}


/**
 * Apply diversity constraints to top candidates
 * - Max 2 from same director
 * - Max 2 from same primary genre
 * - At least 1 "discovery" if possible (different from seeds)
 */
function applyDiversityFilter(sortedCandidates, seedFilms) {
  const result = []
  const directorCounts = new Map()
  const genreCounts = new Map()
  const seedDirectors = new Set(seedFilms.map(s => s.director_name?.toLowerCase()).filter(Boolean))
  const seedGenres = new Set(seedFilms.map(s => s.primary_genre?.toLowerCase()).filter(Boolean))
  
  let hasDiscovery = false
  
  for (const candidate of sortedCandidates) {
    if (result.length >= 5) break
    
    const movie = candidate.movie
    const director = movie.director_name?.toLowerCase() || 'unknown'
    const genre = movie.primary_genre?.toLowerCase() || 'unknown'
    
    // Check director limit
    const dirCount = directorCounts.get(director) || 0
    if (dirCount >= 2) continue
    
    // Check genre limit
    const genreCount = genreCounts.get(genre) || 0
    if (genreCount >= 2) continue
    
    // Track if this is a discovery (outside comfort zone)
    const isDiscovery = !seedDirectors.has(director) && !seedGenres.has(genre)
    
    // Add to result
    result.push({
      ...candidate,
      _isDiscovery: isDiscovery
    })
    
    directorCounts.set(director, dirCount + 1)
    genreCounts.set(genre, genreCount + 1)
    if (isDiscovery) hasDiscovery = true
  }
  
  // If no discovery in top 5, try to swap one in
  if (!hasDiscovery && result.length === 5) {
    const discoveryCandidate = sortedCandidates.find(c => {
      const director = c.movie.director_name?.toLowerCase() || ''
      const genre = c.movie.primary_genre?.toLowerCase() || ''
      return !seedDirectors.has(director) && !seedGenres.has(genre) && !result.includes(c)
    })
    
    if (discoveryCandidate) {
      // Replace 5th pick with discovery
      result[4] = { ...discoveryCandidate, _isDiscovery: true }
      console.log('[applyDiversityFilter] Swapped in discovery:', discoveryCandidate.movie.title)
    }
  }
  
  console.log('[applyDiversityFilter] Diversity stats:', {
    directors: Object.fromEntries(directorCounts),
    genres: Object.fromEntries(genreCounts),
    hasDiscovery
  })
  
  return result
}


/**
 * Log recommendation impression for future learning
 */
async function logImpression(userId, selected, placement) {
  if (!userId || !selected?.movie?.id) return
  
  try {
    await supabase
      .from('recommendation_impressions')
      .insert({
        user_id: userId,
        movie_id: selected.movie.id,
        placement,
        pick_reason_type: selected.pickReason?.type || 'unknown',
        pick_reason_label: selected.pickReason?.label || null,
        score: selected.score,
        seed_movie_id: selected.embeddingReason?.seedId || null,
        seed_movie_title: selected.embeddingReason?.seedTitle || null,
        embedding_similarity: selected.embeddingReason?.similarity || null,
        algorithm_version: 'v2.1-embeddings'
      })
    
    console.log('[logImpression] Logged:', {
      movie: selected.movie.title,
      placement,
      reason: selected.pickReason?.type
    })
  } catch (error) {
    // Don't throw - impression logging is non-critical
    console.warn('[logImpression] Error:', error.message)
  }
}

/**
 * Update an existing impression with user interaction
 */
export async function updateImpression(userId, movieId, placement, updates) {
  if (!userId || !movieId) return
  
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { error } = await supabase
      .from('recommendation_impressions')
      .update(updates)
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .eq('placement', placement)
      .eq('shown_date', today)
    
    if (error) throw error
    
    console.log('[updateImpression] Updated:', { movieId, placement, ...updates })
  } catch (error) {
    console.warn('[updateImpression] Error:', error.message)
  }
}

/**
 * Weighted random selection from top candidates
 * Weights: #1=35%, #2=25%, #3=20%, #4=12%, #5=8%
 */
function weightedRandomSelect(candidates) {
  const weights = [0.35, 0.25, 0.20, 0.12, 0.08]
  const random = Math.random()
  
  let cumulative = 0
  for (let i = 0; i < candidates.length; i++) {
    cumulative += weights[i] || 0.05
    if (random <= cumulative) {
      return candidates[i]
    }
  }
  
  return candidates[0]
}

/**
 * Fallback pick when personalization fails
 */
async function getFallbackPick(profile) {
  try {
    // Tier 1: High quality recent films
    const { data: fallback } = await supabase
      .from('movies')
      .select(`
        id, title, overview, tagline,
        original_language, runtime, release_year,
        poster_path, backdrop_path, trailer_youtube_key,
        ff_rating, ff_confidence, quality_score,
        pacing_score, intensity_score, emotional_depth_score,
        dialogue_density, attention_demand, vfx_level_score,
        cult_status_score, popularity, vote_count, revenue,
        director_name, lead_actor_name,
        genres, keywords, primary_genre
      `)
      .eq('is_valid', true)
      .not('backdrop_path', 'is', null)
      .gte('ff_rating', 7.0)
      .gte('vote_count', 500)
      .order('ff_rating', { ascending: false })
      .limit(10)

    if (fallback && fallback.length > 0) {
      // Random from top 10
      const selected = fallback[Math.floor(Math.random() * fallback.length)]
      return {
        movie: selected,
        pickReason: { label: 'Highly rated', type: 'fallback_quality' },
        score: selected.ff_rating * 10,
        debug: { fallback: true, tier: 1 }
      }
    }

    // Tier 2: Any valid movie with backdrop
    const { data: anyMovie } = await supabase
      .from('movies')
      .select('*')
      .eq('is_valid', true)
      .not('backdrop_path', 'is', null)
      .order('ff_rating', { ascending: false })
      .limit(1)

    if (anyMovie && anyMovie[0]) {
      return {
        movie: anyMovie[0],
        pickReason: { label: 'Featured film', type: 'fallback_any' },
        score: 50,
        debug: { fallback: true, tier: 2 }
      }
    }

    throw new Error('No valid movies found')

  } catch (error) {
    console.error('[getFallbackPick] Error:', error)
    return {
      movie: null,
      pickReason: { label: 'Error', type: 'error' },
      score: 0,
      debug: { error: error.message }
    }
  }
}

// ============================================================================
// QUICK PICKS ROW
// ============================================================================

/**
 * Get personalized quick picks for homepage row
 * NOW WITH: Embedding similarity, diversity, impression tracking
 * 
 * @param {string} userId - User UUID
 * @param {Object} options - Optional overrides
 * @returns {Promise<Object[]>} Array of scored movies
 */
export async function getQuickPicksForUser(userId, options = {}) {
  const {
    limit = 20,
    excludeIds = []
  } = options

  try {
    if (!userId) {
      console.log('[getQuickPicksForUser] No userId, returning empty')
      return []
    }

    // 1. Compute user profile
    const profile = await computeUserProfile(userId)
    
    console.log('[getQuickPicksForUser] User profile:', {
      primaryLang: profile.languages.primary,
      preferredGenres: profile.genres.preferred,
      directors: profile.affinities.directors.map(d => d.name).slice(0, 3),
      totalWatched: profile.qualityProfile.totalMoviesWatched
    })

    // 2. Get seed films for embedding search
    const seedFilms = await getSeedFilms(userId, profile)
    const seedIds = seedFilms.map(s => s.id).filter(Boolean)
    
    console.log('[getQuickPicksForUser] Seed films:', seedFilms.map(s => s.title))

    // 3. Get user's watched movie IDs
    const { data: watchedData } = await supabase
      .from('user_history')
      .select('movie_id')
      .eq('user_id', userId)

    const watchedIds = watchedData?.map(w => w.movie_id) || []
    const allExcludeIds = [...new Set([...watchedIds, ...excludeIds])]

    // 4. Fetch candidates - MULTIPLE POOLS
    const selectFields = `
      id, tmdb_id, title, overview, tagline,
      original_language, runtime, release_year, release_date,
      poster_path, backdrop_path, trailer_youtube_key,
      ff_rating, ff_confidence, quality_score, vote_average,
      pacing_score, intensity_score, emotional_depth_score,
      dialogue_density, attention_demand, vfx_level_score,
      cult_status_score, popularity, vote_count, revenue,
      director_name, lead_actor_name,
      genres, keywords, primary_genre
    `

    // Pool 1: Quality films
    const { data: qualityFilms } = await supabase
      .from('movies')
      .select(selectFields)
      .eq('is_valid', true)
      .not('poster_path', 'is', null)
      .gte('ff_rating', 6.0)
      .order('ff_rating', { ascending: false })
      .limit(150)

    // Pool 2: Embedding neighbors (semantic similarity)
    let embeddingNeighbors = []
    if (seedIds.length > 0) {
      const { data: embeddingMatches, error: embError } = await supabase
        .rpc('match_movies_by_seeds', {
          seed_ids: seedIds,
          exclude_ids: allExcludeIds,
          match_count: 50,
          min_ff_rating: 5.5  // Lower threshold for variety
        })
      
      if (embError) {
        console.warn('[getQuickPicksForUser] Embedding search error:', embError.message)
      } else {
        embeddingNeighbors = embeddingMatches || []
        console.log('[getQuickPicksForUser] Embedding neighbors found:', embeddingNeighbors.length)
      }
    }

    // Combine and deduplicate
    const allCandidates = [
      ...(qualityFilms || []),
      ...(embeddingNeighbors || [])
    ]
    
    const candidateMap = new Map()
    allCandidates.forEach(m => {
      if (!candidateMap.has(m.id)) {
        candidateMap.set(m.id, {
          ...m,
          _embeddingSimilarity: m.similarity || null,
          _matchedSeedId: m.matched_seed_id || null,
          _matchedSeedTitle: m.matched_seed_title || null
        })
      } else if (m.similarity && !candidateMap.get(m.id)._embeddingSimilarity) {
        const existing = candidateMap.get(m.id)
        existing._embeddingSimilarity = m.similarity
        existing._matchedSeedId = m.matched_seed_id
        existing._matchedSeedTitle = m.matched_seed_title
      }
    })
    const candidates = Array.from(candidateMap.values())

    console.log('[getQuickPicksForUser] Candidate pools:', {
      qualityFilms: qualityFilms?.length || 0,
      embeddingNeighbors: embeddingNeighbors?.length || 0,
      totalUnique: candidates.length
    })

    // 5. Filter out watched/excluded
    const eligible = candidates.filter(m => !allExcludeIds.includes(m.id))

    console.log('[getQuickPicksForUser] After exclusion:', {
      eligible: eligible.length,
      excluded: candidates.length - eligible.length
    })

    if (eligible.length === 0) return []

    // 6. Score with embedding boost
    const scored = eligible.map(movie => {
      const result = scoreMovieForUser(movie, profile, 'quick_picks', seedFilms)
      
      // Embedding similarity boost
      let embeddingBoost = 0
      let embeddingReason = null
      
      if (movie._embeddingSimilarity) {
        const simNormalized = Math.max(0, movie._embeddingSimilarity - 0.5) / 0.4
        embeddingBoost = Math.round(simNormalized * 60)  // Max 60 for rows (vs 80 for hero)
        embeddingReason = {
          seedTitle: movie._matchedSeedTitle,
          seedId: movie._matchedSeedId,
          similarity: movie._embeddingSimilarity
        }
      }
      
      // Update pick reason if embedding match is strong
      let pickReason = result.pickReason
      if (embeddingReason && embeddingBoost >= 25) {
        pickReason = {
          label: `Because you loved ${embeddingReason.seedTitle}`,
          type: 'embedding_similarity',
          seedTitle: embeddingReason.seedTitle,
          similarity: embeddingReason.similarity
        }
      }
      
      return { 
        movie, 
        ...result,
        score: result.score + embeddingBoost,
        embeddingBoost,
        embeddingReason,
        pickReason
      }
    })

    // 7. Sort by score
    scored.sort((a, b) => b.score - a.score)

    // 8. Apply diversity filter for final selection
    const diverse = applyRowDiversityFilter(scored, limit)

    console.log('[getQuickPicksForUser] Final selection:', diverse.slice(0, 5).map(d => ({
      title: d.movie.title,
      score: d.score,
      embeddingBoost: d.embeddingBoost,
      reason: d.pickReason?.type
    })))

    // 9. Log impressions (async, don't await)
    logRowImpressions(userId, diverse, 'quick_picks').catch(err =>
      console.warn('[getQuickPicksForUser] Failed to log impressions:', err.message)
    )

    // 10. Return formatted results
    return diverse.map(item => ({
      ...item.movie,
      _score: item.score,
      _pickReason: item.pickReason,
      _embeddingSimilarity: item.embeddingReason?.similarity || null
    }))

  } catch (error) {
    console.error('[getQuickPicksForUser] Error:', error)
    return []
  }
}


/**
 * Apply diversity filter for carousel rows
 * Lighter than hero filter - just prevents too much repetition
 */
function applyRowDiversityFilter(sortedCandidates, limit) {
  const result = []
  const directorCounts = new Map()
  const genreCounts = new Map()
  
  for (const candidate of sortedCandidates) {
    if (result.length >= limit) break
    
    const movie = candidate.movie
    const director = movie.director_name?.toLowerCase() || 'unknown'
    const genre = movie.primary_genre?.toLowerCase() || 'unknown'
    
    // Max 3 per director in a row
    const dirCount = directorCounts.get(director) || 0
    if (dirCount >= 3) continue
    
    // Max 5 per genre in a row
    const genreCount = genreCounts.get(genre) || 0
    if (genreCount >= 5) continue
    
    result.push(candidate)
    directorCounts.set(director, dirCount + 1)
    genreCounts.set(genre, genreCount + 1)
  }
  
  return result
}


/**
 * Log impressions for a carousel row (batch insert)
 */
async function logRowImpressions(userId, items, placement) {
  if (!userId || !items?.length) return
  
  try {
    const impressions = items.slice(0, 20).map(item => ({
      user_id: userId,
      movie_id: item.movie.id,
      placement,
      pick_reason_type: item.pickReason?.type || 'unknown',
      pick_reason_label: item.pickReason?.label || null,
      score: item.score,
      seed_movie_id: item.embeddingReason?.seedId || null,
      seed_movie_title: item.embeddingReason?.seedTitle || null,
      embedding_similarity: item.embeddingReason?.similarity || null,
      algorithm_version: 'v2.1-embeddings'
    }))
    
    const { error } = await supabase
      .from('recommendation_impressions')
      .upsert(impressions, { 
        onConflict: 'user_id,movie_id,placement,shown_date',
        ignoreDuplicates: true 
      })
    
    if (error) throw error
    
    console.log('[logRowImpressions] Logged:', { placement, count: impressions.length })
  } catch (error) {
    console.warn('[logRowImpressions] Error:', error.message)
  }
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Export constants for use in other modules
 */
export const RECOMMENDATION_CONSTANTS = {
  LANGUAGE_REGIONS,
  LIKELY_SEEN_WEIGHTS,
  THRESHOLDS
}

/**
 * Get personalized movie recommendations for a user
 * @param {string} userId - User UUID
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Recommendation sets
 */
export async function getPersonalizedRecommendations(userId, options = {}) {
  const {
    limit = 20,
    includeGenreBased = true,
    includeHistoryBased = true,
    signal,
  } = options

  try {
    // Run recommendations in parallel for speed
    const [genreRecs, historyRecs] = await Promise.all([
      includeGenreBased ? getGenreBasedRecommendations(userId, { limit, signal }) : null,
      includeHistoryBased ? getHistoryBasedRecommendations(userId, { limit, signal }) : null,
    ])

    return {
      genreBased: genreRecs || [],
      historyBased: historyRecs || [],
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[Recommendations] Failed to get personalized recommendations:', error)
    throw error
  }
}

/**
 * Get recommendations based on user's genre preferences
 * Uses TMDB discover with weighted genre sorting
 */
export async function getGenreBasedRecommendations(userId, options = {}) {
  const { limit = 20, signal } = options

  try {
    // 1. Fetch user's preferred genres
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('genre_id')
      .eq('user_id', userId)

    if (prefError) throw prefError

    if (!preferences || preferences.length === 0) {
      console.warn('[Recommendations] No genre preferences found for user')
      return []
    }

    const genreIds = preferences.map(p => p.genre_id)
    console.log('[Recommendations] User preferred genres:', genreIds)

    // 2. Get movies the user has already watched (to exclude)
    const { data: watchedMovies } = await supabase
      .from('user_history')
      .select('movie_id')
      .eq('user_id', userId)

    const watchedTmdbIds = new Set()
    if (watchedMovies && watchedMovies.length > 0) {
      // Get TMDB IDs for watched movies
      const { data: movies } = await supabase
        .from('movies')
        .select('tmdb_id')
        .in('id', watchedMovies.map(m => m.movie_id))
      
      if (movies) {
        movies.forEach(m => watchedTmdbIds.add(m.tmdb_id))
      }
    }

    // 3. Fetch multiple pages from TMDB to get enough unwatched movies
    const allResults = []
    const maxPages = 3
    
    for (let page = 1; page <= maxPages && allResults.length < limit; page++) {
      const response = await tmdb.discoverMovies({
        genreIds: genreIds.join(','),
        sortBy: 'popularity.desc',
        voteAverageGte: 6.5, // Quality filter
        page,
        signal,
      })

      if (response.results && response.results.length > 0) {
        // Filter out watched movies
        const unwatched = response.results.filter(
          movie => !watchedTmdbIds.has(movie.id) && movie.poster_path
        )
        allResults.push(...unwatched)
      }

      if (!response.results || response.results.length === 0) break
    }

    // 4. Return top results
    return allResults.slice(0, limit)
  } catch (error) {
    console.error('[Recommendations] Genre-based recommendations failed:', error)
    return []
  }
}

/**
 * Get recommendations based on user's watch history
 * Finds similar movies to what they've watched
 */
export async function getHistoryBasedRecommendations(userId, options = {}) {
  const { limit = 20, signal } = options

  try {
    // 1. Get user's recent watch history (last 10 movies)
    const { data: history, error: historyError } = await supabase
      .from('user_history')
      .select(`
        movie_id,
        watched_at,
        movies!inner(tmdb_id, title)
      `)
      .eq('user_id', userId)
      .order('watched_at', { ascending: false })
      .limit(10)

    if (historyError) throw historyError

    if (!history || history.length === 0) {
      console.warn('[Recommendations] No watch history found for user')
      return []
    }

    console.log(`[Recommendations] Found ${history.length} movies in watch history`)

    // 2. Get all watched TMDB IDs for exclusion
    const { data: allWatched } = await supabase
      .from('user_history')
      .select('movie_id')
      .eq('user_id', userId)

    const watchedTmdbIds = new Set()
    if (allWatched && allWatched.length > 0) {
      const { data: movies } = await supabase
        .from('movies')
        .select('tmdb_id')
        .in('id', allWatched.map(m => m.movie_id))
      
      if (movies) {
        movies.forEach(m => watchedTmdbIds.add(m.tmdb_id))
      }
    }

    // 3. For each watched movie, get similar movies from TMDB
    const similarMoviesPromises = history.slice(0, 5).map(async (item) => {
      try {
        const tmdbId = item.movies.tmdb_id
        
        // Get both similar and recommended movies
        const [similar, recommended] = await Promise.all([
          tmdb.getSimilarMovies(tmdbId, { page: 1, signal }),
          tmdb.getMovieRecommendations(tmdbId, { page: 1, signal }),
        ])

        const combined = [
          ...(similar.results || []),
          ...(recommended.results || []),
        ]

        return {
          sourceMovie: item.movies.title,
          sourceTmdbId: tmdbId,
          watchedAt: item.watched_at,
          movies: combined.filter(m => m.poster_path),
        }
      } catch (error) {
        console.warn(`[Recommendations] Failed to get similar movies for ${item.movies.title}:`, error)
        return { sourceMovie: item.movies.title, movies: [] }
      }
    })

    const similarResults = await Promise.all(similarMoviesPromises)

    // 4. Aggregate and score all similar movies
    const movieScores = new Map()

    similarResults.forEach((result, idx) => {
      const recencyWeight = 1 / (idx + 1) // More recent watches have higher weight
      
      result.movies.forEach((movie) => {
        // Skip if already watched
        if (watchedTmdbIds.has(movie.id)) return

        if (!movieScores.has(movie.id)) {
          movieScores.set(movie.id, {
            movie,
            score: 0,
            sources: [],
          })
        }

        const entry = movieScores.get(movie.id)
        entry.score += recencyWeight * (movie.popularity || 0) * 0.01
        entry.sources.push(result.sourceMovie)
      })
    })

    // 5. Sort by score and return top results
    const rankedMovies = Array.from(movieScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(entry => ({
        ...entry.movie,
        _recommendationMeta: {
          sources: entry.sources,
          score: entry.score,
        },
      }))

    console.log(`[Recommendations] Generated ${rankedMovies.length} history-based recommendations`)
    
    return rankedMovies
  } catch (error) {
    console.error('[Recommendations] History-based recommendations failed:', error)
    return []
  }
}

/**
 * Get mood-personalized recommendations
 * Combines mood genre mapping with user preferences
 */
export async function getMoodRecommendations(userId, moodId, options = {}) {
  const { limit = 20, signal } = options

  try {
    // 1. Get mood-genre mapping
    const moodGenres = MOOD_GENRE_MAP[moodId]
    if (!moodGenres) {
      console.warn(`[Recommendations] No genre mapping for mood ${moodId}`)
      return []
    }

    // 2. Get user preferences to personalize within mood
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('genre_id')
      .eq('user_id', userId)

    const userGenres = preferences ? preferences.map(p => p.genre_id) : []

    // 3. Find intersection of mood genres and user preferences
    const personalizedGenres = moodGenres.filter(g => userGenres.includes(g))
    const genresToUse = personalizedGenres.length > 0 ? personalizedGenres : moodGenres

    console.log(`[Recommendations] Mood ${moodId} using genres:`, genresToUse)

    // 4. Get watched movies for exclusion
    const { data: watchedMovies } = await supabase
      .from('user_history')
      .select('movie_id')
      .eq('user_id', userId)

    const watchedTmdbIds = new Set()
    if (watchedMovies && watchedMovies.length > 0) {
      const { data: movies } = await supabase
        .from('movies')
        .select('tmdb_id')
        .in('id', watchedMovies.map(m => m.movie_id))
      
      if (movies) {
        movies.forEach(m => watchedTmdbIds.add(m.tmdb_id))
      }
    }

    // 5. Fetch from TMDB
    const response = await tmdb.discoverMovies({
      genreIds: genresToUse.join(','),
      sortBy: 'popularity.desc',
      voteAverageGte: 6.0,
      page: 1,
      signal,
    })

    if (!response.results || response.results.length === 0) {
      return []
    }

    // 6. Filter and return
    const recommendations = response.results
      .filter(movie => !watchedTmdbIds.has(movie.id) && movie.poster_path)
      .slice(0, limit)

    console.log(`[Recommendations] Generated ${recommendations.length} mood-based recommendations`)
    
    return recommendations
  } catch (error) {
    console.error('[Recommendations] Mood recommendations failed:', error)
    return []
  }
}

/**
 * Mood to Genre mapping
 * Maps mood IDs to TMDB genre IDs for personalized filtering
 */
export const MOOD_GENRE_MAP = {
  1: [35, 10751, 10749], // Cozy Tonight = Comedy + Family + Romance
  2: [12, 28, 14], // Adventurous = Adventure + Action + Fantasy
  8: [10749, 18], // Romantic = Romance + Drama
  10: [35, 16, 10751], // Silly & Fun = Comedy + Animation + Family
  11: [27, 53, 80, 9648], // Dark & Intense = Horror + Thriller + Crime + Mystery
  3: [878, 14, 12], // Futuristic = Sci-Fi + Fantasy + Adventure
  4: [18, 36, 10752], // Thoughtful = Drama + History + War
  5: [16, 10751, 14], // Whimsical = Animation + Family + Fantasy
  6: [99, 36], // Documentary + History
  7: [10402, 18], // Musical + Drama
  9: [53, 9648, 80], // Suspenseful = Thriller + Mystery + Crime
}

/**
 * Get fallback recommendations when user has no data
 * Returns curated popular movies
 */
export async function getFallbackRecommendations(options = {}) {
  const { limit = 20, signal, excludeTmdbIds = [] } = options

  const excludeSet = new Set(
    (excludeTmdbIds || []).filter(Boolean).map((n) => Number(n))
  )

  try {
    const response = await tmdb.getPopularMovies({ page: 1, signal })

    if (!response.results) return []

    return response.results
      .filter(
        (movie) =>
          movie.poster_path &&
          movie.vote_average &&
          movie.vote_average >= 7.0 &&
          !excludeSet.has(Number(movie.id))
      )
      .slice(0, limit)
  } catch (error) {
    console.error('[Recommendations] Fallback recommendations failed:', error)
    return []
  }
}


export async function getBecauseYouWatchedRows(userId, options = {}) {
  const { maxSeeds = 2, limitPerSeed = 20, signal } = options

  try {
    // Get recent history with movies.join to get tmdb_ids
    const { data: history, error } = await supabase
      .from('user_history')
      .select(`
        movie_id,
        watched_at,
        movies!inner (tmdb_id, title)
      `)
      .eq('user_id', userId)
      .order('watched_at', { ascending: false })
      .limit(20)

    if (error) throw error
    if (!history || history.length === 0) return []

    // Deduplicate seeds by movie_id
    const seenMovies = new Set()
    const seeds = []
    for (const item of history) {
      if (!item.movies?.tmdb_id) continue
      if (seenMovies.has(item.movie_id)) continue
      seeds.push(item)
      seenMovies.add(item.movie_id)
      if (seeds.length >= maxSeeds) break
    }

    if (seeds.length === 0) return []

    const rows = []

    for (const seed of seeds) {
      try {
        const tmdbId = seed.movies.tmdb_id
        const [similar, recommended] = await Promise.all([
          tmdb.getSimilarMovies(tmdbId, { page: 1, signal }),
          tmdb.getMovieRecommendations(tmdbId, { page: 1, signal }),
        ])

        const combined = [
          ...(similar.results || []),
          ...(recommended.results || []),
        ]

        // Get watched ids to exclude
        const { data: allWatched } = await supabase
          .from('user_history')
          .select('movie_id')
          .eq('user_id', userId)

        const watchedTmdbIds = new Set()
        if (allWatched && allWatched.length > 0) {
          const { data: movies } = await supabase
            .from('movies')
            .select('tmdb_id')
            .in('id', allWatched.map(m => m.movie_id))
          if (movies) movies.forEach(m => watchedTmdbIds.add(m.tmdb_id))
        }

        const filtered = combined
          .filter(m => m.poster_path && !watchedTmdbIds.has(m.id))

        const uniqueMap = new Map()
        filtered.forEach(m => {
          if (!uniqueMap.has(m.id)) uniqueMap.set(m.id, m)
        })

        const movies = Array.from(uniqueMap.values()).slice(0, limitPerSeed)

        if (movies.length > 0) {
          rows.push({
            seedTitle: seed.movies.title,
            seedTmdbId: tmdbId,
            movies,
          })
        }
      } catch (innerErr) {
        console.warn('[Recommendations] seed row failed:', innerErr)
      }
    }

    return rows
  } catch (error) {
    console.error('[Recommendations] getBecauseYouWatchedRows failed:', error)
    return []
  }
}

export async function getTopGenresForUser(userId, options = {}) {
  const { limit = 3 } = options

  try {
    const { data: prefs, error } = await supabase
      .from('user_preferences')
      .select('genre_id')
      .eq('user_id', userId)

    if (error) throw error
    if (!prefs || prefs.length === 0) return []

    const counts = new Map()
    prefs.forEach(p => {
      counts.set(p.genre_id, (counts.get(p.genre_id) || 0) + 1)
    })

    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(entry => entry[0])

    return sorted
  } catch (error) {
    console.error('[Recommendations] getTopGenresForUser failed:', error)
    return []
  }
}

export async function getTrendingForUser(userId, options = {}) {
  const { limit = 20, signal } = options

  try {
    // Get user's preferred genres
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('genre_id')
      .eq('user_id', userId)

    const preferredGenres = prefs ? prefs.map(p => p.genre_id) : []

    // Watched exclusion
    const { data: watchedMovies } = await supabase
      .from('user_history')
      .select('movie_id')
      .eq('user_id', userId)

    const watchedTmdbIds = new Set()
    if (watchedMovies && watchedMovies.length > 0) {
      const { data: movies } = await supabase
        .from('movies')
        .select('tmdb_id')
        .in('id', watchedMovies.map(m => m.movie_id))

      if (movies) {
        movies.forEach(m => watchedTmdbIds.add(m.tmdb_id))
      }
    }

    // Start from popular/trending
    const response = await tmdb.getPopularMovies({ page: 1, signal })
    if (!response.results) return []

    const filtered = response.results
      .filter(m => {
        if (!m.poster_path) return false
        if (watchedTmdbIds.has(m.id)) return false
        if (!preferredGenres || preferredGenres.length === 0) return true
        // Some overlap in genres (if genres array present in m)
        if (!m.genre_ids) return true
        return m.genre_ids.some(g => preferredGenres.includes(g))
      })
      .slice(0, limit)

    return filtered
  } catch (error) {
    console.error('[Recommendations] getTrendingForUser failed:', error)
    return []
  }
}

export async function getHiddenGemsForUser(userId, options = {}) {
  const { limit = 20, signal } = options

  try {
    // 1. Get top genres (if none, just bail gracefully)
    const topGenres = await getTopGenresForUser(userId, { limit: 3 })
    if (!topGenres || topGenres.length === 0) {
      console.warn('[Recommendations] Hidden gems: no top genres for user')
      return []
    }

    // 2. Get watched ids to exclude
    const { data: watchedMovies, error: watchedError } = await supabase
      .from('user_history')
      .select('movie_id')
      .eq('user_id', userId)

    if (watchedError) {
      console.warn('[Recommendations] Hidden gems: user_history error', watchedError)
    }

    const watchedTmdbIds = new Set()
    if (watchedMovies && watchedMovies.length > 0) {
      const { data: movies, error: moviesError } = await supabase
        .from('movies')
        .select('tmdb_id')
        .in('id', watchedMovies.map(m => m.movie_id))

      if (moviesError) {
        console.warn('[Recommendations] Hidden gems: movies lookup error', moviesError)
      } else if (movies) {
        movies.forEach(m => {
          if (m.tmdb_id) watchedTmdbIds.add(m.tmdb_id)
        })
      }
    }

    // 3. Call TMDB discover
    const response = await tmdb.discoverMovies({
      genreIds: topGenres.join(','),
      sortBy: 'vote_average.desc',
      voteCountGte: 100,
      page: 1,
      signal,
    })

    if (!response || !response.results) {
      console.warn('[Recommendations] Hidden gems: no TMDB results')
      return []
    }

    // 4. Hidden gem heuristic
    const candidates = response.results
      .filter(m =>
        m &&
        m.poster_path &&
        (m.vote_average || 0) >= 7.0 &&
        // Not too popular – tune threshold as needed
        (m.popularity || 0) < 60 &&
        !watchedTmdbIds.has(m.id)
      )
      .slice(0, limit)

    console.log(
      `[Recommendations] Hidden gems: returning ${candidates.length} candidates`
    )

    return candidates
  } catch (error) {
    console.error('[Recommendations] getHiddenGemsForUser failed:', error)
    // Fail soft – no row rather than breaking homepage
    return []
  }
}

/**
 * Get themed row using new enhanced scoring (Phase 1-2)
 * Uses quality_score, star_power, content dimensions
 */
export async function getThemedRow(userId, rowType, options = {}) {
  const { limit = 20, signal } = options

  // Get user's preferred genres
  const { data: userPrefs } = await supabase
    .from('user_preferences')
    .select('genre_id')
    .eq('user_id', userId)

  const userGenres = userPrefs?.map(p => p.genre_id) || []

  let query = supabase
    .from('movies')
    .select('id, tmdb_id, title, poster_path, vote_average, popularity, runtime, star_power, quality_score, pacing_score, intensity_score, emotional_depth_score, dialogue_density')
    .not('vote_average', 'is', null)

  // Apply row-specific filters
  if (rowType === 'hidden_gems') {
    query = query
      .gte('vote_average', 7.0)
      .lt('popularity', 60)
      .gte('vote_count', 100)
  } else if (rowType === 'slow_contemplative') {
    query = query
      .lt('pacing_score', 40)
      .gt('emotional_depth_score', 70)
      .gte('vote_average', 7.0)
  } else if (rowType === 'high_energy') {
    query = query
      .gt('pacing_score', 70)
      .gt('intensity_score', 70)
      .gte('vote_average', 6.5)
  } else if (rowType === 'quick_watches') {
    query = query
      .lt('runtime', 90)
      .gte('vote_average', 7.0)
      .not('runtime', 'is', null)
  }

  const { data: movies, error } = await query.limit(limit * 2)

  if (error) throw error

  // Calculate enhanced scores
  const scored = movies.map(movie => {
    const score = 
      (movie.popularity * 0.005) +
      (movie.vote_average * 10) +
      (movie.quality_score || 0) * 0.3 +
      (movie.star_power === 'no_stars' && rowType === 'hidden_gems' ? 15 : 0)

    return { ...movie, score }
  })

  // Sort and return
  return scored.sort((a, b) => b.score - a.score).slice(0, limit)
}

/**
 * Get slow & contemplative films (pacing < 40, depth > 70)
 */
export async function getSlowContemplative(userId, options = {}) {
  return getThemedRow(userId, 'slow_contemplative', options)
}

/**
 * Get quick watches under 90 minutes
 */
export async function getQuickWatches(userId, options = {}) {
  return getThemedRow(userId, 'quick_watches', options)
}