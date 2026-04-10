# FeelFlick — Codex Agent Guide

> This file is for OpenAI Codex. For Claude Code instructions, see `CLAUDE.md`.

## Project
Mood-first movie/TV discovery app. Users express how they feel → get curated recommendations.
**Quality bar:** Netflix / Apple TV+ polish. Every surface is production-facing.
**Stack:** React 18 · React Router v7 · Framer Motion · Tailwind CSS · Vite · Supabase (PostgreSQL + pgvector) · TMDB API · OpenAI (text-embedding-3-small) · Resend · Google OAuth · Vitest
**Language:** JavaScript (JSX). No TypeScript — never convert `.jsx` to `.tsx`.

## Mandatory Workflow — Run Before Every PR
```bash
npm install          # ensure deps are in sync
npm run lint         # ESLint (flat config, eslint.config.js)
npm run lint:fix     # auto-fix safe issues first, then check remaining
npm run test         # Vitest — known crash: recommendations.helpers.test.js needs VITE_SUPABASE_URL mock
npm run build        # must pass with zero errors
```
**Never open a PR if `npm run build` fails.**

## Folder Map
```
src/
├── app/
│   ├── homepage/         # Authenticated homepage (carousels, moods)
│   │   └── components/   # HeroTopPick, BecauseYouWatchedSection, MoodCarouselRow, etc.
│   ├── header/           # Global nav
│   ├── pages/            # Route components
│   ├── providers/        # React context providers
│   ├── admin/            # Email-allowlist-gated admin tools
│   └── dev/              # Dev-only tooling (not shipped)
├── components/
│   └── carousel/
│       ├── Card/index.jsx             # Card WRAPPER — height, z-index, shadow
│       ├── CardContent/MovieCard.jsx  # Card CONTENT — poster, expanded info, actions
│       ├── Row/index.jsx              # CarouselRow — scroll, hover timing, virtualization
│       └── hooks/useVirtualization.js
├── features/
│   ├── auth/             # Google OAuth flow
│   ├── landing/          # Unauthenticated landing page
│   └── onboarding/       # New user onboarding
├── contexts/             # WatchlistContext, etc.
├── shared/
│   ├── api/tmdb.js       # tmdbImg(), TMDB fetch helpers
│   ├── hooks/            # useUserMovieStatus, etc.
│   ├── services/         # recommendations.js, interactions.js, embeddings
│   ├── lib/              # Pure utilities, supabase client
│   └── ui/               # Low-level UI primitives
└── test/                 # Vitest helpers, fixtures, setup
```

## Code Standards
- One component per file. PascalCase components, camelCase hooks prefixed `use`.
- No inline styles — Tailwind classes or `shared/styles` only.
- No hardcoded hex values — Tailwind tokens or CSS custom properties.
- Strict null safety — never assume nullable values are present without a guard.
- All interactive elements need `aria-label` / keyboard handlers.
- JSDoc types on public-facing functions.
- Tests in `__tests__/` adjacent to the feature, or `src/test/` for helpers.
- **No new files when an existing file should be edited.** Check the folder map first.

## Design System (Dark Cinema)
- Dark-first. Surfaces: `bg-neutral-950` (deep) · `bg-neutral-900` (card).
- Accent: `purple-500` / `purple-400` gradients into `pink-500`. Ratings: `yellow-400`.
- Fonts: `Playfair Display` (display, 24px+) · `Satoshi` (body) · `JetBrains Mono` (meta).
- Transitions: `280ms cubic-bezier(0.4,0,0.2,1)` standard · `450ms` spring for dramatic.
- Skeletons: `animate-pulse bg-purple-500/[0.04]`. **Never spinners.**

### Section Header Pattern — all rows must match exactly
```jsx
<div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-purple-400 to-pink-500" />
<h2 className="text-[1.05rem] sm:text-[1.15rem] font-bold text-white tracking-tight whitespace-nowrap">{title}</h2>
<div className="h-px flex-1 bg-gradient-to-r from-purple-400/20 via-white/5 to-transparent" />
```

### MovieCard Hover — THE LAW
Three files own card hover. Read all three before touching any:
- `Row/index.jsx` — owns `expandedId` state + 450ms intent timer. Do not change 450ms.
- `Card/index.jsx` — owns height transition: `isExpanded ? height * 1.55 : height`.
- `MovieCard.jsx` — owns content: poster → gradient fade → info panel.
**No portal. No floating overlay. One card, expands in place.**

## Tuneable Constants (Change Deliberately)
| Constant | File | Value |
|---|---|---|
| `ENGINE_VERSION` | `recommendations.js:36` | `'2.4'` |
| `THRESHOLDS.MIN_FF_RATING` | `recommendations.js:132` | `6.5` |
| `THRESHOLDS.MIN_FF_CONFIDENCE` | `recommendations.js:133` | `50` |
| `TTL.FAST` | `tmdb.js:41` | `60_000` |
| `TTL.NORMAL` | `tmdb.js:42` | `300_000` |
| `TTL.SLOW` | `tmdb.js:43` | `43_200_000` |
| `rateLimiter.maxRequests` | `tmdb.js:35` | `40` |

## Environment Variables
```
VITE_SUPABASE_URL      # Supabase project URL (non-secret)
VITE_SUPABASE_ANON_KEY # Supabase anon key (RLS enforces access)
VITE_TMDB_API_KEY      # TMDB read-only key (rate-limited 40 req/10s)
VITE_ADMIN_EMAILS      # Comma-separated admin emails
```
**OpenAI key is server-side only. Never add `VITE_OPENAI_*`.**
**Never edit `.env`. Never commit secrets.**

## Known Test Issues
- `recommendations.helpers.test.js` crashes on import — requires `VITE_SUPABASE_URL` mock. Fix: use `vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')` in beforeAll.
- `Error: always broken` in test output is expected (SectionErrorBoundary test).
- `npm audit` reports 8 vulnerabilities (3 moderate, 5 high) — not blocking dev but should be fixed.

## PR Rules
- **No force pushes to `main`.** Always open a PR.
- **No deleting migrations.** Create new ones in `supabase/migrations/`.
- **No fake social proof.** No fabricated counts, testimonials, or activity copy.
- **No `rm -rf` on `src/`.** Destructive commands require explicit confirmation.
- Branch naming: `fix/description`, `chore/description`, `feat/description`.
- PR title format: `fix: ...`, `chore: ...`, `feat: ...`.

## Never Do
1. No `.env` edits.
2. No TypeScript. JSX only.
3. No spinners — always `animate-pulse` skeletons.
4. No two buttons doing the same thing on one card.
5. No colored side borders on cards (`border-left: 3px solid`).
6. No hardcoded hex values.
7. No committing secrets — flag immediately if detected.
