# FeelFlick — Architecture

Last updated to reflect the v2 migration (May 2026). For the user-facing flow this architecture serves, see [user-journey.md](./user-journey.md).

---

## System Overview

FeelFlick is a client-rendered React 18 SPA backed by Supabase (PostgreSQL + pgvector). There is no dedicated application server — the React frontend talks directly to Supabase via the JS client, calls TMDB from the client (read-only key), and calls OpenAI through Supabase Edge Functions.

```
┌──────────────────────────────────────────────────────────────┐
│                 Browser (React 18 SPA, Vite)                  │
│                                                              │
│   AppShell ─ TopNav (Header.jsx v2) ─ <Outlet/>              │
│      ↳ Landing · Onboarding · 10 v2 surfaces                 │
│      ↳ in-memory caches (TMDB 1m/5m/12h, recs 5m)            │
│                       ↕                                      │
│             Supabase JS Client                               │
└──────────────────────┬───────────────────────────────────────┘
                       │
       ┌───────────────▼────────────────┐
       │     Supabase Platform          │
       │  · Postgres 15 + pgvector      │
       │  · Auth (Google OAuth)         │
       │  · Storage (avatars)           │
       │  · Edge Functions (3 OpenAI)   │
       │  · 38 public tables            │
       └────────┬──────────────┬────────┘
                │              │
        ┌───────▼───┐   ┌──────▼──────────┐
        │ TMDB API  │   │ OpenAI API      │
        │ (metadata │   │ (text-embedding-│
        │ trailers, │   │  3-small + GPT- │
        │ posters)  │   │  4o-mini)       │
        └───────────┘   └─────────────────┘
```

---

## Frontend layout

```
src/
├── App.jsx                # Top-level providers (Sentry, Watchlist context, Router)
├── main.jsx               # Pre-React OAuth-hash handler + ReactDOM.createRoot
├── app/                   # Shell + routes (instantiated once)
│   ├── AppShell.jsx       # Header + Outlet + mobile bottom nav
│   ├── router.jsx         # All routes — canonical v2 + /x-legacy
│   ├── header/Header.jsx  # v2 redesign — morphing pill nav, command palette, conic avatar
│   ├── homepage/          # v1 HomePage (legacy, mounted at /home-legacy)
│   └── pages/             # v1 surfaces (preserved at /x-legacy)
├── features/              # Vertical slices — each owns components + hooks + tests
│   ├── auth/              # OAuthCallback + PostAuthGate (onboarding check)
│   ├── landing/           # Public marketing pages
│   ├── onboarding/        # 4-step intro flow
│   ├── home-v2/           # "Tonight's edit" briefing  → /home
│   ├── discover-v5/       # 5-stage magazine flow      → /discover
│   ├── movie-v2/          # Editorial film page        → /movie/:id
│   ├── watchlist-v2/      # "The queue"                → /watchlist
│   ├── history-v2/        # "The diary"                → /history
│   ├── account-v2/        # "The settings drawer"      → /account
│   ├── preferences-v2/    # "The dials"                → /preferences
│   ├── lists-v2/          # "The shelves"              → /lists
│   ├── people-v2/         # "Taste twins"              → /people
│   └── profile-v2/        # Cinematic DNA              → /profile
├── shared/                # Cross-feature utilities
│   ├── api/tmdb.js        # TMDB wrapper + in-memory cache
│   ├── hooks/             # 9 hooks incl. useAuthSession, useRecommendations, useMoodBrief
│   ├── lib/cache.js       # Generic in-memory TTL cache + in-flight dedupe
│   ├── services/          # 26 service modules (see below)
│   └── ui/                # Low-level primitives (Button, Skeleton, etc.)
├── components/            # Generic presentational (carousel, etc.)
├── contexts/              # WatchlistContext
├── styles/                # tokens.css + globals.css
└── test/                  # Vitest helpers + fixtures
```

Each v2 surface follows the same pattern: `XxxV2.jsx` page entry + `useXxxData.jsx` Context Provider for live data + `data.js` for static tokens + (optional) `sections-top.jsx` / `sections-bottom.jsx` for layout chunks.

