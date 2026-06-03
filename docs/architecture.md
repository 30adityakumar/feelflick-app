# FeelFlick — Architecture

> Current as of the F1 docs-alignment pass (2026-06-03), verified against code,
> `package.json`, and `supabase/migrations/`. For ground-truth depth and the
> known-risks discussion, see the
> [F0 foundation audit](feelflick-foundation-readiness-audit.md). For the product
> intent this architecture serves, see [product-doctrine.md](product-doctrine.md).
>
> This doc is intentionally tight. When code and this doc disagree, code wins —
> fix the doc.

---

## System overview

FeelFlick is a **client-rendered React 19 SPA** (Vite 8) backed by Supabase
(PostgreSQL 15 + pgvector). There is **no dedicated application server**: the
browser talks directly to Supabase via the JS client, calls TMDB with a read-only
key, and reaches OpenAI **only** through Supabase Edge Functions. Hosted on Vercel.

```
┌─────────────────────────────────────────────────────────────┐
│            Browser — React 19 SPA (Vite 8)                   │
│   AppShell ─ TopNav ─ <Outlet/>                             │
│     ↳ Landing · Onboarding · feature surfaces               │
│     ↳ in-memory caches (TMDB 1m/5m/12h · recs 60s/5m)       │
│                       ↕ Supabase JS client                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
       ┌───────────────▼────────────────┐
       │        Supabase platform        │
       │  · PostgreSQL 15 + pgvector     │
       │  · Auth (Google OAuth)          │
       │  · Storage (avatars)            │
       │  · 4 Edge Functions (gpt-4.1-mini)
       │  · pg_cron (nightly stats)      │
       └────────┬───────────────┬────────┘
                │               │
        ┌───────▼────┐   ┌──────▼───────────────┐
        │  TMDB API  │   │ OpenAI API           │
        │ (metadata, │   │ text-embedding-3-large│
        │  posters)  │   │ + gpt-4.1-mini (edge)│
        └────────────┘   └──────────────────────┘
                          ▲
                          │ catalog enrichment + embeddings
                          │ run offline via scripts/pipeline/
```

Vercel edge `middleware.js` does **bot-only** OG-meta injection for `/movie/:id`
and `/lists/:id` link unfurls; `vercel.json` is a plain SPA rewrite.

---

## Stack (from `package.json`)

React 19 · React Router 7 · TanStack Query 5 · Framer Motion 12 · Tailwind CSS 4 ·
lucide-react · Vite 8 · Vitest · Playwright (+ `@axe-core/playwright`) · ESLint 9 ·
`@supabase/supabase-js` 2 · `@sentry/react` 10 · `posthog-js` · `web-vitals` 5 ·
`openai` 6 (used by pipeline scripts/edge, never client). **JavaScript (JSX) only —
no TypeScript.**

---

## Frontend layout (`src/`)

```
src/
├── main.jsx · App.jsx · index.css   # entry → pre-React OAuth handler → providers → router
├── app/                  # app shell + routing ONLY (cross-cutting wiring)
│   ├── AppShell.jsx · router.jsx · ErrorBoundary.jsx · NotFound.jsx
│   ├── header/           # global Header, BottomNav, SearchBar
│   ├── providers/        # React context providers (e.g. WatchlistContext)
│   └── admin/            # email-allowlist-gated admin tools
├── features/             # one folder per surface — lowercase noun, NO version suffix
│   ├── landing/ onboarding/ auth/ home/ movie/ discover/ browse/
│   ├── profile/ people/ preferences/ watchlist/ history/ lists/ account/ legal/
│   └── feed/ challenges/ # parked — built but unrouted
├── components/           # app-wide canonical UI (carousel hover LAW, layout, toasts)
├── shared/               # the kernel
│   ├── api/tmdb.js · hooks/ · services/ · lib/ · components/ · ui/
├── styles/ assets/ test/
```

Two decomposition patterns, both canonical:
- **Editorial surfaces** (`landing/`) → `sections/` subfolder + `data.js` +
  `primitives.jsx` + a slim composing entry.
- **Data-driven surfaces** (`home`, `movie`, `account`, `profile`) →
  `sections-top.jsx` / `sections-bottom.jsx` + `useXxxData.jsx` provider + `data.js`.

> There is **no** `legacy/` tree, no `*-v2`/`*-v5` suffixes, no `*-legacy` routes,
> and no `contexts/` or `src/app/pages/` folder. Those were removed in the
> repo-structure refactor; the `features/` surfaces are canonical. (Earlier
> versions of this doc described that removed structure — disregard any such
> reference you find elsewhere.)

### Shared UI / component tiers
- `shared/ui/` — low-level primitives: `Button`, `Modal`, `Input`, `Textarea`,
  `Select`, `Checkbox`, `EmptyState`, `Eyebrow`, `SectionHeader`, `Tooltip`,
  `BrandSplash`.
