# F11B.2 — Page Rhythm: Home / Movie / Profile (what changed)

> **Phase F11B.2. Rhythm/consistency foundation for the three core authenticated routes —
> zero rendered-pixel change.** Engine frozen `2.17`. No route redesign, no behavior/data/
> structure change, no `<Button>` render change (so `/about` baseline is untouched). **Does
> not unblock F8C.** Pairs with the [pre-change audit](page-rhythm-walkthrough-f11b2.md).

**Status:** ✅ shipped. **Date:** 2026-06-04.

---

## What changed

A **conservative, zero-pixel** pass: introduce the page-rhythm token + adopt the existing
`RADIUS` scale in the three trust-critical callouts. Every change is either additive (new token)
or an **exact-value token swap** (`RADIUS.md` === 8, `SPACE.gutter` === 88, …), so the rendered
output is byte-identical.

| File | Change |
|---|---|
| `src/shared/lib/tokens.js` | **+ `SPACE`** rhythm token `{ gutter, gutterSm, sectionLg/section/Md/Sm/Xs, stack/Sm/Xs }` — names the section gutters + vertical rhythm (additive). |
| `src/features/{home,movie,profile}/data.js` | re-export `RADIUS` + `SPACE` alongside the existing `HP` re-export (so components import them locally, matching the established pattern). |
| `src/features/home/WhyThisPick.jsx` | `borderRadius: 8` → `RADIUS.md`. |
| `src/features/movie/PrimaryCaseCard.jsx` | section padding `'48px 88px 8px'` → `SPACE.sectionSm`/`SPACE.gutter` tokens; card `borderRadius: 12` → `RADIUS.lg`; chip `999` → `RADIUS.pill`. |
| `src/features/profile/DnaConfidence.jsx` | section padding `'56px 88px'` → `SPACE.sectionMd`/`SPACE.gutter`; bar `999`×2 → `RADIUS.pill`; CTA `6` → `RADIUS.sm`. |
| `src/shared/lib/__tests__/tokens.test.js` | pin the new `SPACE` scale. |

## What stayed unchanged

- **No section *pixel* values changed.** The varied vertical paddings (40–88px) are likely
  intentional hierarchy and need a live authenticated visual pass to normalize safely → **deferred
  to F11B.3** (see the audit doc).
- No route structure, no sections added/removed/reordered, no recommendation/data/overlay/analytics
  logic, no skip/save/watch/open behavior, no copy.
- The shared `<Button>` render is untouched → the `/about` visual baseline is safe.
- `MovieDetail.jsx`, `sections-top/bottom`, `ViewerNotes`, `MoodRadar`, the MovieCard hover LAW,
  the landing — all untouched.

## Route-by-route (before → after)

| Route | Callout | Before → After (rendered) |
|---|---|---|
| **Home** | WhyThisPick | radius literal `8` → `RADIUS.md` (=8) — **identical** |
| **Movie** | PrimaryCaseCard | radii `12`/`999` + padding `48/88` → `RADIUS.lg`/`pill` + `SPACE.sectionSm`/`gutter` — **identical** |
| **Profile** | DnaConfidence | bar/CTA radii `999`/`6` + padding `56/88` → `RADIUS.pill`/`sm` + `SPACE.sectionMd`/`gutter` — **identical** |

The trust callouts now express their shape + rhythm through the shared tokens, establishing the
adoption pattern the broader migration (F11B.3) follows.

## Visual risk

**None.** Token values equal the original literals (verified by the passing `tokens.test.js` pins).
No visual-baseline route (`/`, `/about`) was touched. CI **Visual Regression** + **E2E** (authenticated)
both pass.

## Mobile notes

No mobile-specific spacing changed this phase (touch-rhythm + responsive section padding need a
live authenticated visual pass → F11B.3). The `SPACE.gutterSm` token is staged for that work.

## Validation results

lint ✅ · **512 tests** ✅ (+2 SPACE pins) · build ✅ · `npm audit` ✅ 0 high/critical · **E2E 14
passed** (authenticated routes functional) · CI Visual Regression expected green (no baseline route
changed). `design-system-guard` + `a11y-audit` applied.

## Follow-ups for F11B.3 (needs a live authenticated visual pass)

1. **Section-padding rhythm normalization** — judge each section's vertical value with the page rendered; normalize via the `SPACE` tokens.
2. **Broad `RADIUS`/`SHADOW` migration** across `home/movie/profile` `sections-top/bottom` (~110 more inline literals).
3. **`<Card>` adoption** on genuinely-flat surfaces; consolidate the accent-panel recipe (WhyThisPick/PrimaryCaseCard use accent tints, not `SURFACE.card`).
4. **Mobile touch-rhythm** (≥44px targets) + `SPACE.gutterSm` adoption.
5. **`prefers-reduced-motion`** gaps on movie/profile/watchlist/history/account (F11A A1) — pairs with the F11B.6 motion wave.
