# F9C — Merge, Deploy, Smoke Test & Outcome Baseline

> **Phase F9C. Merge / deploy / smoke / measurement-setup — NOT product or tuning
> work.** The F0–F9B rebuild was merged to `main`, deployed to production, smoke-
> tested live, and the post-deploy outcome-capture mechanism was verified working.
> No scoring / ranking / threshold / `ENGINE_VERSION` / schema / RLS / migration /
> Edge Function change.

**Status:** ✅ merged + deployed + smoke-green. F8B outcome capture **verified
working in production**. **F8C tuning remains BLOCKED** (no meaningful real-user
traffic yet). **Date:** 2026-06-04.

---

## 1. Merge

- **PR #169** — *FeelFlick structured rebuild: F0–F9B foundation, UX, trust, and release readiness* — **merged (squash)** into `main`.
- **Squash commit:** `c38cb473` on `main`.
- **Merge method:** squash (repo convention — recent `main` commits carry `(#16x)` squash titles). Branch protection required up-to-date, so the PR branch was first updated by merging `origin/main` (the one unrelated account-only commit `#168`, conflict-free), revalidated green, and pushed; checks re-ran green; then squash-merged.
- The `phase-f9a-release-ci-hardening` branch was **kept** (not auto-deleted).

## 2. CI after merge (push to `main`)

| Check | Result |
|---|---|
| App Quality Gate · quality-gate (lint/test/build/audit) | ✅ success |
| App Quality Gate · E2E | ⏭️ skip-green (no CI secrets — documented) |
| Lighthouse CI | ✅ success (no-op until build secrets) |
| CodeQL | ✅ success |
| GitGuardian | ✅ success |
| Vercel | ✅ **Production deployment success** |
| Cloudflare Pages | ✅ success |

> Note: `visual-regression.yml` runs on PRs (not on push to `main`); it was green on the PR (`Visual Regression` pass on ubuntu-latest), which is what validated the F9B Linux baseline.

## 3. Deployment

- **Production URL:** https://app.feelflick.com/ (HTTP 200; serving the merged build — bundle `recommendations-CAp7Npxg.js`, the exact chunk hash from the rebuild build).
- **Vercel production deployment:** state `success` (`c38cb473`). The deployment-specific `*.vercel.app` URL is behind Vercel deployment protection (401) — the canonical alias is public.

## 4. Local post-merge validation (`main` @ `c38cb473`)

`main`'s tree is **identical** to the validated PR branch (verified by tree hash). All green:

| Gate | Result |
|---|---|
| `npm run lint` | ✅ clean |
| `npm run test` | ✅ 487 passed (44 files) |
| `npm run build` | ✅ |
| `npm audit --omit=dev --audit-level=high` | ✅ 0 vulnerabilities |
| `node scripts/eval/run-recommendation-eval.mjs` | ✅ exit 0 |
| `npm run test:e2e` (public+app, pre-merge identical tree) | ✅ 14 passed |
| `npm run test:visual` (Darwin, pre-merge identical tree) | ✅ 2 passed |

## 5. Production smoke checklist (live, app.feelflick.com)

**Public (logged-out)** — all render, no app console errors:
- ✅ `/` Landing — "Films that know **you.**", greeting eyebrow, all sections.
- ✅ Honest framing confirmed — "ILLUSTRATIVE · taste twins grow richer…", "AN EXAMPLE ISSUE / What yours might look like", "An example letter" (no fake social proof).
- ✅ `/about` ("Films That Know You"), `/privacy` ("Your privacy comes first"), `/terms` ("Our rules of engagement").

