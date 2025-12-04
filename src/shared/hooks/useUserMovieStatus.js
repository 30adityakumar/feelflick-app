// src/shared/hooks/useUserMovieStatus.js
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { ensureMovieInDb } from '@/shared/lib/movies/ensureMovieInDb'

/**
 * Handles user_movie status: watchlist + watched (history)
 * Reusable across HeroSlider, HeroTopPick, etc.
 *
 * @param {object} params
 * @param {object | null} params.user   - Supabase auth user
 * @param {object | null} params.movie  - TMDB movie (must have `id`)
 * @param {string} params.source        - e.g. 'hero_slider', 'hero_top_pick'
 */
export function useUserMovieStatus({ user, movie, source }) {
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [isWatched, setIsWatched] = useState(false)
  const [loading, setLoading] = useState({ watchlist: false, watched: false })

  // Initial sync from DB
  useEffect(() => {
    if (!user?.id || !movie?.id) return

    let mounted = true

    ;(async () => {
      try {
        const internalMovieId = await ensureMovieInDb(movie)
        if (!internalMovieId || !mounted) return

        const [wlRes, whRes] = await Promise.all([
          supabase
            .from('user_watchlist')
            .select('movie_id')
            .eq('user_id', user.id)
            .eq('movie_id', internalMovieId)
            .maybeSingle(),
          supabase
            .from('user_history')
            .select('movie_id')
            .eq('user_id', user.id)
            .eq('movie_id', internalMovieId)
            .maybeSingle()
        ])

        if (!mounted) return

        setIsInWatchlist(Boolean(wlRes.data))
        setIsWatched(Boolean(whRes.data))
      } catch (err) {
        console.error('[useUserMovieStatus] sync error:', err)
      }
    })()

    return () => {
      mounted = false
    }
  }, [user?.id, movie?.id])

  const toggleWatchlist = useCallback(async () => {
    if (!user || !movie || loading.watchlist) return

    setLoading(prev => ({ ...prev, watchlist: true }))

    try {
      const internalMovieId = await ensureMovieInDb(movie)
      if (!internalMovieId) return

      if (isInWatchlist) {
        setIsInWatchlist(false)

        await supabase
          .from('user_watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', internalMovieId)
      } else {
        setIsInWatchlist(true)
        setIsWatched(false)

        // Keep payload minimal (matches what works for you)
        await supabase
          .from('user_watchlist')
          .upsert(
            {
              user_id: user.id,
              movie_id: internalMovieId,
              added_at: new Date().toISOString(),
              status: 'want_to_watch'
            },
            { onConflict: 'user_id,movie_id' }
          )

        await supabase
          .from('user_history')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', internalMovieId)
      }
    } catch (err) {
      console.error('[useUserMovieStatus] toggleWatchlist error:', err)
    } finally {
      setLoading(prev => ({ ...prev, watchlist: false }))
    }
  }, [user, movie, loading.watchlist, isInWatchlist])

  const toggleWatched = useCallback(async () => {
    if (!user || !movie || loading.watched) return

    setLoading(prev => ({ ...prev, watched: true }))

    try {
      const internalMovieId = await ensureMovieInDb(movie)
      if (!internalMovieId) return

      if (isWatched) {
        setIsWatched(false)

        await supabase
          .from('user_history')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', internalMovieId)
      } else {
        setIsWatched(true)
        setIsInWatchlist(false)

        await supabase.from('user_history').insert({
          user_id: user.id,
          movie_id: internalMovieId,
          watched_at: new Date().toISOString(),
          source,
          watch_duration_minutes: null,
          mood_session_id: null
        })

        await supabase
          .from('user_watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', internalMovieId)
      }
    } catch (err) {
      console.error('[useUserMovieStatus] toggleWatched error:', err)
    } finally {
      setLoading(prev => ({ ...prev, watched: false }))
    }
  }, [user, movie, loading.watched, isWatched, source])

  return {
    isInWatchlist,
    isWatched,
    loading,
    toggleWatchlist,
    toggleWatched
  }
}
