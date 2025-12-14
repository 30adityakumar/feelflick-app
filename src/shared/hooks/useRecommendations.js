// src/shared/hooks/useRecommendations.js
/**
 * React hooks for fetching personalized recommendations.
 * Uses Supabase auth directly (no AuthProvider wrapper).
 *
 * Performance notes:
 * - Previously, each hook performed its own supabase.auth.getSession() "authChecked" flow,
 *   and useUserId() also performed getSession + onAuthStateChange. That multiplied work and
 *   introduced extra renders on HomePage.
 * - This file now uses a small module-level auth store so all hooks share ONE session read
 *   and ONE onAuthStateChange subscription.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import * as recommendationService from '@/shared/services/recommendations'

/**
 * Normalize a list of numeric IDs (numbers or numeric strings) into a stable, sorted array.
 * This avoids unnecessary re-fetches due to ordering differences and provides stable cache keys.
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
 * Uses globalThis to reduce duplicate subscriptions during HMR in development.
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
      // Listener errors should never break auth propagation
      console.warn('[useRecommendations] auth listener error:', e)
    }
  })
}

function initAuthStore() {
  const store = getAuthStore()
  if (store.initialized) return
  store.initialized = true

  // Initial read (fast-path: usually local storage)
  supabase.auth
    .getSession()
    .then(({ data: { session }, error }) => {
      if (error) {
        console.warn('[useRecommendations] getSession error:', error)
      }
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

/**
 * Hook to read shared auth state.
 */
function useAuthState() {
  const store = getAuthStore()
  const [state, setState] = useState(store.state)

  useEffect(() => {
    initAuthStore()

    const listener = (next) => setState(next)
    store.listeners.add(listener)

    // Sync immediately to the latest state (in case init resolved before this hook mounted)
    setState(store.state)

    return () => {
      store.listeners.delete(listener)
    }
  }, [])

  return state
}

/**
 * Backwards-compatible helper: get current user ID from Supabase session.
 */
function useUserId() {
  const { userId } = useAuthState()
  return userId
}

/**
 * Hook for genre-based recommendations
 */
export function useGenreRecommendations(options = {}) {
  const { limit = 20, excludeIds = [], enabled = true } = options
  const { userId, ready: authReady } = useAuthState()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const stableExcludeIds = useMemo(() => normalizeNumericIdArray(excludeIds), [excludeIds])
  const excludeKey = stableExcludeIds.join(',')

  useEffect(() => {
    if (!enabled || !authReady) {
      if (authReady && !userId) setLoading(false)
      return
    }

    if (!userId) {
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
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchRecommendations()
    return () => {
      isCancelled = true
    }
  }, [userId, authReady, limit, excludeKey, enabled])

  return { data, loading, error }
}

/**
 * Hook for history-based recommendations
 */
export function useHistoryRecommendations(options = {}) {
  const { limit = 20, enabled = true } = options
  const { userId, ready: authReady } = useAuthState()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !authReady) {
      if (authReady && !userId) setLoading(false)
      return
    }

    if (!userId) {
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
  const { limit = 20, enabled = true } = options
  const { userId, ready: authReady } = useAuthState()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !authReady) {
      if (authReady && !userId) setLoading(false)
      return
    }

    if (!userId || !moodId) {
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
  }, [userId, authReady, moodId, limit, enabled])

  return { data, loading, error }
}

/**
 * Combined hook for all recommendation types
 * for all recommendation types
 */
