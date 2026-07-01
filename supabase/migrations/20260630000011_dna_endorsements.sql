-- /DNA social profile — trait endorsements ("People trust {user} for {trait}").
--
-- ⚠️ NOT YET APPLIED TO ANY REMOTE ENVIRONMENT. File created locally for review; the /DNA
--    reputation "Trust too" feature needs this deployed to function. No fabricated seed rows —
--    every count starts at 0 and only grows from real member endorsements.
--
-- A viewer endorses a specific taste TRAIT of a target member (traits come from the target's own
-- Cinematic DNA "known for" list). Cross-user COUNTS are read only through the profilePublic-gated
-- SECURITY DEFINER function get_dna_social_counts (see 20260630000013); the base table is
-- owner-only-visible via RLS. Writes are the endorser's own rows; self-endorsement is blocked.

create table if not exists public.dna_endorsements (
  id          uuid primary key default gen_random_uuid(),
  endorser_id uuid not null references auth.users(id) on delete cascade,
  target_id   uuid not null references auth.users(id) on delete cascade,
  trait       text not null,
  created_at  timestamptz not null default now(),
  unique (endorser_id, target_id, trait),
  constraint dna_endorsements_no_self check (endorser_id <> target_id),
  constraint dna_endorsements_trait_len check (char_length(trait) between 1 and 80)
);

create index if not exists dna_endorsements_target_idx on public.dna_endorsements (target_id, trait);

alter table public.dna_endorsements enable row level security;

-- Base-table visibility is owner-only (the endorser's own rows); public counts flow through the
-- SECURITY DEFINER RPC, never a broad cross-user select policy.
create policy "dna_endorsements_select_own" on public.dna_endorsements
  for select using ((select auth.uid()) = endorser_id);
create policy "dna_endorsements_insert_own" on public.dna_endorsements
  for insert with check ((select auth.uid()) = endorser_id and endorser_id <> target_id);
create policy "dna_endorsements_delete_own" on public.dna_endorsements
  for delete using ((select auth.uid()) = endorser_id);

revoke all on public.dna_endorsements from anon;
grant select, insert, delete on public.dna_endorsements to authenticated;
