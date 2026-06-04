# F11B.3 — Authenticated Rhythm/Card Work (what changed)

> **Phase F11B.3. After a real authenticated visual pass, a deliberately small, zero-pixel
> change set.** Engine frozen `2.17`. No route redesign, no behavior/data change, no shared
> `<Button>` change, no `/about` impact. **Does not unblock F8C.** Pairs with the
> [authenticated walkthrough](authenticated-visual-walkthrough-f11b3.md).

**Status:** ✅ shipped. **Date:** 2026-06-04.

---

## Before/after summary

The [live walkthrough](authenticated-visual-walkthrough-f11b3.md) (signed-in, desktop + mobile,
via the Playwright e2e harness — no credentials printed) found the three routes **already visually
coherent**: Briefing primary + tail subordinate (Home), PrimaryCaseCard tight to the hero (Movie),
honest DnaConfidence (Profile), consistent section rhythm within each route. So the evidence called
for **restraint** — not pixel churn. F11B.3 makes only the zero-pixel consistency change the
evidence supports: migrate the remaining ad-hoc `borderRadius` literals in the Movie/Profile section
files to the `RADIUS` tokens. **No section padding value changed, no `<Card>` forced, no aggressive
normalization.**

## Home changes
**None.** Home is Tailwind-class driven and reads as coherent (Briefing primary, tail subordinate).
No inline radius drift to migrate; no padding change justified. Left as-is.

## Movie changes
- `src/features/movie/sections-top.jsx` + `sections-bottom.jsx`: migrated exact-match inline radii
  to tokens — `999→RADIUS.pill`, `8→RADIUS.md`, `6→RADIUS.sm`, `4→RADIUS.xs`. The no-token `3`/`14`
  values were left untouched. **No padding/structure/behavior change.** PrimaryCaseCard ↔ hero
  relationship left as-is (already connected).

## Profile changes
- `src/features/profile/sections-top.jsx` + `sections-bottom.jsx`: same exact-match radius→token
  migration (`999/8/6→pill/md/sm`). **No padding-value normalization** (the mild 40 vs 56 standard-
  section difference is deferred — see below — to avoid an unverified pixel shift). DnaConfidence
  honesty untouched.

## Card / token adoption
- **Token (`RADIUS`):** adopted across the 4 Movie/Profile section files (continuing F11B.1/B.2).
- **`<Card>`:** **not adopted** — the candidate surfaces are accent-tinted (PrimaryCaseCard
  gradient, DnaConfidence block, Discover-prompt glow) or poster/image cards (MovieCard hover LAW),
  none a drop-in for the flat `SURFACE.card` tint. Forcing `<Card>` would change tint/visuals →
  deferred (don't force it).
- **`SHADOW`:** the inline shadows didn't exactly match the 3 `SHADOW` tokens → not migrated
  (migrating would change values) → deferred.

## Behavior changes
**None.** Pure radius-literal → token swaps + imports (verified: every changed line is a radius swap
or import; 80 ins / 80 del, 1:1).

## Mobile notes
Mobile (390px) looked coherent — clean BottomNav (Tonight centered), scrollable mood pills, sensible
section stacking. **No mobile rhythm change made** (nothing clearly broken; touch-target tuning is a
later, separately-verified pass).

## Visual risk
**None.** Confirmed three ways: (1) the `999→9999` pill nuance is visually identical for every
affected element (all far smaller than ~2000px → fully rounded either way); the other swaps are
exact (8→8, 6→6, 4→4); (2) **post-migration computed section rhythm is byte-identical** to pre
(paddings + heights unchanged); (3) **post-migration screenshots are visually identical** to pre.
`/` and `/about` untouched → no baseline re-rebase; CI Visual Regression covers public safety.

## Validation results
lint ✅ · test ✅ · build ✅ · `npm audit` ✅ 0 high/critical · **authenticated Playwright walkthrough
(before + after)** confirms zero visual change · `design-system-guard` ✅ (the flagged 135° gradients
are pre-existing faint card tints, not introduced).

## What stayed deferred (→ F11B.4)
1. **Section-padding normalization** (e.g. profile standard sections 40 vs 56) — needs a fully-loaded
   Briefing + a deliberate visual comparison; the evidence so far says the routes are coherent, so
   this is low priority.
2. **Broad `SHADOW` token migration** + a `SHADOW`-scale that fits the existing poster/card glows.
3. **`<Card>` / accent-panel recipe** — a shared accent-tinted callout primitive (the real
   consolidation target for WhyThisPick/PrimaryCaseCard/DnaConfidence).
4. **Home inline radius** (if any remains) + Watchlist/History/Account routes (next surfaces).
5. **`prefers-reduced-motion`** gaps (F11A A1) — best paired with the F11B.6 motion wave.

## F11B.4 recommendation
Build the **accent-panel `<Card>` variant** (a tinted-callout recipe) so the trust callouts can
actually consolidate onto one primitive, then do the deferred `SHADOW` migration — both with the
same authenticated-walkthrough verification loop this phase established (it works well).
