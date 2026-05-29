-- Migration: restore client-side on-demand catalog upsert on public.movies
--
-- WHY: 20260529000000_secure_catalog_tables_rls revoked all writes from anon/
-- authenticated on 18 tables. That correctly locks 17 read-only tables, but the
-- client legitimately INSERTs into `movies` (on-demand TMDB caching) via
-- ensureMovieInDb.js (select-then-insert), onboarding.js, and ResultsGrid.jsx.
--
-- This restores writes on `movies` ONLY, scoped to the pre-existing RLS policies:
--   * movies_write_auth   -> INSERT for public (anon + authenticated)
--   * movies_update_auth  -> UPDATE for authenticated (qual: auth.role()='authenticated')
--
-- DELETE and TRUNCATE remain REVOKED (no policy backs them; TRUNCATE is not
-- RLS-gated). All writes for the other 17 tables continue via service_role.
--
-- Forward-only. Pairs with 20260529000000.

begin;

grant insert on table public.movies to anon, authenticated;
grant update on table public.movies to authenticated;

commit;
