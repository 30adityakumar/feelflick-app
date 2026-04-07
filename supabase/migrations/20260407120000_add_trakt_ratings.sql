-- Add Trakt.tv rating columns to ratings_external
-- Trakt is a cinephile-skewed platform (similar demographic to Letterboxd)
-- fetched by pipeline step 06b-fetch-trakt-ratings

ALTER TABLE public.ratings_external
  ADD COLUMN IF NOT EXISTS trakt_rating   NUMERIC(4, 2),
  ADD COLUMN IF NOT EXISTS trakt_votes    INTEGER,
  ADD COLUMN IF NOT EXISTS trakt_fetched_at TIMESTAMPTZ;

-- Index: scoring step queries ratings_external by movie_id frequently
CREATE INDEX IF NOT EXISTS idx_ratings_external_trakt_null
  ON public.ratings_external (movie_id)
  WHERE trakt_rating IS NULL;

COMMENT ON COLUMN public.ratings_external.trakt_rating    IS 'Trakt.tv community average rating (1–10 scale)';
COMMENT ON COLUMN public.ratings_external.trakt_votes     IS 'Number of Trakt.tv ratings';
COMMENT ON COLUMN public.ratings_external.trakt_fetched_at IS 'Timestamp of last Trakt fetch';
