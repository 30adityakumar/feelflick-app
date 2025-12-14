// src/shared/hooks/useFeedback.js

/**
 * FeelFlick Feedback Hook
 * 
 * React hook for managing user feedback UI state:
 * - Loading and error states
 * - Optimistic updates
 * - Automatic feedback fetching
 * - Easy submit/update functions
 * 
 * @module useFeedback
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import {
  submitFeedback,
  getFeedback,
  updateSentiment,
  markAsWatched,
  deleteFeedback
} from '@/shared/services/feedback'

/**
 * Hook for managing feedback for a single movie
 * 
 * @param {number} tmdbId - TMDB movie ID
 * @param {Object} [options] - Hook options
 * @param {boolean} [options.autoFetch] - Auto-fetch on mount (default true)
 * @returns {Object} Feedback state and actions
 */
export function useFeedback(tmdbId, options = {}) {
  const { autoFetch = true } = options

  // State
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Get current user
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    fetchUser()
  }, [])

  /**
   * Fetch existing feedback
   */
  const fetchFeedback = useCallback(async () => {
    if (!userId || !tmdbId) return

    setLoading(true)
    setError(null)

    try {
      const data = await getFeedback(userId, tmdbId)
      setFeedback(data)
    } catch (err) {
      console.error('[useFeedback] Fetch error:', err)
      setError(err.message || 'Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }, [userId, tmdbId])

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && userId && tmdbId) {
      fetchFeedback()
    }
  }, [autoFetch, userId, tmdbId, fetchFeedback])

  /**
   * Submit new feedback or update existing
   */
  const submit = useCallback(async (feedbackData) => {
    if (!userId || !tmdbId) {
      throw new Error('User ID and TMDB ID are required')
    }

    setSubmitting(true)
    setError(null)

    try {
      // Optimistic update
      const optimisticFeedback = {
        ...feedback,
        ...feedbackData,
        tmdb_id: tmdbId,
        user_id: userId
      }
      setFeedback(optimisticFeedback)

      // Submit to database
      const result = await submitFeedback(userId, tmdbId, feedbackData)
      
      // Update with server response
      setFeedback(result)
      
      return result

    } catch (err) {
      console.error('[useFeedback] Submit error:', err)
      setError(err.message || 'Failed to submit feedback')
      
      // Revert optimistic update on error
      await fetchFeedback()
      
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [userId, tmdbId, feedback, fetchFeedback])

  /**
   * Quick sentiment update
   */
  const setSentiment = useCallback(async (sentiment) => {
    if (!userId || !tmdbId) {
      throw new Error('User ID and TMDB ID are required')
    }

    setSubmitting(true)
    setError(null)

    try {
      // Optimistic update
      setFeedback(prev => ({ ...prev, sentiment }))

      // Submit to database
      const result = await updateSentiment(userId, tmdbId, sentiment)
      
      // Update with server response
      setFeedback(result)
      
      return result

    } catch (err) {
      console.error('[useFeedback] Sentiment update error:', err)
      setError(err.message || 'Failed to update sentiment')
      
      // Revert optimistic update
      await fetchFeedback()
      
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [userId, tmdbId, fetchFeedback])

  /**
   * Mark as watched (from watchlist)
   */
  const confirmWatched = useCallback(async (sentiment = null) => {
    if (!userId || !tmdbId) {
      throw new Error('User ID and TMDB ID are required')
    }

    setSubmitting(true)
    setError(null)

    try {
      // Optimistic update
      setFeedback(prev => ({
        ...prev,
        watched_confirmed: true,
        sentiment: sentiment || prev?.sentiment
      }))

      // Submit to database
      const result = await markAsWatched(userId, tmdbId, sentiment)
      
      // Update with server response
      setFeedback(result)
      
      return result

    } catch (err) {
      console.error('[useFeedback] Mark watched error:', err)
      setError(err.message || 'Failed to mark as watched')
      
      // Revert optimistic update
      await fetchFeedback()
      
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [userId, tmdbId, fetchFeedback])

  /**
   * Delete feedback
   */
  const remove = useCallback(async () => {
    if (!userId || !tmdbId) {
      throw new Error('User ID and TMDB ID are required')
    }

    setSubmitting(true)
    setError(null)

    try {
      // Optimistic update
      setFeedback(null)

      // Delete from database
      await deleteFeedback(userId, tmdbId)
      
      return true

    } catch (err) {
      console.error('[useFeedback] Delete error:', err)
      setError(err.message || 'Failed to delete feedback')
      
      // Revert optimistic update
      await fetchFeedback()
      
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [userId, tmdbId, fetchFeedback])

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // State
    feedback,
    loading,
    error,
    submitting,
    
    // Derived state
    hasFeedback: !!feedback,
    sentiment: feedback?.sentiment || null,
    watchedConfirmed: feedback?.watched_confirmed || false,
    
    // Actions
    submit,
    setSentiment,
    confirmWatched,
    remove,
    refetch: fetchFeedback,
    clearError
  }
}

/**
 * Hook for managing feedback across multiple movies
 * Useful for lists/grids where you need feedback for many movies
 * 
 * @param {number[]} tmdbIds - Array of TMDB movie IDs
 * @returns {Object} Feedback map and actions
 */
export function useBulkFeedback(tmdbIds = []) {
  const [feedbackMap, setFeedbackMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Get current user
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    fetchUser()
  }, [])

  /**
   * Fetch feedback for all movies
   */
  const fetchAll = useCallback(async () => {
    if (!userId || tmdbIds.length === 0) return

    setLoading(true)
    setError(null)

    try {
      // Fetch all feedback for these movies
      const { data, error: fetchError } = await supabase
        .from('user_movie_feedback')
        .select('*')
        .eq('user_id', userId)
        .in('tmdb_id', tmdbIds)

      if (fetchError) throw fetchError

      // Build map
      const map = {}
      data.forEach(feedback => {
        map[feedback.tmdb_id] = feedback
      })

      setFeedbackMap(map)

    } catch (err) {
      console.error('[useBulkFeedback] Fetch error:', err)
      setError(err.message || 'Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }, [userId, tmdbIds])

  // Auto-fetch when IDs change
  useEffect(() => {
    if (userId && tmdbIds.length > 0) {
      fetchAll()
    }
  }, [userId, tmdbIds, fetchAll])

  /**
   * Get feedback for specific movie
   */
  const getFeedbackForMovie = useCallback((tmdbId) => {
    return feedbackMap[tmdbId] || null
  }, [feedbackMap])

  /**
   * Update feedback for specific movie
   */
  const updateFeedbackForMovie = useCallback((tmdbId, feedback) => {
    setFeedbackMap(prev => ({
      ...prev,
      [tmdbId]: feedback
    }))
  }, [])

  return {
    // State
    feedbackMap,
    loading,
    error,
    
    // Helpers
    getFeedbackForMovie,
    updateFeedbackForMovie,
    refetch: fetchAll
  }
}

/**
 * Hook for sentiment picker UI state
 * Manages the open/close state and selection
 * 
 * @returns {Object} Picker state and controls
 */
export function useSentimentPicker() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSentiment, setSelectedSentiment] = useState(null)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])

  const select = useCallback((sentiment) => {
    setSelectedSentiment(sentiment)
  }, [])

  const clear = useCallback(() => {
    setSelectedSentiment(null)
  }, [])

  return {
    isOpen,
    selectedSentiment,
    open,
    close,
    toggle,
    select,
    clear
  }
}

/**
 * Hook for viewing context tags selection
 * Manages multi-select state
 * 
 * @param {string[]} [initialTags] - Initially selected tags
 * @returns {Object} Tags state and controls
 */
export function useViewingContextTags(initialTags = []) {
  const [selectedTags, setSelectedTags] = useState(initialTags)

  const toggle = useCallback((tag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag)
      } else {
        return [...prev, tag]
      }
    })
  }, [])

  const add = useCallback((tag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) return prev
      return [...prev, tag]
    })
  }, [])

  const remove = useCallback((tag) => {
    setSelectedTags(prev => prev.filter(t => t !== tag))
  }, [])

  const clear = useCallback(() => {
    setSelectedTags([])
  }, [])

  const isSelected = useCallback((tag) => {
    return selectedTags.includes(tag)
  }, [selectedTags])

  return {
    selectedTags,
    toggle,
    add,
    remove,
    clear,
    isSelected
  }
}
