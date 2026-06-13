-- S1.5 — harden public list grants (defense-in-depth).
--
-- DECISION: Option A — KEEP anonymous SELECT for explicit public-list sharing.
--   public.lists has an opt-in public-share feature (is_public flag, default FALSE per F9.2;
--   shareable /lists/:id links render signed-out). The "Public lists are readable by anyone"
--   RLS policy already scopes anon reads to is_public=true rows (private lists stay owner-only),
--   and list_movies visibility follows its parent list. We PRESERVE that sharing behavior and
--   only remove the inert, unnecessary anonymous WRITE grants.
--
-- SCOPE: grant-only. No schema change, no RLS-policy change, no row mutation, no is_public
--   change, no ownership change, no app source. Idempotent. Rollback below.
--
-- Pre-state (audited live): anon, authenticated, and service_role each held FULL table
--   privileges (SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER) on both tables; the
--   PUBLIC role holds NO grant (verified) so no PUBLIC revoke is needed. RLS is enabled on both;
--   the only write policy ("Users can manage own lists" / "...movies in own lists") requires
--   auth.uid() = user_id, so anonymous writes are ALREADY RLS-blocked — the anon write grants
--   are inert. This removes them so anon has no write path at the grant layer either.
--   Live anon-impersonation confirmed anon sees only is_public=true lists (0 private visible).
--
-- After: anon = SELECT only (public-list read via RLS); authenticated = full (RLS-constrained to
--   the owner); service_role = full (management). Private lists remain owner-only.
--
-- FROZEN CONTRACTS PRESERVED: F9.2 (new lists default private), explicit public-list sharing,
--   owner-only private lists, F9.3 list create/delete reliability, F8.6-SEC, S1.2/S1.3/S1.4.
--
-- ROLLBACK: grant insert, update, delete, truncate, references, trigger
--   on table public.lists, public.list_movies to anon;

revoke insert, update, delete, truncate, references, trigger
  on table public.lists from anon;

revoke insert, update, delete, truncate, references, trigger
  on table public.list_movies from anon;
