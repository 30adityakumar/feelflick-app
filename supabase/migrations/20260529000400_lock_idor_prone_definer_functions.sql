-- Migration: lock down IDOR-prone SECURITY DEFINER functions
--
-- WHY: get_watchlist_with_status(p_user_id, p_status) and
-- get_positive_feedback_movies(p_user_id) are SECURITY DEFINER (bypass RLS) and
-- filter by a CALLER-SUPPLIED p_user_id with NO auth.uid() check. They were
-- executable by anon/authenticated via PostgREST RPC, so anyone could read ANY
-- user's watchlist / liked movies by passing another user's id (IDOR). User ids
-- are discoverable via the public leaderboard views + /profile/:userId URLs,
-- making this chain-exploitable.
--
-- SAFE TO REVOKE: neither is called by the client —
--   * get_positive_feedback_movies : 0 call sites in src/
--   * get_watchlist_with_status    : only via the exported wrapper
--     getWatchlistWithStatus(), which itself has 0 callers (dead).
-- Any future/server-side use runs as service_role (retained below).
--
-- If these are wired into a feature later, rebuild them to filter by
-- auth.uid() (self-access) or gate on a privacy setting — do NOT trust a
-- caller-supplied user_id in a SECURITY DEFINER function.
--
-- NOTE: increment_session_interactions(session_id) is intentionally NOT changed
-- here — it IS called by the client (interactions.js) and is low-impact. Track
-- separately: add a check that the session belongs to auth.uid().
--
-- Forward-only.

begin;

revoke execute on function public.get_watchlist_with_status(uuid, text) from public, anon, authenticated;
revoke execute on function public.get_positive_feedback_movies(uuid)    from public, anon, authenticated;

grant execute on function public.get_watchlist_with_status(uuid, text) to service_role;
grant execute on function public.get_positive_feedback_movies(uuid)    to service_role;

commit;

-- VERIFICATION (read-only):
-- select p.proname,
--        has_function_privilege('anon', p.oid, 'EXECUTE')          as anon_exec,
--        has_function_privilege('authenticated', p.oid, 'EXECUTE') as authd_exec,
--        has_function_privilege('service_role', p.oid, 'EXECUTE')  as service_exec
-- from pg_proc p join pg_namespace n on n.oid=p.pronamespace
-- where n.nspname='public' and p.proname in ('get_watchlist_with_status','get_positive_feedback_movies');
