# F9A — Release / CI / Production Hardening Prep

> **Phase F9A. Release hardening + CI readiness — NOT feature work, NOT tuning.**
> Answers: is the rebuild branch safe to PR? Which CI gates pass today? What
> baseline work remains? What must happen before deploy, and after deploy before
> F8C tuning? No scoring/ranking/threshold/`ENGINE_VERSION`/schema/RLS/edge/route/
> UI/package change. The one outstanding blocker (Linux landing visual baseline)
> requires CI regeneration and is documented, not faked.

**Status:** 🟡 **PR-ready with one tracked CI blocker** (Linux landing visual baseline).
**Date:** 2026-06-03. **Branch:** `phase-f9a-release-ci-hardening`. **Head:** F8B `bbeeaf60` (+ this doc commit).

---

## 1. Branch lineage

Linear, no divergence — `main` is a clean ancestor of HEAD (fast-forward PR possible).

```
main
 └─ 3b51e4d3  docs: add FeelFlick foundation readiness audit            (F0)
    ff866570  docs: align FeelFlick product doctrine and repo docs      (F1)
    e79c0fd5  feat: align information architecture with product doctrine (F2)
    b25f5841  refactor: harden design system tokens and primitives      (F3)
    7eebb3b2  feat: sharpen landing and onboarding experience           (F4)  ← changed landing
    d0cfe07b  test: align landing visual baseline parity                (F4.1, Darwin only)
    4a51d7b4  feat: sharpen home briefing experience                    (F5)
    15ae9bf9  docs: design Film File case-making vNext                  (F6A)
    68c05df0  feat: add Film File primary case-making layer             (F6B)
    a7023885  feat: sharpen Cinematic DNA profile experience            (F7)
    378c3f7a  feat: add recommendation trust evaluation foundation      (F8A)
    bbeeaf60  fix: repair recommendation outcome capture                (F8B)
    <this>    chore: prepare FeelFlick rebuild for release validation   (F9A)
```

**Surface vs main:** 81 files, **+6,475 / −673**. Touches landing, home, movie,
profile, onboarding, shared services/hooks/ui, the eval foundation, and docs.
**No engine scoring file** (`recommendations.js`/`scoringV3`/`heroReason`/…),
**no migration**, **no edge function** is in the diff. `e2e/.auth/user.json` is
gitignored + untracked (no session leak). `stash@{0}` (parked Eyebrow WIP) is
**not part of this release** — leave it parked; the rebuild's `useInView.js` was
committed in F4 independently of the stash.

---

## 2. Validation matrix

### Local gates (run 2026-06-03 on this branch, Darwin · Node 20.20.2)

| Gate | Command | Result |
|---|---|---|
| Lint | `npm run lint` | ✅ clean (0 warnings) |
| Unit/component | `npm run test` | ✅ **487 passed** (44 files) |
| Build | `npm run build` | ✅ built (~0.5s, no errors) |
| Prod audit | `npm audit --omit=dev --audit-level=high` | ✅ **0 vulnerabilities** |
| Eval harness | `node scripts/eval/run-recommendation-eval.mjs` | ✅ exit 0 (writes `docs/eval/` baseline) |
| E2E (public+app) | `npm run test:e2e` | ✅ **14 passed** (auth, home, movie, watchlist, recs, a11y) |
| Visual (Darwin) | `npm run test:visual` | ✅ **2 passed** (landing + about) |

### CI gates (`.github/workflows/`) on PR → `main`

| Workflow / job | Runner | Status today | Notes |
|---|---|---|---|
| **App Quality Gate** / `quality-gate` | ubuntu-latest | ✅ expected green | lint + test + build + `npm audit` — all green locally; platform-agnostic |
| **App Quality Gate** / `e2e` | ubuntu-latest | ⏭️ skips green | gated on repo secrets `E2E_TEST_EMAIL/PASSWORD` + `VITE_*`; non-blocking until configured |
| **Visual & A11y Regression** / `visual` | ubuntu-latest | ❌ **WILL FAIL** | `test:visual` compares against the **stale Linux landing baseline** — see §3 |
| **Visual & A11y Regression** / a11y (public) | ubuntu-latest | ✅ expected green | `e2e/public/a11y.e2e.js`, excl. color-contrast (deliberate) |
| **Lighthouse CI** | ubuntu-latest | ⏭️ no-op green | gated to no-op until `VITE_*` build secrets configured |
| **CodeQL** | ubuntu-latest | ✅ expected green | static analysis; informational (Security tab) |

