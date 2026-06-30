-- SECURITY DEFINER RPC exposing another user's watch history + per-film rating, so a
-- follower can see the full Cinematic DNA portrait (Response / Journey / Voices) on
-- /profile/:userId. Gated by showOnLeaderboards (the same DNA-visibility consent that gates
-- the archetype; defaulted true by migration 00004).
--
-- Privacy: review_text (the Diary) is NEVER returned. Only the integer rating per film is
-- exposed, which already powers the shared Cinematic DNA portrait. Caller must be
-- authenticated and not the target user.
--
-- Column types match public.movies: mood_tags/tone_tags text[], tmdb_id bigint,
-- runtime integer, release_date date — declared exactly so arrays reach the client as
-- JS arrays (the shape the deriveTasteJourney / deriveDirectors functions expect).

create or replace function public.get_person_public_taste(target_user_id uuid)
returns table (
  movie_id      int,
  title         text,
  poster_path   text,
  release_date  date,
  director_name text,
  runtime       integer,
  mood_tags     text[],
  tone_tags     text[],
  tmdb_id       bigint,
  watched_at    timestamptz,
  rating        int
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
    m.release_date,
    m.director_name,
    m.runtime,
    m.mood_tags,
    m.tone_tags,
    m.tmdb_id,
    h.watched_at,
    r.rating
  from public.user_history h
  join public.movies m on m.id = h.movie_id
  left join public.user_ratings r on r.user_id = h.user_id and r.movie_id = h.movie_id
  where h.user_id = target_user_id
    and (select auth.uid()) is not null
    and (select auth.uid()) != target_user_id
    and coalesce((
      select (s.settings -> 'privacy' ->> 'showOnLeaderboards')::boolean
      from public.user_settings s where s.user_id = target_user_id
    ), true)
  order by h.watched_at desc
  limit 2000;
$$;

grant execute on function public.get_person_public_taste(uuid) to authenticated;
