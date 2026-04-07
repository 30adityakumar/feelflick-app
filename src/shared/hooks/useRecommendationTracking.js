import { useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'

export function useRecommendationTracking() {
  const { userId } = useAuthSession()

  const trackRecommendationShown = useCallback(
    async (sessionId, movieId, rankPosition, score, reason = null) => {
      try {
        if (!userId || !sessionId) return

        await supabase.from('recommendation_events').insert({
          mood_session_id: sessionId,
          user_id: userId,
          movie_id: movieId,
          rank_position: rankPosition,
          recommendation_score: score,
          recommendation_reason: reason,
          shown_at: new Date().toISOString(),
        })
      } catch (error) {
        console.error('Error tracking recommendation shown:', error)
      }
    },
    [userId],
  )

  const trackRecommendationClicked = useCallback(
    async (sessionId, movieId) => {
      try {
        if (!userId || !sessionId) return

        await supabase
          .from('recommendation_events')
          .update({
            clicked_at: new Date().toISOString(),
          })
          .eq('mood_session_id', sessionId)
          .eq('movie_id', movieId)
      } catch (error) {
        console.error('Error tracking click:', error)
      }
    },
    [userId],
  )

  const trackRecommendationWatched = useCallback(
    async (sessionId, movieId) => {
      try {
        if (!userId || !sessionId) return

        await supabase
          .from('recommendation_events')
          .update({
            watched_at: new Date().toISOString(),
          })
          .eq('mood_session_id', sessionId)
          .eq('movie_id', movieId)
      } catch (error) {
        console.error('Error tracking watched:', error)
      }
    },
    [userId],
  )

  const trackAddedToWatchlist = useCallback(
    async (sessionId, movieId) => {
      try {
        if (!userId || !sessionId) return

        await supabase
          .from('recommendation_events')
          .update({
            added_to_watchlist_at: new Date().toISOString(),
          })
          .eq('mood_session_id', sessionId)
          .eq('movie_id', movieId)
      } catch (error) {
        console.error('Error tracking watchlist add:', error)
      }
    },
    [userId],
  )

  const trackRating = useCallback(
    async (sessionId, movieId, rating) => {
      try {
        if (!userId || !sessionId) return

        await supabase
          .from('recommendation_events')
          .update({ rating })
          .eq('mood_session_id', sessionId)
          .eq('movie_id', movieId)
      } catch (error) {
        console.error('Error tracking rating:', error)
      }
    },
    [userId],
  )

  return {
    trackRecommendationShown,
    trackRecommendationClicked,
    trackRecommendationWatched,
    trackAddedToWatchlist,
    trackRating,
  }
}
