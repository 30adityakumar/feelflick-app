-- MIGRATION: Drop confirmed-unused tables
-- Audited 2026-04-19: zero rows AND zero code references in src/ and scripts/

-- Drop FK constraint referencing recommendation_experiments
ALTER TABLE public.mood_sessions DROP CONSTRAINT IF EXISTS mood_sessions_experiment_fkey;

DROP TABLE IF EXISTS public.user_movie_interactions;
DROP TABLE IF EXISTS public.mood_transitions;
DROP TABLE IF EXISTS public.movie_content_features;
DROP TABLE IF EXISTS public.recommendation_experiments;
DROP TABLE IF EXISTS public.mood_genre_affinity;
DROP TABLE IF EXISTS public.movie_engagement_events;
DROP TABLE IF EXISTS public.movie_cowatch_patterns;
DROP TABLE IF EXISTS public.movie_completion_stats;
DROP TABLE IF EXISTS public.staging_ratings_external;
DROP TABLE IF EXISTS public.movie_update_queue;
DROP TABLE IF EXISTS public.homepage_recommendation_cache;
DROP TABLE IF EXISTS public.user_movie_notes;
DROP TABLE IF EXISTS public.user_preferences_audit;

-- user_engagement_stats is a materialized view, not a table
DROP MATERIALIZED VIEW IF EXISTS public.user_engagement_stats;

-- Dead column: codebase uses user_movie_feedback.movie_id exclusively
ALTER TABLE public.user_movie_feedback DROP COLUMN IF EXISTS tmdb_id;

-- KEPT (have active code references):
-- movie_recommendations  → src/shared/services/recommendations.js
-- user_similarity        → src/app/pages/people/UserSearchPage.jsx
-- update_runs            → scripts/utils/supabase.js, pipeline-logger.js
-- user_events            → src/shared/services/events-tracker.js
-- moods                  → scripts/pipeline/09-calculate-mood-scores.js
-- viewing_contexts       → scripts/phase1/02-populate-viewing-contexts.js
-- experience_types       → scripts/phase1/03-populate-experience-types.js
-- recommendation_events  → src/shared/hooks/useRecommendationTracking.js