export function useAllRecommendations(options = {}) {
  const { limit = 20 } = options

  const genreRecs = useGenreRecommendations({ limit })
  const historyRecs = useHistoryRecommendations({ limit })

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
  const { enabled = true, excludeTmdbIds = [], userId: userIdOverride } = options

  const auth = useAuthState()
  const effectiveUserId = userIdOverride !== undefined ? userIdOverride : auth.userId
  const authReady = userIdOverride !== undefined ? true : auth.ready

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const stableExcludeTmdbIds = useMemo(
    () => normalizeNumericIdArray(excludeTmdbIds),
    [excludeTmdbIds]
  )
  const excludeKey = stableExcludeTmdbIds.join(',')

  // Ensure refetch bypasses recommendation-cache once, without disabling caching permanently.
  const forceRefreshNextRef = useRef(false)

  useEffect(() => {
    // Don't fetch until auth check is complete (prevents "guest fetch" followed by "user fetch")
    if (!enabled || !authReady) {
      return
    }

    let isCancelled = false

    async function fetchTopPick() {
      try {
        setLoading(true)
        setError(null)

        const forceRefresh = forceRefreshNextRef.current
        forceRefreshNextRef.current = false

        const result = await recommendationService.getTopPickForUser(effectiveUserId, {
          excludeTmdbIds: stableExcludeTmdbIds,
          forceRefresh,
        })

        if (isCancelled) return

        // Flatten: attach pickReason and score to movie object
        if (result?.movie) {
          const enrichedMovie = {
            ...result.movie,
            _pickReason: result.pickReason,
            _score: result.score,
            _debug: result.debug,
            // Map fields for HeroTopPick compatibility
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
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchTopPick()

    return () => {
      isCancelled = true
    }
  }, [effectiveUserId, enabled, authReady, excludeKey, refreshKey])

  // Function to trigger refetch (bypass cache once)
  const refetch = useCallback(() => {
    forceRefreshNextRef.current = true
    setRefreshKey((k) => k + 1)
  }, [])

  return { data, loading, error, refetch }
}

/**
 * Homepage row: quick picks for tonight
 */
export function useQuickPicks(options = {}) {
  const { limit = 20, excludeIds = [], enabled = true, userId: userIdOverride } = options

  const auth = useAuthState()
  const effectiveUserId = userIdOverride !== undefined ? userIdOverride : auth.userId
  const authReady = userIdOverride !== undefined ? true : auth.ready

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const stableExcludeIds = useMemo(() => normalizeNumericIdArray(excludeIds), [excludeIds])
  const excludeKey = stableExcludeIds.join(',')

  const forceRefreshNextRef = useRef(false)

  useEffect(() => {
    if (!enabled || !authReady) {
      if (authReady && !effectiveUserId) setLoading(false)
      return
    }

    if (!effectiveUserId) {
      setLoading(false)
      return
    }

    let isCancelled = false

    async function fetchQuickPicks() {
      try {
        setLoading(true)
        setError(null)

        const forceRefresh = forceRefreshNextRef.current
        forceRefreshNextRef.current = false

        const items = await recommendationService.getQuickPicksForUser(effectiveUserId, {
          limit,
          excludeIds: stableExcludeIds,
          forceRefresh,
        })

        if (isCancelled) return
        setData(items || [])
      } catch (err) {
        if (err.name !== 'AbortError' && !isCancelled) {
          console.error('[useQuickPicks] Error:', err)
          setError(err)
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchQuickPicks()

    return () => {
      isCancelled = true
    }
  }, [effectiveUserId, limit, excludeKey, enabled, authReady, refreshKey])

  // Function to trigger refetch (bypass cache once)
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
  const { maxSeeds = 2, limitPerSeed = 20, excludeIds = [], enabled = true } = options
  const { userId, ready: authReady } = useAuthState()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const stableExcludeIds = useMemo(() => normalizeNumericIdArray(excludeIds), [excludeIds])
  const excludeKey = stableExcludeIds.join(',')

  useEffect(() => {
    if (!enabled || !authReady) {
      if (authReady && !userId) setLoading(false)
      return
    }

    if (!userId) {
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
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchRows()

    return () => {
      isCancelled = true
    }
  }, [userId, authReady, maxSeeds, limitPerSeed, excludeKey, enabled])

  return { data, loading, error }
}

/**
 * Hook: Hidden gems for user
 */
export function useHiddenGems(options = {}) {
  const { limit = 20, excludeIds = [], enabled = true } = options
  const { userId, ready: authReady } = useAuthState()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const stableExcludeIds = useMemo(() => normalizeNumericIdArray(excludeIds), [excludeIds])
  const excludeKey = stableExcludeIds.join(',')

  useEffect(() => {
    if (!enabled || !authReady) {
      if (authReady && !userId) setLoading(false)
      return
    }

    if (!userId) {
      setLoading(false)
      return
    }

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
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchHiddenGems()

    return () => {
      isCancelled = true
    }
  }, [userId, authReady, limit, excludeKey, enabled])

  return { data, loading, error }
}

/**
 * Hook: Trending recommendations (personalized fallback)
 */
export function useTrendingForYou(options = {}) {
  const { limit = 20, excludeIds = [], enabled = true } = options
  const { userId, ready: authReady } = useAuthState()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const stableExcludeIds = useMemo(() => normalizeNumericIdArray(excludeIds), [excludeIds])
  const excludeKey = stableExcludeIds.join(',')

  useEffect(() => {
    if (!enabled || !authReady) {
      if (authReady && !userId) setLoading(false)
      return
    }

    if (!userId) {
      setLoading(false)
      return
    }

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
          console.error('[useTrending] Error:', err)
          setError(err)
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchTrending()

    return () => {
      isCancelled = true
    }
  }, [userId, authReady, limit, excludeKey, enabled])

  return { data, loading, error }
}

/**
 * Hook: Slow + contemplative picks
 */
export function useSlowContemplative(options = {}) {
  const { limit = 20, excludeIds = [], enabled = true } = options
  const { userId, ready: authReady } = useAuthState()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const stableExcludeIds = useMemo(() => normalizeNumericIdArray(excludeIds), [excludeIds])
  const excludeKey = stableExcludeIds.join(',')

  useEffect(() => {
    if (!enabled || !authReady) {
      if (authReady && !userId) setLoading(false)
      return
    }

    if (!userId) {
      setLoading(false)
      return
    }

    let isCancelled = false

    async function fetchSlowContemplative() {
      try {
        setLoading(true)
        setError(null)

        const items = await recommendationService.getSlowContemplative(userId, {
          limit,
          excludeIds: stableExcludeIds,
        })

        if (isCancelled) return
        setData(items || [])
      } catch (err) {
        if (err.name !== 'AbortError' && !isCancelled) {
          console.error('[useSlowContemplative] Error:', err)
          setError(err)
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchSlowContemplative()

    return () => {
      isCancelled = true
    }
  }, [userId, authReady, limit, excludeKey, enabled])

  return { data, loading, error }
}

/**
 * Hook: Quick watches (short runtime)
 */
export function useQuickWatches(options = {}) {
  const { limit = 20, excludeIds = [], enabled = true } = options
  const { userId, ready: authReady } = useAuthState()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const stableExcludeIds = useMemo(() => normalizeNumericIdArray(excludeIds), [excludeIds])
  const excludeKey = stableExcludeIds.join(',')

  useEffect(() => {
    if (!enabled || !authReady) {
      if (authReady && !userId) setLoading(false)
      return
    }

    if (!userId) {
      setLoading(false)
      return
    }

    let isCancelled = false

    async function fetchQuickWatches() {
      try {
        setLoading(true)
        setError(null)

        const items = await recommendationService.getQuickWatches(userId, {
          limit,
          excludeIds: stableExcludeIds,
        })

        if (isCancelled) return
        setData(items || [])
      } catch (err) {
        if (err.name !== 'AbortError' && !isCancelled) {
          console.error('[useQuickWatches] Error:', err)
          setError(err)
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchQuickWatches()

    return () => {
      isCancelled = true
    }
  }, [userId, authReady, limit, excludeKey, enabled])

  return { data, loading, error }
}

/**
 * Hook: Mood-specific recommendations (used outside HomePage)
 */
export function useRecommendations(moodId, viewingContext, experienceType, limit = 20) {
  const { userId, ready: authReady } = useAuthState()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!authReady) {
      return
    }

    if (!moodId || !userId) {
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

        // Transform TMDB format to match existing Discover expectations
        const transformedData = (recommendations || []).map((movie) => ({
          movie_id: movie.id,
          tmdb_id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          vote_average: movie.vote_average,
          final_score: movie.popularity || 0,
          match_percentage: Math.min(99, Math.round(70 + (movie.vote_average || 0) * 3)),
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
  }, [userId, authReady, moodId, viewingContext, experienceType, limit])

  return {
    recommendations: data,
    loading,
    error,
  }
}