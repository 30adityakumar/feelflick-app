// src/shared/services/recommendations.js
/**
 * FeelFlick Recommendation Engine v2.3 (HeroTopPick-focused)
 *
 * FIXES in v2.3:
 * ✅ Language mismatch fix:
 *   - Hero language is derived from *actual user_history → movies.original_language* (not stale cached profile)
 *   - Strong language dominance triggers a HARD language filter (Hindi-only users won’t see English unless you explicitly relax)
 * ✅ Watched-on-Hero fix:
 *   - Excludes by BOTH internal movie.id AND movies.tmdb_id (prevents duplicates / re-ingested movie rows from reappearing)
 * ✅ Removes "likely seen" penalty from scoring (disabled completely)
 * ✅ Embedding-aware "Similar to / Because you watched":
 *   - Uses `movie_recommendations` (precomputed neighbors) when available for stronger “similar to” mapping
 * ✅ Profile cache safety:
 *   - Auto-bypasses cached profiles from older versions (prevents missing fields like distributionSorted)
 */

import { supabase } from '@/shared/lib/supabase/client'
import * as tmdb from '@/shared/api/tmdb' // kept for compatibility; not required in this file
import { recommendationCache } from '@/shared/lib/cache'

// ============================================================================
// VERSION
// ============================================================================
const ENGINE_VERSION = '2.3'

// ============================================================================
// HELPERS
// ============================================================================

function normalizeNumericIdArray(arr = []) {
  return Array.from(
    new Set(
      (arr || [])
        .filter((v) => v !== null && v !== undefined && v !== '')
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n))
    )
  ).sort((a, b) => a - b)
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

function safeLower(s) {
  return typeof s === 'string' ? s.toLowerCase() : ''
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LANGUAGE_REGIONS = {
  // Indian Subcontinent
  hi: 'hindi_bollywood',
  ta: 'south_indian',
  te: 'south_indian',
  ml: 'south_indian',
  kn: 'south_indian',
  bn: 'bengali',
  pa: 'punjabi',
  mr: 'marathi',
  // East Asian
  ko: 'korean',
  ja: 'japanese',
  zh: 'chinese',
  cn: 'chinese',
  yue: 'cantonese',
  // Southeast Asian
  th: 'thai',
  id: 'indonesian',
  vi: 'vietnamese',
  tl: 'filipino',
  // European
  fr: 'french',
  de: 'german',
  es: 'spanish_european',
  it: 'italian',
  pt: 'portuguese_european',
  nl: 'dutch',
  // Latin American
  'es-MX': 'latin_american',
  'pt-BR': 'brazilian',
  // Nordic
  sv: 'nordic',
  da: 'nordic',
  no: 'nordic',
  fi: 'nordic',
  // Eastern European
  pl: 'polish',
  ru: 'russian',
  cs: 'czech',
  hu: 'hungarian',
  ro: 'romanian',
  // Middle Eastern
  ar: 'arabic',
  fa: 'persian',
  tr: 'turkish',
  he: 'hebrew',
  // Anglophone
  en: 'english'
}

// "Likely seen" is DISABLED per your request (kept for backward compatibility)
const LIKELY_SEEN_WEIGHTS = {
  hero: 0,
  quick_picks: 0,
  hidden_gems: 0,
  trending: 0,
  because_you_watched: 0,
  world_cinema: 0,
  favorite_genres: 0,
  slow_contemplative: 0,
  quick_watches: 0,
  visual_spectacles: 0,
  default: 0
}

const THRESHOLDS = {
  MIN_FF_RATING: 6.5,
  MIN_FF_CONFIDENCE: 50,
  MIN_FILMS_FOR_LANGUAGE_PREF: 3,
  MIN_FILMS_FOR_AFFINITY: 2
}

const GENRE_NAME_TO_ID = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  'science fiction': 878,
  'sci-fi': 878,
  'tv movie': 10770,
  thriller: 53,
  war: 10752,
  western: 37
}

// ============================================================================
// PROFILE COMPUTATION (with cache safety)
// ============================================================================

export async function computeUserProfile(userId, forceRefresh = false) {
  try {
    if (!forceRefresh) {
      const { data: cached, error: cacheError } = await supabase
        .from('user_profiles_computed')
        .select('profile, seed_films, computed_at, data_points, confidence')
        .eq('user_id', userId)
        .maybeSingle()

      if (cached && !cacheError && cached.profile) {
        const cachedVersion = cached.profile?.meta?.profileVersion
        const isVersionOk = cachedVersion === ENGINE_VERSION

        const ageMs = Date.now() - new Date(cached.computed_at).getTime()
        const maxAgeMs = 24 * 60 * 60 * 1000

        // IMPORTANT: old cached profiles caused language distributionSorted to be missing,
        // which made language filters silently not apply → English leakage.
        if (isVersionOk && ageMs < maxAgeMs) {
          const fixed = ensureLanguageProfileShape(cached.profile)
          return { ...fixed, _cached: true, _seedFilms: cached.seed_films }
        }
      }
    }

    const [
      { data: watchHistory },
      { data: userPrefs },
      { data: userRatings },
      { data: skipFeedback }
    ] = await Promise.all([
      supabase
        .from('user_history')
        .select(
          `
        movie_id, source, watched_at, watch_duration_minutes,
        movies!inner (
          id, tmdb_id, original_language, runtime, release_year,
          pacing_score, intensity_score, emotional_depth_score,
          dialogue_density, attention_demand, vfx_level_score,
          ff_rating, director_name, lead_actor_name, genres, keywords
        )
      `
        )
        .eq('user_id', userId)
        .order('watched_at', { ascending: false })
        .limit(100),

      // ✅ user_preferences is included
      supabase.from('user_preferences').select('genre_id').eq('user_id', userId),

      supabase.from('user_ratings').select('movie_id, rating').eq('user_id', userId),

      supabase
        .from('recommendation_impressions')
        .select('movie_id, skipped, placement, shown_at')
        .eq('user_id', userId)
        .eq('skipped', true)
        .order('shown_at', { ascending: false })
        .limit(50)
    ])

    if (!watchHistory || watchHistory.length === 0) {
      const emptyProfile = buildEmptyProfile(userId, userPrefs)
      await cacheUserProfile(userId, emptyProfile, [])
      return emptyProfile
    }

    const onboardingMovies = watchHistory.filter((h) => h.source === 'onboarding')
    const regularHistory = watchHistory.filter((h) => h.source !== 'onboarding')
    const totalWatched = regularHistory.length

    let onboardingWeight = 3.0
    if (totalWatched > 50) onboardingWeight = 1.5
    else if (totalWatched > 20) onboardingWeight = 2.0

    const weightedMovies = []

    onboardingMovies.forEach((h) => {
      if (h.movies) weightedMovies.push({ ...h.movies, weight: onboardingWeight, isOnboarding: true })
    })

    const now = new Date()
    regularHistory.forEach((h) => {
      if (!h.movies) return
      const daysSince = (now - new Date(h.watched_at)) / (1000 * 60 * 60 * 24)

      let weight = 1.0
      if (daysSince <= 30) weight = 1.3
      else if (daysSince <= 90) weight = 1.15

      if (h.watch_duration_minutes && h.movies.runtime) {
        const pct = h.watch_duration_minutes / h.movies.runtime
        if (pct < 0.3) weight *= 0.3
        else if (pct < 0.7) weight *= 0.7
      }

      weightedMovies.push({ ...h.movies, weight, isOnboarding: false })
    })

    const negativeSignals = computeNegativeSignals(skipFeedback, watchHistory)

    // ✅ language is computed from real watched movies
    // ✅ and EXCLUDES onboarding by default (onboarding can leak English)
    const languages = computeLanguageProfile(weightedMovies, { excludeOnboarding: true })

    const genres = computeGenreProfile(weightedMovies, userPrefs, negativeSignals)
    const contentProfile = computeContentProfile(weightedMovies)
    const preferences = computePracticalPreferences(weightedMovies)
    const affinities = computePeopleAffinities(weightedMovies)
    const themes = computeThemeAffinities(weightedMovies)
    const qualityProfile = computeQualityProfile(weightedMovies, userRatings)

    const profile = ensureLanguageProfileShape({
      userId,
      languages,
      genres,
      contentProfile,
      preferences,
      affinities,
      themes,
      qualityProfile,
      negativeSignals,
      meta: {
        profileVersion: ENGINE_VERSION,
        computedAt: new Date().toISOString(),
        dataPoints: weightedMovies.length,
        confidence:
          weightedMovies.length >= 30 ? 'high' : weightedMovies.length >= 10 ? 'medium' : 'low',
        onboardingWeight,
        totalSkips: negativeSignals.totalSkips
      }
    })

    const seedFilms = await getSeedFilms(userId, profile)
    cacheUserProfile(userId, profile, seedFilms).catch((err) =>
      console.warn('[computeUserProfile] Cache save failed:', err.message)
    )

    return profile
  } catch (error) {
    console.error('[computeUserProfile] Error:', error)
    return buildEmptyProfile(userId, null)
  }
}

