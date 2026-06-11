-- S1.2 — Global Security Hardening: view options, function grants, anon table grants.
--
-- SCOPE: grants / view security model / function EXECUTE only.
--   * No schema change. No row mutation. No data backfill. No RLS-policy change.
--   * No app-source change. No route/analytics/beta-gate change.
--
-- IDEMPOTENT: ALTER VIEW ... SET, REVOKE (of an absent privilege is a no-op), and
--   GRANT are all safe to re-run.
--
-- FROZEN CONTRACTS PRESERVED (untouched here):
--   * F8.6-SEC: get_cron_secret() / list_daily_briefing_subscribers() stay anon+auth-denied.
--   * F9.2: user_watchlist / mood_sessions owner-only RLS + authenticated grants unchanged
--           (we only remove the inert ANON grants below).
--   * B1.4a: beta_members owner-only SELECT, no client write — not touched.
--   * B1.4b analytics events, F8 People RPCs, public list sharing — not touched.
--
-- Addresses S1.1 P2 findings: two SECURITY DEFINER views (advisor ERRORs), an
-- anon-executable SECURITY DEFINER counter function, and inert anonymous grants on
-- RLS-protected per-user tables.

-- ---------------------------------------------------------------------------
-- 1) SECURITY DEFINER views -> security_invoker (advisor: security_definer_view)
-- ---------------------------------------------------------------------------
-- Both views are owned by postgres, ran as SECURITY DEFINER, and are unused by app
-- source (grep: 0 references). list_follower_counts exposes aggregate follower counts;
-- vw_movies_scored exposes catalog-only movie scoring. security_invoker makes them
-- evaluate with the querying role's privileges + RLS, so they can never silently
-- bypass row security.
-- ROLLBACK: alter view ... set (security_invoker = false);
alter view public.list_follower_counts set (security_invoker = true);
alter view public.vw_movies_scored     set (security_invoker = true);

-- Remove inert/unnecessary non-SELECT grants from the browser roles on the views.
-- A view is not a write surface for anon/authenticated; these default grants
-- (INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER) are inert and unnecessary.
-- SELECT is intentionally retained (harmless: views are unused by app source, and
-- security_invoker now scopes any read through the caller's RLS).
-- ROLLBACK: re-grant the listed privileges to the roles.
revoke insert, update, delete, truncate, references, trigger
  on public.list_follower_counts from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public.vw_movies_scored from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2) increment_session_interactions(uuid): drop anon EXECUTE
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER, pinned search_path (public, extensions, pg_catalog), returns void,
-- only bumps user_sessions.interactions_count for a given session id. The sole caller
-- is authenticated: src/shared/services/interactions.js -> trackInteraction(), which
-- early-returns when there is no signed-in user (and initSession likewise). Anonymous
-- EXECUTE was an unnecessary surface (counter inflation for a guessed session uuid).
-- NOTE: Postgres default-grants EXECUTE on functions to PUBLIC, so revoking from
-- anon alone is NOT enough (anon inherits EXECUTE via PUBLIC). We revoke from
-- PUBLIC and anon, then grant explicitly to authenticated (the only caller).
-- ROLLBACK: grant execute on function public.increment_session_interactions(uuid) to public;
revoke execute on function public.increment_session_interactions(uuid) from public;
revoke execute on function public.increment_session_interactions(uuid) from anon;
grant  execute on function public.increment_session_interactions(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Remove ALL anonymous grants from RLS-protected per-user tables (defense in depth)
-- ---------------------------------------------------------------------------
-- Every table below has RLS enabled with owner-only policies, so anon already sees
-- zero rows. These are per-user data tables; the app only ever reads/writes them as the
-- authenticated role, scoped by user_id (no anonymous/public route touches them). The
-- inert anon grants (SELECT + assorted write grants) are removed so anonymous requests
-- are denied at the grant layer too, not only by RLS. authenticated grants are LEFT
-- INTACT — RLS owner policies continue to scope them.
-- ROLLBACK: grant select (and any prior write privileges) on each table to anon.
revoke all on table public.user_history          from anon;
revoke all on table public.user_ratings           from anon;
revoke all on table public.user_profiles_computed from anon;
revoke all on table public.user_settings          from anon;
revoke all on table public.user_preferences       from anon;
revoke all on table public.user_events            from anon;
revoke all on table public.user_interactions      from anon;
revoke all on table public.user_sessions          from anon;
revoke all on table public.user_similarity        from anon;
revoke all on table public.mood_sessions          from anon;
revoke all on table public.user_watchlist         from anon;
