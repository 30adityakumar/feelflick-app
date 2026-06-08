---
name: perf-guard
description: >
  Review FeelFlick runtime performance. Trigger on slow pages, LCP, CLS, INP,
  bundle size, images, carousels, heavy dependencies, large queries, or optimization work.
---

# Performance Review

Read `.claude/rules/testing.md` and any path-specific implementation rules first.

Measure before claiming a performance problem or improvement. Use browser traces, Web Vitals, build output, query timing, and rendered behavior as appropriate.

## Review areas

### Images and media

- request an appropriately sized TMDB image for the rendered use
- reserve dimensions or aspect ratio to avoid layout shift
- prioritize likely LCP imagery
- lazy-load content that is genuinely below the fold
- avoid decoding or downloading media that is not likely to be shown

Do not require every image to lazy-load. Hero or immediately visible images may need eager loading and fetch priority.

### Layout and interaction

- reserve space for async content
- avoid unnecessary layout-triggering animation
- prefer transform and opacity for simple motion
- check long tasks and interaction responsiveness
- respect reduced motion

Skeletons are one option, not a universal requirement. Use the loading treatment that best preserves layout and communicates progress.

### JavaScript and bundles

- keep route-level code splitting where it provides value
- inspect new dependency cost and duplication
- avoid moving heavy modules into the entry path
- measure chunk changes after meaningful dependency or import changes
- use the existing animation library when appropriate; do not reject it solely for being large

### Data and queries

- select only fields needed by the surface
- avoid N+1 request patterns
- batch and cache where ownership and freshness allow
- inspect query plans or timing for database work
- do not preserve a cache merely because it exists when it serves stale or incorrect data

### Rendering

- avoid repeated expensive computation in render paths
- verify memoization actually reduces work before adding complexity
- inspect list virtualization only when list size and rendering cost justify it
- avoid performance changes that reduce accessibility or correctness

## Validation

State:

- metric or resource at risk
- measurement method
- baseline
- implemented or proposed change
- after measurement when available
- trade-offs and remaining uncertainty

Do not claim a win without evidence. For a preventive review where no baseline exists, describe the plausible risk without inventing numbers.
