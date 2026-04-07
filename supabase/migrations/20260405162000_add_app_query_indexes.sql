-- FeelFlick app query indexes
-- Focused on the highest-frequency filters used by browse/discover/watchlist flows.

create index if not exists idx_user_watchlist_user_status_added_at
  on public.user_watchlist (user_id, status, added_at desc);

create index if not exists idx_user_watchlist_user_priority_added_at
  on public.user_watchlist (user_id, priority desc, added_at desc);

create index if not exists idx_user_history_user_watched_at
  on public.user_history (user_id, watched_at desc);

create index if not exists idx_recommendation_events_session_movie
  on public.recommendation_events (mood_session_id, movie_id);

create index if not exists idx_recommendation_events_user_shown_at
  on public.recommendation_events (user_id, shown_at desc);

create index if not exists idx_user_movie_feedback_user_movie
  on public.user_movie_feedback (user_id, movie_id);

create index if not exists idx_movie_mood_scores_movie_score
  on public.movie_mood_scores (movie_id, score desc);

analyze public.user_watchlist;
analyze public.user_history;
analyze public.recommendation_events;
analyze public.user_movie_feedback;
analyze public.movie_mood_scores;
