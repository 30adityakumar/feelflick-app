# F11A — FeelFlick Visual Direction

> **Phase F11A. The grounded visual direction** that the [F11B plan](ui-polish-implementation-plan-f11b.md)
> implements. It extends — never contradicts — CLAUDE.md's "Editorial Language" and the
> [doctrine](../product-doctrine.md). Practical, not a moodboard. **No code change in F11A.**

**Status:** ✅ direction set. **Date:** 2026-06-04. One-line north star: **cinematic, calm,
honest — the pick is the hero, the chrome recedes.**

---

## Visual personality

**A late-night editorial cinema, not an app.** Deep black, type-led, one rationed gradient,
poster-forward, weighted-slow motion. Premium through *restraint*, not ornament. It should feel
like a trusted critic handing you one film — quiet, confident, honest.

## Typography mood

- **Outfit** display (weight 200–300 at ≥56px; 400–500 below) — the cinematic, airy headline voice; negative tracking (−0.04…−0.055em); `textWrap: balance`.
- **Inter** body/prose — calm, readable, `textWrap: pretty`, line-height 1.5–1.65.
- **Italic Outfit** as the brand accent — single fragments only, never whole lines.
- **Numbers** (match %, DNA, counts) in Outfit tabular — honest, never a "grade."
- **Rule:** type carries hierarchy; reach for size/weight/spacing before adding a box.

## Color usage

- **Base:** `#000` / `#06060a` cinema black; surfaces are faint white tints (`.04`) + hairline borders (`.08`), not filled cards.
- **Brand gradient (purple→pink):** **rationed** to identity moments — the primary CTA, a 3px section bar, an accent rule, a focal glow. **Never** ambient/everywhere.
- **Semantic accents:** amber (stars/stale), red (destructive), green (watched/success) — load-bearing, kept distinct from brand.
- **Text tiers:** `text` / `textSoft .72` / `textMuted .45` / `textFaint .40` (AA-large floor) — and **mood tints sit behind text, never under it**.

## Surface / card language

- **Borders, not shadows.** Elevation comes from `HP.border` hairlines + faint tints; reserve shadow for **one** thing — a CTA/focal glow.
- **One card recipe** for callouts (WhyThisPick / PrimaryCaseCard / DnaConfidence share a shape): faint gradient tint + hairline + a consistent radius. Codify it (vs hand-built each time).
- **Calm over filled.** Prefer open, spacing-defined regions to heavy boxes ("card soup" is drift).

## Poster treatment

- Posters are **objects of reverence** (Apple TV+/Letterboxd-object, not a grid). The **MovieCard hover LAW** is canonical: fixed slot, pure poster `scale(1.04)` (220ms weighted easing), border/shadow ramp, static below-card title. **No portal, no overlay, no expanding panel.** Lazy + `srcset` for perf.

## Motion language

- **Purposeful only:** (1) guide the eye to the pick, (2) acknowledge an action (save/skip/watch), (3) ease a transition. Weighted easing `cubic-bezier(0.22,1,0.36,1)`, ~180–240ms.
- **`prefers-reduced-motion` everywhere** — no exceptions (close the movie/profile/watchlist/history/account gaps).
- **No** decorative/scroll-jacked/parallax/looping animation. Landing `Reveal`/`Stars` are the ceiling, used sparingly.

## Empty-state tone

- **Cinematic + honest, never barren.** Route every empty through `EmptyState`: a quiet icon tile, a warm one-line title, an honest description, an optional single CTA. No fake content to fill a slot (`return null` when truly empty per the section-hide rule).

## Button hierarchy

- **One system.** Primary = brand-gradient pill (the *one* loud element per surface). Secondary = quiet `white/5` + hairline. Ghost/icon/destructive per the `Button` primitive. **Settle the font (Outfit) and shape (pill)** and bring inline feature buttons into the system (or a documented inline variant). Focus-visible ring always.
- **One primary per surface** — the pick/CTA. Everything else recedes.

## Page rhythm

- A consistent vertical rhythm token (the current `56–72px` desktop / `32px` landing, formalized) + `borderTop` hairline section separators. Content max ~1080px where prose readability matters; page max 1440/1280. **Whitespace is structure**, not emptiness.

## Mobile feel

- **Thumb-first, calm.** BottomNav centered on "Tonight." Touch targets ≥44px. Per-route mobile spacing from the rhythm token (not per-surface guesses). Type via `clamp()`. The Briefing must feel like *the* answer on a phone, with the tail clearly below the fold.

## Accessibility rules (non-negotiable)

- AA contrast for all text (mood tints never reduce it); `textFaint` is the floor, not for small critical text.
- `prefers-reduced-motion` honored on every animated surface.
- Every interactive element: visible focus ring + keyboard operable + `aria-label`.
- Skeletons (not spinners); `aria-busy` where relevant.
- Color is never the only signal (semantic accents pair with icon/text).

## Anti-scroll rules (visual)

- **One decision per surface.** The Briefing is the answer; supporting rows stay visibly **secondary** (smaller, below the fold, self-hiding when empty).
- **No infinite feed, no carousel wall as the primary surface.** Discover stays a *small* complementary set, never a grid.
- Motion/layout must pull the eye **toward the pick**, never into browsing.

## Do-not-become (visual anti-drift)

- ❌ **A generic SaaS dashboard** — no chrome-heavy settings/forms soup; stay cinematic-calm (watch Account).
- ❌ **A Netflix grid clone** — the single pick leads; rows never become the primary surface.
- ❌ **A Letterboxd social feed** — logging is substrate; no activity stream as home.
- ❌ **An Awwwards animation showcase** — motion clarifies, never performs.
- ❌ **Over-purple glassmorphism everywhere** — ration the gradient; no ambient glow on every panel.
- ❌ **Fake-luxury / overdesigned** — premium = restraint, not gold/gloss/ornament.
- ❌ **Reduced readability for mood** — text contrast wins over mood tint, always.

> This direction is a set of **constraints**. Any F11B change is measured against it *and* the
> [feature decision test](../product-doctrine.md#the-feature-decision-test): does it make the one
> pick land faster, fit better, or earn more trust? If not — it's not the priority.
