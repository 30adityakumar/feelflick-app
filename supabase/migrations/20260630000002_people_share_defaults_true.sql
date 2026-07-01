-- Change default for shareHistory and shareWatchlist from false → true.
-- History and watchlist are now visible to followers unless the user explicitly
-- disables sharing in Account → Privacy. The COALESCE default drives the behavior
-- for users who have never touched their privacy settings (settings->privacy key
-- absent or null). Users who previously opted out remain opted out.

begin;

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
        and coalesce((s.settings -> 'privacy' ->> 'shareHistory')::boolean, true) = true
    )
  order by h.watched_at desc
  limit 100;
$$;

grant execute on function public.get_person_public_history(uuid) to authenticated;

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
        and coalesce((s.settings -> 'privacy' ->> 'shareWatchlist')::boolean, true) = true
    )
  order by w.added_at desc;
$$;

grant execute on function public.get_person_public_watchlist(uuid) to authenticated;

-- Also update get_person_public_profile so the share_history and share_watchlist
-- flags it returns reflect the same default-true logic, ensuring the profile page
-- shows "private" lock icons only when the user has explicitly disabled sharing.
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
    case
      when coalesce((s.settings -> 'privacy' ->> 'showOnLeaderboards')::boolean, false)
      then p.taste_fingerprint -> 'topMoodTags'
      else null::jsonb
    end,
    case
      when coalesce((s.settings -> 'privacy' ->> 'showOnLeaderboards')::boolean, false)
      then p.taste_fingerprint -> 'topToneTags'
      else null::jsonb
    end,
    case
      when coalesce((s.settings -> 'privacy' ->> 'showOnLeaderboards')::boolean, false)
      then p.taste_fingerprint -> 'topFitProfiles'
      else null::jsonb
    end,
    case
      when coalesce((s.settings -> 'privacy' ->> 'showOnLeaderboards')::boolean, false)
      then (p.taste_fingerprint ->> 'total')::int
      else null::int
    end,
    coalesce((s.settings -> 'privacy' ->> 'shareHistory')::boolean,   true) as share_history,
    coalesce((s.settings -> 'privacy' ->> 'shareWatchlist')::boolean, true) as share_watchlist
  from public.users u
  left join public.user_profiles_computed p on p.user_id = u.id
  left join public.user_settings          s on s.user_id  = u.id
  where u.id = target_user_id
    and (select auth.uid()) is not null
    and (select auth.uid()) != target_user_id
  limit 1;
$$;

grant execute on function public.get_person_public_profile(uuid) to authenticated;

commit;