**Net:** every required gate is green or intentionally-skipped-green **except the
Linux landing visual baseline** (§3). That is the single blocker between this
branch and a green PR.

---

## 3. Visual baseline status (the one real blocker)

Snapshots are **platform-specific** (committed per-OS; Playwright
`maxDiffPixelRatio: 0.02`). The visual project covers two static public surfaces:
`/` (landing) and `/about`.

| Baseline | Last regenerated | Current vs rebuild? |
|---|---|---|
| `landing-…-darwin.png` | F4 `7eebb3b2` | ✅ current (local `test:visual` passes) |
| `landing-…-linux.png` | `0005e4aa` (#138, **pre-F4**) | ❌ **STALE** — F4 changed the landing; CI (Linux) compares against this and fails |
| `about-…-darwin.png` / `-linux.png` | #129 / unchanged in rebuild | ✅ unaffected — the rebuild never touched `/about` |

**Why this can't be fixed locally:** the runner is macOS (Darwin) with no Docker;
a Linux PNG produced here would be wrong. Linux baselines can **only** be made in
the Linux CI env. **Do not fake a Linux PNG locally.**

### Regeneration workflow (verified against `visual-regression.yml`, precedent: `origin/visual-baselines/outfit-font`)

Pushing any `visual-baselines/**` branch triggers the workflow to run
`test:visual:update` on Linux and commit the regenerated baselines back to that
branch. Then pull the PNG(s) into the PR branch. **Requires a remote push —
NOT performed in F9A (no push approval given).**

```bash
# 1. Push the FINAL rebuild head so baselines regenerate against the exact merge
#    state (regenerates landing + about Linux PNGs in one go).
git push origin phase-f9a-release-ci-hardening:visual-baselines/rebuild

# 2. Wait for the "Visual & A11y Regression" run on that branch to commit the
#    regenerated baselines back to it (it pushes a
#    "test(visual): regenerate Linux baselines" commit).

# 3. Pull the regenerated Linux baseline(s) into the PR branch and commit.
git fetch origin visual-baselines/rebuild
git checkout origin/visual-baselines/rebuild -- e2e/visual/
git commit -m "test(visual): regenerate Linux visual baselines (rebuild)" e2e/visual/
```

> The original F4 note pushed `phase-f4-landing-onboarding-vnext:visual-baselines/f4-landing`.
> That still works (F5–F8B never touched the landing, so F4's landing == HEAD's),
> but pushing **HEAD** is strictly safer — it regenerates against the exact state
> being merged. After step 3, re-run §2's CI gates; the visual job goes green.

---

## 4. E2E / a11y status

- **E2E (local):** 14/14 green — `auth.setup`, `/home` reach+redirect, recommendation
  posters render + open, **watchlist Save persists** (exercises the F8B capture
  path), and authenticated a11y on `/home` `/movie` `/profile`.
- **E2E (CI):** skips green until repo secrets are set (`E2E_TEST_EMAIL`,
  `E2E_TEST_PASSWORD`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `VITE_TMDB_API_KEY`). Enabling them is a **pre-preview** task (§6), not a merge blocker.
- **A11y:** serious/critical WCAG enforced **excluding color-contrast**, a tracked
  editorial-design exception (purple/pink on near-black). Color-contrast remediation
  is a known, separate follow-up — not an F9A regression.

---

## 5. Known blockers & classification

| # | Item | Class | Owner / action |
|---|---|---|---|
| 1 | Linux landing visual baseline stale (pre-F4) | **CI-only blocker** (rebuild-introduced) | regenerate via §3 before merge (needs push approval) |
| 2 | CI E2E job skips (no secrets) | Intentional / config | add repo secrets before preview (§6) — non-blocking now |
| 3 | Lighthouse no-op (no secrets) | Intentional / config | add `VITE_*` build secrets to enable perf budget |
| 4 | Color-contrast a11y violations | Pre-existing / tracked | deliberate editorial exception; separate follow-up |
| 5 | No CSP / security headers in `vercel.json` | Pre-existing hardening gap | broader-F9 production hardening (out of F9A scope) |
| 6 | Rating↔recommendation link absent | Known F8B gap | later gated phase (F8B doc §9) |

Only **#1** blocks a green PR. #2–#6 are tracked, non-blocking-for-merge items.

---

## 6. Deploy / private-preview checklist

**Before opening the PR**
- [ ] Regenerate the Linux landing baseline (§3) and commit it to the PR branch.
- [ ] Confirm all CI gates green on the PR (quality-gate, visual, codeql).

**Before merge → deploy**
- [ ] Configure repo secrets to light up the gated jobs: `E2E_TEST_EMAIL`,
      `E2E_TEST_PASSWORD`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
      `VITE_TMDB_API_KEY` (+ optional `VITE_SENTRY_DSN`, `VITE_POSTHOG_KEY/HOST`).
- [ ] Confirm CI E2E job now runs (not skips) and is green.
- [ ] Set the `VITE_*` env in the Vercel project (build-time).
- [ ] (Recommended, broader-F9) add CSP / security headers to `vercel.json`.

**Deploy (Vercel)**
- [ ] `npm run build` clean locally, then deploy a **preview** (not prod).
- [ ] Run §7 smoke checks against the preview URL.
- [ ] Promote to production only after smoke + capture checks pass.

---

## 7. Post-deploy smoke-test checklist (preview URL)

- [ ] `/` landing renders (logged-out): "Films that know **you.**", `Start free →`.
- [ ] Google OAuth sign-in completes; new user → `/onboarding`, returning → `/home`.
- [ ] `/home` Briefing shows a pick + `WhyThisPick` reason; mood pills switch picks.
- [ ] Briefing **Save / Mark watched / Skip** each reflect immediately (icon/slide).
- [ ] Open a pick → `/movie/:id` Film File renders `PrimaryCaseCard`.
- [ ] `/movie` Save + Mark watched work; `/watchlist` + `/history` reflect them.
- [ ] `/discover` returns a brief-driven pick; `/profile` shows honest DnaConfidence.
- [ ] No console errors; Sentry receives no release-blocking errors.

---

## 8. Post-deploy recommendation **outcome-capture** checklist (proves F8B)

Run **after real users act** on the deployed build, using
[`docs/sql/recommendation-evaluation-queries.sql`](sql/recommendation-evaluation-queries.sql)
§7 (read-only), filtered to post-deploy via the `[WINDOW]` clause:

- [ ] §7a capture-by-placement: `pct_any_outcome`, `pct_watched`, `pct_saved`,
      `pct_clicked` are **materially above the F8A baseline** (≈2% any, ≈0.5% watch,
      0.1% click) on `hero` and the carousels.
- [ ] §7b conversion funnel: `pct_clicked_to_saved` / `pct_clicked_to_watched` are
      now **computable and non-zero**.
- [ ] §7c attributed-vs-generic: most recommendation-surface saves/watches are
      **attributed** (not orphaned) — confirms the recency-gated attribution fires
      and doesn't over-leak.
- [ ] Re-run `node scripts/eval/run-recommendation-eval.mjs` against a read-only
      export shaped like the fixtures to record the **new real baseline**.

---

## 9. Rollback / checkpoint plan

- **Checkpoint tag (recommended before merge):** tag the pre-merge `main` so a
  one-command revert exists — `git tag rebuild-merge-base origin/main` (precedent:
  the `legacy-removal-base` tag pattern in CLAUDE.md Direction signals).
- **Vercel:** keep the prior production deployment; "Promote to Production" on the
  previous deployment is the instant rollback.
- **DB:** F0–F9A made **no schema/RLS/migration change**, so there is no DB
  rollback surface — the deploy is purely client/CI. (F8B reused existing
  `recommendation_impressions` columns.)
- **Code:** the branch is a clean fast-forward; reverting the merge commit restores
  `main` exactly.

---

## 10. F8C tuning gate (unchanged, restated)

**F8C (gated engine scoring tuning) remains BLOCKED.** It may begin only when a
**post-deploy** real-data baseline (§8, SQL §7) confirms `outcomeCaptureRate` is
**non-trivial and stable, sliced by `placement`, `algorithm_version`, and
cold/warm tier**. F8B wired and unit/e2e-verified the capture *paths*; the *lift*
can only be proven on real post-deploy traffic (the pre-launch dev DB has 8 test
users). Until that baseline exists, tuning is blind — keep it blocked. When
unblocked, every F8C change leads with the pool/coverage numbers
(`recommendation-engine` skill), then the change, then the expected measurable
effect on skip/watch.

---

## 11. F9A scope note

F9A is **docs + validation only** — no code/config/test change was required (every
gate is green except the Linux baseline, which needs CI regeneration, not a code
fix). Broader production hardening (CSP/security headers, color-contrast a11y,
Lighthouse budget enforcement, full e2e-in-CI) is the remaining **F9** surface,
tracked here but intentionally out of F9A.