- `shared/components/` — domain widgets: `StarRating`, `FollowButton`, `MatchBadge`,
  `MoodPill`, `ActionButton`, `Pagination`, `RecommendationFeedback`, …
- `components/` — app-wide canonical UI: `carousel/` (the MovieCard hover law),
  `layout/` (`TopNav`, `Footer`), `ToastNotification`.

Design tokens are centralized in [src/shared/lib/tokens.js](../src/shared/lib/tokens.js)
(`HP` feature palette, `HP_GRAD` brand gradient, `C` landing palette).

---

## Routing

All routes are in [src/app/router.jsx](../src/app/router.jsx), Sentry-wrapped, with
every page `lazy()`-loaded behind a `RouteSkeleton` Suspense fallback. Three shells:

- **PublicShell** (no app chrome): `/`, `/auth/callback`, `/about`, `/privacy`,
  `/terms`, legacy auth aliases → `/`, `/logout`.
- **OnboardingShell** (auth-required, no app chrome): `/onboarding`.
- **AppShell** (header + bottom nav):
  - public-viewable: `/movie/:id`, `/browse`, `/discover`, `/mood/:tag`,
    `/tone/:tag`, `/browse/fit/:profile`, `/collection/:id`, `/lists/curated/:slug`,
    `/lists/personal/:type`, `/lists/:listId`;
  - admin (auth + email allowlist): `/admin/cache-monitoring`;
  - auth + onboarding-gated (`RequireAuth` → `PostAuthGate`): `/home`, `/account`,
    `/preferences`, `/watchlist`, `/history` (+ `/watched`), `/profile`
    (+ `/profile/:userId`), `/people`, `/lists`.

`/movies`, `/trending` → `/browse`; `/feed`, `/challenges` → `/home`; `/app`,
`/app/*` → de-prefixed alias; `*` → live 404.

**Navigation hierarchy (IA v2 / F2).** The nav encodes the doctrine's surface
hierarchy rather than treating routes as co-equal: the desktop header pills are
**Tonight** (`/home`, the Briefing) · **Discover** · **DNA** (`/profile`), with
Utility surfaces (Browse, Watchlist, History, Lists) + parked People in the
account menu; the authed mobile bottom nav makes **Tonight** the centered hero
(prime action) with Browse · Discover · DNA · Account around it. `/home` is
labeled "Tonight" in nav only — the route is unchanged. Source of truth:
[ia-v2-decision-record.md](ia-v2-decision-record.md).

---

## Authentication

```
1. User hits / → RootEntry checks useAuthSession.isAuthenticated
2.   authed → Navigate /home   ·   anon → render Landing
3. Landing CTA → Supabase Google OAuth (browser redirect)
4. Google → /auth/callback#access_token=…
5. main.jsx parses the hash BEFORE React mounts:
     - validates a same-origin OAuth nonce
     - supabase.auth.setSession({ access_token, refresh_token })
     - strips the hash via history.replaceState (no full reload)
6. App mounts → OAuthCallback resolves session → routes onward
7. RequireAuth guards protected routes
8. PostAuthGate inspects onboarding_complete → /onboarding if not done
```

`useAuthSession` ([src/shared/hooks/useAuthSession.js](../src/shared/hooks/useAuthSession.js))
is a `useSyncExternalStore` singleton over `getSession()` + `onAuthStateChange`,
with a **5s safety timeout** that resolves as unauthenticated if Supabase is
unreachable (so the landing renders instead of spinning). `AdminOnly` adds an
email-allowlist gate. The pre-React hash handling in `main.jsx` is the key trick
that prevents flash-of-unauthenticated and router-vs-auth races.

---

## Recommendation system

The engine lives in [src/shared/services/recommendations.js](../src/shared/services/recommendations.js)
(~6,700 LOC, `ENGINE_VERSION = '2.17'`) plus satellites (`scoringV3`, `briefScoring`,
`heroReason`, `embeddingScoring`, `fitAdjacency`, `diversity`, `exclusions`,
`skipSignals`, `qualityTiers`, `personalRating`, `dnaConfidence`, `homepageRows`).

