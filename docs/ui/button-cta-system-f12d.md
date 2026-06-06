# F12D — Button / CTA System Pass

> **Phase F12D. Make the shared Button/CTA system more premium + consistent — primarily even,
> touch-comfortable heights — while preserving behavior and the cinematic direction.** Engine frozen
> `2.17`. **Does not unblock F8C.**

**Status:** ✅ implemented. **Date:** 2026-06-05.

---

## Current Button API (`src/shared/ui/Button.jsx`)

- **variants:** `primary` (brand-gradient pill) · `secondary` (calm white/5) · `ghost` (purple outline) ·
  `icon` (icon-only) · `destructive` (red). **sizes:** `sm | md | lg`. **props:** `fullWidth`, `loading`
  (the one sanctioned in-button spinner), `disabled`.
- All `rounded-full`; shared `focus-visible:ring-2 ring-purple-400/50`; `disabled:opacity-50
  cursor-not-allowed`.
- **Computed heights (the problem):** `sm ≈ 28` · `md ≈ 40` · `lg = 48` (via `py-*` + line-height, **no
  min-height**) → uneven steps (12px then 8px) and `sm`/`md` below a comfortable touch floor. `icon`:
  32/40/48. `sm`/`md` use `font-semibold`, `lg` uses `font-bold`.

## Usage audit

- **18 shared `<Button>`** usages: sizes — 5×`lg`, 4×`sm`, ~9×`md` (default); variants — 5×`primary`,
  7×`secondary`, 2×`icon`, rest default `secondary`.
- **Visual-baseline routes:** only **`/about`** uses the shared Button — **`<Button variant="primary"
  size="lg">`** (the Google sign-in CTA, About.jsx:444). **Landing (`/`) uses its own Tailwind buttons**
  (`landing/primitives.jsx`), NOT the shared Button.
- **Route-local buttons NOT touched** (F12C `ff-tap` controls, inline route buttons, MoodPill) — out of
  scope; this phase is the shared Button only.

## Known `/about` visual-baseline impact — **none (by design)**

`/about` uses **`lg`**, which is **already exactly 48px**. The change adds `min-h-12` (48) to `lg` — a
**no-op floor at the same value** — and **does not change `lg`'s weight/padding/text**. So the `/about`
lg primary button renders **byte-identically** → **the `/about` baseline does NOT change** and **no
rebaseline is needed**. Landing (`/`) doesn't use the shared Button → also unchanged. (This is a
deliberate scoping choice: deliver the height normalization without an avoidable baseline break.)

## Proposed changes (minimal, backward-compatible)

1. **Even, touch-comfortable height floor via `min-height`:** `sm → min-h-10` (40) · `md → min-h-11`
   (44) · `lg → min-h-12` (48). Even **4px** steps (40 / 44 / 48). `sm`/`md` grow; **`lg` unchanged**.
2. **Icon sizes to the same floor:** `sm 40` (`h-10 w-10`) · `md 44` (`h-11 w-11`) · `lg 48`
   (`h-12 w-12`) — icon-only controls reach a 44px md tap area. (icon isn't on a baseline route.)
3. **Keep** all variant colors, `rounded-full`, focus ring, disabled, and the in-button spinner. **Keep
   `lg`'s `font-bold`** — intentional **hero-CTA weight** (the `/about` sign-in CTA), not drift.
4. **Document the hierarchy discipline** (below) in DESIGN_SYSTEM — guidance, not a render change.

> **Not** in F12D: a Button **font → Outfit** alignment (would change `/about` → a real deliberate
> rebaseline) stays **deferred**; variant *color* redesign (broad) is out of scope. "Don't turn every
> button into a big purple pill."

## CTA hierarchy discipline (documented guidance)
One **primary** (gradient) per view = the obvious action. **secondary** (calm gray) is subordinate.
**ghost** is the quietest. `discover`'s `Begin →` (primary) + `or, surprise me` (secondary) is the model.

## Rollback plan
Revert the PR. The change is additive `min-height`/icon-size classes on the shared Button — 1:1
reversible; no variant/behavior removed.

## Validation / rebaseline plan
`lint → test → build → audit` + Button tests (min-heights per size) + **local `test:visual`** to confirm
`/` + `/about` still match (expected: **match**, since `lg` is render-identical) + authenticated
screenshots of `/movie` + `/account` (shared Button present) for no breakage + `test:e2e`.
**If `/about` unexpectedly shifts:** inspect the diff, document the delta here, regenerate the **Darwin**
baseline (`npm run test:visual:update`) AND the **Linux** baseline via the repo flow (push to
`visual-baselines/<name>` → CI regenerates + commits → PR), and **do not claim CI visual green until it
is**. Expected outcome: **no rebaseline required.**
