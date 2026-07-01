-- LLM generation guardrails — durable per-user rate limiting + audit for the paid OpenAI edge
-- functions (reference consumer: generate-taste-summary, the Cinematic DNA reflection).
--
--   A. user_profiles_computed.editorial_material_sig — the "material signature" the current
--      reflection was written for. The client compares the live fingerprint signature against it to
--      detect that taste has MATERIALLY changed (drives the living-DNA auto-refresh). Owner-only RLS
--      on the table already covers this column.
--   B. llm_generation_log — one row per generation attempt: the durable per-user cooldown/quota
--      counter AND the audit trail (counts/flags only — never prompt text, titles, or watch history).
--      Deny-by-default: no anon/authenticated grants; all access is via the SECURITY DEFINER RPCs.
--   C. check_and_record_llm_generation — atomic gate: verifies the REAL caller (auth.uid()), enforces
--      uid == target, per-user cooldown, per-user daily cap, and a global daily budget kill-switch;
--      reserves a slot on success. record_llm_generation_outcome — stamps the terminal outcome.
--
-- ⚠️ NOT YET APPLIED to any remote environment. Files-only; deploy is a separate, explicitly
--    authorized step. The hardened edge function + client that USE these objects must deploy in the
--    same unit (see the plan's deploy-order note) — the frontend auto-refresh flag stays OFF until
--    this migration is applied and the edge functions redeployed.

-- =====================================================================
-- A. Material-signature column on user_profiles_computed (owner-only RLS asserted)
-- =====================================================================
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_profiles_computed'
  ) then
    raise exception 'user_profiles_computed table not found — aborting';
  end if;

  alter table public.user_profiles_computed add column if not exists editorial_material_sig text;

  -- The material signature is not sensitive, but the table is owner-private; assert that protection
  -- is in force (this migration does not add or relax any policy).
  if not (select relrowsecurity from pg_class where oid = 'public.user_profiles_computed'::regclass) then
    raise exception 'user_profiles_computed is not RLS-protected — aborting';
  end if;
end $$;

-- =====================================================================
-- B. llm_generation_log — durable limiter + audit (deny-by-default)
-- =====================================================================
create table if not exists public.llm_generation_log (
  id            bigint generated always as identity primary key,
  -- user_id is set on the per-user (authenticated-profile) path; NULL on the public/anon path
  -- (generate-reflection-prompt / ai-mood-context / generate-movie-overlay), where identity is a
  -- server-derived caller_key instead.
  user_id       uuid references public.users(id) on delete cascade,
  caller_key    text,                          -- public-path rate-limit key: 'u:<uid>' or 'ip:<hash>'
  function_name text not null,
  created_at    timestamptz not null default now(),
  outcome       text not null default 'ok',   -- ok | rejected_cooldown | rejected_cap | rejected_budget | grounding_rejected | llm_error
  material_sig  text,
  meta          jsonb not null default '{}'::jsonb  -- counts/flags only; NEVER prompt/titles/PII
);

create index if not exists llm_gen_log_user_fn_time_idx
  on public.llm_generation_log (user_id, function_name, created_at desc);
create index if not exists llm_gen_log_key_fn_time_idx
  on public.llm_generation_log (caller_key, function_name, created_at desc);
create index if not exists llm_gen_log_time_idx
  on public.llm_generation_log (created_at desc);

alter table public.llm_generation_log enable row level security;
-- No policies for anon/authenticated: every read/write goes through the SECURITY DEFINER RPCs below
-- (which run as the function owner and bypass RLS). Deny direct API access outright.
revoke all on table public.llm_generation_log from anon, authenticated;

-- =====================================================================
-- C. RPCs
--   Error contract (SQLSTATE surfaced via PostgREST):
--     PT401 -> unauthenticated
--     PT403 -> caller may only generate their own reflection
--     PT400 -> validation failure
--   The normal "denied" outcomes (cooldown / cap / budget) DO NOT raise — they return
--   { allowed:false, reason } so the edge function can fall back gracefully.
-- =====================================================================

