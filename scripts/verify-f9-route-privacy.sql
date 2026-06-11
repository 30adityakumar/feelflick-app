-- verify-f9-route-privacy.sql — READ-ONLY verification for the F9.2 cross-user-read closure.
--
-- Confirms (no row contents printed; aggregate / policy / privilege checks + one rolled-back
-- role-simulation that uses a SYNTHETIC uuid, never a real user id):
--   * user_watchlist  SELECT is owner-only (no broad authenticated policy)
--   * mood_sessions   SELECT is owner-only (no broad authenticated policy)
--   * owner INSERT/UPDATE/DELETE (watchlist) + owner INSERT/SELECT (mood) policies still exist
--   * lists.is_public column default is false
--   * a random authenticated user sees ZERO watchlist / mood rows (the fix actually bites)
--
-- Run with the service role / SQL editor. Nothing is mutated (the simulation is rolled back).

\echo '== 1. user_watchlist + mood_sessions: NO broad authenticated SELECT policy should remain =='
select c.relname as tbl, pol.polname,
       pg_get_expr(pol.polqual, pol.polrelid) as using_expr
from pg_policy pol
join pg_class c on c.oid = pol.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('user_watchlist','mood_sessions')
  and pol.polcmd = 'r'
  and pg_get_expr(pol.polqual, pol.polrelid) ilike '%is not null%';   -- expect: 0 rows

\echo '== 2. Owner-only SELECT (auth.uid() = user_id) + write policies still present =='
select c.relname as tbl,
       count(*) filter (where pol.polcmd = 'r'
             and pg_get_expr(pol.polqual, pol.polrelid) ilike '%= user_id%'
             and pg_get_expr(pol.polqual, pol.polrelid) not ilike '%is not null%') as owner_select_policies,
       count(*) filter (where pol.polcmd in ('a','*')) as insert_or_all_policies,
       count(*) filter (where pol.polcmd in ('w','*')) as update_or_all_policies,
       count(*) filter (where pol.polcmd in ('d','*')) as delete_or_all_policies
from pg_policy pol
join pg_class c on c.oid = pol.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('user_watchlist','mood_sessions')
group by c.relname order by c.relname;
-- expect: user_watchlist owner_select >=1, insert/update/delete >=1 each;
--         mood_sessions  owner_select >=1, insert_or_all >=1.

\echo '== 3. lists.is_public column default must be false =='
select column_name, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'lists' and column_name = 'is_public';
-- expect: column_default = false

\echo '== 4. Role simulation (ROLLED BACK): a random authenticated user must see ZERO rows =='
begin;
set local role authenticated;
-- synthetic uuid, not a real user — before the fix this would see ALL rows via the broad policy.
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}', true);
select
  (select count(*) from public.user_watchlist) as watchlist_rows_visible_to_random_authed,  -- expect 0
  (select count(*) from public.mood_sessions)  as mood_rows_visible_to_random_authed,        -- expect 0
  (select count(*) from public.lists where is_public = false) as private_lists_visible_to_random_authed; -- expect 0 (non-owner can't read private)
rollback;

\echo '== 5. anon must see ZERO private/owned rows (RLS), public lists still readable =='
begin;
set local role anon;
select
  (select count(*) from public.user_watchlist) as watchlist_rows_visible_to_anon,   -- expect 0
  (select count(*) from public.mood_sessions)  as mood_rows_visible_to_anon,         -- expect 0
  (select count(*) from public.lists where is_public = false) as private_lists_visible_to_anon; -- expect 0
rollback;
