-- /DNA social profile — cross-user watch history + per-film rating (for stats/charts/films/diary).
--
-- ⚠️ NOT YET APPLIED TO ANY REMOTE ENVIRONMENT. File created locally for review.
--
-- Bounded projection of the target's canonical-ish history joined to movies, plus the per-film
-- rating, gated by `privacy.profilePublic` (owner bypass). NEVER returns review_text (the Diary /
-- review body stays private; reviews have their own gated RPC). Mirrors get_person_public_taste's
-- column types so the existing pure derivations consume the rows unchanged. Section-level flags
-- (filmsPublic / diaryPublic) are applied client-side; profilePublic is the hard server gate.

create or replace function public.get_dna_public_taste(target_user_id uuid, max_rows int default 500)
returns table (
  movie_id      int,
  title         text,
  poster_path   text,
  backdrop_path text,
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
    h.movie_id, m.title, m.poster_path, m.backdrop_path, m.release_date, m.director_name,
    m.runtime, m.mood_tags, m.tone_tags, m.tmdb_id, h.watched_at, r.rating
  from public.user_history h
  join public.movies m on m.id = h.movie_id
  left join public.user_ratings r on r.user_id = h.user_id and r.movie_id = h.movie_id
  where h.user_id = target_user_id
    and (select auth.uid()) is not null
    and (
      (select auth.uid()) = target_user_id
      or coalesce((
        select (s.settings -> 'privacy' ->> 'profilePublic')::boolean
        from public.user_settings s where s.user_id = target_user_id
      ), false)
    )
  order by h.watched_at desc
  -- Row-count is itself flag-aware: the full browsable library is exposed only to the owner or
  -- when filmsPublic OR diaryPublic is on. When BOTH the Films and Diary tabs are hidden, only a
  -- bounded recent "portrait sample" is returned (enough for the aggregate DNA charts / featured /
  -- activity) so the full library is not retrievable from the network — the section flags are
  -- honored in SQL, not merely in React.
  limit (
    select case
      when (select auth.uid()) = target_user_id
        or coalesce((select (s.settings -> 'privacy' ->> 'filmsPublic')::boolean from public.user_settings s where s.user_id = target_user_id), false)
        or coalesce((select (s.settings -> 'privacy' ->> 'diaryPublic')::boolean from public.user_settings s where s.user_id = target_user_id), false)
      then greatest(1, least(coalesce(max_rows, 500), 2000))
      else 60
    end
  );
$$;

revoke all on function public.get_dna_public_taste(uuid, int) from public, anon;
grant execute on function public.get_dna_public_taste(uuid, int) to authenticated;

-- ── Verification ──────────────────────────────────────────────────────────────────────────────
-- begin;
--   set local request.jwt.claims = '{"sub":"<viewer-uuid>"}';
--   select count(*) from public.get_dna_public_taste('<public-target-uuid>');   -- > 0 for public
--   select count(*) from public.get_dna_public_taste('<private-target-uuid>');  -- 0 for private
--   -- confirm review_text is NOT a column of the result (it isn't in RETURNS TABLE)
-- rollback;
