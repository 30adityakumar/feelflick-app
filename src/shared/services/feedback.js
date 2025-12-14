// src/shared/services/feedback.js

/**
 * FeelFlick Feedback Service
 * 
 * Handles user movie feedback including:
 * - Sentiment tracking (loved, liked, meh, disliked, hated)
 * - Viewing context tags (mood match, great reviews, etc.)
 * - What stood out (acting, story, visuals, etc.)
 * - Watched confirmation from watchlist
 * 
 * @module feedback
 */

import { supabase } from '@/shared/lib/supabase/client'

/**
 * Submit or update user feedback for a movie
 * 
 * @param {string} userId - User UUID
 * @param {number} tmdbId - TMDB movie ID
 * @param {Object} feedbackData - Feedback payload
 * @param {string} [feedbackData.sentiment] - 'loved', 'liked', 'meh', 'disliked', 'hated'
 * @param {boolean} [feedbackData.watchedConfirmed] - Did user watch this?
 * @param {string[]} [feedbackData.viewingContextTags] - Why they watched/added
 * @param {string[]} [feedbackData.whatStoodOut] - What impressed them
 * @returns {Promise<Object>} The created/updated feedback record
 */
export async function submitFeedback(userId, tmdbId, feedbackData) {
  try {
    console.log('[submitFeedback] Submitting:', { userId, tmdbId, feedbackData })

    // Validate required fields
    if (!userId) throw new Error('User ID is required')
    if (!tmdbId) throw new Error('TMDB ID is required')

    // Build the payload
    const payload = {
      user_id: userId,
      tmdb_id: tmdbId,
      feedback_type: 'sentiment', // Default type
      sentiment: feedbackData.sentiment || null,
      watched_confirmed: feedbackData.watchedConfirmed || false,
      viewing_context_tags: feedbackData.viewingContextTags || null,
      what_stood_out: feedbackData.whatStoodOut || null,
      updated_at: new Date().toISOString()
    }

    // Upsert (insert or update based on unique constraint)
    const { data, error } = await supabase
      .from('user_movie_feedback')
      .upsert(payload, {
        onConflict: 'user_id,tmdb_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      console.error('[submitFeedback] Database error:', error)
      throw error
    }

    console.log('[submitFeedback] Success:', data)
    return data

  } catch (error) {
    console.error('[submitFeedback] Error:', error)
    throw error
  }
}

/**
 * Get user's feedback for a specific movie
 * 
 * @param {string} userId - User UUID
 * @param {number} tmdbId - TMDB movie ID
 * @returns {Promise<Object|null>} Feedback record or null if not found
 */
export async function getFeedback(userId, tmdbId) {
  try {
    const { data, error } = await supabase
      .from('user_movie_feedback')
      .select('*')
      .eq('user_id', userId)
      .eq('tmdb_id', tmdbId)
      .maybeSingle()

    if (error) {
      console.error('[getFeedback] Database error:', error)
      throw error
    }

    return data

  } catch (error) {
    console.error('[getFeedback] Error:', error)
    return null
  }
}

/**
 * Get all feedback for a user (with optional filters)
 * 
 * @param {string} userId - User UUID
 * @param {Object} [filters] - Optional filters
 * @param {string} [filters.sentiment] - Filter by sentiment
 * @param {boolean} [filters.watchedConfirmed] - Filter by watched status
 * @param {number} [filters.limit] - Limit results (default 100)
 * @returns {Promise<Array>} Array of feedback records
 */
export async function getUserFeedback(userId, filters = {}) {
  try {
    let query = supabase
      .from('user_movie_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.sentiment) {
      query = query.eq('sentiment', filters.sentiment)
    }

    if (filters.watchedConfirmed !== undefined) {
      query = query.eq('watched_confirmed', filters.watchedConfirmed)
    }

    // Apply limit
    const limit = filters.limit || 100
    query = query.limit(limit)

    const { data, error } = await query

    if (error) {
      console.error('[getUserFeedback] Database error:', error)
      throw error
    }

    return data || []

  } catch (error) {
    console.error('[getUserFeedback] Error:', error)
    return []
  }
}

/**
 * Update sentiment only (quick feedback)
 * 
 * @param {string} userId - User UUID
 * @param {number} tmdbId - TMDB movie ID
 * @param {string} sentiment - 'loved', 'liked', 'meh', 'disliked', 'hated'
 * @returns {Promise<Object>} Updated feedback record
 */
export async function updateSentiment(userId, tmdbId, sentiment) {
  try {
    console.log('[updateSentiment] Updating sentiment:', { userId, tmdbId, sentiment })

    // Validate sentiment value
    const validSentiments = ['loved', 'liked', 'meh', 'disliked', 'hated']
    if (!validSentiments.includes(sentiment)) {
      throw new Error(`Invalid sentiment: ${sentiment}`)
    }

    return await submitFeedback(userId, tmdbId, { sentiment })

  } catch (error) {
    console.error('[updateSentiment] Error:', error)
    throw error
  }
}

/**
 * Mark movie as watched (from watchlist)
 * 
 * @param {string} userId - User UUID
 * @param {number} tmdbId - TMDB movie ID
 * @param {string} [sentiment] - Optional sentiment to include
 * @returns {Promise<Object>} Updated feedback record
 */
export async function markAsWatched(userId, tmdbId, sentiment = null) {
  try {
    console.log('[markAsWatched] Marking as watched:', { userId, tmdbId, sentiment })

    const feedbackData = {
      watchedConfirmed: true,
      sentiment: sentiment
    }

    return await submitFeedback(userId, tmdbId, feedbackData)

  } catch (error) {
    console.error('[markAsWatched] Error:', error)
    throw error
  }
}

/**
 * Delete feedback (rare, but available)
 * 
 * @param {string} userId - User UUID
 * @param {number} tmdbId - TMDB movie ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteFeedback(userId, tmdbId) {
  try {
    const { error } = await supabase
      .from('user_movie_feedback')
      .delete()
      .eq('user_id', userId)
      .eq('tmdb_id', tmdbId)

    if (error) {
      console.error('[deleteFeedback] Database error:', error)
      throw error
    }

    console.log('[deleteFeedback] Deleted successfully')
    return true

  } catch (error) {
    console.error('[deleteFeedback] Error:', error)
    return false
  }
}

/**
 * Get feedback statistics for a user
 * 
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Statistics object
 */
export async function getFeedbackStats(userId) {
  try {
    const { data, error } = await supabase
      .from('user_movie_feedback')
      .select('sentiment, watched_confirmed')
      .eq('user_id', userId)

    if (error) {
      console.error('[getFeedbackStats] Database error:', error)
      throw error
    }

    // Calculate stats
    const stats = {
      total: data.length,
      watched: data.filter(f => f.watched_confirmed).length,
      bySentiment: {
        loved: data.filter(f => f.sentiment === 'loved').length,
        liked: data.filter(f => f.sentiment === 'liked').length,
        meh: data.filter(f => f.sentiment === 'meh').length,
        disliked: data.filter(f => f.sentiment === 'disliked').length,
        hated: data.filter(f => f.sentiment === 'hated').length
      }
    }

    return stats

  } catch (error) {
    console.error('[getFeedbackStats] Error:', error)
    return {
      total: 0,
      watched: 0,
      bySentiment: {
        loved: 0,
        liked: 0,
        meh: 0,
        disliked: 0,
        hated: 0
      }
    }
  }
}
