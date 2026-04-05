# FeelFlick — Claude Code Project Guide

## Project Overview

**FeelFlick** (feelflick.com) is a mood-based movie and TV show discovery platform. The core experience is "Spotify-for-movies" style: users express a current mood and receive curated, deeply personalized recommendations — not popularity rankings.

**Mission:** Fast, private, free-forever mood-first discovery that respects users and never tricks them.

**Quality bar:** Netflix / Apple TV+ level of polish. Every surface is production-facing.

**Key differentiators:**
- Mood-first discovery vs. popularity-based feeds
- Privacy-first (no tracking, no fake social proof)
- Hybrid recommendation engine: content filtering + vector similarity + behavioral signals

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v7, Framer Motion, Tailwind CSS |
| Build | Vite |
| Backend / DB | Supabase (PostgreSQL + pgvector) |
| Movie Data | TMDB API |
| AI / Embeddings | OpenAI API (text-embedding-3-small) |
| Email | Resend |
| Auth | Google OAuth via Supabase |
| Testing | Vitest + @testing-library/react + @testing-library/jest-dom |
| Language | JavaScript (JSX) — TypeScript migration is a future goal |

---

## Architecture

### Key Folders in `/src`

```
src/
├── app/                  # App shell, routing, providers, page wrappers
│   ├── __tests__/        # App-level integration tests
│   ├── admin/            # Admin-only tools (email allowlist gated)
│   ├── dev/              # Dev-only tooling (not shipped to prod)
│   ├── header/           # Global nav header
│   ├── homepage/         # Authenticated homepage (carousels, moods)
│   ├── pages/            # Top-level route components
│   └── providers/        # React context providers (auth, theme, etc.)
├── components/           # Shared presentational components
│   └── carousel/         # Reusable carousel primitives
├── contexts/             # React context definitions
├── features/             # Self-contained feature modules
│   ├── auth/             # Google OAuth flow, session handling
│   ├── landing/          # Unauthenticated landing page
│   └── onboarding/       # New user onboarding flow
├── shared/               # Cross-cutting utilities
│   ├── api/              # API client wrappers (TMDB, Supabase calls)
│   ├── components/       # Truly generic components (buttons, modals, etc.)
│   ├── hooks/            # Reusable React hooks
│   ├── lib/              # Pure utility functions
│   ├── services/         # Domain services (recommendations, embeddings)
│   ├── styles/           # Global CSS, Tailwind utilities
│   └── ui/               # Low-level UI primitives
└── test/                 # Test helpers, fixtures, setup
```

### Auth Flow

Auth is initialized in `main.jsx` before React mounts: parses OAuth hash → sets Supabase session → redirects to `/auth/callback`. `RootEntry` redirects authenticated users to `/home`, unauthenticated to the Landing page. `RequireAuth` guards protected routes. `AdminOnly` checks an email allowlist.

### Recommendation Engine

Hybrid pipeline: content-based filtering + pgvector cosine similarity + behavioral signals (skips, re-watches, explicit ratings). Genre-normalized scores. Anti-recency bias. Signal decay over time. Tracked via `recommendation_impressions` and `mood_sessions` tables. Computed user profiles cached in `user_profiles_computed` with TTL.

---

## Environment Variables

All env vars use the `VITE_` prefix so Vite exposes them to the client bundle. Never put secrets with `VITE_` prefix — they are readable in the built output.

| Variable | Used In | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | `src/shared/lib/supabase/client.js`, `src/shared/services/interactions.js` | Supabase project URL (non-secret, public endpoint) |
| `VITE_SUPABASE_ANON_KEY` | `src/shared/lib/supabase/client.js` | Supabase anon/public key — safe client-side; RLS enforces access |
| `VITE_TMDB_API_KEY` | `src/shared/api/tmdb.js` and several page components | TMDB read-only API key — acceptable in bundle; rate-limited to 40 req/10s |
| `VITE_ADMIN_EMAILS` | `src/app/router.jsx` | Comma-separated list of admin email addresses for the `AdminOnly` route guard |

Vite also provides these automatically (do not set manually):

