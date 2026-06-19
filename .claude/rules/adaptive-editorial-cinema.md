---
paths:
  - "src/**/*.jsx"
  - "src/**/*.css"
  - "src/styles/**"
  - "src/shared/lib/tokens.js"
  - "tailwind.config.*"
  - "index.html"
---

# Adaptive Editorial Cinema — current visual implementation rule

This rule supersedes conflicting concrete palette, accent, button-geometry and
universal-page-depth instructions in `.claude/rules/design-system.md`.

Read `docs/ui/design-authority-adaptive-editorial-cinema.md` and ADR 021 before
visual work.

## Canonical foundation

- Inter only.
- Deep Neutral Ink: `#0f1010`, `#171819`, `#222427`, `#2e3135`.
- Paper-White: `#f5f2eb`, `#c9c5bc`, `#a5a198`.
- Decorative border `#3a3d41`; functional border `#747a82`.
- Neutral inverse primary: `#f0ece4` with `#0f1010` text.
- Coral-red signature: `#e5636f`; text `#ed7a87`; strong fill `#b83d4f`.
- Focus and meaningful commitment remain paper-white, never brand-colored.

## Usage

- Flat ink is the default page canvas.
- Page depth is opt-in for a soft introduction or one focal-film context.
- Use semantic tokens, not literal foundation colors in feature files.
- Brand accent is not a primary action, selection state, semantic state, mood,
  rating, confidence value, large atmosphere or pervasive glow.
- Text buttons use restrained rounded rectangles; pills are for compact choices;
  circles are for icon-only controls.
- Film imagery is content and evidence, not wallpaper. Normally use at most one
  dominant backdrop per viewport.
- Depth appears when attention or interaction requires it; do not box every item.
- Dense results optimize scanning. Immersive focal modules may use more space.
- No infinite feeds, generic carousel walls, decorative glass or per-card glow.

## Accessibility

- Meaningful text passes WCAG AA on its permitted surface.
- Functional boundaries and focus changes meet 3:1.
- State is not color-only.
- Keep 44px touch targets.
- Reduced motion removes nonessential movement.
- Focus remains a visible offset outline and supports forced colors.

## Compatibility

`.theme-thoughtful`, old rose names, purple/pink scales, `PrimaryAction` styling
and `VITE_UI_THEME=legacy` are temporary migration interfaces. Do not create new
consumers or describe them as the target identity.
