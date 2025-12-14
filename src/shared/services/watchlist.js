// src/shared/services/watchlist.js

/**
 * FeelFlick Enhanced Watchlist Service
 * 
 * Manages user watchlist with new tracking fields:
 * - Status tracking (want_to_watch, watching, watched, abandoned)
 * - Reason for adding (mood_match, great_reviews, recommendation, etc.)
 * - Priority levels (1-10)
 * - Source tracking (where they added from)
 * 
 * @module watchlist
 */

import { supabase } from '@/shared/lib/supabase/client'

/**
 * Add movie to watchlist with context
 * 
 * @param {string} userId - User UUID
 * @param {number} movieId - Internal movie ID (from movies table)
 * @param {Object} [options] - Additional options
 * @param {string} [options.status] - 'want_to_watch', 'watching', 'watched', 'abandoned'
 * @param {string[]} [options.reasonAdded] - Why they're adding it
 * @param {number} [options.priority] - 1-10 priority (higher = more urgent)
 * @param {string} [options.source] - Where they added from ('homepage', 'search', etc.)
 * @returns {Promise<Object>} Created watchlist entry
 */
export async function addToWatchlist(userId, movieId, options = {}) {
  try {
    console.log('[addToWatchlist] Adding:', { userId, movieId, options })

    // Validate required fields
    if (!userId) throw new Error('User ID is required')
    if (!movieId) throw new Error('Movie ID is required')

    // Build payload
    const payload = {
      user_id: userId,
      movie_id: movieId,
      status: options.status || 'want_to_watch',
      reason_added: options.reasonAdded || null,
      priority: options.priority || 5, // Default medium priority
      source: options.source || 'unknown',
      added_at: new Date().toISOString()
    }

    // Insert
    const { data, error } = await supabase
      .from('user_watchlist')
      .insert(payload)
      .select(`
        *,
        movies!inner (
          id,
          tmdb_id,
          title,
          poster_path,
          release_year,
          runtime,
          ff_rating,
          genres
        )
      `)
      .single()

    if (error) {
      // Handle duplicate entry
      if (error.code === '23505') {
        console.warn('[addToWatchlist] Movie already in watchlist')
        // Return existing entry
        return await getWatchlistEntry(userId, movieId)
      }
      console.error('[addToWatchlist] Database error:', error)
      throw error
    }

    console.log('[addToWatchlist] Success:', data)
    return data

  } catch (error) {
    console.error('[addToWatchlist] Error:', error)
    throw error
  }
}

/**
 * Remove movie from watchlist
 * 
 * @param {string} userId - User UUID
 * @param {number} movieId - Internal movie ID
 * @returns {Promise<boolean>} Success status
 */
