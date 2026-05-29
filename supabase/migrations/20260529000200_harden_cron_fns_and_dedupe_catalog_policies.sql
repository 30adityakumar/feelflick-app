-- Migration: harden public-executable cron functions + drop redundant catalog policies
--
-- PART A — lock down pg_cron-only SECURITY DEFINER functions.
-- These three have NO internal auth guard and are currently EXECUTE-able by the
-- public (anon + authenticated inherit EXECUTE via the PUBLIC pseudo-role). Anyone
-- with the anon key could trigger a real daily-briefing email blast, the account-
-- deletion queue processor, or an expensive stats recompute.
--
-- They are invoked only by pg_cron (as the owning superuser, which can always
-- execute regardless of grants). We revoke from PUBLIC/anon/authenticated and keep
-- service_role for safety.
--
-- PART B — remove the redundant "catalog public read" SELECT policies that
-- 20260529000000 added to 7 tables which ALREADY had an equivalent public read
-- policy ("read all …"). Net read access is unchanged (the pre-existing policy
-- remains). The other 8 catalog tables keep "catalog public read" — it's their
-- ONLY read policy.
--
-- Forward-only.

begin;

-- ---------- PART A: cron function lockdown ----------
revoke execute on function public._call_process_account_deletions() from public, anon, authenticated;
revoke execute on function public._call_send_daily_briefings()      from public, anon, authenticated;
revoke execute on function public.refresh_feelflick_stats()         from public, anon, authenticated;

-- Keep service_role able to invoke (defensive; cron normally runs as the owner).
grant execute on function public._call_process_account_deletions() to service_role;
grant execute on function public._call_send_daily_briefings()      to service_role;
grant execute on function public.refresh_feelflick_stats()         to service_role;

-- ---------- PART B: drop my redundant catalog read policies ----------
-- Each of these tables retains its pre-existing "read all …" policy.
drop policy if exists "catalog public read" on public.genres;            -- keeps "read all genres"
drop policy if exists "catalog public read" on public.keywords;          -- keeps "read all keywords"
drop policy if exists "catalog public read" on public.movie_genres;      -- keeps "read all mappings"
drop policy if exists "catalog public read" on public.movie_keywords;    -- keeps "read all movie_keywords"
drop policy if exists "catalog public read" on public.people;            -- keeps "read all people"
drop policy if exists "catalog public read" on public.ratings_external;  -- keeps "read all ratings_external"
drop policy if exists "catalog public read" on public.movies;            -- keeps "read all movies" (+ 2 other pre-existing dupes)

commit;

-- ===========================================================================
-- VERIFICATION (run separately, read-only):
--
-- -- (a) cron fns no longer public-executable:
-- select p.proname,
--        has_function_privilege('anon', p.oid, 'EXECUTE')          as anon_exec,
--        has_function_privilege('authenticated', p.oid, 'EXECUTE') as authd_exec,
--        has_function_privilege('service_role', p.oid, 'EXECUTE')  as service_exec
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname='public'
--   and p.proname in ('_call_process_account_deletions','_call_send_daily_briefings','refresh_feelflick_stats');
--
-- -- (b) each of the 7 tables still has >=1 permissive SELECT policy:
-- select tablename, count(*) filter (where cmd='SELECT') as select_policies
-- from pg_policies where schemaname='public'
--   and tablename in ('genres','keywords','movie_genres','movie_keywords','people','ratings_external','movies')
-- group by tablename order by tablename;
-- ===========================================================================
