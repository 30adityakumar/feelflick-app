// src/app/pages/discover/hooks/useDiscoverTracking.js
import { useCallback, useRef } from 'react'

import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'

/**
 * Tracks Discover-specific recommendation events via the
 * `recommendation_impressions` table with placement='discover'.
 *
 * - `trackShown(films)` — bulk insert on first render of results
 * - `trackWatchlist(movieId)` — update added_to_watchlist_at
 * - `trackSeen(movieId)` — update clicked_at (marks as seen/engaged)
 * - `trackDismiss(movieId)` — update skipped=true
 *
 * @returns {{ trackShown, trackWatchlist, trackSeen, trackDismiss }}
 */
export function useDiscoverTracking() {
  const { userId } = useAuthSession()
  const trackedSetRef = useRef(new Set())

  /**
   * Log impression rows for all shown films. Idempotent — skips
   * films already tracked in this session.
   *
   * @param {Array<{ movie_id: number, match_percentage?: number, _briefReason?: string }>} films
   */
  const trackShown = useCallback(
    async (films) => {
      if (!userId || !films?.length) return

      const newFilms = films.filter(f => !trackedSetRef.current.has(f.movie_id))
      if (newFilms.length === 0) return

      const rows = newFilms.map((film) => ({
        user_id: userId,
        movie_id: film.movie_id,
        placement: 'discover',
        shown_at: new Date().toISOString(),
        pick_reason_type: 'brief',
        pick_reason_label: film._briefReason || null,
        score: film.match_percentage ?? null,
        algorithm_version: 'v3-brief',
      }))

      try {
        await supabase.from('recommendation_impressions').insert(rows)
        newFilms.forEach(f => trackedSetRef.current.add(f.movie_id))
      } catch (err) {
        console.error('[useDiscoverTracking] trackShown error:', err.message)
      }
    },
    [userId],
  )

  /**
   * Update impression row when user adds a film to watchlist.
   * @param {number} movieId
   */
  const trackWatchlist = useCallback(
    async (movieId) => {
      if (!userId) return
      try {
        await supabase
          .from('recommendation_impressions')
          .update({ added_to_watchlist_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('movie_id', movieId)
          .eq('placement', 'discover')
      } catch (err) {
        console.error('[useDiscoverTracking] trackWatchlist error:', err.message)
      }
    },
    [userId],
  )

  /**
   * Update impression row when user marks a film as seen.
   * @param {number} movieId
   */
  const trackSeen = useCallback(
    async (movieId) => {
      if (!userId) return
      try {
        await supabase
          .from('recommendation_impressions')
          .update({ clicked_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('movie_id', movieId)
          .eq('placement', 'discover')
      } catch (err) {
        console.error('[useDiscoverTracking] trackSeen error:', err.message)
      }
    },
    [userId],
  )

  /**
   * Update impression row when user dismisses a film.
   * @param {number} movieId
   */
  const trackDismiss = useCallback(
    async (movieId) => {
      if (!userId) return
      try {
        await supabase
          .from('recommendation_impressions')
          .update({ skipped: true })
          .eq('user_id', userId)
          .eq('movie_id', movieId)
          .eq('placement', 'discover')
      } catch (err) {
        console.error('[useDiscoverTracking] trackDismiss error:', err.message)
      }
    },
    [userId],
  )

  return { trackShown, trackWatchlist, trackSeen, trackDismiss }
}
