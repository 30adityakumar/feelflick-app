/**
 * FeelFlick Feedback Service
 * 
 * Handles two types of feedback:
 * 1. user_movie_feedback - Quick thumbs up/down on recommendations
 * 2. user_movie_sentiment - Detailed feedback after watching
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
    console.log('[Feedback] Submitting recommendation feedback:', { 
      userId, 
      movieId, 
      feedbackValue,
      source 
    })

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
      console.log('[Feedback] Reset successful')
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

    console.log('[Feedback] ✅ Saved:', data)
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
// MOVIE SENTIMENT (Detailed After-Watch Feedback)
// ============================================================================

/**
 * Submit detailed sentiment after watching a movie
 * @param {string} userId - User UUID
 * @param {number} movieId - Internal database movie ID
 * @param {Object} sentimentData - Feedback data
 * @param {string} sentimentData.sentiment - 'loved', 'liked', 'meh', 'disliked', 'hated'
 * @param {string[]} [sentimentData.viewingContextTags] - Why they watched
 * @param {string[]} [sentimentData.whatStoodOut] - What impressed them
 * @param {string} [sentimentData.textFeedback] - Optional text comment
 * @returns {Promise<Object>}
 */
export async function submitMovieSentiment(userId, movieId, sentimentData) {
  try {
    console.log('[Sentiment] Submitting:', { userId, movieId, sentimentData })

    // Validate
    if (!userId) throw new Error('User ID required')
    if (!movieId) throw new Error('Movie ID required')
    if (!sentimentData.sentiment) throw new Error('Sentiment required')

    const validSentiments = ['loved', 'liked', 'meh', 'disliked', 'hated']
    if (!validSentiments.includes(sentimentData.sentiment)) {
      throw new Error(`Invalid sentiment: ${sentimentData.sentiment}`)
    }

    const payload = {
      user_id: userId,
      movie_id: movieId,
      sentiment: sentimentData.sentiment,
      viewing_context_tags: sentimentData.viewingContextTags || null,
      what_stood_out: sentimentData.whatStoodOut || null,
      text_feedback: sentimentData.textFeedback || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('user_movie_sentiment')
      .upsert(payload, {
        onConflict: 'user_id,movie_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) throw error

    console.log('[Sentiment] ✅ Saved:', data)
    return data

  } catch (error) {
    console.error('[Sentiment] ❌ Error:', error)
    throw error
  }
}

/**
 * Get user's sentiment for a movie
 */
export async function getMovieSentiment(userId, movieId) {
  try {
    const { data, error } = await supabase
      .from('user_movie_sentiment')
      .select('*')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .maybeSingle()

    if (error) throw error
    return data

  } catch (error) {
    console.error('[Sentiment] Error fetching:', error)
    return null
  }
}

/**
 * Quick sentiment update (just the sentiment, no tags)
 */
export async function updateQuickSentiment(userId, movieId, sentiment) {
  return submitMovieSentiment(userId, movieId, { sentiment })
}

/**
 * Delete sentiment feedback
 */
export async function deleteMovieSentiment(userId, movieId) {
  try {
    const { error } = await supabase
      .from('user_movie_sentiment')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movieId)

    if (error) throw error
    return true

  } catch (error) {
    console.error('[Sentiment] Delete error:', error)
    return false
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
    const [feedbackData, sentimentData] = await Promise.all([
      supabase
        .from('user_movie_feedback')
        .select('feedback_value')
        .eq('user_id', userId),
      supabase
        .from('user_movie_sentiment')
        .select('sentiment')
        .eq('user_id', userId)
    ])

    if (feedbackData.error) throw feedbackData.error
    if (sentimentData.error) throw sentimentData.error

    const feedback = feedbackData.data || []
    const sentiments = sentimentData.data || []

    return {
      recommendations: {
        total: feedback.length,
        positive: feedback.filter(f => f.feedback_value === 1).length,
        negative: feedback.filter(f => f.feedback_value === -1).length
      },
      sentiment: {
        total: sentiments.length,
        loved: sentiments.filter(s => s.sentiment === 'loved').length,
        liked: sentiments.filter(s => s.sentiment === 'liked').length,
        meh: sentiments.filter(s => s.sentiment === 'meh').length,
        disliked: sentiments.filter(s => s.sentiment === 'disliked').length,
        hated: sentiments.filter(s => s.sentiment === 'hated').length
      }
    }

  } catch (error) {
    console.error('[Stats] Error:', error)
    return {
      recommendations: { total: 0, positive: 0, negative: 0 },
      sentiment: { total: 0, loved: 0, liked: 0, meh: 0, disliked: 0, hated: 0 }
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

/**
 * Get all sentiment feedback for user
 */
export async function getUserSentimentFeedback(userId, filters = {}) {
  try {
    let query = supabase
      .from('user_movie_sentiment')
      .select('*, movies(tmdb_id, title, poster_path)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (filters.sentiment) {
      query = query.eq('sentiment', filters.sentiment)
    }

    const limit = filters.limit || 100
    query = query.limit(limit)

    const { data, error } = await query

    if (error) throw error
    return data || []

  } catch (error) {
    console.error('[Sentiment] Error fetching batch:', error)
    return []
  }
}
