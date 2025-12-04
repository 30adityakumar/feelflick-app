// src/shared/hooks/useRecommendations.js
/**
 * React hooks for fetching personalized recommendations.
 * Uses Supabase auth directly (no AuthProvider wrapper).
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import * as recommendationService from '@/shared/services/recommendations'

/**
 * Hook to get current user ID from Supabase session
 */
function useUserId() {
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return userId
}

/**
 * Hook for genre-based recommendations
 */
export function useGenreRecommendations(options = {}) {
  const { limit = 20, enabled = true } = options
  const userId = useUserId()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function fetchRecommendations() {
      try {
        setLoading(true)
        setError(null)

        const recommendations =
          await recommendationService.getGenreBasedRecommendations(userId, {
            limit,
            signal: controller.signal,
          })

        setData(recommendations)
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[useGenreRecommendations] Error:', err)
          setError(err)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()

    return () => controller.abort()
  }, [userId, limit, enabled])

  return { data, loading, error }
}

/**
 * Hook for history-based recommendations
 */
export function useHistoryRecommendations(options = {}) {
  const { limit = 20, enabled = true } = options
  const userId = useUserId()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function fetchRecommendations() {
      try {
        setLoading(true)
        setError(null)

        const recommendations =
          await recommendationService.getHistoryBasedRecommendations(userId, {
            limit,
            signal: controller.signal,
          })

        setData(recommendations)
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
  }, [userId, limit, enabled])

  return { data, loading, error }
}

/**
 * Hook for mood-based recommendations
 */
export function useMoodRecommendations(moodId, options = {}) {
  const { limit = 20, enabled = true } = options
  const userId = useUserId()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !userId || !moodId) {
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function fetchRecommendations() {
      try {
        setLoading(true)
        setError(null)

        const recommendations =
          await recommendationService.getMoodRecommendations(userId, moodId, {
            limit,
            signal: controller.signal,
          })

        setData(recommendations)
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
  }, [userId, moodId, limit, enabled])

  return { data, loading, error }
}

/**
 * Combined hook for all recommendation types
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
  const { enabled = true } = options
  const userId = useUserId()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false)
      return
    }
    

    const controller = new AbortController()

    async function fetchTopPick() {
      try {
        setLoading(true)
        setError(null)
        const topPick = await recommendationService.getTopPickForUser(userId, {
          signal: controller.signal,
        })
        setData(topPick)
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[useTopPick] Error:', err)
          setError(err)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchTopPick()

    return () => controller.abort()
  }, [userId, enabled])

  return { data, loading, error }
}

/**
 * Homepage row: quick picks for tonight
 */
export function useQuickPicks(options = {}) {
  const { limit = 20, excludeTmdbId = null, enabled = true } = options
  const userId = useUserId()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function fetchQuickPicks() {
      try {
        setLoading(true)
        setError(null)

        const items = await recommendationService.getQuickPicksForUser(userId, {
          limit,
          excludeTmdbId,
          signal: controller.signal,
        })
        setData(items)
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[useQuickPicks] Error:', err)
          setError(err)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchQuickPicks()

    return () => controller.abort()
  }, [userId, limit, excludeTmdbId, enabled])

  return { data, loading, error }
}

/**
 * Hook: "Because you watched" seeded rows
 */
export function useBecauseYouWatchedRows(options = {}) {
  const { maxSeeds = 2, limitPerSeed = 20, enabled = true } = options
  const userId = useUserId()
  const [data, setData] = useState([]) // [{ seedTitle, seedTmdbId, movies: [] }]
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function fetchRows() {
      try {
        setLoading(true)
        setError(null)

        const rows = await recommendationService.getBecauseYouWatchedRows(userId, {
          maxSeeds,
          limitPerSeed,
          signal: controller.signal,
        })

        setData(rows || [])
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[useBecauseYouWatchedRows] Error:', err)
          setError(err)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRows()

    return () => controller.abort()
  }, [userId, maxSeeds, limitPerSeed, enabled])

  return { data, loading, error }
}

/**
 * Hook: Hidden gems for user
 */
export function useHiddenGems(options = {}) {
  const { limit = 20, enabled = true } = options
  const userId = useUserId()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function fetchHiddenGems() {
      try {
        setLoading(true)
        setError(null)

        const items = await recommendationService.getHiddenGemsForUser(userId, {
          limit,
          signal: controller.signal,
        })

        setData(items || [])
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[useHiddenGems] Error:', err)
          setError(err)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchHiddenGems()

    return () => controller.abort()
  }, [userId, limit, enabled])

  return { data, loading, error }
}

/**
 * Hook: Trending this week (for you)
 */
export function useTrendingForYou(options = {}) {
  const { limit = 20, enabled = true } = options
  const userId = useUserId()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function fetchTrending() {
      try {
        setLoading(true)
        setError(null)

        const items = await recommendationService.getTrendingForUser(userId, {
          limit,
          signal: controller.signal,
        })

        setData(items || [])
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[useTrendingForYou] Error:', err)
          setError(err)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchTrending()

    return () => controller.abort()
  }, [userId, limit, enabled])

  return { data, loading, error }
}

/**
 * Hook: Slow & Contemplative films
 */
export function useSlowContemplative(options = {}) {
  const { limit = 20, enabled = true } = options
  const userId = useUserId()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function fetch() {
      try {
        setLoading(true)
        setError(null)
        const items = await recommendationService.getSlowContemplative(userId, {
          limit,
          signal: controller.signal,
        })
        setData(items || [])
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[useSlowContemplative] Error:', err)
          setError(err)
        }
      } finally {
        setLoading(false)
      }
    }

    fetch()
    return () => controller.abort()
  }, [userId, limit, enabled])

  return { data, loading, error }
}

/**
 * Hook: Quick Watches under 90 min
 */
export function useQuickWatches(options = {}) {
  const { limit = 20, enabled = true } = options
  const userId = useUserId()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function fetch() {
      try {
        setLoading(true)
        setError(null)
        const items = await recommendationService.getQuickWatches(userId, {
          limit,
          signal: controller.signal,
        })
        setData(items || [])
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[useQuickWatches] Error:', err)
          setError(err)
        }
      } finally {
        setLoading(false)
      }
    }

    fetch()
    return () => controller.abort()
  }, [userId, limit, enabled])

  return { data, loading, error }
}

/**
 * Legacy hook for mood-based recommendations with scoring
 * Used by DiscoverPage and TestRecommendations - keeps backward compatibility
 */
export function useRecommendations(moodId, viewingContext, experienceType, limit = 20) {
  const userId = useUserId()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!moodId || !userId) {
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function fetchRecommendations() {
      try {
        setLoading(true)
        setError(null)

        const recommendations =
          await recommendationService.getMoodRecommendations(userId, moodId, {
            limit,
            signal: controller.signal,
          })

        // Transform TMDB format to match existing Discover expectations
        const transformedData = recommendations.map((movie) => ({
          movie_id: movie.id,
          tmdb_id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          vote_average: movie.vote_average,
          final_score: movie.popularity || 0,
          match_percentage: Math.min(
            99,
            Math.round(70 + (movie.vote_average || 0) * 3)
          ),
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
  }, [userId, moodId, viewingContext, experienceType, limit])

  return {
    recommendations: data,
    loading,
    error,
  }
}