function buildEmptyProfile(userId, userPrefs) {
  return ensureLanguageProfileShape({
    userId,
    languages: {
      primary: null,
      secondary: null,
      distribution: {},
      openness: 'unknown',
      regionAffinity: null,
      distinctCount: 0,
      isBilingual: false,
      primaryDominance: 0,
      regionsExplored: 0,
      regionDistribution: {},
      distributionSorted: []
    },
    genres: {
      preferred: userPrefs?.map((p) => p.genre_id) || [],
      secondary: [],
      avoided: [],
      fatigued: [],
      preferredPairs: [],
      explicitPreferences: userPrefs?.map((p) => p.genre_id) || []
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
    qualityProfile: { avgFFRating: 7.0, watchesHiddenGems: false, totalMoviesWatched: 0 },
    negativeSignals: {
      skippedGenres: [],
      skippedDirectors: [],
      skippedLanguages: [],
      skippedActors: [],
      totalSkips: 0
    },
    meta: {
      profileVersion: ENGINE_VERSION,
      computedAt: new Date().toISOString(),
      dataPoints: 0,
      confidence: 'none',
      onboardingWeight: 3.0,
      totalSkips: 0
    }
  })
}

async function cacheUserProfile(userId, profile, seedFilms) {
  try {
    await supabase.from('user_profiles_computed').upsert(
      {
        user_id: userId,
        profile,
        seed_films: seedFilms,
        computed_at: new Date().toISOString(),
        data_points: profile.meta.dataPoints,
        confidence: profile.meta.confidence
      },
      { onConflict: 'user_id' }
    )
  } catch (err) {
    console.error('[cacheUserProfile] Error:', err)
  }
}

// Ensure distributionSorted exists even if older profiles were cached
function ensureLanguageProfileShape(profile) {
  if (!profile?.languages) return profile
  const l = profile.languages

  if (!Array.isArray(l.distributionSorted) || l.distributionSorted.length === 0) {
    const dist = l.distribution || {}
    const sorted = Object.entries(dist)
      .map(([lang, percentage]) => ({ lang, count: percentage, percentage }))
      .sort((a, b) => b.percentage - a.percentage)

    profile.languages = {
      ...l,
      distributionSorted: sorted
    }
  }
  return profile
}

// ============================================================================
// NEGATIVE SIGNALS
// ============================================================================

function computeNegativeSignals(skipFeedback, watchHistory) {
  if (!skipFeedback || skipFeedback.length === 0) {
    return {
      skippedGenres: [],
      skippedDirectors: [],
      skippedLanguages: [],
      skippedActors: [],
      totalSkips: 0
    }
  }

  const skippedMovieIds = skipFeedback.map((s) => s.movie_id)
  const skippedMovies = []

  watchHistory.forEach((h) => {
    if (h.movies && skippedMovieIds.includes(h.movie_id)) skippedMovies.push(h.movies)
  })

  if (skippedMovies.length === 0) {
    return {
      skippedGenres: [],
      skippedDirectors: [],
      skippedLanguages: [],
      skippedActors: [],
      totalSkips: skipFeedback.length
    }
  }

  const genreSkips = {},
    directorSkips = {},
    langSkips = {},
    actorSkips = {}

  skippedMovies.forEach((movie) => {
    if (Array.isArray(movie.genres)) {
      movie.genres.forEach((genre) => {
        const gid = extractGenreId(genre)
        if (gid) genreSkips[gid] = (genreSkips[gid] || 0) + 1
      })
    }
    if (movie.director_name) {
      const name = movie.director_name.toLowerCase()
      directorSkips[name] = (directorSkips[name] || 0) + 1
    }
    if (movie.original_language) {
      langSkips[movie.original_language] = (langSkips[movie.original_language] || 0) + 1
    }
    if (movie.lead_actor_name) {
      const name = movie.lead_actor_name.toLowerCase()
      actorSkips[name] = (actorSkips[name] || 0) + 1
    }
  })

  return {
    skippedGenres: Object.entries(genreSkips)
      .filter(([_, c]) => c >= 3)
      .map(([gid, count]) => ({ id: Number(gid), skipCount: count }))
      .sort((a, b) => b.skipCount - a.skipCount),
    skippedDirectors: Object.entries(directorSkips)
      .filter(([_, c]) => c >= 2)
      .map(([name, count]) => ({ name, skipCount: count }))
      .sort((a, b) => b.skipCount - a.skipCount),
    skippedLanguages: Object.entries(langSkips)
      .filter(([_, c]) => c >= 3)
      .map(([lang, count]) => ({ language: lang, skipCount: count }))
      .sort((a, b) => b.skipCount - a.skipCount),
    skippedActors: Object.entries(actorSkips)
      .filter(([_, c]) => c >= 2)
      .map(([name, count]) => ({ name, skipCount: count }))
      .sort((a, b) => b.skipCount - a.skipCount),
    totalSkips: skipFeedback.length
  }
}

// ============================================================================
// PROFILE HELPERS
// ============================================================================

function computeLanguageProfile(weightedMovies, options = {}) {
  const { excludeOnboarding = false } = options

  const source = excludeOnboarding ? weightedMovies.filter((m) => !m.isOnboarding) : weightedMovies
  const langCounts = {}
  let totalWeight = 0

  source.forEach((m) => {
    if (!m.original_language) return
    langCounts[m.original_language] = (langCounts[m.original_language] || 0) + (m.weight || 1)
    totalWeight += m.weight || 1
  })

  // fallback if user has only onboarding (or no usable language)
  if (totalWeight === 0 && excludeOnboarding) {
    return computeLanguageProfile(weightedMovies, { excludeOnboarding: false })
  }

  if (totalWeight === 0) {
    return {
      primary: null,
      secondary: null,
      distribution: {},
      distributionSorted: [],
      openness: 'unknown',
      regionAffinity: null,
      distinctCount: 0,
      isBilingual: false,
      primaryDominance: 0,
      regionsExplored: 0,
      regionDistribution: {}
    }
  }

  const sorted = Object.entries(langCounts)
    .map(([lang, count]) => ({ lang, count, percentage: (count / totalWeight) * 100 }))
    .sort((a, b) => b.count - a.count)

  const primary = sorted[0]?.lang || null
  const secondary = sorted[1]?.lang || null
  const primaryPct = sorted[0]?.percentage || 0
  const secondaryPct = sorted[1]?.percentage || 0

  let diversity = 0
  sorted.forEach((s) => {
    const p = s.percentage / 100
    if (p > 0) diversity -= p * Math.log2(p)
  })
  const maxDiversity = Math.log2(Math.min(sorted.length, 5))
  const normalizedDiversity = maxDiversity > 0 ? diversity / maxDiversity : 0

  let openness = 'unknown'
  if (sorted.length === 1) openness = 'monolingual'
  else if (normalizedDiversity > 0.8 && sorted.length >= 4) openness = 'adventurous'
  else if (normalizedDiversity > 0.6 || sorted.length >= 3) openness = 'curious'
  else if (normalizedDiversity > 0.3 || sorted.length === 2) openness = 'moderate'
  else openness = 'cautious'

  const isBilingual = secondaryPct >= 30 && primaryPct < 60

  const regionCounts = {}
  sorted.forEach((s) => {
    const region = LANGUAGE_REGIONS[s.lang]
    if (region) regionCounts[region] = (regionCounts[region] || 0) + s.percentage
  })

  return {
    primary,
    secondary,
    distribution: Object.fromEntries(sorted.map((s) => [s.lang, s.percentage])),
    distributionSorted: sorted,
    openness,
    regionAffinity: primary ? LANGUAGE_REGIONS[primary] : null,
    distinctCount: sorted.length,
    isBilingual,
    primaryDominance: primaryPct,
    regionsExplored: Object.keys(regionCounts).length,
    regionDistribution: regionCounts
  }
}

function extractGenreId(g) {
  if (typeof g === 'object' && g?.id) {
    return typeof g.id === 'number' ? g.id : parseInt(g.id, 10)
  }
  if (typeof g === 'number') return g
  if (typeof g === 'string') {
    const parsed = parseInt(g, 10)
    if (!isNaN(parsed)) return parsed
    const normalized = g.toLowerCase().trim()
    if (GENRE_NAME_TO_ID[normalized]) return GENRE_NAME_TO_ID[normalized]
  }
  return null
}

function computeGenreProfile(weightedMovies, userPrefs, negativeSignals = null) {
  const genreCounts = {}
  const totalWatched = weightedMovies.length

  // ✅ explicit user_preferences are PRIMARY
  const explicitPreferences = new Set()
  userPrefs?.forEach((p) => {
    if (!p.genre_id) return
    const id = typeof p.genre_id === 'number' ? p.genre_id : parseInt(p.genre_id, 10)
    if (!isNaN(id)) {
      explicitPreferences.add(id)
      genreCounts[id] = 100 // strong base weight
    }
  })

  const hasExplicitPreferences = explicitPreferences.size > 0

  // (onboarding decay kept for other signals; genre scoring still uses weights)
  let onboardingGenreWeight = 2.0
  if (totalWatched > 50) onboardingGenreWeight = 0.8
  else if (totalWatched > 20) onboardingGenreWeight = 1.2

  weightedMovies.forEach((m) => {
    ;(m.genres || []).forEach((g) => {
      const genreId = extractGenreId(g)
      if (!genreId) return

      const baseWeight = m.weight || 1
      const penalty = hasExplicitPreferences && !explicitPreferences.has(genreId) ? 0.3 : 1.0
      const onboardingAdj = m.isOnboarding ? onboardingGenreWeight : 1.0

      genreCounts[genreId] = (genreCounts[genreId] || 0) + baseWeight * penalty * onboardingAdj
    })
  })

  // primary genre bonus
  weightedMovies.forEach((m) => {
    const genres = m.genres || []
    if (genres.length === 0) return
    const primaryGenreId = extractGenreId(genres[0])
    if (!primaryGenreId) return
    if (!hasExplicitPreferences || explicitPreferences.has(primaryGenreId)) {
      genreCounts[primaryGenreId] = (genreCounts[primaryGenreId] || 0) + (m.weight || 1) * 0.3
    }
  })

  // pairs
  const genrePairs = {}
  weightedMovies.forEach((m) => {
    const genres = (m.genres || []).map(extractGenreId).filter(Boolean)
    for (let i = 0; i < genres.length; i++) {
      for (let j = i + 1; j < genres.length; j++) {
        const pair = [genres[i], genres[j]].sort().join('-')
        genrePairs[pair] = (genrePairs[pair] || 0) + (m.weight || 1)
      }
    }
  })

  const topPairs = Object.entries(genrePairs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pair, count]) => ({ genres: pair.split('-').map(Number), count }))

  const sorted = Object.entries(genreCounts)
    .map(([id, count]) => [parseInt(id, 10), count])
    .filter(([id]) => !isNaN(id) && id > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)

  const avoided = negativeSignals?.skippedGenres?.filter((g) => g.skipCount >= 3).map((g) => g.id) || []

  // fatigue: last 10 non-onboarding
  const recentMovies = weightedMovies.filter((m) => !m.isOnboarding).slice(0, 10)
  const recentGenreCounts = {}
  recentMovies.forEach((m) => {
    ;(m.genres || []).forEach((g) => {
      const id = extractGenreId(g)
      if (id) recentGenreCounts[id] = (recentGenreCounts[id] || 0) + 1
    })
  })
  const fatigued = Object.entries(recentGenreCounts)
    .filter(([_, count]) => count >= 6)
    .map(([id]) => parseInt(id, 10))

  return {
    preferred: sorted.slice(0, 3),
    secondary: sorted.slice(3, 6),
    avoided,
    fatigued,
    preferredPairs: topPairs,
    explicitPreferences: Array.from(explicitPreferences)
  }
}

function computeContentProfile(weightedMovies) {
  const sums = { pacing: 0, intensity: 0, depth: 0, dialogue: 0, attention: 0, vfx: 0 }
  let totalWeight = 0

  weightedMovies.forEach((m) => {
    const w = m.weight || 1
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
      avgPacing: 5,
      avgIntensity: 5,
      avgEmotionalDepth: 5,
      avgDialogueDensity: 50,
      avgAttentionDemand: 50,
      avgVFX: 50
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

function computePracticalPreferences(weightedMovies) {
  const runtimes = []
  const decades = {}

  weightedMovies.forEach((m) => {
    if (m.runtime) runtimes.push(m.runtime)
    if (m.release_year) {
      const decade = Math.floor(m.release_year / 10) * 10 + 's'
      decades[decade] = (decades[decade] || 0) + (m.weight || 1)
    }
  })

  const avgRuntime = runtimes.length > 0 ? Math.round(runtimes.reduce((a, b) => a + b, 0) / runtimes.length) : 120
  const sortedDecades = Object.entries(decades)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([d]) => d)

  return {
    avgRuntime,
    runtimeRange: [Math.min(...runtimes, 80), Math.max(...runtimes, 180)],
    preferredDecades: sortedDecades.length > 0 ? sortedDecades : ['2020s', '2010s'],
    toleratesClassics: weightedMovies.some((m) => m.release_year && m.release_year < 1990)
  }
}

function computePeopleAffinities(weightedMovies) {
  const directors = {},
    actors = {}

  weightedMovies.forEach((m) => {
    if (m.director_name) {
      if (!directors[m.director_name]) directors[m.director_name] = { count: 0, fromFavorites: false }
      directors[m.director_name].count++
      if (m.isOnboarding) directors[m.director_name].fromFavorites = true
    }
    if (m.lead_actor_name) {
      if (!actors[m.lead_actor_name]) actors[m.lead_actor_name] = { count: 0, fromFavorites: false }
      actors[m.lead_actor_name].count++
      if (m.isOnboarding) actors[m.lead_actor_name].fromFavorites = true
    }
  })

  return {
    directors: Object.entries(directors)
      .filter(([_, d]) => d.count >= 2)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data })),
    actors: Object.entries(actors)
      .filter(([_, a]) => a.count >= 2)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }))
  }
}

function computeThemeAffinities(weightedMovies) {
  const keywordCounts = {}

  weightedMovies.forEach((m) => {
    ;(m.keywords || []).forEach((kw) => {
      const name = typeof kw === 'object' ? kw.name : kw
      if (name && typeof name === 'string') {
        const normalized = name.toLowerCase()
        keywordCounts[normalized] = (keywordCounts[normalized] || 0) + (m.weight || 1)
      }
    })
  })

  return {
    preferred: Object.entries(keywordCounts)
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword]) => keyword)
  }
}

function computeQualityProfile(weightedMovies) {
  let ratingSum = 0,
    ratingCount = 0,
    hiddenGemCount = 0

  weightedMovies.forEach((m) => {
    if (m.ff_rating) {
      ratingSum += Number(m.ff_rating)
      ratingCount++
    }
    if (m.popularity && m.popularity < 20) hiddenGemCount++
  })

  return {
    avgFFRating: ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 7.0,
    watchesHiddenGems: hiddenGemCount >= 3,
    totalMoviesWatched: weightedMovies.length
  }
}

// ============================================================================
// SEED FILMS (Because you watched / similar to mapping anchor)
// ============================================================================

async function getSeedFilms(userId, profile) {
  if (!userId) return []

  try {
    const { data: history } = await supabase
      .from('user_history')
      .select(
        `
      movie_id, source, watched_at,
      movies!inner (
        id, tmdb_id, title, director_name, lead_actor_name, genres, keywords,
        primary_genre, original_language, release_year,
        pacing_score, intensity_score, emotional_depth_score, ff_rating
      )
    `
      )
      .eq('user_id', userId)
      .order('watched_at', { ascending: false })
      .limit(100)

    const { data: ratings } = await supabase
      .from('user_ratings')
      .select('movie_id, rating')
      .eq('user_id', userId)
      .gte('rating', 4)
      .order('rated_at', { ascending: false })
      .limit(20)

    if (!history || history.length === 0) return []

    const totalWatched = profile.qualityProfile?.totalMoviesWatched || history.length
    const now = new Date()
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000)

    const onboardingWeight =
      totalWatched >= 50 ? 1.0 : totalWatched >= 30 ? 1.5 : totalWatched >= 10 ? 2.0 : 3.0

    const ratedMovieIds = new Set((ratings || []).map((r) => r.movie_id))
    const seedCandidates = []

    history.forEach((h) => {
      if (!h.movies) return
      const movie = h.movies
      const watchedAt = new Date(h.watched_at)
      const isRecent = watchedAt >= thirtyDaysAgo
      const isModeratelyRecent = watchedAt >= ninetyDaysAgo
      const isQuality = Number(movie.ff_rating || 0) >= 7.0

      let weight = 0
      if (ratedMovieIds.has(movie.id)) weight = 5.0
      else if (h.source === 'onboarding') weight = onboardingWeight
      else if (isQuality) {
        if (isRecent) weight = 2.5
        else if (isModeratelyRecent) weight = 2.0
        else weight = 1.5
      }

      if (weight > 0) seedCandidates.push({ movie, weight, watchedAt })
    })

    seedCandidates.sort((a, b) => b.weight - a.weight)

    const seeds = []
    const recentSeeds = seedCandidates.filter((s) => s.watchedAt >= thirtyDaysAgo)
    const olderSeeds = seedCandidates.filter((s) => s.watchedAt < thirtyDaysAgo)

    const recentCount = Math.min(3, recentSeeds.length)
    const olderCount = Math.min(5 - recentCount, olderSeeds.length)

    seeds.push(...recentSeeds.slice(0, recentCount).map((c) => c.movie))
    seeds.push(...olderSeeds.slice(0, olderCount).map((c) => c.movie))

    if (seeds.length < 5) {
      const remaining = seedCandidates
        .filter((c) => !seeds.find((s) => s.id === c.movie.id))
        .slice(0, 5 - seeds.length)
        .map((c) => c.movie)
      seeds.push(...remaining)
    }

    return seeds
  } catch (error) {
    console.error('[getSeedFilms] Error:', error)
    return []
  }
}

// ============================================================================
// LANGUAGE GUARD (derived from *user_history*, not from stale profile)
// ============================================================================

function deriveLanguageFromWatchedRows(watchedRows = []) {
  const counts = {}
  let total = 0

  watchedRows.forEach((row) => {
    const lang = row?.movies?.original_language
    if (!lang) return
    counts[lang] = (counts[lang] || 0) + 1
    total += 1
  })

  if (total === 0) {
    return {
      primary: null,
      primaryDominance: 0,
      distributionSorted: [],
      distinctCount: 0
    }
  }

  const sorted = Object.entries(counts)
    .map(([lang, c]) => ({ lang, count: c, percentage: (c / total) * 100 }))
    .sort((a, b) => b.count - a.count)

  const primary = sorted[0]?.lang || null
  const primaryDominance = sorted[0]?.percentage || 0

  return {
    primary,
    primaryDominance,
    distributionSorted: sorted,
    distinctCount: sorted.length
  }
}

/**
 * Decide how strict to be:
 * - If primary >= 85% and distinctCount <= 2: STRICT (Hindi-only stays Hindi-only)
 * - If primary >= 60%: STRONG (top 2 langs only for Hero)
 * - else: LOOSE (score-based, no hard filter)
 */
function buildLanguageGuardFromHistory(languageFromHistory) {
  const primary = languageFromHistory.primary
  const dominance = languageFromHistory.primaryDominance || 0
  const sorted = languageFromHistory.distributionSorted || []
  const distinctCount = languageFromHistory.distinctCount || 0

  const top2 = sorted.slice(0, 2).map((s) => s.lang).filter(Boolean)
  const strict = primary && dominance >= 85 && distinctCount <= 2
  const strong = primary && dominance >= 60

  let allowed = []
  if (strict) allowed = [primary]
  else if (strong) allowed = top2.length > 0 ? top2 : primary ? [primary] : []
  else allowed = [] // no hard filter

  return {
    mode: strict ? 'strict' : strong ? 'strong' : 'loose',
    primary,
    dominance,
    allowedLanguages: allowed
  }
}

