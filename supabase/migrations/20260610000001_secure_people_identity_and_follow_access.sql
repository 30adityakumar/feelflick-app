-- 20260610000001_secure_people_identity_and_follow_access.sql
-- F8.2 — Close the F8.1 P0: public.users (incl. email, last_active_at) and public.user_follows were
-- ANONYMOUSLY readable via /rest/v1 (USING(true) policies + anon SELECT grants) — a logged-out
-- client with the public anon key could scrape every user's email + the follow graph (confirmed via
-- anon-role simulation: 9 emails, 4 follow edges).
--
-- End state: users + user_follows are NOT readable by anon; the full users row is OWNER-ONLY (so a
-- non-owner cannot read another user's email/last_active_at); the follow graph is PARTICIPANT-ONLY.
-- Cross-user identity (id/name/avatar) for People/Home/Lists, name search, and friend-of-follows
-- discovery are served by three narrow, authenticated, least-data SECURITY DEFINER RPCs (each
-- SECURITY DEFINER ONLY because the projection must read owner-only tables; each derives the caller
-- from auth.uid(), takes no caller authorization identity, has a pinned search_path, is read-only,
-- bounded, and returns NO email/last_active/settings/taste/history/editorial). No base behavioral
-- RLS is changed; NO user row is mutated. Idempotent.

-- ── 1) public.users — close anon + broad cross-user reads; full row becomes OWNER-ONLY ──────────
revoke select on table public.users from anon;
drop policy if exists "Anon can read user profiles" on public.users;
drop policy if exists "Authenticated users can view any profile" on public.users;
drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile" on public.users
  for select to authenticated
  using ((select auth.uid()) = id);
-- Owner INSERT ("Users can create their own profile") + UPDATE ("Users can update their own
-- profile") policies are intentionally left unchanged.

-- ── 2) public.user_follows — close anon; SELECT becomes PARTICIPANT-ONLY ─────────────────────────
revoke select on table public.user_follows from anon;
drop policy if exists "Users can see all follows" on public.user_follows;
drop policy if exists "Users can view participant follows" on public.user_follows;
create policy "Users can view participant follows" on public.user_follows
  for select to authenticated
  using ((select auth.uid()) = follower_id or (select auth.uid()) = following_id);
-- INSERT ("Users can follow others", check follower_id = auth.uid()) + DELETE ("Users can unfollow",
-- using follower_id = auth.uid()) are intentionally left unchanged.

-- ── 3) RPC: cross-user identity projection (id/name/avatar ONLY) ─────────────────────────────────
-- The ONLY cross-user path to other users' name/avatar (People/Home/Lists). Bounded: dedupes the
-- requested array and serves at most 200 ids per call.
create or replace function public.get_people_public_identities(requested_user_ids uuid[])
returns table (id uuid, name text, avatar_url text)
language sql security definer set search_path = pg_catalog, public stable
as $$
  select u.id, u.name, u.avatar_url
  from public.users u
  where (select auth.uid()) is not null
    and u.id in (select distinct t.rid from unnest(requested_user_ids) as t(rid) limit 200)
$$;
revoke all on function public.get_people_public_identities(uuid[]) from public, anon;
grant execute on function public.get_people_public_identities(uuid[]) to authenticated;

-- ── 4) RPC: People name search → identity (id/name/avatar ONLY) ──────────────────────────────────
-- Preserves the People masthead search without reopening the users table. Excludes the caller,
-- requires >= 2 chars, bounded to 20 results. (Gating search to opted-in users only is a deferred
-- consent refinement; this preserves current behavior of finding members by name.)
create or replace function public.search_people_by_name(search_query text)
returns table (id uuid, name text, avatar_url text)
language sql security definer set search_path = pg_catalog, public stable
as $$
  select u.id, u.name, u.avatar_url
  from public.users u
  where (select auth.uid()) is not null
    and u.id <> (select auth.uid())
    and char_length(btrim(coalesce(search_query, ''))) >= 2
    and u.name ilike '%' || btrim(search_query) || '%'
  order by u.name
  limit 20
$$;
revoke all on function public.search_people_by_name(text) from public, anon;
grant execute on function public.search_people_by_name(text) to authenticated;

-- ── 5) RPC: friend-of-follows discovery subgraph (narrow; NOT the full graph) ────────────────────
-- Preserves People's FOF "suggested via {friend}" rail under participant-only user_follows. Returns
-- ONLY the caller's own friend-of-follows edges (people followed by people the caller follows, who
-- the caller does not already follow) — never the global follow graph. Bounded to 120.
create or replace function public.get_follow_suggestions()
returns table (suggested_user_id uuid, via_user_id uuid)
language sql security definer set search_path = pg_catalog, public stable
as $$
  with me as (select (select auth.uid()) as uid),
  my_following as (
    select f.following_id from public.user_follows f, me where f.follower_id = me.uid
  )
  select f.following_id as suggested_user_id, f.follower_id as via_user_id
  from public.user_follows f, me
  where me.uid is not null
    and f.follower_id in (select following_id from my_following)
    and f.following_id <> me.uid
    and f.following_id not in (select following_id from my_following)
  limit 120
$$;
revoke all on function public.get_follow_suggestions() from public, anon;
grant execute on function public.get_follow_suggestions() to authenticated;

-- ── 6) Discoverability becomes EXPLICIT OPT-IN (missing/null setting => NOT discoverable) ────────
-- F8.2 consent decision: the taste-match projection was default-ON (a missing showOnLeaderboards
-- was treated as discoverable). Flip the MISSING-VALUE fallback only: explicit true stays
-- discoverable, explicit false stays hidden, and a missing/null preference is now NOT discoverable.
-- This mutates NO settings rows (users with no stored value simply default to not-discoverable and
-- can opt in from Account); the caller always still receives their OWN row. Everything else about
-- the RPC (least-data columns, auth-only, search_path, bound) is unchanged from F7.9.
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
      -- F8.2: opt-IN — missing/null => NOT discoverable (was coalesce(..., true) in F7.9)
      or coalesce((s.settings -> 'privacy' ->> 'showOnLeaderboards')::boolean, false) = true
    )
  limit 500;
$$;
revoke all on function public.get_discoverable_taste_profiles() from public, anon;
grant execute on function public.get_discoverable_taste_profiles() to authenticated;
