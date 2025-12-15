// src/shared/hooks/useRating.js

/**
 * FeelFlick Rating Hook
 * 
 * React hook for managing star ratings with optimistic updates.
 * 
 * @module useRating
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import {
  submitRating,
  getRating,
  deleteRating
} from '@/shared/services/ratings'

/**
 * Hook for managing rating for a single movie
 * 
 * @param {number} movieId - Internal movie ID (from movies table)
 * @param {Object} [options] - Hook options
 * @param {boolean} [options.autoFetch] - Auto-fetch on mount (default true)
 * @returns {Object} Rating state and actions
 */
export function useRating(movieId, options = {}) {
  const { autoFetch = true } = options

  // State
  const [rating, setRating] = useState(null)
  const [ratingValue, setRatingValue] = useState(0)
  const [reviewText, setReviewText] = useState('')
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
   * Fetch existing rating
   */
  const fetchRating = useCallback(async () => {
    if (!userId || !movieId) return

    setLoading(true)
    setError(null)

    try {
      const data = await getRating(userId, movieId)
      
      if (data) {
        setRating(data)
        setRatingValue(data.rating || 0)
        setReviewText(data.review_text || '')
      } else {
        setRating(null)
        setRatingValue(0)
        setReviewText('')
      }
    } catch (err) {
      console.error('[useRating] Fetch error:', err)
      setError(err.message || 'Failed to load rating')
    } finally {
      setLoading(false)
    }
  }, [userId, movieId])

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && userId && movieId) {
      fetchRating()
    }
  }, [autoFetch, userId, movieId, fetchRating])

  /**
   * Submit rating
   */
  const submit = useCallback(async (newRating, options = {}) => {
    if (!userId || !movieId) {
      throw new Error('User ID and Movie ID are required')
    }

    if (newRating < 1 || newRating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }

    setSubmitting(true)
    setError(null)

    try {
      // Optimistic update
      setRatingValue(newRating)

      // Submit to database
      const result = await submitRating(userId, movieId, newRating, {
        reviewText: options.reviewText || reviewText,
        moodSessionId: options.moodSessionId
      })
      
      // Update with server response
      setRating(result)
      setRatingValue(result.rating)
      if (result.review_text) {
        setReviewText(result.review_text)
      }
      
      return result

    } catch (err) {
      console.error('[useRating] Submit error:', err)
      setError(err.message || 'Failed to submit rating')
      
      // Revert optimistic update
      await fetchRating()
      
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [userId, movieId, reviewText, fetchRating])

  /**
   * Update review text
   */
  const updateReview = useCallback(async (newReviewText) => {
    if (!userId || !movieId || !ratingValue) {
      throw new Error('Must have a rating before adding review')
    }

    setSubmitting(true)
    setError(null)

    try {
      // Optimistic update
      setReviewText(newReviewText)

      // Submit to database
      const result = await submitRating(userId, movieId, ratingValue, {
        reviewText: newReviewText
      })
      
      setRating(result)
      
      return result

    } catch (err) {
      console.error('[useRating] Update review error:', err)
      setError(err.message || 'Failed to update review')
      
      // Revert optimistic update
      await fetchRating()
      
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [userId, movieId, ratingValue, fetchRating])

  /**
   * Delete rating
   */
  const remove = useCallback(async () => {
    if (!userId || !movieId) {
      throw new Error('User ID and Movie ID are required')
    }

    setSubmitting(true)
    setError(null)

    try {
      // Optimistic update
      setRating(null)
      setRatingValue(0)
      setReviewText('')

      // Delete from database
      await deleteRating(userId, movieId)
      
      return true

    } catch (err) {
      console.error('[useRating] Delete error:', err)
      setError(err.message || 'Failed to delete rating')
      
      // Revert optimistic update
      await fetchRating()
      
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [userId, movieId, fetchRating])

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // State
    rating,
    ratingValue,
    reviewText,
    loading,
    error,
    submitting,
    
    // Derived state
    hasRating: ratingValue > 0,
    
    // Actions
    submit,
    updateReview,
    remove,
    refetch: fetchRating,
    clearError,
    
    // Setters for controlled inputs
    setReviewText
  }
}
