# FeelFlick — Active Sprint

> **Update this file yourself at the end of every work session.**
> Claude Code reads this at session start — keep it honest and current.
> Do NOT ask Claude to auto-update this file.

> **Now driven by the phased rebuild.** The full F0–F10 roadmap (objectives, scope,
> non-scope, validation, risk) lives in
> [feelflick-foundation-readiness-audit.md §8](feelflick-foundation-readiness-audit.md).
> This file tracks only the *active* slice — don't duplicate the roadmap here.

## Currently In Progress
- [ ] (between phases) — F9F landed: after the user applied the Sentry Allowed-Domains
      fix, **production Sentry ingest is VERIFIED WORKING** — 403 gone (server-side +
      browser), prod console clean, and a labeled runtime test error landed in Sentry
      Issues (env `production`, url `app.feelflick.com`). Production error monitoring is
      now live. F8C still blocked (needs real-user outcome volume).

## Up Next (prioritized)
- [x] ~~Apply the Sentry Allowed-Domains dashboard fix~~ — ✅ done (user) + **verified
      in F9F** (prod ingest working; test error landed in Issues). Housekeeping: resolve
      the labeled `F9F-SENTRY-VERIFY` test Issue in Sentry.
- [ ] **Production hardening follow-ups** (`docs/production-observability-security-f9d.md`
      §6): ship **CSP report-only** (draft policy in the doc) → tune → enforce; set
      CI repo secrets to make **E2E + Lighthouse** non-skip (names in F9D §4); upgrade
      HSTS (`includeSubDomains`/preload) once subdomains are HTTPS-confirmed;
      color-contrast a11y pass.
- [ ] **F8C — Gated engine tuning** — the first phase allowed to touch scoring
      (highest blast radius). **Capture is now PROVEN in prod (F9C)**; the gate that
      remains is **VOLUME**: a POST-DEPLOY baseline (via
      `docs/sql/recommendation-evaluation-queries.sql` §7) must show `outcomeCaptureRate`
      non-trivial + **stable across many real users**, sliced by `algorithm_version`
      and cold/warm tier. Today there's only dev/smoke volume → **still blocked**.
      THEN tune DB-first (recommendation-engine skill), leading with pool/coverage
      numbers + expected skip/watch effect.
- [ ] **F6C (later, gated)** — extend `generate-movie-overlay` to produce a
      `why_for_you` for non-curated films (Edge Function + prompt + honesty guards) —
      via the `supabase-change` skill.
- [ ] (later) F9–F10 per the F0 roadmap (F9 also owns the deferred Linux visual baseline).

## Blocked / Waiting
- [x] ~~**Linux landing visual baseline regeneration** (F4 landing)~~ — ✅ **RESOLVED
      in F9B.** Pushed `phase-f9a-release-ci-hardening:visual-baselines/rebuild` →
      the "Visual & A11y Regression" CI run regenerated + committed the Linux
      baseline (`5b9d0bad`); pulled the landing PNG back as `ed13b470`. CI changed
      exactly one file (`landing-fullpage-visual-linux.png`); `/about` untouched.
- [ ] (now-active, not a blocker) **F8C remains gated** — needs the post-deploy
      outcome-capture baseline (`docs/sql/recommendation-evaluation-queries.sql` §7).

## Done This Week
- [x] **F9F — Sentry ingest verification** (`docs/sentry-ingest-verification-f9f.md`):
      after the user added `app.feelflick.com`/`*.feelflick.com`/`localhost` to Sentry
      Allowed Domains, verified prod ingest works — 403→200 server-side (control
      `example.com` still 403, so the filter still enforces), browser envelope 200,
      **prod console fully clean**, and a labeled runtime test error (not committed)
      **landed in Sentry Issues** (env `production`, url `app.feelflick.com`, project
      `feelflick-app`) confirmed via read-only MCP. Replay masks text (no PII). lint +
      487 tests + build + audit green. No code change.
- [x] **F9E — Post-F9D production verification** (`docs/post-f9d-verification-f9e.md`):
      merged PR #171 (squash `0b9a1b5c`) → `main`; post-merge CI + Cloudflare Pages
      prod deploy green. **Security headers VERIFIED LIVE on `app.feelflick.com`**
      (`x-frame-options: SAMEORIGIN`, `x-content-type-options: nosniff`,
      `referrer-policy`, `permissions-policy: camera/mic/geo/browsing-topics=()`,
      `strict-transport-security: max-age=31536000`); browser smoke confirms the app
      renders + fonts/TMDB load + no header/CSP breakage (only the Sentry 403 remains).
      **Sentry ingest still 403** — Sentry MCP is read-only (no inbound-filter write),
      so the Allowed-Domains dashboard toggle is still the one manual step. lint + 487
      tests + build + audit green. No code change.
- [x] **F9D — Production Observability + Security-Header Hardening**
      (`docs/production-observability-security-f9d.md`): config + docs only, no
      product/engine change. **Root-caused the Sentry 403** — it's an Origin/
      Allowed-Domains inbound filter (200 server-to-server, 403 with any browser
      Origin incl. app.feelflick.com), NOT a bad DSN/env → one-time Sentry dashboard
      fix documented (no code change). Shipped safe security headers (X-Frame-Options,
      Permissions-Policy, HSTS, + explicit nosniff/Referrer-Policy) via **`public/_headers`**
      (discovered prod is **Cloudflare Pages**, not Vercel — so `_headers`, not
      `vercel.json`, is what reaches prod) + mirrored `vercel.json`. CSP deferred with
      a draft report-only policy. Documented CI secret names for E2E/Lighthouse.
      Validated: lint + 487 tests + build (emits `dist/_headers`) + audit 0 vulns.
- [x] **F9C — Merge / Deploy / Smoke / Outcome baseline**
      (`docs/post-merge-smoke-f9c.md`): merged rebuild PR **#169 (squash `c38cb473`)**
      → `main` + **Vercel Production deploy** (app.feelflick.com); post-merge CI +
      local gates green; live smoke (public + authenticated) all render; **F8B
      outcome capture VERIFIED in prod** (recency-gated save flipped a real
      impression's `added_to_watchlist`; >72h impression correctly not attributed).
      Only console error = pre-existing **Sentry-ingest 403** (flagged). **F8C still
      blocked** — capture proven, no real-user volume yet. No scoring/schema/UI change.
- [x] **F9B — Linux visual baseline** — regenerated via the `visual-baselines/*`
      CI flow (`ed13b470`); PR #169 "Visual Regression" green on ubuntu-latest.
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
