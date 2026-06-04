# F11B.5 — AccentPanel `gradient` variant + PrimaryCaseCard proof

> **Phase F11B.5. Extend `<AccentPanel>` just enough to represent the *existing* PrimaryCaseCard
> directional-gradient surface, then migrate PrimaryCaseCard as a proof.** Engine frozen `2.17`.
> Design-system consolidation — **encode the current surface into the primitive, do not invent a new
> look**. **Does not unblock F8C; preserves the honesty layer (PrimaryCaseCard "makes its case").**

**Status:** ✅ designed + proof migration. **Date:** 2026-06-04.

---

## Why the current AccentPanel is insufficient

F11B.4's `<AccentPanel>` only does a **flat tint** surface (`background:${tone}0d` +
`border:1px solid ${tone}26`). PrimaryCaseCard's surface is a **directional gradient** with a
slightly stronger border — the flat tint can't reproduce it:

| | tint (F11B.4) | PrimaryCaseCard (to encode) |
|---|---|---|
| background | `${tone}0d` | `linear-gradient(160deg, ${HP.purple}0f, transparent 72%)` |
| border | `1px solid ${tone}26` | `1px solid ${HP.purple}33` |

## Exact current PrimaryCaseCard surface (to preserve byte-for-byte)

The section wrapper stays as-is (`padding:${SPACE.sectionSm}px ${SPACE.gutter}px 8px`, top border).
The **inner panel** ([`PrimaryCaseCard.jsx:60`](../../src/features/movie/PrimaryCaseCard.jsx)) is the
AccentPanel target:

```jsx
{
  maxWidth: 880,                                                      // consumer-owned
  padding: '26px 30px',                                              // consumer-owned
  borderRadius: RADIUS.lg,                                            // = 12
  background: `linear-gradient(160deg, ${HP.purple}0f, transparent 72%)`,
  border: `1px solid ${HP.purple}33`,
}
```

- **Gradient:** angle `160deg`, start `${HP.purple}0f` (~6%), end `transparent` at `72%`.
- **Border:** `${HP.purple}33` (~20%). **Radius:** `RADIUS.lg` (12). **Shadow/glow:** none (the
  gradient *is* the glow).
- **Chips:** `padding:4px 10px`, `RADIUS.pill`, `rgba(255,255,255,0.05)` bg, `HP.border` border —
  **unchanged, stay inline children**. **Match %:** Outfit 17/700 + a meta gloss — **unchanged**.
- **Mobile:** the section gutter collapses responsively (observed in F11B.3); the inner panel is
  fluid (`maxWidth:880`, `%` gutters) — **unchanged**.

## Chosen API: a constrained `variant` prop

Add `variant="tint" | "gradient"` to AccentPanel (default `"tint"` → current behavior, so WhyThisPick
is untouched).

```jsx
<AccentPanel variant="gradient" tone="purple" radius="lg" style={{ maxWidth: 880, padding: '26px 30px' }}>
```

- **`variant="tint"`** (default): `background:${tone}0d` + `border:1px solid ${tone}26` (unchanged).
- **`variant="gradient"`**: `background:linear-gradient(160deg, ${tone}0f, transparent 72%)` +
  `border:1px solid ${tone}33`. For `tone="purple"` this is **byte-identical** to the current
  PrimaryCaseCard surface.
- **Unknown `variant` → falls back to `tint`** (safe default).

### Why this is NOT arbitrary gradient support

The gradient is a **single fixed recipe** — angle `160deg`, stops `${tone}0f → transparent 72%`,
border `${tone}33` — driven **only by the approved `tone` enum**. There is **no angle prop, no stop
prop, no color string prop**. It encodes the one existing PrimaryCaseCard surface; it does not let
callers invent gradients. (This is the honesty-layer panel glow, not the brand CTA gradient — they're
different, both pre-existing.)

## What's allowed / consumer-owned

- **Allowed:** `variant ∈ {tint, gradient}`, `tone ∈ {purple,pink,amber,green,red,neutral}`,
  `radius ∈ RADIUS` keys, `interactive` (default false, reduced-motion-gated).
- **Consumer-owned (stay in `style`):** `padding`, `maxWidth`, margins — the primitive owns the
  *surface* only.
- **Must NOT add:** arbitrary gradient/angle/stop/color props; per-vibe gradients; heavy shadows.

## Rollback plan

Revert the PR. The `variant` prop is additive (default `tint` keeps F11B.4 + WhyThisPick identical);
the PrimaryCaseCard change is a 1:1 surface swap, trivially reverted. If `/movie` parity fails, revert
only the PrimaryCaseCard migration and keep the (tested, documented) variant — or revert all.

## Validation plan

`lint → test → build → audit` + new variant tests (default tint unchanged, WhyThisPick parity holds,
gradient class + surface, unknown-variant fallback, non-interactive default) + an **authenticated
Playwright `/movie/:id` parity check** (desktop + mobile; gradient/border/radius/chips/match %
unchanged) + CI Visual Regression (`/`,`/about` untouched). `design-system-guard` applied (the 160°
gradient is the *encoded existing* PrimaryCaseCard surface, tone-driven, not a new/arbitrary gradient).
