# F11B.2 — Page-Rhythm Walkthrough + Scope (Home / Movie / Profile)

> **Phase F11B.2. Rhythm + spacing consistency for the three core authenticated routes —
> scoped, reversible, no redesign, no behavior change.** Engine frozen `2.17`. This doc is the
> pre-change audit + the exact scope. **Does not unblock F8C.**

**Status:** ✅ audited + scoped. **Date:** 2026-06-04.

---

## Methodology (honest)

- **Live authenticated walkthrough: NOT run in a browser.** The authenticated routes are
  Google-OAuth / dev-credential gated; signing the browser in requires the dev test
  credential, which I keep out of this transcript. Only the **public landing** is live-observable
  (done in F11A). So `/home`, `/movie/:id`, `/profile` are audited **code-grounded** — exact
  spacing/radius values read from source (which, for a rhythm refactor, *is* the ground truth).
- **Consequence (important):** I will **not** change section *pixel* values on these three
  critical routes that I cannot visually verify — that risks breaking intentional rhythm
  hierarchy (and "no redesign" forbids flattening it). Pixel-level rhythm normalization is
  **deferred to F11B.3**, to be done **after** a live authenticated visual pass. F11B.2 ships the
  safe, zero-pixel foundation + the precise normalization plan.

## Code-grounded findings

### Section vertical rhythm (the core "rhythm" axis)
Inline section wrappers across the three routes use **7 different vertical paddings** — `40 · 48 ·
56 · 64 · 72 · 80 · 88 px` — with a **consistent 88px horizontal gutter**. The variation is *not*
obviously drift: larger values read as hero/lead sections, smaller as dense/secondary ones — i.e.
likely **intentional hierarchy**. Flattening it to one value would be a redesign (forbidden), and
the right value per section can only be judged with the page rendered. → **normalize in F11B.3
with visual verification**, not blind.

### Radius (shape) — the clean, SAFE win
Inline `borderRadius` across the three routes: **999 (pill, ~61×) · 6 (~30×) · 8 (~18×) · 4 (~9×) ·
12 (~2×)** — all of which map **exactly** to the F11B.1 `RADIUS` scale (`pill/sm/md/xs/lg`), plus a
few `3`/`14` with no exact token. Migrating the exact-match literals to `RADIUS.*` is **zero-pixel**
(identical render) and directly retires the F11A "no radius scale" drift.

### Shadows
Many ad-hoc inline `boxShadow` glows (poster/card), none matching the 3 `SHADOW` tokens. Migrating
them would *change* values → **deferred** (needs visual verification; F11B.3).

### Surfaces
The named callouts use **accent-tinted** panels (WhyThisPick `${accent}0d`, PrimaryCaseCard a
purple gradient) — *not* the flat `SURFACE.card` tint, so they are **not** drop-in `<Card>`s
without a visual change. `<Card>` adoption is therefore **deferred** to surfaces that genuinely
match (F11B.3); F11B.2 does not force it.

## Exact scope (F11B.2)

**Files to touch:**
- `src/shared/lib/tokens.js` — **add** a `SPACE` rhythm token (gutter + the section vertical scale + common stack gaps). The canonical target; documents the rhythm.
- `src/features/{home,movie,profile}/data.js` — re-export `RADIUS` (+ `SPACE`) alongside the existing `HP` re-export (so components import them locally, matching the existing pattern).
- `src/features/home/WhyThisPick.jsx`, `src/features/movie/PrimaryCaseCard.jsx`, `src/features/profile/DnaConfidence.jsx` — adopt `RADIUS.*` for their **exact-match** radii (zero pixel change). The trust-critical callouts establish the pattern.
- Docs (this file + the change doc + PLANNING/README).

**Files intentionally NOT touched:** every route layout/structure; section *padding pixel values*
(deferred to F11B.3); the shared `<Button>` (no render change → `/about` baseline safe); `MovieDetail.jsx`
/ `MovieCard` hover LAW; recommendation/data/analytics/overlay logic; the landing.

**Expected visual impact:** **none** — every change is additive (SPACE token) or an exact-value
token swap (radius). No rendered pixel changes ⇒ no visual-baseline route affected.

**Rollback plan:** revert the PR; the SPACE token is additive, the radius swaps are 1:1, nothing migrated structurally.

**Validation plan:** `lint → test → build → audit` + **`test:e2e`** (authenticated, dev test user — the real functional safety net for these routes) + the standard CI gates. `/` and `/about` unchanged ⇒ no re-baseline. `design-system-guard` + `a11y-audit` applied.

## Deferred to F11B.3 (needs a live authenticated visual pass)
- Section-padding rhythm **normalization** (judge each section's value with the page rendered).
- Broad `RADIUS`/`SHADOW` migration across `sections-top/bottom` (~110 more literals).
- `<Card>` adoption on genuinely-flat surfaces; accent-panel recipe consolidation.
- Mobile touch-rhythm pass (≥44px targets) — best verified live.
