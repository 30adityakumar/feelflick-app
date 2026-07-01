-- /DNA social profile — cross-user identity + curated projection.
--
-- ⚠️ NOT YET APPLIED TO ANY REMOTE ENVIRONMENT. This file is created locally for review; the
--    /DNA/:userId visitor route needs this (and the two sibling RPCs) deployed to function
--    against real data. Deploy is a separate, explicitly-authorized step.
--
-- Exposes ONLY what a visitor may see of another member's DNA social profile, gated by the
-- SEPARATE `privacy.profilePublic` consent (NOT showOnLeaderboards). The owner may always read
-- their own projection (for "View as visitor" parity). Returns:
--   • identity: name, avatar_url
--   • curated: whitelisted owner-authored dnaProfile fields (handle/bio/location/cover/featured/
--     currentExploration/highlights). pinnedReviewMovieId is nulled unless reviewsPublic (or owner);
--     featuredListId is nulled unless that list is public (or owner). NEVER returns raw settings/email.
--   • visibility: the per-section public flags (so the client can gate sections; server RPCs below
--     re-check independently — defense in depth).
--   • fingerprint + watched/rated totals for the DNA strip + stats.
--
-- user_settings is owner-only RLS, so a SECURITY DEFINER function is required to expose the
-- owner-authored curation to a consenting visitor.

create or replace function public.get_dna_public_profile(target_user_id uuid)
returns table (
  name          text,
  avatar_url    text,
  curated       jsonb,
  visibility    jsonb,
  fingerprint   jsonb,
  watched_total int,
  rated_total   int,
  followers_total int,
  following_total int
)
language sql
security definer
stable
set search_path = public, extensions, pg_catalog
as $$
  with ctx as (
    select
      (select auth.uid())                                as uid,
      u.id                                               as tid,
      u.name                                             as name,
      u.avatar_url                                       as avatar_url,
      coalesce(us.settings -> 'privacy', '{}'::jsonb)    as priv,
      coalesce(us.settings -> 'dnaProfile', '{}'::jsonb) as prof,
      p.taste_fingerprint                                as fingerprint
    from public.users u
    left join public.user_settings          us on us.user_id = u.id
    left join public.user_profiles_computed p  on p.user_id  = u.id
    where u.id = target_user_id
  )
  select
    ctx.name,
    ctx.avatar_url,
    jsonb_strip_nulls(jsonb_build_object(
      'handle',            nullif(ctx.prof ->> 'handle', ''),
      'bio',               nullif(ctx.prof ->> 'bio', ''),
      'location',          nullif(ctx.prof ->> 'location', ''),
      'coverMovieIds',     ctx.prof -> 'coverMovieIds',
      'featuredFilmIds',   ctx.prof -> 'featuredFilmIds',
      'currentExploration',nullif(ctx.prof ->> 'currentExploration', ''),
      'highlights',        ctx.prof -> 'highlights',
      'pinnedReviewMovieId',
        case when ctx.uid = ctx.tid or coalesce((ctx.priv ->> 'reviewsPublic')::boolean, false)
             then ctx.prof -> 'pinnedReviewMovieId' else null end,
      'featuredListId',
        case when exists (
               select 1 from public.lists l
               where l.id::text = (ctx.prof ->> 'featuredListId')
                 and (l.is_public or l.user_id = ctx.tid))
             then ctx.prof -> 'featuredListId' else null end
    )) as curated,
    jsonb_build_object(
      'profilePublic',       coalesce((ctx.priv ->> 'profilePublic')::boolean, false),
      'filmsPublic',         coalesce((ctx.priv ->> 'filmsPublic')::boolean, false),
      'diaryPublic',         coalesce((ctx.priv ->> 'diaryPublic')::boolean, false),
      'reviewsPublic',       coalesce((ctx.priv ->> 'reviewsPublic')::boolean, false),
      'listsPublic',         coalesce((ctx.priv ->> 'listsPublic')::boolean, false),
      'connectionsPublic',   coalesce((ctx.priv ->> 'connectionsPublic')::boolean, false),
      'viewingRhythmPublic', coalesce((ctx.priv ->> 'viewingRhythmPublic')::boolean, false)
    ) as visibility,
    ctx.fingerprint,
    (select count(distinct h.movie_id)::int from public.user_history h where h.user_id = ctx.tid) as watched_total,
    (select count(*)::int from public.user_ratings r where r.user_id = ctx.tid)                    as rated_total,
    (select count(*)::int from public.user_follows f where f.following_id = ctx.tid)               as followers_total,
    (select count(*)::int from public.user_follows f where f.follower_id  = ctx.tid)               as following_total
  from ctx
  where ctx.uid is not null
    and (ctx.uid = ctx.tid or coalesce((ctx.priv ->> 'profilePublic')::boolean, false));
$$;

revoke all on function public.get_dna_public_profile(uuid) from public, anon;
grant execute on function public.get_dna_public_profile(uuid) to authenticated;

-- ── Verification (run as an authenticated role after deploy) ───────────────────────────────────
-- begin;
--   set local request.jwt.claims = '{"sub":"<viewer-uuid>"}';
--   -- public target → 1 row with curated/visibility/fingerprint:
--   select * from public.get_dna_public_profile('<public-target-uuid>');
--   -- private target (profilePublic=false, not owner) → 0 rows:
--   select count(*) from public.get_dna_public_profile('<private-target-uuid>');
--   -- self → 1 row even when private:
--   set local request.jwt.claims = '{"sub":"<self-uuid>"}';
--   select count(*) from public.get_dna_public_profile('<self-uuid>');
-- rollback;
