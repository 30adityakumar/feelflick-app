// src/shared/hooks/useRecommendations.js
/**
 * React hooks for fetching personalized recommendations.
 * Uses Supabase auth directly (no AuthProvider wrapper).
 *
 * Key performance change:
 * - Share ONE supabase.auth.getSession() call and ONE onAuthStateChange subscription
 *   across the entire app (instead of duplicating work in every hook instance).
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import * as recommendationService from '@/shared/services/recommendations'

/**
 * Normalize numeric ID arrays (dedupe + coerce to number + sort)
 * so dependency keys and cache keys stay stable across renders.
 */
function normalizeNumericIdArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return []
  const out = []
  for (const v of arr) {
    const n = typeof v === 'number' ? v : Number(v)
    if (Number.isFinite(n)) out.push(n)
  }
  return Array.from(new Set(out)).sort((a, b) => a - b)
}

/**
 * Shared auth store (singleton).
 * Using globalThis makes this resilient during HMR in dev (prevents resubscribing repeatedly).
 */
const AUTH_STORE_KEY = '__feelflick_auth_store_v1__'

function getAuthStore() {
  if (!globalThis[AUTH_STORE_KEY]) {
    globalThis[AUTH_STORE_KEY] = {
      initialized: false,
      state: { userId: null, session: null, ready: false },
      listeners: new Set(),
      subscription: null,
    }
  }
  return globalThis[AUTH_STORE_KEY]
}

function setAuthState(patch) {
  const store = getAuthStore()
  store.state = { ...store.state, ...patch }
  store.listeners.forEach((fn) => {
    try {
      fn(store.state)
    } catch (e) {
      // Listener errors should not break auth propagation
      console.warn('[useRecommendations] auth listener error:', e)
    }
  })
}

function initAuthStore() {
  const store = getAuthStore()
  if (store.initialized) return
  store.initialized = true

  // Initial read (typically local-storage fast)
  supabase.auth
    .getSession()
    .then(({ data: { session }, error }) => {
      if (error) console.warn('[useRecommendations] getSession error:', error)
      setAuthState({
        session: session || null,
        userId: session?.user?.id || null,
        ready: true,
      })
    })
    .catch((e) => {
      console.warn('[useRecommendations] getSession unexpected error:', e)
      setAuthState({ session: null, userId: null, ready: true })
    })

  // Subscribe once
  if (!store.subscription) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState({
        session: session || null,
        userId: session?.user?.id || null,
        ready: true,
      })
    })
    store.subscription = data?.subscription || null
  }
}

function useAuthState() {
  const store = getAuthStore()
  const [state, setState] = useState(store.state)

  useEffect(() => {
    initAuthStore()

    const listener = (next) => setState(next)
    store.listeners.add(listener)

    // Sync immediately to latest state in case init resolved before mount
    setState(store.state)

    return () => {
      store.listeners.delete(listener)
    }
  }, [store])

  return state
}

/**
 * Hook for genre-based recommendations
 */
