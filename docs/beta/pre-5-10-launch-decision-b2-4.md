# Pre-5–10 private-beta launch decision (B2.4)

Status: **current** · Phase: B2 Private Beta Observation · Launch-execution audit (docs only).

## 1. Executive verdict

> **NO-GO until PostHog production capture is fixed + verified.** (Operator decision: fix-first
> over accepting server-side-only observability.) P0: 0 · P1: 0. Every other launch gate is GO.

The security/privacy/data posture is fully GO (all health/security gates green after S1.5, 0
P0/P1, owner-only RLS + secret bridge intact, server funnel flowing, Sentry clean, cron healthy,
beta-gate code fail-safe). The **only** blocker is observability: production PostHog client
capture is dark. Once the public `VITE_POSTHOG_KEY` is set in the Cloudflare Pages prod build,
redeployed, and verified (one `page_viewed` lands + one masked replay), this flips to **GO FOR
GATED 5–10 WAVE** subject to the standard pre-invite operator steps (§7, §10).

This is an operations/readiness audit. No app code, routes, analytics source, RLS, schema, or
migrations changed; no live data mutated; no beta members added; gate not enabled; no flags
toggled. Anonymized aggregates only — no raw user IDs, emails, names, PostHog payloads, or secrets.

Builds on [`pre-5-10-operational-hardening-b2-3.md`](pre-5-10-operational-hardening-b2-3.md) (B2.3)
and S1.5 (`origin/main` `7dc9db73`).

## 2. Canonical main / local divergence note

- **Canonical: `origin/main` = `7dc9db73`** ("Harden public list grants (#294)", S1.5). This audit +
  any PR are based on it.
- **Local `main` = `df919d25`** — a pre-existing **local-only persona-workflow commit** that
  diverged from origin (the same persona work is on origin via PR #293 `d6ee8bc2`, different
  content). **Not touched** (no reset, no force-push). Operator housekeeping (non-blocking):
  reconcile local `main` to `origin/main` once nothing local-only is worth keeping.

## 3. PostHog production-capture result — **NOT VERIFIED (dark); root cause confirmed**

- **Empirical:** PostHog received **0 events in the last 24h** (and 8 in 7d, all dated 2026-06-04)
  while `recommendation_impressions` logged **185 rows in the last 24h** — live prod traffic is
  not reaching PostHog.
- **Root cause (confirmed via prod bundle inspection):** the deployed bundle contains posthog-js
  **and** the replay-masking config (`maskAllInputs`/`maskTextSelector`) but **no `phc_` API-key
  literal** → **`VITE_POSTHOG_KEY` is unset/empty in the Cloudflare Pages production build**, so
  `initAnalytics()` no-ops and PostHog never initializes. (Key presence checked as a boolean only;
  the value was never printed.)
- **Privacy:** fails **safe** — nothing is captured, so there is **no PII/observability privacy
  risk** today; and the (currently inactive) config is correct (id-only identify, full masking).
- **No tool path** to set Cloudflare Pages env vars from here → **manual operator fix**:
  1. In Cloudflare Pages → the `feelflick-app` project → Settings → Environment variables
     (Production): set `VITE_POSTHOG_KEY` = the **public** PostHog project key (`phc_…`), and
     `VITE_POSTHOG_HOST` if used (`https://us.i.posthog.com`). **Public key only — never a secret.**
  2. Redeploy production.
  3. Verify: load a public page signed-out → confirm one `page_viewed`/`$pageview` lands in PostHog;
     open one session replay → confirm text/inputs are **masked**.
  4. Confirm a signed-in `recommendation_*`/`discover_opened` event appears (funnel sanity).

**Classification: PostHog prod capture NOT verified — fix-first chosen → NO-GO until verified.**

## 4. Historical PostHog residue result — unchanged, accepted-pending

- Lifetime raw-`query` residue = **1 event**; raw-query in last 7d = **0** (no beta-window
  recurrence). Current code clean + test-enforced (search emits only a length bucket + `movie_id`).
- **Not deleted** — the only MCP tool (`persons-bulk-delete`) is person-level and would over-delete
  ~1.3k unrelated dev events beyond the authorized 2-event scope; surgical event deletion is
  dashboard-only. Manual step: PostHog → Data management → Delete events filtered to
  `search_performed` where `query`/`movie_title` is set.
- **P2** — acceptable for 5–10 (dev-era, no recurrence); **required before public beta/production.**

## 5. Auth dashboard hardening result — still pending (manual)

Re-confirmed live via advisors (all WARN, 0 ERROR):

| Item | Status | Target | Manual step |
|---|---|---|---|
| Leaked-password protection | **DISABLED** | enabled | Dashboard → Authentication → Password protection → enable HaveIBeenPwned check |
| OTP expiry | **> 1h** | ≤ 1h (prefer 30m) | Dashboard → Authentication → Email/OTP → set expiry ≤ 3600s |
| Postgres security patch | available | patched | Dashboard → Settings → Infrastructure → Upgrade (before public) |

