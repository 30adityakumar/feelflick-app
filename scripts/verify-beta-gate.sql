-- verify-beta-gate.sql — READ-ONLY verification of the B1.4 private-beta gate.
-- Confirms beta_members exists with RLS, owner-only SELECT, no broad read, and no client write.
-- Aggregate / policy checks only; prints no user ids/emails.

\echo '== 1. beta_members: RLS enabled, no email/name columns (user_id only) =='
select c.relrowsecurity as rls_enabled,
       (select string_agg(a.attname, ', ' order by a.attnum)
          from pg_attribute a where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped) as columns
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'beta_members';   -- expect rls_enabled = t; no email/name col

\echo '== 2. SELECT policy is owner-only (auth.uid() = user_id), to authenticated; no broad/anon read =='
select pol.polname,
       case pol.polcmd when 'r' then 'SELECT' when '*' then 'ALL' when 'a' then 'INSERT'
            when 'w' then 'UPDATE' when 'd' then 'DELETE' else pol.polcmd::text end as cmd,
       coalesce((select string_agg(r.rolname, ',') from pg_roles r where r.oid = any(pol.polroles)), 'PUBLIC') as roles,
       pg_get_expr(pol.polqual, pol.polrelid) as using_expr
from pg_policy pol join pg_class c on c.oid = pol.polrelid join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'beta_members';
-- expect exactly one SELECT policy: roles=authenticated, using (auth.uid() = user_id). No INSERT/UPDATE/DELETE policy.

\echo '== 3. Grants: authenticated may SELECT only; anon has nothing; no client write =='
select grantee, string_agg(privilege_type, ', ' order by privilege_type) as privs
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'beta_members' and grantee in ('anon', 'authenticated')
group by grantee order by grantee;   -- expect: authenticated = SELECT; anon = (no row)

\echo '== 4. Role simulation (ROLLED BACK): a random authenticated user sees ZERO membership rows =='
begin;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}', true);
select count(*) as rows_visible_to_random_authed from public.beta_members;   -- expect 0 (owner-only)
rollback;

\echo '== 5. anon sees ZERO =='
begin;
set local role anon;
select count(*) as rows_visible_to_anon from public.beta_members;   -- expect 0
rollback;
