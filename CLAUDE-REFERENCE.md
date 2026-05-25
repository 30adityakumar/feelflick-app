# FeelFlick — Reference

> **Load this file explicitly** when working on the recommendation engine, TMDB caching, or dev environment.
> Do NOT load by default — not needed for UI/component work.
> Invoke with: *"Read CLAUDE-REFERENCE.md before proceeding."*

## Tuneable Constants

Located in `src/shared/services/recommendations.js` and `src/shared/api/tmdb.js`.
Change deliberately — these affect recommendation quality and API budgets.

> Line numbers reflect the codebase as of 2026-05-20. They drift; trust the
> constant names and re-grep when in doubt.

| Constant | File | Value | Meaning |
|---|---|---|---|
| `ENGINE_VERSION` | recommendations.js:83 | `'2.16'` | Bump when algorithm changes; invalidates cached profiles |
| `THRESHOLDS.MIN_FF_RATING` | recommendations.js:319 | `6.5` | Min FeelFlick score to surface a title |
| `THRESHOLDS.MIN_FF_CONFIDENCE` | recommendations.js:320 | `50` | Min confidence before showing a recommendation |
| `THRESHOLDS.MIN_FILMS_FOR_LANGUAGE_PREF` | recommendations.js:321 | `3` | Films needed to infer language preference |
| `THRESHOLDS.MIN_FILMS_FOR_AFFINITY` | recommendations.js:322 | `2` | Films needed before genre/director affinity applies |
| `THRESHOLDS.MIN_VOTE_COUNT` | recommendations.js:328 | `150` | Min TMDB vote count for main pools (hidden-gems pool uses its own lower floor of 50) |
| `LIKELY_SEEN_WEIGHTS` | recommendations.js:308 | All `0` | Intentionally disabled — kept for backward compat |
| `TTL.FAST` | tmdb.js:41 | `60_000` (1m) | Dynamic endpoints (search, trending) |
| `TTL.NORMAL` | tmdb.js:42 | `5 * 60_000` (5m) | Discover & lists |
| `TTL.SLOW` | tmdb.js:43 | `12 * 60 * 60_000` (12h) | Stable data (movie details, credits) |
| `rateLimiter.maxRequests` | tmdb.js:35 | `40` | TMDB rate limit per 10s window |
| `CACHE_TTL` | recommendation-cache.js:10 | `5 * 60 * 1000` (5m) | In-memory recommendation cache TTL |
| `defaultTTL` | lib/cache.js:10 | `5 * 60 * 1000` (5m) | RecommendationCache default TTL |

## Dev Environment (VS Code Remote Tunnels / Codespaces)

Node.js v20.20.2 via nvm · npm v10.8.2 · gh CLI v2.71.0 · Claude Code v2.1.87
nvm sourced in `~/.zshrc` — available in every terminal.

```bash
npm install
npm run dev           # binds to all interfaces, port 5173
```

Vite configured with `host: true`, `hmr.clientPort: 443` for Codespaces compatibility.

## Known Codebase Issues

> Run `npm run lint` and `npm audit` for current state — do not treat the
> numbers below as durable.

**ESLint (verified 2026-05-20):** Clean. `npm run lint` returns 0 errors.

**npm audit (verified 2026-05-20):** Clean. 0 vulnerabilities.

**Tests:** `recommendations.helpers.test.js` historically crashed on import
without `VITE_SUPABASE_URL` in env. Verify before relying on the suite in a
fresh shell. `Error: always broken` output is expected (SectionErrorBoundary
test exercising error boundaries).
