# F11B — UI Polish Implementation Plan (roadmap, not implementation)

> **The implementation roadmap for the F11A audit — NO code is written here.** F11B is a *future*
> set of small, safe, gated waves. Each wave is its own branch + PR, ends green on `lint → test →
> build`, respects the [visual direction](feelflick-visual-direction-f11a.md), and is gated by
> `design-system-guard` + `a11y-audit` + `perf-guard`. **Nothing in this doc is executed in F11A.**
> **No engine/scoring/schema/auth change ever. F8C stays blocked.**

**Status:** ✅ plan only. **Date:** 2026-06-04. **Prerequisite for F11B.2+:** a **live authenticated
walkthrough** (the F11A audit was largely code-grounded; confirm severities in context first).

---

## Global rules for every F11B wave

- One wave = one branch (`phase-f11b-N-...`) + one PR; squash-merge; main stays green.
- **Always**: `design-system-guard` (gate `frontend-design` output through it), `a11y-audit`, `perf-guard`, then `code-review`.
- **Always**: `lint → test → build → npm audit`; run **`test:visual`** (landing is visual-regression-tested — re-baseline *deliberately*, never blind) + **`test:e2e`** when a route changes.
- **Never**: engine/scoring/schema/RLS/Edge/prompt/auth/route/package change; no `/home` tail enrichment; no broad redesign; no fabricated content; no readability-for-mood trades.
- **Anti-drift bind:** every change must pass the [feature decision test](../product-doctrine.md#the-feature-decision-test) (land faster / fit better / earn more trust) and the do-not-become list.

---

## F11B.1 — Design tokens + primitives cleanup *(foundation; no route redesign)*
- **Goal:** kill the token drift the audit found — **radius scale**, **one button system**, **elevation rule**, **Eyebrow reconciliation**, **Discover `purpleDeep`**. Add a `Card`/`Panel` primitive for callouts.
- **Allowed files:** `src/shared/lib/tokens.js`, `src/shared/ui/*` (Button, Eyebrow, new Card), `src/index.css`/`src/styles/tokens.css`, `Discover.jsx` (token line only), `docs/`. Add tokens; migrate call-sites *minimally* (or defer migration to later waves).
- **Risk:** **medium** (touches shared primitives → broad blast radius). Mitigate: additive tokens first, migrate incrementally.
- **Tests:** full unit suite (primitives have tests); `test:visual` (expect deliberate diffs if Eyebrow/Button shift → re-baseline); `test:e2e`.
- **Visual checks:** Button variants, Eyebrow tones, EmptyState, a sample callout across light/dark surfaces.
- **Rollback:** revert the PR; tokens are additive so call-sites unaffected if migration deferred.
- **Don't touch:** the MovieCard hover LAW; the landing `C` palette (separate, deferred); route layouts.

## F11B.2 — Page rhythm + spacing consistency *(Home, Movie, Profile first)*
- **Goal:** one vertical-rhythm token (formalize `56–72px`/section-hairline); replace inline section padding (`48px 88px` etc.) on the **core** surfaces.
- **Allowed files:** `src/features/{home,movie,profile}/*` (spacing/rhythm only), `src/shared/lib/tokens.js` (rhythm token). **No content/IA change.**
- **Risk:** **medium** (core surfaces). Do Home → Movie → Profile as separate PRs if needed.
- **Tests:** unit + `test:e2e` (home/movie/profile flows) + `test:visual` if landing-adjacent.
- **Visual checks:** desktop + mobile rhythm; Briefing stays visibly primary (tail secondary).
- **Rollback:** revert per-surface PR. **Don't touch:** the Briefing's primacy, WhyThisPick null-safety, the tail (keep it quiet — do not enrich).

## F11B.3 — Poster / card language consistency *(movie cards, Film File, watchlist/history)*
- **Goal:** one card/callout recipe (radius + tint + hairline) via the F11B.1 `Card`; consistent poster treatment.
- **Allowed files:** `src/components/carousel/*` (carefully — the hover LAW is sacrosanct), `src/features/{movie,watchlist,history}/*`, `shared/components` card widgets.
- **Risk:** **medium-high** (carousel = the hover LAW). **Read the 3 hover files + the audit doc first; do not alter hover behavior.**
- **Tests:** carousel unit tests, `test:e2e`, `test:visual`, **`perf-guard`** (poster lazy/srcset must hold).
- **Visual checks:** hover unchanged; cards consistent; no CLS.
- **Rollback:** revert. **Don't touch:** `useMovieCardHover` timers/behavior; poster scale law.

## F11B.4 — Empty / loading / error states *(trustful, cinematic, consistent)*
- **Goal:** route all empties through `EmptyState`; cinematic-calm error/404; consistent skeletons (shape-matched, no spinners).
- **Allowed files:** `src/shared/ui/EmptyState.jsx`, `src/app/{ErrorBoundary,NotFound}.jsx`, `src/features/{watchlist,history,browse,...}/*` (empty/loading only), skeleton components.
- **Risk:** **low-medium**. **Tests:** unit + `test:e2e` (empty-route states) + `a11y-audit`.
- **Visual checks:** each empty/error reads honest + on-brand; `return null` where truly empty (section-hide rule).
- **Rollback:** revert. **Don't touch:** the section-hide rule (don't fabricate filler); Sentry wiring.

