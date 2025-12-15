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
  }, [userId, authReady, enabled, limit, excludeKey])

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
  const { enabled = true, excludeTmdbIds = [], userId: userIdOverride } = options

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
  const excludeKey = stableExcludeTmdbIds.join(',')

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
  }, [userId, enabled, authReady, excludeKey, refreshKey])

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
  const userId = userIdOverride !== undefined ? userIdOverride : auth.userId
  const authReady = userIdOverride !== undefined ? true : auth.ready

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const stableExcludeIds = useMemo(() => normalizeNumericIdArray(excludeIds), [excludeIds])
  const excludeKey = stableExcludeIds.join(',')

  const forceRefreshNextRef = useRef(false)

  useEffect(() => {
    if (!enabled || !authReady) return

    if (!userId) {
      setData([])
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

        const items = await recommendationService.getQuickPicksForUser(userId, {
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
        if (!isCancelled) setLoading(false)
      }
    }

    fetchQuickPicks()
    return () => {
      isCancelled = true
    }
  }, [userId, authReady, enabled, limit, excludeKey, refreshKey])

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
  }, [userId, authReady, enabled, maxSeeds, limitPerSeed, excludeKey])

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

    if (!userId) {
      setData([])
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
        if (!isCancelled) setLoading(false)
      }
    }

    fetchHiddenGems()
    return () => {
      isCancelled = true
    }
  }, [userId, authReady, enabled, limit, excludeKey])

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

    if (!userId) {
      setData([])
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
  }, [userId, authReady, enabled, limit, excludeKey])

  return { data, loading, error }
}

// Backward compatibility: some components may still import useTrending
export function useTrending(options = {}) {
  return useTrendingForYou(options)
}

/**
 * Hook: Slow + contemplative picks
 */
export function useSlowContemplative(options = {}) {
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

    const controller = new AbortController()
    let isCancelled = false

    async function fetch() {
      try {
        setLoading(true)
        setError(null)

        const items = await recommendationService.getSlowContemplative(userId, {
          limit,
          excludeIds: stableExcludeIds,
          signal: controller.signal,
        })

        if (isCancelled) return
        setData(items || [])
      } catch (err) {
        if (err.name !== 'AbortError' && !isCancelled) {
          console.error('[useSlowContemplative] Error:', err)
          setError(err)
        }
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetch()

    return () => {
      isCancelled = true
      controller.abort()
    }
  }, [userId, authReady, enabled, limit, excludeKey])

  return { data, loading, error }
}

/**
 * Hook: Quick watches (short runtime)
 */
export function useQuickWatches(options = {}) {
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

    const controller = new AbortController()
    let isCancelled = false

    async function fetch() {
      try {
        setLoading(true)
        setError(null)

        const items = await recommendationService.getQuickWatches(userId, {
          limit,
          excludeIds: stableExcludeIds,
          signal: controller.signal,
        })

        if (isCancelled) return
        setData(items || [])
      } catch (err) {
        if (err.name !== 'AbortError' && !isCancelled) {
          console.error('[useQuickWatches] Error:', err)
          setError(err)
        }
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetch()

    return () => {
      isCancelled = true
      controller.abort()
    }
  }, [userId, authReady, enabled, limit, excludeKey])

  return { data, loading, error }
}

/**
 * Hook: Mood-specific recommendations (used outside HomePage)
 */
export function useRecommendations(moodId, viewingContext, experienceType, limit = 20) {
  const auth = useAuthState()
  const userId = auth.userId
  const authReady = auth.ready

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!authReady) return

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