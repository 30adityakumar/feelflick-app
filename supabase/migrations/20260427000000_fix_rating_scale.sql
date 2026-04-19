-- ============================================================================
-- MIGRATION: Fix user_ratings scale + add CHECK constraint
-- ============================================================================
--
-- MovieSentimentWidget had a bug: it divided StarRating's 1-10 value by 2
-- before saving, producing 0.5-5 in DB instead of 1-10.
--
-- Only odd values (like 3) are definitively from the buggy path — even values
-- could have come from Quick-Rate (which correctly stored 1-10 via *2).
-- With only 6 total rows in production, we fix the provable cases and move on.
--
-- Steps:
--   1. Double any odd values <= 5 (definitively from the /2 bug)
--   2. Add CHECK constraint enforcing 1-10 range going forward
--   3. Re-fire trigger to recompute ff_community_rating from corrected data
-- ============================================================================


-- 1. Fix definitively-wrong odd values from Your Take's /2 bug
UPDATE public.user_ratings
SET rating = rating * 2
WHERE rating <= 5
  AND rating % 2 = 1;


-- 2. Enforce 1-10 range going forward
ALTER TABLE public.user_ratings
  ADD CONSTRAINT user_ratings_rating_check
  CHECK (rating IS NULL OR rating BETWEEN 1 AND 10);


-- 3. Re-fire the community rating trigger so ff_community_rating recomputes
-- WHY: updating rated_at to itself fires the AFTER UPDATE trigger on each row
UPDATE public.user_ratings
SET rated_at = rated_at;
