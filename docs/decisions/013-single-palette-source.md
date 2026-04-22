# ADR 013 — Single palette source: purple/pink only

**Status:** Accepted  
**Date:** 2026-04-22

## Context

`src/index.css` had grown to 1,200+ lines. It defined:
- Rose, amber, orange, teal, indigo, cyan CSS variable scales (~60 vars)
- Multiple gradient aliases (gradient-secondary/accent/warm/cool/vibrant/hero-text)
- Typography utility classes that shadowed Tailwind (.text-hero, .text-section, etc.)
- `tailwind.config.js` mapped those vars into Tailwind color tokens (rose/amber/orange/bg/surface/panel/text/muted)
- `.gradient-text` plugin used `var(--amber-500)` — inconsistent with brand

No component in the codebase used `bg-bg`, `bg-surface`, `text-muted`, `bg-rose-*`, `bg-amber-*`, or `bg-orange-*`. The extra tokens were dead weight that made it harder to enforce visual consistency.

## Decision

1. **index.css** is now ~30 lines: Google Fonts import (Inter only, no Playfair), globals import, Tailwind directives, `:root` with purple/pink scales + `--gradient-primary`.
2. **Purple and pink are the only custom palette vars.** Tailwind defaults (slate, gray, white, yellow-400 for ratings) are used as-is — no CSS var wrapper.
3. **`tailwind.config.js`** drops `bg/surface/panel/text/muted` color tokens and `rose/amber/orange` overrides. Keeps `purple` and `pink` (CSS var-backed for runtime theming).
4. **`.gradient-text`** is purple→pink only. No amber.
5. **Animations** split to `src/styles/animations.css`, imported via `globals.css`.
6. **`src/styles/tokens.css`** is motion-only (duration + easing CSS vars).

## Consequences

- Single source of truth for the brand gradient: `linear-gradient(135deg, var(--purple-500) 0%, var(--pink-500) 100%)`
- Any future surface or component must use `bg-black` (page), `bg-white/5 border border-white/10` (card), and the purple/pink accent system. No ad-hoc colors.
- Tailwind's built-in yellow-400 is used for star ratings. No custom amber var needed.
- If a new accent color is ever needed, add it to `:root` in `index.css` and extend `tailwind.config.js` — do not inline hex values.