**Authenticated (dev test user via injected session against the production Supabase backend):**
- ✅ Production auth backend reachable — token grant 200; the app restored the session and loaded `/home` (not bounced to landing).
- ✅ `/home` — Tonight nav, MoodReactor, Briefing (Tonight's pick / Mood match / From your DNA), **WhyThisPick reason present**, real pick rendered; hero impressions logging live (`recommendation_impressions` POST → 201).
- ✅ `/movie/:id` — **PrimaryCaseCard** leads the case; **ViewerNotes "not real reviews" disclaimer** present; Save/Mark-watched/Skip controls render.
- ✅ Save action works + **persists** (`user_watchlist` row written; UI → "Saved").
- ✅ `/profile` — honest **DnaConfidence** ("taste evidence", not accuracy).
- ✅ `/account` — renders cleanly (no 404) — important, since `main`'s `#168` changed account files; the merge integrated them without regression.

**Console / a11y:**
- ⚠️ **One console error across all routes: a `403` from the Sentry ingest endpoint** (`*.ingest.us.sentry.io/.../envelope`). This is a **Sentry telemetry-config issue, pre-existing** (the rebuild never touched Sentry), and **does not affect users** — but it means **production error monitoring is not currently ingesting events**. Tracked as a production-hardening follow-up (§7).
- ✅ No app/runtime console errors on any tested route.
- Color-contrast a11y exception remains the known, tracked editorial choice (not re-introduced).

## 6. Post-deploy outcome-capture baseline (the F8B / F8C gate)

**F8B capture is VERIFIED WORKING in production.** During the smoke I saved two
freshly-impressed hero picks; the recency-gated attribution flipped the impression
flags exactly as designed:

| Movie (internal id) | Hero impression `shown_at` | Within 72h? | `added_to_watchlist` after save |
|---|---|---|---|
| Dune: Part Two (145) | 2026-06-04 00:00 | ✅ | ✅ **true** (attributed) |
| Dune: Part Two (145) | 2026-05-24 10:04 | ❌ (>72h) | false (correctly NOT attributed) |
| Three Billboards (943) | 2026-06-04 00:00 | ✅ | ✅ true (+ `clicked` true) |

Last-24h capture by placement (read-only, SQL §7a):

| placement | impressions | % clicked | % saved | % any-outcome |
|---|---|---|---|---|
| hero | 22 | 4.5 | **9.1** | 68.2* |
| quick_picks / favorite_genres / trending / because_you_loved / director_spotlight | 50 / 36 / 25 / 12 / 4 | 0 | 0 | 0 |

\* hero any-outcome is inflated by skips from an earlier dev session; the clicked/saved are the F9C smoke actions, now captured (vs the F8A all-time baseline of ~0.2% saved).

**Decision — F8C remains BLOCKED.** The capture *mechanism* is proven (outcomes now
write back to `recommendation_impressions`), but this is **dev/test volume from the
F9C smoke session — not real post-deploy user traffic** (22 hero impressions/24h, a
single user). The F8C gate requires a **non-trivial, stable** baseline sliced by
`placement`, `algorithm_version`, and cold/warm tier. **Do not tune until real users
generate meaningful volume.**

**Re-run after real traffic** (read-only): the §7 block of
[`docs/sql/recommendation-evaluation-queries.sql`](sql/recommendation-evaluation-queries.sql)
— §7a capture-by-placement, §7b clicked→saved/watched + shown→outcome, §7c
attributed-vs-generic — filtered to a post-deploy `[WINDOW]`. Recommend waiting until
there are **≥ a few hundred impressions across multiple real users** with a stable
`algorithm_version`, then re-evaluate.

## 7. Remaining production-hardening follow-ups (non-blocking, tracked)

1. **Sentry ingest 403** — production error monitoring isn't ingesting (telemetry config: DSN/key/project). Pre-existing; fix so prod errors are actually captured.
2. **CSP / security headers** absent from `vercel.json` (broader F9).
3. **CI E2E + Lighthouse** skip/no-op until repo secrets are configured — enable for full gate coverage.
4. **Color-contrast a11y** — tracked editorial exception; remediation is a separate pass.
5. **Dead paths** — `recommendation_events` funnel + `RecommendationFeedback` are unwired (F8B doc §9): revive or remove.
6. **F6C** — `why_for_you` for non-curated films via edge fn (gated, later).

## 8. Non-scope (F9C)

No scoring/ranking/threshold/`ENGINE_VERSION`/candidate-generation change · no
schema/RLS/migration/Edge Function/OpenAI change · no auth/route/IA/UI/package
change · no F8C tuning. The only production writes were the dev test user's smoke
actions (a few saves/impressions) — left in place as evidence that capture works.
`stash@{0}` (parked Eyebrow WIP) untouched.
