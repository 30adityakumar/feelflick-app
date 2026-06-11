-- scripts/verify-s14-scheduler-functions.sql
-- READ-ONLY verification for S1.4 (scheduler/diagnostic function posture +
-- RLS-INFO tables + S1.2/S1.3/F8.6-SEC regression). Emits (check_name, ok).
-- Catalog booleans/counts/signatures only — NO function bodies, NO secrets, NO PII.
--
-- S1.4 applied NO live migration (all target functions already exist in repo
-- migrations; secret/Edge-coupled ones are defer-by-policy; no browser grant left to
-- clean). This script confirms the live posture is the intended one.
--
-- Run:  psql "$DATABASE_URL" -f scripts/verify-s14-scheduler-functions.sql

with checks as (
  -- ---- No SECURITY DEFINER function in public is anon-executable (key invariant) ----
  select 'no_anon_executable_security_definer_fn' as check_name, (
    select count(*) = 0 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prosecdef
      and has_function_privilege('anon', p.oid, 'EXECUTE')) as ok

  -- ---- Every target scheduler/diagnostic fn exists, is SECURITY DEFINER, pinned search_path ----
  union all
  select 'target_fns_exist_secdef_searchpath_pinned', (
    with want(fn) as (values
      ('get_cron_secret'),('list_daily_briefing_subscribers'),('refresh_feelflick_stats'),
      ('handle_new_auth_user'),('get_watchlist_with_status'),('get_positive_feedback_movies'),
      ('database_health_check'),('check_foreign_keys'),('check_indexes'),('check_unique_constraints'),
      ('check_duplicate_feedback'),('check_duplicate_ratings'),('check_invalid_watchlist_statuses'),
      ('increment_session_interactions'),('request_account_deletion'),('cancel_account_deletion'),
      ('_call_process_account_deletions'),('_call_send_daily_briefings'))
    select bool_and(exists (
      select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname=want.fn
        and p.prosecdef
        and p.proconfig is not null
        and exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%')))
    from want)

  -- ---- F8.6-SEC: secret/subscriber functions stay anon + authenticated denied ----
  union all
  select 'f86.get_cron_secret.denied',
    has_function_privilege('anon','public.get_cron_secret()','EXECUTE')=false
    and has_function_privilege('authenticated','public.get_cron_secret()','EXECUTE')=false
  union all
  select 'f86.list_daily_briefing_subscribers.denied',
    has_function_privilege('anon','public.list_daily_briefing_subscribers()','EXECUTE')=false
    and has_function_privilege('authenticated','public.list_daily_briefing_subscribers()','EXECUTE')=false
  union all
  select 'f86.call_bridges.svc_only',
    has_function_privilege('anon','public._call_process_account_deletions()','EXECUTE')=false
    and has_function_privilege('authenticated','public._call_process_account_deletions()','EXECUTE')=false
    and has_function_privilege('anon','public._call_send_daily_briefings()','EXECUTE')=false
    and has_function_privilege('authenticated','public._call_send_daily_briefings()','EXECUTE')=false

  -- ---- S1.2 regression ----
  union all
  select 's12.increment_session_interactions.anon_denied',
    has_function_privilege('anon','public.increment_session_interactions(uuid)','EXECUTE')=false
  union all
  select 's12.views.security_invoker',
    coalesce((select reloptions from pg_class where oid='public.list_follower_counts'::regclass) @> array['security_invoker=true'],false)
    and coalesce((select reloptions from pg_class where oid='public.vw_movies_scored'::regclass) @> array['security_invoker=true'],false)
  union all
  select 's12.user_tables.anon_select_denied', (
    select bool_and(not has_table_privilege('anon','public.'||t,'SELECT'))
    from unnest(array['user_history','user_ratings','user_watchlist','mood_sessions','user_profiles_computed']) t)

  -- ---- S1.3 regression: beta_members ----
  union all
  select 's13.beta_members.authenticated_select_only', (
    select count(*) filter (where privilege_type='SELECT')=1
       and count(*) filter (where privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'))=0
    from information_schema.role_table_grants
    where table_schema='public' and table_name='beta_members' and grantee='authenticated')
  union all
  select 's13.beta_members.no_anon_grant', (
    select count(*)=0 from information_schema.role_table_grants
    where table_schema='public' and table_name='beta_members' and grantee='anon')

  -- ---- RLS-INFO tables are service-role-only (no browser grants), RLS enabled ----
  union all
  select 'info.discovery_cursors.service_role_only', (
    select c.relrowsecurity
      and (select count(*)=0 from information_schema.role_table_grants g
           where g.table_schema='public' and g.table_name='discovery_cursors' and g.grantee in ('anon','authenticated'))
    from pg_class c where c.oid='public.discovery_cursors'::regclass)
  union all
  select 'info.update_runs.service_role_only', (
    select c.relrowsecurity
      and (select count(*)=0 from information_schema.role_table_grants g
           where g.table_schema='public' and g.table_name='update_runs' and g.grantee in ('anon','authenticated'))
    from pg_class c where c.oid='public.update_runs'::regclass)

  -- ---- pg_cron jobs intact (requires cron schema read access; informational) ----
  union all
  select 'cron.three_jobs_active', (
    select count(*)=3 from cron.job
    where active and jobname in ('process_account_deletions_hourly','refresh_feelflick_stats_nightly','send_daily_briefings_hourly'))
)
select check_name, ok from checks
union all
select '== ALL CHECKS PASS ==', bool_and(ok) from checks
order by 1;
