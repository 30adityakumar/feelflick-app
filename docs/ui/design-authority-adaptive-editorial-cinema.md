# FeelFlick — Design Authority: Adaptive Editorial Cinema

> **Current visual authority.** This document supersedes the concrete palette,
> accent and universal-atmosphere direction in `design-authority-thoughtful-seatmate.md`.
> Product truth remains `docs/product-doctrine.md`; implementation details remain
> governed by `.claude/rules/design-system.md`, except where its older concrete
> foundation values conflict with ADR 021.

## Product expression

FeelFlick is personal movie discovery through taste, mood and curiosity.

The interface should feel like intelligent editorial cinema:

- calm enough to choose;
- clear enough to compare;
- open enough to explore;
- personal enough to reflect an evolving taste;
- cinematic without relying on constant darkness, glow or theatre clichés;
- expressive without competing with film artwork.

## Foundation

### Deep Neutral Ink

- canvas `#0f1010`
- base layer `#171819`
- section layer `#222427`
- raised layer `#2e3135`

Layers are used by function, not to wrap every item in a card.

### Paper-White Typography

- primary `#f5f2eb`
- secondary `#c9c5bc`
- tertiary `#a5a198`

Every meaningful text tier must remain readable on every canonical dark surface.
Disabled text and text over imagery require separate treatment rather than a
fainter meaningful-text token.

### Cinematic coral-red

- signature `#e5636f`
- dark-surface text `#ed7a87`
- strong white-text fill `#b83d4f`

The accent may appear in wordmark details, editorial links, progress, active
navigation marks and rare signatures. It does not own primary actions, focus,
selection, mood categories, ratings, success, warning, error or match confidence.

### Neutral inverse actions

The primary action is paper-white with ink text. Use one filled primary action per
local decision region. Supporting actions use solid neutral layers, outlines or text.
Normal text buttons use restrained rounded rectangles. Full pills are reserved for
genuine compact choices; circles are reserved for icon-only controls.

### Inter

Inter remains the single core typeface. Hierarchy comes from scale, weight,
measure, spacing and composition.

## Composition model

### Flat Ink

Default for Browse, result sets, History, Lists, Cinematic DNA evidence, account
surfaces and dense comparison.

### Soft Stage

Optional neutral depth for Home introductions, Discover questions, onboarding and
reflective empty states.

### Focal Cinema

One controlled backdrop or atmospheric treatment for a genuinely focal film,
Film File hero, or featured collection. Normally no more than one dominant backdrop
per viewport.

## Editorial structure with responsive focus

- Use spacing, headings and meaningful ordering before boxes or shadows.
- Finite recommendation groups need clear names and visible stopping points.
- Depth appears when content receives focus or interaction requires foregrounding.
- Hover and focus may reveal concise reasoning or actions without enlarging the
  entire interface or introducing decorative glow.
- Dense surfaces prioritize comparison and scanning; immersive surfaces may use
  more space and imagery.
- No infinite recommendation feeds or generic carousel walls.

## Imagery

Film imagery provides recognition and atmosphere. FeelFlick's explanations,
history and personal evidence provide meaning.

Use distinct image modes:

- hero backdrop;
- editorial poster;
- recommendation tile;
- dense Browse thumbnail;
- personal-memory evidence;
- restrained collection mosaic;
- honest fallback artwork.

Do not place uncontrolled text over artwork. Use semantic scrims. Do not create
per-card colored glows or autoplaying video backgrounds. Cinematic DNA uses images
as evidence of taste, not decorative collage.

## Interaction and accessibility

- Normal text contrast: WCAG AA or better.
- Functional boundaries and focus indicators: at least 3:1 against adjacent states.
- Focus is a visible offset paper-white outline and survives forced colors.
- State never depends on color alone.
- Touch targets are at least 44px where practical.
- Nonessential motion disappears under reduced motion.
- Motion clarifies feedback, entry, reordering or progress; it does not decorate.

## Experience modes

The same foundation supports four composition modes:

- **Decide:** focused, low burden, optional dominant hero, finite alternatives.
- **Discover:** emotionally sensitive, comparative, bounded, concise reasons.
- **Explore:** denser, filter-friendly, transparent, highly scannable.
- **Reflect:** evidence-rich, evolving, correctable, able to show change and contradiction.

These are not separate themes. They vary through density, hierarchy, imagery and
progressive depth.

## Do not become

- Netflix-style endless rows without a clear job;
- generic dark SaaS with glass, glow and universal pills;
- a static analytics dashboard for personal taste;
- a luxury editorial concept that hides utility;
- a mood interface where color replaces language;
- a film-poster collage with weak personal explanation;
- an interface that mistakes darkness for cinema.

## Compatibility status

The production root class remains `.theme-thoughtful` temporarily. Legacy
purple/pink scales, rose names, font aliases, `PrimaryAction` compatibility styling
and `VITE_UI_THEME=legacy` remain removal-gated debt. They are not target design.

See ADR 021 for the decision record and rollback boundary.