No MCP write path → not changed here. Recommended before 5–10 (leaked-password + OTP); required
before public.

## 6. Redirect URL review result — dashboard audit required

Live allowlist is not MCP-readable. Source-inferred legitimate targets + classification:

| Target | Class |
|---|---|
| Site URL `https://app.feelflick.com` | keep |
| `https://app.feelflick.com/auth/callback` (nonce-validated) | keep |
| Google OAuth authorized origins/redirect | keep (verify in provider) |
| `localhost` / dev callback | dev-only (keep only if intentional) |
| Preview-deploy URLs / wildcards / stale domains | remove before 5–10 if present |

Operator audits the live list (Dashboard → Authentication → URL Configuration); classify + remove
stray wildcards/localhost before 5–10. No URLs removed without approval.

## 7. Beta gate ON-path readiness

- **Code verified fail-safe:** `BetaAccessGate` unit tests **9/9 pass** (off-by-default
  pass-through; enabled path: active member → allowed, non-member → `BetaAccessRequired`, error →
  never allowed; owner-only RLS read). `beta_members` = **0 rows**.
- **Production ON-path NOT exercised** (enabling the gate / adding members not authorized this
  phase). **Required before adding 5–10:**
  1. set `VITE_ENABLE_BETA_GATE=true` (Cloudflare Pages prod) → redeploy;
  2. add members via **service-role SQL only**:
     `insert into public.beta_members (user_id, status) values ('<USER_UUID>','active') on conflict (user_id) do update set status='active';`
  3. run `scripts/verify-beta-gate.sql`;
  4. smoke-test: public route ok · auth callback ok · non-member sees `BetaAccessRequired` ·
     active member reaches `/home` · no redirect loop · legal/privacy route reachable
     (use one designated "gate smoke-test member"; no raw UUID recorded).

## 8. Health / security verification result (all green post-S1.5; booleans/counts)

| Check | Result |
|---|---|
| S1.5 `lists`/`list_movies` anon: SELECT kept, write/DDL revoked | ✓ |
| `beta_members` anon=none / auth=SELECT-only; rows | ✓ / 0 |
| Owner-only `auth.uid()` RLS (watchlist/ratings/history/mood/lists) | ✓ |
| User-tables anon SELECT denied | ✓ |
| `increment_session_interactions` anon EXECUTE denied | ✓ |
| F8.6 secret bridge anon+auth denied | ✓ |
| No anon-executable SECURITY DEFINER fn | ✓ |
| S1.2 views `security_invoker` | ✓ |
| Cron: 3 jobs active; run health (48h) | ✓ (deletions 48/0, briefings 48/0, stats 2/0 — 0 failures) |
| `recommendation_impressions` flowing (24h) | ✓ (185) |
| Sentry unresolved / beta-window errors | 0 / 0 |
| Advisors | only known WARN/INFO set; **0 ERROR** |

## 9. 5–10 go/no-go decision

> **NO-GO UNTIL PostHog production capture is fixed + verified** (§3). Then → **GO FOR GATED 5–10 WAVE**.

| Criterion | Status |
|---|---|
| P0 / P1 | 0 / 0 |
| PostHog prod capture | **DARK — blocker (fix-first chosen)** |
| Historical PostHog residue | retained, 0 recurrence — P2, accepted for 5–10 / required before public |
| Leaked-password protection | pending (manual) — recommended before 5–10 |
| OTP expiry ≤ 1h | pending (manual) — recommended before 5–10 |
| Redirect URL review | pending (dashboard audit) |
| Beta gate ON-path smoke | code-verified (9/9); **prod ON-path required before adding 5–10** |
| Health checks | all green |
| Any feature flag to disable? | No (the gate flag should be *enabled* for a gated wave) |

## 10. Remaining manual operator tasks (in order)
1. **Set `VITE_POSTHOG_KEY` (public) in Cloudflare Pages prod → redeploy → verify capture + masked replay.** *(unblocks GO)*
2. Decide gate posture (GATED recommended) → set `VITE_ENABLE_BETA_GATE=true` → redeploy → add members (service-role SQL) → `verify-beta-gate.sql` → ON-path smoke test.
3. Auth dashboard: enable leaked-password protection; OTP ≤ 1h; audit redirect-URL allowlist.
4. PostHog historical residue: surgical delete (manual) — or record retention exception (required before public).
5. Re-run health scripts; confirm Sentry/PostHog; confirm 0 open P0/P1; confirm invite copy uses the B1.6 disclosure.
6. *(Housekeeping)* reconcile local `main` with `origin/main`.

## 11. Exact next action

**Set the public `VITE_POSTHOG_KEY` in the Cloudflare Pages production environment and redeploy,
then verify one `page_viewed` event lands and one session replay shows masked text.** That single
operator action clears the only blocker; combined with the gate enable+populate + ON-path smoke
test (and, recommended, the leaked-password/OTP toggles), the wave is **GO FOR GATED 5–10**. No
app code change is required.
