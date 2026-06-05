# F12F — Motion / Micro-interactions Pass

> **Phase F12F. A RESTRAINT phase — motion clarifies affordance, it doesn't decorate.** The real,
> evidence-backed gap (F12A) is **reduced-motion coverage**, not "more animation." Engine frozen `2.17`.
> Additive + reduced-motion-safe; **no `/about` rebaseline** (interaction states aren't in static
> screenshots). **Does not unblock F8C.**

**Status:** ✅ implemented. **Date:** 2026-06-05.

---

## Current motion audit

| Surface | transition | reduced-motion? |
|---|---|---|
| **Button** (shared) | `transition-all duration-200`; primary `hover:scale-[1.02] active:scale-[0.97]`; icon `hover:scale-105 active:scale-95` | 🔴 **NOT gated** — the hover/active **scale (movement)** runs even under `reduce` |
| **Card** (shared) | `0.2s` hover, gated behind `no-preference` | ✅ gated (no transition under reduce) |
| **AccentPanel** (shared) | `border-color 200ms`, gated behind `no-preference` | ✅ gated |
| **Landing CTA / logo** | inline transforms | ✅ already `@media (reduce){ transform:none }` (`landing.css`) |
| **Browse FilterPill / search** | `transition: all 0.15s ease` (color/bg, no movement) | ⚠️ not globally gated (color only — low harm) |
| **Home mood pills** | `transition: all 0.25s ease` (color/border) | ⚠️ not gated (color only) |
| **Account Toggle** | `transition: background 0.25s` (the switch slide) | ⚠️ not gated |
| **History row controls** | mostly no hover state | — |
| **MovieCard hover-LAW** | poster `scale(1.04)` 220ms (`useMovieCardHover`/`Card`) | 🔴 not gated — **but the LAW is off-limits** |

**Already feels good:** Card / AccentPanel / landing (all gated); Button's resting + hover *look* is fine.
**Abrupt/MVP-ish:** durations vary (0.15 / 0.2 / 0.25s) with no shared vocabulary; the route-local `ff-tap`
controls (F12C) have **no press feedback** (tap feels "dead"); reduced-motion users still get Button
movement.

## Decision — what to change (restraint)

1. **Add additive `MOTION` tokens** (a vocabulary, not a behavior change): durations `fast/base/slow`,
   `ease`, `press`. Mirror them as `--motion-*` CSS custom properties for CSS use. **No global re-timing
   of existing controls** (that's churn for no clear win).
2. **Global reduced-motion guard** (`index.css`): the standard a11y reset — under
   `prefers-reduced-motion: reduce`, animation/transition durations collapse to ~0 (the app becomes
   instant). Comprehensive, safe (only affects reduced-motion users), and **baseline-safe** (Playwright
   visual disables animations + runs without reduced-motion).
3. **Button + icon → `motion-safe:` the hover/active scale** — so reduced-motion users get **no
   movement** (not merely instant). Shared primitive; **baseline-safe** (the scale is interaction-gated,
   absent from the static `/about` screenshot).
4. **Subtle tactile press on the F12C controls** — `.ff-tap` / `.ff-tap-hit` (classes already applied in
   F12C, so **zero new className churn**) get a **reduced-motion-gated** `:active { translateY(1px) }`
   with a `--motion-fast` transition. Default users get a premium "press"; reduced-motion users get
   nothing.

**Not changed:** the **MovieCard hover-LAW** (off-limits; the global reset makes its scale instant under
reduce, but fully gating its transform would touch the LAW → **documented residual, deferred**). No new
animations, no page transitions, no Button typography, no route behavior.

## Expected visual impact
- **Default users:** unchanged at rest; a new subtle 1px press on `ff-tap` controls. No layout shift.
- **Reduced-motion users:** movement removed (Button/icon scale gone; transitions instant). Correct.
- `/` + `/about`: **no static change** (motion is interaction-gated) → **no rebaseline**.

## Reduced-motion handling (the core of this phase)
Under `prefers-reduced-motion: reduce`: global reset (instant) + Button/icon scale `motion-safe`-gated
OFF + `ff-tap` press `no-preference`-gated OFF + Card/AccentPanel/landing already gated. Residual:
MovieCard poster scale becomes instant (LAW untouched).

## Rollback plan
Revert the PR. `MOTION` tokens + the reduced-motion block + the `ff-tap` press are additive; the Button
`motion-safe:` prefixes are 1:1 reversible.

## Validation plan
`lint → test → build → audit` + `MOTION` token tests + **Playwright with `emulateMedia({ reducedMotion })`**
(confirm Button hover does NOT scale under `reduce`; `ff-tap:active` translates under `no-preference`) +
authed no-overflow check + **`test:visual`** (expect `/` + `/about` unchanged → no rebaseline).
