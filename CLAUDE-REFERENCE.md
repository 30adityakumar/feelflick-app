# FeelFlick — Reference

> **Load this file explicitly** when working on the recommendation engine, TMDB caching, or dev environment.
> Do NOT load by default — not needed for UI/component work.
> Invoke with: *"Read CLAUDE-REFERENCE.md before proceeding."*

## Tuneable Constants

Located in `src/shared/services/recommendations.js` and `src/shared/api/tmdb.js`.
Change deliberately — these affect recommendation quality and API budgets.

| Constant | File | Value | Meaning |
|---|---|---|---|
| `ENGINE_VERSION` | `recommendations.js:36` | `'2.4'` | Bump when algorithm changes |
| `THRESHOLDS.MIN_FF_RATING` | `recommendations.js:132` | `6.5` | Min FeelFlick score to surface a title |
| `THRESHOLDS.MIN_FF_CONFIDENCE` | `recommendations.js:133` | `50` | Min confidence before showing a recommendation |
| `THRESHOLDS.MIN_FILMS_FOR_LANGUAGE_PREF` | `recommendations.js:134` | `3` | Films needed to infer language preference |
| `THRESHOLDS.MIN_FILMS_FOR_AFFINITY` | `recommendations.js:135` | `2` | Films needed before genre/director affinity applies |
| `LIKELY_SEEN_WEIGHTS` | `recommendations.js:117` | All `0` | Intentionally disabled — kept for backward compat |
| `TTL.FAST` | `tmdb.js:41` | `60_000` (1m) | Dynamic endpoints (search, trending) |
| `TTL.NORMAL` | `tmdb.js:42` | `5 * 60_000` (5m) | Discover & lists |
| `TTL.SLOW` | `tmdb.js:43` | `12 * 60 * 60_000` (12h) | Stable data (movie details, credits) |
| `rateLimiter.maxRequests` | `tmdb.js:35` | `40` | TMDB rate limit per 10s window |
| `CACHE_TTL` | `recommendation-cache.js:10` | `5 * 60 * 1000` (5m) | In-memory recommendation cache TTL |
| `defaultTTL` | `lib/cache.js:10` | `5 * 60 * 1000` (5m) | RecommendationCache default TTL |

## Dev Environment (VS Code Remote Tunnels / Codespaces)

Node.js v20.20.2 via nvm · npm v10.8.2 · gh CLI v2.71.0 · Claude Code v2.1.87
nvm sourced in `~/.zshrc` — available in every terminal.

```bash
npm install
npm run dev           # binds to all interfaces, port 5173
```

Vite configured with `host: true`, `hmr.clientPort: 443` for Codespaces compatibility.

## Known Codebase Issues

> Run `npm run lint` for current state — do not treat the list below as current.

**ESLint (last checked 2026-03-30):** Top historical offenders:
- `react/no-unescaped-entities` ×47
- `react-hooks/rules-of-hooks` ×8
- `jsx-a11y/no-static-element-interactions` ×8
- `no-undef` ×4 (`process` without guard)

**Tests:** `recommendations.helpers.test.js` crashes on import — requires `VITE_SUPABASE_URL` in env.
`Error: always broken` output is expected (SectionErrorBoundary test exercising error boundaries).

**npm audit:** 8 vulnerabilities (3 moderate, 5 high) — not blocking dev.