// ============================================================================
// EMBEDDING NEIGHBORS (precomputed table: movie_recommendations)
// ============================================================================

async function fetchEmbeddingNeighborsForSeeds(seedFilms, opts = {}) {
  const { limitPerSeed = 60 } = opts
  const seedIds = normalizeNumericIdArray((seedFilms || []).map((s) => s?.id).filter(Boolean))
  if (seedIds.length === 0) return { neighborIds: [], bestByNeighborId: new Map() }

  // Pull neighbors for multiple seeds
  const { data, error } = await supabase
    .from('movie_recommendations')
    .select('movie_id, recommended_movie_id, similarity, reason, rank')
    .in('movie_id', seedIds)
    .order('similarity', { ascending: false })
    .limit(seedIds.length * limitPerSeed)

  if (error || !data) return { neighborIds: [], bestByNeighborId: new Map() }

  // bestByNeighborId: recommended_movie_id -> { similarity, seedMovieId }
  const bestByNeighborId = new Map()
  data.forEach((r) => {
    const rid = Number(r.recommended_movie_id)
    const sim = Number(r.similarity || 0)
    if (!Number.isFinite(rid) || rid <= 0) return
    const cur = bestByNeighborId.get(rid)
    if (!cur || sim > cur.similarity) {
      bestByNeighborId.set(rid, { similarity: sim, seedMovieId: Number(r.movie_id) })
    }
  })

  const neighborIds = Array.from(bestByNeighborId.keys()).slice(0, 500)
  return { neighborIds, bestByNeighborId }
}

// ============================================================================
// HERO TOP PICK (HeroTopPick) — UPDATED
// ============================================================================

export async function getTopPickForUser(userId, options = {}) {
  const { excludeIds = [], excludeTmdbIds = [], forceRefresh = false } = options

  const stableExcludeIds = normalizeNumericIdArray(excludeIds)
  const stableExcludeTmdbIds = normalizeNumericIdArray(excludeTmdbIds)

  const cacheKey = recommendationCache.key('top_pick', userId || 'guest', {
    excludeIds: stableExcludeIds,
    excludeTmdbIds: stableExcludeTmdbIds
  })

  if (forceRefresh) recommendationCache.invalidate(cacheKey)

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      if (!userId) return await getFallbackPick(null)

      // profile (for scoring)
      const profile = ensureLanguageProfileShape(await computeUserProfile(userId))

      // seeds (for "because you watched" / similarity)
      const seedFilms = await getSeedFilms(userId, profile)

      // watched rows (CRITICAL): used for language guard + watchexclusion
      const { data: watchedRows } = await supabase
        .from('user_history')
        .select('movie_id, movies!inner(id, tmdb_id, original_language, genres)')
        .eq('user_id', userId)

      const watchedInternalIds = normalizeNumericIdArray((watchedRows || []).map((w) => w.movie_id))
      const watchedTmdbIds = normalizeNumericIdArray((watchedRows || []).map((w) => w.movies?.tmdb_id).filter(Boolean))

      // ✅ never show watched, even if candidates are low
      const allExcludeInternal = normalizeNumericIdArray([...watchedInternalIds, ...stableExcludeIds])
      const allExcludeTmdb = new Set(normalizeNumericIdArray([...watchedTmdbIds, ...stableExcludeTmdbIds]))

      // ✅ language guard derived from ACTUAL watched languages
      const historyLang = deriveLanguageFromWatchedRows(watchedRows || [])
      const langGuard = buildLanguageGuardFromHistory(historyLang)

      // recent hero cooldown
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: recentHeroPicks } = await supabase
        .from('recommendation_impressions')
        .select('movie_id, seed_movie_id')
        .eq('user_id', userId)
        .eq('placement', 'hero')
        .gte('shown_at', sevenDaysAgo)

      const recentHeroIds = new Set((recentHeroPicks || []).map((r) => r.movie_id).filter(Boolean))

      // Interest gating
      const hasAnimationInterest =
        profile.genres.preferred.includes(16) ||
        profile.genres.secondary?.includes(16) ||
        (watchedRows || []).some((w) => (w.movies?.genres || []).map(extractGenreId).includes(16))

      const hasFamilyInterest =
        profile.genres.preferred.includes(10751) ||
        profile.genres.secondary?.includes(10751) ||
        (watchedRows || []).some((w) => (w.movies?.genres || []).map(extractGenreId).includes(10751))

      const selectFields = `
        id, tmdb_id, title, overview, tagline,
        original_language, runtime, release_year, release_date,
        poster_path, backdrop_path, trailer_youtube_key,
        ff_rating, ff_rating_genre_normalized, ff_confidence,
        quality_score, vote_average,
        pacing_score, intensity_score, emotional_depth_score,
        dialogue_density, attention_demand, vfx_level_score,
        cult_status_score, popularity, vote_count, revenue,
        director_name, lead_actor_name,
        genres, keywords, primary_genre,
        discovery_potential, accessibility_score,
        polarization_score, starpower_score
      `

      // 1) embedding neighbors pool (strong "similar to / because you watched")
      const { neighborIds, bestByNeighborId } = await fetchEmbeddingNeighborsForSeeds(seedFilms, {
        limitPerSeed: 80
      })

      // 2) base quality pool (recent, high normalized rating)
      const minYear = 2023
      const baseMinNorm = 7.5
      const baseMinConf = 60

      // Fetch base candidates (apply language filter at DB level for strict/strong)
      let baseQuery = supabase
        .from('movies')
        .select(selectFields)
        .eq('is_valid', true)
        .not('backdrop_path', 'is', null)
        .not('tmdb_id', 'is', null)
        .gte('ff_rating_genre_normalized', baseMinNorm)
        .gte('ff_confidence', baseMinConf)
        .gte('release_date', `${minYear}-01-01`)
        .order('ff_rating_genre_normalized', { ascending: false })
        .limit(400)

      if (langGuard.mode === 'strict' && langGuard.allowedLanguages.length === 1) {
        baseQuery = baseQuery.eq('original_language', langGuard.allowedLanguages[0])
      } else if (langGuard.mode === 'strong' && langGuard.allowedLanguages.length > 0) {
        baseQuery = baseQuery.in('original_language', langGuard.allowedLanguages)
      }

      let { data: baseCandidates } = await baseQuery
      baseCandidates = baseCandidates || []

      // Fetch embedding candidates (if any), and apply same hard language policy
      let embeddingCandidates = []
      if (neighborIds.length > 0) {
        let embQuery = supabase
          .from('movies')
          .select(selectFields)
          .in('id', neighborIds)
          .eq('is_valid', true)
          .not('backdrop_path', 'is', null)
          .not('tmdb_id', 'is', null)
          .gte('ff_confidence', 50)
          .limit(300)

        if (langGuard.mode === 'strict' && langGuard.allowedLanguages.length === 1) {
          embQuery = embQuery.eq('original_language', langGuard.allowedLanguages[0])
        } else if (langGuard.mode === 'strong' && langGuard.allowedLanguages.length > 0) {
          embQuery = embQuery.in('original_language', langGuard.allowedLanguages)
        }

        const { data } = await embQuery
        embeddingCandidates = data || []
      }

      // Combine pools (dedupe by id)
      const byId = new Map()
      ;[...embeddingCandidates, ...baseCandidates].forEach((m) => {
        if (m?.id) byId.set(m.id, m)
      })
      let candidates = Array.from(byId.values())

      // Genre gating
      candidates = candidates.filter((m) => {
        const genres = (m.genres || []).map(extractGenreId).filter(Boolean)
        if (genres.includes(16) && !hasAnimationInterest) return false
        if (genres.includes(10751) && !hasFamilyInterest && !hasAnimationInterest) return false
        return true
      })

      // Exclusion gating (INTERNAL + TMDB + recentHero)
      candidates = candidates.filter((m) => {
        if (!m || !m.id || !m.tmdb_id) return false
        if (allExcludeInternal.includes(m.id)) return false
        if (allExcludeTmdb.has(m.tmdb_id)) return false
        if (recentHeroIds.has(m.id)) return false
        return true
      })

      // If strict language left us too few, we RELAX QUALITY/YEAR but NEVER relax "watched" exclusion
      if (candidates.length < 15 && langGuard.mode !== 'loose' && langGuard.primary) {
        let relaxQuery = supabase
          .from('movies')
          .select(selectFields)
          .eq('is_valid', true)
          .not('backdrop_path', 'is', null)
          .not('tmdb_id', 'is', null)
          .gte('ff_confidence', 50)
          .gte('release_date', `2020-01-01`)
          .order('ff_rating_genre_normalized', { ascending: false })
          .limit(400)

        // keep language restriction for user intent
        if (langGuard.allowedLanguages.length === 1) relaxQuery = relaxQuery.eq('original_language', langGuard.allowedLanguages[0])
        else relaxQuery = relaxQuery.in('original_language', langGuard.allowedLanguages)

        const { data: relaxed } = await relaxQuery
        const relaxedCandidates = (relaxed || [])
          .filter((m) => m?.id && !allExcludeInternal.includes(m.id) && !allExcludeTmdb.has(m.tmdb_id) && !recentHeroIds.has(m.id))

        // merge
        relaxedCandidates.forEach((m) => {
          if (m?.id && !byId.has(m.id)) byId.set(m.id, m)
        })
        candidates = Array.from(byId.values()).filter((m) => {
          const genres = (m.genres || []).map(extractGenreId).filter(Boolean)
          if (genres.includes(16) && !hasAnimationInterest) return false
          if (genres.includes(10751) && !hasFamilyInterest && !hasAnimationInterest) return false
          if (allExcludeInternal.includes(m.id)) return false
          if (allExcludeTmdb.has(m.tmdb_id)) return false
          if (recentHeroIds.has(m.id)) return false
          return true
        })
      }

      if (candidates.length === 0) return await getFallbackPick(profile)

      // Score (embedding-aware)
      const currentYear = new Date().getFullYear()
      const scored = candidates.map((movie) => {
        const result = scoreMovieForUser(movie, profile, 'hero', seedFilms, {
          seedEmbeddingBestByMovieId: bestByNeighborId
        })

        // hero freshness + normalized rating bonus (controlled)
        let heroBonus = 0
        const age = currentYear - (movie.release_year || currentYear)
        if (age === 0) heroBonus += 20
        else if (age === 1) heroBonus += 12
        else if (age === 2) heroBonus += 5

        const normalizedRating = Number(movie.ff_rating_genre_normalized || movie.ff_rating || 0)
        if (normalizedRating >= 8.5) heroBonus += 15
        else if (normalizedRating >= 8.0) heroBonus += 10

        const finalScore = result.score + heroBonus

        return {
          movie,
          ...result,
          heroBonus,
          finalScore,
          normalizedRating,
          breakdown: {
            ...result.breakdown,
            heroBonus,
            normalizedRating
          }
        }
      })

      // Quality floor (normalized)
      const qualityCandidates = scored.filter((c) => Number(c.normalizedRating || 0) >= 7.0)
      if (qualityCandidates.length === 0) return await getFallbackPick(profile)

      // Taste threshold (confidence-based)
      const minTasteScore = profile.meta.confidence === 'high' ? 60 : profile.meta.confidence === 'medium' ? 45 : 30
      let finalCandidates = qualityCandidates.filter((c) => {
        const tasteScore = c.finalScore - (c.breakdown.baseQuality || 0)
        return tasteScore >= minTasteScore
      })
      if (finalCandidates.length === 0) finalCandidates = qualityCandidates.slice(0, 30)

      // Sort & diversity
      finalCandidates.sort((a, b) => b.finalScore - a.finalScore)
      const top30 = finalCandidates.slice(0, 30)
      const diverseTop10 = applyDiversityFilter(top30, seedFilms, 10)

      if (diverseTop10.length === 0) return await getFallbackPick(profile)

      // Weighted random (still leans to top, but not always #1)
      const weights = [0.4, 0.25, 0.15, 0.1, 0.05, 0.03, 0.01, 0.005, 0.003, 0.002]
      const totalWeight = weights.slice(0, diverseTop10.length).reduce((a, b) => a + b, 0)
      let rnd = Math.random() * totalWeight
      let selectedIndex = 0
      for (let i = 0; i < diverseTop10.length; i++) {
        rnd -= weights[i] || 0.001
        if (rnd <= 0) {
          selectedIndex = i
          break
        }
      }

      const selected = diverseTop10[selectedIndex]

      // Log impression
      logImpression(userId, selected, 'hero').catch((err) =>
        console.warn('[getTopPickForUser] Impression log failed:', err.message)
      )

      return {
        movie: selected.movie,
        pickReason: selected.pickReason,
        score: selected.finalScore,
        debug: {
          engineVersion: ENGINE_VERSION,
          langGuard,
          historyLang: historyLang.distributionSorted?.map((l) => `${l.lang}:${l.percentage.toFixed(1)}%`) || [],
          totalCandidates: candidates.length,
          top10: diverseTop10.slice(0, 10).map((c, idx) => ({
            rank: idx + 1,
            title: c.movie.title,
            language: c.movie.original_language,
            year: c.movie.release_year,
            normalized: Number(c.normalizedRating || 0).toFixed(2),
            score: c.finalScore.toFixed(1),
            reason: c.pickReason?.type
          }))
        }
      }
    } catch (error) {
      console.error('[getTopPickForUser] Error:', error)
      return await getFallbackPick(null)
    }
  })
}

// ============================================================================
// SCORING (v2.3) — NO "likely seen" penalty, embedding-aware seed similarity
// ============================================================================

