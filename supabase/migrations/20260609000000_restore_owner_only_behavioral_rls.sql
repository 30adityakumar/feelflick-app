-- 2026-06-09 — F7.2 privacy containment: restore OWNER-ONLY reads of raw behavioral data.
--
-- Why: migration 20260518000000 widened user_history SELECT to "any authenticated user"
-- (USING (auth.uid() IS NOT NULL)), and user_ratings + user_similarity carried the same
-- Letterboxd-style broad-read policy. The F7.1 Profile/Cinematic DNA audit confirmed (against
-- this live database) that this lets ANY signed-in user read ANY other user's full watch
-- history, ratings, and similarity graph directly over the REST API — i.e. a stranger's entire
-- behavioral taste portrait (directors, decade/runtime/daypart habits, mixtape + reviews, mood
-- trajectory, taste-twins) is exposed via /profile/:userId. A React route guard cannot close
-- this because the client can query the tables directly with its own JWT; the boundary MUST be
-- in RLS. The account "Public profile" / "Public diary" toggles that implied control over this
-- were never consulted by any read path or policy (cosmetic) — they are being removed in the
-- same phase.
--
-- This migration makes raw watch history, ratings, and similarity OWNER-PRIVATE again
-- (auth.uid() = user_id, or participant for similarity). Owner INSERT/UPDATE/DELETE are
-- untouched. Anonymous access remains denied. The service role is unaffected (it bypasses RLS,
-- so server-side similarity/stats jobs keep working). Cross-user social features that read these
-- tables directly (Film File "Friends loved" / "Taste twin", People enrichment) now receive
-- zero rows and self-hide; re-enabling them behind narrowly-scoped SECURITY DEFINER RPCs with
-- explicit consent is deferred to a deliberate social-privacy phase.
--
-- PRODUCT RULE (temporary): Cinematic DNA, raw watch history and raw ratings are owner-private.
-- Cross-user experiences may consume only narrow server-projected data designed for that
-- feature. A future public-profile model requires explicit user consent and server-enforced
-- publication rules. RLS alone is not consent.
--
-- NOTE: ( SELECT auth.uid() ) is wrapped in a sub-select to keep the initplan optimization the
-- existing owner policies use (auth.uid() evaluated once per query, not once per row).

-- ── user_history: owner-only SELECT ───────────────────────────────────────────
drop policy if exists "Authenticated users can view any history" on public.user_history;
drop policy if exists "Users can view own history" on public.user_history;
create policy "Users can view own history"
  on public.user_history
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- ── user_ratings: owner-only SELECT ───────────────────────────────────────────
drop policy if exists "Authenticated users can view any ratings" on public.user_ratings;
drop policy if exists "Users can view own ratings" on public.user_ratings;
create policy "Users can view own ratings"
  on public.user_ratings
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- ── user_similarity: participant-only SELECT ──────────────────────────────────
-- A user may read only similarity rows in which they are a participant (the subject
-- user_a_id or the matched user_b_id) — never another user's full similarity graph.
drop policy if exists "similarity authenticated read" on public.user_similarity;
drop policy if exists "Users can view own similarity" on public.user_similarity;
create policy "Users can view own similarity"
  on public.user_similarity
  for select
  to authenticated
  using (
    (select auth.uid()) = user_a_id
    or (select auth.uid()) = user_b_id
  );