export function useGenreRecommendations(options = {}) {
  const { limit = 20, excludeIds = [], enabled = true, userId: userIdOverride } = options
  const auth = useAuthState()
  const userId = userIdOverride !== undefined ? userIdOverride : auth.userId
  const authReady = userIdOverride !== undefined ? true : auth.ready

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const stableExcludeIds = useMemo(() => normalizeNumericIdArray(excludeIds), [excludeIds])
  const excludeKey = stableExcludeIds.join(',')

  useEffect(() => {
    if (!enabled || !authReady) return

    if (!userId) {
      setData([])
      setLoading(false)
      return
    }

    let isCancelled = false

    async function fetchRecommendations() {
      try {
        setLoading(true)
        setError(null)

        const recommendations = await recommendationService.getGenreBasedRecommendations(userId, {
          limit,
          excludeIds: stableExcludeIds,
        })

        if (isCancelled) return
        setData(recommendations || [])
      } catch (err) {
        if (err.name !== 'AbortError' && !isCancelled) {
          console.error('[useGenreRecommendations] Error:', err)
          setError(err)
        }
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchRecommendations()
    return () => {
      isCancelled = true
    }
  }, [userId, authReady, enabled, limit, excludeKey, stableExcludeIds])

  return { data, loading, error }
}

/**
 * Hook for history-based recommendations
 */
export function useHistoryRecommendations(options = {}) {
  const { limit = 20, enabled = true, userId: userIdOverride } = options
  const auth = useAuthState()
  const userId = userIdOverride !== undefined ? userIdOverride : auth.userId
  const authReady = userIdOverride !== undefined ? true : auth.ready

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !authReady) return

    if (!userId) {
      setData([])
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function fetchRecommendations() {
      try {
        setLoading(true)
        setError(null)

        const recommendations = await recommendationService.getHistoryBasedRecommendations(userId, {
          limit,
          signal: controller.signal,
        })

        setData(recommendations || [])
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[useHistoryRecommendations] Error:', err)
          setError(err)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
    return () => controller.abort()
  }, [userId, authReady, enabled, limit])

  return { data, loading, error }
}

/**
 * Hook for mood-based recommendations
 */
export function useMoodRecommendations(moodId, options = {}) {
  const { limit = 20, enabled = true, userId: userIdOverride } = options
  const auth = useAuthState()
  const userId = userIdOverride !== undefined ? userIdOverride : auth.userId
  const authReady = userIdOverride !== undefined ? true : auth.ready

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !authReady) return

    if (!userId || !moodId) {
      setData([])
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function fetchRecommendations() {
      try {
        setLoading(true)
        setError(null)

        const recommendations = await recommendationService.getMoodRecommendations(userId, moodId, {
          limit,
          signal: controller.signal,
        })

        setData(recommendations || [])
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[useMoodRecommendations] Error:', err)
          setError(err)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
    return () => controller.abort()
  }, [userId, authReady, enabled, moodId, limit])

  return { data, loading, error }
}

/**
 * Combined hook for all recommendation types
 */
export function useAllRecommendations(options = {}) {
  const { limit = 20, userId: userIdOverride } = options

  const genreRecs = useGenreRecommendations({ limit, userId: userIdOverride })
  const historyRecs = useHistoryRecommendations({ limit, userId: userIdOverride })

  const loading = genreRecs.loading || historyRecs.loading
  const error = genreRecs.error || historyRecs.error

  return {
    genreBased: genreRecs.data,
    historyBased: historyRecs.data,
    loading,
    error,
  }
}

/**
 * Homepage hero hook - top pick for the user
 */
export function useTopPick(options = {}) {
  const { enabled = true, excludeTmdbIds = [], penalizedGenreIds = [], userId: userIdOverride } = options

  const auth = useAuthState()
  const userId = userIdOverride !== undefined ? userIdOverride : auth.userId
  const authReady = userIdOverride !== undefined ? true : auth.ready

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const stableExcludeTmdbIds = useMemo(
    () => normalizeNumericIdArray(excludeTmdbIds),
    [excludeTmdbIds]
  )
  const stablePenalizedGenreIds = useMemo(
    () => normalizeNumericIdArray(penalizedGenreIds),
    [penalizedGenreIds]
  )
  const excludeKey = stableExcludeTmdbIds.join(',')
  const penalizedKey = stablePenalizedGenreIds.join(',')

  // Ensure refetch bypasses recommendation-cache once (without disabling caching permanently)
  const forceRefreshNextRef = useRef(false)

  useEffect(() => {
    if (!enabled || !authReady) return

    let isCancelled = false

    async function fetchTopPick() {
      try {
        setLoading(true)
        setError(null)

        const forceRefresh = forceRefreshNextRef.current
        forceRefreshNextRef.current = false

        const result = await recommendationService.getTopPickForUser(userId, {
          excludeTmdbIds: stableExcludeTmdbIds,
          penalizedGenreIds: stablePenalizedGenreIds,
          forceRefresh,
        })

        if (isCancelled) return

        if (result?.movie) {
          const enrichedMovie = {
            ...result.movie,
            _pickReason: result.pickReason,
            _score: result.score,
            _debug: result.debug,
            trailer_url: result.movie.trailer_youtube_key
              ? `https://www.youtube.com/watch?v=${result.movie.trailer_youtube_key}`
              : null,
            director: result.movie.director_name ? { name: result.movie.director_name } : null,
          }
          setData(enrichedMovie)
        } else {
          setData(null)
        }
      } catch (err) {
        if (err.name !== 'AbortError' && !isCancelled) {
          console.error('[useTopPick] Error:', err)
          setError(err)
        }
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchTopPick()

    return () => {
      isCancelled = true
    }
  }, [userId, enabled, authReady, excludeKey, penalizedKey, refreshKey, stableExcludeTmdbIds, stablePenalizedGenreIds])

  const refetch = useCallback(() => {
    forceRefreshNextRef.current = true
    setRefreshKey((k) => k + 1)
  }, [])

  return { data, loading, error, refetch }
}


/**
 * Hook: "Because you watched" seeded rows
 */
export function useBecauseYouWatchedRows(options = {}) {
  const { maxSeeds = 2, limitPerSeed = 20, excludeIds = [], enabled = true, userId: userIdOverride } = options

  const auth = useAuthState()
  const userId = userIdOverride !== undefined ? userIdOverride : auth.userId
  const authReady = userIdOverride !== undefined ? true : auth.ready

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const stableExcludeIds = useMemo(() => normalizeNumericIdArray(excludeIds), [excludeIds])
  const excludeKey = stableExcludeIds.join(',')

  useEffect(() => {
    if (!enabled || !authReady) return

    if (!userId) {
      setData([])
      setLoading(false)
      return
    }

    let isCancelled = false

    async function fetchRows() {
      try {
        setLoading(true)
        setError(null)

        const rows = await recommendationService.getBecauseYouWatchedRows(userId, {
          maxSeeds,
          limitPerSeed,
          excludeIds: stableExcludeIds,
        })

        if (isCancelled) return
        setData(rows || [])
      } catch (err) {
        if (err.name !== 'AbortError' && !isCancelled) {
          console.error('[useBecauseYouWatchedRows] Error:', err)
          setError(err)
        }
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchRows()
    return () => {
      isCancelled = true
    }
  }, [userId, authReady, enabled, maxSeeds, limitPerSeed, excludeKey, stableExcludeIds])

  return { data, loading, error }
}

/**
 * Hook: Hidden gems for user
 */
export function useHiddenGems(options = {}) {
  const { limit = 20, excludeIds = [], enabled = true, userId: userIdOverride } = options

  const auth = useAuthState()
  const userId = userIdOverride !== undefined ? userIdOverride : auth.userId
  const authReady = userIdOverride !== undefined ? true : auth.ready

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const stableExcludeIds = useMemo(() => normalizeNumericIdArray(excludeIds), [excludeIds])
  const excludeKey = stableExcludeIds.join(',')

  useEffect(() => {
    if (!enabled || !authReady) return

    let isCancelled = false

    async function fetchHiddenGems() {
      try {
        setLoading(true)
        setError(null)

        const items = await recommendationService.getHiddenGemsForUser(userId, {
          limit,
          excludeIds: stableExcludeIds,
        })

        if (isCancelled) return
        setData(items || [])
      } catch (err) {
        if (err.name !== 'AbortError' && !isCancelled) {
          console.error('[useHiddenGems] Error:', err)
          setError(err)
        }
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchHiddenGems()
    return () => {
      isCancelled = true
    }
  }, [userId, authReady, enabled, limit, excludeKey, stableExcludeIds])

  return { data, loading, error }
}

/**
 * Hook: Trending this week (for you)
 */
export function useTrendingForYou(options = {}) {
  const { limit = 20, excludeIds = [], enabled = true, userId: userIdOverride } = options

  const auth = useAuthState()
  const userId = userIdOverride !== undefined ? userIdOverride : auth.userId
  const authReady = userIdOverride !== undefined ? true : auth.ready

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const stableExcludeIds = useMemo(() => normalizeNumericIdArray(excludeIds), [excludeIds])
  const excludeKey = stableExcludeIds.join(',')

  useEffect(() => {
    if (!enabled || !authReady) return

    let isCancelled = false

    async function fetchTrending() {
      try {
        setLoading(true)
        setError(null)

        const items = await recommendationService.getTrendingForUser(userId, {
          limit,
          excludeIds: stableExcludeIds,
        })

        if (isCancelled) return
        setData(items || [])
      } catch (err) {
        if (err.name !== 'AbortError' && !isCancelled) {
          console.error('[useTrendingForYou] Error:', err)
          setError(err)
        }
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchTrending()
    return () => {
      isCancelled = true
    }
  }, [userId, authReady, enabled, limit, excludeKey, stableExcludeIds])

  return { data, loading, error }
}

// Backward compatibility: some components may still import useTrending
export function useTrending(options = {}) {
  return useTrendingForYou(options)
}

// ============================================================================
// TIERED HOMEPAGE HOOKS
// ============================================================================

/**
 * Derive homepage tier from watch count.
 * @param {number} watchCount
 * @returns {'cold'|'warming'|'engaged'}
 */
function deriveTier(watchCount) {
  if (watchCount <= 4) return 'cold'
  if (watchCount <= 19) return 'warming'
  return 'engaged'
}

/**
 * Hook: User tier detection (cold/warming/engaged).
 *
 * Derives tier from computeUserProfile's cached totalMoviesWatched instead of
 * a separate DB query. Returns synchronously when the profile is cached (60s TTL),
 * eliminating the null→skeleton→remount cascade on /home.
 *
 * @returns {{ watchCount: number|null, tier: 'cold'|'warming'|'engaged'|null, loading: boolean }}
 */
export function useUserTier(options = {}) {
  const { userId: userIdOverride } = options

  const auth = useAuthState()
  const userId = userIdOverride !== undefined ? userIdOverride : auth.userId
  const authReady = userIdOverride !== undefined ? true : auth.ready

  const [watchCount, setWatchCount] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authReady) return

    if (!userId) {
      setWatchCount(0)
      setLoading(false)
      return
    }

    let isCancelled = false

    async function fetchTier() {
      try {
        // Uses the same 60s memory cache as the hero + row hooks.
        // If profile is already cached, this returns synchronously (no DB round-trip).
        const profile = await recommendationService.computeUserProfile(userId)
        const count = profile?.qualityProfile?.totalMoviesWatched ?? 0
        if (!isCancelled) setWatchCount(count)
      } catch {
        if (!isCancelled) setWatchCount(0)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchTier()
    return () => { isCancelled = true }
  }, [userId, authReady])

  const tier = watchCount === null ? null : deriveTier(watchCount)

  return { watchCount, tier, loading }
}

/**
 * Hook: Mood coherence row — films matching user's recent mood vibe.
 */
export function useMoodCoherenceRow(options = {}) {
  const { limit = 20, enabled = true, userId: userIdOverride } = options

  const auth = useAuthState()
  const userId = userIdOverride !== undefined ? userIdOverride : auth.userId
  const authReady = userIdOverride !== undefined ? true : auth.ready

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !authReady) return

    if (!userId) {
      setData([])
      setLoading(false)
      return
    }

    let isCancelled = false

    async function fetchRow() {
      try {
        setLoading(true)
        setError(null)

        const profile = await recommendationService.computeUserProfile(userId)
        const items = await recommendationService.getMoodCoherenceRow(userId, profile, limit)

        if (!isCancelled) setData(items || [])
      } catch (err) {
        if (err.name !== 'AbortError' && !isCancelled) {
          console.error('[useMoodCoherenceRow] Error:', err)
          setError(err)
        }
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchRow()
    return () => { isCancelled = true }
  }, [userId, authReady, enabled, limit])

  return { data, loading, error }
}

/**
 * Hook: Your Genres row — top preferred genre films.
 */
export function useYourGenresRow(options = {}) {
  const { limit = 20, enabled = true, userId: userIdOverride } = options

  const auth = useAuthState()
  const userId = userIdOverride !== undefined ? userIdOverride : auth.userId
  const authReady = userIdOverride !== undefined ? true : auth.ready

  const [data, setData] = useState([])
  const [label, setLabel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !authReady) return

    if (!userId) {
      setData([])
      setLoading(false)
      return
    }

    let isCancelled = false

    async function fetchRow() {
      try {
        setLoading(true)
        setError(null)

        const profile = await recommendationService.computeUserProfile(userId)
        const result = await recommendationService.getYourGenresRow(userId, profile, limit)

        if (!isCancelled) {
          setData(result.movies || [])
          setLabel(result.label)
        }
      } catch (err) {
        if (err.name !== 'AbortError' && !isCancelled) {
          console.error('[useYourGenresRow] Error:', err)
          setError(err)
        }
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchRow()
    return () => { isCancelled = true }
  }, [userId, authReady, enabled, limit])

  return { data, label, loading, error }
}

/**
 * Hook: Popular on FeelFlick — unpersonalized cold-start row.
 */
export function usePopularForColdStart(options = {}) {
  const { limit = 20, enabled = true } = options

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled) return

    let isCancelled = false

    async function fetchRow() {
      try {
        setLoading(true)
        setError(null)

        const items = await recommendationService.getPopularForColdStartRow(limit)
        if (!isCancelled) setData(items || [])
      } catch (err) {
        if (!isCancelled) {
          console.error('[usePopularForColdStart] Error:', err)
          setError(err)
        }
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchRow()
    return () => { isCancelled = true }
  }, [enabled, limit])

  return { data, loading, error }
}

/**
 * Hook: Onboarding-seeded row — "Based on your picks" using embedding similarity.
 */
export function useOnboardingSeededRow(options = {}) {
  const { limit = 20, enabled = true, userId: userIdOverride } = options

  const auth = useAuthState()
  const userId = userIdOverride !== undefined ? userIdOverride : auth.userId
  const authReady = userIdOverride !== undefined ? true : auth.ready

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !authReady) return

    if (!userId) {
      setData([])
      setLoading(false)
      return
    }

    let isCancelled = false

    async function fetchRow() {
      try {
        setLoading(true)
        setError(null)

        const items = await recommendationService.getOnboardingSeededRow(userId, limit)
        if (!isCancelled) setData(items || [])
      } catch (err) {
        if (err.name !== 'AbortError' && !isCancelled) {
          console.error('[useOnboardingSeededRow] Error:', err)
          setError(err)
        }
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchRow()
    return () => { isCancelled = true }
  }, [userId, authReady, enabled, limit])

  return { data, loading, error }
}

/**
 * Hook: Slow contemplative row — "A Moment of Quiet".
 * Films with contemplative/meditative mood tags and slow pacing.
 */
export function useSlowContemplativeRow(options = {}) {
  const { limit = 20, enabled = true, userId: userIdOverride } = options

  const auth = useAuthState()
  const userId = userIdOverride !== undefined ? userIdOverride : auth.userId
  const authReady = userIdOverride !== undefined ? true : auth.ready

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !authReady) return

    if (!userId) {
      setData([])
      setLoading(false)
      return
    }

    let isCancelled = false

    async function fetchRow() {
      try {
        setLoading(true)
        setError(null)

        const items = await recommendationService.getSlowContemplativeRow(userId, limit)
        if (!isCancelled) setData(items || [])
      } catch (err) {
        if (err.name !== 'AbortError' && !isCancelled) {
          console.error('[useSlowContemplativeRow] Error:', err)
          setError(err)
        }
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchRow()
    return () => { isCancelled = true }
  }, [userId, authReady, enabled, limit])

  return { data, loading, error }
}

/**
 * Hook: Quick watches row — "Under 90 Minutes".
 * Quality films under 90 minutes runtime.
 */
export function useQuickWatchesRow(options = {}) {
  const { limit = 20, enabled = true, userId: userIdOverride } = options

  const auth = useAuthState()
  const userId = userIdOverride !== undefined ? userIdOverride : auth.userId
  const authReady = userIdOverride !== undefined ? true : auth.ready

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !authReady) return

    let isCancelled = false

    async function fetchRow() {
      try {
        setLoading(true)
        setError(null)

        const items = await recommendationService.getQuickWatchesRow(userId || null, limit)
        if (!isCancelled) setData(items || [])
      } catch (err) {
        if (err.name !== 'AbortError' && !isCancelled) {
          console.error('[useQuickWatchesRow] Error:', err)
          setError(err)
        }
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchRow()
    return () => { isCancelled = true }
  }, [userId, authReady, enabled, limit])

  return { data, loading, error }
}

/**
 * Hook: Mood-specific recommendations (used outside HomePage)
 * @param {number|null} moodId
 * @param {number} viewingContext - 1=Solo, 2=Partner, 3=Friends, 4=Family, 5=Group
 * @param {number} experienceType - 1=Discover, 2=Rewatch, 3=Nostalgia, 4=Learn, 5=Challenge
 * @param {number} intensity - user dial value 1–5
 * @param {number} pacing - user dial value 1–5
 * @param {string} timeOfDay - 'morning'|'afternoon'|'evening'|'night'
 * @param {number} limit
 */
export function useRecommendations(
  moodId,
  viewingContext,
  experienceType,
  intensity,
  pacing,
  timeOfDay,
  limit = 20,
  parsedTags = null,
) {
  const auth = useAuthState()
  const userId = auth.userId
  const authReady = auth.ready

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!authReady) return

    if (!moodId || !userId) {
      setData([])
      setError(null)
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function fetchRecommendations() {
      try {
        setLoading(true)
        setError(null)

        const recommendations = await recommendationService.getMoodRecommendations(userId, moodId, {
          limit,
          signal: controller.signal,
          intensity,
          pacing,
          viewingContext,
          experienceType,
          timeOfDay,
          parsedTags,
        })

        // Movies now come from internal movies table — map to the Discover result shape.
        // final_score and match_percentage are computed by the scoring pipeline.
        const transformedData = (recommendations || []).map((movie) => ({
          movie_id: movie.id ?? movie.movie_id,
          tmdb_id: movie.tmdb_id,
          title: movie.title,
          poster_path: movie.poster_path,
          vote_average: movie.ff_audience_rating != null ? movie.ff_audience_rating / 10 : (movie.ff_final_rating ?? movie.ff_rating ?? movie.vote_average),
          release_date: movie.release_date,
          overview: movie.overview,
          final_score: movie.final_score ?? 0,
          match_percentage: movie.match_percentage ?? 70,
          _recommendationMeta: movie._recommendationMeta,
        }))

        setData(transformedData)
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[useRecommendations] Error:', err)
          setError(err.message || 'Failed to load recommendations')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()

    return () => controller.abort()
  }, [userId, authReady, moodId, viewingContext, experienceType, intensity, pacing, timeOfDay, limit, parsedTags])

  return {
    recommendations: data,
    loading,
    error,
  }
}