export function scoreMovieForUser(movie, profile, rowType = 'default', seedFilms = [], opts = {}) {
  const breakdown = {}
  let score = 0

  // 1) BASE QUALITY (normalized when available)
  const normalizedRating = Number(movie.ff_rating_genre_normalized || movie.ff_rating || 7.0)
  score += (breakdown.baseQuality = normalizedRating * 10)
  breakdown.originalRating = movie.ff_rating

  // 2) DISCOVERY
  if (Number(movie.discovery_potential || 0) >= 60 && profile.qualityProfile.watchesHiddenGems) {
    const discoveryBonus = Math.min(Number(movie.discovery_potential) / 5, 20)
    score += (breakdown.discoveryBonus = discoveryBonus)
  } else if (Number(movie.discovery_potential || 0) >= 50) {
    score += (breakdown.discoveryBonus = 5)
  } else {
    breakdown.discoveryBonus = 0
  }

  // 3) POLARIZATION (hero avoids divisive)
  if (rowType === 'hero' && Number(movie.polarization_score || 0) >= 70) {
    score += (breakdown.polarizationPenalty = -20)
  } else breakdown.polarizationPenalty = 0

  // 4) ACCESSIBILITY
  const accessibilityScore = scoreAccessibility(movie, profile)
  score += (breakdown.accessibility = accessibilityScore)

  // 5) STARPOWER for low-confidence users
  if (profile.meta.confidence === 'low' && Number(movie.starpower_score || 0) >= 70) {
    score += (breakdown.starpower = 15)
  } else breakdown.starpower = 0

  // 6) CULT
  const cultScore = scoreCultStatus(movie, profile)
  score += (breakdown.cultStatus = cultScore)

  // 7) LANGUAGE
  score += (breakdown.language = scoreLanguageMatch(movie, profile))

  // 8) GENRE (user_preferences influences profile.genres.preferred)
  score += (breakdown.genre = scoreGenreMatch(movie, profile))

  // 9) CONTENT
  const contentScore = scoreContentMatch(movie, profile)
  score += (breakdown.content = contentScore.total)
  breakdown.contentDetail = contentScore.detail

  // 10) THEMES
  score += (breakdown.keywords = scoreKeywordMatch(movie, profile))

  // 11) PEOPLE
  const peopleScore = scorePeopleMatch(movie, profile)
  score += (breakdown.people = peopleScore.total)
  breakdown.peopleDetail = peopleScore.detail

  // 12) ERA & RUNTIME
  score += (breakdown.era = scoreEraMatch(movie, profile))
  score += (breakdown.runtime = scoreRuntimeMatch(movie, profile))

  // 13) RECENCY & QUALITY BONUS
  score += (breakdown.recency = scoreRecency(movie))
  score += (breakdown.qualityBonus = scoreQualityBonuses(movie))

  // 14) SEED SIMILARITY (metadata + embedding)
  const seedSimilarity = calculateSeedSimilarity(movie, seedFilms, opts.seedEmbeddingBestByMovieId)
  score += (breakdown.seedSimilarity = seedSimilarity.cappedScore)
  breakdown.seedSimilarityRaw = seedSimilarity.rawScore
  breakdown.seedMatch = seedSimilarity.bestSeed?.title || null
  breakdown.seedEmbeddingSim = seedSimilarity.embeddingSim || 0

  // 15) NEGATIVE SIGNALS & DIVERSITY
  score += (breakdown.negativeSignals = scoreNegativeSignals(movie, profile))
  score += (breakdown.diversity = scoreDiversityPenalty(movie, profile, seedFilms))

  // ✅ "likely seen" removed completely
  breakdown.likelySeenPenalty = 0

  const finalScore = Math.max(0, Math.round(score * 10) / 10)
  const pickReason = determinePickReason(movie, profile, breakdown, seedSimilarity)

  return { score: finalScore, positiveScore: finalScore, breakdown, pickReason }
}

function scoreAccessibility(movie, profile) {
  const base = Number(movie.accessibility_score || 0)
  if (!base) return 0

  const hasAbandonmentIssues =
    (profile.qualityProfile?.totalMoviesWatched || 0) >= 10 && (profile.negativeSignals?.totalSkips || 0) >= 5

  if (hasAbandonmentIssues && base >= 70) return 15
  if (base >= 80) return 10
  if (base >= 60) return 5
  return 0
}

function scoreCultStatus(movie, profile) {
  const cult = Number(movie.cult_status_score || 0)
  if (!cult || cult < 50) return 0

  if (profile.qualityProfile.watchesHiddenGems) return Math.min(cult / 5, 20)

  if ((profile.qualityProfile.totalMoviesWatched || 0) >= 20 && !profile.qualityProfile.watchesHiddenGems) return -15

  return 0
}

// NOTE: language scoring uses profile, but Hero filtering uses *history-derived* language guard.
// This scoring is still useful when you are "strong/loose".
function scoreLanguageMatch(movie, profile) {
  const movieLang = movie.original_language
  if (!movieLang || !profile.languages?.primary) return 5

  const langDist = profile.languages.distributionSorted || []
  const movieLangData = langDist.find((l) => l.lang === movieLang)
  const movieLangPct = movieLangData?.percentage || 0

  if (movieLang === profile.languages.primary) {
    const dominanceBonus = Math.round((profile.languages.primaryDominance || 0) / 2)
    return Math.min(dominanceBonus, 50)
  }

  if (movieLang === profile.languages.secondary) {
    const secondaryBonus = Math.round(movieLangPct * 0.8)
    return Math.min(secondaryBonus, 30)
  }

  if (movieLangPct >= 5) {
    const minorBonus = Math.round(movieLangPct * 0.5)
    return Math.min(minorBonus, 15)
  }

  const movieRegion = LANGUAGE_REGIONS[movieLang]
  const userRegion = LANGUAGE_REGIONS[profile.languages.primary]
  if (movieRegion && userRegion && movieRegion === userRegion) return 10

  if ((profile.languages.primaryDominance || 0) >= 80) return -50
  if ((profile.languages.primaryDominance || 0) >= 50) return -30

  return -10
}

function scoreGenreMatch(movie, profile) {
  const movieGenres = (movie.genres || []).map((g) => extractGenreId(g)).filter(Boolean)
  if (movieGenres.length === 0) return 0

  let score = 0

  const avoidedMatches = movieGenres.filter((g) => profile.genres.avoided.includes(g))
  if (avoidedMatches.length > 0) score -= 30 * avoidedMatches.length

  const fatiguedMatches = movieGenres.filter((g) => profile.genres.fatigued?.includes(g))
  if (fatiguedMatches.length > 0) score -= 10 * fatiguedMatches.length

  const preferredMatches = movieGenres.filter((g) => profile.genres.preferred.includes(g))
  score += Math.min(preferredMatches.length * 13, 40)

  if (profile.genres.preferred[0] && movieGenres.includes(profile.genres.preferred[0])) score += 10

  const secondaryMatches = movieGenres.filter((g) => profile.genres.secondary?.includes(g))
  score += Math.min(secondaryMatches.length * 4, 12)

  if (profile.genres.preferredPairs && movieGenres.length >= 2) {
    profile.genres.preferredPairs.forEach((pair) => {
      if (movieGenres.includes(pair.genres[0]) && movieGenres.includes(pair.genres[1])) score += 15
    })
  }

  return score
}

function scoreContentMatch(movie, profile) {
  const detail = {}
  const p = profile.contentProfile
  let total = 0

  if (movie.pacing_score != null) {
    const diff = Math.abs(movie.pacing_score - p.avgPacing)
    detail.pacing = diff <= 1 ? 10 : diff <= 2 ? 6 : diff <= 3 ? 3 : 0
    total += detail.pacing
  }

  if (movie.intensity_score != null) {
    const diff = Math.abs(movie.intensity_score - p.avgIntensity)
    detail.intensity = diff <= 1 ? 8 : diff <= 2 ? 5 : diff <= 3 ? 2 : 0
    total += detail.intensity
  }

  if (movie.emotional_depth_score != null) {
    const diff = Math.abs(movie.emotional_depth_score - p.avgEmotionalDepth)
    detail.depth = diff <= 1 ? 7 : diff <= 2 ? 4 : diff <= 3 ? 2 : 0
    total += detail.depth
  }

  if (movie.dialogue_density != null) {
    const diff = Math.abs(movie.dialogue_density - p.avgDialogueDensity)
    detail.dialogue = diff <= 10 ? 8 : diff <= 20 ? 5 : diff <= 30 ? 2 : 0
    total += detail.dialogue
  }

  if (movie.attention_demand != null) {
    const diff = Math.abs(movie.attention_demand - p.avgAttentionDemand)
    detail.attention = diff <= 10 ? 8 : diff <= 20 ? 5 : diff <= 30 ? 2 : 0
    total += detail.attention
  }

  if (movie.vfx_level_score != null) {
    const diff = Math.abs(movie.vfx_level_score - p.avgVFX)
    detail.vfx = diff <= 15 ? 6 : diff <= 30 ? 3 : 0
    total += detail.vfx
  }

  return { total, detail }
}

function scoreKeywordMatch(movie, profile) {
  const movieKeywords = (movie.keywords || [])
    .map((kw) => (typeof kw === 'object' ? kw.name : kw)?.toLowerCase())
    .filter(Boolean)

  if (movieKeywords.length === 0 || (profile.themes?.preferred || []).length === 0) return 0

  let matches = 0
  profile.themes.preferred.forEach((theme) => {
    if (movieKeywords.some((kw) => kw.includes(theme) || theme.includes(kw))) matches++
  })

  return Math.min(matches * 3, 15)
}

function scorePeopleMatch(movie, profile) {
  const detail = { director: 0, actor: 0 }

  if (movie.director_name) {
    const directorLower = safeLower(movie.director_name)
    const isSkipped = profile.negativeSignals?.skippedDirectors?.some((d) => safeLower(d.name) === directorLower)
    if (!isSkipped) {
      const match = profile.affinities.directors.find((d) => safeLower(d.name) === directorLower)
      if (match) detail.director = Math.min(20 + match.count * 7, 50)
    }
  }

  if (movie.lead_actor_name) {
    const actorLower = safeLower(movie.lead_actor_name)
    const isSkipped = profile.negativeSignals?.skippedActors?.some((a) => safeLower(a.name) === actorLower)
    if (!isSkipped) {
      const match = profile.affinities.actors.find((a) => safeLower(a.name) === actorLower)
      if (match) detail.actor = Math.min(5 + match.count * 5, 20)
    }
  }

  return { total: detail.director + detail.actor, detail }
}

// Combines metadata similarity + embedding similarity (from movie_recommendations)
function calculateSeedSimilarity(movie, seedFilms, seedEmbeddingBestByMovieId) {
  if (!seedFilms || seedFilms.length === 0) {
    return { rawScore: 0, cappedScore: 0, bestSeed: null, matchReasons: [], embeddingSim: 0 }
  }

  let bestScore = 0
  let bestSeed = null
  let bestReasons = []
  let bestEmbeddingSim = 0

  for (const seed of seedFilms) {
    let score = 0
    const reasons = []

    if (movie.director_name && seed.director_name && safeLower(movie.director_name) === safeLower(seed.director_name)) {
      score += 35
      reasons.push('same director')
    }

    const movieGenres = (movie.genres || []).map(extractGenreId).filter(Boolean)
    const seedGenres = (seed.genres || []).map(extractGenreId).filter(Boolean)
    const overlap = movieGenres.filter((g) => seedGenres.includes(g)).length
    if (overlap > 0) {
      score += Math.min(overlap * 8, 24)
      if (overlap >= 2) reasons.push('similar genres')
    }

    const movieKeywords = (movie.keywords || []).map((k) => (typeof k === 'object' ? k.name : k)?.toLowerCase()).filter(Boolean)
    const seedKeywords = (seed.keywords || []).map((k) => (typeof k === 'object' ? k.name : k)?.toLowerCase()).filter(Boolean)

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
      score += Math.min(keywordMatches * 6, 30)
      if (keywordMatches >= 2) reasons.push('similar themes')
    }

    if (movie.original_language && seed.original_language && movie.original_language === seed.original_language) score += 5

    if (movie.release_year && seed.release_year) {
      const yd = Math.abs(movie.release_year - seed.release_year)
      if (yd <= 5) score += 6
      else if (yd <= 10) score += 3
    }

    // Embedding similarity (if available) — BIG win for “Similar to”
    let embeddingSim = 0
    if (seedEmbeddingBestByMovieId && seedEmbeddingBestByMovieId instanceof Map) {
      const best = seedEmbeddingBestByMovieId.get(Number(movie.id))
      if (best && Number(best.seedMovieId) === Number(seed.id)) {
        embeddingSim = Number(best.similarity || 0)
      }
    }

    // Convert sim (0..1) to bonus (0..60)
    const embeddingBonus = embeddingSim > 0 ? clamp(embeddingSim * 60, 0, 60) : 0
    if (embeddingBonus >= 35) reasons.push('embedding match')
    score += embeddingBonus

    if (score > bestScore) {
      bestScore = score
      bestSeed = seed
      bestReasons = reasons
      bestEmbeddingSim = embeddingSim
    }
  }

  const cappedScore = Math.min(bestScore * 0.4, 40) // cap to prevent domination
  return {
    rawScore: bestScore,
    cappedScore,
    bestSeed,
    matchReasons: bestReasons,
    embeddingSim: bestEmbeddingSim
  }
}

function scoreEraMatch(movie, profile) {
  if (!movie.release_year) return 0
  const movieDecade = Math.floor(movie.release_year / 10) * 10 + 's'
  if (profile.preferences.preferredDecades.includes(movieDecade)) return 8

  const movieDecadeNum = parseInt(movieDecade)
  const hasAdjacent = profile.preferences.preferredDecades.some((d) => Math.abs(parseInt(d) - movieDecadeNum) === 10)
  if (hasAdjacent) return 4
  if (movie.release_year < 1990 && profile.preferences.toleratesClassics) return 2
  return 0
}

function scoreRuntimeMatch(movie, profile) {
  if (!movie.runtime) return 0
  const avg = profile.preferences.avgRuntime
  const [min, max] = profile.preferences.runtimeRange
  const runtime = movie.runtime

  if (Math.abs(runtime - avg) <= 15) return 7
  if (Math.abs(runtime - avg) <= 30) return 4
  if (runtime >= min && runtime <= max) return 2
  if (runtime > max + 30) return -5
  return 0
}

function scoreRecency(movie) {
  if (!movie.release_year) return 0
  const age = new Date().getFullYear() - movie.release_year
  if (age === 0) return 15
  if (age === 1) return 10
  if (age <= 3) return 5
  return 0
}

