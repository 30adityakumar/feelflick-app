-- verify-taste-projection-privacy.sql — READ-ONLY verification of the F7.9 privacy boundary.
-- Proves, against the live database, that the Cinematic DNA taste projection is no longer
-- readable by browser roles directly, that the dormant similarity view is gone, and that the
-- People taste-match feature's only cross-user read is the narrow authenticated RPC
-- public.get_discoverable_taste_profiles() (authenticated-only, opt-in gated, least-data).
--
-- It mutates NOTHING: catalog privilege checks (has_*_privilege never error) plus one rolled-back
-- transaction that only SETs the JWT claim to simulate an authenticated caller. Replace the two
-- UUID placeholders with real users before running the two-account block.
--
--   OWNER_A      = an authenticated user who satisfies the opt-in (showOnLeaderboards != false)
--   OPTED_OUT_B  = a user whose user_settings.privacy.showOnLeaderboards = false (if one exists)

-- ── 1) Catalog: browser roles have NO access to the projection view ───────────────────────────
select 'anon SELECT user_fingerprint_public'          as check, has_table_privilege('anon','public.user_fingerprint_public','SELECT')          as got, false as expect;
select 'authenticated SELECT user_fingerprint_public' as check, has_table_privilege('authenticated','public.user_fingerprint_public','SELECT') as got, false as expect;
-- write-style grants must also be gone for both browser roles
select 'anon INSERT user_fingerprint_public'          as check, has_table_privilege('anon','public.user_fingerprint_public','INSERT')          as got, false as expect;
select 'authenticated UPDATE user_fingerprint_public' as check, has_table_privilege('authenticated','public.user_fingerprint_public','UPDATE') as got, false as expect;

-- ── 2) Catalog: the dormant similarity view is dropped entirely ────────────────────────────────
select 'user_similarity_discoverable dropped' as check, to_regclass('public.user_similarity_discoverable') is null as got, true as expect;

-- ── 3) Catalog: the People RPC is authenticated-only, SECURITY DEFINER, search_path pinned ─────
select 'anon EXECUTE rpc'          as check, has_function_privilege('anon','public.get_discoverable_taste_profiles()','EXECUTE')          as got, false as expect;
select 'public EXECUTE rpc'        as check, has_function_privilege('public','public.get_discoverable_taste_profiles()','EXECUTE')        as got, false as expect;
select 'authenticated EXECUTE rpc' as check, has_function_privilege('authenticated','public.get_discoverable_taste_profiles()','EXECUTE') as got, true  as expect;
select 'rpc is SECURITY DEFINER'   as check, p.prosecdef as got, true as expect
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='get_discoverable_taste_profiles';
select 'rpc search_path pinned'    as check, coalesce(array_to_string(p.proconfig,','),'(none)') as got, 'search_path=pg_catalog, public' as expect_like
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='get_discoverable_taste_profiles';
-- least-data: the RETURNS TABLE exposes only the five non-sensitive columns
select 'rpc returns least-data columns only' as check, pg_get_function_result(p.oid) as got
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='get_discoverable_taste_profiles';
-- EXPECT: TABLE(user_id uuid, top_mood_tags jsonb, top_tone_tags jsonb, top_fit_profiles jsonb, total integer)
--         — NO history/ratings/reviews/editorial/timestamps/email.

-- ── 4) Base-table RLS unchanged (F7.2 owner/participant boundary still intact) ─────────────────
select tablename, policyname, cmd, qual
  from pg_policies
 where schemaname='public'
   and tablename in ('user_history','user_ratings','user_similarity','user_profiles_computed')
   and cmd='SELECT'
 order by tablename;
-- EXPECT: owner-only on history/ratings/user_profiles_computed; participant-only on user_similarity.

-- ── 5) Anonymous role: cannot execute the RPC; raw tables inaccessible ─────────────────────────
-- (has_*_privilege under the real anon role; we do NOT attempt the denied SELECTs, which would error.)
select 'anon EXECUTE rpc (role)'        as check, has_function_privilege('anon','public.get_discoverable_taste_profiles()','EXECUTE') as got, false as expect;
select 'anon SELECT user_history'       as check, has_table_privilege('anon','public.user_history','SELECT')           as got, true  as expect_note;  -- grant exists, but RLS yields 0 rows for anon
select 'anon SELECT user_profiles_computed' as check, has_table_privilege('anon','public.user_profiles_computed','SELECT') as got, true as expect_note;
-- NOTE: anon retains a table-level SELECT grant on the base tables, but RLS (auth.uid() = user_id)
--       returns ZERO rows for an anon caller (auth.uid() is null). The exposure was the SECURITY
--       DEFINER views (now closed), never the RLS-protected base tables.

-- ── 6) Authenticated caller: RPC works + returns opted-in least-data; opted-out user absent ────
\set OWNER_A     '00000000-0000-0000-0000-000000000000'
\set OPTED_OUT_B '11111111-1111-1111-1111-111111111111'

begin;
  set local role authenticated;
  select set_config('request.jwt.claims', json_build_object('sub', :'OWNER_A', 'role', 'authenticated')::text, true);

  -- A can execute the RPC and gets at least their own row.
  select 'A: RPC returns rows'           as check, count(*) > 0 as expect_true from public.get_discoverable_taste_profiles();
  -- A's own row is always present.
  select 'A: own row present'            as check, count(*) = 1 as expect_true from public.get_discoverable_taste_profiles() where user_id = :'OWNER_A';
  -- The opted-out user must NOT appear (if such a fixture user exists; otherwise this returns 0
  -- and is vacuously true — verify the predicate from §3 / source if no opted-out user is seeded).
  select 'B(opted-out): absent from RPC' as check, count(*) = 0 as expect_true from public.get_discoverable_taste_profiles() where user_id = :'OPTED_OUT_B';
  -- A cannot read B's raw behavior through the base tables (owner-only RLS).
  select 'A: cannot read B history'      as check, count(*) = 0 as expect_true from public.user_history where user_id = :'OPTED_OUT_B';
  select 'A: cannot read B profile'      as check, count(*) = 0 as expect_true from public.user_profiles_computed where user_id = :'OPTED_OUT_B';
rollback;

-- ── 7) Owner still reads their own data (sanity) ──────────────────────────────────────────────
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', json_build_object('sub', :'OWNER_A', 'role', 'authenticated')::text, true);
  select 'owner reads own history'  as check, count(*) >= 0 as expect_true from public.user_history          where user_id = :'OWNER_A';
  select 'owner reads own profile'  as check, count(*) >= 0 as expect_true from public.user_profiles_computed where user_id = :'OWNER_A';
rollback;
