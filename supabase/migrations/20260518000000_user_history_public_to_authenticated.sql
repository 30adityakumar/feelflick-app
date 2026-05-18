-- 2026-05-18 — Make user_history readable by any authenticated user.
--
-- Why: the social product loop (taste twins, public profile DNA, friends'
-- activity, crew overlap) requires reading other users' watch lists.
-- user_ratings already allowed this; user_history did not, leaving the
-- entire /profile-v2/:userId surface visibly empty even when the target
-- user had data. We mirror the ratings policy here (Letterboxd-style:
-- watch lists are socially visible to other signed-in users).
--
-- Owner-only INSERT/UPDATE/DELETE policies remain untouched — only the
-- SELECT scope widens. Anonymous (logged-out) reads remain blocked.

-- Drop the owner-only SELECT policy so the broader one can take over.
DROP POLICY IF EXISTS "Users can view own history" ON user_history;

-- Authenticated users can view any history row.
CREATE POLICY "Authenticated users can view any history"
  ON user_history
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
