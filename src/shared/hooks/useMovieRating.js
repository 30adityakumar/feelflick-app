/**
 * useMovieRating Hook - FIXED VERSION
 * Handles movie rating with proper parameter order
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

export function useMovieRating(internalMovieId, userId) {
  const [rating, setRating] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Load existing rating
  useEffect(() => {
    if (!userId || !internalMovieId) {
      setRating(0)
      return
    }

    async function loadRating() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('user_ratings')
          .select('rating')
          .eq('user_id', userId)
          .eq('movie_id', internalMovieId)
          .maybeSingle()

        if (error) {
          console.error('[useMovieRating] Load error:', error)
          return
        }

        setRating(data?.rating || 0)
        console.log('[useMovieRating] ✅ Loaded rating:', data?.rating || 0)
      } catch (err) {
        console.error('[useMovieRating] Load exception:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadRating()
  }, [internalMovieId, userId])

  // Save rating
  const saveRating = async (newRating) => {
    if (!userId) {
      setError('Must be logged in to rate')
      return false
    }

    if (!internalMovieId) {
      setError('Movie ID not found')
      return false
    }

    // Validate rating range (1-10)
    if (newRating !== 0 && (newRating < 1 || newRating > 10)) {
      setError('Rating must be between 1-10')
      return false
    }

    setSaving(true)
    setError(null)

    try {
      // Delete if rating is 0 (clear rating)
      if (newRating === 0) {
        const { error } = await supabase
          .from('user_ratings')
          .delete()
          .eq('user_id', userId)
          .eq('movie_id', internalMovieId)

        if (error) throw error

        setRating(0)
        console.log('[useMovieRating] ✅ Rating cleared')
        return true
      }

      // Upsert rating (NO 'source' field!)
      const { error } = await supabase
        .from('user_ratings')
        .upsert({
          user_id: userId,
          movie_id: internalMovieId,
          rating: newRating,
          rated_at: new Date().toISOString()
          // ❌ REMOVED: source: 'movie_detail'
        }, {
          onConflict: 'user_id,movie_id'
        })

      if (error) {
        console.error('[useMovieRating] Save error:', error)
        setError(error.message)
        return false
      }

      setRating(newRating)
      console.log(`[useMovieRating] ✅ Rating saved: ${newRating}/10 for movie ${internalMovieId}`)
      return true
    } catch (err) {
      console.error('[useMovieRating] Exception:', err)
      setError(err.message)
      return false
    } finally {
      setSaving(false)
    }
  }

  return { 
    rating, 
    loading, 
    saving, 
    error, 
    saveRating,
    hasRated: rating > 0
  }
}
