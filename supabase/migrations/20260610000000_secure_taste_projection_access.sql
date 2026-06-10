-- 20260610000000_secure_taste_projection_access.sql
-- F7.9 — Close the F7.8 P0 privacy exposure of the Cinematic DNA taste projection.
--
-- F7.8 confirmed (anon-role simulation returned real cross-user rows) that two SECURITY DEFINER
-- views were granted to `anon` and `authenticated` and BYPASS the owner-only RLS restored in F7.2:
--   * public.user_fingerprint_public      — every non-opted-out user's taste fingerprint
--   * public.user_similarity_discoverable — the cross-user similarity graph (no app consumer)
-- A logged-out client with the public anon key could read both via PostgREST.
--
-- Both views are DROPPED (dependency inspection: 0 dependents each; the authenticated People
-- taste-match feature now reads through the narrow RPC below; nothing else references them). This
-- removes the browser-role access AND clears both SECURITY DEFINER advisor errors outright. No
-- base-table RLS is changed, NO user data is mutated, NO fingerprints are deleted, and NO public
-- Profile/Diary model is re-enabled. Idempotent.

-- ── 1) Drop both projection views ─────────────────────────────────────────────────────────────
-- Dropping removes every browser-role + PUBLIC grant along with the view, and eliminates the
-- SECURITY DEFINER advisor error. The base tables (user_profiles_computed owner-only,
-- user_similarity participant-only) are untouched and keep working through normal owner paths.
drop view if exists public.user_similarity_discoverable;
drop view if exists public.user_fingerprint_public;

-- ── 2) Narrow authenticated RPC for the People taste-match feature ────────────────────────────
-- The ONLY sanctioned cross-user taste read. SECURITY DEFINER *only* because the opted-in
-- cross-user projection must be read through the owner-only RLS on user_profiles_computed (an
-- invoker-rights function would see only the caller's own row and break taste discovery). It:
--   * derives the caller exclusively from auth.uid() and accepts NO caller-supplied identity;
--   * rejects anonymous callers (execute revoked from anon/public; the predicate also requires a
--     non-null auth.uid());
--   * returns ONLY the least-data fields People consumes (the exact columns the old view exposed);
--   * gates OTHER users on the EXISTING enforced opt-in
--     (user_settings.settings->'privacy'->>'showOnLeaderboards', default-on) — UNCHANGED here;
--   * always returns the caller's OWN row (already readable via owner RLS), so People's "your own
--     moods" path keeps working regardless of the caller's opt-in;
--   * never returns raw history/ratings/reviews/editorial prose/cache timestamps/emails/private
--     account fields, is schema-qualified, has a pinned search_path, and is bounded.
create or replace function public.get_discoverable_taste_profiles()
returns table (
  user_id          uuid,
  top_mood_tags    jsonb,
  top_tone_tags    jsonb,
  top_fit_profiles jsonb,
  total            integer
)
language sql
security definer
set search_path = pg_catalog, public
stable
as $$
  select
    p.user_id,
    p.taste_fingerprint -> 'topMoodTags'       as top_mood_tags,
    p.taste_fingerprint -> 'topToneTags'       as top_tone_tags,
    p.taste_fingerprint -> 'topFitProfiles'    as top_fit_profiles,
    (p.taste_fingerprint ->> 'total')::integer as total
  from public.user_profiles_computed p
  left join public.user_settings s on s.user_id = p.user_id
  where (select auth.uid()) is not null
    and p.taste_fingerprint is not null
    and (
      p.user_id = (select auth.uid())  -- always your own row
      -- others: the EXISTING enforced opt-in (default-on), matching the retired view's predicate
      or coalesce((s.settings -> 'privacy' ->> 'showOnLeaderboards')::boolean, true) <> false
    )
  limit 500;
$$;

-- ── 3) Lock the RPC to authenticated callers only ─────────────────────────────────────────────
revoke all on function public.get_discoverable_taste_profiles() from public, anon;
grant execute on function public.get_discoverable_taste_profiles() to authenticated;
