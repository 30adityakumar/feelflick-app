// src/shared/hooks/useUserMovieStatus.js
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { ensureMovieInDb } from '@/shared/lib/movies/ensureMovieInDb'
import { recommendationCache } from '@/shared/lib/cache'

/**
 * Handles user_movie status: watchlist + watched (history)
 *
 * Defensive notes:
 * - Some callers have historically invoked this hook with a null/undefined argument.
 *   We therefore accept `params` as optional and default to an empty object.
 *
 * @param {object} params
 * @param {object | null} params.user - Supabase auth user
 * @param {object | null} params.movie - Movie object
 * @param {number | null} params.internalMovieId - Explicit internal DB ID (if known)
 * @param {string} params.source - e.g. 'hero_slider', 'hero_top_pick'
 */
export function useUserMovieStatus(params = {}) {
  // Handle accidental null being passed as the first argument
  const safeParams = params ?? {}

  const {
    user = null,
    movie = null,
    internalMovieId: explicitInternalId = null,
    source = null
  } = safeParams

  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [isWatched, setIsWatched] = useState(false)
  const [resolvedInternalId, setResolvedInternalId] = useState(null)
  const [loading, setLoading] = useState({ watchlist: false, watched: false })

  // Stable identifier for dependency tracking
  // - If movie comes from DB, we prefer tmdb_id (stable external key)
  // - If movie comes from TMDB API, `movie.id` is the TMDB id
  const movieKey = movie?.tmdb_id ?? movie?.id ?? null

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

        // Priority 1: Use explicitly passed internal ID (even if 0, though unlikely)
        if (explicitInternalId !== null && explicitInternalId !== undefined) {
          internalId = explicitInternalId
          console.log('[useUserMovieStatus] Using explicit internalId:', internalId)
        }
        // Priority 2: Movie has tmdb_id field => it's from our DB; movie.id is internal
        else if (movie?.tmdb_id && movie?.id) {
          internalId = movie.id
          console.log('[useUserMovieStatus] Movie from DB, using movie.id:', internalId)
        }
        // Priority 3: Movie from TMDB API, need to look up/create in our DB
        else if (movie?.id) {
          console.log('[useUserMovieStatus] Movie from TMDB API, calling ensureMovieInDb')
          internalId = await ensureMovieInDb(movie)
          console.log('[useUserMovieStatus] ensureMovieInDb returned:', internalId)
        }

        if (!mounted) return

        if (!internalId) {
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

    return () => {
      mounted = false
    }
  }, [user?.id, movieKey, explicitInternalId])

  const toggleWatchlist = useCallback(async () => {
    if (!user?.id || !resolvedInternalId || loading.watchlist) return

    setLoading(prev => ({ ...prev, watchlist: true }))
    const wasInWatchlist = isInWatchlist

    try {
      console.log('[toggleWatchlist] Using movie_id:', resolvedInternalId)

      if (wasInWatchlist) {
        // Optimistic update
        setIsInWatchlist(false)

        const { error } = await supabase
          .from('user_watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', resolvedInternalId)

        if (error) throw error
      } else {
        // Optimistic update
        setIsInWatchlist(true)
        setIsWatched(false)

        const { error } = await supabase
          .from('user_watchlist')
          .upsert(
            {
              user_id: user.id,
              movie_id: resolvedInternalId,
              added_at: new Date().toISOString(),
              status: 'want_to_watch'
            },
            { onConflict: 'user_id,movie_id' }
          )

        if (error) throw error

        await supabase
          .from('user_history')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', resolvedInternalId)
      }

      // Invalidate cache after successful action
      recommendationCache.invalidateUser(user.id)
      console.log('[Cache] Invalidated after watchlist toggle')
    } catch (err) {
      console.error('[toggleWatchlist] error:', err)
      // revert optimistic update
      setIsInWatchlist(wasInWatchlist)
    } finally {
      setLoading(prev => ({ ...prev, watchlist: false }))
    }
  }, [user?.id, user, resolvedInternalId, loading.watchlist, isInWatchlist])

  const toggleWatched = useCallback(async () => {
    if (!user?.id || !resolvedInternalId || loading.watched) return

    setLoading(prev => ({ ...prev, watched: true }))
    const wasWatched = isWatched

    try {
      console.log('[toggleWatched] Using movie_id:', resolvedInternalId)

      if (wasWatched) {
        // Optimistic update
        setIsWatched(false)

        const { error } = await supabase
          .from('user_history')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', resolvedInternalId)

        if (error) throw error
      } else {
        // Optimistic update
        setIsWatched(true)
        setIsInWatchlist(false)

        const { error } = await supabase.from('user_history').insert({
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

      // Invalidate cache after successful action
      recommendationCache.invalidateUser(user.id)
      console.log('[Cache] Invalidated after watched toggle')
    } catch (err) {
      console.error('[toggleWatched] error:', err)
      // revert optimistic update
      setIsWatched(wasWatched)
    } finally {
      setLoading(prev => ({ ...prev, watched: false }))
    }
  }, [user?.id, user, resolvedInternalId, loading.watched, isWatched, source])

  return {
    isInWatchlist,
    isWatched,
    loading,
    toggleWatchlist,
    toggleWatched
  }
}
