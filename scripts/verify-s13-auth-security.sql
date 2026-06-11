-- scripts/verify-s13-auth-security.sql
-- READ-ONLY verification for S1.3 (beta_members grant cleanup + S1.2 regression).
-- Emits (check_name, ok). Catalog booleans/counts only — no PII, no row contents.
--
-- NOTE: Supabase Auth dashboard settings (leaked-password protection, OTP expiry,
-- redirect URLs, signup posture) and the Postgres patch are NOT queryable via SQL and
-- are NOT faked here. Their status comes from the security advisors; operator steps
-- live in docs/security/s1-auth-dashboard-hardening.md.
--
-- Run:  psql "$DATABASE_URL" -f scripts/verify-s13-auth-security.sql

with checks as (
  -- ---- beta_members desired posture ----
  select 'beta_members.no_anon_grant' as check_name, (
    select count(*) = 0 from information_schema.role_table_grants
    where table_schema='public' and table_name='beta_members' and grantee='anon') as ok
  union all
  select 'beta_members.authenticated_select_present', (
    select count(*) = 1 from information_schema.role_table_grants
    where table_schema='public' and table_name='beta_members' and grantee='authenticated'
      and privilege_type='SELECT')
  union all
  select 'beta_members.authenticated_no_write_or_ddl_grants', (
    select count(*) = 0 from information_schema.role_table_grants
    where table_schema='public' and table_name='beta_members' and grantee='authenticated'
      and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'))
  union all
  select 'beta_members.rls_enabled', (
    select relrowsecurity from pg_class where oid='public.beta_members'::regclass)
  union all
  select 'beta_members.owner_only_select_policy', (
    select exists (select 1 from pg_policies
      where schemaname='public' and tablename='beta_members' and cmd='SELECT'
        and coalesce(qual,'') ilike '%auth.uid()%'))
  union all
  select 'beta_members.no_client_write_policy', (
    select count(*) = 0 from pg_policies
    where schemaname='public' and tablename='beta_members'
      and cmd in ('INSERT','UPDATE','DELETE')
      and array['authenticated']::name[] && roles)

  -- ---- S1.2 regression ----
  union all
  select 'regression.view.list_follower_counts.security_invoker', (
    coalesce((select reloptions from pg_class where oid='public.list_follower_counts'::regclass) @> array['security_invoker=true'], false))
  union all
  select 'regression.view.vw_movies_scored.security_invoker', (
    coalesce((select reloptions from pg_class where oid='public.vw_movies_scored'::regclass) @> array['security_invoker=true'], false))
  union all
  select 'regression.increment_session_interactions.anon_denied',
    has_function_privilege('anon','public.increment_session_interactions(uuid)','EXECUTE') = false
  union all
  select 'regression.user_tables.anon_select_denied', (
    select bool_and(not has_table_privilege('anon','public.'||t,'SELECT'))
    from unnest(array['user_history','user_ratings','user_profiles_computed','user_settings',
                     'user_preferences','user_events','user_interactions','user_sessions',
                     'user_similarity','mood_sessions','user_watchlist']) t)
  union all
  select 'regression.get_cron_secret.denied',
    has_function_privilege('anon','public.get_cron_secret()','EXECUTE') = false
    and has_function_privilege('authenticated','public.get_cron_secret()','EXECUTE') = false
  union all
  select 'regression.list_daily_briefing_subscribers.denied',
    has_function_privilege('anon','public.list_daily_briefing_subscribers()','EXECUTE') = false
    and has_function_privilege('authenticated','public.list_daily_briefing_subscribers()','EXECUTE') = false
)
select check_name, ok from checks
union all
select '== ALL CHECKS PASS ==', bool_and(ok) from checks
order by 1;
