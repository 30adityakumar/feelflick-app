---
name: design-system-guard
description: >
  Enforce FeelFlick's editorial design language on any UI work. Trigger on:
  "build a component", "style this", "redesign", "new section", "landing",
  "fix the layout", "make this look good", or whenever generating/editing JSX
  or CSS in a v2 surface or the v3 landing. Also run as a check after the
  frontend-design skill produces UI, since that skill pushes bold aesthetics
  that can violate this system.
---

# Design System Guard

FeelFlick has a strict, hand-tuned editorial language shared by the public v3
landing and every authenticated feature surface. **This system overrides any
generic design guidance (including the `frontend-design` skill).** When they
conflict, this wins.

When invoked, audit the proposed/changed UI against the checklist below and
report each violation as `severity (error/warning) — file:line — fix`.

## Hard rules (errors)

### Fonts
- [ ] Display/headlines/buttons/eyebrows → **Outfit** (`var(--font-display)`).
      Body/prose → **Inter** (`var(--font-body)`). Meta → JetBrains Mono (rare).
- [ ] ❌ FORBIDDEN fonts: Playfair Display, Satoshi, Fraunces — not installed.
- [ ] ❌ No new font imports without updating CLAUDE.md's font section.
- [ ] Italic Outfit accent applies to a **single fragment** inside a headline,
      never a whole sentence.

### Color
- [ ] Purple + pink **only**. No amber / rose / orange in gradients.
- [ ] No hardcoded hex outside the `HP` token object (v2) or the `C` palette
      (v3 landing). Otherwise use Tailwind tokens / CSS custom properties.
- [ ] ❌ No `text-neutral-*` / `text-gray-*` — use `text-white/<opacity>`.
- [ ] Brand gradient has ONE source of truth:
      `linear-gradient(135deg, #9333ea 0%, #ec4899 100%)` via
      `var(--brand-gradient)` or `bg-gradient-to-r from-purple-600 to-pink-500`.
      ❌ Never invent per-vibe / per-genre gradients.

### Hero / display typography
- [ ] Weight **200–300 only** at ≥56px. Below 56px, jump to 400–500.
- [ ] ❌ Never `font-black` / weight 900 in the editorial surfaces (that's
      the legacy v1 signature, preserved under `src/legacy/`).
- [ ] Negative letter-spacing on display: `-0.04em` to `-0.05em`.
- [ ] `textWrap: 'balance'` on headlines, `textWrap: 'pretty'` on body.

### Patterns & primitives
- [ ] Section headers use the canonical `@/shared/ui/SectionHeader.jsx` —
      don't hand-roll the gradient bar.
- [ ] Kicker = 22px purple rule + ALL-CAPS Outfit 700, 10–11px, 0.22–0.32em.
- [ ] Empty sections **`return null`** — never render a placeholder or
      fabricate content to fill a slot.
- [ ] Loading = `animate-pulse` skeletons matching content shape. ❌ No
      page/section spinners. (In-button micro-spinners in `Button.jsx` are the
      one documented exception.)

### MovieCard hover — THE LAW
- [ ] Pure poster `scale(1.04)` only. ❌ No portal, no floating overlay, no
      expanding panel, no sibling dim/shift. Below-card title stays static.
- [ ] Touching hover means reading all three owners first:
      `useMovieCardHover.js`, `Row/index.jsx`, `Card/index.jsx`.

### Navigation & meta
- [ ] ❌ Don't navigate to v1 legacy routes from a v2 surface
      (`/movie/:id` not `/movie-legacy/:id`, `/profile/:id` not
      `/profile-legacy/:id`, etc.).
- [ ] Tier 1 surfaces call `usePageMeta({ title: '<X> — FeelFlick' })`.

### Microcopy
- [ ] Sentence case: "Sign in" (not "Sign In").
- [ ] Unicode ellipsis `…` in pending states: "Signing in…", "Saving…",
      "Loading…", "Opening Google…".

## Output
End with a one-line verdict: ✅ on-system, or ⚠️ N violations (list them).
If zero violations, say so plainly — don't invent nits.
