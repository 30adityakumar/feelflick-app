-- ============================================================================
-- MIGRATION: Add personal rating cache to user_profiles_computed
-- ============================================================================
--
-- Stores per-user, per-movie ff_personal_rating results (0-100 with confidence
-- and component breakdown) in a JSONB map, cached with 24h TTL.
--
-- Map shape: { "<movie_id>": { rating, confidence, components } }
-- ============================================================================

ALTER TABLE public.user_profiles_computed
  ADD COLUMN IF NOT EXISTS personal_ratings jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS personal_ratings_computed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_user_profiles_personal_stale
  ON public.user_profiles_computed(personal_ratings_computed_at);

COMMENT ON COLUMN public.user_profiles_computed.personal_ratings IS
  'Map of movie_id → {rating, confidence, components} computed per-user. TTL 24h.';
