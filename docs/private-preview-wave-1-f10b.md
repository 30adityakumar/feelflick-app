# F10B — Private Preview, Wave 1 (operations)

> **Phase F10B. Run the first private-preview wave — operations + monitoring only.**
> Not product development, not recommendation tuning. The engine is **frozen** for the
> measurement window (`algorithm_version 2.17`). This doc is the live operating sheet for
> Wave 1; it sits on top of the F10A foundation:
> [plan](private-preview-plan-f10a.md) · [tester guide](private-preview-tester-guide-f10a.md) ·
> [launch runbook](private-preview-launch-runbook-f10a.md) ·
> [feedback template](private-preview-feedback-template-f10a.md) ·
> [outcome-baseline plan](outcome-baseline-collection-f10a.md). Tracker:
> [wave-1 tracker template](private-preview-wave-1-tracker-template-f10b.md).

**Status:** ✅ readiness verified, invite copy + tracker ready — **invites not yet sent**
(your action). **Prep date:** 2026-06-04. **Prod:** `app.feelflick.com` (Cloudflare Pages).

---

## 1. Wave 1 at a glance

| | |
|---|---|
| **Cohort size** | **2–3 testers** (the smallest safe first wave) |
| **Window start** | _record the first-invite date here →_ `__________` (the measurement `[WINDOW]` start) |
| **Planned duration** | min 7 days, target ~2 weeks, **run until the gate is met** (plan §6) |
| **Engine** | **FROZEN** at `algorithm_version 2.17` — no scoring/ranking/threshold/ENGINE_VERSION change |
| **Goal** | first real-user outcomes captured + honest trust read, with zero open P0/P1 |

## 2. Tester selection (Wave 1)