Flow: build a user profile (`computeUserProfile` / `computeUserProfileV3`) from
`user_history` / `user_ratings` / `user_preferences` / `user_interactions` /
feedback → cache it → score candidate films against it. The **Briefing** picks a
single film via weighted-random over top candidates (#1 wins ~65%), shipped with a
generated reason (`heroReason.js`). Signals: taste (affinity + pgvector cosine
over `text-embedding-3-large` 3072-dim embeddings, via `movie_similarity`), mood
(per-session signature over mood/tone tags + 10 fit profiles), quality gating
(blended `ff_final_rating` + vote-count floors + quality tiers), behavioral (layered
skip system, ratings, thumbs feedback), and anti-bias (anti-recency, decay,
diversity, language anti-bubble).

**Caches:** in-memory profile/seed (60s) + `recommendationCache` (5m,
[shared/lib/cache.js](../src/shared/lib/cache.js)); persistent
`user_profiles_computed` (profile + fingerprint + personal_ratings, 24h) and
`taste_fingerprint` ([tasteCache.js](../src/shared/services/tasteCache.js), 24h). A
bump to `ENGINE_VERSION` invalidates cached profiles. Tuneable constants:
[CLAUDE-REFERENCE.md](../CLAUDE-REFERENCE.md). **Engine work is gated** by the
`recommendation-engine` skill (DB-first analysis before any tuning).

Tracked via `recommendation_impressions` (row/homepage-scoped, drives skip-signal
feedback) + `recommendation_events` (mood-session-scoped) + `mood_sessions`.

Catalog enrichment (mood/tone/fit tags via `gpt-5.4-mini` batch) and embeddings
(`text-embedding-3-large`) are produced **offline** by `scripts/pipeline/`, not at
request time.

---

## Database & migrations

PostgreSQL 15 + pgvector on Supabase. Schema evolves through **append-only**
migrations in [supabase/migrations/](../supabase/migrations/) (47 as of this pass).
The live DB is the source of truth; [SUPABASE_SCHEMA.md](SUPABASE_SCHEMA.md) is a
**stale** introspection snapshot (pre-2026-05-29) — regenerate when you need
current detail.

Notable table groups: catalog (`movies`, `genres`, `people`, `keywords`,
`ratings_external`, `movie_similarity`, `movie_mood_scores`), user
(`users`/`user_preferences`/`user_settings`/`user_profiles_computed`), behavioral
(`user_history`, `user_ratings`, `user_watchlist`, `user_movie_feedback`,
`user_interactions`), recommendation pipeline (`mood_sessions`,
`recommendation_impressions`, `recommendation_events`), social (`user_follows`,
`user_similarity`), lists, and `movies_editorial_overlay`.

**Security:** Row-Level Security + write lockdown were applied across catalog/engine
tables on 2026-05-29 (migrations `20260529000000`–`000500`), along with pinned
function `search_path`, IDOR-prone definer-function lockdown, and a perf/RLS-initplan
index pass. (RLS is **resolved** — earlier docs that frame "RLS disabled on 18
tables" as an open critical issue are outdated.)

---

## External touchpoints

| Service | Use | Where |
|---|---|---|
| Supabase | DB reads/writes, Auth, Storage, 4 Edge Functions, pg_cron | `shared/lib/supabase/`, `supabase/` |
| TMDB | Read-only client key, 40 req/10s limiter, tiered cache (1m/5m/12h) | `shared/api/tmdb.js` |
| OpenAI | Embeddings (pipeline) + 4 Edge Functions (`gpt-4.1-mini`) — **server-side only** | `supabase/functions/`, `scripts/` |
| Sentry | Errors + tracing (0.2) + replay (text masked); prod-only | `main.jsx`, `ErrorBoundary.jsx` |
| PostHog | Product analytics; key-gated | `shared/services/analytics.js` |
| web-vitals | LCP/CLS/INP reporting | `shared/lib/vitals.js` |

Edge Functions: `ai-mood-context`, `generate-movie-overlay`,
`generate-reflection-prompt`, `generate-taste-summary`.

---

## Testing & validation

- **Unit/component:** Vitest, tests in `__tests__/` adjacent to code or `src/test/`
  (417 tests / 33 files green as of this pass). Run: `npm run lint && npm run test && npm run build`.
- **E2E / visual / a11y:** Playwright in `e2e/` (`public/`, `app/`, `visual/`) +
  `@axe-core/playwright`; per-platform visual baselines. CI:
  `.github/workflows/visual-regression.yml`. E2E auth uses a client-side sign-in
  against the dev test user (`E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD`).
- **Lint hook:** `.claude/hooks/lint-on-edit.sh` runs advisory ESLint after edits.

---

## Known architecture risks (from F0)

See the [F0 audit](feelflick-foundation-readiness-audit.md) §2.10 + §4.10 for full
detail. Headline items:

- **Engine monolith** — `recommendations.js` is ~6,700 LOC in one file; high
  blast-radius for tuning (F8 may modularize). No offline evaluation harness yet.
- **Case-making layer is thin** — the rich `movies_editorial_overlay` is seeded for
  a single film (Parasite); most picks fall back to short generated reasons. The
  moat is the least-built part (F6).
- **Surface sprawl vs. the single pick** — the IA doesn't yet visibly subordinate
  browse/lists/discover to the Briefing (F2).
- **Minor design drift** — amber/orange ambient gradients + a couple of inline `HP`
  redeclarations persist against the "purple + pink only" rule (F3).

> What's deliberately NOT in the architecture (yet): no backend API server, no
> service worker/PWA, no poster CDN (TMDB direct), no job queue (cron pipeline
> instead), no analytics warehouse, no feature-flag service, no realtime subscriptions.
</content>
