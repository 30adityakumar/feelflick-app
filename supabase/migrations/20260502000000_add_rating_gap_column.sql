-- Generated column for clean critic/audience gap filtering
ALTER TABLE public.movies
  ADD COLUMN IF NOT EXISTS ff_critic_audience_gap smallint
  GENERATED ALWAYS AS (ff_critic_rating - ff_audience_rating) STORED;

CREATE INDEX IF NOT EXISTS idx_movies_gap_critic_picks
  ON public.movies(ff_critic_audience_gap)
  WHERE ff_critic_audience_gap >= 15 AND ff_critic_confidence >= 60 AND ff_audience_confidence >= 60;

CREATE INDEX IF NOT EXISTS idx_movies_gap_crowd_pleasers
  ON public.movies(ff_critic_audience_gap)
  WHERE ff_critic_audience_gap <= -15 AND ff_critic_confidence >= 60 AND ff_audience_confidence >= 60;

COMMENT ON COLUMN public.movies.ff_critic_audience_gap IS
  'Positive = critics rated higher; Negative = audience rated higher. Useful for "critics'' picks" vs "crowd-pleasers" surfacing.';