function scoreQualityBonuses(movie) {
  let bonus = 0
  if (Number(movie.quality_score || 0) >= 85) bonus += 8
  else if (Number(movie.quality_score || 0) >= 75) bonus += 4

  if (Number(movie.cult_status_score || 0) >= 50) bonus += 7
  else if (Number(movie.cult_status_score || 0) >= 30) bonus += 3

  if (Number(movie.ff_confidence || 0) >= 80) bonus += 2
  return bonus
}

function scoreNegativeSignals(movie, profile) {
  if (!profile.negativeSignals) return 0
  let penalty = 0
  const movieGenres = (movie.genres || []).map(extractGenreId).filter(Boolean)

  profile.negativeSignals.skippedGenres?.forEach((skipped) => {
    if (movieGenres.includes(skipped.id)) penalty += Math.min(-15 - skipped.skipCount * 5, -40)
  })

  if (movie.director_name) {
    const skippedDirector = profile.negativeSignals.skippedDirectors?.find((d) => safeLower(d.name) === safeLower(movie.director_name))
    if (skippedDirector) penalty += skippedDirector.skipCount >= 3 ? -50 : -30
  }

  if (movie.lead_actor_name) {
    const skippedActor = profile.negativeSignals.skippedActors?.find((a) => safeLower(a.name) === safeLower(movie.lead_actor_name))
    if (skippedActor) penalty += skippedActor.skipCount >= 3 ? -40 : -25
  }

  if (movie.original_language) {
    const skippedLang = profile.negativeSignals.skippedLanguages?.find((l) => l.language === movie.original_language)
    if (skippedLang) penalty += -20
  }

  return penalty
}

function scoreDiversityPenalty(movie, profile, seedFilms) {
  let penalty = 0

  if (movie.director_name && seedFilms.length > 0) {
    const movieDirector = safeLower(movie.director_name)
    const directorAppearances = seedFilms.filter((s) => safeLower(s.director_name) === movieDirector).length
    if (directorAppearances >= 2) penalty -= 15
  }

  const movieGenres = (movie.genres || []).map(extractGenreId).filter(Boolean)
  const primaryGenre = movieGenres[0]

  if (primaryGenre && seedFilms.length > 0) {
    let genreMatchCount = 0
    seedFilms.forEach((seed) => {
      const seedGenres = (seed.genres || []).map(extractGenreId).filter(Boolean)
      if (seedGenres.includes(primaryGenre)) genreMatchCount++
    })
    if (genreMatchCount >= 3) penalty -= 10
  }

  return penalty
}

export function calculateLikelySeenScore() {
  // Disabled by design in v2.3
  return 0
}

function determinePickReason(movie, profile, breakdown, seedSimilarity = {}) {
  // Strong embedding/seed similarity wins
  if ((seedSimilarity.embeddingSim || 0) >= 0.75 && seedSimilarity.bestSeed) {
    return {
      label: `Because you loved ${seedSimilarity.bestSeed.title}`,
      type: 'seed_embedding',
      seedTitle: seedSimilarity.bestSeed.title
    }
  }

  if ((seedSimilarity.rawScore || 0) >= 60 && seedSimilarity.bestSeed) {
    return {
      label: `Because you loved ${seedSimilarity.bestSeed.title}`,
      type: 'seed_similarity',
      seedTitle: seedSimilarity.bestSeed.title
    }
  }

  if (breakdown.peopleDetail?.director >= 25) {
    return { label: `Because you love ${movie.director_name}`, type: 'director_affinity' }
  }

  if (breakdown.peopleDetail?.actor >= 15) {
    return { label: `Starring ${movie.lead_actor_name}`, type: 'actor_affinity' }
  }

  if ((seedSimilarity.rawScore || 0) >= 35 && seedSimilarity.bestSeed) {
    return { label: `Similar to ${seedSimilarity.bestSeed.title}`, type: 'seed_similar', seedTitle: seedSimilarity.bestSeed.title }
  }

  if ((breakdown.language || 0) >= 20 && (breakdown.genre || 0) >= 15) return { label: 'Perfect for you', type: 'perfect_match' }
  if ((breakdown.genre || 0) >= 20) return { label: 'Right up your alley', type: 'genre_match' }
  if (Number(movie.discovery_potential || 0) >= 60) return { label: 'Hidden gem', type: 'hidden_gem' }
  if (Number(movie.quality_score || 0) >= 85 || Number(movie.ff_rating || 0) >= 7.5) return { label: 'Critically acclaimed', type: 'quality' }
  if (movie.release_year === new Date().getFullYear()) return { label: 'Fresh pick', type: 'recency' }
  if ((breakdown.content || 0) >= 35) return { label: 'Matches your vibe', type: 'content_match' }

  return { label: 'Recommended for you', type: 'default' }
}

function applyDiversityFilter(candidates, seedFilms = [], limit = 10) {
  if (!candidates || candidates.length === 0) return []

  const diverse = []
  const usedDirectors = new Set()
  const usedPrimaryGenres = new Set()

  const seedDirectors = new Set(seedFilms.map((s) => safeLower(s.director_name)).filter(Boolean))
  const seedGenres = new Set()
  seedFilms.forEach((s) => {
    const genres = (s.genres || []).map((g) => extractGenreId(g)).filter(Boolean)
    if (genres[0]) seedGenres.add(genres[0])
  })

  for (const candidate of candidates) {
    if (diverse.length >= limit) break

    const m = candidate.movie
    const director = safeLower(m.director_name)
    const movieGenres = (m.genres || []).map(extractGenreId).filter(Boolean)
    const primaryGenre = movieGenres[0]

    if (director && usedDirectors.has(director)) {
      const count = diverse.filter((d) => safeLower(d.movie.director_name) === director).length
      if (count >= 2) continue
    }

    if (primaryGenre && usedPrimaryGenres.has(primaryGenre)) {
      const count = diverse.filter((d) => {
        const g = (d.movie.genres || []).map(extractGenreId).filter(Boolean)
        return g[0] === primaryGenre
      }).length
      if (count >= 2) continue
    }

    // Prefer a bit of “newness” vs seeds, but don’t over-filter
    const isDifferentFromSeeds = (!director || !seedDirectors.has(director)) && (!primaryGenre || !seedGenres.has(primaryGenre))

    diverse.push(candidate)
    if (director) usedDirectors.add(director)
    if (primaryGenre) usedPrimaryGenres.add(primaryGenre)

    // (Optional) could track discoveryCount; removed for simplicity
    void isDifferentFromSeeds
  }

  return diverse
}

// ============================================================================
// LOGGING & FALLBACK
// ============================================================================

async function logImpression(userId, selectedCandidate, placement) {
  try {
    await supabase.from('recommendation_impressions').insert({
      user_id: userId,
      movie_id: selectedCandidate.movie.id,
      placement,
      shown_at: new Date().toISOString(),
      pick_reason_type: selectedCandidate.pickReason.type,
      pick_reason_label: selectedCandidate.pickReason.label,
      score: selectedCandidate.score,
      algorithm_version: `v${ENGINE_VERSION}`,
      seed_movie_id: selectedCandidate.breakdown.seedMatch ? selectedCandidate.breakdown.seedMatch : null
    })
  } catch (err) {
    console.error('[logImpression] Error:', err)
  }
}

async function getFallbackPick(profile) {
  try {
    const { data: fallback } = await supabase
      .from('movies')
      .select('*')
      .eq('is_valid', true)
      .not('backdrop_path', 'is', null)
      .not('tmdb_id', 'is', null)
      .gte('ff_rating', 8.0)
      .gte('release_date', '2020-01-01')
      .order('ff_rating', { ascending: false })
      .limit(20)

    if (fallback && fallback.length > 0) {
      const pick = fallback[Math.floor(Math.random() * fallback.length)]
      return {
        movie: pick,
        pickReason: { label: 'Critically acclaimed', type: 'quality' },
        score: Number(pick.ff_rating || 0) * 10,
        debug: { fallback: true }
      }
    }
  } catch (err) {
    console.error('[getFallbackPick] Error:', err)
  }

  return {
    movie: null,
    pickReason: { label: 'No recommendations available', type: 'error' },
    score: 0,
    debug: { error: true }
  }
}

// ============================================================================
// UPDATE IMPRESSION
// ============================================================================

export async function updateImpression(userId, movieId, action, metadata = {}) {
  try {
    const { data: impression } = await supabase
      .from('recommendation_impressions')
      .select('id')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .order('shown_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!impression) return

    const updates = {
      clicked: action === 'clicked',
      skipped: action === 'skipped',
      marked_watched: action === 'watched'
    }

    if (action === 'clicked') updates.clicked_at = new Date().toISOString()

    await supabase.from('recommendation_impressions').update(updates).eq('id', impression.id)

    void metadata
  } catch (err) {
    console.error('[updateImpression] Error:', err)
  }
}

export const RECOMMENDATION_CONSTANTS = {
  LANGUAGE_REGIONS,
  LIKELY_SEEN_WEIGHTS, // all zero now
  THRESHOLDS,
  GENRE_NAME_TO_ID
}


// ============================================================================
// QUICK PICKS ROW
// ============================================================================

/**
 * Get personalized quick picks for homepage row
 * NOW WITH: Embedding similarity, diversity, impression tracking, CACHING, DEDUPLICATION
 * 
 * @param {string} userId - User UUID
 * @param {Object} options - Optional overrides
 * @returns {Promise<Object[]>} Array of scored movies
 */
export async function getQuickPicksForUser(userId, options = {}) {
  const { limit = 20, excludeIds = [], forceRefresh = false } = options

  if (!userId) {
    console.log('[getQuickPicksForUser] No userId, returning empty')
    return []
  }

  const cacheKey = recommendationCache.key('quick_picks', userId, { limit, excludeIds })

  if (forceRefresh) {
    recommendationCache.invalidate(cacheKey)
  }

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
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
  })
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

// ============================================================================
// GENRE-BASED RECOMMENDATIONS ROW
// ============================================================================

/**
 * Get recommendations based on user's genre preferences
 * Uses our DB with embedding similarity
 * NOW WITH: CACHING, DEDUPLICATION (getOrFetch)
 *
 * @param {string} userId - User UUID
 * @param {Object} options - Optional overrides
 * @returns {Promise<Object[]>} Array of scored movies
 */
export async function getGenreBasedRecommendations(userId, options = {}) {
  const { limit = 20, excludeIds = [], forceRefresh = false } = options

  // Stabilize excludeIds so [1,2] and [2,1] share the same cache key
  const stableExcludeIds = Array.isArray(excludeIds) ? [...excludeIds].sort((a, b) => a - b) : []

  const cacheKey = recommendationCache.key('genre_based', userId || 'guest', {
    limit,
    excludeIds: stableExcludeIds
  })

  if (forceRefresh) {
    recommendationCache.invalidate(cacheKey)
  }

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      if (!userId) {
        console.log('[getGenreBasedRecommendations] No userId, returning fallback')
        return await getGenreFallback(limit)
      }

      // 1. Compute user profile
      const profile = await computeUserProfile(userId)

      const preferredGenres = profile.genres.preferred || []
      console.log('[getGenreBasedRecommendations] User preferred genres:', preferredGenres)

      if (preferredGenres.length === 0) {
        console.warn('[getGenreBasedRecommendations] No genre preferences found')
        return await getGenreFallback(limit)
      }

      // 2. Get seed films for embedding search
      const seedFilms = await getSeedFilms(userId, profile)
      const seedIds = seedFilms.map(s => s.id).filter(Boolean)

      // 3. Get user's watched movie IDs
      const { data: watchedData } = await supabase
        .from('user_history')
        .select('movie_id')
        .eq('user_id', userId)

      const watchedIds = watchedData?.map(w => w.movie_id) || []
      const allExcludeIds = [...new Set([...watchedIds, ...stableExcludeIds])]

      // 4. Fetch candidates from preferred genres
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

      // Pool 1: Movies with primary genre in user's preferred genres
      // Map TMDB genre IDs to names used in `primary_genre`
      const genreIdToName = {
        28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
        80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
        14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
        9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
        10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
      }

      const preferredGenreNames = preferredGenres
        .map(id => genreIdToName[id])
        .filter(Boolean)

      let genreFilms = []
      if (preferredGenreNames.length > 0) {
        const { data } = await supabase
          .from('movies')
          .select(selectFields)
          .eq('is_valid', true)
          .not('poster_path', 'is', null)
          .in('primary_genre', preferredGenreNames)
          .gte('ff_rating', 6.0)
          .order('ff_rating', { ascending: false })
          .limit(150)

        genreFilms = data || []
      }

      // Pool 2: Embedding neighbors (semantic similarity within genre taste)
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
          console.warn('[getGenreBasedRecommendations] Embedding search error:', embError.message)
        } else {
          embeddingNeighbors = embeddingMatches || []
          console.log('[getGenreBasedRecommendations] Embedding neighbors found:', embeddingNeighbors.length)
        }
      }

      // Combine and deduplicate
      const allCandidates = [
        ...(genreFilms || []),
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

      console.log('[getGenreBasedRecommendations] Candidate pools:', {
        genreFilms: genreFilms?.length || 0,
        embeddingNeighbors: embeddingNeighbors?.length || 0,
        totalUnique: candidates.length
      })

      // 5. Filter out watched/excluded
      const eligible = candidates.filter(m => !allExcludeIds.includes(m.id))
      if (eligible.length === 0) return await getGenreFallback(limit)

      // 6. Score with GENRE-SPECIFIC weights
      const scored = eligible.map(movie => {
        const result = scoreMovieForUser(movie, profile, 'favorite_genres', seedFilms)

        // Embedding similarity boost
        let embeddingBoost = 0
        let embeddingReason = null

        if (movie._embeddingSimilarity) {
          const simNormalized = Math.max(0, movie._embeddingSimilarity - 0.5) / 0.4
          embeddingBoost = Math.round(simNormalized * 55)
          embeddingReason = {
            seedTitle: movie._matchedSeedTitle,
            seedId: movie._matchedSeedId,
            similarity: movie._embeddingSimilarity
          }
        }

        // GENRE-SPECIFIC: Extra boost for primary genre match
        let genreBoost = 0
        const movieGenreName = movie.primary_genre?.toLowerCase()
        const isPreferredGenre = preferredGenreNames.some(g => g.toLowerCase() === movieGenreName)

        if (isPreferredGenre) genreBoost += 20

        // Update pick reason
        let pickReason = result.pickReason
        if (embeddingReason && embeddingBoost >= 25) {
          pickReason = {
            label: `${movie.primary_genre || 'Film'} • Similar to ${embeddingReason.seedTitle}`,
            type: 'genre_embedding',
            seedTitle: embeddingReason.seedTitle,
            similarity: embeddingReason.similarity
          }
        } else if (isPreferredGenre) {
          pickReason = {
            label: `Because you love ${movie.primary_genre}`,
            type: 'genre_match'
          }
        } else {
          pickReason = {
            label: 'Matches your taste',
            type: 'genre_taste'
          }
        }

        return {
          movie,
          ...result,
          score: result.score + embeddingBoost + genreBoost,
          embeddingBoost,
          genreBoost,
          embeddingReason,
          pickReason
        }
      })

      // 7. Sort by score
      scored.sort((a, b) => b.score - a.score)

      // 8. Apply diversity filter
      const diverse = applyRowDiversityFilter(scored, limit)

      console.log('[getGenreBasedRecommendations] Final selection:', diverse.slice(0, 5).map(d => ({
        title: d.movie.title,
        score: d.score,
        genreBoost: d.genreBoost,
        embeddingBoost: d.embeddingBoost,
        primaryGenre: d.movie.primary_genre
      })))

      // 9. Log impressions (async, don't await)
      logRowImpressions(userId, diverse, 'favorite_genres').catch(err =>
        console.warn('[getGenreBasedRecommendations] Failed to log impressions:', err.message)
      )

      // 10. Return formatted results (no manual cache set; getOrFetch handles it)
      return diverse.map(item => ({
        ...item.movie,
        _score: item.score,
        _pickReason: item.pickReason,
        _embeddingSimilarity: item.embeddingReason?.similarity || null
      }))

    } catch (error) {
      console.error('[getGenreBasedRecommendations] Error:', error)
      return await getGenreFallback(limit)
    }
  })
}



