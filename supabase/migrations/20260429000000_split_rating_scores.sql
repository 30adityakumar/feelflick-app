-- ============================================================================
-- MIGRATION: Split ff_rating into ff_critic_rating + ff_audience_rating
-- ============================================================================
--
-- Adds four columns to movies for separated critic/audience consensus scores:
--   ff_critic_rating      — 0-100, blends RT critics + Metacritic + IMDb (50k+)
--   ff_critic_confidence  — 0-100, source diversity + review counts
--   ff_audience_rating    — 0-100, Bayesian blend of IMDb + TMDB + Trakt
--   ff_audience_confidence — 0-100, logarithmic in vote count + source diversity
--
-- Also adds rt_critics_count to ratings_external for critic threshold gating.
--
-- ff_rating is kept for back-compat (set to ff_audience_rating / 10).
-- ============================================================================


-- 1. New split rating columns on movies
ALTER TABLE public.movies
  ADD COLUMN IF NOT EXISTS ff_critic_rating      smallint CHECK (ff_critic_rating IS NULL OR ff_critic_rating BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS ff_critic_confidence  smallint CHECK (ff_critic_confidence IS NULL OR ff_critic_confidence BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS ff_audience_rating    smallint CHECK (ff_audience_rating IS NULL OR ff_audience_rating BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS ff_audience_confidence smallint CHECK (ff_audience_confidence IS NULL OR ff_audience_confidence BETWEEN 0 AND 100);

CREATE INDEX IF NOT EXISTS idx_movies_ff_critic_rating ON public.movies(ff_critic_rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_movies_ff_audience_rating ON public.movies(ff_audience_rating DESC NULLS LAST);

COMMENT ON COLUMN public.movies.ff_critic_rating IS 'Critic consensus 0-100. Blends RT critics + Metacritic + IMDb (if 50k+ votes).';
COMMENT ON COLUMN public.movies.ff_critic_confidence IS 'Confidence in ff_critic_rating 0-100. Based on source count + review depth.';
COMMENT ON COLUMN public.movies.ff_audience_rating IS 'Broad audience consensus 0-100. Bayesian blend of IMDb + TMDB + Trakt.';
COMMENT ON COLUMN public.movies.ff_audience_confidence IS 'Confidence in ff_audience_rating 0-100. Logarithmic in vote count + source diversity.';


-- 2. RT critics count on ratings_external (OMDB does not provide this directly;
--    populated via heuristic fallback in step 06)
ALTER TABLE public.ratings_external
  ADD COLUMN IF NOT EXISTS rt_critics_count integer;
