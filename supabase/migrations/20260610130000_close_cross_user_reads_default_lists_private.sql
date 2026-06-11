-- F9.2 — Close cross-user reads (user_watchlist, mood_sessions) + default new Lists private.
--
-- F9.1 found two broad authenticated SELECT policies that let ANY signed-in user read
-- every user's rows (the same any-authenticated-user behavioral-read pattern F7.2 closed
-- for user_history/user_ratings):
--   * user_watchlist : "Authenticated users can view any watchlist"  (USING auth.uid() IS NOT NULL)
--   * mood_sessions  : "Authenticated users can view any mood sessions" (USING auth.uid() IS NOT NULL)
-- Both tables already carry owner-only SELECT policies (auth.uid() = user_id), so dropping the
-- broad policy leaves each table owner-only for SELECT with no other change. Every source read of
-- both tables already filters by the signed-in user_id (verified in F9.2), and no app code SELECTs
-- mood_sessions at all — so this is a pure exposure closure with no consumer impact.
--
-- It also flips the public.lists.is_public column default from true -> false so that NEW lists are
-- private unless the creator explicitly opts in (the "Public — anyone can see this list" checkbox).
--
-- SAFETY: policy drops only; one column-DEFAULT change. No table columns altered, no rows updated,
-- existing list visibility values untouched. Idempotent (IF EXISTS + SET DEFAULT). Reversible.

begin;

-- 1) user_watchlist: drop the broad authenticated SELECT policy. Owner SELECT policies
--    ("select own", "uw_select_own", "watch self select", "wl_sel_own") + the owner ALL/INSERT/
--    UPDATE/DELETE policies remain, so SELECT becomes owner-only (auth.uid() = user_id).
drop policy if exists "Authenticated users can view any watchlist" on public.user_watchlist;

-- 2) mood_sessions: drop the broad authenticated SELECT policy. "Users can view own sessions"
--    (owner SELECT) + "Users can create own sessions" (owner INSERT) remain intact.
drop policy if exists "Authenticated users can view any mood sessions" on public.mood_sessions;

-- 3) lists: new lists default to private. Existing rows keep their current is_public value.
alter table public.lists alter column is_public set default false;

commit;