/**
 * Fallback for genre recommendations when no user or error
 */
async function getGenreFallback(limit = 20) {
  const { data } = await supabase
    .from('movies')
    .select(`
      id, tmdb_id, title, overview, tagline,
      original_language, runtime, release_year, release_date,
      poster_path, backdrop_path, trailer_youtube_key,
      ff_rating, ff_confidence, quality_score, vote_average,
      pacing_score, intensity_score, emotional_depth_score,
      dialogue_density, attention_demand, vfx_level_score,
      cult_status_score, popularity, vote_count, revenue,
      director_name, lead_actor_name,
      genres, keywords, primary_genre
    `)
    .eq('is_valid', true)
    .not('poster_path', 'is', null)
    .gte('ff_rating_genre_normalized', 7.5)
    .order('ff_rating_genre_normalized', { ascending: false })
    .limit(limit)

  return (data || []).map(movie => ({
    ...movie,
    _score: movie.ff_rating * 10,
    _pickReason: { label: 'Recommended', type: 'fallback_genre' }
  }))
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


// ============================================================================
// BECAUSE YOU WATCHED ROWS
// ============================================================================

/**
 * Get "Because you watched X" rows using embedding similarity
 * Creates multiple rows, each seeded by a recent high-quality watch
 * NOW WITH: CACHING, DEDUPLICATION
 * 
 * @param {string} userId - User UUID
 * @param {Object} options - Optional overrides
 * @returns {Promise<Object[]>} Array of { seedTitle, seedId, seedTmdbId, movies }
 */
export async function getBecauseYouWatchedRows(userId, options = {}) {
  const {
    maxSeeds = 2,
    limitPerSeed = 20,
    excludeIds = [],
    forceRefresh = false,
    signal
  } = options

  if (!userId) {
    console.log('[getBecauseYouWatchedRows] No userId, returning empty')
    return []
  }

  const stableExcludeIds = Array.isArray(excludeIds) ? [...excludeIds].sort() : []
  const cacheKey = recommendationCache.key('because_you_watched_rows', userId, {
    maxSeeds,
    limitPerSeed,
    excludeIds: stableExcludeIds
  })

  if (forceRefresh) {
    recommendationCache.invalidate(cacheKey)
  }

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      // 1. Get user's watch history with movie details
      const { data: history, error: histError } = await supabase
        .from('user_history')
        .select(`
          movie_id,
          watched_at,
          source,
          movies!inner (
            id, tmdb_id, title, ff_rating,
            director_name, primary_genre
          )
        `)
        .eq('user_id', userId)
        .order('watched_at', { ascending: false })
        .limit(50)

      if (histError) throw histError
      if (!history || history.length === 0) {
        console.log('[getBecauseYouWatchedRows] No watch history')
        return []
      }

      // 2. Get all watched IDs for exclusion
      const { data: allWatched } = await supabase
        .from('user_history')
        .select('movie_id')
        .eq('user_id', userId)

      const watchedIds = allWatched?.map(w => w.movie_id) || []
      const allExcludeIds = [...new Set([...watchedIds, ...excludeIds])]

      // 3. Select seed films - prefer high-quality recent watches
      const seenMovies = new Set()
      const potentialSeeds = []

      for (const item of history) {
        if (!item.movies?.id || !item.movies?.title) continue
        if (seenMovies.has(item.movies.id)) continue

        seenMovies.add(item.movies.id)
        potentialSeeds.push({
          id: item.movies.id,
          tmdbId: item.movies.tmdb_id,
          title: item.movies.title,
          ffRating: item.movies.ff_rating || 0,
          director: item.movies.director_name,
          genre: item.movies.primary_genre,
          source: item.source,
          watchedAt: item.watched_at
        })
      }

      // Sort by quality (prefer higher rated films as seeds)
      potentialSeeds.sort((a, b) => {
        if (a.source === 'onboarding' && b.source !== 'onboarding') return -1
        if (b.source === 'onboarding' && a.source !== 'onboarding') return 1
        return b.ffRating - a.ffRating
      })

      const seeds = potentialSeeds.slice(0, maxSeeds)

      if (seeds.length === 0) {
        console.log('[getBecauseYouWatchedRows] No valid seeds')
        return []
      }

      console.log('[getBecauseYouWatchedRows] Selected seeds:', seeds.map(s => ({
        title: s.title,
        ffRating: s.ffRating,
        source: s.source
      })))

      // 4. For each seed, find similar movies using embeddings
      const rows = []

      for (const seed of seeds) {
        try {
          // Call embedding similarity function for this single seed
          const { data: similarMovies, error: embError } = await supabase
            .rpc('match_movies_by_seeds', {
              seed_ids: [seed.id],
              exclude_ids: allExcludeIds,
              match_count: limitPerSeed + 10, // Fetch extra for filtering
              min_ff_rating: 5.5
            })

          if (embError) {
            console.warn('[getBecauseYouWatchedRows] Embedding error for seed:', seed.title, embError.message)
            continue
          }

          if (!similarMovies || similarMovies.length === 0) {
            console.log('[getBecauseYouWatchedRows] No similar movies for:', seed.title)
            continue
          }

          // 5. Score and enhance results
          const scored = similarMovies.map(movie => {
            const similarity = movie.similarity || 0
            let score = similarity * 100

            // Boost for same director
            if (movie.director_name && seed.director &&
                movie.director_name.toLowerCase() === seed.director.toLowerCase()) {
              score += 15
            }

            // Boost for same genre
            if (movie.primary_genre && seed.genre &&
                movie.primary_genre.toLowerCase() === seed.genre.toLowerCase()) {
              score += 10
            }

            // Quality floor boost
            if (movie.ff_rating >= 7.0) score += 10
            else if (movie.ff_rating >= 6.5) score += 5

            return {
              movie: {
                ...movie,
                _embeddingSimilarity: similarity,
                _matchedSeedTitle: seed.title
              },
              score,
              similarity
            }
          })

          // Sort by score
          scored.sort((a, b) => b.score - a.score)

          // Apply light diversity (max 2 per director)
          const diverse = []
          const directorCounts = new Map()

          for (const item of scored) {
            if (diverse.length >= limitPerSeed) break

            const director = item.movie.director_name?.toLowerCase() || 'unknown'
            const count = directorCounts.get(director) || 0

            if (count >= 2) continue

            diverse.push(item)
            directorCounts.set(director, count + 1)
          }

          // Format movies for output
          const movies = diverse.map(item => ({
            ...item.movie,
            _score: item.score,
            _pickReason: {
              label: `Similar to ${seed.title}`,
              type: 'because_you_watched',
              seedTitle: seed.title,
              similarity: item.similarity
            }
          }))

          if (movies.length > 0) {
            rows.push({
              seedTitle: seed.title,
              seedId: seed.id,
              seedTmdbId: seed.tmdbId,
              movies
            })

            // Log impressions for this row
            logRowImpressions(userId, diverse.map(d => ({
              movie: d.movie,
              pickReason: {
                label: `Similar to ${seed.title}`,
                type: 'because_you_watched'
              },
              score: d.score,
              embeddingReason: {
                seedTitle: seed.title,
                seedId: seed.id,
                similarity: d.similarity
              }
            })), 'because_you_loved').catch(err =>
              console.warn('[getBecauseYouWatchedRows] Failed to log impressions:', err.message)
            )
          }

          console.log(`[getBecauseYouWatchedRows] Row for "${seed.title}":`, {
            moviesFound: movies.length,
            topMatch: movies[0]?.title,
            topSimilarity: movies[0]?._embeddingSimilarity?.toFixed(3)
          })

        } catch (seedError) {
          console.warn('[getBecauseYouWatchedRows] Seed row failed:', seed.title, seedError)
        }
      }

      console.log('[getBecauseYouWatchedRows] Total rows:', rows.length)
      return rows

    } catch (error) {
      console.error('[getBecauseYouWatchedRows] Error:', error)
      return []
    }
  })
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

// ============================================================================
// TRENDING FOR YOU ROW
// ============================================================================

/**
 * Get trending movies personalized for user
 * Combines: Recent popular releases + User taste matching + Embedding similarity
 *
 * NOW WITH: CACHING, DEDUPLICATION (getOrFetch)
 *
 * @param {string} userId - User UUID
 * @param {Object} options - Optional overrides
 * @returns {Promise<Object[]>} Array of scored movies
 */
export async function getTrendingForUser(userId, options = {}) {
  const { limit = 20, excludeIds = [], forceRefresh = false } = options

  // Stabilize excludeIds so [1,2] and [2,1] share the same cache key
  const stableExcludeIds = Array.isArray(excludeIds) ? [...excludeIds].sort((a, b) => a - b) : []

  const cacheKey = recommendationCache.key('trending', userId || 'guest', {
    limit,
    excludeIds: stableExcludeIds
  })

  if (forceRefresh) {
    recommendationCache.invalidate(cacheKey)
  }

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      if (!userId) {
        console.log('[getTrendingForUser] No userId, returning popular fallback')
        return await getTrendingFallback(limit)
      }

      // 1. Compute user profile
      const profile = await computeUserProfile(userId)

      console.log('[getTrendingForUser] User profile:', {
        preferredGenres: profile.genres.preferred,
        directors: profile.affinities.directors.map(d => d.name).slice(0, 3)
      })

      // 2. Get seed films for embedding search
      const seedFilms = await getSeedFilms(userId, profile)
      const seedIds = seedFilms.map(s => s.id).filter(Boolean)

      // 3. Get user's watched movie IDs
      const { data: watchedData } = await supabase
        .from('user_history')
        .select('movie_id')
        .eq('user_id', userId)

      const watchedIds = watchedData?.map(w => w.movie_id) || []
      const allExcludeIds = [...new Set([...watchedIds, ...stableExcludeIds])]

      // 4. Fetch candidates - Focus on RECENT + POPULAR
      const currentYear = new Date().getFullYear()
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

      // Pool 1: Recent popular films (last 2 years, high popularity)
      const { data: recentPopular } = await supabase
        .from('movies')
        .select(selectFields)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
        .gte('release_year', currentYear - 2)
        .gte('popularity', 20)
        .order('popularity', { ascending: false })
        .limit(100)

      // Pool 2: This year's releases (any popularity)
      const { data: thisYear } = await supabase
        .from('movies')
        .select(selectFields)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
        .eq('release_year', currentYear)
        .gte('ff_rating', 5.5)
        .order('popularity', { ascending: false })
        .limit(50)

      // Pool 3: Embedding neighbors from seeds (semantic trending)
      let embeddingNeighbors = []
      if (seedIds.length > 0) {
        const { data: embeddingMatches, error: embError } = await supabase
          .rpc('match_movies_by_seeds', {
            seed_ids: seedIds,
            exclude_ids: allExcludeIds,
            match_count: 30,
            min_ff_rating: 5.5
          })

        if (embError) {
          console.warn('[getTrendingForUser] Embedding search error:', embError.message)
        } else {
          // Filter to recent releases only
          embeddingNeighbors = (embeddingMatches || []).filter(m =>
            m.release_year && m.release_year >= currentYear - 2
          )
          console.log('[getTrendingForUser] Embedding neighbors (recent):', embeddingNeighbors.length)
        }
      }

      // Combine and deduplicate
      const allCandidates = [
        ...(recentPopular || []),
        ...(thisYear || []),
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

      console.log('[getTrendingForUser] Candidate pools:', {
        recentPopular: recentPopular?.length || 0,
        thisYear: thisYear?.length || 0,
        embeddingNeighbors: embeddingNeighbors?.length || 0,
        totalUnique: candidates.length
      })

      // 5. Filter out watched/excluded
      const eligible = candidates.filter(m => !allExcludeIds.includes(m.id))

      if (eligible.length === 0) {
        return await getTrendingFallback(limit)
      }

      // 6. Score with TRENDING-SPECIFIC weights
      const scored = eligible.map(movie => {
        const result = scoreMovieForUser(movie, profile, 'trending', seedFilms)

        // Embedding similarity boost
        let embeddingBoost = 0
        let embeddingReason = null

        if (movie._embeddingSimilarity) {
          const simNormalized = Math.max(0, movie._embeddingSimilarity - 0.5) / 0.4
          embeddingBoost = Math.round(simNormalized * 50) // Max 50 for trending
          embeddingReason = {
            seedTitle: movie._matchedSeedTitle,
            seedId: movie._matchedSeedId,
            similarity: movie._embeddingSimilarity
          }
        }

        // TRENDING-SPECIFIC: Boost popularity and recency more
        let trendingBoost = 0

        // Popularity boost (trending = what's hot)
        if (movie.popularity >= 100) trendingBoost += 25
        else if (movie.popularity >= 50) trendingBoost += 15
        else if (movie.popularity >= 20) trendingBoost += 8

        // Recency boost (trending = recent)
        const age = movie.release_year ? currentYear - movie.release_year : 10
        if (age === 0) trendingBoost += 30      // This year
        else if (age === 1) trendingBoost += 18 // Last year
        else if (age === 2) trendingBoost += 8  // 2 years ago

        // Update pick reason
        let pickReason = result.pickReason
        if (embeddingReason && embeddingBoost >= 20) {
          pickReason = {
            label: `Trending • Similar to ${embeddingReason.seedTitle}`,
            type: 'trending_embedding',
            seedTitle: embeddingReason.seedTitle,
            similarity: embeddingReason.similarity
          }
        } else if (trendingBoost >= 40) {
          pickReason = { label: 'Hot right now', type: 'trending_hot' }
        } else if (age === 0) {
          pickReason = { label: 'New release', type: 'trending_new' }
        }

        return {
          movie,
          ...result,
          score: result.score + embeddingBoost + trendingBoost,
          embeddingBoost,
          trendingBoost,
          embeddingReason,
          pickReason
        }
      })

      // 7. Sort by score
      scored.sort((a, b) => b.score - a.score)

      // 8. Apply diversity filter
      const diverse = applyRowDiversityFilter(scored, limit)

      console.log('[getTrendingForUser] Final selection:', diverse.slice(0, 5).map(d => ({
        title: d.movie.title,
        score: d.score,
        trendingBoost: d.trendingBoost,
        embeddingBoost: d.embeddingBoost,
        popularity: d.movie.popularity,
        year: d.movie.release_year
      })))

      // 9. Log impressions
      logRowImpressions(userId, diverse, 'trending').catch(err =>
        console.warn('[getTrendingForUser] Failed to log impressions:', err.message)
      )

      // 10. Return formatted results (no manual cache set; getOrFetch handles it)
      return diverse.map(item => ({
        ...item.movie,
        _score: item.score,
        _pickReason: item.pickReason,
        _embeddingSimilarity: item.embeddingReason?.similarity || null
      }))
    } catch (error) {
      console.error('[getTrendingForUser] Error:', error)
      return await getTrendingFallback(limit)
    }
  })
}


