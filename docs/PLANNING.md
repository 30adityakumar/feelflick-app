# FeelFlick — Active Sprint

> **Update this file yourself at the end of every work session.**
> Claude Code reads this at session start — keep it honest and current.
> Do NOT ask Claude to auto-update this file.

> **Now driven by the phased rebuild.** The full F0–F10 roadmap (objectives, scope,
> non-scope, validation, risk) lives in
> [feelflick-foundation-readiness-audit.md §8](feelflick-foundation-readiness-audit.md).
> This file tracks only the *active* slice — don't duplicate the roadmap here.

## Currently In Progress
- [ ] (between phases) — F6A (design) just landed; F6B (implementation) is queued.

## Up Next (prioritized)
- [ ] **F6B — Film File case-making (Option A, UI-only)** per
      `docs/film-file-case-making-f6a.md` §8–9: add a consolidated, tier-aware
      **Primary Case card** that leads `/movie/:id`; honestly reframe (or drop) the
      `critic_quotes` "CriticQuotes" section; clean up the `data.js` Parasite
      placeholders; tighten anon/cold-start copy. Existing fields only — NO schema /
      Edge Function / generation / engine changes.
- [ ] **F6C (later, gated)** — Option C: extend `generate-movie-overlay` to produce a
      `why_for_you` for non-curated films (Edge Function + prompt + honesty guards) —
      via the `supabase-change` skill.
- [ ] (later) F7–F10 per the F0 roadmap.

## Blocked / Waiting
- [ ] **Linux visual baseline regeneration** (F4 landing) — REQUIRED before the F4
      PR's "Visual & A11y Regression" gate can pass on `ubuntu-latest`. The darwin
      baseline was regenerated locally in F4; the **Linux** one
      (`e2e/visual/landing.visual.js-snapshots/landing-fullpage-visual-linux.png`)
      is still pre-F4. It can ONLY be produced on Linux — Docker is not available in
      the local dev env (F4.1 confirmed), so it goes through the repo's CI flow.
      **Exact steps (needs a remote push — do when ready to PR F4):**
      ```bash
      # 1. Push F4's landing to a visual-baselines/* branch → triggers
      #    visual-regression.yml, which runs test:visual:update and commits the
      #    regenerated Linux baseline back to that branch (precedent:
      #    origin/visual-baselines/outfit-font).
      git push origin phase-f4-landing-onboarding-vnext:visual-baselines/f4-landing
      # 2. After the workflow commits the baseline, pull just that PNG into F4:
      git fetch origin visual-baselines/f4-landing
      git checkout origin/visual-baselines/f4-landing -- \
        e2e/visual/landing.visual.js-snapshots/landing-fullpage-visual-linux.png
      git commit -m "test(visual): regenerate Linux landing baseline (F4)" \
        e2e/visual/landing.visual.js-snapshots/landing-fullpage-visual-linux.png
      ```

## Done This Week
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
