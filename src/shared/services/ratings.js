// src/shared/services/ratings.js

/**
 * FeelFlick Ratings Service
 * 
 * Handles user star ratings (1-5 stars) with review text.
 * Connects to user_ratings table.
 * 
 * @module ratings
 */

import { supabase } from '@/shared/lib/supabase/client'

/**
 * Submit or update a rating for a movie
 * 
 * @param {string} userId - User UUID
 * @param {number} movieId - Internal movie ID (from movies table)
 * @param {number} rating - Rating value (1-5, can include decimals for half-stars)
 * @param {Object} [options] - Additional options
 * @param {string} [options.reviewText] - Optional review text
 * @param {string} [options.moodSessionId] - Mood session UUID if rated during recommendation
 * @returns {Promise<Object>} Created/updated rating
 */
export async function submitRating(userId, movieId, rating, options = {}) {
  try {
    console.log('[submitRating] Submitting:', { userId, movieId, rating, options })

    // Validate inputs
    if (!userId) throw new Error('User ID is required')
    if (!movieId) throw new Error('Movie ID is required')
    if (!rating || rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }

    // Build payload
    const payload = {
      user_id: userId,
      movie_id: movieId,
      rating: rating,
      review_text: options.reviewText || null,
      mood_session_id: options.moodSessionId || null,
      rated_at: new Date().toISOString()
    }

    // Upsert (insert or update if exists)
    const { data, error } = await supabase
      .from('user_ratings')
      .upsert(payload, {
        onConflict: 'user_id,movie_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      console.error('[submitRating] Database error:', error)
      throw error
    }

    console.log('[submitRating] Success:', data)
    return data

  } catch (error) {
    console.error('[submitRating] Error:', error)
    throw error
  }
}

/**
 * Get user's rating for a specific movie
 * 
 * @param {string} userId - User UUID
 * @param {number} movieId - Internal movie ID
 * @returns {Promise<Object|null>} Rating object or null
 */
export async function getRating(userId, movieId) {
  try {
    const { data, error } = await supabase
      .from('user_ratings')
      .select('*')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .maybeSingle()

    if (error) {
      console.error('[getRating] Database error:', error)
      throw error
    }

    return data

  } catch (error) {
    console.error('[getRating] Error:', error)
    return null
  }
}

/**
 * Delete a rating
 * 
 * @param {string} userId - User UUID
 * @param {number} movieId - Internal movie ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteRating(userId, movieId) {
  try {
    console.log('[deleteRating] Deleting:', { userId, movieId })

    const { error } = await supabase
      .from('user_ratings')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movieId)

    if (error) {
      console.error('[deleteRating] Database error:', error)
      throw error
    }

    console.log('[deleteRating] Success')
    return true

  } catch (error) {
    console.error('[deleteRating] Error:', error)
    return false
  }
}

/**
 * Get all ratings by a user
 * 
 * @param {string} userId - User UUID
 * @param {Object} [options] - Query options
 * @param {number} [options.minRating] - Minimum rating filter
 * @param {number} [options.maxRating] - Maximum rating filter
 * @param {number} [options.limit] - Limit results
 * @returns {Promise<Array>} Array of ratings with movie details
 */
export async function getUserRatings(userId, options = {}) {
  try {
    console.log('[getUserRatings] Fetching for user:', userId, options)

    let query = supabase
      .from('user_ratings')
      .select(`
        *,
        movies!inner (
          id,
          tmdb_id,
          title,
          poster_path,
          release_year,
          genres,
          runtime
        )
      `)
      .eq('user_id', userId)
      .order('rated_at', { ascending: false })

    // Apply filters
    if (options.minRating) {
      query = query.gte('rating', options.minRating)
    }
    if (options.maxRating) {
      query = query.lte('rating', options.maxRating)
    }
    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('[getUserRatings] Database error:', error)
      throw error
    }

    console.log('[getUserRatings] Found:', data?.length || 0)
    return data || []

  } catch (error) {
    console.error('[getUserRatings] Error:', error)
    return []
  }
}

/**
 * Get rating statistics for a user
 * 
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Statistics object
 */
export async function getRatingStats(userId) {
  try {
    const { data, error } = await supabase
      .from('user_ratings')
      .select('rating')
      .eq('user_id', userId)

    if (error) throw error

    if (!data || data.length === 0) {
      return {
        total: 0,
        average: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
    }

    // Calculate stats
    const total = data.length
    const sum = data.reduce((acc, r) => acc + r.rating, 0)
    const average = sum / total

    // Distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    data.forEach(r => {
      const rounded = Math.round(r.rating)
      distribution[rounded] = (distribution[rounded] || 0) + 1
    })

    return {
      total,
      average: Math.round(average * 10) / 10,
      distribution
    }

  } catch (error) {
    console.error('[getRatingStats] Error:', error)
    return {
      total: 0,
      average: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    }
  }
}
