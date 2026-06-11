# S1.3 — Auth & dashboard security hardening (operator checklist)

Status: **current** · Phase: S1 Global Security Hardening · Created during S1.3.

This document records what S1.3 verified, the one SQL change it made, and the
**dashboard-only operator actions** that cannot be expressed in repo migrations.
Nothing in the "operator action" sections has been applied automatically — they
require the Supabase Dashboard or Management API.

No secrets, real emails, user IDs, or private data appear in this document.

---

## 1. What S1.3 changed in SQL (applied + verified)

Migration `supabase/migrations/20260611140000_harden_beta_members_and_auth_security.sql`:

- **`beta_members` latent grants closed.** `authenticated` held `REFERENCES, SELECT,
  TRIGGER, TRUNCATE`. SELECT is the intended owner-only self-read (RLS:
  `auth.uid() = user_id`). Revoked `INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES,
  TRIGGER` from `anon` + `authenticated` (TRUNCATE bypasses RLS and could have wiped
  the gate). `authenticated` now has **SELECT only**; `service_role` keeps full
  management; `anon` has nothing. RLS + owner-only policy unchanged.

Verify: `scripts/verify-s13-auth-security.sql` (read-only).

## 2. What S1.3 verified (no change needed)

- **Authenticated SECURITY DEFINER RPC review.** All 21 SECURITY DEFINER functions in
  `public` were audited. Every `authenticated`-executable one is an intentional,
  `auth.uid()`-scoped browser RPC:
  - People least-data: `get_people_public_identities(uuid[])`, `search_people_by_name(text)`,
    `get_follow_suggestions()`, `get_discoverable_taste_profiles()`
  - Account deletion: `request_account_deletion(text)`, `cancel_account_deletion()`
  - Bounded counter: `increment_session_interactions(uuid)` (returns void; worst case is
    counter inflation for a guessed session id)
  All service-role-only functions (cron `_call_*`, health/`check_*`, `get_cron_secret`,
  `list_daily_briefing_subscribers`, `get_watchlist_with_status`, `get_positive_feedback_movies`,
  `refresh_feelflick_stats`, `handle_new_auth_user`) are already `anon` + `authenticated`
  denied. **No mis-granted function found → no EXECUTE tightening applied this phase.**
- **S1.2 hardening intact**: both views `security_invoker=true`; `increment_session_interactions`
  anon-denied; anon SELECT revoked on the 11 user tables; F8.6-SEC functions anon+auth denied.

---

## 3. Dashboard-only operator actions (NOT applied — require Dashboard/Management API)

The Supabase MCP exposes no auth-config write path, so these were not changed here.
Each shows current advisor state, target, and exact steps.

### 3a. Leaked-password protection — **currently DISABLED → enable**
- **Why:** blocks known-breached passwords (HaveIBeenPwned) at signup/password-change.
- **Steps:** Supabase Dashboard → **Authentication → Policies / Password protection** →
  enable **"Check passwords against HaveIBeenPwned"**. (Management API: `auth` config,
  `security_update_password_require_reauthentication` / password-strength settings.)
- **Verify:** re-run security advisors; `auth_leaked_password_protection` clears.
- **Timing:** **recommended before 5–10 beta users; required before public.**
- **Rollback:** toggle off (no data impact).
- Ref: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### 3b. OTP expiry — **currently > 1 hour → set ≤ 1 hour**
- **Why:** long-lived email OTP/magic-link codes widen the phishing/replay window.
- **Steps:** Dashboard → **Authentication → Email/Providers (Email) → OTP / Email OTP
  Expiration** → set to **30 minutes** (or 60 min max). Confirm the email magic-link/OTP
  login flow still completes (codes are short-lived but adequate).
- **Verify:** advisors; `auth_otp_long_expiry` clears.
- **Timing:** **before 5–10 beta users.**
- **Rollback:** raise the value again.
- Ref: https://supabase.com/docs/guides/platform/going-into-prod#security

### 3c. Redirect URLs / allowed domains / signup posture — **review**
- **Steps:** Dashboard → **Authentication → URL Configuration**:
  - Confirm **Site URL** = production (`https://app.feelflick.com`).
  - **Redirect Allow List**: keep only intended origins (prod + explicit preview/local
    dev). **Remove stray wildcards / unused localhost** before public.
  - **Authentication → Providers**: confirm Google OAuth redirect/authorized origins.
  - **Signups**: confirm whether email signups are open; the beta gate (`beta_members`,
    owner-only) is an **app-layer** allowlist and is **independent of** Supabase signup —
    enabling Auth signups does not bypass the gate, but confirm that's the intended posture.
- **Classify:** safe for 1–2; **review before 5–10**; tighten wildcards before public.
- Ref: https://supabase.com/docs/guides/auth/redirect-urls

### 3d. Postgres security patch — **patch available → schedule**
- **Current:** `supabase-postgres-15.8.1.102` has outstanding security patches.
- **Nature:** platform upgrade (Dashboard → **Settings → Infrastructure → Upgrade**);
  involves a brief restart/downtime; not expressible as a repo migration.
- **Pre-req:** confirm no in-flight migrations; take/confirm a backup; pick a low-traffic
  maintenance window; have rollback/restore posture from the project's PITR/backups.
- **Timing:** **before wider beta if desired; recommended before public production.**
  Requires explicit operator approval of the maintenance window — do not auto-apply.
- Ref: https://supabase.com/docs/guides/platform/upgrading

### 3e. Extensions in `public` (`pg_trgm`, `pg_net`) — **do not relocate now**
- **Decision (S1.3): defer.** Relocating to a dedicated schema (e.g. `extensions`) is
  non-trivial: objects/functions referencing them (search, async HTTP) would need
  `search_path`/qualified-reference updates; risk of breaking trigram search and pg_net
  calls. Supabase flags it as a WARN, not an error.
- **Recommended timing:** dedicated maintenance window in **S1.4** (source-of-truth
  migration phase), with dependency mapping + verification. Do not apply without approval.
- Ref: https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public

---

## 4. Timing summary

| Item | before 1–2 | before 5–10 | before public beta | before public prod |
|---|---|---|---|---|
| beta_members grant cleanup | ✅ done (S1.3) | — | — | — |
| Leaked-password protection | optional | **recommended** | required | required |
| OTP expiry ≤ 1h | optional | **recommended** | required | required |
| Redirect/signup review | safe | **review** | tighten | required |
| Postgres patch | optional | optional | recommended | **required** |
| Extensions relocation | no | no | optional | recommended (S1.4) |

## 5. Rollback notes

- beta_members grants: `grant truncate, references, trigger on table public.beta_members
  to authenticated;` (restores prior state). No data is affected by either direction.
- All dashboard items are toggles/settings — reversible from the Dashboard with no data
  impact, except the Postgres patch (forward-only; rely on backup/PITR for recovery).

## 6. Deferred to S1.4

- Scheduler / function source-of-truth migrations (align remote function bodies with repo).
- `extension_in_public` relocation (pg_trgm, pg_net) with dependency mapping.
- `rls_enabled_no_policy` INFO findings on `discovery_cursors`, `update_runs`.
- Optional: evaluate SECURITY INVOKER conversion for the intentional authenticated RPCs
  (behavior-risk change — out of grant-only scope).
