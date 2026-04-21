/**
 * FeelFlick Feedback Service
 *
 * Handles user_movie_feedback — quick thumbs up/down on recommendations.
 * (user_movie_sentiment table was dropped; sentiment signals now come from ratings.)
 */

import { supabase } from '@/shared/lib/supabase/client'

// ============================================================================
// RECOMMENDATION FEEDBACK (Thumbs Up/Down)
// ============================================================================

/**
 * Submit thumbs up/down feedback on a recommendation
 * @param {string} userId - User UUID
 * @param {number} movieId - Internal database movie ID
 * @param {number} feedbackValue - 1 (good), -1 (bad), 0 (reset)
 * @param {string} [source='recommendation'] - Where feedback came from
 * @returns {Promise<Object>}
 */
export async function submitRecommendationFeedback(userId, movieId, feedbackValue, source = 'recommendation') {
  try {
    // Validate
    if (!userId) throw new Error('User ID required')
    if (!movieId) throw new Error('Movie ID required')
    if (![1, -1, 0].includes(feedbackValue)) {
      throw new Error('feedbackValue must be 1, -1, or 0')
    }

    // If feedback is 0 (reset), delete the record
    if (feedbackValue === 0) {
      const { error } = await supabase
        .from('user_movie_feedback')
        .delete()
        .eq('user_id', userId)
        .eq('movie_id', movieId)
      
      if (error) throw error
      return { deleted: true }
    }

    // Otherwise upsert
    const payload = {
      user_id: userId,
      movie_id: movieId,
      feedback_type: 'recommendation',
      feedback_value: feedbackValue,
      source: source,
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('user_movie_feedback')
      .upsert(payload, {
        onConflict: 'user_id,movie_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) throw error

    return data

  } catch (error) {
    console.error('[Feedback] ❌ Error:', error)
    throw error
  }
}

/**
 * Get user's feedback for a movie
 */
export async function getRecommendationFeedback(userId, movieId) {
  try {
    const { data, error } = await supabase
      .from('user_movie_feedback')
      .select('*')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .maybeSingle()

    if (error) throw error
    return data

  } catch (error) {
    console.error('[Feedback] Error fetching:', error)
    return null
  }
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

/**
 * Get feedback statistics for a user
 */
export async function getFeedbackStats(userId) {
  try {
    const { data: feedback, error } = await supabase
      .from('user_movie_feedback')
      .select('feedback_value')
      .eq('user_id', userId)

    if (error) throw error

    const items = feedback || []
    return {
      recommendations: {
        total: items.length,
        positive: items.filter(f => f.feedback_value === 1).length,
        negative: items.filter(f => f.feedback_value === -1).length
      },
    }

  } catch (error) {
    console.error('[Stats] Error:', error)
    return {
      recommendations: { total: 0, positive: 0, negative: 0 },
    }
  }
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Get all recommendations feedback for user
 */
export async function getUserRecommendationFeedback(userId, limit = 100) {
  try {
    const { data, error } = await supabase
      .from('user_movie_feedback')
      .select('*, movies(tmdb_id, title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []

  } catch (error) {
    console.error('[Feedback] Error fetching batch:', error)
    return []
  }
}
