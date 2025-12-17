/**
 * FeelFlick Interaction Tracking Service
 * Tracks user behavior for recommendation engine
 */

import { supabase } from '@/shared/lib/supabase/client'

let currentSessionId = null

/**
 * Initialize or resume session
 */
export async function initSession() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Check for active session (within last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    
    const { data: activeSessions } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', user.id)
      .is('ended_at', null)
      .gte('started_at', thirtyMinutesAgo)
      .order('started_at', { ascending: false })
      .limit(1)

    if (activeSessions && activeSessions.length > 0) {
      currentSessionId = activeSessions[0].id
      console.log('[Session] Resumed:', currentSessionId)
      return currentSessionId
    }

    // Create new session
    const deviceType = getDeviceType()
    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        device_type: deviceType,
        browser: navigator.userAgent.split('/')[0],
        referrer: document.referrer || 'direct'
      })
      .select()
      .single()

    if (error) throw error

    currentSessionId = data.id
    console.log('[Session] Created:', currentSessionId)
    return currentSessionId
  } catch (err) {
    console.error('[Session] Init error:', err)
    return null
  }
}

/**
 * End current session
 */
export async function endSession() {
  if (!currentSessionId) return

  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({
        ended_at: new Date().toISOString()
      })
      .eq('id', currentSessionId)

    if (error) throw error

    console.log('[Session] Ended:', currentSessionId)
    currentSessionId = null
  } catch (err) {
    console.error('[Session] End error:', err)
  }
}

/**
 * Track an interaction
 */
export async function trackInteraction(type, options = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // Ensure session exists
    if (!currentSessionId) {
      await initSession()
    }

    const {
      movieId = null,
      source = null,
      metadata = {},
      durationMs = null
    } = options

    const { error } = await supabase
      .from('user_interactions')
      .insert({
        user_id: user.id,
        movie_id: movieId,
        interaction_type: type,
        source: source,
        metadata: metadata,
        duration_ms: durationMs,
        session_id: currentSessionId
      })

    if (error) throw error

    // Update session interaction count
    if (currentSessionId) {
      await supabase.rpc('increment_session_interactions', {
        session_id: currentSessionId
      })
    }

    console.log(`[Interaction] Tracked: ${type}`, options)
    return true
  } catch (err) {
    console.error('[Interaction] Track error:', err)
    return false
  }
}

/**
 * Track movie view
 */
export function trackMovieView(movieId, source = 'unknown') {
  return trackInteraction('view', { movieId, source })
}

/**
 * Track movie hover (with duration)
 */
export function trackMovieHover(movieId, durationMs, source = 'unknown') {
  if (durationMs < 500) return // Ignore quick hovers
  return trackInteraction('hover', { movieId, source, durationMs })
}

/**
 * Track search query
 */
export function trackSearch(query, resultCount) {
  return trackInteraction('search', {
    metadata: { query, result_count: resultCount }
  })
}

/**
 * Track filter usage
 */
export function trackFilter(filterType, filterValue) {
  return trackInteraction('filter', {
    metadata: { filter_type: filterType, filter_value: filterValue }
  })
}

/**
 * Track trailer play
 */
export function trackTrailerPlay(movieId, source = 'unknown') {
  return trackInteraction('play_trailer', { movieId, source })
}

/**
 * Track movie share
 */
export function trackShare(movieId, source = 'unknown') {
  return trackInteraction('share', { movieId, source })
}

/**
 * Helper: Get device type
 */
function getDeviceType() {
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

// Auto-end session on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (currentSessionId) {
      // Use sendBeacon for reliable tracking on page close
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_sessions?id=eq.${currentSessionId}`,
        JSON.stringify({ ended_at: new Date().toISOString() })
      )
    }
  })
}
