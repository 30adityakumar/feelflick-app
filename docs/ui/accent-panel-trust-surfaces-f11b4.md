# F11B.4 — AccentPanel primitive + trust-surface consolidation

> **Phase F11B.4. A design-system-native primitive for the *expressive* (accent-tinted) trust
> surfaces** — the sibling of the flat `<Card>`. Engine frozen `2.17`. Design-system
> consolidation, **not a route redesign**. The first migration only **proves** the primitive can
> represent the current visual language with **no behavior change and visual parity**. **Does not
> unblock F8C; preserves the honesty layer.**

**Status:** ✅ designed + one proof migration. **Date:** 2026-06-04.

---

## Why the flat `<Card>` is not enough

`<Card>` (F11B.1) is **intentionally flat**: a faint *white* tint (`SURFACE.card` =
`rgba(255,255,255,0.04)`) + a hairline `HP.border`. The trust callouts are **accent-tinted**, not
flat:

| Callout | Current surface | Shape |
|---|---|---|
| **WhyThisPick** | `background:${accent}0d` + `border:1px solid ${accent}26` (accent = `HP.purple`, always), `RADIUS.md` | **flat accent tint** |
| **PrimaryCaseCard** | `linear-gradient(160deg, ${HP.purple}0f, transparent 72%)` + `border:${HP.purple}33`, `RADIUS.lg` | **directional gradient tint** |
| **DnaConfidence** | a `<section>` (grid + number + `HP_GRAD` bar) — *not* a single tinted panel | **structural section** |

So a flat `<Card>` can't represent them without losing the accent identity. We need a primitive
whose surface is a **brand/semantic tone tint** (not white).

## Decision: a **separate `<AccentPanel>` primitive** (Option A)

Not a `<Card>` variant. Rationale:
- Keeping `<Card>` **flat** keeps its intent clear; adding a `tone` to Card would make it noisy /
  over-flexible (the brief's "do not overload Card").
- An `<AccentPanel>` reads by intent at the call site (`tone="purple"`) and is the obvious home for
  the honesty callouts.
- Both share the token vocabulary (`RADIUS`/`SURFACE`/`HP`) and the reduced-motion-gated hover
  pattern, so they're siblings, not duplicates.

## Contract

```jsx
<AccentPanel
  tone="purple|pink|amber|green|red|neutral"   // brand (purple/pink) + semantic (amber/green/red) + neutral; NO arbitrary hex
  radius="xs|sm|md|lg|xl|pill"                  // RADIUS token key (default "md")
  interactive={false}                           // default non-interactive; true → reduced-motion-gated hover lift
  as="div"                                       // element type
  className                                      // merged
  style                                          // merged (margins/padding/positioning stay with the consumer)
>
```

- **Surface (by tone):** `background: ${toneColor}0d` (~5% tint) + `border: 1px solid ${toneColor}26`
  (~15%) + the token radius. Tone colors come from `HP` (purple/pink/amber/green/red) + a neutral
  white tint. This **exactly reproduces** WhyThisPick's purple surface.
- **Padding/margin stay with the consumer** (via `style`/`className`) — the primitive owns only the
  *surface* (tint + border + radius), like `Card`.

## What it supports / must NOT support

- **Supports:** the brand + semantic tone tints, the token radius, an opt-in reduced-motion-safe
  hover (border brighten) for *future* interactive callouts.
- **Must NOT support:** arbitrary color props, per-vibe/per-genre gradients, heavy shadows, more than
  one gradient. (PrimaryCaseCard's *directional gradient* is intentionally **out of scope** — it
  would need a separate `glow`/`gradient` variant, deferred.)

## First migration (proof): **WhyThisPick**

The safest by far:
- **Single call site** (`home/sections-top.jsx`), **no `accent` override** → always `HP.purple` →
  `AccentPanel tone="purple" radius="md"` reproduces it **byte-identically**.
- Simple structure (tint panel + Eyebrow + `<p>`), **null-safe** (must preserve `return null`),
  already has tests.
- Migration: the outer `<div>`'s tint/border/radius move into `<AccentPanel tone="purple"
  radius="md">`; `marginBottom`/`padding` stay in `style`; the `accent` prop stays (it still colors
  the Eyebrow; the panel is the brand-purple tone, which is what `accent` always is).

## Deferred (not migrated this phase)

- **PrimaryCaseCard** — directional gradient + chips + match %; needs a `gradient`/`glow` AccentPanel
  variant first. Defer.
- **DnaConfidence** — a structural `<section>`, not a single panel; the honest number block isn't an
  AccentPanel surface. Defer.
- **Broad migration** — only after the WhyThisPick proof holds + stays tiny.

## Rollback plan

Revert the PR. `AccentPanel` is additive (new files); the WhyThisPick change is a 1:1 surface swap
(byte-identical), trivially reverted.

## Validation plan

`lint → test → build → audit` + new `AccentPanel` tests + WhyThisPick's existing tests + an
**authenticated Playwright `/home` walkthrough before+after** (screenshots must match) + CI Visual
Regression (`/`,`/about` untouched). `design-system-guard` applied (tones are the approved brand +
semantic hues; no arbitrary hex; no new gradient).
