// src/shared/hooks/useRecommendationTracking.js
import { supabase } from '@/shared/lib/supabase/client';

export function useRecommendationTracking() {
  
  const trackRecommendationShown = async (sessionId, movieId, rankPosition, score, reason = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !sessionId) return;

      await supabase.from('recommendation_events').insert({
        mood_session_id: sessionId,
        user_id: user.id,
        movie_id: movieId,
        rank_position: rankPosition,
        recommendation_score: score,
        recommendation_reason: reason,
        shown_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking recommendation shown:', error);
    }
  };

  const trackRecommendationClicked = async (sessionId, movieId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !sessionId) return;

      await supabase
        .from('recommendation_events')
        .update({ 
          clicked_at: new Date().toISOString() 
        })
        .eq('mood_session_id', sessionId)
        .eq('movie_id', movieId);
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  const trackRecommendationWatched = async (sessionId, movieId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !sessionId) return;

      await supabase
        .from('recommendation_events')
        .update({ 
          watched_at: new Date().toISOString() 
        })
        .eq('mood_session_id', sessionId)
        .eq('movie_id', movieId);
    } catch (error) {
      console.error('Error tracking watched:', error);
    }
  };

  const trackAddedToWatchlist = async (sessionId, movieId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !sessionId) return;

      await supabase
        .from('recommendation_events')
        .update({ 
          added_to_watchlist_at: new Date().toISOString() 
        })
        .eq('mood_session_id', sessionId)
        .eq('movie_id', movieId);
    } catch (error) {
      console.error('Error tracking watchlist add:', error);
    }
  };

  const trackRating = async (sessionId, movieId, rating) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !sessionId) return;

      await supabase
        .from('recommendation_events')
        .update({ rating })
        .eq('mood_session_id', sessionId)
        .eq('movie_id', movieId);
    } catch (error) {
      console.error('Error tracking rating:', error);
    }
  };

  return {
    trackRecommendationShown,
    trackRecommendationClicked,
    trackRecommendationWatched,
    trackAddedToWatchlist,
    trackRating
  };
}