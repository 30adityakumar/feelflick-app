-- Fixes for the public-profile RPCs surfaced by real data:
--
-- 1. get_person_public_dna.total_watched used coalesce(u.total_movies_watched, …). That column
--    is 0 (not NULL) for many users while the real history lives in user_history, so coalesce
--    kept the 0 and the portrait wrongly read as "still forming". Count user_history directly.
--
-- 2. get_person_public_history / _watchlist gated with EXISTS(... coalesce(flag, true) = true).
--    A user with NO user_settings row makes that EXISTS false → history/watchlist blocked even
--    though the product default is "shared". Switch to "allow unless explicitly set to false"
--    so a missing settings row (or null flag) defaults to shared.

begin;

-- 1 — accurate watched count -------------------------------------------------
create or replace function public.get_person_public_dna(target_user_id uuid)
returns table (
  name                   text,
  avatar_url             text,
  editorial_archetype    jsonb,
  editorial_summary      text,
  editorial_signature    text,
  editorial_generated_at timestamptz,
  taste_fingerprint      jsonb,
  total_watched          int,
  total_rated            int
)
language sql
security definer
stable
set search_path = public, extensions, pg_catalog
as $$
  select
    u.name,
    u.avatar_url,
    p.editorial_archetype,
    p.editorial_summary,
    p.editorial_signature,
    p.editorial_generated_at,
    p.taste_fingerprint,
    (select count(distinct h.movie_id)::int from public.user_history h where h.user_id = target_user_id) as total_watched,
    (select count(*)::int from public.user_ratings r where r.user_id = target_user_id)                   as total_rated
  from public.users u
  left join public.user_profiles_computed p on p.user_id = u.id
  where u.id = target_user_id
    and (select auth.uid()) is not null
    and (select auth.uid()) != target_user_id
    and coalesce((
      select (s.settings -> 'privacy' ->> 'showOnLeaderboards')::boolean
      from public.user_settings s where s.user_id = target_user_id
    ), true)
  limit 1;
$$;

grant execute on function public.get_person_public_dna(uuid) to authenticated;

-- 2a — history: share unless explicitly false --------------------------------
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
  left join public.user_ratings r on r.user_id = h.user_id and r.movie_id = h.movie_id
  where h.user_id = target_user_id
    and (select auth.uid()) is not null
    and (select auth.uid()) != target_user_id
    and not exists (
      select 1 from public.user_settings s
      where s.user_id = target_user_id
        and (s.settings -> 'privacy' ->> 'shareHistory')::boolean = false
    )
  order by h.watched_at desc
  limit 100;
$$;

grant execute on function public.get_person_public_history(uuid) to authenticated;

-- 2b — watchlist: share unless explicitly false ------------------------------
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
    and not exists (
      select 1 from public.user_settings s
      where s.user_id = target_user_id
        and (s.settings -> 'privacy' ->> 'shareWatchlist')::boolean = false
    )
  order by w.added_at desc;
$$;

grant execute on function public.get_person_public_watchlist(uuid) to authenticated;

commit;