---

## Routing

All routes mounted in [src/app/router.jsx](../src/app/router.jsx). After the v2 migration:

| Surface | Canonical | Legacy escape hatch |
|---|---|---|
| Home | `/home` → home-v2 | `/home-legacy` → v1 HomePage |
| Movie | `/movie/:id` → movie-v2 | `/movie-legacy/:id` → v1 MovieDetail |
| Discover | `/discover` → discover-v5 | `/discover-legacy` → v1 DiscoverPage (Mood Brief flow) |
| Watchlist | `/watchlist` → watchlist-v2 | `/watchlist-legacy` |
| History | `/history`, `/watched` → history-v2 | `/history-legacy` |
| Account | `/account` → account-v2 | `/account-legacy` |
| Preferences | `/preferences` → preferences-v2 | `/preferences-legacy` |
| Lists | `/lists`, `/lists/:id`, `/lists/curated/:slug` → lists-v2 | `/lists-legacy*` |
| People | `/people` → people-v2 | `/people-legacy` |
| Profile | `/profile`, `/profile/:userId` → profile-v2 | `/profile-legacy*` |

The legacy paths are still mounted; the v1 source still compiles and ships. Bundle includes both for now — drop the legacy routes + delete the v1 source folders to recover ~6000 LOC when ready.

---

## Authentication

```
1. User hits /
2. RootEntry checks useAuthSession.isAuthenticated
3a. Authenticated → Navigate to /home
3b. Not authenticated → render Landing
4. Landing CTA → Supabase Google OAuth (browser redirect)
5. Google → /auth/callback#access_token=…
6. main.jsx parses hash BEFORE React mounts:
     - supabase.auth.setSession({ access_token, refresh_token })
     - clears the hash from history
7. ReactDOM.createRoot() mounts the app
8. Router resolves /auth/callback → OAuthCallback → navigate /
9. /home loads through RequireAuth
10. RequireAuth → PostAuthGate inspects user_metadata.onboarding_complete:
     - True → render Outlet (the page)
     - False → Navigate to /onboarding
```

The pre-React hash handling in `main.jsx` is the key trick — prevents flash-of-unauthenticated state and avoids router-vs-auth races.

---

## Recommendation engine

Every surface in the app — v1 legacy AND v2 canonical — now scores through the same engine. The hand-rolled local scorers are retired.

### The engine ([shared/services/recommendations.js](../src/shared/services/recommendations.js), 6,337 LOC)

Key exports:
- `computeUserProfile(userId)` — builds the user vector from `user_history`, `user_ratings`, `user_preferences`, `user_interactions`. Cached 24 h in `user_profiles_computed`.
- `scoreMovieForUser(movie, profile, rowType)` — returns `{ score, breakdown, pickReason }`. Score is a 0–~150 raw composite across 19 dimensions; `pickReason` is `{label, type}` (the user-facing "Because you love …" line); `breakdown` is the per-dimension contributions for debugging.
- `getMoodRecommendations`, `getTopPickForUser`, `getCommunityHighSkipSet`, plus row-type helpers (`getHistoryBasedRecommendations`, `getHiddenGemsForUser`, etc.)
- `ENGINE_VERSION = '2.4'` — bump when scoring changes so old impressions can be distinguished

