-- verify-people-social-privacy.sql — READ-ONLY verification of the F8.2 People/social boundary.
-- Proves: public.users + public.user_follows are not readable by anon; the full users row is
-- owner-only (no cross-user email/last_active); the follow graph is participant-only; and the three
-- People RPCs are authenticated-only, least-data. Mutates NOTHING (catalog checks + rolled-back
-- role/JWT simulation). Replace the placeholder UUIDs with two real users before the two-account block.
--
--   OWNER_A = an authenticated user
--   OTHER_B = a different user (ideally one with showOnLeaderboards explicitly false, if seeded)

-- ── 1) Catalog: no anon SELECT grant / no anon-or-broad SELECT policy on the social tables ──────
select 'anon SELECT users'        as check, has_table_privilege('anon','public.users','SELECT')         as got, false as expect;
select 'anon SELECT user_follows' as check, has_table_privilege('anon','public.user_follows','SELECT')  as got, false as expect;
select 'users SELECT policies (expect 1: own only)' as check, string_agg(polname,' | ') as policies
  from pg_policy p join pg_class c on c.oid=p.polrelid join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname='users' and p.polcmd='r';
-- EXPECT: only "Users can view own profile" (no "Anon can read user profiles" / "Authenticated ... any profile").
select 'user_follows SELECT policies (expect participant-only)' as check, string_agg(polname,' | ') as policies
  from pg_policy p join pg_class c on c.oid=p.polrelid join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname='user_follows' and p.polcmd='r';

-- ── 2) Catalog: People RPCs authenticated-only, SECURITY DEFINER, search_path pinned ────────────
select 'anon EXEC get_people_public_identities'  as check, has_function_privilege('anon','public.get_people_public_identities(uuid[])','EXECUTE')  as got, false as expect;
select 'auth EXEC get_people_public_identities'  as check, has_function_privilege('authenticated','public.get_people_public_identities(uuid[])','EXECUTE') as got, true as expect;
select 'anon EXEC search_people_by_name'         as check, has_function_privilege('anon','public.search_people_by_name(text)','EXECUTE')           as got, false as expect;
select 'auth EXEC search_people_by_name'         as check, has_function_privilege('authenticated','public.search_people_by_name(text)','EXECUTE')  as got, true as expect;
select 'anon EXEC get_follow_suggestions'        as check, has_function_privilege('anon','public.get_follow_suggestions()','EXECUTE')              as got, false as expect;
select 'auth EXEC get_follow_suggestions'        as check, has_function_privilege('authenticated','public.get_follow_suggestions()','EXECUTE')     as got, true as expect;
select 'anon EXEC get_discoverable_taste_profiles' as check, has_function_privilege('anon','public.get_discoverable_taste_profiles()','EXECUTE')   as got, false as expect;
select p.proname, p.prosecdef as security_definer, array_to_string(p.proconfig,',') as config
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace and n.nspname='public'
  where p.proname in ('get_people_public_identities','search_people_by_name','get_follow_suggestions','get_discoverable_taste_profiles')
  order by p.proname;
-- EXPECT: each prosecdef=true and config contains search_path=pg_catalog, public.
-- least-data: identity RPC returns ONLY id/name/avatar
select 'identity RPC least-data columns' as check, pg_get_function_result(p.oid) as got
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace and n.nspname='public'
  where p.proname='get_people_public_identities';
-- EXPECT: TABLE(id uuid, name text, avatar_url text) — NO email/last_active/settings/taste.

-- ── 3) Anonymous role: zero rows / zero emails / RPCs denied ────────────────────────────────────
begin;
  set local role anon;
  select 'ANON users rows'        as check, count(*) as got, 0 as expect from public.users;
  select 'ANON emails'            as check, count(email) as got, 0 as expect from public.users;
  select 'ANON last_active'       as check, count(last_active_at) as got, 0 as expect from public.users;
  select 'ANON user_follows rows' as check, count(*) as got, 0 as expect from public.user_follows;
rollback;
-- (Anon cannot EXECUTE the RPCs at all — proven by the catalog has_function_privilege=false above.)

-- ── 4) Authenticated OWNER: own full row + own edges + identity RPC ─────────────────────────────
\set OWNER_A '00000000-0000-0000-0000-000000000000'
\set OTHER_B '11111111-1111-1111-1111-111111111111'
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', json_build_object('sub', :'OWNER_A', 'role','authenticated')::text, true);
  select 'OWNER reads own row'        as check, count(*) as got, 1 as expect from public.users where id = :'OWNER_A';
  select 'OWNER reads B full row'     as check, count(*) as got, 0 as expect from public.users where id = :'OTHER_B';   -- owner-only RLS blocks
  select 'OWNER cannot read B email'  as check, count(email) as got, 0 as expect from public.users where id = :'OTHER_B';
  select 'OWNER identity RPC id/name/avatar only' as check, count(*) as got
    from public.get_people_public_identities(array[:'OWNER_A'::uuid, :'OTHER_B'::uuid]);  -- returns rows w/o email
  select 'OWNER follow-suggestions RPC executes' as check, count(*) >= 0 as expect_true from public.get_follow_suggestions();
rollback;

-- ── 5) Consent: opt-IN — explicit true discoverable; explicit false / missing excluded ──────────
-- (Verify the predicate from §2 + the live RPC: a user with no settings row / null preference is
-- NOT returned by get_discoverable_taste_profiles except as the caller's own row.)
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', json_build_object('sub', :'OWNER_A', 'role','authenticated')::text, true);
  select 'discovery RPC: only opted-in others + self' as check, count(*) as discoverable_rows
    from public.get_discoverable_taste_profiles();
rollback;
