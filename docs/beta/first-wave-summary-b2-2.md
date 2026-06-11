# First-wave beta observation summary + 5–10 expansion checklist (B2.2)

Status: **current** · Phase: B2 Private Beta Observation · Documentation only.

## 1. Purpose

This document summarizes the **first two private-beta testers** (who used the site on
2026-06-11) and prepares the **decision to expand from 1–2 → 5–10 users**. It captures
what happened, whether the app is healthy enough to continue, what must happen before a
wider wave, and what can wait.

Scope clarifications:

- This is **not** public beta and **not** public production.
- This document contains **anonymized telemetry only** (aggregate counts, buckets,
  route patterns, severity labels). Raw tester IDs are **intentionally omitted**;
  testers are labelled **Tester A** / **Tester B**.
- Manual/qualitative tester feedback should be stored separately or summarized here
  **without** private details (use the template in §8).

Source audit: **B2.1 first-beta observation audit** (read-only). Related runbooks:
[`first-invite-runbook-b16.md`](first-invite-runbook-b16.md),
[`operator-dashboard-b1.md`](operator-dashboard-b1.md),
[`../security/s1-auth-dashboard-hardening.md`](../security/s1-auth-dashboard-hardening.md),
[`../security/s1-scheduler-function-source-of-truth.md`](../security/s1-scheduler-function-source-of-truth.md).

## 2. Executive verdict

> **CONTINUE FIRST-WAVE TESTING** · P0: 0 · P1: 0 · P2: 2 · P3: 2

- No rollback needed.
- No feature flag needs disabling.
- No live (beta-window) privacy incident occurred.
- Onboarding worked. Discover worked. Home worked.
- The beta gate was intentionally **off / pass-through** for this first open test
  (correct by design). **If a gated 5–10 wave is the chosen posture, the gate must be
  enabled and `beta_members` populated first** (§5, §6).

## 3. What happened in the first test

Anonymized; no raw IDs, no movie titles, no private taste details.

**Tester A**
- Onboarding completed.
- Reached Home and Discover; recommendation engagement occurred.
- **Strong Discover engagement** (multiple picks marked watched; one click; some skips).
- No observed errors.

**Tester B**
- Onboarding completed.
- **Clicked the Home hero pick.**
- **Saved one Discover recommendation** to the watchlist.
- Performed one social **follow** (succeeded).
- No observed errors.

## 4. Surface-by-surface observation (safe aggregates)

**Onboarding** — both testers completed; no onboarding errors; bucketed signal only
(each set genre preferences and rated/added a small number of films). **Decision: healthy.**

**Discover** — recommendations shown to both; clicks / saves / marked-watched occurred;
no empty-pool hang; no recommendation-error spike. **Decision: healthy.**

**Home** — Home rows rendered for both (hero + secondary rows). Engagement currently
appears stronger on **hero / Discover** than on secondary carousels. **Decision: healthy;
monitor secondary-row engagement.**

**Profile** — not meaningfully exercised by the first two testers; no errors.
**Continue observing.**

**People** — one follow succeeded; no follow failures; identity is least-data +
owner-scoped (no target-ID/PII exposure in analytics). **Continue observing.**

**Library / Watchlist / Diary** — one watchlist save; no Diary entries observed; no
Diary/review text captured anywhere. `user_watchlist` owner-only RLS intact.
**Continue observing.**

**Account / Preferences / Browse / Lists** — no observed route errors; preference writes
during onboarding succeeded; **no tester-created lists**; no destructive-action or
false-success issues observed.

**Sentry / route errors** — **zero beta-window route issues**. Pre-window error events
(2026-06-04) are historical and unrelated to the tester window.

**Analytics privacy** — **beta-window raw-search count is zero**; no raw search text was
emitted during the window. Historical PostHog residue is separate and classified P2 (§5).

**Operator health** — the health/verification scripts remain the source of truth (§6); no
beta-gate or security-grant regression observed (S1.2/S1.3/S1.4 posture intact).

