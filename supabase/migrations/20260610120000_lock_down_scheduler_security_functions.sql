-- Migration: lock down scheduler / diagnostic SECURITY DEFINER functions (F8.6-SEC)
--
-- The F8.6 audit found, via live advisor + grant inspection, that several public
-- SECURITY DEFINER functions were EXECUTE-able by the browser roles (anon + authenticated)
-- through PostgREST /rest/v1/rpc. Two were P0:
--
--   * public.get_cron_secret()                  — reads the vault `cron_secret` and returned
--                                                 it to anyone holding the public anon key.
--   * public.list_daily_briefing_subscribers()  — returned every briefing subscriber's email.
--
-- These objects exist in the live database but were created out-of-band (not previously
-- tracked in repo migrations). This migration brings their grants back under migration
-- control (the function bodies remain untracked — a follow-up should CREATE OR REPLACE them
-- into source to fully close the drift).
--
-- Legitimate callers are the `postgres` owner (pg_cron jobs 1-3) and the SERVICE ROLE bridge
-- used by the `send-daily-briefings` + `process-account-deletions` edge functions, both of
-- which call get_cron_secret()/list_daily_briefing_subscribers() with the service role.
-- Neither needs anon/authenticated EXECUTE. Revoking it does NOT affect the cron pipeline:
-- the jobs run as `postgres` (the owner), which executes regardless of grants.
--
-- Also closes anon/authenticated EXECUTE on DBA-only diagnostic functions (verified: zero
-- callers in app source), keeps the auth trigger function off the REST surface, and drops
-- the pointless anon grant on the two AUTHENTICATED account-deletion RPCs.
--
-- NOT touched: public.increment_session_interactions(uuid) — a browser-called pre-auth
-- session counter that legitimately needs anon (residual backlog: tighten only if it can be
-- proven authenticated-only). The vault `cron_secret` is rotated out-of-band after this
-- migration (vault-only — both edge functions read it via the get_cron_secret() RPC).
--
-- Forward-only. All grant changes are idempotent.

begin;

-- ── P0: secret + PII exposure — service_role bridge + postgres owner only ─────────────────
revoke all on function public.get_cron_secret()                  from public, anon, authenticated;
revoke all on function public.list_daily_briefing_subscribers()  from public, anon, authenticated;
grant execute on function public.get_cron_secret()                 to service_role;
grant execute on function public.list_daily_briefing_subscribers() to service_role;

-- ── P2: DBA-only diagnostics (zero app/browser callers; info disclosure) ──────────────────
revoke all on function public.database_health_check()              from public, anon, authenticated;
revoke all on function public.check_foreign_keys(text)             from public, anon, authenticated;
revoke all on function public.check_indexes(text[])                from public, anon, authenticated;
revoke all on function public.check_unique_constraints(text[])     from public, anon, authenticated;
revoke all on function public.check_duplicate_feedback()           from public, anon, authenticated;
revoke all on function public.check_duplicate_ratings()            from public, anon, authenticated;
revoke all on function public.check_invalid_watchlist_statuses()   from public, anon, authenticated;
grant execute on function public.database_health_check()            to service_role;
grant execute on function public.check_foreign_keys(text)           to service_role;
grant execute on function public.check_indexes(text[])              to service_role;
grant execute on function public.check_unique_constraints(text[])   to service_role;
grant execute on function public.check_duplicate_feedback()         to service_role;
grant execute on function public.check_duplicate_ratings()          to service_role;
grant execute on function public.check_invalid_watchlist_statuses() to service_role;

-- ── P2: auth trigger function must not be a REST RPC (trigger fires regardless of grants) ──
revoke all on function public.handle_new_auth_user()               from public, anon, authenticated;
grant execute on function public.handle_new_auth_user()             to service_role;

-- ── P2: account-deletion RPCs are AUTHENTICATED app actions (Account page; use auth.uid()) ─
-- Drop the useless anon grant (anon has no uid → no-op); KEEP authenticated for the app.
revoke all on function public.request_account_deletion(text)       from public, anon, authenticated;
revoke all on function public.cancel_account_deletion()            from public, anon, authenticated;
grant execute on function public.request_account_deletion(text)     to authenticated, service_role;
grant execute on function public.cancel_account_deletion()          to authenticated, service_role;

commit;
