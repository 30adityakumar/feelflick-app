// src/shared/services/recommendations.js
/**
 * FeelFlick Recommendation Engine v2.7
 *
 * NEW in v2.7:
 * ✅ ff_final_rating >= 7.2 absolute floor added to hero candidate pool alongside genre-norm
 *    gate — prevents genre-norm-exceptional but objectively mediocre films from reaching hero.
 * ✅ Seed count raised 5 → 8 (recent window 3→4, total 5→8) for richer embedding neighbors.
 * ✅ 48-hour skip hard exclusion: movies skipped via hero are excluded for 48h (DB-persisted,
 *    survives navigation). Exceptional films (ff_final_rating >= 8.5) allowed through at -15pts.
 * ✅ 7-day skip de-rating: films skipped 48h–7d ago score -40 pts (exceptional: -15 pts).
 *    Only high-quality films resurface; mediocre ones stay buried until 7 days clears.
 * ✅ Base quality capped at 72 for hero (was uncapped, up to 90+). Taste signals now have
 *    room to differentiate — hero is "best film for you" not "best film you haven't seen."
 * ✅ Session genre penalty: skipping a movie penalises all same-genre candidates -10 pts
 *    per genre for the current session ("not in the mood for X tonight"). Resets on nav.
 * ✅ Permanent skip learning: movies skipped 3+ times historically get a permanent -30.
 *    Heavy repeated skippers signal a permanent mismatch, not a mood issue.
 *
 * NEW in v2.6:
 * ✅ HeroTopPick refinement — more confident, smarter pool, better diversity.
 *   - Candidate pool: year widened 2023→2019, genre-norm threshold raised 7.5→8.0,
 *     vote_count floor raised 150→500 for hero (universally-vouched films only).
 *   - Recency bonus: smoother 6-tier decay (max +15, down from +20) so 2022 masterpieces
 *     aren't penalised vs. mediocre 2024 films.
 *   - Quality bonus: more differentiated ff_final_rating steps (+25/+18/+10/+4) + audience
 *     size bonus (vote_count ≥10k: +8, ≥5k: +4).
 *   - Confidence bonus added to hero scoring: confidence-100 films get +12; <70 get −10.
 *   - Weighted random: #1 wins 65% of the time (up from 40%) — much more decisive.
 *   - Language guard: STRICT threshold lowered 85%→80% (more users get 2-language STRONG);
 *     STRONG mode now allows top 3 languages instead of top 2.
 *   - STRICT mode: injects 1 discovery slot (non-primary language, ≥8.5 norm, ≥1000 votes)
 *     at position 10 if none already present — prevents permanent language bubbles.
 *
 * NEW in v2.5:
 * ✅ ff_final_rating: all DB queries now filter/order by ff_final_rating (community-blended).
 *    ff_final_rating = ff_rating * (1 - communityWeight) + ff_community_rating * communityWeight
 *    community weight grows 0→20% as user ratings accumulate (0→500 votes).
 *    Falls back to ff_rating when no community votes exist.
 * ✅ scoreMovieForUser: effectiveRating = ff_final_rating ?? ff_rating as base quality signal.
 * ✅ All _score, quality-label, and scoring-boost checks use ff_final_rating.
 * ✅ Hidden gems quality floor still uses ff_rating (external critic signal is correct there).
 *
 * NEW in v2.4:
 * ✅ Feedback loop closed: user_movie_feedback (thumbs up/down) now feeds into profile
 *   - +1 feedback amplifies genre/director/actor affinity
 *   - -1 feedback creates suppressions stronger than a skip
 * ✅ Sentiment loop closed: user_movie_sentiment (loved/liked/disliked/hated) now feeds into profile
 *   - ‘loved’/’liked’ movies amplify genre/director/actor signals
 *   - ‘disliked’/’hated’ movies create strong suppressions
 *   - ‘what_stood_out’ tags (cinematography, acting, etc.) tracked as content style preferences
 * ✅ Skip signal time-decay: old skips no longer permanently suppress genres/directors
 *   - Skip from >180 days ago: 20% strength; >90 days: 50%; >30 days: 75%; <30 days: 100%
 * ✅ Ratings-amplified profile: explicit user ratings now boost/reduce all affinity signals
 *   - 5-star: 2× weight on genre/director/actor/content signals
 *   - 4-star: 1.5× weight; 3-star: 0.6×; 1-2 star: 0.3×
 * ✅ computePeopleAffinities: weighted count (not raw count) — completion + ratings flow through
 * ✅ computeQualityProfile: actually uses userRatings (was silently ignored in v2.3 — bug fixed)
 *
 * CARRIED FROM v2.3:
 * ✅ Language mismatch fix (hero language derived from actual user_history)
 * ✅ Watched-on-Hero fix (excludes by both internal id and tmdb_id)
 * ✅ Removes “likely seen” penalty
 * ✅ Embedding-aware seed similarity
 * ✅ Profile cache safety
 */

import { supabase } from '@/shared/lib/supabase/client'
import * as tmdb from '@/shared/api/tmdb' // kept for compatibility; not required in this file
import { recommendationCache } from '@/shared/lib/cache'

// ============================================================================
// VERSION
// ============================================================================
const ENGINE_VERSION = '2.15' // Parallelize hero, tier-from-profile, new homepage rows.
const PROFILE_MEMORY_TTL_MS = 60 * 1000
const SEED_MEMORY_TTL_MS = 60 * 1000
const profileMemoryCache = new Map()
const profileInflight = new Map()
const seedMemoryCache = new Map()
const seedInflight = new Map()

function getTimedCache(map, key) {
  const entry = map.get(key)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    map.delete(key)
    return null
  }
  return entry.value
}

function setTimedCache(map, key, value, ttlMs) {
  map.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  })
}

// ============================================================================
// HELPERS
// ============================================================================

export function normalizeNumericIdArray(arr = []) {
  return Array.from(
    new Set(
      (arr || [])
        .filter((v) => v !== null && v !== undefined && v !== '')
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n))
    )
  ).sort((a, b) => a - b)
}

export function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

export function safeLower(s) {
  return typeof s === 'string' ? s.toLowerCase() : ''
}

/**
 * Whole-token or token-level prefix matching.
 * Catches "time travel" vs "time traveler" without false positives
 * like "new york" matching "new orleans". Prefix requires >= 4 chars.
 */
function tokensMatch(a, b) {
  if (a === b) return true
  const aTokens = a.split(/\s+/).filter(Boolean)
  const bTokens = b.split(/\s+/).filter(Boolean)
  return aTokens.some(at => bTokens.some(bt => at === bt || (at.length >= 4 && bt.startsWith(at)) || (bt.length >= 4 && at.startsWith(bt))))
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
  hidden_gems: 0,
  trending: 0,
  because_you_watched: 0,
  world_cinema: 0,
  visual_spectacles: 0,
  default: 0
}

const THRESHOLDS = {
  MIN_FF_RATING: 6.5,
  MIN_FF_CONFIDENCE: 50,
  MIN_FILMS_FOR_LANGUAGE_PREF: 3,
  MIN_FILMS_FOR_AFFINITY: 2,
  // Minimum TMDB vote count for main recommendation pools.
  // Filters concert films, TV specials and data-sparse titles that
  // score artificially high on small/partisan audiences.
  // Hidden gems pool uses its own lower floor (50) since it intentionally
  // seeks obscure but well-rated films.
  MIN_VOTE_COUNT: 150,
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

const GENRE_ID_TO_NAME = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
}

// ============================================================================
// PROFILE COMPUTATION (with cache safety)
// ============================================================================