| Built-in | Value |
|---|---|
| `import.meta.env.DEV` | `true` in dev server (`npm run dev`) |
| `import.meta.env.PROD` | `true` in production builds (`npm run build`) |
| `process.env.NODE_ENV` | `'development'` or `'production'` — used by React and ErrorBoundary |

**OpenAI API key** is intentionally absent from `VITE_*`. It must stay server-side (Supabase edge function or secret). Never add a `VITE_OPENAI_*` variable.

---

## Code Standards

### Workflow (always in this order)
```
lint → test → build
```
Never skip steps. A passing test suite with a broken build is a broken PR.

ESLint is configured in `eslint.config.js` (flat config, ESLint 9). Run with `npm run lint`. Auto-fix safe issues with `npm run lint:fix`.

### Language & Types
- Project is JavaScript (JSX). Aim for JSDoc types on public-facing functions.
- TypeScript is the migration target — avoid patterns that would block a future TS migration (e.g., untyped dynamic `any`-style objects).
- Strict null safety in logic: never assume a nullable value is present without a guard.

### Naming Conventions
| Thing | Convention | Example |
|---|---|---|
| React components | PascalCase | `MovieCard.jsx`, `MoodSelector.jsx` |
| API routes / endpoints | kebab-case | `/api/mood-recommendations` |
| Hooks | camelCase prefixed `use` | `useRecommendations.js` |
| Utility files | camelCase | `scoreNormalizer.js` |
| CSS classes | Tailwind utilities; custom classes kebab-case | `mood-pill` |

### Component Rules
- One component per file.
- No inline styles — use Tailwind classes or `shared/styles`.
- All interactive UI components must have accessible labels (aria-label, role, etc.). No a11y regressions.
- No hardcoded secrets, API keys, or user-identifiable data in source.

### Testing
- Test runner: `vitest run` (CI) / `vitest` (watch)
- Prefer isolated behavior tests over complex full-tree mounts.
- Tests live in `__tests__/` adjacent to the feature they test, or in `src/test/` for helpers.
- Do not mock Supabase at the unit level unless the alternative is a network call in CI.

---

## Tuneable Constants

These are not feature flags (no runtime toggle) but are the key numeric constants that govern app behaviour. Change them deliberately — they affect recommendation quality and API budgets.

Located in `src/shared/services/recommendations.js` and `src/shared/api/tmdb.js`:

| Constant | Location | Current Value | Meaning |
|---|---|---|---|
| `ENGINE_VERSION` | `recommendations.js:36` | `'2.4'` | Recommendation engine version — bump when algorithm changes |
| `THRESHOLDS.MIN_FF_RATING` | `recommendations.js:132` | `6.5` | Minimum FeelFlick-normalised score to surface a title |
| `THRESHOLDS.MIN_FF_CONFIDENCE` | `recommendations.js:133` | `50` | Minimum confidence score before a recommendation is shown |
| `THRESHOLDS.MIN_FILMS_FOR_LANGUAGE_PREF` | `recommendations.js:134` | `3` | Films needed before language preference is inferred |
| `THRESHOLDS.MIN_FILMS_FOR_AFFINITY` | `recommendations.js:135` | `2` | Films needed before genre/director affinity is applied |
| `LIKELY_SEEN_WEIGHTS` | `recommendations.js:117` | All `0` | Intentionally disabled — kept for backward compat |
| `TTL.FAST` | `tmdb.js:41` | `60_000` (1m) | Cache TTL for dynamic endpoints (search, trending) |
| `TTL.NORMAL` | `tmdb.js:42` | `5 * 60_000` (5m) | Cache TTL for discover & lists |
| `TTL.SLOW` | `tmdb.js:43` | `12 * 60 * 60_000` (12h) | Cache TTL for stable data (movie details, credits) |
| `rateLimiter.maxRequests` | `tmdb.js:35` | `40` | TMDB rate limit: 40 requests per 10-second window |
| `CACHE_TTL` | `recommendation-cache.js:10` | `5 * 60 * 1000` (5m) | In-memory recommendation cache TTL |
| `defaultTTL` | `lib/cache.js:10` | `5 * 60 * 1000` (5m) | RecommendationCache default TTL |

