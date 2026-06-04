# F11A — UI Inspiration Translation (principles, not clones)

> **Phase F11A. UI audit + design-direction — NOT a redesign.** This translates external UI
> references into **FeelFlick-native principles**. We borrow *disciplines*, never visuals.
> The rule, straight from the [doctrine](../product-doctrine.md): every borrowed idea must make
> tonight's one pick **land faster, fit better, or earn more trust** — or it's drift. No code
> change in F11A. **Does not touch the engine; F8C stays blocked.**

**Status:** ✅ translated. **Date:** 2026-06-04. **Engine:** untouched / frozen `2.17`.

The FeelFlick UI should feel: **cinematic · calm · intentional · emotionally intelligent ·
premium-but-not-pretentious · clear-not-cluttered · anti-scroll · honest · consistent.**

---

## The translation rule

> ❌ "Copy Linear." ✅ "Adopt Linear's *restraint* — fewer, calmer surfaces — in service of one pick."

For each reference, we extract a **discipline** and re-express it as a FeelFlick principle. We
never import a look, a motion gimmick, or an IA that fights the wedge.

## What to borrow / what to refuse (summary)

| Borrow (discipline) | Refuse (the look) |
|---|---|
| Restraint, speed, calm density | Generic SaaS-dashboard chrome |
| Clarity + trust in copy/affordances | Decorative, attention-grabbing motion |
| Cinematic editorial polish | A Netflix grid as the primary surface |
| Film identity / poster reverence | A Letterboxd-style social feed |
| Typography-led calm structure | Over-purple glassmorphism everywhere |
| Micro-delight *only where it aids the decision* | Awwwards "showreel" animation for its own sake |

## Source-by-source translation

### 1. Linear — speed + restraint → **"Calm density, instant response"**
- **Borrow:** few surfaces, tight information density without clutter, sub-100ms perceived response, keyboard-friendly, monochrome base with one accent.
- **FeelFlick principle:** the Briefing is *one* calm surface that answers fast; no spinner theatre (skeletons only); the purple/pink accent is rationed, not ambient.
- **Refuse:** Linear's productivity-tool chrome (command bars, dense tables) — we're cinematic, not a dashboard.

### 2. Stripe — clarity + trust → **"Every number means what it says"**
- **Borrow:** ruthless copy clarity, honest affordances, documentation-grade precision, trust through restraint.
- **FeelFlick principle:** match % reads "how it fits your taste so far" (already shipped); DNA is "taste evidence, not a score of you"; no number is a grade or a fabricated count.
- **Refuse:** enterprise-y density / pricing-page busyness on the core loop.

### 3. Apple TV+ — cinematic editorial polish → **"The film is the hero; the chrome recedes"**
- **Borrow:** poster/imagery reverence, deep blacks, generous negative space, editorial typography, craft in motion (slow, weighted easing).
- **FeelFlick principle:** the poster + the case lead; UI chrome is quiet; deep `#000`/`#06060a` grounds the cinema feel; Outfit display at weight 200–300.
- **Refuse:** Apple's *carousel-wall* home — that's the anti-pattern (the single pick leads, not rows).

### 4. Letterboxd — film identity → **"Reverence for the film, minus the noise"**
- **Borrow:** films feel like *objects* with identity (poster, year, a point of view); a credible voice about cinema.
- **FeelFlick principle:** the Film File makes a *case*; the "M." editorial voice gives a point of view — but logging is **substrate, not the front door** ([do-not-become](../product-doctrine.md#do-not-become-list)).
- **Refuse:** the social feed, the activity stream, the "home base is your diary" model.

### 5. Awwwards — motion → **"Motion clarifies, never performs"**
- **Borrow:** the *craft bar* (intentional easing, considered reveals), `Reveal`-on-scroll done tastefully (already on the landing).
- **FeelFlick principle:** motion only to (a) guide the eye to the pick, (b) acknowledge an action, (c) ease a transition — always `prefers-reduced-motion`-safe.
- **Refuse:** scroll-jacking, parallax showreels, decorative animation. A marketing-award look on the *app* is drift.

### 6. Craft / Read.cv — typography + calm structure → **"Type carries the hierarchy"**
- **Borrow:** type-led layouts, generous line-height for prose, calm vertical rhythm, almost no borders/shadows — structure from spacing + type, not boxes.
- **FeelFlick principle:** the editorial language already leans here (Outfit display + Inter body, `textWrap: balance/pretty`); lean *further* into spacing-as-structure over heavy cards.
- **Refuse:** decorative dividers, drop-shadow-heavy "card soup."

### 7. Superlist / Pitch — micro-delight → **"Delight at the decision moment only"**
- **Borrow:** small, earned moments (a satisfying save, a confident "watched" check).
- **FeelFlick principle:** micro-delight on save/skip/watch (the loop actions) and the reveal of the pick — nowhere else.
- **Refuse:** confetti, bouncy everything, playful illustration that undercuts "premium + cinematic."

## FeelFlick-specific visual principles (the synthesis)

1. **The pick is the hero.** Every screen's visual hierarchy points at one thing; chrome recedes.
2. **Calm over busy.** Negative space + type carry structure; rationed borders/shadows; one accent.
3. **Cinematic dark.** Deep blacks (`#000`/`#06060a`), poster-forward, weighted slow motion.
4. **Honesty is a visual property.** No fake confidence, no fabricated proof, no number-as-grade — the UI *shows* restraint where it doesn't know.
5. **Anti-scroll by construction.** One decision per surface; supporting rows stay visibly secondary; no infinite feed.
6. **One brand gradient, rationed.** purple→pink for identity moments (CTA, accents), never ambient glassmorphism everywhere.
7. **Consistency = trust.** The same button, card, eyebrow, and rhythm everywhere; one-offs become primitives.
8. **Readability never sacrificed for mood.** Mood tints stay behind text contrast (AA), never under it.

> These principles drive the [visual direction](feelflick-visual-direction-f11a.md) and the
> [F11B plan](ui-polish-implementation-plan-f11b.md). They are constraints, not a moodboard.