## F11B.5 — Mobile polish *(bottom nav, route spacing, touch targets)*
- **Goal:** ≥44px touch targets, rhythm-token mobile spacing, BottomNav polish, Briefing-as-answer on phone.
- **Allowed files:** `src/app/header/*` (BottomNav), per-feature CSS media queries, mobile spacing.
- **Risk:** **medium** (nav is global). **Tests:** `test:e2e` mobile viewport, `a11y-audit` (targets), `test:visual` mobile.
- **Visual checks:** real device/emulated widths; nav centered on "Tonight"; no horizontal scroll.
- **Rollback:** revert. **Don't touch:** nav IA/routes (visual only); the "Tonight" centering.

## F11B.6 — Motion / micro-interactions *(subtle only)*
- **Goal:** close `prefers-reduced-motion` gaps (movie/profile/watchlist/history/account); add micro-delight **only** on save/skip/watch + the pick reveal; weighted easing.
- **Allowed files:** `src/features/{movie,profile,watchlist,history,account}/*` (motion only), `src/styles/animations.css`.
- **Risk:** **low**. **Tests:** `a11y-audit` (reduced-motion honored), `test:e2e`, `perf-guard` (no jank).
- **Visual checks:** motion guides the eye / acknowledges actions only; reduced-motion fully static.
- **Rollback:** revert. **Don't touch:** decorative/scroll motion (forbidden); the landing `Reveal`/`Stars` (already correct).

---

## Sequencing + risk ladder

| Wave | Focus | Risk | Gate before next |
|---|---|---|---|
| **B.1** | tokens + primitives | med | primitives green + re-baselined visuals |
| **B.2** | rhythm (Home/Movie/Profile) | med | core flows e2e green |
| **B.3** | poster/card language | med-high | hover LAW intact + perf green |
| **B.4** | empty/loading/error | low-med | a11y green |
| **B.5** | mobile | med | mobile e2e + targets |
| **B.6** | motion | low | reduced-motion verified |

**Do B.1 first** (everything else depends on the consolidated tokens/primitives). **Precede B.2+
with a live authenticated walkthrough** to confirm the audit's code-grounded severities. Each wave is
independently revertable. **None of this is built in F11A** — F11A produced the audit + this plan only.

## Hard "what NOT to touch" (across all waves)
- The **MovieCard hover LAW** (behavior), the **Briefing's primacy**, **WhyThisPick null-safety**,
  **ViewerNotes/DnaConfidence honesty**, the **section-hide rule**, the **landing** (except deliberate
  re-baselines), the **engine/scoring/schema/auth/routes**, and **package deps**. And never enrich the
  `/home` tail into a primary surface.
