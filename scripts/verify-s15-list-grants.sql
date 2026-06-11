-- scripts/verify-s15-list-grants.sql
-- READ-ONLY verification for S1.5 (lists/list_movies grant hygiene, Option A:
-- anon SELECT kept for public sharing, anon writes revoked). Emits (check_name, ok).
-- Counts/booleans only — NO list titles, owner IDs, user IDs, or row contents.
--
-- Two parts:
--   Part 1 — grants/RLS/policies/regression via has_*_privilege + catalog (role-agnostic).
--   Part 2 — adversarial anon-impersonation read-proof (SET LOCAL ROLE anon, rolled back).
--
-- Run:  psql "$DATABASE_URL" -f scripts/verify-s15-list-grants.sql

-- ── Part 1 ──────────────────────────────────────────────────────────────────────
with checks as (
  -- Grants: anon SELECT kept, all anon WRITE/DDL revoked (lists + list_movies)
  select 'lists.anon_select_kept' as check_name, has_table_privilege('anon','public.lists','SELECT') = true as ok
  union all select 'lists.anon_no_write_ddl', (
    select bool_and(has_table_privilege('anon','public.lists',p) = false)
    from unnest(array['INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p)
  union all select 'list_movies.anon_select_kept', has_table_privilege('anon','public.list_movies','SELECT') = true
  union all select 'list_movies.anon_no_write_ddl', (
    select bool_and(has_table_privilege('anon','public.list_movies',p) = false)
    from unnest(array['INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p)

  -- authenticated retains create/edit/delete (RLS-constrained to owner); service_role manages
  union all select 'lists.authenticated_can_write', (
    select bool_and(has_table_privilege('authenticated','public.lists',p) = true)
    from unnest(array['SELECT','INSERT','UPDATE','DELETE']) p)
  union all select 'list_movies.authenticated_can_write', (
    select bool_and(has_table_privilege('authenticated','public.list_movies',p) = true)
    from unnest(array['SELECT','INSERT','UPDATE','DELETE']) p)
  union all select 'lists.service_role_full', (
    select bool_and(has_table_privilege('service_role','public.lists',p) = true)
    from unnest(array['SELECT','INSERT','UPDATE','DELETE']) p)

  -- RLS enabled + new lists default private + intended policies present
  union all select 'lists.rls_enabled', (select relrowsecurity from pg_class where oid='public.lists'::regclass)
  union all select 'list_movies.rls_enabled', (select relrowsecurity from pg_class where oid='public.list_movies'::regclass)
  union all select 'lists.is_public_default_false', (
    select coalesce(column_default,'') in ('false','false::boolean')
    from information_schema.columns where table_schema='public' and table_name='lists' and column_name='is_public')
  union all select 'lists.public_read_policy_scoped', (
    select exists (select 1 from pg_policies where schemaname='public' and tablename='lists'
      and cmd='SELECT' and qual ilike '%is_public%' and qual ilike '%auth.uid()%'))
  union all select 'lists.owner_manage_policy', (
    select exists (select 1 from pg_policies where schemaname='public' and tablename='lists'
      and cmd='ALL' and coalesce(with_check,'') ilike '%auth.uid()%'))
  union all select 'list_movies.visibility_follows_parent', (
    select exists (select 1 from pg_policies where schemaname='public' and tablename='list_movies'
      and cmd='SELECT' and qual ilike '%lists%' and qual ilike '%is_public%'))

  -- Regression: F9.2 owner-only + S1.2/S1.3 still intact
  union all select 'regression.owner_only_rls', (
    select bool_and(exists(select 1 from pg_policies p where p.schemaname='public' and p.tablename=t
      and coalesce(p.qual,'') ilike '%auth.uid()%'))
    from unnest(array['user_watchlist','mood_sessions','user_ratings','user_history']) t)
  union all select 'regression.user_tables_anon_denied', (
    select bool_and(not has_table_privilege('anon','public.'||t,'SELECT'))
    from unnest(array['user_watchlist','mood_sessions','user_ratings','user_history']) t)
  union all select 'regression.beta_members_hardened', (
    (select count(*)=0 from information_schema.role_table_grants where table_schema='public' and table_name='beta_members' and grantee='anon')
    and (select count(*) filter (where privilege_type='SELECT')=1 and count(*) filter (where privilege_type<>'SELECT')=0
         from information_schema.role_table_grants where table_schema='public' and table_name='beta_members' and grantee='authenticated'))
  union all select 'regression.s12_views_security_invoker', (
    coalesce((select reloptions from pg_class where oid='public.list_follower_counts'::regclass) @> array['security_invoker=true'],false)
    and coalesce((select reloptions from pg_class where oid='public.vw_movies_scored'::regclass) @> array['security_invoker=true'],false))
)
select check_name, ok from checks
union all
select '== PART 1 ALL PASS ==', bool_and(ok) from checks
order by 1;

-- ── Part 2: adversarial anon-impersonation read-proof (no mutation; rolled back) ──
begin;
set local role anon;
select 'anon.no_private_list_visible' as check_name,
       (select count(*) = 0 from public.lists where is_public is not true) as ok
union all
select 'anon.no_private_list_movies_visible',
       (select count(*) = 0 from public.list_movies lm
          where not exists (select 1 from public.lists l where l.id = lm.list_id and l.is_public = true)) as ok;
rollback;
