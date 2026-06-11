-- B1.4 — server-side source of truth for private-beta access.
--
-- A signed-in user may read ONLY their own membership row; there is NO broad read and NO client
-- write (membership is managed by the service role / an operator). No email/name is stored — only
-- the stable user_id. The app enforces the gate ONLY when VITE_ENABLE_BETA_GATE is set (default off),
-- so this table is inert until the operator turns the gate on for a production beta deploy.
--
-- SAFETY: additive — creates one table + RLS + grants. No existing rows touched. Idempotent.

create table if not exists public.beta_members (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  status     text not null default 'active',           -- 'active' | 'revoked'
  invited_by uuid,                                      -- optional operator/inviter user_id
  created_at timestamptz not null default now()
);

alter table public.beta_members enable row level security;

-- Owner-only SELECT: a user can see only whether THEY are a member. No cross-user / broad read.
drop policy if exists "Members can read own beta membership" on public.beta_members;
create policy "Members can read own beta membership"
  on public.beta_members for select to authenticated
  using ((select auth.uid()) = user_id);

-- No INSERT/UPDATE/DELETE policy for anon/authenticated → those ops are denied by RLS for the
-- browser; only the service role (which bypasses RLS) can manage membership.
revoke insert, update, delete on public.beta_members from anon, authenticated;
revoke all on public.beta_members from anon;        -- anon cannot even attempt a read
grant select on public.beta_members to authenticated;
