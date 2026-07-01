-- Backfill: turn shareHistory and shareWatchlist ON for any user who had them
-- explicitly set to false, and flip all existing lists to is_public = true.
-- Also changes the lists.is_public column default to true so new lists are
-- public unless the owner opts out.
--
-- Safe to run multiple times (idempotent WHERE clauses).

begin;

-- 1. user_settings: set shareHistory = true where it was explicitly false
UPDATE public.user_settings
SET settings = jsonb_set(settings, '{privacy,shareHistory}', 'true'::jsonb)
WHERE (settings -> 'privacy' ->> 'shareHistory')::boolean = false;

-- 2. user_settings: set shareWatchlist = true where it was explicitly false
UPDATE public.user_settings
SET settings = jsonb_set(settings, '{privacy,shareWatchlist}', 'true'::jsonb)
WHERE (settings -> 'privacy' ->> 'shareWatchlist')::boolean = false;

-- 3. lists: make all existing lists public
UPDATE public.lists SET is_public = true WHERE is_public = false;

-- 4. lists: change default for new lists to public
ALTER TABLE public.lists ALTER COLUMN is_public SET DEFAULT true;

commit;