/**
 * Fallback for trending when no user or error
 */
async function getTrendingFallback(limit = 20) {
  const currentYear = new Date().getFullYear()
  
  const { data } = await supabase
    .from('movies')
    .select(`
      id, tmdb_id, title, overview, tagline,
      original_language, runtime, release_year, release_date,
      poster_path, backdrop_path, trailer_youtube_key,
      ff_rating, ff_confidence, quality_score, vote_average,
      pacing_score, intensity_score, emotional_depth_score,
      dialogue_density, attention_demand, vfx_level_score,
      cult_status_score, popularity, vote_count, revenue,
      director_name, lead_actor_name,
      genres, keywords, primary_genre
    `)
    .eq('is_valid', true)
    .not('poster_path', 'is', null)
    .gte('release_year', currentYear - 2)
    .gte('popularity', 20)
    .order('popularity', { ascending: false })
    .limit(limit)

  return (data || []).map(movie => ({
    ...movie,
    _score: movie.popularity,
    _pickReason: { label: 'Trending now', type: 'fallback_trending' }
  }))
}
// ============================================================================
// HIDDEN GEMS ROW
// ============================================================================

/**
 * Get hidden gems personalized for user
 * Hidden Gems = High quality (ff_rating) + Low popularity + Matches user taste
 *
 * NOW WITH: CACHING, DEDUPLICATION (getOrFetch)
 *
 * @param {string} userId - User UUID
 * @param {Object} options - Optional overrides
 * @returns {Promise<Object[]>} Array of scored movies
 */
export async function getHiddenGemsForUser(userId, options = {}) {
  const { limit = 20, excludeIds = [], forceRefresh = false } = options

  // Stabilize excludeIds so [1,2] and [2,1] share the same cache key
  const stableExcludeIds = Array.isArray(excludeIds) ? [...excludeIds].sort((a, b) => a - b) : []

  const cacheKey = recommendationCache.key('hidden_gems', userId || 'guest', {
    limit,
    excludeIds: stableExcludeIds
  })

  if (forceRefresh) {
    recommendationCache.invalidate(cacheKey)
  }

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      if (!userId) {
        console.log('[getHiddenGemsForUser] No userId, returning fallback')
        return await getHiddenGemsFallback(limit)
      }

      // 1. Compute user profile
      const profile = await computeUserProfile(userId)

      console.log('[getHiddenGemsForUser] User profile:', {
        preferredGenres: profile.genres.preferred,
        directors: profile.affinities.directors.map(d => d.name).slice(0, 3)
      })

      // 2. Get seed films for embedding search
      const seedFilms = await getSeedFilms(userId, profile)
      const seedIds = seedFilms.map(s => s.id).filter(Boolean)

      // 3. Get user's watched movie IDs
      const { data: watchedData } = await supabase
        .from('user_history')
        .select('movie_id')
        .eq('user_id', userId)

      const watchedIds = watchedData?.map(w => w.movie_id) || []
      const allExcludeIds = [...new Set([...watchedIds, ...stableExcludeIds])]

      // 4. Fetch candidates - HIDDEN GEM CRITERIA
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

      // Pool 1: High quality, low popularity (classic hidden gems)
      const { data: classicGems } = await supabase
        .from('movies')
        .select(selectFields)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
        .gte('ff_rating', 7.0)
        .lt('popularity', 30)
        .gte('vote_count', 50) // Enough votes to trust rating
        .order('ff_rating', { ascending: false })
        .limit(100)

      // Pool 2: Cult classics (high cult_status_score)
      const { data: cultGems } = await supabase
        .from('movies')
        .select(selectFields)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
        .gte('ff_rating', 7.5)
        .gte('cult_status_score', 60)
        .lt('popularity', 50)
        .order('cult_status_score', { ascending: false })
        .limit(50)

      // Pool 3: Embedding neighbors that are hidden gems
      let embeddingGems = []
      if (seedIds.length > 0) {
        const { data: embeddingMatches, error: embError } = await supabase
          .rpc('match_movies_by_seeds', {
            seed_ids: seedIds,
            exclude_ids: allExcludeIds,
            match_count: 50,
            min_ff_rating: 6.5
          })

        if (embError) {
          console.warn('[getHiddenGemsForUser] Embedding search error:', embError.message)
        } else {
          // Filter to hidden gems only (low popularity)
          embeddingGems = (embeddingMatches || []).filter(m => m.popularity < 40 && m.vote_count >= 30)
          console.log('[getHiddenGemsForUser] Embedding gems found:', embeddingGems.length)
        }
      }

      // Combine and deduplicate
      const allCandidates = [...(classicGems || []), ...(cultGems || []), ...(embeddingGems || [])]

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

      console.log('[getHiddenGemsForUser] Candidate pools:', {
        classicGems: classicGems?.length || 0,
        cultGems: cultGems?.length || 0,
        embeddingGems: embeddingGems?.length || 0,
        totalUnique: candidates.length
      })

      // 5. Filter out watched/excluded
      const eligible = candidates.filter(m => !allExcludeIds.includes(m.id))

      if (eligible.length === 0) {
        return await getHiddenGemsFallback(limit)
      }

      // 6. Score with HIDDEN GEM-SPECIFIC weights
      const scored = eligible.map(movie => {
        const result = scoreMovieForUser(movie, profile, 'hidden_gems', seedFilms)

        // Embedding similarity boost
        let embeddingBoost = 0
        let embeddingReason = null

        if (movie._embeddingSimilarity) {
          const simNormalized = Math.max(0, movie._embeddingSimilarity - 0.5) / 0.4
          embeddingBoost = Math.round(simNormalized * 60)
          embeddingReason = {
            seedTitle: movie._matchedSeedTitle,
            seedId: movie._matchedSeedId,
            similarity: movie._embeddingSimilarity
          }
        }

        // HIDDEN GEM-SPECIFIC: Reward obscurity + quality combo
        let gemBoost = 0

        // Obscurity bonus (lower popularity = more hidden)
        if (movie.popularity < 10) gemBoost += 25
        else if (movie.popularity < 20) gemBoost += 18
        else if (movie.popularity < 30) gemBoost += 10

        // Cult status bonus
        if (movie.cult_status_score >= 70) gemBoost += 20
        else if (movie.cult_status_score >= 50) gemBoost += 12

        // Quality floor bonus (hidden gems should be good)
        if (movie.ff_rating >= 7.5) gemBoost += 15
        else if (movie.ff_rating >= 7.0) gemBoost += 8

        // Update pick reason
        let pickReason = result.pickReason
        if (embeddingReason && embeddingBoost >= 25) {
          pickReason = {
            label: `Hidden gem • Similar to ${embeddingReason.seedTitle}`,
            type: 'gem_embedding',
            seedTitle: embeddingReason.seedTitle,
            similarity: embeddingReason.similarity
          }
        } else if (movie.cult_status_score >= 60) {
          pickReason = { label: 'Cult classic', type: 'gem_cult' }
        } else if (movie.popularity < 15 && movie.ff_rating >= 7.0) {
          pickReason = { label: 'Under-the-radar gem', type: 'gem_obscure' }
        } else {
          pickReason = { label: 'Hidden gem', type: 'gem_quality' }
        }

        return {
          movie,
          ...result,
          score: result.score + embeddingBoost + gemBoost,
          embeddingBoost,
          gemBoost,
          embeddingReason,
          pickReason
        }
      })

      // 7. Sort by score
      scored.sort((a, b) => b.score - a.score)

      // 8. Apply diversity filter
      const diverse = applyRowDiversityFilter(scored, limit)

      console.log(
        '[getHiddenGemsForUser] Final selection:',
        diverse.slice(0, 5).map(d => ({
          title: d.movie.title,
          score: d.score,
          gemBoost: d.gemBoost,
          embeddingBoost: d.embeddingBoost,
          popularity: d.movie.popularity,
          ff_rating: d.movie.ff_rating,
          cult_status: d.movie.cult_status_score
        }))
      )

      // 9. Log impressions (async, don't await)
      logRowImpressions(userId, diverse, 'hidden_gems').catch(err =>
        console.warn('[getHiddenGemsForUser] Failed to log impressions:', err.message)
      )

      // 10. Return formatted results (no manual cache set; getOrFetch handles it)
      return diverse.map(item => ({
        ...item.movie,
        _score: item.score,
        _pickReason: item.pickReason,
        _embeddingSimilarity: item.embeddingReason?.similarity || null
      }))
    } catch (error) {
      console.error('[getHiddenGemsForUser] Error:', error)
      return await getHiddenGemsFallback(limit)
    }
  })
}



/**
 * Fallback for hidden gems when no user or error
 */
