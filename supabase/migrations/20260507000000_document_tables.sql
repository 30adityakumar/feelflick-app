-- MIGRATION: Add/update table comments for recommendation tracking tables

COMMENT ON TABLE public.recommendation_events IS
  'Mood-session-scoped recommendation tracking. Captures what was shown during a specific mood_session and user actions (click/watch/skip/rate). Used for mood session analytics. For homepage row impressions, see recommendation_impressions.';

COMMENT ON TABLE public.recommendation_impressions IS
  'Homepage-row-scoped impression tracking. Every recommendation shown in a homepage row (hero, quick_picks, because_you_watched, etc.). Drives skip-signal feedback into scoreMovieForUser. For mood-session-specific tracking, see recommendation_events.';
