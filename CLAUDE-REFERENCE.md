# FeelFlick — Reference

> **Load this file explicitly** when working on the recommendation engine, TMDB caching, or dev environment.
> Do NOT load by default — not needed for UI/component work.
> Invoke with: *"Read CLAUDE-REFERENCE.md before proceeding."*

## Tuneable Constants

Located in `src/shared/services/recommendations.js`, `src/shared/api/tmdb.js`,
and the two cache modules. Change deliberately — these affect recommendation
quality and API budgets.

> Line numbers reflect the codebase as of 2026-05-30. They drift; trust the
> constant names and re-grep when in doubt.

| Constant | File | Value | Meaning |
|---|---|---|---|
| `ENGINE_VERSION` | recommendations.js:84 | `'2.17'` | Bump when algorithm changes; invalidates cached profiles |
| `THRESHOLDS.MIN_FF_RATING` | recommendations.js:320 | `6.5` | Min FeelFlick score to surface a title |
| `THRESHOLDS.MIN_FF_CONFIDENCE` | recommendations.js:321 | `50` | Min confidence before showing a recommendation |
| `THRESHOLDS.MIN_FILMS_FOR_LANGUAGE_PREF` | recommendations.js:322 | `3` | Films needed to infer language preference |
| `THRESHOLDS.MIN_FILMS_FOR_AFFINITY` | recommendations.js:323 | `2` | Films needed before genre/director affinity applies |
| `THRESHOLDS.MIN_VOTE_COUNT` | recommendations.js:329 | `150` | Min TMDB vote count for main pools (hidden-gems pool uses its own lower floor of 50) |
| `LIKELY_SEEN_WEIGHTS` | recommendations.js:309 | All `0` | Intentionally disabled — kept for backward compat |
| `TTL.FAST` | tmdb.js:41 | `60_000` (1m) | Dynamic endpoints (search, trending) |
| `TTL.NORMAL` | tmdb.js:42 | `5 * 60_000` (5m) | Discover & lists |
| `TTL.SLOW` | tmdb.js:43 | `12 * 60 * 60_000` (12h) | Stable data (movie details, credits) |
| `rateLimiter.maxRequests` | tmdb.js:35 | `40` | TMDB rate limit per 10s window |
| `defaultTTL` | shared/lib/cache.js:10 | `5 * 60 * 1000` (5m) | In-memory recommendation-cache default TTL |
| `CACHE_TTL_MS` | shared/services/tasteCache.js:14 | `24 * 60 * 60 * 1000` (24h) | Taste-fingerprint cache TTL (gates `taste_fingerprint_computed_at` re-derivation) |

> The old `recommendation-cache.js` row is gone — that file never existed under
> that name; the in-memory cache lives in `shared/lib/cache.js`, and the
> taste-fingerprint cache in `shared/services/tasteCache.js`.

## Dev Environment

Primary environment is **local macOS**. Node.js v20.20.2 via nvm (no Homebrew;
`gh` + `claude` live in the nvm bin). nvm is sourced in `~/.zshrc`, so the
toolchain is on PATH in every terminal.

```bash
npm install
npm run dev           # Vite dev server, port 5173
```

`vite.config.js` keeps `host: true` (bind all interfaces) and
`hmr.clientPort: 443` for Codespaces / remote-tunnel compatibility. Both are
harmless on plain localhost — leave them unless you're actually debugging HMR
over a tunnel.

## Known Codebase Issues

> Run `npm run lint`, `npm run test`, `npm run build`, and `npm audit` for the
> current state — don't treat the snapshot below as durable.

**Snapshot (2026-05-30):** `npm run lint` clean (0 warnings) · `npm run test`
green (408 tests / 32 files) · `npm run build` succeeds · `npm audit` last seen
clean.

`recommendations.helpers.test.js` historically crashed on import without
`VITE_SUPABASE_URL` in env; it now passes in the standard suite. The
`Error: always broken` line in console output is **expected** — a
`SectionErrorBoundary` test deliberately exercising the error boundary, not a
real failure.