async function getHiddenGemsFallback(limit = 20) {
  const { data } = await supabase
    .from('movies')
    .select(`
      id, tmdb_id, title, overview, tagline,
      original_language, runtime, release_year, release_date,
      poster_path, backdrop_path, trailer_youtube_key,
      ff_rating, ff_confidence, quality_score, vote_average,
      pacing_score, intensity_score, emotional_depth_score,
      dialogue_density, attention_demand, vfx_level_score,
      cult_status_score, popularity, vote_count, revenue,
      director_name, lead_actor_name,
      genres, keywords, primary_genre
    `)
    .eq('is_valid', true)
    .not('poster_path', 'is', null)
    .gte('ff_rating', 7.0)
    .lt('popularity', 30)
    .gte('vote_count', 50)
    .order('ff_rating', { ascending: false })
    .limit(limit)

  return (data || []).map(movie => ({
    ...movie,
    _score: movie.ff_rating * 10,
    _pickReason: { label: 'Hidden gem', type: 'fallback_gem' }
  }))
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

// ============================================================================
// SLOW & CONTEMPLATIVE ROW
// ============================================================================

/**
 * Get slow & contemplative films personalized for user
 * Criteria: Low pacing + High emotional depth + User taste
 *
 * NOW WITH: CACHING, DEDUPLICATION (getOrFetch)
 *
 * @param {string} userId - User UUID
 * @param {Object} options - Optional overrides
 * @returns {Promise<Object[]>} Array of scored movies
 */
export async function getSlowContemplative(userId, options = {}) {
  const { limit = 20, excludeIds = [], forceRefresh = false } = options

  // Stabilize excludeIds so [1,2] and [2,1] share the same cache key
  const stableExcludeIds = Array.isArray(excludeIds) ? [...excludeIds].sort((a, b) => a - b) : []

  const cacheKey = recommendationCache.key('slow_contemplative', userId || 'guest', {
    limit,
    excludeIds: stableExcludeIds
  })

  if (forceRefresh) {
    recommendationCache.invalidate(cacheKey)
  }

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      if (!userId) {
        console.log('[getSlowContemplative] No userId, returning fallback')
        return await getSlowContemplativeFallback(limit)
      }

      // 1. Compute user profile
      const profile = await computeUserProfile(userId)

      console.log('[getSlowContemplative] User profile:', {
        avgPacing: profile.contentProfile.avgPacing,
        avgDepth: profile.contentProfile.avgDepth
      })

      // 2. Get seed films for embedding search
      const seedFilms = await getSeedFilms(userId, profile)
      const seedIds = seedFilms.map(s => s.id).filter(Boolean)

      // 3. Get user's watched movie IDs
      const { data: watchedData } = await supabase
        .from('user_history')
        .select('movie_id')
        .eq('user_id', userId)

      const watchedIds = watchedData?.map(w => w.movie_id) || []
      const allExcludeIds = [...new Set([...watchedIds, ...stableExcludeIds])]

      // 4. Fetch candidates - SLOW & CONTEMPLATIVE CRITERIA
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

      // Pool 1: Classic slow contemplative (low pacing, high depth)
      const { data: slowDeep } = await supabase
        .from('movies')
        .select(selectFields)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
        .lt('pacing_score', 45)
        .gt('emotional_depth_score', 65)
        .gte('ff_rating', 7.5)
        .order('emotional_depth_score', { ascending: false })
        .limit(100)

      // Pool 2: High attention demand (requires focus = contemplative)
      const { data: highAttention } = await supabase
        .from('movies')
        .select(selectFields)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
        .gte('attention_demand', 70)
        .lt('pacing_score', 50)
        .gte('ff_rating', 7.5)
        .order('attention_demand', { ascending: false })
        .limit(50)

      // Pool 3: Embedding neighbors filtered to slow/contemplative
      let embeddingNeighbors = []
      if (seedIds.length > 0) {
        const { data: embeddingMatches, error: embError } = await supabase.rpc('match_movies_by_seeds', {
          seed_ids: seedIds,
          exclude_ids: allExcludeIds,
          match_count: 50,
          min_ff_rating: 6.0
        })

        if (embError) {
          console.warn('[getSlowContemplative] Embedding search error:', embError.message)
        } else {
          embeddingNeighbors = (embeddingMatches || []).filter(
            m => m.pacing_score < 50 && m.emotional_depth_score > 60
          )
          console.log('[getSlowContemplative] Embedding neighbors (filtered):', embeddingNeighbors.length)
        }
      }

      // Combine and deduplicate
      const allCandidates = [...(slowDeep || []), ...(highAttention || []), ...(embeddingNeighbors || [])]

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

      console.log('[getSlowContemplative] Candidate pools:', {
        slowDeep: slowDeep?.length || 0,
        highAttention: highAttention?.length || 0,
        embeddingNeighbors: embeddingNeighbors?.length || 0,
        totalUnique: candidates.length
      })

      // 5. Filter out watched/excluded
      const eligible = candidates.filter(m => !allExcludeIds.includes(m.id))

      if (eligible.length === 0) {
        return await getSlowContemplativeFallback(limit)
      }

      // 6. Score with MOOD-SPECIFIC weights
      const scored = eligible.map(movie => {
        const result = scoreMovieForUser(movie, profile, 'slow_contemplative', seedFilms)

        // Embedding similarity boost
        let embeddingBoost = 0
        let embeddingReason = null

        if (movie._embeddingSimilarity) {
          const simNormalized = Math.max(0, movie._embeddingSimilarity - 0.5) / 0.4
          embeddingBoost = Math.round(simNormalized * 50)
          embeddingReason = {
            seedTitle: movie._matchedSeedTitle,
            seedId: movie._matchedSeedId,
            similarity: movie._embeddingSimilarity
          }
        }

        // MOOD-SPECIFIC: Reward slow pacing + emotional depth
        let moodBoost = 0

        if (movie.pacing_score <= 30) moodBoost += 25
        else if (movie.pacing_score <= 40) moodBoost += 15
        else if (movie.pacing_score <= 50) moodBoost += 5

        if (movie.emotional_depth_score >= 80) moodBoost += 25
        else if (movie.emotional_depth_score >= 70) moodBoost += 15
        else if (movie.emotional_depth_score >= 60) moodBoost += 8

        if (movie.attention_demand >= 75) moodBoost += 10
        if (movie.dialogue_density >= 70) moodBoost += 8

        // Update pick reason
        let pickReason = result.pickReason
        if (embeddingReason && embeddingBoost >= 20) {
          pickReason = {
            label: `Contemplative • Similar to ${embeddingReason.seedTitle}`,
            type: 'mood_embedding',
            seedTitle: embeddingReason.seedTitle,
            similarity: embeddingReason.similarity
          }
        } else if (movie.emotional_depth_score >= 80) {
          pickReason = { label: 'Deeply moving', type: 'mood_deep' }
        } else if (movie.pacing_score <= 30) {
          pickReason = { label: 'Slow burn', type: 'mood_slow' }
        } else if (movie.attention_demand >= 75) {
          pickReason = { label: 'Thought-provoking', type: 'mood_thoughtful' }
        } else {
          pickReason = { label: 'Contemplative cinema', type: 'mood_contemplative' }
        }

        return {
          movie,
          ...result,
          score: result.score + embeddingBoost + moodBoost,
          embeddingBoost,
          moodBoost,
          embeddingReason,
          pickReason
        }
      })

      // 7. Sort by score
      scored.sort((a, b) => b.score - a.score)

      // 8. Apply diversity filter
      const diverse = applyRowDiversityFilter(scored, limit)

      console.log(
        '[getSlowContemplative] Final selection:',
        diverse.slice(0, 5).map(d => ({
          title: d.movie.title,
          score: d.score,
          moodBoost: d.moodBoost,
          embeddingBoost: d.embeddingBoost,
          pacing: d.movie.pacing_score,
          depth: d.movie.emotional_depth_score
        }))
      )

      // 9. Log impressions (async, don't await)
      logRowImpressions(userId, diverse, 'slow_contemplative').catch(err =>
        console.warn('[getSlowContemplative] Failed to log impressions:', err.message)
      )

      // 10. Return formatted results (no manual cache set; getOrFetch handles it)
      return diverse.map(item => ({
        ...item.movie,
        _score: item.score,
        _pickReason: item.pickReason,
        _embeddingSimilarity: item.embeddingReason?.similarity || null
      }))
    } catch (error) {
      console.error('[getSlowContemplative] Error:', error)
      return await getSlowContemplativeFallback(limit)
    }
  })
}



/**
 * Fallback for slow contemplative when no user or error
 */
async function getSlowContemplativeFallback(limit = 20) {
  const { data } = await supabase
    .from('movies')
    .select(`
      id, tmdb_id, title, overview, tagline,
      original_language, runtime, release_year, release_date,
      poster_path, backdrop_path, trailer_youtube_key,
      ff_rating, ff_confidence, quality_score, vote_average,
      pacing_score, intensity_score, emotional_depth_score,
      dialogue_density, attention_demand, vfx_level_score,
      cult_status_score, popularity, vote_count, revenue,
      director_name, lead_actor_name,
      genres, keywords, primary_genre
    `)
    .eq('is_valid', true)
    .not('poster_path', 'is', null)
    .lt('pacing_score', 45)
    .gt('emotional_depth_score', 65)
    .gte('ff_rating', 7.5)
    .order('emotional_depth_score', { ascending: false })
    .limit(limit)

  return (data || []).map(movie => ({
    ...movie,
    _score: movie.emotional_depth_score,
    _pickReason: { label: 'Contemplative cinema', type: 'fallback_mood' }
  }))
}

// ============================================================================
// QUICK WATCHES ROW
// ============================================================================

/**
 * Get quick watches (under 90 min) personalized for user
 * Criteria: Short runtime + Quality + User taste
 *
 * NOW WITH: CACHING, DEDUPLICATION (getOrFetch)
 *
 * @param {string} userId - User UUID
 * @param {Object} options - Optional overrides
 * @returns {Promise<Object[]>} Array of scored movies
 */
export async function getQuickWatches(userId, options = {}) {
  const { limit = 20, excludeIds = [], forceRefresh = false } = options

  // Stabilize excludeIds so [1,2] and [2,1] share the same cache key
  const stableExcludeIds = Array.isArray(excludeIds) ? [...excludeIds].sort((a, b) => a - b) : []

  const cacheKey = recommendationCache.key('quick_watches', userId || 'guest', {
    limit,
    excludeIds: stableExcludeIds
  })

  if (forceRefresh) {
    recommendationCache.invalidate(cacheKey)
  }

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      if (!userId) {
        console.log('[getQuickWatches] No userId, returning fallback')
        return await getQuickWatchesFallback(limit)
      }

      // 1. Compute user profile
      const profile = await computeUserProfile(userId)

      console.log('[getQuickWatches] User profile:', {
        preferredGenres: profile.genres.preferred,
        avgRuntime: profile.practicalPreferences?.avgRuntime
      })

      // 2. Get seed films for embedding search
      const seedFilms = await getSeedFilms(userId, profile)
      const seedIds = seedFilms.map(s => s.id).filter(Boolean)

      // 3. Get user's watched movie IDs
      const { data: watchedData } = await supabase
        .from('user_history')
        .select('movie_id')
        .eq('user_id', userId)

      const watchedIds = watchedData?.map(w => w.movie_id) || []
      const allExcludeIds = [...new Set([...watchedIds, ...stableExcludeIds])]

      // 4. Fetch candidates - SHORT RUNTIME CRITERIA
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

      // Pool 1: Quality short films (under 90 min)
      const { data: shortQuality } = await supabase
        .from('movies')
        .select(selectFields)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
        .not('runtime', 'is', null)
        .lt('runtime', 90)
        .gte('ff_rating', 7.5)
        .order('ff_rating', { ascending: false })
        .limit(100)

      // Pool 2: Very short films (under 75 min) with lower rating threshold
      const { data: veryShort } = await supabase
        .from('movies')
        .select(selectFields)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
        .not('runtime', 'is', null)
        .lt('runtime', 75)
        .gte('ff_rating', 6.0)
        .order('ff_rating', { ascending: false })
        .limit(50)

      // Pool 3: Embedding neighbors filtered to short runtime
      let embeddingNeighbors = []
      if (seedIds.length > 0) {
        const { data: embeddingMatches, error: embError } = await supabase.rpc('match_movies_by_seeds', {
          seed_ids: seedIds,
          exclude_ids: allExcludeIds,
          match_count: 50,
          min_ff_rating: 6.0
        })

        if (embError) {
          console.warn('[getQuickWatches] Embedding search error:', embError.message)
        } else {
          // Filter to short runtime only
          embeddingNeighbors = (embeddingMatches || []).filter(m => m.runtime && m.runtime < 90)
          console.log('[getQuickWatches] Embedding neighbors (filtered):', embeddingNeighbors.length)
        }
      }

      // Combine and deduplicate
      const allCandidates = [...(shortQuality || []), ...(veryShort || []), ...(embeddingNeighbors || [])]

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

      console.log('[getQuickWatches] Candidate pools:', {
        shortQuality: shortQuality?.length || 0,
        veryShort: veryShort?.length || 0,
        embeddingNeighbors: embeddingNeighbors?.length || 0,
        totalUnique: candidates.length
      })

      // 5. Filter out watched/excluded
      const eligible = candidates.filter(m => !allExcludeIds.includes(m.id))

      if (eligible.length === 0) {
        return await getQuickWatchesFallback(limit)
      }

      // 6. Score with RUNTIME-SPECIFIC weights
      const scored = eligible.map(movie => {
        const result = scoreMovieForUser(movie, profile, 'quick_watches', seedFilms)

        // Embedding similarity boost
        let embeddingBoost = 0
        let embeddingReason = null

        if (movie._embeddingSimilarity) {
          const simNormalized = Math.max(0, movie._embeddingSimilarity - 0.5) / 0.4
          embeddingBoost = Math.round(simNormalized * 50)
          embeddingReason = {
            seedTitle: movie._matchedSeedTitle,
            seedId: movie._matchedSeedId,
            similarity: movie._embeddingSimilarity
          }
        }

        // RUNTIME-SPECIFIC: Reward shorter films
        let runtimeBoost = 0
        const runtime = movie.runtime || 90

        if (runtime <= 60) runtimeBoost += 25
        else if (runtime <= 75) runtimeBoost += 18
        else if (runtime <= 85) runtimeBoost += 10
        else if (runtime < 90) runtimeBoost += 5

        // Quality bonus (short doesn't mean bad)
        if (movie.ff_rating >= 7.5) runtimeBoost += 15
        else if (movie.ff_rating >= 7.0) runtimeBoost += 8

        // Format runtime for display
        const hours = Math.floor(runtime / 60)
        const mins = runtime % 60
        const runtimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

        // Update pick reason
        let pickReason = result.pickReason
        if (embeddingReason && embeddingBoost >= 20) {
          pickReason = {
            label: `${runtimeStr} • Similar to ${embeddingReason.seedTitle}`,
            type: 'quick_embedding',
            seedTitle: embeddingReason.seedTitle,
            similarity: embeddingReason.similarity
          }
        } else if (runtime <= 60) {
          pickReason = { label: `Just ${runtimeStr}`, type: 'quick_very_short' }
        } else if (movie.ff_rating >= 7.5) {
          pickReason = { label: `${runtimeStr} • Highly rated`, type: 'quick_quality' }
        } else {
          pickReason = { label: `${runtimeStr}`, type: 'quick_watch' }
        }

        return {
          movie,
          ...result,
          score: result.score + embeddingBoost + runtimeBoost,
          embeddingBoost,
          runtimeBoost,
          embeddingReason,
          pickReason
        }
      })

      // 7. Sort by score
      scored.sort((a, b) => b.score - a.score)

      // 8. Apply diversity filter
      const diverse = applyRowDiversityFilter(scored, limit)

      console.log('[getQuickWatches] Final selection:', diverse.slice(0, 5).map(d => ({
        title: d.movie.title,
        score: d.score,
        runtimeBoost: d.runtimeBoost,
        embeddingBoost: d.embeddingBoost,
        runtime: d.movie.runtime,
        ff_rating: d.movie.ff_rating
      })))

      // 9. Log impressions
      logRowImpressions(userId, diverse, 'quick_watches').catch(err =>
        console.warn('[getQuickWatches] Failed to log impressions:', err.message)
      )

      // 10. Return formatted results (no manual cache set; getOrFetch handles it)
      return diverse.map(item => ({
        ...item.movie,
        _score: item.score,
        _pickReason: item.pickReason,
        _embeddingSimilarity: item.embeddingReason?.similarity || null
      }))
    } catch (error) {
      console.error('[getQuickWatches] Error:', error)
      return await getQuickWatchesFallback(limit)
    }
  })
}




/**
 * Fallback for quick watches when no user or error
 */
async function getQuickWatchesFallback(limit = 20) {
  const { data } = await supabase
    .from('movies')
    .select(`
      id, tmdb_id, title, overview, tagline,
      original_language, runtime, release_year, release_date,
      poster_path, backdrop_path, trailer_youtube_key,
      ff_rating, ff_confidence, quality_score, vote_average,
      pacing_score, intensity_score, emotional_depth_score,
      dialogue_density, attention_demand, vfx_level_score,
      cult_status_score, popularity, vote_count, revenue,
      director_name, lead_actor_name,
      genres, keywords, primary_genre
    `)
    .eq('is_valid', true)
    .not('poster_path', 'is', null)
    .not('runtime', 'is', null)
    .lt('runtime', 90)
    .gte('ff_rating', 7.5)
    .order('ff_rating', { ascending: false })
    .limit(limit)

  return (data || []).map(movie => ({
    ...movie,
    _score: movie.ff_rating * 10,
    _pickReason: { label: `${movie.runtime}m`, type: 'fallback_quick' }
  }))
}