create or replace function public.check_and_record_llm_generation(
  p_function_name  text,
  p_target_user_id uuid,
  p_cooldown_secs  integer default 3600,   -- per-user, per-function cooldown
  p_daily_cap      integer default 20,     -- per-user, per-function, rolling 24h
  p_global_cap     integer default 5000,   -- global rolling-24h budget (0 = hard stop)
  p_material_sig   text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_uid          uuid := (select auth.uid());
  v_last         timestamptz;
  v_user_today   integer;
  v_global_today integer;
  v_id           bigint;
begin
  -- 1. Identity (from the verified JWT, never a client-supplied id)
  if v_uid is null then
    raise exception 'unauthenticated' using errcode = 'PT401';
  end if;
  -- 2. Ownership: a caller may only generate their own reflection
  if p_target_user_id is null or v_uid <> p_target_user_id then
    raise exception 'forbidden: may only generate your own reflection' using errcode = 'PT403';
  end if;
  if p_function_name is null or length(p_function_name) = 0 or length(p_function_name) > 64 then
    raise exception 'invalid function_name' using errcode = 'PT400';
  end if;

  -- Serialize concurrent gate checks for this (user, function) so two simultaneous requests can't
  -- both pass the cooldown gate.
  perform pg_advisory_xact_lock(hashtext(v_uid::text || ':' || p_function_name));

  -- 3. Global daily budget (kill-switch): 0 stops all generation.
  if p_global_cap is not null and p_global_cap >= 0 then
    select count(*) into v_global_today
      from public.llm_generation_log
      where outcome = 'ok' and created_at > now() - interval '1 day';
    if v_global_today >= p_global_cap then
      insert into public.llm_generation_log (user_id, function_name, outcome, material_sig)
        values (v_uid, p_function_name, 'rejected_budget', p_material_sig);
      return jsonb_build_object('allowed', false, 'reason', 'global_budget');
    end if;
  end if;

  -- 4. Per-user cooldown (most recent successful generation for this function).
  if p_cooldown_secs is not null and p_cooldown_secs > 0 then
    select max(created_at) into v_last
      from public.llm_generation_log
      where user_id = v_uid and function_name = p_function_name and outcome = 'ok';
    if v_last is not null and v_last > now() - make_interval(secs => p_cooldown_secs) then
      insert into public.llm_generation_log (user_id, function_name, outcome, material_sig)
        values (v_uid, p_function_name, 'rejected_cooldown', p_material_sig);
      return jsonb_build_object('allowed', false, 'reason', 'cooldown');
    end if;
  end if;

  -- 5. Per-user daily cap (rolling 24h).
  if p_daily_cap is not null and p_daily_cap >= 0 then
    select count(*) into v_user_today
      from public.llm_generation_log
      where user_id = v_uid and function_name = p_function_name
        and outcome = 'ok' and created_at > now() - interval '1 day';
    if v_user_today >= p_daily_cap then
      insert into public.llm_generation_log (user_id, function_name, outcome, material_sig)
        values (v_uid, p_function_name, 'rejected_cap', p_material_sig);
      return jsonb_build_object('allowed', false, 'reason', 'daily_cap');
    end if;
  end if;

  -- 6. Passed all gates → reserve the slot (counts against cooldown/cap/budget even if OpenAI later
  --    fails; the conservative choice for cost. record_llm_generation_outcome refines it for audit).
  insert into public.llm_generation_log (user_id, function_name, outcome, material_sig)
    values (v_uid, p_function_name, 'ok', p_material_sig)
    returning id into v_id;

  return jsonb_build_object('allowed', true, 'reason', 'ok', 'id', v_id);
end;
$$;

create or replace function public.record_llm_generation_outcome(
  p_id      bigint,
  p_outcome text,
  p_meta    jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'unauthenticated' using errcode = 'PT401';
  end if;
  if p_outcome is null or length(p_outcome) = 0 or length(p_outcome) > 40 then
    raise exception 'invalid outcome' using errcode = 'PT400';
  end if;
  -- Own-row guard: silently no-op when the row isn't the caller's (don't leak row existence).
  update public.llm_generation_log
    set outcome = p_outcome,
        meta    = coalesce(p_meta, '{}'::jsonb)
    where id = p_id and user_id = v_uid;
end;
$$;

revoke all on function public.check_and_record_llm_generation(text, uuid, integer, integer, integer, text) from public, anon;
grant execute on function public.check_and_record_llm_generation(text, uuid, integer, integer, integer, text) to authenticated;
revoke all on function public.record_llm_generation_outcome(bigint, text, jsonb) from public, anon;
grant execute on function public.record_llm_generation_outcome(bigint, text, jsonb) to authenticated;

-- Public/anon path gate (for the anon-reachable LLM functions: generate-reflection-prompt,
-- ai-mood-context, generate-movie-overlay). Rate-limits by a SERVER-DERIVED caller_key (never an
-- auth.uid), so it works for signed-out callers. The global budget is the hard backstop; per-key
-- limits are best-effort for anon (IP is spoofable). Granted to anon + authenticated.
create or replace function public.check_and_record_llm_public(
  p_function_name text,
  p_caller_key    text,
  p_cooldown_secs integer default 20,
  p_daily_cap     integer default 40,
  p_global_cap    integer default 5000
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_last         timestamptz;
  v_key_today    integer;
  v_global_today integer;
  v_id           bigint;
begin
  if p_function_name is null or length(p_function_name) = 0 or length(p_function_name) > 64 then
    raise exception 'invalid function_name' using errcode = 'PT400';
  end if;
  if p_caller_key is null or length(p_caller_key) = 0 or length(p_caller_key) > 200 then
    raise exception 'invalid caller_key' using errcode = 'PT400';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_caller_key || ':' || p_function_name));

  -- Global daily budget (kill-switch): 0 stops all generation.
  if p_global_cap is not null and p_global_cap >= 0 then
    select count(*) into v_global_today
      from public.llm_generation_log
      where outcome = 'ok' and created_at > now() - interval '1 day';
    if v_global_today >= p_global_cap then
      insert into public.llm_generation_log (caller_key, function_name, outcome)
        values (p_caller_key, p_function_name, 'rejected_budget');
      return jsonb_build_object('allowed', false, 'reason', 'global_budget');
    end if;
  end if;

  -- Per-caller cooldown.
  if p_cooldown_secs is not null and p_cooldown_secs > 0 then
    select max(created_at) into v_last
      from public.llm_generation_log
      where caller_key = p_caller_key and function_name = p_function_name and outcome = 'ok';
    if v_last is not null and v_last > now() - make_interval(secs => p_cooldown_secs) then
      insert into public.llm_generation_log (caller_key, function_name, outcome)
        values (p_caller_key, p_function_name, 'rejected_cooldown');
      return jsonb_build_object('allowed', false, 'reason', 'cooldown');
    end if;
  end if;

  -- Per-caller daily cap (rolling 24h).
  if p_daily_cap is not null and p_daily_cap >= 0 then
    select count(*) into v_key_today
      from public.llm_generation_log
      where caller_key = p_caller_key and function_name = p_function_name
        and outcome = 'ok' and created_at > now() - interval '1 day';
    if v_key_today >= p_daily_cap then
      insert into public.llm_generation_log (caller_key, function_name, outcome)
        values (p_caller_key, p_function_name, 'rejected_cap');
      return jsonb_build_object('allowed', false, 'reason', 'daily_cap');
    end if;
  end if;

  insert into public.llm_generation_log (caller_key, function_name, outcome)
    values (p_caller_key, p_function_name, 'ok')
    returning id into v_id;

  return jsonb_build_object('allowed', true, 'reason', 'ok', 'id', v_id);
end;
$$;

revoke all on function public.check_and_record_llm_public(text, text, integer, integer, integer) from public;
grant execute on function public.check_and_record_llm_public(text, text, integer, integer, integer) to anon, authenticated;

-- ── Verification (run as an authenticated role after apply) ─────────────────────────────────────
-- begin;
--   -- unauthenticated → PT401
--   set local role authenticated; set local request.jwt.claims = '{}';
--   select public.check_and_record_llm_generation('generate-taste-summary','00000000-0000-0000-0000-000000000001');
--
--   set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001"}';
--   -- non-owner target → PT403
--   select public.check_and_record_llm_generation('generate-taste-summary','00000000-0000-0000-0000-000000000002');
--   -- owner, first call → { allowed:true, id:N } + one 'ok' row
--   select public.check_and_record_llm_generation('generate-taste-summary','00000000-0000-0000-0000-000000000001', 3600, 20, 5000, 'abc12345');
--   -- owner, immediate second call within cooldown → { allowed:false, reason:'cooldown' }
--   select public.check_and_record_llm_generation('generate-taste-summary','00000000-0000-0000-0000-000000000001', 3600, 20, 5000, 'abc12345');
--   -- global budget of 0 → { allowed:false, reason:'global_budget' }
--   select public.check_and_record_llm_generation('generate-taste-summary','00000000-0000-0000-0000-000000000001', 0, 20, 0, 'abc12345');
-- rollback;
