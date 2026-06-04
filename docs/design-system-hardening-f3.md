# FeelFlick — Design System Hardening (F3 Decision Note)

> Phase F3 of the rebuild. Records the **judgments** behind the design-system
> hardening — especially what was *retained* and why, since the headline change
> set is intentionally small. Read alongside `CLAUDE.md` (the editorial language),
> [src/shared/lib/tokens.js](../src/shared/lib/tokens.js) (the token source of
> truth), and [product-doctrine.md](product-doctrine.md).
>
> **Date:** 2026-06-03 · **Status:** implemented in F3.

---

## The core finding: most flagged "drift" was already resolved or is semantic

F0 flagged amber/red tokens + inline `HP` holdouts as drift. Careful F3 inspection
showed a more precise picture, and the right move was **not to churn**:

- **Inline `HP` holdouts are already resolved.** Both `features/discover/Discover.jsx`
  and `features/browse/data.js` already `import { HP as baseHP } from tokens` and
  spread `...baseHP` with a few explicit, intentional local extras (`surface`,
  `paper`, `blue`, deeper `bg`). That is the *sanctioned* pattern, not drift. The
  F0/CLAUDE.md "still a holdout" note is stale. **No change made.**
- **`HP.amber` / `HP.red` / `HP.green` are semantic, not brand drift.** They are
  load-bearing app-wide:
  - `amber` (#F59E0B) — gold rating-stars (movie/profile/history/people/account/
    home/StarRating) + "stale"/caution (watchlist). Universal star convention.
  - `red` (#EF4444) — destructive/error (preferences avoid-genres, list delete,
    account danger zone, error toasts).
  - `green` (#34D399) — success / public / watched / following.
  Removing or purpling these would break ratings and destructive states. The task
  explicitly forbids that. **Kept; documented as semantic in `tokens.js`.**

So the genuine remaining drift is narrow — decorative brand ambient + one accent —
and that is what F3 retired.

---

## What F3 changed

1. **Token documentation (`tokens.js`)** — split the palette into **BRAND**
   (purple + pink + the single `HP_GRAD`) vs **SEMANTIC accents** (amber/red/green)
   with inline intent comments. **No values changed** → zero visual impact.
2. **Retired genuine brand-ambient / accent drift:**
   - `app/router.jsx` `LandingBg` (onboarding ambient): the two off-brand warm
     blobs — orange `rgba(254,146,69)` + red-orange `rgba(235,66,59)` — → brand
     purple-600 `rgba(147,51,234)` + pink-500 `rgba(236,72,153)`. Same blur, size,
     position, opacity; **hue only** (identical behavior, per F3's router allowance).
   - `app/header/components/SearchBar.jsx`: result-title hover
     `group-hover:text-orange-400` → `group-hover:text-purple-400` (brand accent).
   - `app/ErrorBoundary.jsx`: the error icon chrome `from-rose-500/20
     to-orange-500/20 … text-rose-400` → the sanctioned semantic red
     (`from-red-500/20 to-red-500/10 … text-red-400`). Removes both orange **and**
     rose drift (CLAUDE.md/`index.css` forbid amber/rose/orange) while keeping the
     error surface's red semantic — error chrome legitimately signals red, so it
     was aligned to `HP.red`, not purpled.
3. **Eyebrow primitive — barrel export** (`shared/ui/index.js`): added
   `export { default as Eyebrow } from './Eyebrow'` so the canonical kicker is
   importable via `@/shared/ui` like every other primitive (it was the lone
   primitive missing from the barrel). Behavior unchanged; existing direct imports
   still work.
4. **Tokens contract test** (`shared/lib/__tests__/tokens.test.js`): asserts the
   single brand gradient never drifts and the semantic accents are never removed.

---

## What F3 intentionally retained (semantic, not drift)

- **`HP.amber` / `HP.red` / `HP.green`** — semantic accents (above).
- **`landing/sections/FilmFile.jsx` `C.amber`** — the "Skip tonight" callout uses
  amber as a *caution* swatch deliberately contrasted with the brand-colored pick;
  flattening it to purple/pink would erase the "this is the skip option" signal
  **and** alter the visual-regression-tested landing baseline. Semantic + visual
  contract → retained.
- **`app/admin/CacheMonitoring.jsx`** orange/amber — confidence/severity status
  indicators (low = orange) in an admin-only tool; severity colors *should* read
  warm, not purple. Retained.
- **Per-mood accent hexes** (`home/data.js`, `browse/data.js` MOODS — e.g. cozy
  `#FBBF24`) — mood-identity colors, not brand gradients. Retained.
- **Gold star fills** (`StarRating`, the inline SVG stars) — universal rating
  convention. Retained.

---

## Eyebrow rollout status

- The canonical `Eyebrow` primitive (`shared/ui/Eyebrow.jsx`) is robust
  (`tone`/`color`/`rule`/`size`/`weight`/`spacing`) and **already adopted across
  feature surfaces** (preferences, people, home, history, watchlist, account). F3
  added it to the `@/shared/ui` barrel.
- The **remaining rollout** (landing sections + `movie`/`profile` `sections-top`)
  lives in the parked **`stash@{0}`** and was **not applied** (see below). It is
  better delivered in a focused, validated phase (F4 Landing vNext) with deliberate
  visual re-baselining.

---

## Stash `stash@{0}` handling — NOT applied, left intact

Per F0.1, `stash@{0}` ("f0.1: parked eyebrow rollout WIP…") was reviewed
(`git stash show -p`) but **not applied**, and **left fully intact**. Reasons:
- It is broader than F3's mandate: alongside the Eyebrow rollout it bundles a
  landing-reusability refactor — `AuthCTA` and `Wordmark` primitives (the
  `Wordmark` carries a **deliberate letter-spacing visual change**) and a
  `Reveal` → `useInView` refactor.
- The landing portion is **visual-regression tested**; applying it would require
  deliberate snapshot re-baselining, which F3 should not do (F9 owns the visual
  gate).
- It is pre-F0 WIP that was never validated; cherry-picking fragments (e.g. only
  `movie`/`profile`) would split an integrated change set and risk later conflicts.
- **`useInView.js` was NOT adopted** (it comes with the `Reveal` refactor we are
  not applying).

The stash remains available for the dedicated landing-reusability work in a later
phase.

---

## Deferred (out of F3 scope)

- Folding the landing `C` palette fully into `HP` (`C` is used across the
  visual-regression-tested landing — deferred to a landing phase).
- The landing/`movie`/`profile` Eyebrow + CTA/Wordmark rollout (parked in
  `stash@{0}`; F4).
- Any error-chrome "should errors be brand-pink instead of red" question — errors
  legitimately signal red; left as the `HP.red` semantic.

---

## Validation checklist

- [x] Brand ambient is purple/pink; no amber/orange/rose decorative drift remains
      in router/SearchBar/ErrorBoundary.
- [x] Semantic amber/red/green retained; ratings + destructive states intact.
- [x] Inline `HP` already consolidated (Discover + browse spread `baseHP`).
- [x] `Eyebrow` exported from `@/shared/ui`.
- [x] F2 IA contract intact (BottomNav test still green; nav untouched).
- [x] `npm run lint && npm run test && npm run build` green.
- [x] `stash@{0}` intact; not applied.
</content>
