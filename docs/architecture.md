# FeelFlick — Architecture

## System Overview

FeelFlick is a client-rendered single-page application backed by Supabase (PostgreSQL + pgvector). There is no dedicated application server: the React frontend communicates directly with Supabase via the JS client and calls the TMDB and OpenAI APIs through edge functions or client-side (where safe).

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (React SPA)                  │
│                                                         │
│  Landing → Onboarding → Homepage → Movie Detail         │
│                 ↕ Supabase JS Client                    │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────▼──────────────┐
         │    Supabase Platform        │
         │  PostgreSQL + pgvector      │
         │  Auth (Google OAuth)        │
         │  Storage (posters/assets)   │
         └──────┬──────────┬──────────┘
                │          │
        ┌───────▼───┐  ┌───▼────────┐
        │  TMDB API  │  │ OpenAI API │
        │  (metadata)│  │ (embeddings│
        └───────────┘  └────────────┘
```

---

## Key Architectural Decisions

### ADR-001: Supabase as Backend-as-a-Service

**Decision:** Use Supabase (PostgreSQL + pgvector) as the sole backend instead of a custom Node/Express server.

**Why:** Sole developer (Aditya). Supabase provides auth, realtime, storage, and a managed Postgres instance with pgvector extension. Zero infra ops overhead at this stage. Row-level security handles multi-tenancy.

**Trade-off:** Logic that would normally live in a dedicated API server (rate limiting, complex orchestration) must be placed in Supabase edge functions or handled client-side. Acceptable given the current scale.

---

### ADR-002: Hybrid Recommendation Engine

**Decision:** Combine content-based filtering, pgvector cosine similarity, and explicit/implicit behavioral signals rather than using a single algorithm.

**Why:** Pure collaborative filtering requires dense interaction data we don't have at launch. Content-based alone is too rigid. Vector similarity via embeddings bridges the gap and enables semantic mood-to-movie matching.

**Current engine version:** `2.4` (constant `ENGINE_VERSION` in `src/shared/services/recommendations.js`). Bump this when the scoring algorithm changes so impressions from old runs can be distinguished.

**Key tables:**
- `user_profiles_computed` — cached preference vectors with TTL
- `recommendation_impressions` — tracks what users have seen/skipped
- `mood_sessions` — session-level mood state for behavioral analysis

---

### ADR-003: Auth Before React Mounts

**Decision:** Parse the Google OAuth redirect hash and establish the Supabase session in `main.jsx`, before `ReactDOM.createRoot` renders.

**Why:** Prevents a flash of unauthenticated state and avoids a race condition where the router redirects before the session is available. The `RootEntry` component then handles routing: authenticated → `/home`, unauthenticated → Landing.

---

### ADR-004: No Dedicated Backend — Client Calls TMDB Directly

**Decision:** TMDB API calls are made from the client (via a thin wrapper in `shared/api/`).

**Why:** TMDB's read-only API key does not expose sensitive credentials. Avoids an extra network hop through a proxy server.

**Risk:** The TMDB API key is readable in the client bundle. This is acceptable for a public read-only key. If this changes (e.g., write access needed), move to an edge function immediately.

---

### ADR-005: Two-Layer In-Memory Cache (No Service Worker / HTTP Cache)

**Decision:** Cache API responses in two separate in-memory Maps scoped to the browser tab — one for TMDB responses (`src/shared/api/tmdb.js`) and one for computed recommendations (`src/shared/lib/cache.js` + `src/shared/services/recommendation-cache.js`).

**Why:** Both TMDB and Supabase recommendations are called on every render cycle in carousel components. Without memoisation, a single page load fires dozens of duplicate requests. An in-memory Map with TTLs is the simplest correct solution: no service worker, no IndexedDB, no cache-control headers needed.

**TTL tiers (TMDB):**
- `FAST` = 1 minute — search results, "now playing" (changes frequently)
- `NORMAL` = 5 minutes — discover lists, genre queries
- `SLOW` = 12 hours — movie details and credits (stable data)

**Recommendation cache TTL:** 5 minutes (matches `NORMAL` TMDB tier).

**In-flight deduplication:** Both caches track in-progress `Promise`s to prevent duplicate concurrent requests for the same key. If two components mount simultaneously and both call `getQuickPicksForUser`, only one network request fires.

**Trade-off:** Cache is tab-local and evicted on page reload. This is acceptable — freshness matters more than persistence for recommendations.

---

## Why We Chose Our Stack

| Choice | Reasoning |
|---|---|
| **React 18** | Component model fits the highly interactive mood/carousel UI. Large ecosystem. Team familiarity. |
| **Vite** | Fastest DX for a React SPA. Native ESM, instant HMR. |
| **Tailwind CSS** | Rapid UI iteration without CSS file sprawl. Co-located styles. |
| **Framer Motion** | Declarative, performant animations essential for Netflix-quality feel. |
| **Supabase** | Managed Postgres + pgvector + auth + storage. Zero infra ops for a solo founder. |
| **pgvector** | Enables semantic similarity search natively in Postgres. No separate vector DB needed. |
| **OpenAI embeddings** | High-quality text embeddings for movie → mood semantic matching. |
| **Vitest** | Native Vite integration. Fast, compatible with Jest API. |
| **React Router v7** | Familiar, battle-tested. Handles auth guards and nested routes cleanly. |

---

## Folder Structure Rationale

```
src/
├── app/          # Everything that "boots" the app — shell, routing, providers.
│                 # Things here are instantiated once.
│
├── features/     # Self-contained vertical slices (auth, landing, onboarding).
│                 # A feature owns its own components, hooks, and tests.
│                 # Features should not import from each other.
│
├── shared/       # Horizontal utilities used across features.
│                 # api/, hooks/, lib/, services/, ui/ — all stateless or
│                 # context-aware but not feature-specific.
│
├── components/   # Generic presentational components (carousel, etc.)
│                 # No business logic. Pure UI.
│
└── contexts/     # React context definitions (separate from providers/).
                  # providers/ in app/ wires them up at the root.
```

**Rule of thumb:** If it's used in only one feature, it lives inside that feature. If two features need it, move it to `shared/`. If it's pure UI with no domain knowledge, it belongs in `components/`.

---

## Performance Targets

- Homepage initial load: < 800ms (LCP)
- Recommendation fetch: < 500ms (p95)
- All images: lazy-loaded with blur-up placeholders
- Animations: 60fps, GPU-composited (transform/opacity only)

---

## Security Notes

- Supabase RLS policies enforce data isolation per user. All tables with user data must have RLS enabled.
- No sensitive data in client bundle. TMDB read key is acceptable. OpenAI key must stay server-side (edge function or Supabase secret).
- Google OAuth session tokens managed entirely by Supabase client — never stored in localStorage manually.
