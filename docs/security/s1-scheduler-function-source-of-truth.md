# S1.4 — Scheduler/function source-of-truth audit

Status: **current** · Phase: S1 Global Security Hardening (final phase) · Audit + verification only.

S1.4 closed the source-of-truth question for the scheduler/diagnostic functions and the
remaining advisor INFO/WARN items. **No live migration was applied** — see §3 for why.
No secrets, Vault values, function bodies, cron secrets, or PII appear here.

---

## 1. Outcome summary

- **No function source-of-truth drift to close.** All 18 audited scheduler/diagnostic/
  account functions are **already represented in repo migrations** (≥1 definition each).
  Their live posture (SECURITY DEFINER, owner postgres, pinned search_path, grants) matches
  the verified S1.2/S1.3/F8.6-SEC posture. → No capture migration created.
- **RLS-INFO tables** (`discovery_cursors`, `update_runs`): service-role-only, browser
  roles have **no grants**, RLS enabled → benign **P3**. No change.
- **Extensions in public** (`pg_trgm`, `pg_net`): **defer** relocation (P2, maintenance task).
- **Cron**: 3 jobs active + intact; F8.6-SEC secret bridge intact. No change.
- **Out-of-repo Edge source gap** (`send-daily-briefings`, `process-account-deletions`): P2,
  recommend a future edge-source tracking phase (§6).

## 2. Function inventory (catalog facts; no bodies/secrets)

All `public`, all `SECURITY DEFINER`, owner `postgres`, search_path pinned, **already in repo migrations**:

| function | grants | repo? | notes |
|---|---|---|---|
| `get_cron_secret()` | svc only | ✅ | reads Vault; search_path=vault. **Defer re-capture** (secret-coupled) |
| `list_daily_briefing_subscribers()` | svc only | ✅ | no secret literal; returns subscriber rows (PII) → svc-only |
| `_call_process_account_deletions()` | svc only | ✅ | Vault + pg_net → Edge. **Defer** (secret/Edge-coupled) |
| `_call_send_daily_briefings()` | svc only | ✅ | Vault + pg_net → Edge. **Defer** (secret/Edge-coupled) |
| `refresh_feelflick_stats()` | svc only | ✅ | stats refresh |
| `handle_new_auth_user()` | svc only (trigger) | ✅ | auth.users trigger; defer (trigger-wired) |
| `get_watchlist_with_status(uuid,text)` | svc only | ✅ | takes user id; **not** browser-executable |
| `get_positive_feedback_movies(uuid)` | svc only | ✅ | takes user id; **not** browser-executable |
| `database_health_check()` | svc only | ✅ | diagnostic |
| `check_foreign_keys(text)` / `check_indexes(text[])` / `check_unique_constraints(text[])` | svc only | ✅ | diagnostics |
| `check_duplicate_feedback()` / `check_duplicate_ratings()` / `check_invalid_watchlist_statuses()` | svc only | ✅ | diagnostics |
| `increment_session_interactions(uuid)` | auth + svc | ✅ | S1.2 (anon revoked); bounded counter |
| `request_account_deletion(text)` / `cancel_account_deletion()` | auth + svc | ✅ | `auth.uid()`-scoped account-deletion |

**Key invariant verified:** **no** SECURITY DEFINER function in `public` is anon-executable.

## 3. Capture / defer / remove decision

- **No capture migration.** Every target function already exists in repo migrations, so a
  `CREATE OR REPLACE` "capture" would be redundant and could itself *introduce* drift (the
  live body could differ in incidental formatting from the existing repo definition). The
  secret/Edge-coupled functions (`get_cron_secret`, `_call_*`) are **defer-by-policy** —
  re-capturing them risks the Vault/pg_net bridge and offers no security gain (grants already
  correct). 
- **Limitation (honest):** this audit confirms *presence* in repo + correct *grants/
  search_path/SECURITY DEFINER*; it does not byte-compare each live body against its repo
  definition (formatting-sensitive). If exact body parity is later required, do it as a
  dedicated, reviewed pass — not an unreviewed live capture.
