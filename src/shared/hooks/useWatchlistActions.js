// src/shared/hooks/useWatchlistActions.js

/**
 * FeelFlick Enhanced Watchlist Actions Hook
 * 
 * React hook for managing watchlist operations with new fields:
 * - Add/remove with context (reason, priority, source)
 * - Status updates (want_to_watch → watching → watched)
 * - Priority management
 * - Optimistic updates for better UX
 * - UI state management for prompts
 * 
 * @module useWatchlistActions
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import {
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlistStatus,
  updateWatchlistPriority,
  updateWatchlistEntry,
  getWatchlistEntry,
  isInWatchlist
} from '@/shared/services/watchlist'

/**
 * Get current user ID
 */
function useUserId() {
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    fetchUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return userId
}

/**
 * Main hook for watchlist actions
 * 
 * @param {number} movieId - Internal movie ID (from movies table)
 * @param {Object} [options] - Hook options
 * @param {boolean} [options.autoFetch] - Auto-fetch watchlist status on mount (default true)
 * @returns {Object} Watchlist state and actions
 */
export function useWatchlistActions(movieId, options = {}) {
  const { autoFetch = true } = options
  
  const userId = useUserId()
  
  // State
  const [entry, setEntry] = useState(null)
  const [isInList, setIsInList] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  /**
   * Fetch watchlist entry
   */
  const fetchEntry = useCallback(async () => {
    if (!userId || !movieId) return

    setLoading(true)
    setError(null)

    try {
      const data = await getWatchlistEntry(userId, movieId)
      setEntry(data)
      setIsInList(!!data)
    } catch (err) {
      console.error('[useWatchlistActions] Fetch error:', err)
      setError(err.message || 'Failed to load watchlist status')
    } finally {
      setLoading(false)
    }
  }, [userId, movieId])

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && userId && movieId) {
      fetchEntry()
    }
  }, [autoFetch, userId, movieId, fetchEntry])

  /**
   * Add to watchlist with context
   */
  const add = useCallback(async (context = {}) => {
    if (!userId || !movieId) {
      throw new Error('User ID and Movie ID are required')
    }

    setSubmitting(true)
    setError(null)

    try {
      // Optimistic update
      setIsInList(true)

      // Add to database
      const result = await addToWatchlist(userId, movieId, context)
      
      // Update with server response
      setEntry(result)
      
      return result

    } catch (err) {
      console.error('[useWatchlistActions] Add error:', err)
      setError(err.message || 'Failed to add to watchlist')
      
      // Revert optimistic update
      setIsInList(false)
      
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [userId, movieId])

  /**
   * Remove from watchlist
   */
  const remove = useCallback(async () => {
    if (!userId || !movieId) {
      throw new Error('User ID and Movie ID are required')
    }

    setSubmitting(true)
    setError(null)

    try {
      // Optimistic update
      setIsInList(false)
      const previousEntry = entry
      setEntry(null)

      // Remove from database
      await removeFromWatchlist(userId, movieId)
      
      return true

    } catch (err) {
      console.error('[useWatchlistActions] Remove error:', err)
      setError(err.message || 'Failed to remove from watchlist')
      
      // Revert optimistic update
      setIsInList(true)
      setEntry(previousEntry)
      
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [userId, movieId, entry])

  /**
   * Toggle watchlist (add/remove)
   */
  const toggle = useCallback(async (context = {}) => {
    if (isInList) {
      return await remove()
    } else {
      return await add(context)
    }
  }, [isInList, add, remove])

  /**
   * Update status
   */
  const setStatus = useCallback(async (status) => {
    if (!userId || !movieId) {
      throw new Error('User ID and Movie ID are required')
    }

    setSubmitting(true)
    setError(null)

    try {
      // Optimistic update
      setEntry(prev => ({ ...prev, status }))

      // Update in database
      const result = await updateWatchlistStatus(userId, movieId, status)
      
      // Update with server response
      setEntry(result)
      
      return result

    } catch (err) {
      console.error('[useWatchlistActions] Status update error:', err)
      setError(err.message || 'Failed to update status')
      
      // Revert optimistic update
      await fetchEntry()
      
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [userId, movieId, fetchEntry])

  /**
   * Update priority
   */
  const setPriority = useCallback(async (priority) => {
    if (!userId || !movieId) {
      throw new Error('User ID and Movie ID are required')
    }

    setSubmitting(true)
    setError(null)

    try {
      // Optimistic update
      setEntry(prev => ({ ...prev, priority }))

      // Update in database
      const result = await updateWatchlistPriority(userId, movieId, priority)
      
      // Update with server response
      setEntry(result)
      
      return result

    } catch (err) {
      console.error('[useWatchlistActions] Priority update error:', err)
      setError(err.message || 'Failed to update priority')
      
      // Revert optimistic update
      await fetchEntry()
      
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [userId, movieId, fetchEntry])

  /**
   * Update any fields
   */
  const update = useCallback(async (updates) => {
    if (!userId || !movieId) {
      throw new Error('User ID and Movie ID are required')
    }

    setSubmitting(true)
    setError(null)

    try {
      // Optimistic update
      setEntry(prev => ({ ...prev, ...updates }))

      // Update in database
      const result = await updateWatchlistEntry(userId, movieId, updates)
      
      // Update with server response
      setEntry(result)
      
      return result

    } catch (err) {
      console.error('[useWatchlistActions] Update error:', err)
      setError(err.message || 'Failed to update watchlist entry')
      
      // Revert optimistic update
      await fetchEntry()
      
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [userId, movieId, fetchEntry])

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // State
    entry,
    isInList,
    loading,
    error,
    submitting,
    
    // Derived state
    status: entry?.status || null,
    priority: entry?.priority || null,
    reasonAdded: entry?.reason_added || null,
    daysInWatchlist: entry?.days_in_watchlist || 0,
    watchedAt: entry?.watched_at || null,
    
    // Actions
    add,
    remove,
    toggle,
    setStatus,
    setPriority,
    update,
    refetch: fetchEntry,
    clearError
  }
}

/**
 * Hook for managing "Add to Watchlist" prompt UI state
 * Shows modal asking why they're adding it
 * 
 * @returns {Object} Prompt state and controls
 */
export function useAddToWatchlistPrompt() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedReasons, setSelectedReasons] = useState([])
  const [selectedPriority, setSelectedPriority] = useState(5) // Default medium
  const [pendingMovieId, setPendingMovieId] = useState(null)

  const open = useCallback((movieId) => {
    setPendingMovieId(movieId)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setSelectedReasons([])
    setSelectedPriority(5)
    setPendingMovieId(null)
  }, [])

  const toggleReason = useCallback((reason) => {
    setSelectedReasons(prev => {
      if (prev.includes(reason)) {
        return prev.filter(r => r !== reason)
      } else {
        return [...prev, reason]
      }
    })
  }, [])

  const isReasonSelected = useCallback((reason) => {
    return selectedReasons.includes(reason)
  }, [selectedReasons])

  return {
    isOpen,
    pendingMovieId,
    selectedReasons,
    selectedPriority,
    open,
    close,
    toggleReason,
    isReasonSelected,
    setPriority: setSelectedPriority
  }
}

/**
 * Hook for managing "Watchlist Status" prompt UI state
 * Shows modal asking "Did you watch this?"
 * 
 * @returns {Object} Prompt state and controls
 */
export function useWatchlistStatusPrompt() {
  const [isOpen, setIsOpen] = useState(false)
  const [pendingEntry, setPendingEntry] = useState(null)

  const open = useCallback((entry) => {
    setPendingEntry(entry)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setPendingEntry(null)
  }, [])

  return {
    isOpen,
    pendingEntry,
    open,
    close
  }
}

/**
 * Hook for managing watchlist bulk operations
 * Useful for batch status updates
 * 
 * @returns {Object} Bulk operation state and functions
 */
export function useBulkWatchlistActions() {
  const userId = useUserId()
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  /**
   * Update multiple entries
   */
  const bulkUpdate = useCallback(async (updates) => {
    if (!userId || updates.length === 0) return

    setProcessing(true)
    setProgress({ current: 0, total: updates.length })

    const results = {
      success: [],
      failed: []
    }

    for (let i = 0; i < updates.length; i++) {
      const update = updates[i]
      
      try {
        await updateWatchlistEntry(userId, update.movieId, update.fields)
        results.success.push(update.movieId)
      } catch (error) {
        console.error('[useBulkWatchlistActions] Failed for:', update.movieId, error)
        results.failed.push({ movieId: update.movieId, error })
      }
      
      setProgress({ current: i + 1, total: updates.length })
    }

    setProcessing(false)
    return results
  }, [userId])

  /**
   * Mark multiple as watched
   */
  const bulkMarkWatched = useCallback(async (movieIds) => {
    const updates = movieIds.map(movieId => ({
      movieId,
      fields: { status: 'watched', watched_at: new Date().toISOString() }
    }))

    return await bulkUpdate(updates)
  }, [bulkUpdate])

  /**
   * Update priorities for multiple entries
   */
  const bulkSetPriority = useCallback(async (entries) => {
    const updates = entries.map(({ movieId, priority }) => ({
      movieId,
      fields: { priority }
    }))

    return await bulkUpdate(updates)
  }, [bulkUpdate])

  return {
    processing,
    progress,
    bulkUpdate,
    bulkMarkWatched,
    bulkSetPriority
  }
}

/**
 * Hook for watchlist statistics and insights
 * Useful for watchlist dashboard/overview
 * 
 * @returns {Object} Statistics and derived insights
 */
export function useWatchlistInsights() {
  const userId = useUserId()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchStats = useCallback(async () => {
    if (!userId) return

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('user_watchlist')
        .select('status, priority, watched_at, added_at')
        .eq('user_id', userId)

      if (error) throw error

      // Calculate insights
      const now = new Date()
      const insights = {
        total: data.length,
        byStatus: {
          want_to_watch: data.filter(e => e.status === 'want_to_watch').length,
          watching: data.filter(e => e.status === 'watching').length,
          watched: data.filter(e => e.status === 'watched').length,
          abandoned: data.filter(e => e.status === 'abandoned').length
        },
        byPriority: {
          high: data.filter(e => e.priority >= 8).length,
          medium: data.filter(e => e.priority >= 5 && e.priority < 8).length,
          low: data.filter(e => e.priority < 5).length
        },
        recentlyWatched: data.filter(e => {
          if (!e.watched_at) return false
          const watchedDate = new Date(e.watched_at)
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return watchedDate >= weekAgo
        }).length,
        oldestEntry: data.reduce((oldest, entry) => {
          const addedDate = new Date(entry.added_at)
          return !oldest || addedDate < oldest ? addedDate : oldest
        }, null),
        newestEntry: data.reduce((newest, entry) => {
          const addedDate = new Date(entry.added_at)
          return !newest || addedDate > newest ? addedDate : newest
        }, null)
      }

      setStats(insights)

    } catch (error) {
      console.error('[useWatchlistInsights] Error:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      fetchStats()
    }
  }, [userId, fetchStats])

  return {
    stats,
    loading,
    refetch: fetchStats
  }
}
