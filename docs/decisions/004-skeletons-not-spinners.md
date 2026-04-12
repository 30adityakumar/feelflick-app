# ADR 004 — Loading States: Skeletons Only, Never Spinners

**Status:** Accepted  
**Date:** 2025-06  
**Decided by:** Aditya Kumar

## Context

FeelFlick targets Netflix / Apple TV+ polish. Loading states are a first-class UX moment. Two common patterns:

1. **Spinner** — a rotating icon indicating generic loading
2. **Skeleton** — a pulsing placeholder matching the exact shape of the content loading in

## Decision

Always use skeletons. Never spinners.

Skeleton implementation:
```jsx
// Tailwind class for all skeletons
animate-pulse bg-purple-500/[0.04]
```

Every skeleton must match the shape of the real content it replaces:
- Card skeletons: same aspect ratio as MovieCard
- Text skeletons: same line count and approximate width as real text
- Section skeletons: same row height as a real carousel row

## Rationale

- Spinners feel generic and low-budget — inconsistent with cinema-grade polish
- Skeletons preserve layout stability (no CLS when content loads in)
- Skeletons give users a preview of the content structure, reducing perceived wait time
- The purple-tinted pulse matches the FeelFlick cinema palette rather than a generic grey

## Consequences

- ✅ Zero layout shift on content load
- ✅ Consistent with design system (cinema palette, no off-brand grey spinners)
- ✅ Perceived performance is better — users see structure immediately
- ⚠️  Requires more upfront work per component — must design the skeleton shape
- ⚠️  Skeletons must be updated if the real component layout changes significantly

## Rule

> **No spinners anywhere in the codebase. Every loading state is `animate-pulse` skeleton matching real content shape.**
