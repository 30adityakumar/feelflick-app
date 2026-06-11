-- scripts/verify-s12-grants.sql
-- READ-ONLY verification for S1.2 (view + function + anon-grant hardening).
-- Emits one row per check: (check_name, expected, ok). No private row contents,
-- no PII — only catalog booleans/counts. Safe to run against any environment.
-- Run:  psql "$DATABASE_URL" -f scripts/verify-s12-grants.sql
--   or paste into the Supabase SQL editor / MCP execute_sql.

with checks as (
  -- ---- Views: security_invoker ----
  select 'view.list_follower_counts.security_invoker' as check_name, 'true' as expected,
    coalesce((select reloptions from pg_class where oid = 'public.list_follower_counts'::regclass)
             @> array['security_invoker=true'], false) as ok
  union all
  select 'view.vw_movies_scored.security_invoker', 'true',
    coalesce((select reloptions from pg_class where oid = 'public.vw_movies_scored'::regclass)
             @> array['security_invoker=true'], false)

  -- ---- Views: no write grants to browser roles ----
  union all
  select 'view.list_follower_counts.no_browser_write_grants', '0', (
    select count(*) = 0 from information_schema.role_table_grants
    where table_schema='public' and table_name='list_follower_counts'
      and grantee in ('anon','authenticated')
      and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'))
  union all
  select 'view.vw_movies_scored.no_browser_write_grants', '0', (
    select count(*) = 0 from information_schema.role_table_grants
    where table_schema='public' and table_name='vw_movies_scored'
      and grantee in ('anon','authenticated')
      and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'))

  -- ---- Function: increment_session_interactions ----
  union all
  select 'fn.increment_session_interactions.anon_execute_denied', 'false',
    has_function_privilege('anon','public.increment_session_interactions(uuid)','EXECUTE') = false
  union all
  select 'fn.increment_session_interactions.authenticated_execute', 'true',
    has_function_privilege('authenticated','public.increment_session_interactions(uuid)','EXECUTE') = true
  union all
  select 'fn.increment_session_interactions.search_path_pinned', 'true', (
    select p.proconfig is not null and exists (
      select 1 from unnest(p.proconfig) c where c like 'search_path=%')
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='increment_session_interactions')
  union all
  select 'fn.increment_session_interactions.returns_void', 'true', (
    select (select typname from pg_type where oid=p.prorettype) = 'void'
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='increment_session_interactions')

  -- ---- Anon grants removed from RLS-protected per-user tables ----
  union all
  select 'tables.no_anon_grants_remaining', '0', (
    select count(*) = 0 from information_schema.role_table_grants
    where table_schema='public' and grantee='anon'
      and table_name in ('user_history','user_ratings','user_profiles_computed','user_settings',
                         'user_preferences','user_events','user_interactions','user_sessions',
                         'user_similarity','mood_sessions','user_watchlist'))
  union all
  -- Stronger than the direct-grant check above: has_table_privilege accounts for
  -- PUBLIC + role membership, proving anon has NO effective SELECT path.
  select 'tables.anon_effective_select_denied', 'true', (
    select bool_and(not has_table_privilege('anon','public.'||t,'SELECT'))
    from unnest(array['user_history','user_ratings','user_profiles_computed','user_settings',
                     'user_preferences','user_events','user_interactions','user_sessions',
                     'user_similarity','mood_sessions','user_watchlist']) t)
  union all
  select 'tables.rls_enabled_on_all_candidates', 'true', (
    select bool_and(c.relrowsecurity)
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public'
      and c.relname in ('user_history','user_ratings','user_profiles_computed','user_settings',
                       'user_preferences','user_events','user_interactions','user_sessions',
                       'user_similarity','mood_sessions','user_watchlist'))

  -- ---- Regression: F8.6-SEC scheduler functions stay denied ----
  union all
  select 'regression.get_cron_secret.anon_denied', 'false',
    coalesce((select has_function_privilege('anon', p.oid, 'EXECUTE')
              from pg_proc p join pg_namespace n on n.oid=p.pronamespace
              where n.nspname='public' and p.proname='get_cron_secret' limit 1), false) = false
  union all
  select 'regression.get_cron_secret.authenticated_denied', 'false',
    coalesce((select has_function_privilege('authenticated', p.oid, 'EXECUTE')
              from pg_proc p join pg_namespace n on n.oid=p.pronamespace
              where n.nspname='public' and p.proname='get_cron_secret' limit 1), false) = false
  union all
  select 'regression.list_daily_briefing_subscribers.anon_denied', 'false',
    coalesce((select has_function_privilege('anon', p.oid, 'EXECUTE')
              from pg_proc p join pg_namespace n on n.oid=p.pronamespace
              where n.nspname='public' and p.proname='list_daily_briefing_subscribers' limit 1), false) = false
  union all
  select 'regression.list_daily_briefing_subscribers.authenticated_denied', 'false',
    coalesce((select has_function_privilege('authenticated', p.oid, 'EXECUTE')
              from pg_proc p join pg_namespace n on n.oid=p.pronamespace
              where n.nspname='public' and p.proname='list_daily_briefing_subscribers' limit 1), false) = false

  -- ---- Regression: B1.4a beta_members — no anon grant, no authenticated client write ----
  union all
  select 'regression.beta_members.no_anon_grant', '0', (
    select count(*) = 0 from information_schema.role_table_grants
    where table_schema='public' and table_name='beta_members' and grantee='anon')
  union all
  select 'regression.beta_members.no_authenticated_dml_write', '0', (
    select count(*) = 0 from information_schema.role_table_grants
    where table_schema='public' and table_name='beta_members' and grantee='authenticated'
      and privilege_type in ('INSERT','UPDATE','DELETE'))

  -- ---- Regression: F9.2 owner-only RLS on watchlist + mood_sessions ----
  union all
  select 'regression.user_watchlist.rls_owner_scoped', 'true', (
    select c.relrowsecurity and exists (
      select 1 from pg_policies pol
      where pol.schemaname='public' and pol.tablename='user_watchlist'
        and coalesce(pol.qual,'') ilike '%auth.uid()%')
    from pg_class c where c.oid='public.user_watchlist'::regclass)
  union all
  select 'regression.mood_sessions.rls_owner_scoped', 'true', (
    select c.relrowsecurity and exists (
      select 1 from pg_policies pol
      where pol.schemaname='public' and pol.tablename='mood_sessions'
        and coalesce(pol.qual,'') ilike '%auth.uid()%')
    from pg_class c where c.oid='public.mood_sessions'::regclass)
)
select check_name, expected, ok from checks
union all
select '== ALL CHECKS PASS ==', 'true', bool_and(ok) from checks
order by 1;
