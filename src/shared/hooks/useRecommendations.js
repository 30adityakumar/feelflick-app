// src/shared/hooks/useRecommendations.js
/**
 * React hook for fetching personalized recommendations
 * Uses Supabase auth directly (no AuthProvider wrapper)
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
        
        const recommendations = await recommendationService.getGenreBasedRecommendations(
          userId,
          { limit, signal: controller.signal }
        )
        
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
        
        const recommendations = await recommendationService.getHistoryBasedRecommendations(
          userId,
          { limit, signal: controller.signal }
        )
        
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
        
        const recommendations = await recommendationService.getMoodRecommendations(
          userId,
          moodId,
          { limit, signal: controller.signal }
        )
        
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
 * Legacy hook for mood-based recommendations with scoring
 * Used by DiscoverPage - keeps backward compatibility
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
        
        // Use the mood-based recommendations
        const recommendations = await recommendationService.getMoodRecommendations(
          userId,
          moodId,
          { limit, signal: controller.signal }
        )
        
        // Transform TMDB format to match your old format
        const transformedData = recommendations.map((movie, idx) => ({
          movie_id: movie.id, // TMDB ID used as movie_id for now
          tmdb_id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          vote_average: movie.vote_average,
          final_score: movie.popularity || 0, // Use popularity as score
          match_percentage: Math.min(99, Math.round(70 + (movie.vote_average || 0) * 3)), // Mock percentage
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
    error 
  }
}
