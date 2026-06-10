-- verify-scheduler-security-functions.sql  (F8.6-SEC)
--
-- READ-ONLY verification that the scheduler / diagnostic SECURITY DEFINER functions are no
-- longer browser-executable. This script NEVER executes get_cron_secret() or
-- list_daily_briefing_subscribers() (or any secret/PII function) — it checks the catalog and
-- privilege state only. Safe to run against production; returns no secret or email values.
--
-- Run with the Supabase SQL editor or psql. Expected results are noted inline.

-- (1) EXECUTE privileges per role for every touched function.
--   Expected:
--     get_cron_secret / list_daily_briefing_subscribers / database_health_check / check_* /
--       handle_new_auth_user  -> anon=f, authenticated=f, service_role=t
--     request_account_deletion / cancel_account_deletion -> anon=f, authenticated=t, service_role=t
--     increment_session_interactions (intentionally left) -> anon=t (residual backlog)
select
  'public.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as fn_sig,
  p.prosecdef                                              as security_definer,
  pg_get_userbyid(p.proowner)                              as owner,
  p.proconfig                                              as config,
  has_function_privilege('anon',          p.oid, 'EXECUTE') as anon_exec,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_exec,
  has_function_privilege('service_role',  p.oid, 'EXECUTE') as service_exec,
  -- explicit PUBLIC grant still present? expected 0 for every locked-down function
  (select count(*) from aclexplode(p.proacl) a where a.grantee = 0) as public_grants
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'get_cron_secret','list_daily_briefing_subscribers',
    'database_health_check','check_foreign_keys','check_indexes','check_unique_constraints',
    'check_duplicate_feedback','check_duplicate_ratings','check_invalid_watchlist_statuses',
    'handle_new_auth_user','request_account_deletion','cancel_account_deletion',
    'increment_session_interactions'
  )
order by p.proname;

-- (2) Hard assertion: NO browser role may execute the two P0 functions.
--   Expected: zero rows.
select 'P0 STILL BROWSER-EXECUTABLE: ' || p.proname as violation
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('get_cron_secret','list_daily_briefing_subscribers')
  and (has_function_privilege('anon', p.oid, 'EXECUTE')
       or has_function_privilege('authenticated', p.oid, 'EXECUTE'));

-- (3) Hard assertion: the cron pipeline can still run.
--   service_role must execute both P0 functions (the edge-function bridge), and the
--   postgres owner always can. Expected: both true.
select
  has_function_privilege('service_role', 'public.get_cron_secret()', 'EXECUTE')                 as svc_can_read_secret,
  has_function_privilege('service_role', 'public.list_daily_briefing_subscribers()', 'EXECUTE') as svc_can_list_subscribers;

-- (4) cron jobs unchanged + run as the postgres owner (read-only).
select jobid, jobname, schedule, username from cron.job order by jobid;

-- NOTE: advisor confirmation is out-of-band — re-run get_advisors(security) and confirm the
-- `anon_security_definer_function_executable` findings for the functions above are cleared.
