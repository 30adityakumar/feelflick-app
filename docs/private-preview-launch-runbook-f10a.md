# F10A — Private Preview Launch Runbook (internal)

> **Operational runbook for running the private preview.** Internal — not for testers
> (their doc is the [tester guide](private-preview-tester-guide-f10a.md)). Pairs with the
> [preview plan](private-preview-plan-f10a.md) (scope/cohort/criteria) and the
> [outcome-baseline plan](outcome-baseline-collection-f10a.md) (the SQL). All checks here
> are **read-only / observational** — running the preview changes no runtime code.

**Status:** ✅ runbook ready. **Date:** 2026-06-04. **Prod:** `app.feelflick.com`
(Cloudflare Pages). **Engine:** `2.17` (frozen for the preview — do not bump).

---

## 1. Pre-invite checklist (run once, the day you start)

Tick every box before the first invite. Commands are read-only.

- [ ] **Build is green on `main`** — lint · test · build · `npm audit --omit=dev --audit-level=high` all pass locally; CI green on the latest `main` push (§5).
- [ ] **Prod is live** — `curl -sI https://app.feelflick.com/ | head -1` → `HTTP/2 200`; the landing renders ("Films that know **you.**").
- [ ] **Auth works end-to-end** — sign in with a real Google account (not the dev test user), land on `/onboarding` as a new user, complete it, reach `/home`.
- [ ] **Security headers live** (§3) — all five present.
- [ ] **CSP report-only live + nonced** (§3) — `content-security-policy-report-only` present with a rotating nonce; no enforcing CSP.
- [ ] **Sentry ingest works** (§2) — prod errors actually land in Sentry Issues.
- [ ] **Outcome capture works** (§4) — a fresh save/skip/watch flips the impression flags (already proven in F9C; re-confirm).
- [ ] **Engine frozen** — `algorithm_version` on new impressions is the single current value (`2.17`); no F8C work in flight.
- [ ] **`[WINDOW]` start date chosen** — record the preview start date; all baseline SQL filters to it (so dev/test backlog doesn't dilute real-user numbers).
- [ ] **Tester guide + feedback form ready** to send.

## 2. Sentry check (error monitoring)

Method from F9F (ingest verification). Production error monitoring **must** be ingesting
before inviting anyone — otherwise a tester-hit crash is invisible.

- [ ] Browser: open `app.feelflick.com`, DevTools console — **no `403` from `*.ingest.us.sentry.io`** (the F9C-era symptom; fixed in F9F via the Sentry Allowed-Domains filter).
- [ ] Confirm a real event lands: trigger/observe a benign labeled test error (or check a recent real one) appears in **Sentry → Issues**, project `feelflick-app`, env `production`, url `app.feelflick.com`.
- [ ] Replay masks text (no PII).
- During the preview, **watch Sentry Issues daily** (§6). A new crash from a tester is a P0/P1 candidate.

## 3. CSP / security-headers check

Method from F9E + F9G.4. Read-only:

```bash
curl -sI https://app.feelflick.com/ | tr -d '\r' | grep -iE \
  'strict-transport-security|x-frame-options|x-content-type-options|referrer-policy|permissions-policy|content-security-policy'
```

- [ ] All **five** enforced headers present: `Strict-Transport-Security`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- [ ] `Content-Security-Policy-Report-Only` present (no enforcing `Content-Security-Policy` yet). Fetch twice → the **nonce rotates** per request (the `functions/_middleware.js` nonce; F9G.4).
- [ ] Console shows **no CSP violations** in normal use (F9G.4 drove this to zero). If a tester's browser/extension trips one, it's report-only → never blocks them; note it for the CSP-enforcement follow-up.

## 4. Supabase / outcome-capture baseline check

The whole measurement point of the preview. Read-only — run the SQL from the
[outcome-baseline plan](outcome-baseline-collection-f10a.md) (which wraps
`docs/sql/recommendation-evaluation-queries.sql` §7).

- [ ] **§0 inventory** — note the starting row counts so you can measure *new* preview volume against them. (Pre-preview baseline: **3,376 impressions / 8 dev users**, 2026-06-04.)
- [ ] **§7a capture-by-placement** — confirm hero + discover show non-zero outcomes (capture is wired).
- [ ] **§7c attributed-vs-generic** — sanity-check attribution isn't leaking for new actions.
- [ ] Re-run **filtered to the preview `[WINDOW]`** every couple of days during the preview (§6) and track toward the F8C volume gate.

> **Do not write to the DB.** No schema/RLS/migration/Edge change during the preview
> (the `supabase-change` Hard Stop still applies). SELECTs only.

## 5. CI check

- [ ] Latest `main` push: **quality-gate** (lint/test/build/audit), **E2E**, **Lighthouse**, **CodeQL**, **GitGuardian** green — `gh run list --branch main --limit 5` / `gh pr checks <#>`.
- [ ] (Context) The E2E + Lighthouse gates are now real once the repo secrets exist (F9H.1). Keep CI green through the preview; a red `main` is a stop-the-line signal before widening the cohort.

## 6. Tester invite sequence + daily monitoring

**Invite sequence** (small waves — never all at once):

1. **Wave 1 (2–3 warm cinephiles you trust).** Send the [tester guide](private-preview-tester-guide-f10a.md) + the app link + the [feedback form](private-preview-feedback-template-f10a.md). Watch them onboard (smoke each new account: sign-in → onboarding → Tonight pick renders with a "why" → save/skip works).
2. **Hold 24–48h.** Confirm Sentry clean, capture flowing, no P0/P1. Triage any feedback.
3. **Wave 2 (2–3 cold-start testers).** The trust-critical cohort — brand-new accounts. Same per-tester smoke.
4. **Top up toward 5–10 total** only if waves 1–2 are healthy.

**Per-tester onboarding smoke** (do this as each tester joins — see the dedicated
checklist in [the outcome-baseline plan §"tester smoke"] and the F9C smoke list):
sign-in → onboarding completes → `/home` Tonight pick renders → **"Why this pick"
present** → open Film File → save + skip both work → no console errors.

**Daily, for the duration:**

- [ ] **Sentry Issues** — any new error from a real user? Triage (§7).
- [ ] **Capture SQL** (§4, windowed) every 2–3 days — moving toward the F8C gate?
- [ ] **Feedback inbox** — classify each item (§7).
- [ ] **Prod still up** — `curl -sI` 200; auth still works.
- [ ] **`main` still green** in CI.

## 7. Feedback triage + issue classification

Classify **every** incoming item into exactly one bucket:

| Class | Definition | Action |
|---|---|---|
| **P0 — blocker** | App down/won't load; auth broken; data loss; privacy/security leak; Sentry crash-loop; **any fabricated content** shipped (fake reviews/social-proof/overconfident false claims — a wedge violation). | **Pause the preview** (§8). Fix immediately (scoped, non-engine). |
| **P1 — preview problem** | A core wedge surface is broken or badly confusing for most testers (Tonight won't render, "why" missing, Film File broken, save/skip/watch broken); repeated "feels generic/fake". | **Fix before widening the cohort.** |
| **P2 — polish** | Cosmetic, copy, minor a11y, single-tester edge case. | Backlog; fix post-preview. |
| **product insight** | Feature ideas, pricing reactions, expansion/parked-surface requests, competitor comparisons. | **Log, don't act** this phase. Feeds later roadmap. |
| **recommendation-quality signal** | "This pick was wrong/right for me," "the why didn't fit," skip reasons. | **Log against the impression** (the data is the real signal). Feeds **F8C DB-first** — do **not** hand-tune scoring in response. |

**Golden rule:** qualitative complaints about *pick quality* become **data to measure**,
not immediate scoring edits. Capture them; let F8C address them from the aggregate.

## 8. Rollback / pause criteria

- **Pause invites** (stop adding testers, keep current ones) on any **P1** until fixed.
- **Pause the preview** (tell testers to hold, or take the cohort offline) on any **P0**:
  app down, auth broken, data/privacy incident, fabricated content, or a Sentry crash-loop.
- **Rollback path:** prod is Cloudflare Pages — roll back to the previous successful Pages
  deployment (or `git revert` the offending commit + redeploy). No DB rollback should ever
  be needed because **the preview makes no schema/data-shape change** (outcome capture only
  flips existing boolean flags). If you ever feel tempted to "fix" pick quality by editing
  the engine mid-preview — **don't**; that's F8C and it corrupts the baseline.

## 9. What NOT to change during the preview

Freeze the product so the baseline is interpretable (mixing `algorithm_version`s makes
longitudinal data unsafe — we already carry 9 historical labels):

- ❌ No scoring / ranking / threshold / `ENGINE_VERSION` change (no F8C).
- ❌ No schema / RLS / migration / Edge Function / OpenAI-prompt change.
- ❌ No product UI redesign / new surfaces / auth redesign.
- ❌ No package/dependency changes.
- ✅ OK: scoped **P0/P1 bug fixes** (non-engine), docs, runbook/measurement updates. A P0
  always overrides the freeze.

## 10. Exit

When the [plan §6 volume gate](private-preview-plan-f10a.md#6-data-volume--duration-before-f8c)
is met and no P0/P1 is open, run the plan's
[decision criteria](private-preview-plan-f10a.md#9-after-the-preview--decision-criteria).
Only a **green measured gate** unblocks F8C — never vibes.
