// src/shared/hooks/useUserMovieStatus.js
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { ensureMovieInDb } from '@/shared/lib/movies/ensureMovieInDb'

/**
 * Handles user_movie status: watchlist + watched (history)
 *
 * @param {object} params
 * @param {object | null} params.user - Supabase auth user
 * @param {object | null} params.movie - Movie object
 * @param {number | null} params.internalMovieId - Explicit internal DB ID (if known)
 * @param {string} params.source - e.g. 'hero_slider', 'hero_top_pick'
 */
export function useUserMovieStatus({ user, movie, internalMovieId: explicitInternalId, source }) {
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [isWatched, setIsWatched] = useState(false)
  const [resolvedInternalId, setResolvedInternalId] = useState(null)
  const [loading, setLoading] = useState({ watchlist: false, watched: false })

  // Stable identifier for dependency tracking
  const movieKey = movie?.tmdb_id || movie?.id

  // Resolve internal ID and sync status
  useEffect(() => {
    if (!user?.id || !movie) {
      setIsInWatchlist(false)
      setIsWatched(false)
      setResolvedInternalId(null)
      return
    }

    let mounted = true

    ;(async () => {
      try {
        let internalId = null

        // Priority 1: Use explicitly passed internal ID
        if (explicitInternalId) {
          internalId = explicitInternalId
          console.log('[useUserMovieStatus] Using explicit internalId:', internalId)
        }
        // Priority 2: Movie has tmdb_id field = it's from our DB, movie.id IS internal
        else if (movie.tmdb_id && movie.id) {
          internalId = movie.id
          console.log('[useUserMovieStatus] Movie from DB, using movie.id:', internalId)
        }
        // Priority 3: Movie from TMDB API, need to look up/create
        else if (movie.id) {
          console.log('[useUserMovieStatus] Movie from TMDB API, calling ensureMovieInDb')
          internalId = await ensureMovieInDb(movie)
          console.log('[useUserMovieStatus] ensureMovieInDb returned:', internalId)
        }

        if (!internalId || !mounted) {
          console.warn('[useUserMovieStatus] Could not resolve internal ID')
          return
        }

        setResolvedInternalId(internalId)

        // Query current status
        const [wlRes, whRes] = await Promise.all([
          supabase
            .from('user_watchlist')
            .select('movie_id')
            .eq('user_id', user.id)
            .eq('movie_id', internalId)
            .maybeSingle(),
          supabase
            .from('user_history')
            .select('movie_id')
            .eq('user_id', user.id)
            .eq('movie_id', internalId)
            .maybeSingle()
        ])

        if (!mounted) return

        setIsInWatchlist(Boolean(wlRes.data))
        setIsWatched(Boolean(whRes.data))
        
        console.log('[useUserMovieStatus] Status synced:', {
          internalId,
          isInWatchlist: Boolean(wlRes.data),
          isWatched: Boolean(whRes.data)
        })
      } catch (err) {
        console.error('[useUserMovieStatus] sync error:', err)
      }
    })()

    return () => { mounted = false }
  }, [user?.id, movieKey, explicitInternalId])

  const toggleWatchlist = useCallback(async () => {
    if (!user || !resolvedInternalId || loading.watchlist) return

    setLoading(prev => ({ ...prev, watchlist: true }))
    const wasInWatchlist = isInWatchlist

    try {
      console.log('[toggleWatchlist] Using movie_id:', resolvedInternalId)

      if (wasInWatchlist) {
        setIsInWatchlist(false)

        const { error } = await supabase
          .from('user_watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', resolvedInternalId)

        if (error) throw error
      } else {
        setIsInWatchlist(true)
        setIsWatched(false)

        const { error } = await supabase
          .from('user_watchlist')
          .upsert({
            user_id: user.id,
            movie_id: resolvedInternalId,
            added_at: new Date().toISOString(),
            status: 'want_to_watch'
          }, { onConflict: 'user_id,movie_id' })

        if (error) throw error

        await supabase
          .from('user_history')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', resolvedInternalId)
      }
    } catch (err) {
      console.error('[toggleWatchlist] error:', err)
      setIsInWatchlist(wasInWatchlist)
    } finally {
      setLoading(prev => ({ ...prev, watchlist: false }))
    }
  }, [user, resolvedInternalId, loading.watchlist, isInWatchlist])

  const toggleWatched = useCallback(async () => {
    if (!user || !resolvedInternalId || loading.watched) return

    setLoading(prev => ({ ...prev, watched: true }))
    const wasWatched = isWatched

    try {
      console.log('[toggleWatched] Using movie_id:', resolvedInternalId)

      if (wasWatched) {
        setIsWatched(false)

        const { error } = await supabase
          .from('user_history')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', resolvedInternalId)

        if (error) throw error
      } else {
        setIsWatched(true)
        setIsInWatchlist(false)

        const { error } = await supabase
          .from('user_history')
          .insert({
            user_id: user.id,
            movie_id: resolvedInternalId,
            watched_at: new Date().toISOString(),
            source,
            watch_duration_minutes: null,
            mood_session_id: null
          })

        if (error) throw error

        await supabase
          .from('user_watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', resolvedInternalId)
      }
    } catch (err) {
      console.error('[toggleWatched] error:', err)
      setIsWatched(wasWatched)
    } finally {
      setLoading(prev => ({ ...prev, watched: false }))
    }
  }, [user, resolvedInternalId, loading.watched, isWatched, source])

  return {
    isInWatchlist,
    isWatched,
    loading,
    toggleWatchlist,
    toggleWatched
  }
}