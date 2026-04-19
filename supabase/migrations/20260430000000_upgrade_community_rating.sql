-- ============================================================================
-- MIGRATION: Upgrade ff_community_rating to satisfaction-based 0-100 scale
-- ============================================================================
--
-- Converts ff_community_rating from NUMERIC(4,2) on 0-10 (Bayesian star avg)
-- to smallint 0-100 (multi-signal satisfaction score from step 10).
--
-- Drops the old trigger-based formula. Step 10 now owns this column.
-- ============================================================================


-- 1. Convert column type: multiply existing values by 10 to shift to 0-100
ALTER TABLE public.movies
  ALTER COLUMN ff_community_rating TYPE smallint USING (ff_community_rating * 10)::smallint;

ALTER TABLE public.movies
  ADD CONSTRAINT ff_community_rating_range
  CHECK (ff_community_rating IS NULL OR ff_community_rating BETWEEN 0 AND 100);


-- 2. Add confidence column
ALTER TABLE public.movies
  ADD COLUMN IF NOT EXISTS ff_community_confidence smallint
  CHECK (ff_community_confidence IS NULL OR ff_community_confidence BETWEEN 0 AND 100);


-- 3. Backfill from existing user_satisfaction_* columns (already computed by step 10)
UPDATE public.movies
SET ff_community_rating    = user_satisfaction_score,
    ff_community_confidence = user_satisfaction_confidence
WHERE user_satisfaction_score IS NOT NULL;


-- 4. Drop the old trigger + function (stars-only Bayesian avg)
--    Satisfaction from step 10 replaces it.
DROP TRIGGER IF EXISTS trg_user_ratings_community ON public.user_ratings;
DROP FUNCTION IF EXISTS public.update_ff_community_rating();


-- 5. Update comments
COMMENT ON COLUMN public.movies.ff_community_rating IS
  'FeelFlick satisfaction score 0-100. Multi-signal: ratings + completion + sentiment + feedback. Updated nightly by step 10.';
COMMENT ON COLUMN public.movies.ff_community_confidence IS
  'Confidence 0-100 based on sample size. Gated: don''t trust below 60.';

-- Keep ff_community_votes as-is for display ("based on N ratings")
-- Keep ff_final_rating column for now (Phase 4 deprecates it)
