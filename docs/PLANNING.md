# FeelFlick — Active Sprint

> **Update this file yourself at the end of every work session.**
> Claude Code reads this at session start — keep it honest and current.
> Do NOT ask Claude to auto-update this file.

> **Now driven by the phased rebuild.** The full F0–F10 roadmap (objectives, scope,
> non-scope, validation, risk) lives in
> [feelflick-foundation-readiness-audit.md §8](feelflick-foundation-readiness-audit.md).
> This file tracks only the *active* slice — don't duplicate the roadmap here.

## Currently In Progress
- [ ] (between phases) — F9A just landed (release/CI hardening prep). The rebuild
      branch is **PR-ready except one tracked CI blocker**: regenerate the **Linux
      landing visual baseline** (see Blocked, + `docs/release-readiness-f9a.md` §3).

## Up Next (prioritized)
- [ ] **Open the rebuild PR** once the Linux landing baseline is regenerated
      (needs a `visual-baselines/*` push — see Blocked). Then deploy a Vercel
      preview + run `docs/release-readiness-f9a.md` §7–§8.
- [ ] **F8C — Gated engine tuning** — the first phase allowed to touch scoring
      (highest blast radius). **Entry gate:** a POST-DEPLOY real-data baseline
      (via `docs/sql/recommendation-evaluation-queries.sql` §7) must confirm
      `outcomeCaptureRate` is non-trivial + stable, sliced by `algorithm_version`
      and cold/warm tier — F8B wired the capture paths but the lift can only be
      proven with real post-deploy traffic. THEN tune DB-first (recommendation-engine
      skill), leading with pool/coverage numbers + expected skip/watch effect.
- [ ] **F6C (later, gated)** — extend `generate-movie-overlay` to produce a
      `why_for_you` for non-curated films (Edge Function + prompt + honesty guards) —
      via the `supabase-change` skill.
- [ ] (later) F9–F10 per the F0 roadmap (F9 also owns the deferred Linux visual baseline).

