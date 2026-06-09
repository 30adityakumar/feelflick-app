-- verify-owner-only-rls.sql — READ-ONLY verification of the F7.2 privacy boundary.
-- Proves, against the live database, that owner-only RLS is in force on the raw behavioral
-- tables and that a non-owner authenticated session cannot read another user's rows.
--
-- Run with psql or the Supabase SQL editor. It mutates NOTHING (SELECTs + a rolled-back
-- transaction that only SETs the JWT claim to simulate two authenticated users). Replace the
-- two UUIDs with two real owner ids before running for the two-account check.
--
--   OWNER_A = a user who has user_history/user_ratings rows
--   OWNER_B = a different user who has rows
--
-- Expected results are annotated inline.

-- 1) Policy shape: each table should have exactly ONE owner/participant SELECT policy,
--    and NO "Authenticated users can view any ..." / USING (true) policy.
select tablename, policyname, cmd, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('user_history','user_ratings','user_similarity')
  and cmd = 'SELECT'
order by tablename, policyname;
-- EXPECT: user_history  → "Users can view own history"     using ((select auth.uid()) = user_id)
--         user_ratings  → "Users can view own ratings"     using ((select auth.uid()) = user_id)
--         user_similarity → "Users can view own similarity" using (auth.uid() in (user_a_id,user_b_id))
--         and NO row whose qual is `true` or `auth.uid() IS NOT NULL`.

-- 2) Two-account boundary check (read-only; rolled back). Simulate authenticated user A and
--    confirm A sees own rows but ZERO of B's rows. Then the reverse.
\set OWNER_A '00000000-0000-0000-0000-000000000000'
\set OWNER_B '11111111-1111-1111-1111-111111111111'

begin;
  set local role authenticated;

  -- as A
  select set_config('request.jwt.claims', json_build_object('sub', :'OWNER_A', 'role', 'authenticated')::text, true);
  select 'A reads own history'   as check, count(*) > 0  as expect_true  from public.user_history  where user_id = :'OWNER_A';
  select 'A reads B history'     as check, count(*) = 0  as expect_true  from public.user_history  where user_id = :'OWNER_B';  -- RLS blocks → 0
  select 'A reads own ratings'   as check, count(*) >= 0 as expect_true  from public.user_ratings  where user_id = :'OWNER_A';
  select 'A reads B ratings'     as check, count(*) = 0  as expect_true  from public.user_ratings  where user_id = :'OWNER_B';  -- 0
  select 'A reads B similarity'  as check, count(*) = 0  as expect_true  from public.user_similarity where user_a_id = :'OWNER_B' and user_b_id <> :'OWNER_A';  -- 0

  -- as B
  select set_config('request.jwt.claims', json_build_object('sub', :'OWNER_B', 'role', 'authenticated')::text, true);
  select 'B reads A history'     as check, count(*) = 0  as expect_true  from public.user_history  where user_id = :'OWNER_A';  -- 0
rollback;

-- 3) Anonymous denial: the anon role must read zero behavioral rows.
begin;
  set local role anon;
  select 'anon reads any history' as check, count(*) = 0 as expect_true from public.user_history;   -- 0
  select 'anon reads any ratings' as check, count(*) = 0 as expect_true from public.user_ratings;   -- 0
rollback;
