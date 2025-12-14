// src/shared/services/events-tracker.js

/**
 * FeelFlick Events Tracking Service
 * 
 * Tracks user behavior to improve recommendations:
 * - Movie card hovers (interest signals)
 * - Detail page views
 * - Trailer plays
 * - Search queries
 * - Filter interactions
 * 
 * Events are batched and debounced to minimize database writes.
 * 
 * @module events-tracker
 */

import { supabase } from '@/shared/lib/supabase/client'

// Session ID for grouping events within a browsing session
let currentSessionId = null

/**
 * Generate or retrieve session ID
 * Session persists for browser tab lifetime
 */
function getSessionId() {
  if (!currentSessionId) {
    // Check sessionStorage first
    currentSessionId = sessionStorage.getItem('feelflick_session_id')
    
    if (!currentSessionId) {
      // Generate new session ID
      currentSessionId = crypto.randomUUID()
      sessionStorage.setItem('feelflick_session_id', currentSessionId)
    }
  }
  
  return currentSessionId
}

/**
 * Track a user event
 * 
 * @param {string} userId - User UUID
 * @param {string} eventType - Event type ('hover', 'view', 'trailer_play', etc.)
 * @param {number} [movieId] - TMDB movie ID (if applicable)
 * @param {Object} [metadata] - Additional event data
 * @returns {Promise<boolean>} Success status
 */