- **Remove:** nothing. No unused function proven removable.

## 4. RLS-enabled / no-policy INFO tables — **P3, intentional, no change**

| table | rows | RLS | policies | anon | authenticated | service_role |
|---|---|---|---|---|---|---|
| `discovery_cursors` | 47 | on | 0 | none | none | full |
| `update_runs` | 10 | on | 0 | none | none | full |

Both are **service-role-only internal tables**. With RLS enabled, no policy, and **no
browser-role grants**, anon/authenticated are denied at both the grant and RLS layers — the
`rls_enabled_no_policy` advisor finding is INFO-level and benign here. Adding a no-op policy
would be cosmetic and is not worth a behavior touch. **No action.** (Optional future: add an
explicit `-- deny all` comment policy purely to silence the linter.)

## 5. Extension-in-public decision — **defer (P2)**

| ext | schema | version | in use |
|---|---|---|---|
| `pg_trgm` | public | 1.6 | yes — trigram search (`search_people_by_name`, ILIKE/similarity) |
| `pg_net` | public | 0.14.0 | yes — cron→Edge bridge (`_call_*` `net.http_post`) |

Relocating to a dedicated `extensions` schema requires updating qualified references /
search_paths in dependent functions + indexes/operators, with breakage risk to search and the
cron bridge. Non-trivial; needs a maintenance window + verification. **Do not relocate now.**
Recommended **before public production** (not a beta blocker). Ref:
https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public

## 6. Cron dependency review

| job | schedule | active | notes |
|---|---|---|---|
| `process_account_deletions_hourly` | `30 * * * *` | yes | calls `_call_process_account_deletions()` |
| `send_daily_briefings_hourly` | `0 * * * *` | yes | calls `_call_send_daily_briefings()` |
| `refresh_feelflick_stats_nightly` | `15 3 * * *` | yes | calls `refresh_feelflick_stats()` |

The cron commands are thin wrappers; the Vault-secret + `pg_net` HTTP logic lives inside the
service-role-only `_call_*` SQL functions (F8.6-SEC bridge intact, anon+auth denied). **No cron
change made.**

**Out-of-repo Edge Function source gap (P2):** the Edge functions invoked by the bridge —
`send-daily-briefings` and `process-account-deletions` — are **not present in
`supabase/functions/`** (only `ai-mood-context`, `generate-movie-overlay`,
`generate-reflection-prompt`, `generate-taste-summary` are). This is a *source-of-truth* gap,
not a live vulnerability. **Recommend a dedicated edge-source tracking phase** to vendor those
functions into the repo; do not fake coverage here.

## 7. Verification

`scripts/verify-s14-scheduler-functions.sql` (read-only) — **all checks pass** live:
no anon-executable SECURITY DEFINER fn; all 18 target fns exist + SECURITY DEFINER + pinned
search_path; F8.6-SEC (`get_cron_secret`, `list_daily_briefing_subscribers`, `_call_*`) anon+auth
denied; S1.2 (views invoker, `increment_session_interactions` anon-denied, user-table anon
SELECT denied); S1.3 (`beta_members` authenticated SELECT-only, no anon); RLS-INFO tables
service-role-only; 3 cron jobs active.

## 8. Remaining security / operator backlog

Dashboard/operator-owned (from S1.3, still advisor WARNs — unchanged here):
- Enable leaked-password protection (before 5–10 / required public).
- OTP expiry ≤ 1h (before 5–10).
- Redirect-URL allowlist review (drop stray wildcards/localhost before public).
- Apply Postgres security patch in an approved maintenance window (before public prod).

Future engineering phases:
- **Edge-source tracking** for `send-daily-briefings` + `process-account-deletions` (P2).
- **Extension relocation** maintenance window for `pg_trgm` + `pg_net` (P2, before public prod).
- Optional: byte-exact function-body parity pass; optional `discovery_cursors`/`update_runs`
  comment-policy to silence the INFO linter (P3).