export async function computeUserProfile(userId, forceRefresh = false) {
  if (!userId) return buildEmptyProfile(null, null)

  const cacheKey = userId
  if (forceRefresh) {
    profileMemoryCache.delete(cacheKey)
    profileInflight.delete(cacheKey)
  } else {
    const memoized = getTimedCache(profileMemoryCache, cacheKey)
    if (memoized) return memoized
    if (profileInflight.has(cacheKey)) return profileInflight.get(cacheKey)
  }

  const profilePromise = (async () => {
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
          const result = { ...fixed, _cached: true, _seedFilms: cached.seed_films }
          setTimedCache(profileMemoryCache, cacheKey, result, PROFILE_MEMORY_TTL_MS)
          return result
        }
      }
    }

    const [
      { data: watchHistory },
      { data: userPrefs },
      { data: userRatings },
      { data: skipFeedback },
      { data: userFeedback },
      { data: userSentiment }
    ] = await Promise.all([
      supabase
        .from('user_history')
        .select(
          `
        movie_id, source, watched_at, watch_duration_minutes,
        movies!inner (
          id, tmdb_id, original_language, runtime, release_year,
          pacing_score, intensity_score, emotional_depth_score,
          pacing_score_100, intensity_score_100, emotional_depth_score_100,
          dialogue_density, attention_demand, vfx_level_score,
          ff_rating, director_name, lead_actor_name, genres, keywords,
          fit_profile, mood_tags, tone_tags
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
        .limit(50),

      // ✅ v2.4: thumbs up/down feedback with movie metadata for genre/director signals
      supabase
        .from('user_movie_feedback')
        .select(`
          movie_id, feedback_value,
          movies!inner ( id, genres, director_name, lead_actor_name )
        `)
        .eq('user_id', userId)
        .neq('feedback_value', 0)
        .limit(100),

      // ✅ v2.4: post-watch sentiment with movie metadata
      supabase
        .from('user_movie_sentiment')
        .select(`
          movie_id, sentiment, what_stood_out,
          movies!inner ( id, genres, director_name, lead_actor_name )
        `)
        .eq('user_id', userId)
        .in('sentiment', ['loved', 'liked', 'disliked', 'hated'])
        .limit(100)
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

    // ✅ v2.4: build rating lookup for amplification
    const ratedMovieMap = new Map((userRatings || []).map((r) => [r.movie_id, r.rating]))

    const now = new Date()
    regularHistory.forEach((h) => {
      if (!h.movies) return
      const daysSince = (now - new Date(h.watched_at)) / (1000 * 60 * 60 * 24)

      let weight = 1.0
      if (daysSince <= 30) weight = 1.3
      else if (daysSince <= 90) weight = 1.15

      // Films discovered via carousel rows carry weaker taste signal —
      // the engine chose them, not the user. Without an explicit rating,
      // treat them as half the signal of a direct watch.
      if (h.source === 'hidden_gems' || h.source === 'because_you_loved' ||
          h.source === 'trending' || h.source === 'mood') {
        weight *= 0.5
      }

      if (h.watch_duration_minutes && h.movies.runtime) {
        const pct = h.watch_duration_minutes / h.movies.runtime
        if (pct < 0.3) weight *= 0.3
        else if (pct < 0.7) weight *= 0.7
      }

      // ✅ v2.4: explicit ratings are the strongest taste signal — amplify all profile signals
      const userRating = ratedMovieMap.get(h.movies.id)
      if (userRating) {
        if (userRating >= 5) weight *= 2.0       // 5-star: double signal strength
        else if (userRating >= 4) weight *= 1.5  // 4-star: 50% boost
        else if (userRating <= 2) weight *= 0.3  // 1-2 star: strongly reduce
        else if (userRating <= 3) weight *= 0.6  // 3-star: moderate reduce
      }

      weightedMovies.push({ ...h.movies, weight, isOnboarding: false })
    })

    // Single fetch of all watched movie IDs — attached to profile so row generators
    // can reuse it instead of each one making a separate DB call
    const { data: watchedData } = await supabase
      .from('user_history')
      .select('movie_id')
      .eq('user_id', userId)
    const watchedMovieIds = (watchedData || []).map(r => r.movie_id)

    const negativeSignals = computeNegativeSignals(skipFeedback, watchHistory)

    // ✅ language is computed from real watched movies
    // ✅ and EXCLUDES onboarding by default (onboarding can leak English)
    const languages = computeLanguageProfile(weightedMovies, { excludeOnboarding: true })

    const genres = computeGenreProfile(weightedMovies, userPrefs, negativeSignals)
    const contentProfile = computeContentProfile(weightedMovies)
    const preferences = computePracticalPreferences(weightedMovies)
    const affinities = computePeopleAffinities(weightedMovies)
    const themes = computeThemeAffinities(weightedMovies)
    const fitProfileAffinity = computeFitProfileAffinity(weightedMovies, skipFeedback)
    const qualityProfile = computeQualityProfile(weightedMovies, userRatings)

    // ✅ v2.4: feedback signals from thumbs up/down + post-watch sentiment
    const feedbackSignals = computeFeedbackSignals(userFeedback, userSentiment)

    // ✅ v2.10: mood signature from recent watches (mood_tags/tone_tags/fit_profile)
    const moodSignature = computeMoodSignature(weightedMovies)

    // ✅ v2.11: hard genre exclusion gates + dominant fit_profiles for adjacency scoring
    const exclusions = computeExclusions(weightedMovies, genres)
    const topFitProfiles = computeTopFitProfiles(weightedMovies)

    const profile = ensureLanguageProfileShape({
      userId,
      languages,
      genres,
      contentProfile,
      preferences,
      affinities,
      themes,
      fitProfileAffinity,
      qualityProfile,
      negativeSignals,
      feedbackSignals,
      moodSignature,
      exclusions,
      topFitProfiles,
      watchedMovieIds,
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

    setTimedCache(profileMemoryCache, cacheKey, profile, PROFILE_MEMORY_TTL_MS)
    return profile
  } catch (error) {
    console.error('[computeUserProfile] Error:', error)
    return buildEmptyProfile(userId, null)
  }
  })()

  profileInflight.set(cacheKey, profilePromise)
  return profilePromise.finally(() => {
    profileInflight.delete(cacheKey)
  })
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
    fitProfileAffinity: { distribution: {}, preferred: [], topShare: 0, franchiseFatigue: false },
    qualityProfile: { avgFFRating: 7.0, watchesHiddenGems: false, totalMoviesWatched: 0, avgUserRating: null, highRatedCount: 0 },
    moodSignature: { recentMoodTags: [], recentToneTags: [], recentFitProfiles: [] },
    exclusions: { genreIds: new Set(), genreNames: [] },
    topFitProfiles: [],
    negativeSignals: {
      skippedGenres: [],
      skippedDirectors: [],
      skippedLanguages: [],
      skippedActors: [],
      totalSkips: 0
    },
    feedbackSignals: {
      genreBoosts: [],
      genreSuppressions: [],
      directorBoosts: [],
      directorSuppressions: [],
      actorBoosts: [],
      actorSuppressions: [],
      contentStyleBoosts: {}
    },
    watchedMovieIds: [],
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

// ✅ v2.4: skip signals decay over time — old skips no longer permanently suppress
// Decay: >180 days → 20%, >90 days → 50%, >30 days → 75%, <30 days → 100%
// Thresholds unchanged (genres: 3, directors/actors: 2) — fresh skips behave identically
// to v2.3, but a skip from 8 months ago contributes only 0.2 to the weighted sum.
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

  const now = new Date()

  // Group skip events by movie_id; each skip event has its own shown_at + decay
  const skipWeightByMovieId = {}
  skipFeedback.forEach((s) => {
    const shownAt = s.shown_at ? new Date(s.shown_at) : now
    const daysSince = (now - shownAt) / (1000 * 60 * 60 * 24)

    let decayFactor = 1.0
    if (daysSince > 180) decayFactor = 0.2
    else if (daysSince > 90) decayFactor = 0.5
    else if (daysSince > 30) decayFactor = 0.75

    skipWeightByMovieId[s.movie_id] = (skipWeightByMovieId[s.movie_id] || 0) + decayFactor
  })

  const genreSkips = {},
    directorSkips = {},
    langSkips = {},
    actorSkips = {}

  watchHistory.forEach((h) => {
    const skipWeight = skipWeightByMovieId[h.movie_id]
    if (!h.movies || !skipWeight) return

    const movie = h.movies
    if (Array.isArray(movie.genres)) {
      movie.genres.forEach((genre) => {
        const gid = extractGenreId(genre)
        if (gid) genreSkips[gid] = (genreSkips[gid] || 0) + skipWeight
      })
    }
    if (movie.director_name) {
      const name = movie.director_name.toLowerCase()
      directorSkips[name] = (directorSkips[name] || 0) + skipWeight
    }
    if (movie.original_language) {
      langSkips[movie.original_language] = (langSkips[movie.original_language] || 0) + skipWeight
    }
    if (movie.lead_actor_name) {
      const name = movie.lead_actor_name.toLowerCase()
      actorSkips[name] = (actorSkips[name] || 0) + skipWeight
    }
  })

  return {
    skippedGenres: Object.entries(genreSkips)
      .filter(([_, c]) => c >= 3)
      .map(([gid, score]) => ({ id: Number(gid), skipCount: score }))
      .sort((a, b) => b.skipCount - a.skipCount),
    skippedDirectors: Object.entries(directorSkips)
      .filter(([_, c]) => c >= 2)
      .map(([name, score]) => ({ name, skipCount: score }))
      .sort((a, b) => b.skipCount - a.skipCount),
    skippedLanguages: Object.entries(langSkips)
      .filter(([_, c]) => c >= 3)
      .map(([lang, score]) => ({ language: lang, skipCount: score }))
      .sort((a, b) => b.skipCount - a.skipCount),
    skippedActors: Object.entries(actorSkips)
      .filter(([_, c]) => c >= 2)
      .map(([name, score]) => ({ name, skipCount: score }))
      .sort((a, b) => b.skipCount - a.skipCount),
    totalSkips: skipFeedback.length
  }
}

// ============================================================================
// MOOD SIGNATURE — v2.10
// ============================================================================

// ============================================================================
// DB-LEVEL GENRE EXCLUSION HELPER — v2.11
// ============================================================================

/**
 * Apply genre exclusion filters directly on a Supabase query builder.
 * Uses `.not('genres', 'cs', '["GenreName"]')` for each excluded genre.
 * The `genres` column is jsonb (JSON array of strings) in the DB.
 *
 * @param {Object} query - Supabase query builder (chainable)
 * @param {Object|null} profile - user profile with exclusions
 * @returns {Object} the (possibly modified) query builder
 */
export function applyDbGenreExclusions(query, profile) {
  const names = profile?.exclusions?.genreNames
  if (!names || names.length === 0) return query
  for (const name of names) {
    query = query.not('genres', 'cs', JSON.stringify([name]))
  }
  return query
}

// ============================================================================
// FIT PROFILE ADJACENCY — v2.11
// ============================================================================

// Adjacent profiles share audience intent; clashing profiles are opposite poles.
// Used in both hero scoring and homepage row scoring.
export const FIT_ADJACENCY = {
  crowd_pleaser:    { adjacent: ['comfort_rewatch', 'date_night', 'franchise_entry'], clashing: ['challenging_art', 'arthouse'] },
  comfort_rewatch:  { adjacent: ['crowd_pleaser', 'date_night'], clashing: ['challenging_art'] },
  date_night:       { adjacent: ['crowd_pleaser', 'comfort_rewatch'], clashing: ['challenging_art', 'cult_classic'] },
  franchise_entry:  { adjacent: ['crowd_pleaser', 'event_spectacle'], clashing: ['arthouse', 'challenging_art'] },
  event_spectacle:  { adjacent: ['franchise_entry', 'crowd_pleaser'], clashing: ['arthouse', 'challenging_art'] },
  cult_classic:     { adjacent: ['arthouse', 'challenging_art', 'hidden_gem'], clashing: ['crowd_pleaser'] },
  arthouse:         { adjacent: ['challenging_art', 'cult_classic', 'hidden_gem'], clashing: ['crowd_pleaser', 'franchise_entry'] },
  challenging_art:  { adjacent: ['arthouse', 'cult_classic'], clashing: ['crowd_pleaser', 'comfort_rewatch', 'franchise_entry'] },
  hidden_gem:       { adjacent: ['cult_classic', 'arthouse'], clashing: ['franchise_entry', 'event_spectacle'] },
  prestige_drama:   { adjacent: ['arthouse', 'challenging_art', 'hidden_gem'], clashing: ['crowd_pleaser', 'franchise_entry', 'comfort_rewatch'] },
  genre_popcorn:    { adjacent: ['crowd_pleaser', 'event_spectacle', 'franchise_entry'], clashing: ['challenging_art', 'arthouse'] },
}

// ============================================================================
// EXCLUSION GATES — v2.11
// ============================================================================

// Genre IDs that require explicit watch evidence before recommendations are shown.
// Without >=MIN_WATCHES watches in the genre, the genre is excluded from all rows.
// `dbName` matches the text value stored in movies.genres (text[] column).
const GATED_GENRES = [
  { id: 16, dbName: 'Animation', minWatches: 2 },
  { id: 10751, dbName: 'Family', minWatches: 2 },
  { id: 99, dbName: 'Documentary', minWatches: 2 },
  { id: 27, dbName: 'Horror', minWatches: 2 },
]

/**
 * Compute hard genre exclusion set based on watch evidence.
 * Genres in GATED_GENRES are excluded unless the user has watched
 * enough films in that genre to demonstrate genuine interest.
 *
 * Returns both numeric IDs (for client-side filtering) and DB names
 * (for Supabase query-level jsonb `.not('genres', 'cs', ...)` filters).
 *
 * @param {Object[]} weightedMovies
 * @param {Object} genreProfile - from computeGenreProfile
 * @returns {{ genreIds: Set<number>, genreNames: string[] }}
 */
function computeExclusions(weightedMovies, genreProfile) {
  // Count actual watches per genre (not weighted — raw count)
  const genreWatchCounts = new Map()
  weightedMovies.forEach(m => {
    const genres = (m.genres || []).map(extractGenreId).filter(Boolean)
    genres.forEach(gid => {
      genreWatchCounts.set(gid, (genreWatchCounts.get(gid) || 0) + 1)
    })
  })

  const excludedIds = new Set()
  const excludedNames = []
  for (const gate of GATED_GENRES) {
    const watchCount = genreWatchCounts.get(gate.id) || 0
    // Also check explicit genre preferences (from onboarding)
    const isExplicitPreference = genreProfile.preferred.includes(gate.id) ||
      genreProfile.explicitPreferences?.includes(gate.id)
    if (watchCount < gate.minWatches && !isExplicitPreference) {
      excludedIds.add(gate.id)
      excludedNames.push(gate.dbName)
    }
  }

  return { genreIds: excludedIds, genreNames: excludedNames }
}

/**
 * Compute dominant fit_profiles for adjacency scoring in row generators.
 * Returns top 3 fit_profiles by weighted count.
 *
 * @param {Object[]} weightedMovies
 * @returns {string[]}
 */
function computeTopFitProfiles(weightedMovies) {
  const counts = new Map()
  weightedMovies.forEach(m => {
    if (!m.fit_profile) return
    counts.set(m.fit_profile, (counts.get(m.fit_profile) || 0) + (m.weight || 1))
  })

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([profile]) => profile)
}

// ============================================================================
// MOOD SIGNATURE — v2.10
// ============================================================================

/**
 * Aggregate mood_tags, tone_tags, and fit_profile from the user's recent watches
 * into a compact signature used by scoreMovieForUser dimension 19 (mood coherence).
 *
 * Recency weight: last 5 watches × 1.0, next 10 × 0.6, next 5 × 0.3.
 * Only considers the 20 most recent non-onboarding watches.
 *
 * @param {Object[]} weightedMovies - Movies with weight, isOnboarding flag
 * @returns {{ recentMoodTags: {tag,weight}[], recentToneTags: {tag,weight}[], recentFitProfiles: {profile,weight}[] }}
 */
function computeMoodSignature(weightedMovies) {
  // Take the 20 most recent non-onboarding movies (they're already sorted by
  // recency from the watchHistory query, with onboarding pushed first into
  // weightedMovies — so filter onboarding and take first 20 of the rest).
  const recent = weightedMovies.filter(m => !m.isOnboarding).slice(0, 20)

  if (recent.length === 0) {
    return { recentMoodTags: [], recentToneTags: [], recentFitProfiles: [] }
  }

  const moodTagWeights = new Map()
  const toneTagWeights = new Map()
  const fitProfileWeights = new Map()

  recent.forEach((movie, idx) => {
    // Recency tiers: first 5 → 1.0, next 10 → 0.6, last 5 → 0.3
    let recencyWeight
    if (idx < 5) recencyWeight = 1.0
    else if (idx < 15) recencyWeight = 0.6
    else recencyWeight = 0.3

    const tags = Array.isArray(movie.mood_tags) ? movie.mood_tags : []
    tags.forEach(tag => {
      moodTagWeights.set(tag, (moodTagWeights.get(tag) || 0) + recencyWeight)
    })

    const tones = Array.isArray(movie.tone_tags) ? movie.tone_tags : []
    tones.forEach(tag => {
      toneTagWeights.set(tag, (toneTagWeights.get(tag) || 0) + recencyWeight)
    })

    if (movie.fit_profile) {
      fitProfileWeights.set(movie.fit_profile, (fitProfileWeights.get(movie.fit_profile) || 0) + recencyWeight)
    }
  })

  const sortDesc = (a, b) => b.weight - a.weight
  const recentMoodTags = [...moodTagWeights.entries()]
    .map(([tag, weight]) => ({ tag, weight: Math.round(weight * 10) / 10 }))
    .sort(sortDesc)
    .slice(0, 8)
  const recentToneTags = [...toneTagWeights.entries()]
    .map(([tag, weight]) => ({ tag, weight: Math.round(weight * 10) / 10 }))
    .sort(sortDesc)
    .slice(0, 5)
  const recentFitProfiles = [...fitProfileWeights.entries()]
    .map(([profile, weight]) => ({ profile, weight: Math.round(weight * 10) / 10 }))
    .sort(sortDesc)
    .slice(0, 3)

  return { recentMoodTags, recentToneTags, recentFitProfiles }
}

// ============================================================================
// FEEDBACK SIGNALS (thumbs up/down + post-watch sentiment) — v2.4
// ============================================================================

// Converts user_movie_feedback and user_movie_sentiment into genre/director/actor
// boost and suppression signals. These are consumed in scoreMovieForUser step 16.
//
// Strength scale:
//   thumbs down (-1)  → 2.5 suppression
//   thumbs up (+1)    → 2.0 boost
//   'liked' sentiment → 2.5 boost
//   'disliked'        → 3.0 suppression
//   'loved'           → 3.5 boost  (strongest positive)
//   'hated'           → 3.5 suppression (strongest negative)
function computeFeedbackSignals(userFeedback, userSentiment) {
  const genreBoosts = {},
    genreSuppressions = {}
  const directorBoosts = {},
    directorSuppressions = {}
  const actorBoosts = {},
    actorSuppressions = {}
  const contentStyleBoosts = {}

  // Process thumbs up/down feedback
  ;(userFeedback || []).forEach(({ feedback_value, movies: movie }) => {
    if (!movie) return
    const isPositive = feedback_value > 0
    const strength = isPositive ? 2.0 : 2.5

    ;(movie.genres || []).forEach((g) => {
      const gid = extractGenreId(g)
      if (!gid) return
      if (isPositive) genreBoosts[gid] = (genreBoosts[gid] || 0) + strength
      else genreSuppressions[gid] = (genreSuppressions[gid] || 0) + strength
    })

    if (movie.director_name) {
      const name = safeLower(movie.director_name)
      if (isPositive) directorBoosts[name] = (directorBoosts[name] || 0) + strength
      else directorSuppressions[name] = (directorSuppressions[name] || 0) + strength
    }

    if (movie.lead_actor_name) {
      const name = safeLower(movie.lead_actor_name)
      if (isPositive) actorBoosts[name] = (actorBoosts[name] || 0) + strength
      else actorSuppressions[name] = (actorSuppressions[name] || 0) + strength
    }
  })

  // Process post-watch sentiment (strongest signal — user invested enough to rate)
  ;(userSentiment || []).forEach(({ sentiment, what_stood_out, movies: movie }) => {
    if (!movie) return
    const isPositive = sentiment === 'loved' || sentiment === 'liked'
    const isNegative = sentiment === 'disliked' || sentiment === 'hated'
    if (!isPositive && !isNegative) return

    const strength =
      sentiment === 'loved' || sentiment === 'hated' ? 3.5 : 2.5 // loved/hated > liked/disliked

    ;(movie.genres || []).forEach((g) => {
      const gid = extractGenreId(g)
      if (!gid) return
      if (isPositive) genreBoosts[gid] = (genreBoosts[gid] || 0) + strength
      else genreSuppressions[gid] = (genreSuppressions[gid] || 0) + strength
    })

    if (movie.director_name) {
      const name = safeLower(movie.director_name)
      if (isPositive) directorBoosts[name] = (directorBoosts[name] || 0) + strength
      else directorSuppressions[name] = (directorSuppressions[name] || 0) + strength
    }

    if (movie.lead_actor_name) {
      const name = safeLower(movie.lead_actor_name)
      if (isPositive) actorBoosts[name] = (actorBoosts[name] || 0) + strength
      else actorSuppressions[name] = (actorSuppressions[name] || 0) + strength
    }

    // what_stood_out: ['cinematography', 'acting', 'story', 'direction', 'score', ...]
    // Tracks content style preferences — used for future content-attribute scoring
    if (isPositive && Array.isArray(what_stood_out)) {
      what_stood_out.forEach((tag) => {
        const normalized = (typeof tag === 'string' ? tag : tag?.name || '').toLowerCase().trim()
        if (normalized) contentStyleBoosts[normalized] = (contentStyleBoosts[normalized] || 0) + 1
      })
    }
  })

  return {
    genreBoosts: Object.entries(genreBoosts)
      .map(([gid, score]) => ({ id: Number(gid), score }))
      .sort((a, b) => b.score - a.score),
    genreSuppressions: Object.entries(genreSuppressions)
      .map(([gid, score]) => ({ id: Number(gid), score }))
      .sort((a, b) => b.score - a.score),
    directorBoosts: Object.entries(directorBoosts)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score),
    directorSuppressions: Object.entries(directorSuppressions)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score),
    actorBoosts: Object.entries(actorBoosts)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score),
    actorSuppressions: Object.entries(actorSuppressions)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score),
    contentStyleBoosts
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

// ✅ v2.4: use weighted count (not raw count) so that completion rate + explicit ratings
// flow through to affinity strength. rawCount still gates the threshold (need 2 actual
// watches) but count (weighted sum) determines the affinity score used in scoring.
function computePeopleAffinities(weightedMovies) {
  const directors = {},
    actors = {}

  weightedMovies.forEach((m) => {
    const w = m.weight || 1

    if (m.director_name) {
      if (!directors[m.director_name])
        directors[m.director_name] = { count: 0, rawCount: 0, fromFavorites: false }
      directors[m.director_name].count += w        // weighted — reflects completion + rating
      directors[m.director_name].rawCount++        // raw — used to gate the ≥2 threshold
      if (m.isOnboarding) directors[m.director_name].fromFavorites = true
    }

    if (m.lead_actor_name) {
      if (!actors[m.lead_actor_name])
        actors[m.lead_actor_name] = { count: 0, rawCount: 0, fromFavorites: false }
      actors[m.lead_actor_name].count += w
      actors[m.lead_actor_name].rawCount++
      if (m.isOnboarding) actors[m.lead_actor_name].fromFavorites = true
    }
  })

  return {
    directors: Object.entries(directors)
      .filter(([_, d]) => d.rawCount >= 2)         // still require 2 actual watches
      .sort((a, b) => b[1].count - a[1].count)     // sort by weighted affinity
      .slice(0, 5)
      .map(([name, data]) => ({ name, count: data.count, rawCount: data.rawCount, fromFavorites: data.fromFavorites })),
    actors: Object.entries(actors)
      .filter(([_, a]) => a.rawCount >= 2)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, data]) => ({ name, count: data.count, rawCount: data.rawCount, fromFavorites: data.fromFavorites }))
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

/**
 * Compute fit_profile distribution from weighted watch history.
 * Powers signal 17 (fit profile match) in scoreMovieForUser.
 * @param {Array} weightedMovies - Movies with weight from watch history
 * @returns {{distribution: Object, preferred: string[], topShare: number, franchiseFatigue: boolean}}
 */
function computeFitProfileAffinity(weightedMovies, skipFeedback = []) {
  const counts = {}
  let totalWeighted = 0

  weightedMovies.forEach(m => {
    if (!m.fit_profile) return
    counts[m.fit_profile] = (counts[m.fit_profile] || 0) + (m.weight || 1)
    totalWeighted += (m.weight || 1)
  })

  const sorted = Object.entries(counts)
    .map(([profile, count]) => ({ profile, count, share: totalWeighted > 0 ? count / totalWeighted : 0 }))
    .sort((a, b) => b.count - a.count)

  // Franchise fatigue: cross-reference skip movie_ids against watched franchise films
  const franchiseMovieIds = new Set(
    weightedMovies.filter(m => m.fit_profile === 'franchise_entry').map(m => m.id)
  )
  const franchiseSkips = (skipFeedback || []).filter(s => franchiseMovieIds.has(s.movie_id)).length
  const franchiseWatched = counts.franchise_entry || 0
  const franchiseFatigue = franchiseWatched >= 3 && franchiseSkips >= 2

  return {
    distribution: counts,
    preferred: sorted.slice(0, 3).map(s => s.profile),
    topShare: sorted[0]?.share || 0,
    franchiseFatigue,
  }
}

// ✅ v2.4: fixed — userRatings parameter was silently ignored in v2.3
function computeQualityProfile(weightedMovies, userRatings) {
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

  // Incorporate explicit user ratings
  const validRatings = (userRatings || []).filter((r) => r.rating > 0)
  const avgUserRating =
    validRatings.length >= 3
      ? Math.round((validRatings.reduce((s, r) => s + r.rating, 0) / validRatings.length) * 10) / 10
      : null
  const highRatedCount = validRatings.filter((r) => r.rating >= 4).length

  return {
    avgFFRating: ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 7.0,
    watchesHiddenGems: hiddenGemCount >= 3,
    totalMoviesWatched: weightedMovies.length,
    avgUserRating,
    highRatedCount
  }
}

// ============================================================================
// SEED FILMS (Because you watched / similar to mapping anchor)
// ============================================================================

async function getSeedFilms(userId, profile) {
  if (!userId) return []

  const cacheKey = userId
  const memoized = getTimedCache(seedMemoryCache, cacheKey)
  if (memoized) return memoized
  if (seedInflight.has(cacheKey)) return seedInflight.get(cacheKey)

  const seedPromise = (async () => {
    try {
    const [{ data: history }, { data: ratings }] = await Promise.all([
      supabase
        .from('user_history')
        .select(
          `
        movie_id, source, watched_at,
        movies!inner (
          id, tmdb_id, title, director_name, lead_actor_name, genres, keywords,
          primary_genre, original_language, release_year,
          pacing_score, intensity_score, emotional_depth_score,
          pacing_score_100, intensity_score_100, emotional_depth_score_100, ff_rating,
          fit_profile
        )
      `
        )
        .eq('user_id', userId)
        .order('watched_at', { ascending: false })
        .limit(100),
      supabase
        .from('user_ratings')
        .select('movie_id, rating')
        .eq('user_id', userId)
        .gte('rating', 4)
        .order('rated_at', { ascending: false })
        .limit(20)
    ])

      if (!history || history.length === 0) {
        setTimedCache(seedMemoryCache, cacheKey, [], SEED_MEMORY_TTL_MS)
        return []
      }

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

    // Up to 4 recent + 4 older = 8 seeds total.
    // More seeds → richer embedding neighbor pool without collapsing signal quality.
    const recentCount = Math.min(4, recentSeeds.length)
    const olderCount = Math.min(8 - recentCount, olderSeeds.length)

    seeds.push(...recentSeeds.slice(0, recentCount).map((c) => c.movie))
    seeds.push(...olderSeeds.slice(0, olderCount).map((c) => c.movie))

    if (seeds.length < 8) {
      const remaining = seedCandidates
        .filter((c) => !seeds.find((s) => s.id === c.movie.id))
        .slice(0, 8 - seeds.length)
        .map((c) => c.movie)
      seeds.push(...remaining)
    }

      setTimedCache(seedMemoryCache, cacheKey, seeds, SEED_MEMORY_TTL_MS)
      return seeds
    } catch (error) {
      console.error('[getSeedFilms] Error:', error)
      return []
    }
  })()

  seedInflight.set(cacheKey, seedPromise)
  return seedPromise.finally(() => {
    seedInflight.delete(cacheKey)
  })
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
 * - If primary >= 80% and distinctCount <= 2: STRICT (strong mono-lingual signal)
 * - If primary >= 60%: STRONG (top 3 langs, down from top 2 — more diverse)
 * - else: LOOSE (score-based, no hard filter)
 *
 * STRICT threshold is 80% (down from 85%) so more users reach STRONG mode.
 * STRONG now allows top 3 languages (up from 2) to reduce language bubbles.
 */
function buildLanguageGuardFromHistory(languageFromHistory) {
  const primary = languageFromHistory.primary
  const dominance = languageFromHistory.primaryDominance || 0
  const sorted = languageFromHistory.distributionSorted || []
  const distinctCount = languageFromHistory.distinctCount || 0

  const top3 = sorted.slice(0, 3).map((s) => s.lang).filter(Boolean)
  const strict = primary && dominance >= 80 && distinctCount <= 2
  const strong = primary && dominance >= 60

  let allowed = []
  if (strict) allowed = [primary]
  else if (strong) allowed = top3.length > 0 ? top3 : primary ? [primary] : []
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
  const { excludeIds = [], excludeTmdbIds = [], forceRefresh = false, penalizedGenreIds = [] } = options

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

      // profile (for scoring) — must complete first, needed by seeds + langGuard
      const profile = ensureLanguageProfileShape(await computeUserProfile(userId))

      // === PARALLEL GROUP 1: seeds, watched rows, hero impressions ===
      // These are independent of each other (all depend only on userId + profile).
      // Merged the two recommendation_impressions queries (7d hero + all-time skips)
      // into a single query to save a round-trip.
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)

      const [seedFilms, { data: watchedRows }, { data: heroImpressionData }] = await Promise.all([
        getSeedFilms(userId, profile),
        supabase
          .from('user_history')
          .select('movie_id, movies!inner(id, tmdb_id, original_language, genres)')
          .eq('user_id', userId),
        // Single merged query: hero impressions from last 7d + ALL skipped hero impressions
        supabase
          .from('recommendation_impressions')
          .select('movie_id, shown_at, skipped, placement')
          .eq('user_id', userId)
          .eq('placement', 'hero')
          .or(`shown_at.gte.${sevenDaysAgo},skipped.eq.true`),
      ])

      const watchedInternalIds = normalizeNumericIdArray((watchedRows || []).map((w) => w.movie_id))
      const watchedTmdbIds = normalizeNumericIdArray((watchedRows || []).map((w) => w.movies?.tmdb_id).filter(Boolean))

      // ✅ never show watched, even if candidates are low
      const allExcludeInternal = normalizeNumericIdArray([...watchedInternalIds, ...stableExcludeIds])
      const allExcludeTmdb = new Set(normalizeNumericIdArray([...watchedTmdbIds, ...stableExcludeTmdbIds]))

      // ✅ language guard derived from ACTUAL watched languages
      const historyLang = deriveLanguageFromWatchedRows(watchedRows || [])
      const langGuard = buildLanguageGuardFromHistory(historyLang)

      // Partition merged impressions into hero cooldown + all-time skip count
      // movie_id → most-recent impression Date (for 48h any-impression block)
      const lastShownAt = new Map()
      // movie_id → most-recent SKIP Date (for 48h hard-skip block + 7d score penalty)
      const skipHistory = new Map()
      const hardSkipIds = new Set() // skipped within 48h
      const allTimeSkipCount = new Map()

      ;(heroImpressionData || []).forEach((r) => {
        if (!r.movie_id) return
        const shownAt = new Date(r.shown_at)
        const isRecent = shownAt >= new Date(sevenDaysAgo)

        // Recent impressions (last 7d): track for cooldown
        if (isRecent) {
          if (!lastShownAt.has(r.movie_id) || shownAt > lastShownAt.get(r.movie_id)) {
            lastShownAt.set(r.movie_id, shownAt)
          }
        }

        // All skips (recent + all-time): track for penalties
        if (r.skipped) {
          allTimeSkipCount.set(r.movie_id, (allTimeSkipCount.get(r.movie_id) || 0) + 1)
          if (isRecent) {
            if (!skipHistory.has(r.movie_id) || shownAt > skipHistory.get(r.movie_id)) {
              skipHistory.set(r.movie_id, shownAt)
            }
            if (shownAt >= fortyEightHoursAgo) hardSkipIds.add(r.movie_id)
          }
        }
      })

      // Tier A: any film shown as hero in last 48h → exclude (prevents same-day repeat)
      // Tier B: any film skipped in last 7 days → exclude via hardSkipIds / skipHistory
      const recentHeroIds = new Set(
        [...lastShownAt.entries()]
          .filter(([, shownAt]) => shownAt >= fortyEightHoursAgo)
          .map(([id]) => id)
      )

      // Permanent skip learning: movies skipped 3+ times ever get a lasting -30 penalty.
      const permanentSkipIds = new Set(
        [...allTimeSkipCount.entries()].filter(([, count]) => count >= 3).map(([id]) => id)
      )

      const selectFields = `
        id, tmdb_id, title, overview, tagline,
        original_language, runtime, release_year, release_date,
        poster_path, backdrop_path, trailer_youtube_key,
        ff_rating, ff_final_rating, ff_community_rating, ff_community_confidence, ff_community_votes,
        ff_critic_rating, ff_critic_confidence, ff_audience_rating, ff_audience_confidence,
        ff_rating_genre_normalized, ff_confidence,
        quality_score, vote_average,
        pacing_score, intensity_score, emotional_depth_score,
        pacing_score_100, intensity_score_100, emotional_depth_score_100,
        dialogue_density, attention_demand, vfx_level_score,
        cult_status_score, popularity, vote_count, revenue,
        director_name, lead_actor_name,
        genres, keywords, primary_genre,
        discovery_potential, accessibility_score,
        polarization_score, starpower_score,
        fit_profile, mood_tags, tone_tags,
        user_satisfaction_score, user_satisfaction_confidence
      `

      // === PARALLEL GROUP 2: embedding neighbors + base pool + classics pool ===
      // Embedding neighbors depend on seedFilms (resolved above).
      // Base pool + classics pool depend only on langGuard (resolved above).
      // embQuery depends on neighborIds, so it runs after this group.

      const isLanguageRestricted = langGuard.mode === 'strict' || langGuard.mode === 'strong'
      const minYear = isLanguageRestricted ? 2010 : 2019
      const baseMinNorm = isLanguageRestricted ? 7.0 : 8.0
      const baseMinConf = isLanguageRestricted ? 40 : 60
      const HERO_MIN_VOTE_COUNT = isLanguageRestricted ? 100 : 500

      // Build base query
      let baseQuery = supabase
        .from('movies')
        .select(selectFields)
        .eq('is_valid', true)
        .not('backdrop_path', 'is', null)
        .not('tmdb_id', 'is', null)
        .gte('ff_rating_genre_normalized', baseMinNorm)
        .gte('ff_audience_rating', 72)
        .gte('ff_confidence', baseMinConf)
        .gte('vote_count', HERO_MIN_VOTE_COUNT)
        .gte('release_date', `${minYear}-01-01`)
        .order('ff_rating_genre_normalized', { ascending: false })
        .limit(400)

      if (langGuard.mode === 'strict' && langGuard.allowedLanguages.length === 1) {
        baseQuery = baseQuery.eq('original_language', langGuard.allowedLanguages[0])
      } else if (langGuard.mode === 'strong' && langGuard.allowedLanguages.length > 0) {
        baseQuery = baseQuery.in('original_language', langGuard.allowedLanguages)
      }

      // DB-level genre exclusion (Animation, Family, etc. unless user watches them)
      baseQuery = applyDbGenreExclusions(baseQuery, profile)

      const isColdStart = (profile.qualityProfile?.totalMoviesWatched || 0) === 0
      if (isColdStart && profile.genres.preferred.length > 0) {
        const onboardingGenreNames = profile.genres.preferred
          .map(id => GENRE_ID_TO_NAME[id])
          .filter(Boolean)
        if (onboardingGenreNames.length > 0) {
          baseQuery = baseQuery.in('primary_genre', onboardingGenreNames)
        }
      }

      // Build classics query
      let classicsQuery = supabase
        .from('movies')
        .select(selectFields)
        .eq('is_valid', true)
        .not('backdrop_path', 'is', null)
        .not('tmdb_id', 'is', null)
        .gte('ff_rating_genre_normalized', 9.0)
        .gte('ff_audience_rating', 78)
        .gte('ff_confidence', baseMinConf)
        .gte('vote_count', 25000)
        .order('ff_rating_genre_normalized', { ascending: false })
        .limit(100)

      if (langGuard.mode === 'strict' && langGuard.allowedLanguages.length === 1) {
        classicsQuery = classicsQuery.eq('original_language', langGuard.allowedLanguages[0])
      } else if (langGuard.mode === 'strong' && langGuard.allowedLanguages.length > 0) {
        classicsQuery = classicsQuery.in('original_language', langGuard.allowedLanguages)
      }
      classicsQuery = applyDbGenreExclusions(classicsQuery, profile)

      // Fire neighbors + base + classics in parallel
      const [
        { neighborIds, bestByNeighborId },
        { data: baseCandidatesRaw },
        { data: classicsCandidates },
      ] = await Promise.all([
        fetchEmbeddingNeighborsForSeeds(seedFilms, { limitPerSeed: 80 }),
        baseQuery,
        classicsQuery,
      ])
      let baseCandidates = baseCandidatesRaw || []

      // Fetch embedding candidates (depends on neighborIds from above)
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
          .gte('vote_count', HERO_MIN_VOTE_COUNT)
          .limit(300)

        if (langGuard.mode === 'strict' && langGuard.allowedLanguages.length === 1) {
          embQuery = embQuery.eq('original_language', langGuard.allowedLanguages[0])
        } else if (langGuard.mode === 'strong' && langGuard.allowedLanguages.length > 0) {
          embQuery = embQuery.in('original_language', langGuard.allowedLanguages)
        }
        embQuery = applyDbGenreExclusions(embQuery, profile)

        const { data } = await embQuery
        embeddingCandidates = data || []
      }

      // Combine pools (dedupe by id) — embedding first (nearest neighbours), then
      // recency pool, then classics so deduplication keeps the earliest entry per id.
      const byId = new Map()
      ;[...embeddingCandidates, ...baseCandidates, ...(classicsCandidates || [])].forEach((m) => {
        if (m?.id) byId.set(m.id, m)
      })
      let candidates = Array.from(byId.values())

      // Genre gating — client-side fallback for embedding candidates that bypass DB exclusion
      const excludedGenreIds = profile.exclusions?.genreIds || new Set()
      candidates = candidates.filter((m) => {
        if (excludedGenreIds.size === 0) return true
        const genres = (m.genres || []).map(extractGenreId).filter(Boolean)
        if (genres.length === 0) return true
        return !genres.some(gid => excludedGenreIds.has(gid))
      })

      // Exclusion gating (INTERNAL + TMDB + recentHero + 48h skip)
      candidates = candidates.filter((m) => {
        if (!m || !m.id || !m.tmdb_id) return false
        if (allExcludeInternal.includes(m.id)) return false
        if (allExcludeTmdb.has(m.tmdb_id)) return false
        if (recentHeroIds.has(m.id)) return false
        // 48h skip: hard-exclude unless the film is genuinely exceptional (ff_final_rating >= 8.5)
        // Exceptional films are allowed through but will be penalised in heroBonus scoring.
        if (hardSkipIds.has(m.id)) {
          const ffRating = Number(m.ff_audience_rating != null ? m.ff_audience_rating / 10 : m.ff_final_rating || m.ff_rating || 0)
          if (ffRating < 8.5) return false
        }
        return true
      })

      // Fit-profile hard gate — only keep films whose fit_profile is in user's
      // top profiles or adjacent. Skip gate on cold start (no topFitProfiles).
      const heroTopFit = profile.topFitProfiles || []
      const heroAllowedFits = new Set(heroTopFit)
      if (heroTopFit.length > 0) {
        for (const fp of heroTopFit) {
          for (const adj of (FIT_ADJACENCY[fp]?.adjacent || [])) {
            heroAllowedFits.add(adj)
          }
        }
        candidates = candidates.filter(m =>
          !m.fit_profile || heroAllowedFits.has(m.fit_profile),
        )
      }

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
        relaxQuery = applyDbGenreExclusions(relaxQuery, profile)

        const { data: relaxed } = await relaxQuery
        const relaxedCandidates = (relaxed || [])
          .filter((m) => {
            if (!m?.id || !m.tmdb_id) return false
            if (allExcludeInternal.includes(m.id)) return false
            if (allExcludeTmdb.has(m.tmdb_id)) return false
            if (recentHeroIds.has(m.id)) return false
            if (hardSkipIds.has(m.id) && Number(m.ff_audience_rating != null ? m.ff_audience_rating / 10 : m.ff_final_rating || m.ff_rating || 0) < 8.5) return false
            return true
          })

        // merge
        relaxedCandidates.forEach((m) => {
          if (m?.id && !byId.has(m.id)) byId.set(m.id, m)
        })
        candidates = Array.from(byId.values()).filter((m) => {
          if (excludedGenreIds.size > 0) {
            const genres = (m.genres || []).map(extractGenreId).filter(Boolean)
            if (genres.length > 0 && genres.some(gid => excludedGenreIds.has(gid))) return false
          }
          // Fit-profile gate on merged candidates (matches pre-relax gate)
          if (heroTopFit.length > 0 && m.fit_profile && !heroAllowedFits.has(m.fit_profile)) return false
          if (allExcludeInternal.includes(m.id)) return false
          if (allExcludeTmdb.has(m.tmdb_id)) return false
          if (recentHeroIds.has(m.id)) return false
          return true
        })
      }

      if (candidates.length === 0) return await getFallbackPick(langGuard, allExcludeInternal, allExcludeTmdb)

      // Score (embedding-aware)
      const currentYear = new Date().getFullYear()
      const scored = candidates.map((movie) => {
        const result = scoreMovieForUser(movie, profile, 'hero', seedFilms, {
          seedEmbeddingBestByMovieId: bestByNeighborId
        })

        // hero freshness bonus — smoother 6-tier decay (max +15, was +20)
        let heroBonus = 0
        const age = currentYear - (movie.release_year || currentYear)
        if (age === 0) heroBonus += 15
        else if (age === 1) heroBonus += 10
        else if (age === 2) heroBonus += 6
        else if (age === 3) heroBonus += 3
        else if (age <= 5) heroBonus += 1

        // quality bonus — differentiated ff_final_rating steps + audience size
        const ffRating = Number(movie.ff_audience_rating != null ? movie.ff_audience_rating / 10 : movie.ff_final_rating || movie.ff_rating || 0)
        if (ffRating >= 9.0) heroBonus += 25
        else if (ffRating >= 8.5) heroBonus += 18
        else if (ffRating >= 8.0) heroBonus += 10
        else if (ffRating >= 7.5) heroBonus += 4

        const voteCount = Number(movie.vote_count || 0)
        if (voteCount >= 10000) heroBonus += 8
        else if (voteCount >= 5000) heroBonus += 4

        // confidence bonus — prefer well-evidenced films for hero slot
        const heroConf = Number(movie.ff_confidence || 0)
        if (heroConf === 100) heroBonus += 12
        else if (heroConf >= 85) heroBonus += 6
        else if (heroConf < 70) heroBonus -= 10

        // skip de-rating — penalise films the user has recently skipped.
        // 48h hard-excluded films only reach here if ff_final_rating >= 8.5 (exceptional).
        // 48h–7d: soft penalty — exceptional films -15, everything else -40.
        if (skipHistory.has(movie.id)) {
          const hoursSinceSkip = (Date.now() - skipHistory.get(movie.id).getTime()) / (1000 * 60 * 60)
          const isExceptional = ffRating >= 8.5
          if (hoursSinceSkip < 48) {
            // Passed the gate only because it's exceptional — apply heavy penalty so it
            // only wins if nothing else in the pool is competitive.
            heroBonus -= 35
          } else {
            // 48h–7d: proportionally de-rate. Exceptional films can still resurface;
            // mediocre ones will almost never beat fresh candidates at -40.
            heroBonus -= isExceptional ? 15 : 40
          }
        }

        // permanent skip penalty — skipped 3+ times ever means a lasting mismatch
        if (permanentSkipIds.has(movie.id)) heroBonus -= 30

        // session genre penalty — "not in the mood for X tonight"
        // -10 per genre the user has already skipped in this session
        if (penalizedGenreIds.length > 0) {
          const movieGenreIds = (movie.genres || []).map(extractGenreId).filter(Boolean)
          const overlap = movieGenreIds.filter((g) => penalizedGenreIds.includes(g)).length
          if (overlap > 0) heroBonus -= overlap * 10
        }

        // fit_profile adjacency — reward aligned profiles, penalize clashing ones
        const topFit = profile.topFitProfiles || []
        const dominantFit = topFit[0] || null
        if (movie.fit_profile && dominantFit) {
          const adj = FIT_ADJACENCY[dominantFit]
          if (movie.fit_profile === dominantFit || topFit.includes(movie.fit_profile)) {
            heroBonus += 10
          } else if (adj?.adjacent?.includes(movie.fit_profile)) {
            heroBonus += 5
          } else if (adj?.clashing?.includes(movie.fit_profile)) {
            heroBonus -= 15
          }
        }

        const normalizedRating = Number(movie.ff_rating_genre_normalized || movie.ff_rating || 0)
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
      if (qualityCandidates.length === 0) return await getFallbackPick(langGuard, allExcludeInternal, allExcludeTmdb)

      // Personal match floor — hero is the signature pick, must be a strong match
      const HERO_MIN_SCORE = 70
      const matchCandidates = qualityCandidates.filter((c) => c.finalScore >= HERO_MIN_SCORE)
      if (matchCandidates.length === 0) return await getFallbackPick(langGuard, allExcludeInternal, allExcludeTmdb)

      // Taste threshold (confidence-based)
      const minTasteScore = profile.meta.confidence === 'high' ? 60 : profile.meta.confidence === 'medium' ? 45 : 30
      let finalCandidates = matchCandidates.filter((c) => {
        const tasteScore = c.finalScore - (c.breakdown.baseQuality || 0)
        return tasteScore >= minTasteScore
      })
      if (finalCandidates.length === 0) finalCandidates = matchCandidates.slice(0, 30)

      // Sort & diversity
      finalCandidates.sort((a, b) => b.finalScore - a.finalScore)
      const top30 = finalCandidates.slice(0, 30)
      const diverseTop10 = applyDiversityFilter(top30, seedFilms, 10)

      if (diverseTop10.length === 0) return await getFallbackPick(langGuard, allExcludeInternal, allExcludeTmdb)

      // STRICT mode: inject 1 discovery slot from a non-primary language.
      // Prevents permanent language bubbles by ensuring at least one world-cinema
      // pick (≥8.5 norm, ≥80 conf, ≥1000 votes) always appears at position 10.
      if (langGuard.mode === 'strict' && langGuard.primary && diverseTop10.length >= 5) {
        const hasDiscovery = diverseTop10.some((c) => c.movie.original_language !== langGuard.primary)
        if (!hasDiscovery) {
          let discoveryQuery = supabase
            .from('movies')
            .select(selectFields)
            .eq('is_valid', true)
            .not('backdrop_path', 'is', null)
            .neq('original_language', langGuard.primary)
            .gte('ff_rating_genre_normalized', 8.5)
            .gte('ff_confidence', 80)
            .gte('vote_count', 1000)
            .order('ff_rating_genre_normalized', { ascending: false })
            .limit(20)
          discoveryQuery = applyDbGenreExclusions(discoveryQuery, profile)
          const { data: discoveryPool } = await discoveryQuery
          const excludeSet = new Set([...allExcludeInternal, ...diverseTop10.map((c) => c.movie.id)])
          const discCandidate = (discoveryPool || []).find(
            (m) => m?.id && !excludeSet.has(m.id) && !allExcludeTmdb.has(m.tmdb_id) && !recentHeroIds.has(m.id)
              && !(hardSkipIds.has(m.id) && Number(m.ff_audience_rating != null ? m.ff_audience_rating / 10 : m.ff_final_rating || m.ff_rating || 0) < 8.5)
          )
          if (discCandidate) {
            const discResult = scoreMovieForUser(discCandidate, profile, 'hero', seedFilms, {
              seedEmbeddingBestByMovieId: bestByNeighborId
            })
            const discAge = currentYear - (discCandidate.release_year || currentYear)
            let discBonus = 0
            if (discAge === 0) discBonus += 15
            else if (discAge === 1) discBonus += 10
            else if (discAge === 2) discBonus += 6
            else if (discAge === 3) discBonus += 3
            else if (discAge <= 5) discBonus += 1
            const discRating = Number(discCandidate.ff_audience_rating != null ? discCandidate.ff_audience_rating / 10 : discCandidate.ff_final_rating || discCandidate.ff_rating || 0)
            if (discRating >= 9.0) discBonus += 25
            else if (discRating >= 8.5) discBonus += 18
            else if (discRating >= 8.0) discBonus += 10
            else if (discRating >= 7.5) discBonus += 4
            if (Number(discCandidate.vote_count || 0) >= 10000) discBonus += 8
            else if (Number(discCandidate.vote_count || 0) >= 5000) discBonus += 4
            const discConf = Number(discCandidate.ff_confidence || 0)
            if (discConf === 100) discBonus += 12
            else if (discConf >= 85) discBonus += 6
            else if (discConf < 70) discBonus -= 10
            const discNorm = Number(discCandidate.ff_rating_genre_normalized || 0)
            const discEntry = {
              movie: discCandidate,
              ...discResult,
              heroBonus: discBonus,
              finalScore: discResult.score + discBonus,
              normalizedRating: discNorm,
              breakdown: { ...discResult.breakdown, heroBonus: discBonus, normalizedRating: discNorm, discovery: true }
            }
            if (diverseTop10.length >= 10) diverseTop10[9] = discEntry
            else diverseTop10.push(discEntry)
          }
        }
      }

      // Weighted random — #1 wins 65% of the time (was 40%); decisive but not robotic
      const weights = [0.65, 0.20, 0.08, 0.04, 0.02, 0.01, 0.005, 0.002, 0.002, 0.001]
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

  // 1) BASE QUALITY (normalized when available, ff_audience_rating as fallback)
  const effectiveRating = movie.ff_audience_rating != null
    ? movie.ff_audience_rating / 10
    : (movie.ff_final_rating ?? movie.ff_rating ?? 7.0)
  const normalizedRating = Number(movie.ff_rating_genre_normalized || effectiveRating || 7.0)
  // Cap hero base quality at 72 so taste signals meaningfully differentiate picks.
  // Without cap: a norm-9.0 film gets 90 base pts and taste signals barely matter.
  // With cap: any film above ~7.2 norm competes on taste, not just objective quality.
  const baseQualityRaw = normalizedRating * 10
  score += (breakdown.baseQuality = rowType === 'hero' ? Math.min(baseQualityRaw, 72) : baseQualityRaw)
  breakdown.audienceRating  = movie.ff_audience_rating   // 0-100 primary signal
  breakdown.originalRating  = movie.ff_rating             // DEPRECATED — kept for debugging
  breakdown.finalRating     = movie.ff_final_rating       // DEPRECATED — kept for debugging

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

  // 16) EXPLICIT FEEDBACK (thumbs up/down + post-watch sentiment) — v2.4
  // Applied last so it can override or reinforce all other signals cleanly.
  score += (breakdown.feedbackSignals = scoreFeedbackSignals(movie, profile))

  // 17) FIT PROFILE MATCH — v2.6
  if (movie.fit_profile && profile.fitProfileAffinity?.preferred?.length > 0) {
    const fp = profile.fitProfileAffinity
    if (fp.preferred.includes(movie.fit_profile)) {
      score += (breakdown.fitProfile = 12)
    } else if (movie.fit_profile === 'franchise_entry' && fp.franchiseFatigue) {
      score += (breakdown.fitProfile = -25)
    } else if (movie.fit_profile === 'challenging_art' && fp.distribution?.challenging_art === undefined && fp.topShare >= 0.5 && !fp.preferred.includes('arthouse')) {
      score += (breakdown.fitProfile = -8)
    } else {
      breakdown.fitProfile = 0
    }
  } else {
    breakdown.fitProfile = 0
  }

  // 18) USER SATISFACTION (from aggregated feedback loop) — v2.7
  if (movie.user_satisfaction_score != null && (movie.user_satisfaction_confidence ?? 0) >= 60) {
    const s = movie.user_satisfaction_score
    if (s >= 75) score += (breakdown.userSatisfaction = 15)
    else if (s >= 60) score += (breakdown.userSatisfaction = 6)
    else if (s <= 30) score += (breakdown.userSatisfaction = -20)
    else if (s <= 45) score += (breakdown.userSatisfaction = -8)
    else breakdown.userSatisfaction = 0
  } else {
    breakdown.userSatisfaction = 0
  }

  // 19) MOOD COHERENCE — rewards films whose mood/tone tags align with user's recent watches — v2.10
  if (profile.moodSignature?.recentMoodTags?.length > 0) {
    const movieMoodTags = Array.isArray(movie.mood_tags) ? movie.mood_tags : []
    const movieToneTags = Array.isArray(movie.tone_tags) ? movie.tone_tags : []

    let moodScore = 0
    const userTopTags = new Map(profile.moodSignature.recentMoodTags.map(t => [t.tag, t.weight]))
    movieMoodTags.forEach(t => {
      if (userTopTags.has(t)) moodScore += userTopTags.get(t) * 2
    })

    const userTopTones = new Map(profile.moodSignature.recentToneTags.map(t => [t.tag, t.weight]))
    movieToneTags.forEach(t => {
      if (userTopTones.has(t)) moodScore += userTopTones.get(t) * 1
    })

    breakdown.moodCoherence = Math.min(20, Math.round(moodScore))
    score += breakdown.moodCoherence
  } else {
    breakdown.moodCoherence = 0
  }

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
    if (movieKeywords.some(kw => tokensMatch(kw, theme))) matches++
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

// ============================================================================
// FEEDBACK SCORING — v2.4
// ============================================================================
// Scores a candidate movie against the user's explicit feedback signals.
// Genre suppressions are weighted slightly heavier than boosts (asymmetric aversion).
//
// Boost caps:   genre +30, director +40, actor +20
// Suppress caps: genre -50, director -60, actor -40
function scoreFeedbackSignals(movie, profile) {
  const fs = profile.feedbackSignals
  if (!fs) return 0

  let score = 0
  const movieGenres = (movie.genres || []).map((g) => extractGenreId(g)).filter(Boolean)
  const directorLower = safeLower(movie.director_name || '')
  const actorLower = safeLower(movie.lead_actor_name || '')

  // Genre boosts — multiply by 4 per unit of boost score
  if (fs.genreBoosts?.length > 0) {
    let boost = 0
    fs.genreBoosts.forEach(({ id, score: s }) => {
      if (movieGenres.includes(id)) boost += s * 4
    })
    score += Math.min(boost, 30)
  }

  // Genre suppressions — multiply by 5 per unit (slightly heavier than boost)
  if (fs.genreSuppressions?.length > 0) {
    let suppress = 0
    fs.genreSuppressions.forEach(({ id, score: s }) => {
      if (movieGenres.includes(id)) suppress += s * 5
    })
    score -= Math.min(suppress, 50)
  }

  // Director boost
  if (directorLower && fs.directorBoosts?.length > 0) {
    const match = fs.directorBoosts.find((d) => safeLower(d.name) === directorLower)
    if (match) score += Math.min(match.score * 8, 40)
  }

  // Director suppression
  if (directorLower && fs.directorSuppressions?.length > 0) {
    const match = fs.directorSuppressions.find((d) => safeLower(d.name) === directorLower)
    if (match) score -= Math.min(match.score * 10, 60)
  }

  // Actor boost
  if (actorLower && fs.actorBoosts?.length > 0) {
    const match = fs.actorBoosts.find((a) => safeLower(a.name) === actorLower)
    if (match) score += Math.min(match.score * 5, 20)
  }

  // Actor suppression
  if (actorLower && fs.actorSuppressions?.length > 0) {
    const match = fs.actorSuppressions.find((a) => safeLower(a.name) === actorLower)
    if (match) score -= Math.min(match.score * 6, 40)
  }

  return score
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
        if (tokensMatch(mk, sk)) {
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
  const embSim = seedSimilarity.embeddingSim || 0

  // Strong embedding/seed similarity wins — requires actual embedding confirmation
  if (embSim >= 0.75 && seedSimilarity.bestSeed) {
    return {
      label: `Because you watched ${seedSimilarity.bestSeed.title}`,
      type: 'seed_embedding',
      seedTitle: seedSimilarity.bestSeed.title
    }
  }

  // Metadata similarity — only trust if embedding also confirms (>= 0.70)
  if ((seedSimilarity.rawScore || 0) >= 60 && embSim >= 0.70 && seedSimilarity.bestSeed) {
    return {
      label: `Because you watched ${seedSimilarity.bestSeed.title}`,
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

  // "Similar to X" — require embedding verification (>= 0.70).
  // WHY: metadata-only similarity (shared genres/keywords) produces false positives
  // (e.g. Shrek → Arrival). Drop caption entirely if embedding doesn't confirm.
  if ((seedSimilarity.rawScore || 0) >= 35 && embSim >= 0.70 && seedSimilarity.bestSeed) {
    return { label: `Similar to ${seedSimilarity.bestSeed.title}`, type: 'seed_similar', seedTitle: seedSimilarity.bestSeed.title }
  }

  if ((breakdown.language || 0) >= 20 && (breakdown.genre || 0) >= 15) return { label: 'Built for your taste', type: 'perfect_match' }
  if ((breakdown.genre || 0) >= 20) return { label: 'Matches your taste', type: 'genre_match' }
  if (Number(movie.discovery_potential || 0) >= 60) return { label: 'Hidden gem', type: 'hidden_gem' }
  if (Number(movie.quality_score || 0) >= 85 || Number(movie.ff_audience_rating ?? (movie.ff_final_rating ?? movie.ff_rating ?? 0) * 10) >= 75) return { label: 'Critically acclaimed', type: 'quality' }
  if (movie.release_year === new Date().getFullYear()) return { label: 'New this year', type: 'recency' }
  if ((breakdown.content || 0) >= 35) return { label: 'Fits your style', type: 'content_match' }

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

async function getFallbackPick(langGuard, excludeInternalIds = [], excludeTmdbIds = new Set()) {
  const primaryLang = langGuard?.primary || null

  const notWatched = (m) =>
    m?.id && m?.tmdb_id &&
    !excludeInternalIds.includes(m.id) &&
    !excludeTmdbIds.has(m.tmdb_id)

  try {
    // Tier 1: same-language fallback — strongly preferred when user has a language history.
    // Looser quality bar (ff_final_rating >= 6.5, vote_count >= 50) because the language
    // pool is small; better a good Hindi film than a great English animated short.
    if (primaryLang && primaryLang !== 'en') {
      const { data: langFallback } = await supabase
        .from('movies')
        .select('*')
        .eq('is_valid', true)
        .eq('original_language', primaryLang)
        .not('backdrop_path', 'is', null)
        .not('tmdb_id', 'is', null)
        .gte('ff_audience_rating', 65)
        .gte('vote_count', 50)
        .order('ff_audience_rating', { ascending: false })
        .limit(60)

      const eligible = (langFallback || []).filter(notWatched)
      if (eligible.length >= 1) {
        const pick = eligible[Math.floor(Math.random() * Math.min(eligible.length, 10))]
        return {
          movie: pick,
          pickReason: { label: 'Top pick for you', type: 'quality' },
          score: Number(pick.ff_audience_rating ?? (pick.ff_final_rating ?? pick.ff_rating ?? 0) * 10),
          debug: { fallback: true, fallbackType: 'language-aware', lang: primaryLang }
        }
      }
    }

    // Tier 2: global fallback — no language restriction. Last resort.
    const { data: fallback } = await supabase
      .from('movies')
      .select('*')
      .eq('is_valid', true)
      .not('backdrop_path', 'is', null)
      .not('tmdb_id', 'is', null)
      .gte('ff_audience_rating', 80)
      .gte('vote_count', THRESHOLDS.MIN_VOTE_COUNT)
      .gte('release_date', '2020-01-01')
      .order('ff_audience_rating', { ascending: false })
      .limit(40)

    const globalEligible = (fallback || []).filter(notWatched)
    if (globalEligible.length > 0) {
      const pick = globalEligible[Math.floor(Math.random() * Math.min(globalEligible.length, 10))]
      return {
        movie: pick,
        pickReason: { label: 'Critically acclaimed', type: 'quality' },
        score: Number(pick.ff_audience_rating ?? (pick.ff_final_rating ?? pick.ff_rating ?? 0) * 10),
        debug: { fallback: true, fallbackType: 'global' }
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

// Test-only exports for internal scoring helpers.
export const RECOMMENDATION_TEST_HELPERS = {
  computeNegativeSignals,
  scoreEraMatch,
  scoreRecency,
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
      algorithm_version: ENGINE_VERSION
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

      // 3. Get user's watched movie IDs (from profile — single fetch)
      const watchedIds = profile.watchedMovieIds || []
      const allExcludeIds = [...new Set([...watchedIds, ...stableExcludeIds])]

      // 4. Fetch candidates from preferred genres
      const selectFields = `
        id, tmdb_id, title, overview, tagline,
        original_language, runtime, release_year, release_date,
        poster_path, backdrop_path, trailer_youtube_key,
        ff_rating, ff_final_rating, ff_community_rating, ff_community_confidence, ff_community_votes,
        ff_critic_rating, ff_critic_confidence, ff_audience_rating, ff_audience_confidence,
        ff_rating_genre_normalized, ff_confidence, quality_score, vote_average,
        pacing_score, intensity_score, emotional_depth_score,
        pacing_score_100, intensity_score_100, emotional_depth_score_100,
        dialogue_density, attention_demand, vfx_level_score,
        cult_status_score, popularity, vote_count, revenue,
        director_name, lead_actor_name,
        genres, keywords, primary_genre,
        fit_profile, mood_tags, tone_tags,
        user_satisfaction_score, user_satisfaction_confidence
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
          .gte('ff_audience_rating', 60)
          .gte('vote_count', THRESHOLDS.MIN_VOTE_COUNT)
          .order('ff_audience_rating', { ascending: false })
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
            min_ff_rating: 60
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
      ff_rating, ff_final_rating, ff_confidence, quality_score, vote_average,
      ff_critic_rating, ff_critic_confidence, ff_audience_rating, ff_audience_confidence,
      ff_community_rating, ff_community_confidence, ff_community_votes,
      pacing_score, intensity_score, emotional_depth_score,
      pacing_score_100, intensity_score_100, emotional_depth_score_100,
      dialogue_density, attention_demand, vfx_level_score,
      cult_status_score, popularity, vote_count, revenue,
      director_name, lead_actor_name,
      genres, keywords, primary_genre,
      fit_profile, mood_tags, tone_tags,
      user_satisfaction_score, user_satisfaction_confidence
    `)
    .eq('is_valid', true)
    .not('poster_path', 'is', null)
    .gte('ff_rating_genre_normalized', 7.5)
    .gte('vote_count', THRESHOLDS.MIN_VOTE_COUNT)
    .order('ff_rating_genre_normalized', { ascending: false })
    .limit(limit)

  return (data || []).map(movie => ({
    ...movie,
    _score: Number(movie.ff_audience_rating ?? (movie.ff_final_rating ?? movie.ff_rating ?? 0) * 10),
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

// ============================================================================
// DISCOVER MOOD ENGINE — scoring pipeline
// ============================================================================

// Module-level cache for mood genre weights (session-scoped, cleared on module reload)
const moodWeightsCache = new Map()

/**
 * Load genre weights and tag sets for a given discover mood ID from the DB.
 * Uses a module-level Map so the DB is hit at most once per mood per tab session.
 * @param {number} moodId
 * @returns {Promise<{weights: Array<{genre_id: number, weight: number}>, preferred_tags: string[], avoided_tags: string[], preferred_tones: string[]}>}
 */
async function loadMoodData(moodId) {
  if (moodWeightsCache.has(moodId)) return moodWeightsCache.get(moodId)

  // Fetch genre weights and tag sets in parallel
  const [weightsResult, moodResult] = await Promise.all([
    supabase
      .from('discover_mood_genre_weights')
      .select('genre_id, weight, pacing_min, pacing_max, intensity_min, intensity_max')
      .eq('mood_id', moodId),
    supabase
      .from('discover_moods')
      .select('preferred_tags, avoided_tags, preferred_tones')
      .eq('id', moodId)
      .single(),
  ])

  const weights = weightsResult.data || []
  const moodRow = moodResult.data || {}

  const moodData = {
    weights,
    preferred_tags: moodRow.preferred_tags || [],
    avoided_tags: moodRow.avoided_tags || [],
    preferred_tones: moodRow.preferred_tones || [],
  }

  moodWeightsCache.set(moodId, moodData)
  return moodData
}

// Mood IDs — KEEP IN SYNC WITH src/app/pages/discover/DiscoverPage.jsx MOODS array.
// 1 Cozy  2 Adventurous  3 Heartbroken  4 Curious  5 Nostalgic  6 Energized
// 7 Anxious  8 Romantic  9 Inspired  10 Silly  11 Dark  12 Overwhelmed

/**
 * Per-mood bonuses for each viewing context (viewingContextId → moodId → points).
 * Context IDs: 1=Solo, 2=Partner, 3=Friends, 4=Family, 5=Group
 */
const CONTEXT_MODIFIERS = {
  1: { 1: 8, 2: 5, 3: 15, 4: 12, 5: 10, 6: 5, 7: 12, 8: 5, 9: 10, 10: 5, 11: 15, 12: 10 },  // Solo
  2: { 1: 10, 2: 5, 3: 12, 4: 8, 5: 10, 6: 5, 7: 5, 8: 15, 9: 8, 10: 10, 11: 5, 12: 8 },    // Partner
  3: { 1: 5, 2: 12, 3: 5, 4: 5, 5: 8, 6: 12, 7: 5, 8: 5, 9: 8, 10: 15, 11: 8, 12: 5 },      // Friends
  4: { 1: 15, 2: 8, 3: 5, 4: 5, 5: 12, 6: 8, 7: -5, 8: 5, 9: 10, 10: 12, 11: -10, 12: 10 },  // Family
  5: { 1: 8, 2: 15, 3: 5, 4: 5, 5: 8, 6: 15, 7: 5, 8: 5, 9: 8, 10: 15, 11: 5, 12: 5 },      // Group
}

/**
 * Per-experience-type bonus functions (experienceTypeId → (movie) => points).
 * Experience IDs: 1=Discover, 2=Rewatch, 3=Nostalgia, 4=Learn, 5=Challenge
 */
const EXPERIENCE_MODIFIERS = {
  1: (movie) => (Number(movie.discovery_potential || 0) >= 60 ? 15 : 0),
  2: (movie) => (Number(movie.ff_audience_rating != null ? movie.ff_audience_rating / 10 : movie.ff_final_rating || movie.ff_rating || 0) >= 8.0 ? 10 : 0),
  3: (movie) => ((movie.release_year || 9999) < 2000 ? 15 : 0),
  4: (movie) => {
    const genres = (movie.genres || []).map(extractGenreId)
    return genres.includes(99) || genres.includes(36) ? 15 : 0
  },
  5: (movie) => (
    Number(movie.attention_demand || 0) >= 70 || Number(movie.emotional_depth_score || 0) >= 70 ? 10 : 0
  ),
}

/**
 * Small time-of-day bonus for contextually matched mood/time pairs.
 * @param {number} moodId
 * @param {string} timeOfDay - 'morning' | 'afternoon' | 'evening' | 'night'
 * @returns {number}
 */
function getTimeOfDayBonus(moodId, timeOfDay) {
  const pairs = {
    morning: [1, 9, 10],     // Cozy, Inspired, Silly
    afternoon: [2, 4, 6],    // Adventurous, Curious, Energized
    evening: [3, 5, 8, 12],  // Heartbroken, Nostalgic, Romantic, Overwhelmed
    night: [7, 11],          // Anxious, Dark
  }
  return (pairs[timeOfDay] || []).includes(moodId) ? 5 : 0
}

/**
 * Score how well a movie matches the current mood session parameters.
 * Primary signal: mood_tags / tone_tags intersection with discover_moods tag sets.
 * Returns a score 0–100, additive on top of the user profile score.
 *
 * Merge mood-defined tags with user-parsed free-text tags (deduped union).
 * @param {string[]|undefined} baseTags
 * @param {string[]|undefined} userTags
 * @returns {string[]}
 */
function mergeTags(baseTags, userTags) {
  const base = Array.isArray(baseTags) ? baseTags : []
  const user = Array.isArray(userTags) ? userTags : []
  if (user.length === 0) return base
  return [...new Set([...base, ...user])]
}

/**
 * @param {Object} movie - Internal movies table row (must include mood_tags, tone_tags)
 * @param {number} moodId - Discover mood ID (1–12)
 * @param {{weights: Array, preferred_tags: string[], avoided_tags: string[], preferred_tones: string[]}} moodData
 * @param {{intensity: number, pacing: number, viewingContext: number, experienceType: number, timeOfDay: string, parsedTags?: Object}} params
 * @returns {number}
 */
export function scoreMoodAffinity(movie, moodId, moodData, params) {
  const { viewingContext, experienceType, timeOfDay, parsedTags } = params
  let score = 0

  // Merge mood-defined tags with user-parsed free-text tags (user tags take priority via union)
  const preferredMoodTags = mergeTags(moodData.preferred_tags, parsedTags?.preferredMoodTags)
  const preferredToneTags = mergeTags(moodData.preferred_tones, parsedTags?.preferredToneTags)
  const avoidedMoodTags   = mergeTags(moodData.avoided_tags, parsedTags?.avoidedMoodTags)

  // 1. TAG INTERSECTION — PRIMARY SIGNAL (max +55)
  const movieMoodTags = Array.isArray(movie.mood_tags) ? movie.mood_tags : []
  const movieToneTags = Array.isArray(movie.tone_tags) ? movie.tone_tags : []
  if (preferredMoodTags.length > 0 && movieMoodTags.length > 0) {
    const matches = movieMoodTags.filter(t => preferredMoodTags.includes(t)).length
    score += Math.min(matches * 15, 45)
  }
  if (preferredToneTags.length > 0 && movieToneTags.length > 0) {
    const toneMatches = movieToneTags.filter(t => preferredToneTags.includes(t)).length
    score += Math.min(toneMatches * 5, 10)
  }

  // 2. AVOIDED TAG PENALTY — strong signal
  if (avoidedMoodTags.length > 0 && movieMoodTags.length > 0) {
    const avoidedMatches = movieMoodTags.filter(t => avoidedMoodTags.includes(t)).length
    score -= avoidedMatches * 20
  }

  // 3. GENRE AFFINITY via mood_genre_weights (max +25, reduced from +40)
  const movieGenres = (movie.genres || []).map(extractGenreId).filter(Boolean)
  let genreScore = 0
  for (const w of moodData.weights || []) {
    if (movieGenres.includes(w.genre_id)) genreScore += w.weight * 10
  }
  score += Math.min(25, genreScore)

  // 4. PACING/INTENSITY — now enforced as hard filters in fetchMoodCandidates (R1b)
  // No penalty math here; candidates already pass the pacing/intensity band filter.

  // 5. VIEWING CONTEXT modifier (up to +15)
  score += CONTEXT_MODIFIERS[viewingContext]?.[moodId] ?? 0

  // 6. EXPERIENCE TYPE modifier (up to +15)
  score += EXPERIENCE_MODIFIERS[experienceType]?.(movie) ?? 0

  // 7. TIME OF DAY bonus (+5)
  score += getTimeOfDayBonus(moodId, timeOfDay)

  return Math.max(0, score)
}

// Select fields mirroring the homepage engine candidate query
const MOOD_SELECT_FIELDS = `
  id, tmdb_id, title, overview, tagline,
  original_language, runtime, release_year, release_date,
  poster_path, backdrop_path,
  ff_rating, ff_final_rating, ff_rating_genre_normalized, ff_confidence,
  vote_average, popularity,
  pacing_score, intensity_score, emotional_depth_score,
  pacing_score_100, intensity_score_100, emotional_depth_score_100,
  dialogue_density, attention_demand, vfx_level_score,
  discovery_potential, accessibility_score, polarization_score, starpower_score,
  genres, keywords, director_name, lead_actor_name,
  mood_tags, tone_tags, fit_profile,
  user_satisfaction_score, user_satisfaction_confidence
`

// Mood anchor cache — stable per mood, refreshed daily
const moodAnchorCache = new Map()
const MOOD_ANCHOR_TTL = 24 * 60 * 60 * 1000

/**
 * Find "mood anchor" films: movies tagged with ≥3 of the mood's preferred_tags,
 * high confidence, ff_audience_rating >= 78. Used as embedding seeds.
 */
async function getMoodAnchors(moodId, preferredTags) {
  const cached = moodAnchorCache.get(moodId)
  if (cached && Date.now() - cached.ts < MOOD_ANCHOR_TTL) return cached.anchors

  if (!preferredTags || preferredTags.length < 3) {
    moodAnchorCache.set(moodId, { anchors: [], ts: Date.now() })
    return []
  }

  const { data } = await supabase
    .from('movies')
    .select('id, mood_tags')
    .eq('is_valid', true)
    .gte('ff_audience_rating', 78)
    .gte('ff_confidence', 60)
    .not('poster_path', 'is', null)
    .order('ff_confidence', { ascending: false })
    .limit(200)

  const anchors = (data || [])
    .filter(m => {
      const tags = Array.isArray(m.mood_tags) ? m.mood_tags : []
      const overlap = tags.filter(t => preferredTags.includes(t)).length
      return overlap >= 3
    })
    .slice(0, 3)
    .map(m => m.id)

  moodAnchorCache.set(moodId, { anchors, ts: Date.now() })
  return anchors
}

/**
 * Fetch candidate movies from the internal movies table for a given mood.
 * Candidates are scored by the caller — this function only retrieves a pool.
 * Falls back to TMDB discoverMovies if the internal pool is too small.
 *
 * @param {number} moodId
 * @param {Array} moodWeights - rows from discover_mood_genre_weights
 * @param {Object} profile - computeUserProfile result (for language guard)
 * @param {Object} moodData - loadMoodData result (for anchor tag lookup)
 * @param {{intensity?: number, pacing?: number, signal?: AbortSignal}} params
 * @returns {Promise<{candidates: Array, qualityFloorUsed: number|string|null}>}
 */
async function fetchMoodCandidates(moodId, moodWeights, profile, moodData, params = {}) {
  const { signal, intensity = 3, pacing = 3 } = params

  // Language guard from user profile (reuse homepage engine's language detection)
  const langGuard = profile?.language || null
  const allowedLanguages = langGuard?.allowedLanguages || []

  // Larger pool for strict/strong language modes where catalog is thinner
  const poolLimit = langGuard?.mode === 'strict' || langGuard?.mode === 'strong' ? 500 : 400

  const minConf = 40
  const moodGenreIds = new Set(moodWeights.map(w => w.genre_id))

  // === Pacing/Intensity as hard filters (R1b) ===
  const targetPacing = (pacing / 5) * 100
  const targetIntensity = (intensity / 5) * 100

  // Reusable query builder — same filters except quality floor
  function buildQuery(minNorm, pacingBand, intensityBand) {
    let query = supabase
      .from('movies')
      .select(MOOD_SELECT_FIELDS)
      .eq('is_valid', true)
      .not('poster_path', 'is', null)
      .not('tmdb_id', 'is', null)
      .gte('ff_rating_genre_normalized', minNorm)
      .gte('ff_confidence', minConf)
      .order('ff_rating_genre_normalized', { ascending: false })
      .limit(poolLimit)

    if (allowedLanguages.length === 1) {
      query = query.eq('original_language', allowedLanguages[0])
    } else if (allowedLanguages.length > 1 && allowedLanguages.length <= 4) {
      query = query.in('original_language', allowedLanguages)
    }

    // Mood 5 (Nostalgic): restrict to pre-2000 releases
    if (moodId === 5) {
      query = query.lte('release_year', 2000)
    }

    // Pacing filter
    if (pacingBand != null) {
      query = query
        .gte('pacing_score_100', Math.max(0, targetPacing - pacingBand))
        .lte('pacing_score_100', Math.min(100, targetPacing + pacingBand))
    }

    // Intensity filter
    if (intensityBand != null) {
      query = query
        .gte('intensity_score_100', Math.max(0, targetIntensity - intensityBand))
        .lte('intensity_score_100', Math.min(100, targetIntensity + intensityBand))
    }

    // Genre exclusion (Animation, Horror, etc. unless user watches them)
    query = applyDbGenreExclusions(query, profile)

    return query
  }

  function filterByGenre(pool) {
    return pool.filter(movie => {
      const genreIds = (movie.genres || []).map(extractGenreId).filter(Boolean)
      return genreIds.some(id => moodGenreIds.has(id))
    })
  }

  try {
    // Try progressively wider filter bands: 35 → 50 → drop intensity → drop both
    let matched = []
    let qualityFloorUsed = 6.5

    // Attempt 1: tight band (±35)
    const { data: t1Data, error: t1Err } = await buildQuery(6.5, 35, 35)
    if (t1Err) throw t1Err
    matched = filterByGenre(t1Data || [])

    // Attempt 2: widen band (±50)
    if (matched.length < 50) {
      const { data: t2Data, error: t2Err } = await buildQuery(6.5, 50, 50)
      if (t2Err) throw t2Err
      matched = filterByGenre(t2Data || [])
    }

    // Attempt 3: drop intensity filter, keep pacing
    if (matched.length < 20) {
      const { data: t3Data, error: t3Err } = await buildQuery(6.5, 50, null)
      if (t3Err) throw t3Err
      matched = filterByGenre(t3Data || [])
    }

    // Attempt 4: drop both filters
    if (matched.length < 20) {
      const { data: t4Data, error: t4Err } = await buildQuery(6.5, null, null)
      if (t4Err) throw t4Err
      matched = filterByGenre(t4Data || [])
    }

    // Progressive quality relaxation for non-English STRICT users
    const isNonEnglishStrict = langGuard?.mode === 'strict' && langGuard?.primaryLanguage !== 'en'

    if (isNonEnglishStrict && matched.length < 30) {
      const { data: t5Data, error: t5Err } = await buildQuery(6.0, null, null)
      if (t5Err) throw t5Err
      matched = filterByGenre(t5Data || [])
      qualityFloorUsed = 6.0
    }

    if (isNonEnglishStrict && matched.length < 30) {
      const { data: t6Data, error: t6Err } = await buildQuery(5.5, null, null)
      if (t6Err) throw t6Err
      matched = filterByGenre(t6Data || [])
      qualityFloorUsed = 5.5
    }

    // === Embedding search: mood anchors (R4) ===
    const anchorIds = await getMoodAnchors(moodId, moodData?.preferred_tags)
    if (anchorIds.length > 0) {
      const existingIds = new Set(matched.map(m => m.id))
      const { data: embMatches, error: embErr } = await supabase
        .rpc('match_movies_by_seeds', {
          seed_ids: anchorIds,
          exclude_ids: [...existingIds],
          match_count: 80,
          min_ff_rating: 60,
        })

      if (!embErr && embMatches?.length > 0) {
        // Fetch full rows for embedding matches (RPC returns limited fields)
        const embIds = embMatches.map(m => m.id).filter(Boolean)
        if (embIds.length > 0) {
          const { data: fullRows } = await supabase
            .from('movies')
            .select(MOOD_SELECT_FIELDS)
            .in('id', embIds)
            .eq('is_valid', true)
            .not('poster_path', 'is', null)

          for (const row of (fullRows || [])) {
            if (row?.id && !existingIds.has(row.id)) {
              matched.push(row)
              existingIds.add(row.id)
            }
          }
        }
      }
    }

    if (matched.length >= 15) return { candidates: matched, qualityFloorUsed }

    // Fallback: if internal pool still too small, use TMDB (unenriched)
    console.warn(`[Discover] Internal pool too small (${matched.length}) for mood ${moodId}, lang=${langGuard?.primaryLanguage ?? '?'}, falling back to TMDB`)
    const fallbackGenres = [...moodGenreIds].join(',')
    const response = await tmdb.discoverMovies({
      genreIds: fallbackGenres,
      sortBy: 'popularity.desc',
      voteAverageGte: 6.0,
      page: 1,
      signal,
    })
    return { candidates: response?.results || [], qualityFloorUsed: 'tmdb' }
  } catch (error) {
    if (error.name === 'AbortError') throw error
    console.error('[Discover] fetchMoodCandidates failed:', error)
    return { candidates: [], qualityFloorUsed: null }
  }
}

/**
 * Get mood-personalized recommendations using the homepage scoring engine.
 * Combines 16-dimension user profile score with mood affinity scoring.
 * Results are cached for 5 minutes per (userId, moodId, context, experience) combination.
 *
 * @param {string} userId
 * @param {number} moodId - Discover mood ID (1–12)
 * @param {{limit?: number, signal?: AbortSignal, intensity?: number, pacing?: number,
 *          viewingContext?: number, experienceType?: number, timeOfDay?: string}} options
 * @returns {Promise<Array<{movie_id, tmdb_id, title, poster_path, vote_average, release_date,
 *           overview, final_score, match_percentage, _recommendationMeta}>>}
 */
export async function getMoodRecommendations(userId, moodId, options = {}) {
  const {
    limit = 20,
    signal,
    intensity = 3,
    pacing = 3,
    viewingContext = 1,
    experienceType = 1,
    timeOfDay = 'evening',
    parsedTags = null,
  } = options

  const cacheKey = recommendationCache.key('mood', userId, { moodId, viewingContext, experienceType })

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      // 1. Load genre weights + tag sets from DB (cached in memory after first load)
      const moodData = await loadMoodData(moodId)
      if (moodData.weights.length === 0) {
        console.warn(`[Discover] No genre weights for mood ${moodId}`)
        return []
      }

      // 2. Compute user profile (reuses 60s memory cache from homepage engine)
      const profile = await computeUserProfile(userId)

      // 3. Fetch candidates from internal movies table (or TMDB fallback)
      const { candidates, qualityFloorUsed } = await fetchMoodCandidates(moodId, moodData.weights, profile, moodData, { signal, intensity, pacing })
      if (candidates.length === 0) return []

      // 4. Get watched movie IDs for exclusion (from profile — single fetch)
      const watchedIds = new Set(profile.watchedMovieIds || [])

      // 5. Score each candidate
      const moodParams = { intensity, pacing, viewingContext, experienceType, timeOfDay, parsedTags }
      const scored = candidates
        .filter(movie => movie?.id && movie.tmdb_id && !watchedIds.has(movie.id))
        .map(movie => {
          const userResult = scoreMovieForUser(movie, profile, 'mood')
          const moodScore = scoreMoodAffinity(movie, moodId, moodData, moodParams)
          const combined = (0.55 * userResult.score) + (0.45 * moodScore)
          return { movie, combined, userScore: userResult.score, moodScore }
        })
        .sort((a, b) => b.combined - a.combined)
        .slice(0, limit)

      if (scored.length === 0) return []

      // 6. Percentile-based match_percentage (R7)
      // Maps rank within candidate pool to 40-99 display range for more spread
      const totalScored = scored.length
      return scored.map(({ movie, combined, userScore, moodScore }, i) => {
        const percentile = 1 - (i / totalScored)
        return {
          ...movie,
          final_score: Math.round(combined),
          match_percentage: Math.round(40 + percentile * 59),
          _recommendationMeta: { rank: i + 1, userScore, moodScore, qualityFloorUsed },
        }
      })
    } catch (error) {
      if (error.name === 'AbortError') throw error
      console.error('[Discover] getMoodRecommendations failed:', error)
      return []
    }
  }, { ttl: 5 * 60 * 1000 })
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
    forceRefresh = false
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
      // 1. Get user's watch history with movie details + user ratings in parallel
      const [{ data: history, error: histError }, { data: userRatings }] = await Promise.all([
        supabase
          .from('user_history')
          .select(`
            movie_id,
            watched_at,
            source,
            movies!inner (
              id, tmdb_id, title, ff_final_rating, ff_rating,
              director_name, primary_genre
            )
          `)
          .eq('user_id', userId)
          .order('watched_at', { ascending: false })
          .limit(50),
        supabase
          .from('user_ratings')
          .select('movie_id, rating')
          .eq('user_id', userId)
      ])

      if (histError) throw histError
      if (!history || history.length === 0) {
        console.log('[getBecauseYouWatchedRows] No watch history')
        return []
      }

      // Build a quick lookup: movie_id → user's personal rating
      const ratingByMovieId = new Map(
        (userRatings || []).map(r => [r.movie_id, r.rating])
      )

      // 2. Derive watched IDs from the history we already fetched — no extra round-trip
      const watchedIds = history.map(h => h.movie_id)
      const allExcludeIds = [...new Set([...watchedIds, ...excludeIds])]

      // 3. Select seed films — prioritise by user's own rating, fall back to ff_final_rating
      const seenMovies = new Set()
      const potentialSeeds = []

      for (const item of history) {
        if (!item.movies?.id || !item.movies?.title) continue
        if (seenMovies.has(item.movies.id)) continue

        seenMovies.add(item.movies.id)
        const userRating = ratingByMovieId.get(item.movies.id) ?? null
        potentialSeeds.push({
          id: item.movies.id,
          tmdbId: item.movies.tmdb_id,
          title: item.movies.title,
          userRating,
          ffFinalRating: item.movies.ff_audience_rating != null ? item.movies.ff_audience_rating / 10 : (item.movies.ff_final_rating ?? item.movies.ff_rating ?? 0),
          director: item.movies.director_name,
          genre: item.movies.primary_genre,
          source: item.source,
          watchedAt: item.watched_at
        })
      }

      // Seed priority: user rated ≥8 > user rated ≥7 > onboarding > ff_final_rating
      potentialSeeds.sort((a, b) => {
        const tierOf = (s) => {
          if (s.userRating >= 8) return 3
          if (s.userRating >= 7) return 2
          if (s.source === 'onboarding') return 1
          return 0
        }
        const tierDiff = tierOf(b) - tierOf(a)
        if (tierDiff !== 0) return tierDiff
        return b.ffFinalRating - a.ffFinalRating
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

      // 4. Fire all seed embedding lookups in parallel — previously sequential (N × ~500ms)
      const seedResults = await Promise.all(
        seeds.map(seed =>
          supabase
            .rpc('match_movies_by_seeds', {
              seed_ids: [seed.id],
              exclude_ids: allExcludeIds,
              match_count: limitPerSeed + 10,
              min_ff_rating: 70
            })
            .then(res => ({ seed, ...res }))
            .catch(err => {
              console.warn('[getBecauseYouWatchedRows] Embedding error for seed:', seed.title, err.message)
              return { seed, data: null, error: err }
            })
        )
      )

      // 5. Process each seed's results
      const rows = []

      for (const { seed, data: similarMovies, error: embError } of seedResults) {
        if (embError || !similarMovies || similarMovies.length === 0) {
          console.log('[getBecauseYouWatchedRows] No similar movies for:', seed.title)
          continue
        }

        // Score and enhance results
        const scored = similarMovies.map(movie => {
          const similarity = movie.similarity || 0
          let score = similarity * 100

          if (movie.director_name && seed.director &&
              movie.director_name.toLowerCase() === seed.director.toLowerCase()) {
            score += 15
          }
          if (movie.primary_genre && seed.genre &&
              movie.primary_genre.toLowerCase() === seed.genre.toLowerCase()) {
            score += 10
          }

          const _qRating = movie.ff_audience_rating != null ? movie.ff_audience_rating / 10 : (movie.ff_final_rating ?? movie.ff_rating ?? 0)
          if (_qRating >= 7.0) score += 10
          else if (_qRating >= 6.5) score += 5

          return {
            movie: { ...movie, _embeddingSimilarity: similarity, _matchedSeedTitle: seed.title },
            score,
            similarity
          }
        })

        scored.sort((a, b) => b.score - a.score)

        // Diversity: max 2 per director
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
            seedUserRating: seed.userRating,
            movies
          })

          logRowImpressions(userId, diverse.map(d => ({
            movie: d.movie,
            pickReason: { label: `Similar to ${seed.title}`, type: 'because_you_watched' },
            score: d.score,
            embeddingReason: { seedTitle: seed.title, seedId: seed.id, similarity: d.similarity }
          })), 'because_you_loved').catch(err =>
            console.warn('[getBecauseYouWatchedRows] Failed to log impressions:', err.message)
          )

          console.log(`[getBecauseYouWatchedRows] Row for "${seed.title}":`, {
            moviesFound: movies.length,
            topMatch: movies[0]?.title,
            topSimilarity: movies[0]?._embeddingSimilarity?.toFixed(3)
          })
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
    version: 'new-noteworthy-v1',
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

      // 3. Get user's watched movie IDs (from profile — single fetch)
      const watchedIds = profile.watchedMovieIds || []
      const allExcludeIds = [...new Set([...watchedIds, ...stableExcludeIds])]

      // 4. Fetch candidates - Focus on RECENT + POPULAR
      const currentYear = new Date().getFullYear()
      const selectFields = `
        id, tmdb_id, title, overview, tagline,
        original_language, runtime, release_year, release_date,
        poster_path, backdrop_path, trailer_youtube_key,
        ff_rating, ff_final_rating, ff_community_rating, ff_community_confidence, ff_community_votes,
        ff_critic_rating, ff_critic_confidence, ff_audience_rating, ff_audience_confidence,
        ff_rating_genre_normalized, ff_confidence, quality_score, vote_average,
        pacing_score, intensity_score, emotional_depth_score,
        pacing_score_100, intensity_score_100, emotional_depth_score_100,
        dialogue_density, attention_demand, vfx_level_score,
        cult_status_score, popularity, vote_count, revenue,
        director_name, lead_actor_name,
        genres, keywords, primary_genre,
        fit_profile, mood_tags, tone_tags,
        user_satisfaction_score, user_satisfaction_confidence
      `

      // Pool 1: Recent quality films (last 2 years) — validated by audience
      // ff_final_rating >= 7.0 and vote_count >= 300 filter out pre-release buzz noise
      const { data: recentPopular } = await supabase
        .from('movies')
        .select(selectFields)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
        .gte('release_year', currentYear - 2)
        .gte('ff_audience_rating', 70)
        .gte('ff_confidence', 60)
        .gte('vote_count', 300)
        .order('popularity', { ascending: false })
        .limit(100)

      // Pool 2: This year's quality releases
      const { data: thisYear } = await supabase
        .from('movies')
        .select(selectFields)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
        .eq('release_year', currentYear)
        .gte('ff_audience_rating', 70)
        .gte('ff_confidence', 60)
        .gte('vote_count', 300)
        .order('popularity', { ascending: false })
        .limit(50)

      // Pool 3: Taste-matched recent releases via embedding similarity
      let embeddingNeighbors = []
      if (seedIds.length > 0) {
        const { data: embeddingMatches, error: embError } = await supabase
          .rpc('match_movies_by_seeds', {
            seed_ids: seedIds,
            exclude_ids: allExcludeIds,
            match_count: 30,
            min_ff_rating: 70
          })

        if (embError) {
          console.warn('[getTrendingForUser] Embedding search error:', embError.message)
        } else {
          // Last 12 months only — embedding matches for "new & noteworthy" must be current
          embeddingNeighbors = (embeddingMatches || []).filter(m =>
            m.release_year && m.release_year >= currentYear - 1
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
  
  const selectFields = `
      id, tmdb_id, title, overview, tagline,
      original_language, runtime, release_year, release_date,
      poster_path, backdrop_path, trailer_youtube_key,
      ff_rating, ff_final_rating, ff_confidence, quality_score, vote_average,
      ff_critic_rating, ff_critic_confidence, ff_audience_rating, ff_audience_confidence,
      ff_community_rating, ff_community_confidence, ff_community_votes,
      pacing_score, intensity_score, emotional_depth_score,
      pacing_score_100, intensity_score_100, emotional_depth_score_100,
      dialogue_density, attention_demand, vfx_level_score,
      cult_status_score, popularity, vote_count, revenue,
      director_name, lead_actor_name,
      genres, keywords, primary_genre,
      fit_profile, mood_tags, tone_tags,
      user_satisfaction_score, user_satisfaction_confidence
    `

  const { data } = await supabase
    .from('movies')
    .select(selectFields)
    .eq('is_valid', true)
    .not('poster_path', 'is', null)
    .gte('release_year', currentYear - 2)
    .gte('ff_audience_rating', 70)
    .gte('ff_confidence', 60)
    .gte('vote_count', 300)
    .order('popularity', { ascending: false })
    .limit(limit)

  if (data?.length) {
    return data.map(movie => ({
      ...movie,
      _score: movie.popularity,
      _pickReason: { label: 'New & noteworthy', type: 'fallback_trending' }
    }))
  }

  // Slightly relaxed — widen vote floor but keep quality bar
  const { data: relaxedData } = await supabase
    .from('movies')
    .select(selectFields)
    .eq('is_valid', true)
    .not('poster_path', 'is', null)
    .gte('release_year', currentYear - 3)
    .gte('ff_audience_rating', 70)
    .gte('vote_count', 150)
    .order('popularity', { ascending: false })
    .limit(limit)

  return (relaxedData || []).map(movie => ({
    ...movie,
    _score: movie.popularity,
    _pickReason: { label: 'Worth watching', type: 'fallback_trending_relaxed' }
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
    version: 'hidden-gems-v4',
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

      // 3. Get user's watched movie IDs (from profile — single fetch)
      const watchedIds = profile.watchedMovieIds || []
      const allExcludeIds = [...new Set([...watchedIds, ...stableExcludeIds])]

      // 4. Fetch candidates - HIDDEN GEM CRITERIA
      const selectFields = `
        id, tmdb_id, title, overview, tagline,
        original_language, runtime, release_year, release_date,
        poster_path, backdrop_path, trailer_youtube_key,
        ff_rating, ff_final_rating, ff_community_rating, ff_community_confidence, ff_community_votes,
        ff_critic_rating, ff_critic_confidence, ff_audience_rating, ff_audience_confidence,
        ff_rating_genre_normalized, ff_confidence, quality_score, vote_average,
        pacing_score, intensity_score, emotional_depth_score,
        pacing_score_100, intensity_score_100, emotional_depth_score_100,
        dialogue_density, attention_demand, vfx_level_score,
        cult_status_score, popularity, vote_count, revenue,
        director_name, lead_actor_name,
        genres, keywords, primary_genre,
        fit_profile, mood_tags, tone_tags,
        user_satisfaction_score, user_satisfaction_confidence
      `

      // All 3 pools fire in parallel
      const [
        { data: classicGems },
        { data: cultGems },
        embeddingResult
      ] = await Promise.all([
        // Pool 1: Quality gems — genuinely under the radar, no genre restriction.
        // Genre filtering is intentionally omitted: user profiles can be noisy from
        // bad past recommendations. Pool 3 (embedding) handles taste-matching.
        // vote_count 1K–5K is the true "hidden" range in this DB:
        //   Man from Earth (2.7K), Coherence (3.2K), Timecrimes (1.4K) → pass
        //   Hunger Games (22K), Spider-Verse (16K), Star Wars (21K) → blocked
        supabase
          .from('movies')
          .select(selectFields)
          .eq('is_valid', true)
          .not('poster_path', 'is', null)
          .gte('ff_audience_rating', 72)
          .gte('ff_confidence', 60)
          .gte('vote_count', 1000)
          .lte('vote_count', 5000)
          .order('ff_audience_rating', { ascending: false })
          .limit(100),

        // Pool 2: Cult gems — any genre, same vote ceiling
        supabase
          .from('movies')
          .select(selectFields)
          .eq('is_valid', true)
          .not('poster_path', 'is', null)
          .gte('ff_audience_rating', 72)
          .gte('ff_confidence', 60)
          .gte('cult_status_score', 60)
          .gte('vote_count', 1000)
          .lte('vote_count', 5000)
          .order('cult_status_score', { ascending: false })
          .limit(50),

        // Pool 3: Embedding neighbors — taste-matched hidden gems
        seedIds.length > 0
          ? supabase.rpc('match_movies_by_seeds', {
              seed_ids: seedIds,
              exclude_ids: allExcludeIds,
              match_count: 50,
              min_ff_rating: 70
            })
          : Promise.resolve({ data: null, error: null })
      ])

      // Extract embedding gems with same vote ceiling
      let embeddingGems = []
      if (embeddingResult.error) {
        console.warn('[getHiddenGemsForUser] Embedding search error:', embeddingResult.error.message)
      } else {
        embeddingGems = (embeddingResult.data || []).filter(
          m => m.vote_count >= 1000 && m.vote_count <= 5000
        )
        console.log('[getHiddenGemsForUser] Embedding gems found:', embeddingGems.length)
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
        const _gemRating = movie.ff_audience_rating != null ? movie.ff_audience_rating / 10 : (movie.ff_final_rating ?? movie.ff_rating ?? 0)
        if (_gemRating >= 7.5) gemBoost += 15
        else if (_gemRating >= 7.0) gemBoost += 8

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
  const selectFields = `
      id, tmdb_id, title, overview, tagline,
      original_language, runtime, release_year, release_date,
      poster_path, backdrop_path, trailer_youtube_key,
      ff_rating, ff_final_rating, ff_confidence, quality_score, vote_average,
      ff_critic_rating, ff_critic_confidence, ff_audience_rating, ff_audience_confidence,
      ff_community_rating, ff_community_confidence, ff_community_votes,
      pacing_score, intensity_score, emotional_depth_score,
      pacing_score_100, intensity_score_100, emotional_depth_score_100,
      dialogue_density, attention_demand, vfx_level_score,
      cult_status_score, popularity, vote_count, revenue,
      director_name, lead_actor_name,
      genres, keywords, primary_genre,
      fit_profile, mood_tags, tone_tags,
      user_satisfaction_score, user_satisfaction_confidence
    `

  // vote_count 1K–5K is the true "hidden" range in this DB (see data analysis)
  const { data } = await supabase
    .from('movies')
    .select(selectFields)
    .eq('is_valid', true)
    .not('poster_path', 'is', null)
    .gte('ff_audience_rating', 72)
    .gte('ff_confidence', 60)
    .gte('vote_count', 1000)
    .lte('vote_count', 5000)
    .order('ff_audience_rating', { ascending: false })
    .limit(limit)

  if (data?.length) {
    return data.map(movie => ({
      ...movie,
      _score: Number(movie.ff_audience_rating ?? (movie.ff_final_rating ?? movie.ff_rating ?? 0) * 10),
      _pickReason: { label: 'Hidden gem', type: 'fallback_gem' }
    }))
  }

  // Slightly relaxed — widen vote ceiling to 8K but keep quality bar
  const { data: relaxedData } = await supabase
    .from('movies')
    .select(selectFields)
    .eq('is_valid', true)
    .not('poster_path', 'is', null)
    .gte('ff_audience_rating', 70)
    .gte('vote_count', 500)
    .lte('vote_count', 8000)
    .order('ff_audience_rating', { ascending: false })
    .limit(limit)

  return (relaxedData || []).map(movie => ({
    ...movie,
    _score: Number(movie.ff_audience_rating ?? (movie.ff_final_rating ?? movie.ff_rating ?? 0) * 10),
    _pickReason: { label: 'Hidden gem', type: 'fallback_gem_relaxed' }
  }))
}




// ============================================================================
// TIERED HOMEPAGE — NEW ROW GENERATORS (v2.13)
// ============================================================================

const TIERED_SELECT_FIELDS = `
  id, tmdb_id, title, overview, tagline,
  original_language, runtime, release_year, release_date,
  poster_path, backdrop_path, trailer_youtube_key,
  ff_rating, ff_final_rating, ff_confidence, quality_score, vote_average,
  ff_critic_rating, ff_critic_confidence, ff_audience_rating, ff_audience_confidence,
  ff_community_rating, ff_community_confidence, ff_community_votes,
  ff_rating_genre_normalized,
  pacing_score, intensity_score, emotional_depth_score,
  pacing_score_100, intensity_score_100, emotional_depth_score_100,
  dialogue_density, attention_demand, vfx_level_score,
  cult_status_score, popularity, vote_count, revenue,
  director_name, lead_actor_name,
  genres, keywords, primary_genre,
  discovery_potential, accessibility_score, polarization_score, starpower_score,
  fit_profile, mood_tags, tone_tags,
  user_satisfaction_score, user_satisfaction_confidence
`

/**
 * Mood coherence row — films whose mood_tags intersect with user's recent mood tags.
 * Requires profile.moodSignature.recentMoodTags.length >= 3.
 *
 * @param {string} userId
 * @param {Object} profile - computeUserProfile result
 * @param {number} [limit=20]
 * @returns {Promise<Object[]>}
 */
export async function getMoodCoherenceRow(userId, profile, limit = 20) {
  const cacheKey = recommendationCache.key('mood_coherence', userId, { limit })

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      const recentTags = profile?.moodSignature?.recentMoodTags || []
      if (recentTags.length < 3) return []

      const topTags = recentTags.slice(0, 3).map(t => t.tag)

      const watchedIds = new Set(profile.watchedMovieIds || [])

      // Recent skips (7d)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: skipData } = await supabase
        .from('recommendation_impressions')
        .select('movie_id')
        .eq('user_id', userId)
        .eq('skipped', true)
        .gte('shown_at', sevenDaysAgo)
      const skipIds = new Set((skipData || []).map(r => r.movie_id).filter(Boolean))

      // Fetch candidates with mood_tags overlap
      // Supabase doesn't support array-overlap filter natively, so fetch a broad pool
      // and filter client-side by tag intersection
      const { data, error } = await supabase
        .from('movies')
        .select(TIERED_SELECT_FIELDS)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
        .gte('ff_audience_rating', 65)
        .gte('ff_confidence', 40)
        .order('ff_audience_rating', { ascending: false })
        .limit(500)

      if (error) throw error

      const candidates = (data || []).filter(movie => {
        if (!movie?.id || !movie.tmdb_id) return false
        if (watchedIds.has(movie.id)) return false
        if (skipIds.has(movie.id)) return false
        const movieTags = Array.isArray(movie.mood_tags) ? movie.mood_tags : []
        return movieTags.some(t => topTags.includes(t))
      })

      if (candidates.length === 0) return []

      const scored = candidates
        .map(movie => {
          const result = scoreMovieForUser(movie, profile, 'home')
          return { movie, score: result.score }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)

      return scored.map(({ movie, score }) => ({
        ...movie,
        _score: score,
        _pickReason: { label: 'Matches your vibe', type: 'mood_coherence' },
      }))
    } catch (error) {
      console.error('[getMoodCoherenceRow] failed:', error)
      return []
    }
  }, { ttl: 5 * 60 * 1000 })
}

/**
 * Your Genres row — top preferred genre films scored by user profile.
 *
 * @param {string} userId
 * @param {Object} profile - computeUserProfile result
 * @param {number} [limit=20]
 * @returns {Promise<{label: string, movies: Object[]}>}
 */
export async function getYourGenresRow(userId, profile, limit = 20) {
  const preferred = profile?.genres?.preferred || []
  if (preferred.length === 0) return { label: null, movies: [] }

  const topGenreId = preferred[0]
  const genreName = GENRE_ID_TO_NAME[topGenreId]
  if (!genreName) return { label: null, movies: [] }

  const label = `More ${genreName}`
  const cacheKey = recommendationCache.key('your_genres', userId, { genreId: topGenreId, limit })

  const movies = await recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      const watchedIds = new Set(profile.watchedMovieIds || [])

      const { data, error } = await supabase
        .from('movies')
        .select(TIERED_SELECT_FIELDS)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
        .eq('primary_genre', genreName)
        .gte('ff_audience_rating', 70)
        .gte('ff_confidence', 40)
        .order('ff_audience_rating', { ascending: false })
        .limit(200)

      if (error) throw error

      const candidates = (data || []).filter(m => m?.id && m.tmdb_id && !watchedIds.has(m.id))
      if (candidates.length === 0) return []

      return candidates
        .map(movie => {
          const result = scoreMovieForUser(movie, profile, 'home')
          return {
            ...movie,
            _score: result.score,
            _pickReason: { label: `${genreName} pick`, type: 'your_genre' },
          }
        })
        .sort((a, b) => b._score - a._score)
        .slice(0, limit)
    } catch (error) {
      console.error('[getYourGenresRow] failed:', error)
      return []
    }
  }, { ttl: 5 * 60 * 1000 })

  return { label, movies }
}

/**
 * Popular on FeelFlick — unpersonalized cold-start row.
 * Recent high-audience-rating films with strong vote counts.
 *
 * @param {number} [limit=20]
 * @returns {Promise<Object[]>}
 */
export async function getPopularForColdStartRow(limit = 20) {
  const cacheKey = recommendationCache.key('popular_cold_start', 'global', { limit })

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      const currentYear = new Date().getFullYear()
      const { data, error } = await supabase
        .from('movies')
        .select(TIERED_SELECT_FIELDS)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
        .gte('ff_audience_rating', 78)
        .gte('vote_count', 10000)
        .gte('release_year', currentYear - 3)
        .order('popularity', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []).map(movie => ({
        ...movie,
        _score: movie.ff_audience_rating || 0,
        _pickReason: { label: 'Popular on FeelFlick', type: 'popular_cold_start' },
      }))
    } catch (error) {
      console.error('[getPopularForColdStartRow] failed:', error)
      return []
    }
  }, { ttl: 10 * 60 * 1000 })
}

/**
 * Onboarding-seeded row — uses the user's onboarding film selections
 * as embedding seeds via match_movies_by_seeds.
 *
 * @param {string} userId
 * @param {number} [limit=20]
 * @returns {Promise<Object[]>}
 */
export async function getOnboardingSeededRow(userId, limit = 20) {
  const cacheKey = recommendationCache.key('onboarding_seeded', userId, { limit })

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      // Get onboarding film IDs from user_history where source = 'onboarding'
      const { data: onboardingHistory, error: histErr } = await supabase
        .from('user_history')
        .select('movie_id')
        .eq('user_id', userId)
        .eq('source', 'onboarding')

      if (histErr) throw histErr

      const seedIds = (onboardingHistory || []).map(h => h.movie_id).filter(Boolean)
      if (seedIds.length === 0) return []

      // Use embedding similarity to find similar films
      const { data: matches, error: rpcErr } = await supabase
        .rpc('match_movies_by_seeds', {
          seed_ids: seedIds,
          exclude_ids: seedIds,
          match_count: limit * 2,
          min_ff_rating: 70,
        })

      if (rpcErr) {
        console.warn('[getOnboardingSeededRow] RPC error:', rpcErr.message)
        return []
      }

      return (matches || [])
        .filter(m => m?.poster_path)
        .slice(0, limit)
        .map(movie => ({
          ...movie,
          _score: movie.similarity || 0,
          _pickReason: { label: 'Based on your picks', type: 'onboarding_seeded' },
        }))
    } catch (error) {
      console.error('[getOnboardingSeededRow] failed:', error)
      return []
    }
  }, { ttl: 10 * 60 * 1000 })
}

/**
 * Get the user's watch count for tier detection.
 * Lightweight — just a count query, no full row fetch.
 *
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function getUserWatchCount(userId) {
  if (!userId) return 0
  try {
    const { count, error } = await supabase
      .from('user_history')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('[getUserWatchCount] failed:', error)
    return 0
  }
}

// ============================================================================
// SLOW CONTEMPLATIVE ROW ("A Moment of Quiet")
// ============================================================================

/**
 * Films with contemplative/meditative mood tags and slow pacing.
 * Scored via scoreMovieForUser for personalization.
 *
 * @param {string} userId
 * @param {number} [limit=20]
 * @returns {Promise<Object[]>}
 */
export async function getSlowContemplativeRow(userId, limit = 20) {
  const cacheKey = recommendationCache.key('slow_contemplative', userId || 'guest', { limit })

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      const profile = await computeUserProfile(userId)
      const seedFilms = userId ? await getSeedFilms(userId, profile) : []
      const watchedIds = profile.watchedMovieIds || []

      const { data, error } = await supabase
        .from('movies')
        .select(TIERED_SELECT_FIELDS)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
        .lte('pacing_score_100', 40)
        .gte('ff_audience_rating', 70)
        .overlaps('mood_tags', ['contemplative', 'meditative', 'melancholic', 'serene'])
        .order('ff_audience_rating', { ascending: false })
        .limit(limit * 3)

      if (error) throw error

      const candidates = (data || []).filter(m => m?.id && !watchedIds.includes(m.id))
      const scored = candidates.map(movie => {
        const result = scoreMovieForUser(movie, profile, 'default', seedFilms)
        return { ...movie, _score: result.score, _pickReason: { label: 'A moment of quiet', type: 'slow_contemplative' } }
      })
      scored.sort((a, b) => b._score - a._score)
      return scored.slice(0, limit)
    } catch (error) {
      console.error('[getSlowContemplativeRow] failed:', error)
      return []
    }
  })
}

// ============================================================================
// QUICK WATCHES ROW ("Under 90 Minutes")
// ============================================================================

/**
 * Quality films under 90 minutes. Useful utility row for all tiers.
 *
 * @param {string|null} userId
 * @param {number} [limit=20]
 * @returns {Promise<Object[]>}
 */
export async function getQuickWatchesRow(userId, limit = 20) {
  const cacheKey = recommendationCache.key('quick_watches', userId || 'guest', { limit })

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      const profile = userId ? await computeUserProfile(userId) : null
      const seedFilms = userId && profile ? await getSeedFilms(userId, profile) : []
      const watchedIds = profile?.watchedMovieIds || []

      const { data, error } = await supabase
        .from('movies')
        .select(TIERED_SELECT_FIELDS)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
        .lte('runtime', 90)
        .gte('runtime', 60)
        .gte('ff_audience_rating', 70)
        .gte('ff_confidence', 60)
        .order('ff_audience_rating', { ascending: false })
        .limit(limit * 3)

      if (error) throw error

      const candidates = (data || []).filter(m => m?.id && !watchedIds.includes(m.id))

      if (!profile) {
        return candidates.slice(0, limit).map(movie => ({
          ...movie,
          _score: movie.ff_audience_rating || 0,
          _pickReason: { label: 'Under 90 minutes', type: 'quick_watch' },
        }))
      }

      const scored = candidates.map(movie => {
        const result = scoreMovieForUser(movie, profile, 'default', seedFilms)
        return { ...movie, _score: result.score, _pickReason: { label: 'Under 90 minutes', type: 'quick_watch' } }
      })
      scored.sort((a, b) => b._score - a._score)
      return scored.slice(0, limit)
    } catch (error) {
      console.error('[getQuickWatchesRow] failed:', error)
      return []
    }
  })
}

export const __TEST_ONLY__ = { THRESHOLDS, computeNegativeSignals, scoreEraMatch, scoreRecency }