export async function removeFromWatchlist(userId, movieId) {
  try {
    console.log('[removeFromWatchlist] Removing:', { userId, movieId })

    const { error } = await supabase
      .from('user_watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movieId)

    if (error) {
      console.error('[removeFromWatchlist] Database error:', error)
      throw error
    }

    console.log('[removeFromWatchlist] Success')
    return true

  } catch (error) {
    console.error('[removeFromWatchlist] Error:', error)
    return false
  }
}

/**
 * Update watchlist entry
 * 
 * @param {string} userId - User UUID
 * @param {number} movieId - Internal movie ID
 * @param {Object} updates - Fields to update
 * @param {string} [updates.status] - New status
 * @param {number} [updates.priority] - New priority
 * @param {string[]} [updates.reasonAdded] - Update reasons
 * @param {Date} [updates.watchedAt] - When they watched it
 * @returns {Promise<Object>} Updated watchlist entry
 */
export async function updateWatchlistEntry(userId, movieId, updates) {
  try {
    console.log('[updateWatchlistEntry] Updating:', { userId, movieId, updates })

    // Build update payload
    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('user_watchlist')
      .update(payload)
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .select(`
        *,
        movies!inner (
          id,
          tmdb_id,
          title,
          poster_path,
          release_year,
          runtime,
          ff_rating,
          genres
        )
      `)
      .single()

    if (error) {
      console.error('[updateWatchlistEntry] Database error:', error)
      throw error
    }

    console.log('[updateWatchlistEntry] Success:', data)
    return data

  } catch (error) {
    console.error('[updateWatchlistEntry] Error:', error)
    throw error
  }
}

/**
 * Update watchlist status (quick status change)
 * 
 * @param {string} userId - User UUID
 * @param {number} movieId - Internal movie ID
 * @param {string} status - 'want_to_watch', 'watching', 'watched', 'abandoned'
 * @returns {Promise<Object>} Updated entry
 */
export async function updateWatchlistStatus(userId, movieId, status) {
  try {
    console.log('[updateWatchlistStatus] Updating status:', { userId, movieId, status })

    // Validate status
    const validStatuses = ['want_to_watch', 'watching', 'watched', 'abandoned']
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`)
    }

    const updates = { status }

    // If marking as watched, set watched_at timestamp
    if (status === 'watched') {
      updates.watched_at = new Date().toISOString()
    }

    return await updateWatchlistEntry(userId, movieId, updates)

  } catch (error) {
    console.error('[updateWatchlistStatus] Error:', error)
    throw error
  }
}

/**
 * Update watchlist priority
 * 
 * @param {string} userId - User UUID
 * @param {number} movieId - Internal movie ID
 * @param {number} priority - 1-10 (higher = more urgent)
 * @returns {Promise<Object>} Updated entry
 */
export async function updateWatchlistPriority(userId, movieId, priority) {
  try {
    console.log('[updateWatchlistPriority] Updating priority:', { userId, movieId, priority })

    // Validate priority
    if (priority < 1 || priority > 10) {
      throw new Error('Priority must be between 1 and 10')
    }

    return await updateWatchlistEntry(userId, movieId, { priority })

  } catch (error) {
    console.error('[updateWatchlistPriority] Error:', error)
    throw error
  }
}

/**
 * Get single watchlist entry
 * 
 * @param {string} userId - User UUID
 * @param {number} movieId - Internal movie ID
 * @returns {Promise<Object|null>} Watchlist entry or null
 */
export async function getWatchlistEntry(userId, movieId) {
  try {
    const { data, error } = await supabase
      .from('user_watchlist')
      .select(`
        *,
        movies!inner (
          id,
          tmdb_id,
          title,
          overview,
          poster_path,
          backdrop_path,
          release_year,
          runtime,
          ff_rating,
          ff_confidence,
          genres,
          director_name,
          lead_actor_name
        )
      `)
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .maybeSingle()

    if (error) {
      console.error('[getWatchlistEntry] Database error:', error)
      throw error
    }

    return data

  } catch (error) {
    console.error('[getWatchlistEntry] Error:', error)
    return null
  }
}

/**
 * Get user's full watchlist with filters
 * 
 * @param {string} userId - User UUID
 * @param {Object} [options] - Query options
 * @param {string} [options.status] - Filter by status
 * @param {number} [options.minPriority] - Minimum priority
 * @param {string} [options.orderBy] - 'added_at', 'priority', 'title'
 * @param {boolean} [options.ascending] - Sort direction (default false)
 * @returns {Promise<Array>} Watchlist entries with movie details
 */
export async function getWatchlist(userId, options = {}) {
  try {
    console.log('[getWatchlist] Fetching for user:', userId, options)

    let query = supabase
      .from('user_watchlist')
      .select(`
        *,
        movies!inner (
          id,
          tmdb_id,
          title,
          overview,
          poster_path,
          backdrop_path,
          release_year,
          runtime,
          ff_rating,
          ff_confidence,
          genres,
          director_name,
          lead_actor_name,
          trailer_youtube_key
        )
      `)
      .eq('user_id', userId)

    // Apply status filter
    if (options.status) {
      query = query.eq('status', options.status)
    }

    // Apply priority filter
    if (options.minPriority) {
      query = query.gte('priority', options.minPriority)
    }

    // Apply ordering
    const orderBy = options.orderBy || 'added_at'
    const ascending = options.ascending || false

    switch (orderBy) {
      case 'priority':
        query = query.order('priority', { ascending: false }) // High priority first
        query = query.order('added_at', { ascending: false }) // Then by recency
        break
      case 'title':
        // Note: Can't directly order by joined table, need to sort client-side
        query = query.order('added_at', { ascending: false })
        break
      default:
        query = query.order(orderBy, { ascending })
    }

    const { data, error } = await query

    if (error) {
      console.error('[getWatchlist] Database error:', error)
      throw error
    }

    // Client-side sorting if ordering by title
    if (orderBy === 'title' && data) {
      data.sort((a, b) => {
        const titleA = a.movies?.title || ''
        const titleB = b.movies?.title || ''
        return ascending 
          ? titleA.localeCompare(titleB)
          : titleB.localeCompare(titleA)
      })
    }

    console.log('[getWatchlist] Found:', data?.length || 0, 'entries')
    return data || []

  } catch (error) {
    console.error('[getWatchlist] Error:', error)
    return []
  }
}

/**
 * Get watchlist with enriched data (includes days in watchlist)
 * This is the helper function you already have in your database
 * 
 * @param {string} userId - User UUID
 * @param {string} [status] - Optional status filter
 * @returns {Promise<Array>} Enriched watchlist entries
 */
export async function getWatchlistWithStatus(userId, status = null) {
  try {
    console.log('[getWatchlistWithStatus] Fetching:', { userId, status })

    const { data, error } = await supabase
      .rpc('get_watchlist_with_status', {
        p_user_id: userId,
        p_status: status
      })

    if (error) {
      console.error('[getWatchlistWithStatus] RPC error:', error)
      throw error
    }

    console.log('[getWatchlistWithStatus] Found:', data?.length || 0, 'entries')
    return data || []

  } catch (error) {
    console.error('[getWatchlistWithStatus] Error:', error)
    return []
  }
}

/**
 * Check if movie is in watchlist
 * 
 * @param {string} userId - User UUID
 * @param {number} movieId - Internal movie ID
 * @returns {Promise<boolean>} Is in watchlist
 */
export async function isInWatchlist(userId, movieId) {
  try {
    const { count, error } = await supabase
      .from('user_watchlist')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('movie_id', movieId)

    if (error) {
      console.error('[isInWatchlist] Database error:', error)
      return false
    }

    return count > 0

  } catch (error) {
    console.error('[isInWatchlist] Error:', error)
    return false
  }
}

/**
 * Get watchlist statistics
 * 
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Statistics object
 */
export async function getWatchlistStats(userId) {
  try {
    const { data, error } = await supabase
      .from('user_watchlist')
      .select('status, priority, watched_at')
      .eq('user_id', userId)

    if (error) {
      console.error('[getWatchlistStats] Database error:', error)
      throw error
    }

    // Calculate stats
    const stats = {
      total: data.length,
      byStatus: {
        want_to_watch: data.filter(w => w.status === 'want_to_watch').length,
        watching: data.filter(w => w.status === 'watching').length,
        watched: data.filter(w => w.status === 'watched').length,
        abandoned: data.filter(w => w.status === 'abandoned').length
      },
      highPriority: data.filter(w => w.priority >= 8).length,
      mediumPriority: data.filter(w => w.priority >= 5 && w.priority < 8).length,
      lowPriority: data.filter(w => w.priority < 5).length,
      watchedThisMonth: data.filter(w => {
        if (!w.watched_at) return false
        const watchedDate = new Date(w.watched_at)
        const now = new Date()
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        return watchedDate >= monthAgo
      }).length
    }

    return stats

  } catch (error) {
    console.error('[getWatchlistStats] Error:', error)
    return {
      total: 0,
      byStatus: {
        want_to_watch: 0,
        watching: 0,
        watched: 0,
        abandoned: 0
      },
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
      watchedThisMonth: 0
    }
  }
}

/**
 * Bulk update watchlist statuses
 * 
 * @param {string} userId - User UUID
 * @param {Array<{movieId: number, status: string}>} updates - Array of updates
 * @returns {Promise<number>} Number of updated entries
 */
export async function bulkUpdateStatuses(userId, updates) {
  try {
    console.log('[bulkUpdateStatuses] Updating:', updates.length, 'entries')

    let successCount = 0

    // Process each update
    for (const update of updates) {
      try {
        await updateWatchlistStatus(userId, update.movieId, update.status)
        successCount++
      } catch (error) {
        console.error('[bulkUpdateStatuses] Failed for movieId:', update.movieId, error)
      }
    }

    console.log('[bulkUpdateStatuses] Success:', successCount, '/', updates.length)
    return successCount

  } catch (error) {
    console.error('[bulkUpdateStatuses] Error:', error)
    return 0
  }
}

/**
 * Get movies that have been in watchlist for too long
 * (Useful for "clean up your watchlist" prompts)
 * 
 * @param {string} userId - User UUID
 * @param {number} [daysThreshold] - Days threshold (default 90)
 * @returns {Promise<Array>} Stale watchlist entries
 */
export async function getStaleWatchlistEntries(userId, daysThreshold = 90) {
  try {
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold)

    const { data, error } = await supabase
      .from('user_watchlist')
      .select(`
        *,
        movies!inner (
          id,
          tmdb_id,
          title,
          poster_path,
          release_year,
          ff_rating
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'want_to_watch')
      .lt('added_at', thresholdDate.toISOString())
      .order('added_at', { ascending: true })

    if (error) {
      console.error('[getStaleWatchlistEntries] Database error:', error)
      throw error
    }

    return data || []

  } catch (error) {
    console.error('[getStaleWatchlistEntries] Error:', error)
    return []
  }
}
