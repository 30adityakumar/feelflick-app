---
name: perf-guard
description: >
  Protect runtime performance for FeelFlick's media-heavy frontend. Trigger on:
  "performance", "slow", "LCP", "CLS", "bundle size", "image/poster loading",
  "lazy load", "Lighthouse", "web-vitals", "optimize", or when adding images,
  carousels, heavy deps, or large queries.
---

# Performance Guard

FeelFlick is poster-heavy, personalization-heavy, and dual-deployed to Cloudflare
Pages + Vercel for edge speed. Protect the metrics users feel. **Measure, don't
guess** — use chrome-devtools (`performance_start_trace`, `lighthouse_audit`) and
the existing `web-vitals` wiring (`src/shared/lib/vitals.js`).

## Checklist
### Images / posters (the biggest lever)
- [ ] Use `tmdbImg()` with a **sized** variant (e.g. w342/w500), never `original`
      for grid/card posters.
- [ ] Below-the-fold posters: `loading="lazy"`. Hero/LCP image: eager +
      `fetchpriority="high"`.
- [ ] Always set width/height (or aspect-ratio) on posters → prevents CLS.

### Layout stability (CLS)
- [ ] Skeletons must match final content shape — `HomeSkeleton`/`RouteSkeleton`
      exist specifically to prevent carousel/hero pop-in. Don't regress them.
- [ ] Reserve space for async content; never shift on data arrival.

### JS / bundle
- [ ] Keep routes code-split (`lazy()` in `router.jsx`) — don't pull heavy modules
      into the entry chunk.
- [ ] Framer Motion is heavy — prefer CSS transitions for simple cases; animate
      transform/opacity only (no layout-triggering properties).
- [ ] Watch vendor chunk growth on `npm run build` (report sizes if they jump).

### Data / queries (Supabase)
- [ ] `select()` only needed columns — never `select('*')` on `movies`/`people`.
- [ ] Avoid N+1; batch with `.in()`. Lean on `user_profiles_computed` (cached)
      instead of recomputing per request.
- [ ] RLS perf: `auth.uid()` in policies should be `(select auth.uid())` so it's
      evaluated once, not per row.

## Output
State the metric at risk (LCP/CLS/TBT/bundle/query), the fix, and — when feasible —
a before/after from Lighthouse or a build-size diff. Don't claim a win without a number.
