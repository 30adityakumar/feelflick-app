# FeelFlick — Claude Code Guide

## Project
Mood-first movie/TV discovery. Users express how they feel → get curated recommendations.
**Quality bar:** Netflix / Apple TV+ polish. Every surface is production-facing.
**Stack:** React 18 · React Router v7 · Framer Motion · Tailwind CSS · Vite · Supabase (PostgreSQL + pgvector) · TMDB API · OpenAI (text-embedding-3-small) · Resend · Google OAuth · Vitest
**Language:** JavaScript (JSX). No TypeScript yet — avoid patterns that block future migration.

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

## Auth + Recommendation Engine
Auth initialises in `main.jsx` before React mounts: parses OAuth hash → sets Supabase session → `/auth/callback`. `RootEntry` routes authenticated → `/home`, unauthenticated → Landing. `RequireAuth` guards protected routes.

Recommendation pipeline: content-based filtering + pgvector cosine similarity + behavioral signals (skips, re-watches, ratings). Anti-recency bias, signal decay. Tracked via `recommendation_impressions` + `mood_sessions`. User profiles cached in `user_profiles_computed` with TTL.

## Environment Variables
```
VITE_SUPABASE_URL      # Supabase project URL (non-secret)
VITE_SUPABASE_ANON_KEY # Supabase anon key (RLS enforces access)
VITE_TMDB_API_KEY      # TMDB read-only key (rate-limited 40 req/10s)
VITE_ADMIN_EMAILS      # Comma-separated admin emails for AdminOnly guard
```
`import.meta.env.DEV` / `.PROD` and `process.env.NODE_ENV` are automatic.
**OpenAI key is server-side only. Never add `VITE_OPENAI_*`.**

## Code Standards
**Workflow (never skip):** `lint → test → build`
```bash
npm run dev          # Vite dev server (port 5173)
npm run lint         # ESLint (flat config, eslint.config.js)
npm run lint:fix     # Auto-fix safe issues
npm run test         # Vitest
npm run build        # Production build
```
- One component per file. PascalCase components, camelCase hooks prefixed `use`.
- No inline styles — Tailwind classes or `shared/styles` only.
- No hardcoded hex values — Tailwind tokens or CSS custom properties.
- Strict null safety — never assume nullable values are present without a guard.
- All interactive elements need `aria-label` / keyboard handlers. No a11y regressions.
- JSDoc types on public-facing functions.
- Tests in `__tests__/` adjacent to the feature, or `src/test/` for helpers.

## UI & Design System
Dark-first. Cinema palette. Surfaces: `bg-neutral-950` (deep) · `bg-neutral-900` (card).
Accent: `purple-500` / `purple-400` gradients into `pink-500`. Ratings: `yellow-400`.
Glass tint: `bg-purple-500/10 border-purple-400/25`. Ambient glow: `radial-gradient(ellipse, rgba(88,28,135,0.35), transparent)`.
Skeletons: `animate-pulse bg-purple-500/[0.04]`. **Never spinners.**
Fonts: `Playfair Display` (display, 24px+) · `Satoshi` (body) · `JetBrains Mono` (meta).
Transitions: 280ms cubic-bezier(0.4,0,0.2,1) standard · 450ms spring for dramatic.

### MovieCard Hover — THE LAW
Three files own card hover. Read all three before touching any:
- `Row/index.jsx` — owns `expandedId` state + 450ms intent timer. **Do not change the 450ms.**
- `Card/index.jsx` — owns height transition: `isExpanded ? height * 1.55 : height`. Scroll container `minHeight: itemHeight * 1.56`.
- `MovieCard.jsx` — owns content: poster (always visible) → gradient fade → info panel below.

**No portal. No floating overlay. One card, expands in place.**
Expanded card (top → bottom): poster · bottom gradient fade · similarity tag (bottom-left, `absolute bottom-2 left-2`) · title (`text-[1.05rem] font-bold`) · meta row · genre pills · description (`line-clamp-3` + bottom fade overlay) · action buttons + 1 streaming logo + "More →" CTA.

Description source priority: `movie.overview → movie.tagline → genre string`.
Streaming: `flatrate[0] → rent[0] → buy[0]` (region CA → US). One logo only. Fetch on hover only (`enabled: isHovered`). Cache 24h.
Sibling cards when one is expanded: `opacity-60 scale-[0.97] transition-all duration-200`.
Overflow fix: scroll container needs `overflow-x: auto; overflow-y: visible` — no ancestor `overflow:hidden`.

### Section Header Pattern (all rows must match)
```jsx
<div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-purple-400 to-pink-500" />
<h2 className="text-[1.05rem] sm:text-[1.15rem] font-bold text-white tracking-tight whitespace-nowrap">{title}</h2>
<div className="h-px flex-1 bg-gradient-to-r from-purple-400/20 via-white/5 to-transparent" />
```

## Never Do
1. **No `.env` edits.** Environment variables are managed outside this repo.
2. **No force pushes to `main`.** Open a PR.
3. **No deleting migrations.** Create new ones instead.
4. **No fake social proof.** No fabricated counts, testimonials, or activity copy.
5. **No `rm -rf` on `src/`.** Destructive commands require explicit confirmation.
6. **No committing secrets.** Flag immediately if a key/token is detected in source.
7. **No TypeScript.** This codebase is JSX. Never convert `.jsx` to `.tsx`.
8. **No new files when an existing file should be edited.** Check the folder map first.
9. **No spinners.** Always `animate-pulse` skeletons matching content shape.
10. **No two buttons doing the same thing** on one card.

> For tuneable constants, dev environment setup, and known codebase issues — see `CLAUDE-REFERENCE.md`.