## 5. Findings by severity

### P0
None.

### P1
None.

### P2

**1. Historical PostHog search-event residue**
- A small number of **pre-B1.2** `search_performed` events retain raw query / movie-title
  property values; they are **dev-era / historical**, with **no beta-window emissions**.
- The current code is clean and **test-enforced** (a fail-closed analytics source-scan
  test blocks raw `query`/freeform keys in any event payload; the live search event sends
  only a length **bucket** + `movie_id`).
- Fix = **PostHog-side retention/deletion** of the old dev-era person/event data, or a
  documented manual retention exception with an owner. (Raw values are not reproduced here.)

**2. Beta gate not yet enabled / populated for a wider wave**
- The gate was intentionally **off / pass-through** for the first open test; `beta_members`
  remained empty.
- Before a **gated** 5–10 wave, the operator must: set `VITE_ENABLE_BETA_GATE=true`,
  redeploy, and add active members to `public.beta_members` via **service-role SQL only**.
- Verify with `scripts/verify-beta-gate.sql`.

### P3

**1. Home secondary-row engagement question** — Home rendered for both testers, but the
strongest engagement currently appears from **Discover / hero**. Monitor whether the
secondary rows produce useful engagement at 5–10. Product question, not a defect.

**2. Legacy telemetry tidiness** — some old/unused telemetry tables retain legacy or zero
data; the **current live recommendation funnel is `recommendation_impressions`**. Not a
beta blocker.

## 6. 5–10 expansion checklist

### Required before 5–10
- [ ] **Decide beta-gate posture** — a *gated* wave or an intentionally *open* wave.
- [ ] If **gated**:
  - [ ] set `VITE_ENABLE_BETA_GATE=true`;
  - [ ] redeploy;
  - [ ] add 5–10 members to `public.beta_members` via **service-role SQL only**;
  - [ ] run `scripts/verify-beta-gate.sql`.
- [ ] **Handle historical PostHog search residue** — delete/anonymize the old dev-era
  person/event data in PostHog **manually** (no deletion automation exists today), **or**
  record a manual retention exception + owner.
- [ ] **Complete S1.3 dashboard / operator Auth items** (see
  [`../security/s1-auth-dashboard-hardening.md`](../security/s1-auth-dashboard-hardening.md)):
  - [ ] enable leaked-password protection;
  - [ ] set OTP expiry to **≤ 1 hour**;
  - [ ] review the redirect-URL allowlist (remove stray wildcards / localhost).
- [ ] **Run health checks** (read-only):
  - [ ] `scripts/beta-health.sql`
  - [ ] `scripts/verify-f9-route-privacy.sql`
  - [ ] `scripts/verify-s12-grants.sql`
  - [ ] `scripts/verify-s13-auth-security.sql`
  - [ ] `scripts/verify-s14-scheduler-functions.sql`
- [ ] **Confirm Sentry alerts** are configured for the window.
- [ ] **Confirm PostHog funnels** (onboarding → Discover → save/watch) read sensibly.
- [ ] **Confirm no open P0/P1.**
- [ ] **Confirm invite copy uses the B1.6 privacy disclosure**
  ([`first-invite-runbook-b16.md`](first-invite-runbook-b16.md)).

### Recommended before 5–10
- [ ] Capture any **qualitative feedback** from the first two testers (§8).
- [ ] Manually review **Discover recommendation quality** (no private details exposed).
- [ ] Confirm **daily-briefing / cron health** (3 jobs active; F8.6-SEC bridge intact).
- [ ] Prepare the **rollback / kill-switch plan** (§7).
- [ ] Keep monitoring the **Home secondary-row engagement** question.

### Can wait until public beta / public production
- [ ] Extension relocation for `pg_trgm` / `pg_net`.
- [ ] Postgres security patch (if not already scheduled).
- [ ] Edge-source tracking for out-of-repo functions (`send-daily-briefings`,
  `process-account-deletions`) — see
  [`../security/s1-scheduler-function-source-of-truth.md`](../security/s1-scheduler-function-source-of-truth.md).
