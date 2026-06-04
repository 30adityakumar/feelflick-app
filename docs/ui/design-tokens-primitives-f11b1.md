# F11B.1 — Design Tokens + Primitive Cleanup (implementation note)

> **Phase F11B.1. The safe foundation before any route-level polish.** Consolidates shared
> tokens (radius/shadow/surface) + adds a `Card` primitive, **purely additively** — *zero
> rendered change* to any existing primitive or route, so **no visual baseline is touched**.
> Not a route redesign, not a visual refresh, not a product-behavior change. **No engine/
> scoring/schema/auth/package change. F8C stays blocked.**

**Status:** ✅ scoped. **Date:** 2026-06-04. Gated by `design-system-guard` (invoked) +
`a11y-audit` + `perf-guard`. Builds on the [F11A audit](ui-consistency-audit-f11a.md) +
[visual direction](feelflick-visual-direction-f11a.md) + [F11B roadmap](ui-polish-implementation-plan-f11b.md).

---

## Why additive-only

Two visual-regression baselines exist: **`/` (landing)** and **`/about`**. **`/about` uses the
shared `<Button>`.** So any *rendered* change to `Button` (e.g. Inter→Outfit font, shape) would
break the `/about` baseline, which needs the per-platform (Linux CI) re-baseline flow — too heavy
for a "safe foundation." Therefore F11B.1 **adds** tokens + a new primitive and **pins contracts
with tests**, but changes **no** existing rendered output. The render-level convergence (one button
font, inline-button→primitive migration, Eyebrow style unification) is deferred to **F11B.2/B.3**,
where a deliberate re-baseline is in scope.

## Exact scope

| Do | Don't |
|---|---|
| Add `RADIUS` / `SHADOW` / `SURFACE` tokens to `tokens.js` | Remove/alter `HP` / `HP_GRAD` / `C` or semantic colors |
| Add a new `Card` primitive (tokens + reduced-motion-safe hover) | Replace existing route cards with it |
| Document the Button + Eyebrow contracts; pin with tests | Change Button/Eyebrow *rendered* output (baseline risk) |
| Add a docs example (`DESIGN_SYSTEM.md`) using the new tokens/Card | Mass-convert call sites |
| Tests for the new scale + `Card` + extended Button/Eyebrow contracts | Touch Home/Movie/Profile routes |

## Files allowed (this phase)

- `src/shared/lib/tokens.js` — **add** `RADIUS`, `SHADOW`, `SURFACE` (additive).
- `src/shared/ui/Card.jsx` (**new**) + `src/shared/ui/Card.css` (**new**) — the surface primitive.
- `src/shared/ui/index.js` — export `Card` (additive).
- `src/shared/ui/__tests__/` — `tokens.test.js` (new), `Card.test.jsx` (new), `Eyebrow.test.jsx` (new), extend `Button.test.jsx`.
- `docs/DESIGN_SYSTEM.md`, `docs/ui/design-tokens-primitives-f11b1.md`, `docs/PLANNING.md`, `docs/README.md` — docs.
- **Not touched:** `Button.jsx`, `Eyebrow.jsx` (code), any feature route, the landing, CSS rewrites, packages.

## Token changes planned

- **`RADIUS`** = `{ xs: 4, sm: 6, md: 8, lg: 12, xl: 16, pill: 9999 }` — a scale that covers the
  ad-hoc inline values (3/4/5/6/8/10/14/999) found in F11A; the migration target.
- **`SHADOW`** = `{ card, hover, focus }` — doctrine is *borders over shadows*, so `card` is
  barely-there; `hover` a subtle dark lift; `focus` the brand purple ring (`#A78BFA`).
- **`SURFACE`** = `{ base, panel, card, elevated }` — semantic aliases over the existing surface
  hexes (`HP.bgDeep`, `HP.panel`, `C.bgLight`) so callouts name their tint instead of repeating it.

## Primitive changes planned

- **`Card` (new):** `tint` (base/panel/card/elevated) · `radius` (token key) · `border` · `hover`
  (opt-in, **reduced-motion-gated** lift) · `as`. Borders over shadows. Consumes the tokens.
- **`Button` (contract only):** already 5 variants (primary/secondary/ghost/icon/destructive),
  `rounded-full` pill, focus-visible ring, disabled, in-button spinner. **No code change**; tests
  pin the contract. **Documented follow-up:** align the button *font* to Outfit (per the guard) —
  deferred (breaks the `/about` baseline; do it with a re-baseline in B.2).
- **`Eyebrow` (contract only):** the shared primitive already supports `color`/`weight`/`spacing`
  overrides, so the landing's quiet style (Outfit 600 / white-.42) is representable via props — i.e.
  the contract already reconciles. **No code change**; a test pins it. The landing keeps its
  `.ff-eyebrow` CSS (visual-regression-tested) — convergence is deferred.

## Routes intentionally NOT redesigned

Home, Movie, Profile, Discover, Browse, Watchlist, History, Account, Landing, About — **none**
touched. F11B.1 is foundation only.

## Rollback plan

Every change is additive → revert the PR; existing call sites are unaffected because nothing was
migrated. No data/route/behavior change to roll back.

## Validation plan

- `lint → test → build → npm audit` (+ new unit tests).
- **Visual:** no visual-baseline route (`/`, `/about`) changed (Button/Eyebrow render untouched; new
  tokens/Card unused by those routes) → `test:visual` **not required**; documented here. (Re-run if a
  later wave changes a baseline route.)
- `a11y-audit` (Card focus/hover reduced-motion) + `perf-guard` (no new deps, trivial CSS).
