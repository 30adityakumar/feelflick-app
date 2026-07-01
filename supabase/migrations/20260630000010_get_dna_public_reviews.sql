-- /DNA social profile — cross-user reviews (rating rows with a non-empty review body).
--
-- ⚠️ NOT YET APPLIED TO ANY REMOTE ENVIRONMENT. File created locally for review.
--
-- The Reviews tab is doubly gated: `privacy.profilePublic` AND `privacy.reviewsPublic` (owner
-- bypass). This is the ONLY public RPC that returns review_text, and only for members who have
-- explicitly published both their profile and their reviews. Bounded by max_rows.

create or replace function public.get_dna_public_reviews(target_user_id uuid, max_rows int default 100)
returns table (
  movie_id    int,
  title       text,
  poster_path text,
  rating      int,
  review_text text,
  rated_at    timestamptz
)
language sql
security definer
stable
set search_path = public, extensions, pg_catalog
as $$
  select r.movie_id, m.title, m.poster_path, r.rating, r.review_text, r.rated_at
  from public.user_ratings r
  join public.movies m on m.id = r.movie_id
  where r.user_id = target_user_id
    and r.review_text is not null
    and btrim(r.review_text) <> ''
    and (select auth.uid()) is not null
    and (
      (select auth.uid()) = target_user_id
      or (
        coalesce((select (s.settings -> 'privacy' ->> 'profilePublic')::boolean
                  from public.user_settings s where s.user_id = target_user_id), false)
        and
        coalesce((select (s.settings -> 'privacy' ->> 'reviewsPublic')::boolean
                  from public.user_settings s where s.user_id = target_user_id), false)
      )
    )
  order by r.rated_at desc nulls last
  limit greatest(1, least(coalesce(max_rows, 100), 500));
$$;

revoke all on function public.get_dna_public_reviews(uuid, int) from public, anon;
grant execute on function public.get_dna_public_reviews(uuid, int) to authenticated;

-- ── Verification ──────────────────────────────────────────────────────────────────────────────
-- begin;
--   set local request.jwt.claims = '{"sub":"<viewer-uuid>"}';
--   -- profilePublic AND reviewsPublic → rows; either false (non-owner) → 0 rows:
--   select count(*) from public.get_dna_public_reviews('<target-uuid>');
-- rollback;