export async function trackEvent(userId, eventType, movieId = null, metadata = {}) {
  try {
    // Don't track if user not authenticated
    if (!userId) {
      console.warn('[trackEvent] No userId provided, skipping')
      return false
    }

    const sessionId = getSessionId()

    const payload = {
      user_id: userId,
      event_type: eventType,
      movie_id: movieId,
      metadata: metadata,
      session_id: sessionId,
      created_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('user_events')
      .insert(payload)

    if (error) {
      console.error('[trackEvent] Database error:', error)
      return false
    }

    console.log('[trackEvent] Tracked:', { eventType, movieId, metadata })
    return true

  } catch (error) {
    console.error('[trackEvent] Error:', error)
    return false
  }
}

/**
 * Track movie card hover (interest signal)
 * Debounced: only tracks if user hovers for 1.5+ seconds
 * 
 * @param {string} userId - User UUID
 * @param {number} movieId - TMDB movie ID
 * @param {number} duration - Hover duration in milliseconds
 * @param {Object} [context] - Where the hover occurred
 * @returns {Promise<boolean>}
 */
export async function trackHover(userId, movieId, duration, context = {}) {
  // Only track meaningful hovers (1.5+ seconds)
  if (duration < 1500) {
    return false
  }

  return trackEvent(userId, 'hover', movieId, {
    duration_ms: Math.round(duration),
    source: context.source || 'unknown', // 'home', 'search', 'watchlist', etc.
    row_title: context.rowTitle || null,
    position: context.position || null
  })
}

/**
 * Track movie detail page view
 * 
 * @param {string} userId - User UUID
 * @param {number} movieId - TMDB movie ID
 * @param {string} [source] - Where user came from
 * @returns {Promise<boolean>}
 */
export async function trackDetailView(userId, movieId, source = null) {
  return trackEvent(userId, 'detail_view', movieId, {
    source: source || 'direct',
    timestamp: Date.now()
  })
}

/**
 * Track trailer play
 * 
 * @param {string} userId - User UUID
 * @param {number} movieId - TMDB movie ID
 * @param {Object} [playData] - Playback metadata
 * @returns {Promise<boolean>}
 */
export async function trackTrailerPlay(userId, movieId, playData = {}) {
  return trackEvent(userId, 'trailer_play', movieId, {
    source: playData.source || 'detail_page',
    autoplay: playData.autoplay || false,
    ...playData
  })
}

/**
 * Track search query
 * 
 * @param {string} userId - User UUID
 * @param {string} query - Search query text
 * @param {number} resultsCount - Number of results returned
 * @returns {Promise<boolean>}
 */
export async function trackSearch(userId, query, resultsCount = 0) {
  return trackEvent(userId, 'search', null, {
    query: query.trim().toLowerCase(),
    results_count: resultsCount,
    query_length: query.length
  })
}

/**
 * Track filter/preference change
 * 
 * @param {string} userId - User UUID
 * @param {Object} filters - Applied filters
 * @returns {Promise<boolean>}
 */
export async function trackFilterChange(userId, filters) {
  return trackEvent(userId, 'filter_change', null, {
    filters: filters
  })
}

/**
 * Track recommendation row scroll
 * Helps understand which rows get attention
 * 
 * @param {string} userId - User UUID
 * @param {string} rowTitle - Row title/ID
 * @param {number} scrollDepth - How far user scrolled (0-100)
 * @returns {Promise<boolean>}
 */
export async function trackRowScroll(userId, rowTitle, scrollDepth) {
  return trackEvent(userId, 'row_scroll', null, {
    row_title: rowTitle,
    scroll_depth: Math.round(scrollDepth)
  })
}

/**
 * Get user's recent events (for debugging/analytics)
 * 
 * @param {string} userId - User UUID
 * @param {Object} [options] - Query options
 * @param {number} [options.limit] - Max results (default 50)
 * @param {string} [options.eventType] - Filter by event type
 * @param {string} [options.since] - ISO timestamp to fetch from
 * @returns {Promise<Array>} Array of events
 */
export async function getUserEvents(userId, options = {}) {
  try {
    let query = supabase
      .from('user_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (options.eventType) {
      query = query.eq('event_type', options.eventType)
    }

    if (options.since) {
      query = query.gte('created_at', options.since)
    }

    // Apply limit
    const limit = options.limit || 50
    query = query.limit(limit)

    const { data, error } = await query

    if (error) {
      console.error('[getUserEvents] Database error:', error)
      return []
    }

    return data || []

  } catch (error) {
    console.error('[getUserEvents] Error:', error)
    return []
  }
}

/**
 * Get event statistics for a user
 * 
 * @param {string} userId - User UUID
 * @param {string} [timeRange] - '24h', '7d', '30d', or 'all'
 * @returns {Promise<Object>} Event statistics
 */
export async function getEventStats(userId, timeRange = '7d') {
  try {
    // Calculate time filter
    let sinceDate = null
    if (timeRange !== 'all') {
      const now = new Date()
      const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720
      sinceDate = new Date(now - hours * 60 * 60 * 1000).toISOString()
    }

    let query = supabase
      .from('user_events')
      .select('event_type, movie_id')
      .eq('user_id', userId)

    if (sinceDate) {
      query = query.gte('created_at', sinceDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('[getEventStats] Database error:', error)
      return { total: 0, byType: {} }
    }

    // Calculate stats
    const byType = {}
    data.forEach(event => {
      byType[event.event_type] = (byType[event.event_type] || 0) + 1
    })

    return {
      total: data.length,
      byType,
      uniqueMovies: new Set(data.filter(e => e.movie_id).map(e => e.movie_id)).size,
      timeRange
    }

  } catch (error) {
    console.error('[getEventStats] Error:', error)
    return { total: 0, byType: {} }
  }
}

/**
 * Get most hovered movies (interest signals)
 * 
 * @param {string} userId - User UUID
 * @param {number} [limit] - Max results (default 20)
 * @returns {Promise<Array>} Movies with hover counts
 */
export async function getMostHoveredMovies(userId, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('user_events')
      .select('movie_id, metadata')
      .eq('user_id', userId)
      .eq('event_type', 'hover')
      .not('movie_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100) // Get recent hovers

    if (error) {
      console.error('[getMostHoveredMovies] Database error:', error)
      return []
    }

    // Aggregate by movie_id
    const hoverCounts = {}
    let totalDuration = {}

    data.forEach(event => {
      const movieId = event.movie_id
      hoverCounts[movieId] = (hoverCounts[movieId] || 0) + 1
      totalDuration[movieId] = (totalDuration[movieId] || 0) + (event.metadata?.duration_ms || 0)
    })

    // Convert to array and sort
    const results = Object.entries(hoverCounts)
      .map(([movieId, count]) => ({
        movie_id: parseInt(movieId),
        hover_count: count,
        total_duration_ms: totalDuration[movieId],
        avg_duration_ms: Math.round(totalDuration[movieId] / count)
      }))
      .sort((a, b) => b.hover_count - a.hover_count)
      .slice(0, limit)

    return results

  } catch (error) {
    console.error('[getMostHoveredMovies] Error:', error)
    return []
  }
}

/**
 * Clear old events (cleanup utility)
 * Call this periodically to remove events older than 90 days
 * 
 * @param {string} userId - User UUID
 * @param {number} [daysToKeep] - Days of history to keep (default 90)
 * @returns {Promise<number>} Number of events deleted
 */
export async function cleanupOldEvents(userId, daysToKeep = 90) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const { data, error } = await supabase
      .from('user_events')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', cutoffDate.toISOString())
      .select('id')

    if (error) {
      console.error('[cleanupOldEvents] Database error:', error)
      return 0
    }

    const deletedCount = data?.length || 0
    console.log(`[cleanupOldEvents] Deleted ${deletedCount} old events`)
    return deletedCount

  } catch (error) {
    console.error('[cleanupOldEvents] Error:', error)
    return 0
  }
}

// Export session utilities for advanced use cases
export { getSessionId }