Scoring dimensions: base quality (cap'd at 72 for hero rows so taste signals can differentiate), discovery potential, polarization penalty, accessibility, genre fit, mood fit, runtime band, fit_profile match, recency penalty, skip-signal suppression, mood-tag coherence, language preference, decade preference, director affinity, lead-actor affinity, seed-similarity (pgvector), engagement, era match.

### How v2 surfaces call it

Every v2 surface that ranks films uses the same **hybrid pattern**:

1. Query a candidate pool from `movies` (filtered by `mood_tags && bridge_tags` or `user_watchlist.movie_id` etc.). Widen the SELECT to include every field `scoreMovieForUser` reads (the `ff_*`, `discovery_potential`, `polarization_score`, `llm_*`, `original_language`, `fit_profile`, `tone_tags`, etc.).
2. Call `computeUserProfile(userId)` once per page-load.
3. Run `scoreMovieForUser(movieRow, profile)` over the pool.
4. Display: clamp to a 0-96 percent range for UI consistency.

Cold-start safety: every surface falls back to mood-tag overlap + `ff_audience_rating` when `profile` is null (new user, no history).

| Surface | Engine entry point | Notes |
|---|---|---|
| home-v2 | `scoreMovieForUser` per mood pool, top 5 per axis | `pickReason.label` replaces the static per-mood rationale ("Because you love {director}", "Hidden gem", etc.) |
| watchlist-v2 | `scoreMovieForUser` per saved film | Display clamp 50–96 (watchlist items cluster at the top by definition) |
| movie-v2 | `scoreMovieForUser` on the current film | Replaces the hardcoded `ffMatch: 88`. Parasite for this test user dropped to 68 — taste signals now meaningfully differentiate |
| discover-v5 | `scoreMovieForUser` as base, UI modifiers on top | Engine handles user fit; intention/energy/who/time tilt the result. Shawshank Redemption surfaces for Tense+Slow where local scorer chose Léon |

### Caches

### Caches

| Cache | Where | TTL | Purpose |
|---|---|---|---|
| TMDB responses | [shared/api/tmdb.js](../src/shared/api/tmdb.js) | 1 m / 5 m / 12 h tiers | Dedupe TMDB hits across carousel mounts |
| Recommendation results | [shared/services/recommendation-cache.js](../src/shared/services/recommendation-cache.js) | 5 m | Dedupe per-row score computation |
| User taste fingerprint | `user_profiles_computed` table | 24 h | Avoid recomputing on every page |
| Personal rating | `user_profiles_computed.personal_ratings` JSONB | 24 h | Per-(user, movie) predicted score |

In-flight dedupe is built into both in-memory caches — two concurrent calls for the same key issue only one network request.

---

## Database schema (38 public tables)

### Core catalog
- `movies` (10,289 rows) — TMDB master catalog with FF-augmented mood_tags, tone_tags, fit_profile, llm_pacing/intensity/emotional_depth/dialogue_density/attention_demand, ff_audience_rating, ff_critic_rating
- `genres` (19), `movie_genres` (22,618 junction)
- `keywords` (1,765), `movie_keywords` (105,331 junction)
- `people` (357,935 cast/crew), `movie_people` (383,258 junction), `movie_cast_metadata` (5,898)
- `ratings_external` (8,892) — IMDb/RT/Metacritic
- `movie_similarity` (842,400) — top-100 pgvector cosine neighbors per film
- `movie_mood_scores` (96,585) — pre-computed (movie, mood) compatibility 0–100

### User identity + preferences
- `users` (7) — auth profile, onboarding flag, total_movies_watched
- `user_preferences` (51) — genres drawn-to/avoid, `(user_id, genre_id, excluded)`
- `user_settings` (1) — JSONB blob: notifications, prefs (mood weights, runtime, daypart, subscriptions, boundaries, language, subtitles), privacy
- `user_profiles_computed` (6) — cached profile + taste_fingerprint + personal_ratings, 24 h TTL

### Behavioral
- `user_history` (79) — watched films, RLS public-read to authenticated (relaxed in `20260518` migration)
- `user_ratings` (65) — 1–10 ratings with review_text + mood_session_id link
- `user_watchlist` (8) — saved-for-later
- `user_movie_feedback` (8) — like/dislike/seen/skip
- `user_interactions` (382) — granular interaction stream
- `user_events` (0) — lightweight browsing events (not yet used)
- `user_sessions` (479) — engagement sessions

### Recommendation pipeline
- `mood_sessions` (108) — the central hub: every recommendation flow links here, captures intent (mood + context + experience + energy/intensity)
- `mood_session_abandoned` (153) — sessions that didn't convert
- `recommendation_events` (1,657) — mood-session-scoped impressions
- `recommendation_impressions` (2,108) — homepage-row-scoped impressions (drives skip-signal feedback)
- `discover_moods` (12), `discover_mood_genre_weights` (34) — lookup tables for the Mood Brief flow
- `moods`, `viewing_contexts`, `experience_types` — empty lookup tables (referenced by mood_sessions FKs but unpopulated)

### Social
- `user_follows` (2) — follow graph
- `user_similarity` (6) — pre-computed (user_a, user_b) similarity, `CHECK (user_a_id < user_b_id)` so each pair stored once

### Lists
- `lists` (1) — `(id, user_id, title, description, is_public, created_at, updated_at)`
- `list_movies` (4) — `(list_id, movie_id, added_at, note, position)`

### Editorial
- `movies_editorial_overlay` (1) — JSONB columns: `why_for_you`, `mood_fingerprint`, `ff_take`, `critic_quotes`, `film_palette`, `daypart_fit`, `hero_signature`. Only Parasite seeded.

### Pipeline state
- `update_runs` (0) — batch run history
- `discovery_cursors` (47) — pagination cursors for discovery feed

---

## ⚠️ Critical security issue — RLS disabled on 18 tables

The Supabase advisor reports:

> Row Level Security is disabled on 18 tables. These tables are fully exposed to the anon and authenticated roles. Anyone with the anon key can read or modify every row.

**Affected:**
`genres`, `movies`, `movie_genres`, `people`, `keywords`, `movie_keywords`, `ratings_external`, `movie_people`, `moods`, `viewing_contexts`, `experience_types`, `user_similarity`, `movie_mood_scores`, `movie_cast_metadata`, `update_runs`, `discovery_cursors`, `discover_moods`, `movie_similarity`

Most of these are *catalog* tables (movies, people, genres, keywords) where public read is intentional — but `user_similarity` is sensitive (it reveals who's similar to whom) and currently has no read policy at all, meaning anyone with the anon key can dump the entire pairwise similarity matrix.

**Remediation SQL** (do not auto-apply — enabling RLS without a policy locks everything):

```sql
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings_external ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewing_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_similarity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_mood_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_cast_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.update_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_cursors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discover_moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_similarity ENABLE ROW LEVEL SECURITY;
```

After enabling RLS, each table needs a SELECT policy. Suggested policies:

- **Catalog tables** (`movies`, `genres`, `people`, etc.) — `CREATE POLICY "authenticated can read" FOR SELECT USING (auth.uid() IS NOT NULL);`
- **`user_similarity`** — `auth.uid() = user_a_id OR auth.uid() = user_b_id` so users only see rows that involve them
- **Empty lookup tables** (`moods`, `viewing_contexts`, `experience_types`) — same authenticated-read pattern

This should be the first PR after "make everything functional" begins.

---

## Edge Functions (3 OpenAI-backed)

Located in [supabase/functions/](../supabase/functions/). All three use the same auth/CORS shape and call OpenAI `gpt-4o-mini`.

| Function | Purpose | Called from |
|---|---|---|
| `ai-mood-context` | Generate mood-aware context strings for a film | `useAIMoodContext` hook |
| `generate-reflection-prompt` | Generate the prompt for the "What did this film leave with you?" reflection box | Reflection feature (post-watch) |
| `generate-taste-summary` | Generate a 1-sentence taste-summary for the user's DNA | Profile + Account surfaces |

OpenAI API key is set as a Supabase secret (`OPENAI_API_KEY`). Never exposed client-side.

---

## Critical files (memorize these)

| File | Purpose |
|---|---|
| [src/main.jsx](../src/main.jsx) | Pre-React OAuth hash handler. The 30-line block that fixes flash-of-unauthenticated. |
| [src/app/router.jsx](../src/app/router.jsx) | Single source of truth for all routes. Canonical v2 + legacy. |
| [src/app/AppShell.jsx](../src/app/AppShell.jsx) | Header + Outlet + mobile bottom nav. Renders for every authenticated route. |
| [src/app/header/Header.jsx](../src/app/header/Header.jsx) | v2 redesign — morphing-pill nav, command-palette search, conic-ring avatar. |
| [src/shared/services/recommendations.js](../src/shared/services/recommendations.js) | The real recommendation engine. 6,337 LOC. |
| [src/shared/services/tasteCache.js](../src/shared/services/tasteCache.js) | 24 h cache for `taste_fingerprint`. |
| [src/shared/services/personalRating.js](../src/shared/services/personalRating.js) | `ff_personal_rating` (predicted 0–100 score). |
| [src/shared/hooks/useAuthSession.js](../src/shared/hooks/useAuthSession.js) | Auth state hook. |
| [src/features/auth/PostAuthGate.jsx](../src/features/auth/PostAuthGate.jsx) | Onboarding-complete gate. |
| [src/shared/api/tmdb.js](../src/shared/api/tmdb.js) | TMDB wrapper + tiered cache. |
| [src/app/pages/browse/curatedListsConfig.js](../src/app/pages/browse/curatedListsConfig.js) | The 10 editorial lists (query-driven, not table-stored). |
| [supabase/migrations/](../supabase/migrations/) | 21 schema migrations, append-only. |

---

## Performance targets

- Homepage initial load: < 800 ms LCP
- Recommendation fetch: < 500 ms p95 (real engine path)
- Images: lazy-loaded with blur-up placeholders (TMDB w185 → w500 progressive)
- Animations: 60 fps, GPU-composited (transform/opacity only)
- v2 surfaces use Outfit + Inter loaded per-CSS-file via Google Fonts — first font load is the main LCP bottleneck on cold visit

---

## Why this stack

| Choice | Reason |
|---|---|
| React 18 + Vite | Interactive UI, fast HMR, single-file feature slices |
| Tailwind + inline styles (v2) | Tailwind for landing; v2 uses inline styles because the editorial scale (78px display type, -0.05em tracking) is finer than Tailwind's defaults |
| Framer Motion | Page transitions, scroll reveals, modal physics |
| Supabase | Managed Postgres + pgvector + Auth + Edge Functions + Storage — zero infra ops for a solo founder |
| pgvector | Semantic similarity inside Postgres. No separate vector DB. |
| OpenAI embeddings (text-embedding-3-small, 3072-dim) | Backs `movie_similarity` neighbor table + future personalization |
| Vitest | Vite-native, Jest-compatible API |
| React Router v7 | Battle-tested; auth-gated nested routes + outlets |

---

## What's NOT in the architecture yet (deliberate gaps)

- **No backend API server.** All logic is client-side, edge-function, or in Postgres functions.
- **No service worker / PWA.** Cache is in-memory only.
- **No CDN for posters.** Posters come from `image.tmdb.org` directly.
- **No queue / job system.** Embedding generation, similarity recompute, etc. are run as cron-scheduled pipeline steps (see `update_runs`).
- **No analytics warehouse.** Only PostHog client-side events + Supabase tables.
- **No feature-flag service.** Routes are hardcoded; v2 → canonical happened via the router swap, not flags.
- **No real-time / websocket subscriptions** in the app yet, even though Supabase supports them.

---

## When making changes

1. **Schema changes** — write a new migration in `supabase/migrations/`. Never edit existing ones.
2. **New v2 surface** — copy the home-v2 / profile-v2 pattern: `XxxV2.jsx` entry + `useXxxData.jsx` Provider + static tokens in `data.js`.
3. **New route** — add to [router.jsx](../src/app/router.jsx) inside the correct guard (`RequireAuth` for authed, `PublicShell` for public).
4. **Recommendation logic** — extend `recommendations.js` and bump `ENGINE_VERSION`. Wire from v2 hooks via `useRecommendations` / `getTopPickForUser`.
5. **New edge function** — copy the shape of `ai-mood-context`. Don't put OpenAI keys client-side.
6. **Brand surface** — landing rules in CLAUDE.md "Brand Surface (Landing)"; v2 rules in "App v2 Surface — Editorial Magazine". Pick the right one based on the route.
