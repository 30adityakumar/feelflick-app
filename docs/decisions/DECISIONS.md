# FeelFlick — Architectural Decision Log

> A living index of every significant "why did we build it this way" decision.
> Detailed ADRs live in `docs/decisions/`. Decisions without their own file are documented inline below.
> When you make a non-obvious architectural call, add it here before you forget why.

---

## Index

| # | Decision | Status | Detail |
|---|---|---|---|
| 001 | JavaScript (JSX) only — no TypeScript | ✅ Accepted | `docs/decisions/001-no-typescript.md` |
| 002 | MovieCard hover: expand in place, no portal | ✅ Accepted | `docs/decisions/002-card-hover-expand-in-place.md` |
| 003 | Recommendation engine: pgvector on Supabase, not a third-party API | ✅ Accepted | `docs/decisions/003-pgvector-supabase-recommendations.md` |
| 004 | Loading states: skeletons only, never spinners | ✅ Accepted | `docs/decisions/004-skeletons-not-spinners.md` |
| 005 | Supabase as sole backend — no custom Node/Express server | ✅ Accepted | Inline below |
| 006 | Auth initialised before React mounts | ✅ Accepted | Inline below |
| 007 | TMDB API called client-side, not proxied | ✅ Accepted | Inline below |
| 008 | Two-layer in-memory cache — no service worker or IndexedDB | ✅ Accepted | Inline below |
| 009 | gpt-4.1-mini for edge functions, not gpt-4o | ✅ Accepted | Inline below |
| 010 | Dual deployment: Cloudflare Pages + Vercel | ✅ Accepted | Inline below |
| 011 | OpenAI `text-embedding-3-small` for movie embeddings | ✅ Accepted | Inline below |
| 012 | Hybrid recommendation scoring — multi-signal, not single algorithm | ✅ Accepted | Inline below |

---

## Inline Decisions

### 005 — Supabase as Sole Backend

**Decision:** Use Supabase (PostgreSQL + pgvector + Auth + Edge Functions) as the entire backend. No custom Node/Express server.

**Why:** Solo developer. Supabase provides auth, realtime, storage, managed Postgres with pgvector, and serverless edge functions in one platform. Zero infra ops at this stage. RLS handles multi-tenancy.

**Trade-off:** Complex orchestration that would normally live in a dedicated API server must go into Supabase edge functions or be handled client-side. Acceptable at current scale.

**Revisit when:** User base grows and edge function cold starts or RLS query performance become bottlenecks.

---

### 006 — Auth Initialised Before React Mounts

**Decision:** Parse the Google OAuth redirect hash and establish the Supabase session in `main.jsx`, before `ReactDOM.createRoot` renders.

**Why:** Prevents a flash of unauthenticated state. Eliminates a race condition where the router redirects to Landing before the session resolves. `RootEntry` then routes: authenticated → `/home`, unauthenticated → Landing.

**Rule:** Do not move session initialisation inside a component or effect. It must stay in `main.jsx` before the root render.

---

### 007 — TMDB API Called Client-Side, Not Proxied

**Decision:** TMDB API calls are made directly from the browser via `src/shared/api/tmdb.js`. No server-side proxy.

**Why:** TMDB's key is read-only. Proxying adds latency and infrastructure cost for zero security gain. If the key is rotated, it only affects public metadata reads.

**Risk:** The TMDB API key is readable in the client bundle. Acceptable for a public read-only key.

**Rule:** If write access to TMDB is ever needed, move those calls to a Supabase edge function immediately.

---

### 008 — Two-Layer In-Memory Cache

**Decision:** Cache API responses in two in-memory Maps scoped to the browser tab — one for TMDB responses (`src/shared/api/tmdb.js`) and one for computed recommendations (`src/shared/lib/cache.js`). No service worker. No IndexedDB.

**Why:** Carousel components mount simultaneously and fire duplicate requests for the same data on every render. An in-memory Map with TTLs and in-flight deduplication is the simplest correct fix. Service workers and IndexedDB add complexity and persistence we don't need — freshness matters more than caching across reloads for recommendations.

**TTL tiers (TMDB):**
- `FAST` = 1 min — search, trending (changes frequently)
- `NORMAL` = 5 min — discover lists
- `SLOW` = 12 hours — movie details and credits (stable)

**Recommendation cache TTL:** 5 min.

**Rule:** Do not replace this with a service worker or HTTP cache without a new ADR.

---

### 009 — gpt-4.1-mini for Edge Functions

**Decision:** Supabase edge functions use `gpt-4.1-mini`, not `gpt-4o` or `gpt-4-turbo`.

**Why:** Edge functions are called on every mood session. Cost and latency matter more than maximum reasoning quality for short tasks (mood parsing, explanation generation, reranking). `gpt-4.1-mini` is fast enough and cheap enough to call per-request without budget concerns.

**Revisit when:** A task genuinely requires stronger reasoning (e.g. multi-step recommendation strategy). Use a more capable model for that specific task only.

---

### 010 — Dual Deployment: Cloudflare Pages + Vercel

**Decision:** The app deploys to both Cloudflare Pages and Vercel. Both have CI/CD via GitHub PRs.

**Why:** Started on Vercel. Cloudflare Pages added for edge performance and to evaluate global CDN latency for media-heavy content. Both remain active while the performance comparison is ongoing.

**Rule:** Both pipelines must stay green. A PR that breaks one but not the other is not shippable. Primary production URL is `app.feelflick.com`.

---

### 011 — OpenAI text-embedding-3-small for Movie Embeddings

**Decision:** Movie embeddings are generated using OpenAI `text-embedding-3-small` (1536 dimensions), stored in Supabase via pgvector.

**Why:** `text-embedding-3-small` offers a strong quality/cost balance for semantic similarity tasks. The full `text-embedding-3-large` (3072 dimensions) was evaluated but the quality delta did not justify 2× storage and query cost at FeelFlick's current scale (~6,700 films).

**Rule:** Do not re-embed the catalogue with a different model without a migration plan. The pgvector column dimension is fixed — a model change requires dropping and recreating the embeddings column and re-running the full pipeline.

---

### 012 — Hybrid Recommendation Scoring

**Decision:** The recommendation engine combines content-based filtering + pgvector cosine similarity + explicit/implicit behavioral signals. Engine version: `2.4`.

**Why:** Pure collaborative filtering requires dense interaction data unavailable at launch. Content-based alone is too rigid. Vector similarity bridges the gap for mood-to-movie semantic matching. Behavioral signals (skips, re-watches, ratings) provide personalisation as data accumulates.

**Key design principles baked into the scoring:**
- Quality over popularity — high-rated indie films should surface over mediocre blockbusters
- Anti-recency bias — seed film selection enforces time diversity to represent full taste profile
- Negative signal tracking — skip patterns penalise genres, directors, actors, and languages

**Rule:** Bump `ENGINE_VERSION` in `recommendations.js:36` on any algorithm change so impressions from old scoring runs can be distinguished.

---

## How to Add a New Decision

When you make a non-obvious call — a library choice, a pattern, a constraint — add it here before you forget why.

For small decisions: add an inline entry above.
For significant or complex decisions: create `docs/decisions/NNN-short-name.md` using the format of the existing files, then add a row to the index table.

A decision is worth recording if a future developer (or Claude Code) would otherwise ask "why is it built this way?" or be tempted to change it without understanding the trade-offs.