## Blocked / Waiting
- [ ] **Linux landing visual baseline regeneration** (F4 landing) — the **one CI
      blocker** before a green rebuild PR. Verified in F9A: the Linux baseline
      (`e2e/visual/landing.visual.js-snapshots/landing-fullpage-visual-linux.png`)
      is from `0005e4aa` (#138, **pre-F4**), so the "Visual & A11y Regression" gate
      fails on `ubuntu-latest`. Darwin baseline is current (local `test:visual`
      passes); `/about` is unaffected. It can ONLY be produced on Linux/CI — **do
      not fake a Linux PNG locally.** Needs a remote push (NOT done in F9A — no push
      approval). Full context + commands: `docs/release-readiness-f9a.md` §3.
      **Recommended (regenerate against the exact merge state — landing + about):**
      ```bash
      git push origin phase-f9a-release-ci-hardening:visual-baselines/rebuild
      # wait for "Visual & A11y Regression" to commit the regenerated baselines back, then:
      git fetch origin visual-baselines/rebuild
      git checkout origin/visual-baselines/rebuild -- e2e/visual/
      git commit -m "test(visual): regenerate Linux visual baselines (rebuild)" e2e/visual/
      ```

## Done This Week
- [x] **F9A — Release / CI / Production Hardening Prep**
      (`docs/release-readiness-f9a.md`): docs/validation-only — no code change.
      Audited the rebuild branch for PR/CI readiness: it's a clean fast-forward of
      `main` (12 commits ahead, 0 divergence; 81 files, +6,475/−673; no engine/
      schema/edge files). Ran the full local matrix green — lint, **487 tests**,
      build, `npm audit` (0 vulns), eval, **e2e 14/14** (public+app), **visual 2/2
      (Darwin)**. Mapped CI gates: quality-gate green; e2e/Lighthouse skip-green
      until secrets; CodeQL informational. **One real blocker:** the Linux landing
      visual baseline is pre-F4 (CI-only; needs the `visual-baselines/*` push flow
      — documented, not pushed, no approval). Wrote release-readiness doc with the
      validation matrix, deploy/rollback/smoke + post-deploy outcome-capture
      checklists, and the restated F8C gate. No scoring/schema/UI/route change.
- [x] **F8B — Recommendation Outcome Capture Repair**
      (`docs/recommendation-outcome-capture-f8b.md`): instrumentation-only, engine
      untouched. Fixed the F8A capture gap — `useUserMovieStatus` (the one hook
      behind save/watch on the Briefing, every carousel, and the Movie page) wrote
      to `user_watchlist`/`user_history` but never flagged the impression; the
      carousel click passed `placement` as the action arg (silent no-op); the
      Briefing open recorded no click. New `recordRecommendationOutcome` helper
      attributes save/watch/click to the most-recent impression ONLY when it's
      recent (72h window) — so generic/direct actions never falsely attach, and
      the Briefing "See More"→Movie-page→Save conversion auto-captures with no
      nav-state or schema change. Reused existing impression columns (no migration/
      RLS/edge change). Added 17 tracking tests (helper 8, hook 4, MovieCard +2,
      eval +3) + §7 read-only verification SQL + `conversionFunnel`/
      `captureByPlacement` harness metrics. Real post-deploy baseline still to be
      collected before F8C tuning.
- [x] **F8A — Recommendation Trust + Evaluation foundation**
      (`docs/recommendation-trust-evaluation-f8a.md`): evaluation-FIRST, engine
      untouched. Added a current-state map + a 6-family metrics framework (fit/
      outcome, repeated-pick fatigue, diversity/anti-bubble, reason coverage,
      explanation-quality rubric, cold/warm); a SAFE offline fixture harness
      (`src/shared/services/eval/recommendationEval.js` + `fixtures.js` +
      `scripts/eval/run-recommendation-eval.mjs` → `docs/eval/` baseline); read-only
      SQL templates (`docs/sql/recommendation-evaluation-queries.sql`, verified
      against live schema); 18 new Vitest contracts. Read-only DB baseline found the
      headline gap: **outcome capture is effectively broken** (≈0.5% watch capture;
      events funnel 0 watched/0 skipped) — so F8B must fix capture before tuning.
      Reason coverage is strong (1/3,288 generic); hero déjà-vu near zero. No
      scoring/schema/UI/`ENGINE_VERSION` change.
- [x] **F7 — Cinematic DNA / Profile vNext** (`docs/cinematic-dna-profile-vnext-f7.md`):
      removed three cold-state fabrications (masthead fake taste summary/signature →
      honest "still forming"; Skew + YIR now self-hide instead of inventing "you vs
      everyone" / "18 films in December" samples); new self-only `DnaConfidence` section
      frames the number as taste *evidence* (not accuracy/score-of-you) with cold/warm
      guidance + a Tonight connection (moved out of the bare QuickStats stat). Shared
      `dnaConfidence` formula UNCHANGED (consistent with `/account`). Added a
      `DnaConfidence` test + a `/profile` a11y e2e.
- [x] **F6B — Film File case-making UI** (`docs/film-file-case-making-f6b.md`): new
      `PrimaryCaseCard` leads `/movie/:id` with the consolidated tier-aware case
      (ff_take → adaptive header → honest standalone; folds in the previously-buried
      FF Take); reframed `critic_quotes` → honest **`ViewerNotes`** ("not real
      reviews" disclaimer); made `data.js` Parasite placeholders explicit
      (`PARASITE_*_SAMPLE`, gated). Existing data only; engine/schema/edge untouched.
      Verified: lint + 447 tests + build + authenticated `/movie` e2e (poster→detail,
      watchlist Save, a11y) all green.
- [x] **F6A — Film File case-making design** (`docs/film-file-case-making-f6a.md`):
      current-state map + tiered hierarchy + UI/data-contract plan + F6B options.
      Corrected the F0 "one seeded film" shorthand: the Film File already has a
      rich, tiered, never-fabricating case layer (`deriveWhyReasons`/`MoodRadar`/
      `boundaryWarnings`) + a lazy `generate-movie-overlay` edge pipeline (ff_take/
      critic_quotes/daypart, OpenAI server-side). Real gaps: `why_for_you` is
      curated-only, the case is distributed (no leading primary card), and
      `critic_quotes` (invented personas) need honest reframing. Recommended
      F6B = Option A (UI-only). Added `deriveWhyReasons`/`deriveWhyHeader` contract
      tests. Docs-only; no behavior change.
- [x] **F5 — Home / Briefing vNext** (`docs/home-briefing-vnext-f5.md`): surfaced the
      hidden `engineReason` as the Briefing's "Why this pick" case (new null-safe
      `WhyThisPick` — no fabrication on cold-start); replaced the loading text with a
      content-shaped `BriefingSkeleton`; kept the self-hiding supporting tail
      (Option A). Engine/schema/auth/routes untouched; skip/save/watch contracts +
      impression writes preserved.
- [x] **F4 — Landing + Onboarding vNext** (`docs/landing-onboarding-vnext-f4.md`):
      applied the parked landing-reusability stash (Eyebrow/AuthCTA/Wordmark +
      `useInView`; movie/profile excluded); tightened Community honesty framing
      ("Illustrative · taste twins grow as FeelFlick does"); added onboarding
      "why we ask" microcopy (Genres/Films/Rate). Engine/IA/auth untouched. Darwin
      visual baseline re-generated; Linux pending (see Blocked).
- [x] **F3 — Design System Hardening** (`docs/design-system-hardening-f3.md`): retired
      genuine brand-ambient/accent drift (router `LandingBg`, SearchBar hover,
      ErrorBoundary → sanctioned `red`); documented brand-vs-semantic tokens (amber/
      red/green kept as load-bearing semantics); exported `Eyebrow` from `@/shared/ui`;
      added a tokens contract test. Inline `HP` holdouts were already resolved
      (Discover + browse spread `baseHP`). `stash@{0}` reviewed, left intact, not applied.
- [x] **F2 — Information Architecture v2** (`docs/ia-v2-decision-record.md`): nav now
      encodes the surface hierarchy — mobile bottom-nav hero moved Discover →
      **Tonight** (`/home`); desktop pills reduced to Tonight · Discover · DNA
      (Browse/Watchlist demoted to the account menu); "Home" → "Tonight" label.
      Routes/guards unchanged. Added a `BottomNav` IA-contract test.
- [x] **F1 — Product Doctrine + README/Docs Alignment** (`docs/product-doctrine.md`,
      `docs/product-research-patterns.md`; README/architecture/overview reconciled).
- [x] F0 — Foundation Readiness Audit (`docs/feelflick-foundation-readiness-audit.md`).
- [x] chore: npm audit clean — `npm audit` reports **0 vulnerabilities** (resolved).
- [x] fix: ESLint clean — `npm run lint` passes with 0 warnings (the prior
      rules-of-hooks ×8 + no-unescaped-entities ×47 backlog is resolved).
- [x] fix: `recommendations.helpers.test.js` now passes in the standard suite
      (full unit suite green: 417 tests / 33 files).

---

## How to Use

**Start of session:** Tell Claude Code — *"Read CLAUDE.md, PLANNING.md, and CLAUDE-REFERENCE.md before we start."*

**End of session:** Move in-progress items to Done, add new items to Up Next.

**Session handoff note (optional):** Add a one-liner below about where you stopped:

> _Last stopped: ..._