- [ ] Lists moderation / reporting.
- [ ] Feed / social expansion.
- [ ] Public-scale security hardening.
- [ ] Full operator dashboard UI.

## 7. 5–10 wave operating plan

### Before invite
- [ ] Confirm latest `main` is deployed.
- [ ] Confirm the gate decision (gated vs open).
- [ ] If gated, add members (service-role SQL) and **verify the gate**.
- [ ] Run the health SQL (§6).
- [ ] Check Sentry (no open issues).
- [ ] Check PostHog (funnels + privacy).
- [ ] Confirm feature kill-switches are **default-on** (Discover / People / Profile refresh).
- [ ] Confirm the rollback plan (below).

### During the wave (daily for the first week)
- Onboarding started / completed.
- Discover shown / opened / saved / error.
- Home opened / hero / secondary-row engagement.
- Profile refresh failures.
- People follow / search / hide.
- Watchlist saves.
- Diary usage.
- Sentry route errors.
- Analytics opt-outs.
- Support / feedback messages.

### Pause conditions (stop inviting)
- Any P0; any P1.
- Repeated onboarding failure.
- Discover unavailable for multiple users.
- Beta gate **incorrectly blocking active members**.
- Analytics PII regression.
- Route-error spike.
- Any user report of a privacy / trust concern.

### Rollback
- Disable the beta gate (unset `VITE_ENABLE_BETA_GATE`, redeploy).
- Revoke / pause member status (service-role SQL).
- Disable Discover recommendations (kill-switch).
- Disable People.
- Disable Profile refresh.
- Redeploy the prior known-good build.
- Pause invites.

## 8. Feedback capture template

> Store completed entries outside the repo (or summarized here without private content).
> Do **not** paste private content, raw search/Diary/review text, emails, or names.

```
Tester label:            (Tester A / Tester B / Tester C …)
Date:
Surface:                 (onboarding / discover / home / profile / people / library / account)
What happened:           (behavioral summary, no private content)
User sentiment:          (positive / neutral / negative)
Category:                (bug / confusion / recommendation quality / performance / trust / missing feature / delight)
Severity:                (P0 / P1 / P2 / P3)
Private details removed? (yes / no)
Follow-up needed:        (yes / no — what)
```

## 9. Timing table

| Item | Before 5–10 | Before public beta | Before public production | Owner | Status |
|---|---|---|---|---|---|
| Beta-gate decision + population | Required (if gated) | Required | Required | Operator | Pending |
| Historical PostHog search residue cleanup | Required | Required | Required | Operator | Pending |
| Leaked-password protection | Recommended | Required | Required | Operator | Pending |
| OTP expiry ≤ 1h | Recommended | Required | Required | Operator | Pending |
| Redirect-URL allowlist review | Recommended | Required | Required | Operator | Pending |
| Sentry / PostHog dashboard review | Required | Required | Required | Operator | Pending |
| Postgres security patch | — | Recommended | Required | Operator | Pending |
| Extension relocation (`pg_trgm`/`pg_net`) | — | Recommended | Recommended | Operator/Eng | Deferred |
| Edge-source tracking (out-of-repo functions) | — | Recommended | Recommended | Eng | Deferred |
| Lists moderation / reporting | — | Consider | Required | Eng | Deferred |
| Feed / social expansion | — | Consider | Consider | Eng | Deferred |

## 10. Recommended next action

**Recommended next action: proceed with the controlled 5–10 expansion only after the
operator completes the required checklist items above. No code fix is required from B2.1.**

Next operational tasks (pre-5–10): **S1.3 operator dashboard Auth items** (leaked-password
protection, OTP ≤ 1h, redirect-URL review) **and the historical PostHog residue cleanup**.
No broad redesign is recommended.
