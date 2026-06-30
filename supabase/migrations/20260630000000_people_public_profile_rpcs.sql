-- People public profile RPCs (cross-user reads with owner-controlled consent).
--
-- Three SECURITY DEFINER functions that let an authenticated viewer read another
-- user's public profile, watch history, and watchlist — each gated by the target
-- user's explicit opt-in settings in user_settings.settings.privacy:
--
--   showOnLeaderboards  → DNA visible in profile (existing flag, existing meaning)
--   shareHistory        → watch history visible to all followers (NEW, default false)
--   shareWatchlist      → watchlist visible to all followers   (NEW, default false)
--
-- Lists are excluded from this migration: the lists table already has a
-- "Public lists are readable by anyone" RLS policy scoped to is_public = true,
-- so the profile page queries the lists table directly.
--
-- All three functions:
--   • require auth.uid() IS NOT NULL (authenticated only)
--   • block self-reads (auth.uid() != target_user_id) — use own profile route
--   • pin search_path (security best practice)
--   • are STABLE (no side effects, no writes)
--
-- Behavioral tables (user_history, user_ratings, user_watchlist) remain
-- owner-only via RLS; these RPCs bypass via SECURITY DEFINER after checking
-- the target's consent settings. This is the narrowly-scoped RPC pattern
-- documented in F8.2 / 20260609000000_restore_owner_only_behavioral_rls.sql.

begin;

-- ── get_person_public_profile ──────────────────────────────────────────────
-- Returns one row for the target user: minimal identity + optional DNA taste
-- tags (null when showOnLeaderboards = false) + the two sharing-flag booleans
-- so the caller knows whether to show "Private" or "Nothing yet" for each section.
create or replace function public.get_person_public_profile(target_user_id uuid)
returns table (
  id               uuid,
  name             text,
  avatar_url       text,
  top_mood_tags    jsonb,
  top_tone_tags    jsonb,
  top_fit_profiles jsonb,
  dna_total        int,
  share_history    boolean,
  share_watchlist  boolean
)
language sql
security definer
stable
set search_path = public, extensions, pg_catalog
as $$
  select
    u.id,
    u.name,
    u.avatar_url,
    -- DNA columns: only when the target has opted into taste-match discovery
    case
      when coalesce((s.settings -> 'privacy' ->> 'showOnLeaderboards')::boolean, false)
      then p.top_mood_tags
      else null::jsonb
    end,
    case
      when coalesce((s.settings -> 'privacy' ->> 'showOnLeaderboards')::boolean, false)
      then p.top_tone_tags
      else null::jsonb
    end,
    case
      when coalesce((s.settings -> 'privacy' ->> 'showOnLeaderboards')::boolean, false)
      then p.top_fit_profiles
      else null::jsonb
    end,
    case
      when coalesce((s.settings -> 'privacy' ->> 'showOnLeaderboards')::boolean, false)
      then p.total::int
      else null::int
    end,
    coalesce((s.settings -> 'privacy' ->> 'shareHistory')::boolean,   false) as share_history,
    coalesce((s.settings -> 'privacy' ->> 'shareWatchlist')::boolean, false) as share_watchlist
  from public.users u
  left join public.user_profiles_computed p on p.user_id = u.id
  left join public.user_settings          s on s.user_id  = u.id
  where u.id = target_user_id
    and (select auth.uid()) is not null
    and (select auth.uid()) != target_user_id
  limit 1;
$$;

grant execute on function public.get_person_public_profile(uuid) to authenticated;

-- ── get_person_public_history ──────────────────────────────────────────────
-- Returns the target user's watch history (enriched with movie title/poster)
-- ONLY when shareHistory = true. Returns zero rows (no error) when the setting
-- is false, allowing the caller to distinguish "private" from "no history yet"
-- using the share_history flag from get_person_public_profile.
create or replace function public.get_person_public_history(target_user_id uuid)
returns table (
  movie_id    int,
  title       text,
  poster_path text,
  watched_at  timestamptz,
  rating      int
)
language sql
security definer
stable
set search_path = public, extensions, pg_catalog
as $$
  select
    h.movie_id,
    m.title,
    m.poster_path,
    h.watched_at,
    r.rating
  from public.user_history h
  join public.movies m on m.id = h.movie_id
  left join public.user_ratings r
    on r.user_id = h.user_id and r.movie_id = h.movie_id
  where h.user_id = target_user_id
    and (select auth.uid()) is not null
    and (select auth.uid()) != target_user_id
    and exists (
      select 1
      from public.user_settings s
      where s.user_id = target_user_id
        and coalesce((s.settings -> 'privacy' ->> 'shareHistory')::boolean, false) = true
    )
  order by h.watched_at desc
  limit 100;
$$;

grant execute on function public.get_person_public_history(uuid) to authenticated;

-- ── get_person_public_watchlist ────────────────────────────────────────────
-- Returns the target user's watchlist (enriched with movie title/poster)
-- ONLY when shareWatchlist = true. Same empty-vs-private distinction as above.
create or replace function public.get_person_public_watchlist(target_user_id uuid)
returns table (
  movie_id    int,
  title       text,
  poster_path text,
  added_at    timestamptz
)
language sql
security definer
stable
set search_path = public, extensions, pg_catalog
as $$
  select
    w.movie_id,
    m.title,
    m.poster_path,
    w.added_at
  from public.user_watchlist w
  join public.movies m on m.id = w.movie_id
  where w.user_id = target_user_id
    and (select auth.uid()) is not null
    and (select auth.uid()) != target_user_id
    and exists (
      select 1
      from public.user_settings s
      where s.user_id = target_user_id
        and coalesce((s.settings -> 'privacy' ->> 'shareWatchlist')::boolean, false) = true
    )
  order by w.added_at desc;
$$;

grant execute on function public.get_person_public_watchlist(uuid) to authenticated;

commit;