---

## Never Do

These are hard rules. Do not violate them under any circumstance:

1. **No `.env` edits.** Never read, write, or suggest changes to `.env` or `.env.*` files. Environment variables are managed outside this repo.
2. **No force pushes to `main`.** `git push --force` (or `--force-with-lease`) to `main` is forbidden. Open a PR.
3. **No deleting migrations.** Supabase migration files in any `migrations/` directory are permanent. Never delete or alter applied migrations — create new ones instead.
4. **No fake social proof.** Never add fabricated user counts, testimonials, star ratings, or "X people are using FeelFlick right now" copy. This destroys trust if discovered.
5. **No `rm -rf` on src/.** Never run destructive shell commands against the source tree without explicit user confirmation.
6. **No committing secrets.** If you accidentally detect a key/token in source, flag it immediately. Do not commit it.

---

## Useful Commands

```bash
# Development
npm run dev              # Start Vite dev server

# Quality gates (run before every PR in this order)
npm run lint             # ESLint across src/ (eslint.config.js, flat config)
npm run lint:fix         # Auto-fix safe issues
npm run test             # Run test suite (Vitest)
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run build            # Production build
```

---

## Environment Setup (VS Code Remote Tunnels / Codespaces)

### Confirmed Working (as of 2026-03-30)

| Tool | Version | Location |
|---|---|---|
| Node.js | v20.20.2 | via nvm (`~/.nvm`) |
| npm | v10.8.2 | via nvm |
| gh CLI | v2.71.0 | `~/.nvm/versions/node/v20.20.2/bin/gh` |
| Claude Code | v2.1.87 | `~/.nvm/versions/node/v20.20.2/bin/claude` |
| Homebrew | not installed | needs `sudo` — install manually if needed |

nvm is sourced in `~/.zshrc` — all tools are available in every new terminal session.

### First-Time Setup

```bash
# 1. Copy env template and fill in your keys
cp env.example .env   # then edit .env with real values

# 2. Install dependencies
npm install

# 3. Start dev server (port 5173, all interfaces — works with Remote Tunnels)
npm run dev
```

The Vite dev server binds to all interfaces (`host: true`) on port 5173 with `hmr.clientPort: 443`, which is already configured correctly for VS Code Remote Tunnels and GitHub Codespaces in `vite.config.js`.

### Known State (2026-03-30)

**ESLint:** 292 problems — 78 errors, 214 warnings. Top offenders:
- `react/no-unescaped-entities` — 47 errors (curly-quote characters in JSX strings)
- `react-hooks/rules-of-hooks` — 8 errors (hooks called conditionally or in non-component functions)
- `jsx-a11y/no-static-element-interactions` — 8 errors (divs with onClick missing keyboard handlers)
- `react/no-unknown-property` — 4 errors
- `no-undef` — 4 errors (`process` used without guard in a few files)
- 3 errors are auto-fixable with `npm run lint:fix`

**Tests:** 5/6 suites pass — 53 tests pass. 1 suite fails:
- `src/shared/services/__tests__/recommendations.helpers.test.js` — crashes on import because `VITE_SUPABASE_URL` env var is not set. Fix: add a real (or stub) `VITE_SUPABASE_URL` to `.env` before running tests.
- `Error: always broken` / `deliberate test error` output is expected — it's from the SectionErrorBoundary test exercising React error boundaries.

**npm audit:** 8 vulnerabilities (3 moderate, 5 high) in dependencies — not blocking dev.

---

## TODO: Fill In

- [ ] Document Supabase project ref / region (non-secret — safe to commit)
- [ ] Add links to Supabase dashboard and TMDB developer portal
- [ ] Add runbook links once `docs/runbooks/` is populated
- [ ] Work down the 78 ESLint errors (top offenders: `react/no-unescaped-entities` ×47, `react-hooks/rules-of-hooks` ×8, `no-undef` ×4)
- [ ] Fix `recommendations.helpers.test.js` import crash — mock Supabase client in test setup or provide stub env vars via vitest config