Pick **2–3** people who:
- **actually watch films** and decide what to watch most nights (the patient, not scrollers);
- will give **candid** feedback (a friend who'll say "I didn't trust it");
- ideally give a **cold + warm mix** — at least one brand-new account (cold start, <5 films)
  and one who'll log/rate a real history (warm). For only 2, do one of each.
- a **mix of devices** (one mobile, one desktop) if possible — mobile is the likely real context.

Avoid (this wave): strangers, anyone who'd post publicly, anyone who only wants a
feature checklist. Save the broader 5–10 for Wave 2.

## 3. Invite sequence

1. **Send the [short DM/WhatsApp invite](#7-tester-invite-copy)** to your first 2–3 picks (or the email version).
2. As each accepts, log them in the [tracker](private-preview-wave-1-tracker-template-f10b.md) (alias only — no PII in the repo).
3. **Watch each one onboard** (per-tester smoke, §5). Don't send Wave 2 invites yet.
4. **Reminder** after 24–48h if they haven't signed in (§7).
5. **Feedback request** after their first real use (§7) — point them at the
   [feedback template](private-preview-feedback-template-f10a.md).

## 4. Pre-invite readiness — recorded 2026-06-04 ✅

All read-only / non-mutating except a backend auth-grant check for the dev test user.

| Check | Result |
|---|---|
| Production landing | ✅ `https://app.feelflick.com/` → **HTTP 200** (~0.31s), serves FeelFlick |
| Security headers | ✅ all 5 present (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Permissions-Policy`, `Referrer-Policy`) |
| CSP | ✅ `Content-Security-Policy-Report-Only` live with a **rotating per-request nonce** (two fetches → two nonces); report-uri → Sentry security endpoint; no enforcing CSP |
| Sentry Issues (prod, 7d) | ✅ **no new real-user P0/P1.** The only 3 issues are self-inflicted test artifacts from earlier verification: `FEELFLICK-APP-5` (the JSD CSP-RO violation — **last seen 11h ago = stopped** after the F9G.4 nonce fix), `FEELFLICK-APP-4` (the F9F `example.com` CSP control), `FEELFLICK-APP-3` (the labeled F9F test error). Housekeeping: resolve these in Sentry. |
| Sentry Security (CSP) | ✅ no new real violations (the JSD one stopped post-nonce-fix) |
| CI | ✅ latest code commit `ec2cdb6a` fully green (App Quality Gate · Lighthouse · CodeQL). The docs-only `830ae679` push correctly triggered CodeQL only (path filters). |
| Cloudflare Pages prod | ✅ healthy — serving the merged build; the nonce **Pages Function is live** (rotating nonce proves it) |
| Supabase auth backend | ✅ production project **grants a session** for the dev test user (token not printed) |
| Supabase read-only SQL | ✅ runs; pre-wave baseline recorded (§9) |
| Authenticated surfaces (`/home`, `/movie/:id`, `/profile`, save) | ◐ app Supabase client wired + auth reachable; surface rendering is green via CI/487 tests + the F9C production smoke (same code modulo the #151 share feature + docs). **Highest-fidelity check = the live per-tester onboarding smoke (§5)** with real Google OAuth on prod. |

> Real testers sign in with **Google OAuth** (the dev email/password user is only a test
> affordance), so the authenticated-surface gate is best confirmed by the **first tester's
> live onboarding** — that's why §5 is the real smoke, run as each tester joins.

## 5. Per-tester onboarding smoke (run as each tester joins)

Watch (or confirm with) the tester:
- [ ] **Sign in** with Google succeeds → lands on `/onboarding` (new) or `/home` (returning).
- [ ] **Onboarding** completes (a few films seeded) → reaches `/home`.
- [ ] **Tonight** pick renders with a visible **"Why this pick"** reason.
- [ ] Opening the pick → **Film File** (`/movie/:id`) renders the case.
- [ ] **Save** and **Skip** both work (no error; UI reflects the action).
- [ ] **Profile / Cinematic DNA** renders (honest cold-state framing, not fabricated).
- [ ] No blocking console error they hit / no crash in Sentry tied to their session.

Any failure here is a **P0/P1** (§11) — pause widening until fixed.

## 6. What to send testers / what NOT to ask (Wave 1)

**Send:** the app link, the [tester guide](private-preview-tester-guide-f10a.md), and the
[feedback template](private-preview-feedback-template-f10a.md). Tone: friendly, private, low-pressure.

**Do NOT ask yet** (keep the wedge in focus — plan §4): pricing / willingness-to-pay,
feature requests for parked/expansion surfaces (challenges, feed, social, TV/series),
public-launch/growth, head-to-head vs Netflix/Letterboxd, or "make it recommend X" engine
opinions. If volunteered → log as **product insight** / **rec-quality signal**, don't act.

## 7. Tester invite copy

> Fill the `{bracketed}` bits. Don't paste real names/emails into the repo.

### Short DM / WhatsApp invite
```
Hey {name} — I've been building FeelFlick: you tell it how you feel and it gives you ONE
film for tonight (tuned to your taste) and tells you why. No endless scrolling.

It's an early private preview and I'd love your honest take. ~5 min to try, then come back
a couple of nights if you can. Link: https://app.feelflick.com  — sign in with Google.

One ask: please keep it to yourself for now (not public yet). I'll send a 2-min feedback
form after. 🙏
```

### Email invite (slightly longer)
```
Subject: A tiny private preview — one film for tonight (your honest take?)

Hi {name},

I've been quietly building FeelFlick — a different way to decide what to watch. Instead of
an endless grid, you tell it how you feel and it gives you ONE considered film for tonight,
tuned to your taste, and it tells you why it's the pick. One film a night, made for the
patient — not a feed to scroll.

It's a small private preview and you're one of a handful of people I trust to be honest. I'd
love to know whether tonight's pick actually feels right, whether the "why" earns your trust,
and where it confuses you.

• Try it: https://app.feelflick.com  (sign in with Google)
• What to do first: do the quick onboarding, look at your "Tonight" pick + its "why", then
  open it / save it / skip it as you naturally would. Coming back across a few different
  nights/moods is the most useful thing.
• Time: ~5 minutes the first time.
• Feedback: I'll send a short form — or just reply with your honest reaction.

Two notes: it's movies only for now, and your first night or two it knows little about you
(it gets better as you log films). Please don't share it publicly yet.

Thank you — genuinely.
{your name}
```

### Reminder (after 24–48h, if not signed in)
```
No pressure at all {name} — just bumping this in case it got buried. Whenever you've got 5
min: https://app.feelflick.com (sign in with Google), look at your "Tonight" pick, and tell
me if it felt right. Honest "meh" is just as useful as "loved it." 🙏
```

### Feedback request (after first use)
```
Thanks for trying FeelFlick, {name}! If you've got 2 minutes — what mood were you in, did
"Tonight"'s pick feel right, did the "why" help, and did anything feel off or too much? The
short form has the rest: {feedback-form-link}. Brutal honesty welcome.
```

## 8. Daily monitoring checklist (for the duration)

Run each day (read-only; details in the [runbook](private-preview-launch-runbook-f10a.md)):
- [ ] **Sentry Issues** — any **new** error from a real tester session? → triage (§11).
- [ ] **Sentry Security** — any **new** real CSP violation?
- [ ] **Prod up** — `curl -sI https://app.feelflick.com/` → 200; auth still works.
- [ ] **CI** — `main` still green.
- [ ] **Capture SQL** (every 2–3 days, windowed to the wave start) — moving toward the gate? (§9)
- [ ] **Feedback inbox** — classify each item (§11); update the [tracker](private-preview-wave-1-tracker-template-f10b.md).
- [ ] **Tracker** current — who's onboarded / acted / given feedback.

## 9. Baseline + measurement (Wave 1)

Uses the [outcome-baseline plan](outcome-baseline-collection-f10a.md) (which wraps SQL §7).
**Always window to the wave-1 start date** so the dev backlog doesn't dilute real-user numbers.

| When | Query | Purpose |
|---|---|---|
| **Pre-wave (T0)** | §0 inventory + §7a | starting point (recorded below) |
| **Daily/every 2–3 days** | §7a (windowed) + §7b + §5b version churn | trend toward the gate; confirm one stable version |
| **End of wave** | §0 + §7a + §7b + §7c + §6 cold/warm (windowed) | the Wave-2 / F8C decision inputs |

**Copy into a private spreadsheet/doc** (not the repo): per-day, sliced by placement and
cold/warm — impressions, % any-outcome, % clicked/saved/watched, % skipped, distinct real
users, `algorithm_version`. Keep tester identities out of the repo.

**Pre-wave baseline (T0, read-only, 2026-06-04 — dev-heavy, NOT real-user stable):**

| Metric | Value |
|---|---|
| recommendation_impressions | **3,376** rows / **8** users (all dev) |
| user_history / user_ratings / user_watchlist | 106 / 59 / 19 |
| mood_sessions | 108 (3 users) |
| hero capture (any-outcome) | **3.84%** over 521 impressions |
| discover capture (any-outcome) | **23.88%** over 268 impressions |

> This is the same dev baseline as F10A — **no real-user traffic yet**. It's the zero mark
> Wave 1 is measured against. **Do not overinterpret** (8 dev users).

### Thresholds before **Wave 2**
- All 2–3 Wave-1 testers cleared the onboarding smoke (§5); **no open P0/P1**.
- At least **some** real-user outcomes captured on hero/discover in-window (capture is live for real users, not just dev).
- At least one piece of honest qualitative feedback per tester; nothing reported as **fake/overconfident**.

### Thresholds before **F8C** (unchanged — plan §6 / baseline plan §8)
**≥5 distinct real users · ~300–500+ hero+discover impressions on a single stable
`algorithm_version 2.17` · `outcomeCaptureRate` materially above F8A's ~2% · stable ≥3 days ·
segmentable by placement/version/cold-warm.** Wave 1 (2–3 users) will **not** meet this — it
de-risks the pipeline and earns the first trust read; the volume comes across Wave 1 + Wave 2.

### ⚠️ Warning signs (act immediately)
- **`outcomeCaptureRate` drops toward zero** for real users → capture regression (P1; check `recordRecommendationOutcome` wiring — do NOT touch the engine).
- **Sentry errors spike** from tester sessions → P0/P1 triage.
- **New real CSP violations** appear → investigate (report-only won't block users, but a new source matters).
- **Testers can't finish onboarding** → P0/P1.
- **No one understands "Why this pick"** → trust problem (note as rec-quality signal; it informs F8C, not a mid-wave engine edit).

## 10. Data-freeze rules (during the window)

Hold the product **stable** so the baseline is interpretable (mixing `algorithm_version`s
makes the data unsafe — we already carry 9 historical labels):
- ❌ No scoring/ranking/threshold/`ENGINE_VERSION` change (no F8C).
- ❌ No schema/RLS/migration/Edge Function/OpenAI-prompt change.
- ❌ No product UI redesign / new surfaces / auth redesign / package change.
- ✅ OK: scoped **P0/P1 bug fixes** (non-engine), docs, runbook/tracker updates. A real P0 overrides the freeze.

## 11. Issue triage (same taxonomy as the runbook)

| Class | Examples | Action |
|---|---|---|
| **P0** | app down, auth broken, data/privacy leak, fabricated content, Sentry crash-loop | **pause the wave**, fix now (non-engine) |
| **P1** | core surface broken/very confusing for testers; "feels generic/fake" repeated | **fix before Wave 2** |
| **P2** | cosmetic, copy, minor a11y, single-tester edge | backlog |
| **product insight** | feature ideas, pricing, expansion, competitor asks | log, don't act this phase |
| **rec-quality signal** | "pick was wrong/right," "why didn't fit," skip reasons | **log against the impression** → feeds F8C DB-first; do **not** hand-tune |

## 12. Pause criteria

- **Pause widening** (stop adding testers) on any open **P1**.
- **Pause the wave** (tell testers to hold) on any **P0**.
- **Rollback:** roll back to the previous Cloudflare Pages deployment, or `git revert` + redeploy. No DB rollback is ever needed — the wave makes no schema/data-shape change (capture only flips existing boolean flags). **Never "fix" pick quality by editing the engine mid-wave — that's F8C and it corrupts the baseline.**

## 13. Success criteria → Wave 2

Move to Wave 2 (the 5–10 cohort) when: all Wave-1 testers onboarded cleanly (§5), **no open
P0/P1**, real-user capture confirmed in-window, and the qualitative read is "the pick + why
earned trust more often than not, nothing felt fake." Then re-run the
[plan's decision criteria](private-preview-plan-f10a.md#9-after-the-preview--decision-criteria).

## 14. F8C — still blocked

**F8C remains BLOCKED.** F10B runs the wave + collects the first real signal; it changes no
scoring. F8C unblocks only when §9's F8C thresholds are **measurably** green across Wave 1 + 2.
