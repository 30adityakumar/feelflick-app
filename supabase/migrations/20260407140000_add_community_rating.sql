-- ============================================================================
-- MIGRATION: ff_community_rating + ff_final_rating
-- ============================================================================
--
-- Adds three columns to movies:
--   ff_community_rating  — Bayesian average of FeelFlick user_ratings (1-10)
--   ff_community_votes   — raw count of user ratings
--   ff_final_rating      — blend of external ff_rating + community rating
--                          community weight: 0% at 0 votes → 20% at 500 votes
--
-- Also creates a trigger on user_ratings (INSERT/UPDATE/DELETE) that keeps
-- all three columns up-to-date in real time without any background job.
--
-- Backfills existing user_ratings data at the end.
-- ============================================================================


-- ── 1. ADD COLUMNS ─────────────────────────────────────────────────────────

ALTER TABLE public.movies
  ADD COLUMN IF NOT EXISTS ff_community_rating  NUMERIC(4, 2),
  ADD COLUMN IF NOT EXISTS ff_community_votes   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ff_final_rating      NUMERIC(4, 2);

COMMENT ON COLUMN public.movies.ff_community_rating IS
  'Bayesian average of FeelFlick user ratings (1–10). Prior: 100 votes @ 7.0.';
COMMENT ON COLUMN public.movies.ff_community_votes IS
  'Raw count of FeelFlick user ratings feeding ff_community_rating.';
COMMENT ON COLUMN public.movies.ff_final_rating IS
  'Blend of ff_rating (external critics/community) and ff_community_rating. '
  'Community weight grows linearly from 0% (0 votes) to 20% (≥500 votes).';


-- ── 2. INDEXES ──────────────────────────────────────────────────────────────

-- Recommendation engine sorts by ff_final_rating DESC
CREATE INDEX IF NOT EXISTS idx_movies_ff_final_rating
  ON public.movies (ff_final_rating DESC NULLS LAST);

-- Trigger needs fast COUNT/AVG per movie_id on user_ratings
CREATE INDEX IF NOT EXISTS idx_user_ratings_movie_id
  ON public.user_ratings (movie_id);


-- ── 3. TRIGGER FUNCTION ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_ff_community_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_movie_id           INTEGER;
  v_votes              INTEGER;
  v_avg                NUMERIC;
  v_bayesian           NUMERIC;
  v_ff_rating          NUMERIC;
  v_community_weight   NUMERIC;
  v_final              NUMERIC;

  -- Bayesian prior: pull low-vote films toward the mean.
  -- FeelFlick users self-select (they watched the film), so prior mean is 7.0
  -- rather than the IMDb-wide 6.5.
  PRIOR_WEIGHT          CONSTANT NUMERIC := 100;
  PRIOR_MEAN            CONSTANT NUMERIC := 7.0;

  -- Community blending: max 20% community weight, reached at 500 votes.
  MAX_COMMUNITY_WEIGHT  CONSTANT NUMERIC := 0.20;
  VOTES_FOR_MAX_WEIGHT  CONSTANT INTEGER := 500;
BEGIN
  -- Which movie are we updating?
  IF TG_OP = 'DELETE' THEN
    v_movie_id := OLD.movie_id;
  ELSE
    v_movie_id := NEW.movie_id;
  END IF;

  -- Current community stats for this movie
  SELECT COUNT(*), AVG(rating)
  INTO   v_votes, v_avg
  FROM   public.user_ratings
  WHERE  movie_id = v_movie_id;

  v_votes := COALESCE(v_votes, 0);
  v_avg   := COALESCE(v_avg,   PRIOR_MEAN);

  -- Bayesian community rating
  v_bayesian := (v_votes * v_avg + PRIOR_WEIGHT * PRIOR_MEAN)
              / (v_votes + PRIOR_WEIGHT);
  v_bayesian := ROUND(v_bayesian, 2);

  -- External quality rating (may be NULL for very new/unscored movies)
  SELECT ff_rating INTO v_ff_rating FROM public.movies WHERE id = v_movie_id;
  v_ff_rating := COALESCE(v_ff_rating, 6.5);

  -- Community weight: 0 → MAX_COMMUNITY_WEIGHT as votes grow 0 → VOTES_FOR_MAX_WEIGHT
  v_community_weight := LEAST(
    MAX_COMMUNITY_WEIGHT,
    (v_votes::NUMERIC / VOTES_FOR_MAX_WEIGHT) * MAX_COMMUNITY_WEIGHT
  );

  v_final := ROUND(
    v_ff_rating  * (1.0 - v_community_weight)
    + v_bayesian * v_community_weight,
    2
  );

  -- Write back to movies
  UPDATE public.movies
  SET
    ff_community_rating = v_bayesian,
    ff_community_votes  = v_votes,
    ff_final_rating     = v_final
  WHERE id = v_movie_id;

  RETURN NULL; -- AFTER trigger; return value ignored for row-level
END;
$$;


-- ── 4. ATTACH TRIGGER ──────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_user_ratings_community ON public.user_ratings;

CREATE TRIGGER trg_user_ratings_community
  AFTER INSERT OR UPDATE OR DELETE
  ON public.user_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ff_community_rating();


-- ── 5. BACKFILL FROM EXISTING user_ratings ─────────────────────────────────
--
-- Run once for any ratings already in the table before this migration.
-- The trigger handles all future writes.

WITH agg AS (
  SELECT
    movie_id,
    COUNT(*)     AS votes,
    AVG(rating)  AS avg_r
  FROM  public.user_ratings
  GROUP BY movie_id
),
bayesian AS (
  SELECT
    movie_id,
    votes,
    ROUND(
      (votes * avg_r + 100 * 7.0) / (votes + 100),
      2
    ) AS community_rating
  FROM agg
)
UPDATE public.movies m
SET
  ff_community_rating = b.community_rating,
  ff_community_votes  = b.votes,
  ff_final_rating     = ROUND(
    COALESCE(m.ff_rating, 6.5)
      * (1.0 - LEAST(0.20, b.votes::NUMERIC / 500 * 0.20))
    + b.community_rating
      * LEAST(0.20, b.votes::NUMERIC / 500 * 0.20),
    2
  )
FROM bayesian b
WHERE m.id = b.movie_id;


-- ── 6. SEED ff_final_rating for all scored movies without any user ratings ──
--
-- Movies with no user ratings yet should still have ff_final_rating = ff_rating
-- so the recommendation engine can sort by a single column.

UPDATE public.movies
SET ff_final_rating = ff_rating
WHERE ff_rating     IS NOT NULL
  AND ff_final_rating IS NULL;
