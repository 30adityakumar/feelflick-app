-- /DNA social profile — aggregate social-proof counts for a member (endorsements, review likes,
-- list saves), each with a `mine` flag for the caller. ONE round trip for the whole reputation
-- surface. Gated by profilePublic (owner bypass). Counts are REAL (0 until members act).
--
-- ⚠️ NOT YET APPLIED TO ANY REMOTE ENVIRONMENT. File created locally for review.
--
-- SECURITY DEFINER so cross-user counts can be aggregated over owner-only base tables without a
-- broad select policy. Returns null when the caller may not view the target (anon, or a private
-- non-owner target). List saves reuse the existing user_list_follows table, restricted to the
-- target's own lists.

create or replace function public.get_dna_social_counts(target_user_id uuid)
returns jsonb
language sql
security definer
stable
set search_path = public, extensions, pg_catalog
as $$
  with gate as (
    select
      (select auth.uid()) as uid,
      (
        (select auth.uid()) is not null
        and (
          (select auth.uid()) = target_user_id
          or coalesce((
            select (s.settings -> 'privacy' ->> 'profilePublic')::boolean
            from public.user_settings s where s.user_id = target_user_id
          ), false)
        )
      ) as ok
  )
  select case when not (select ok from gate) then null::jsonb else jsonb_build_object(
    'endorsements', coalesce((
      select jsonb_agg(jsonb_build_object('trait', e.trait, 'count', e.cnt, 'mine', e.mine) order by e.cnt desc, e.trait)
      from (
        select trait, count(*)::int as cnt,
               bool_or(endorser_id = (select uid from gate)) as mine
        from public.dna_endorsements
        where target_id = target_user_id
        group by trait
        limit 50
      ) e
    ), '[]'::jsonb),
    'reviewLikes', coalesce((
      select jsonb_agg(jsonb_build_object('movie_id', l.movie_id, 'count', l.cnt, 'mine', l.mine))
      from (
        select movie_id, count(*)::int as cnt,
               bool_or(user_id = (select uid from gate)) as mine
        from public.review_likes
        where review_owner_id = target_user_id
        group by movie_id
        limit 500
      ) l
    ), '[]'::jsonb),
    'listSaves', coalesce((
      select jsonb_agg(jsonb_build_object('list_id', f.list_id, 'count', f.cnt, 'mine', f.mine))
      from (
        select lf.list_id, count(*)::int as cnt,
               bool_or(lf.user_id = (select uid from gate)) as mine
        from public.user_list_follows lf
        join public.lists l on l.id = lf.list_id and l.user_id = target_user_id
        group by lf.list_id
        limit 500
      ) f
    ), '[]'::jsonb)
  ) end;
$$;

revoke all on function public.get_dna_social_counts(uuid) from public, anon;
grant execute on function public.get_dna_social_counts(uuid) to authenticated;

-- ── Verification ──────────────────────────────────────────────────────────────────────────────
-- begin;
--   set local request.jwt.claims = '{"sub":"<viewer-uuid>"}';
--   select public.get_dna_social_counts('<public-target-uuid>');   -- jsonb with 3 arrays
--   select public.get_dna_social_counts('<private-target-uuid>');  -- null
-- rollback;
