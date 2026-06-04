# FeelFlick

**Mood-first, taste-deep movie discovery — one justified film for tonight, with the case for why it's the one.**

FeelFlick turns *how you feel* into a single considered film for tonight — tuned
to your mood and everything you've ever loved on screen — and it tells you *why*
it's the pick. A recommendation you can trust, not a feed to scroll.

> **North Star / the wedge:**
> *Mood-first, taste-deep — a single justified nightly pick that makes its case. Anti-scroll.*

Mood is the front door; your taste (your "Cinematic DNA") is the house; the
editorial case for each pick is the moat. One film a night — made for the
patient, not the scrollers.

The full product doctrine lives in [docs/product-doctrine.md](docs/product-doctrine.md).
For how to work in this repo (conventions, guardrails, workflows), the source of
truth is [CLAUDE.md](CLAUDE.md).

---

## What FeelFlick is *not*

These are anti-goals, not missing features. Building toward any of them is drift:

- **Not a Letterboxd clone** — we don't lead with the diary/social feed; logging
  is a signal substrate, not the product.
- **Not a TMDB wrapper** — TMDB is our metadata source, not our value.
- **Not a Netflix-style endless grid** — a wall of carousels betrays the single pick.
- **Not a JustWatch replacement** — where-to-watch is a convenience, not the loop.
- **Not a generic movie tracker** — the value is the *justified pick*, not the ledger.

---

## Product status

**Pre–private-preview. Actively being rebuilt** through a disciplined,
phase-by-phase plan (see [Rebuild status](#rebuild-status) below). The app is
fully built and wired — auth, the recommendation engine, and every surface exist
and run — but it is being hardened toward production quality before a private
preview. Movies only today (no TV/series surfaces).

Quality bar: Netflix / Apple TV+ polish. Every surface is production-facing.

---

## Stack

JavaScript (JSX) throughout — **no TypeScript** (deliberate; see
[docs/decisions/001-no-typescript.md](docs/decisions/001-no-typescript.md)).

| Layer | Tech |
|---|---|
| UI | React 19, React Router 7, Framer Motion 12, Tailwind CSS 4, lucide-react |
| Data | TanStack Query 5, Supabase JS client |
| Build/test | Vite 8, Vitest, Playwright (+ `@axe-core/playwright`), ESLint 9 |
| Backend | Supabase (PostgreSQL 15 + pgvector + Auth + Storage + Edge Functions + pg_cron) |
| External | TMDB API (catalog), OpenAI (embeddings + LLM enrichment, **server-side only**) |
| Observability | Sentry (errors/replay), PostHog (product analytics), web-vitals |
| Hosting | Vercel (SPA + edge middleware for bot OG-meta) |

There is **no dedicated app server** — the React SPA talks directly to Supabase,
calls TMDB with a read-only key, and reaches OpenAI only through Supabase Edge
Functions.

---

## Key surfaces / routes

Defined in [src/app/router.jsx](src/app/router.jsx). Grouped by role in the wedge
(full rationale in [docs/product-doctrine.md](docs/product-doctrine.md)):

**Core** (the wedge itself)
- `/` — Landing (anonymous) / redirect to `/home` (authenticated)
- `/home` — **The Briefing**: tonight's single justified pick + watch/save/skip (labeled **Tonight** in nav)
- `/movie/:id` — **Film File**: the editorial case for a film
- `/onboarding` — cold-start taste seeding

**Supporting** (make the pick land / build trust)
- `/discover` — mood-driven discovery (natural-language mood input)
- `/profile`, `/profile/:userId` — Cinematic DNA (taste made visible)
- `/preferences` — engine dials
- `/watchlist` — The Queue · `/history` (+ `/watched`) — The Diary

**Utility / catalog**
- `/browse`, `/mood/:tag`, `/tone/:tag`, `/browse/fit/:profile`, `/collection/:id`
- `/lists`, `/lists/curated/:slug`, `/lists/personal/:type`, `/lists/:listId`
- `/people` — taste twins (a *later* compounding lever; thin pre-scale)
- `/about`, `/privacy`, `/terms` — legal
- `/admin/cache-monitoring` — email-allowlisted ops tool

**Parked** (built but unrouted) — `/feed`, `/challenges` redirect to `/home`.

---

## Recommendation engine (high level)

The engine ([src/shared/services/recommendations.js](src/shared/services/recommendations.js)
+ satellites) is a **blend**, not one signal. It builds a cached user profile,
then scores candidate films against it to produce the Briefing's single pick
(weighted-random over top candidates; #1 wins ~65%) shipped with a generated
"why this is the one" line ([heroReason.js](src/shared/services/heroReason.js)).

Signals:
- **Taste** — genre/director/actor affinity + pgvector cosine similarity over
  OpenAI `text-embedding-3-large` (3072-dim) embeddings, seeded from your recent +
  top-rated watches.
- **Mood** — a per-session mood signature over mood/tone tags + fit profiles.
- **Quality gating** — blended `ff_final_rating` floors + TMDB vote-count
  thresholds + quality tiers; nothing mediocre surfaces regardless of fit.
- **Behavioral** — a layered skip system (48h hard-exclude → 7-day de-rate →
  permanent learning), ratings, re-watches, and a thumbs feedback loop.
- **Anti-bias** — anti-recency, signal decay, diversity de-clustering, and a
  language anti-bubble.

Tuning is gated: the `recommendation-engine` skill mandates DB-first analysis
before touching scoring, limits, or filters. Constants live in
[CLAUDE-REFERENCE.md](CLAUDE-REFERENCE.md).

---

## Auth, data & external services

- **Auth** — Google OAuth via Supabase. The OAuth hash is handled in
  [src/main.jsx](src/main.jsx) *before* React mounts (nonce-validated, no-reload
  session set), avoiding a flash-of-unauthenticated. `RequireAuth` guards
  protected routes; `PostAuthGate` routes new users to `/onboarding`.
- **Data** — Supabase (PostgreSQL + pgvector). Row-Level Security was hardened
  across catalog/engine tables on 2026-05-29 (migrations `20260529000000`–`000500`).
- **TMDB** — read-only client key, rate-limited (40 req/10s), tiered in-memory
  cache. Attribution is shown on `/terms`.
- **OpenAI** — embeddings (catalog pipeline) + 4 Edge Functions (`gpt-4.1-mini`)
  for mood context, overlay/taste-summary, and reflection prompts.
- **Sentry / PostHog / web-vitals** — wired in `main.jsx` (prod-gated / key-gated).

---

## Environment variables

Client-exposed (safe — `VITE_` is bundled into the browser build):

```
VITE_SUPABASE_URL        # Supabase project URL (non-secret)
VITE_SUPABASE_ANON_KEY   # Supabase anon key (RLS enforces access)
VITE_TMDB_API_KEY        # TMDB read-only key (rate-limited)
VITE_ADMIN_EMAILS        # Comma-separated admin emails for the AdminOnly guard
VITE_SENTRY_DSN          # Sentry DSN (optional; has a prod default)
VITE_POSTHOG_KEY         # PostHog project key (optional)
VITE_POSTHOG_HOST        # PostHog ingest host (optional)
```

> ⚠️ **Never expose server-side secrets to the client.** The OpenAI key and the
> Supabase **service-role** key are server-side only (Edge Functions / pipeline
> scripts). **Never** prefix them with `VITE_` and never reference them in `src/`.
> `.env` / `.env.*` are gitignored and must never be committed.

---

## Local development

Node 20.20.2+ via nvm (see [CLAUDE-REFERENCE.md](CLAUDE-REFERENCE.md)).

```bash
npm install
npm run dev          # Vite dev server (http://localhost:5173)
```

### Validation (run before declaring any task done)

```bash
npm run lint         # ESLint (flat config)
npm run test         # Vitest (unit/component)
npm run build        # Production build
```

E2E / visual / a11y (require a live server + dev test credentials):

```bash
npm run test:e2e         # Playwright (public + app projects)
npm run test:visual      # Playwright visual regression
# E2E auth: set E2E_TEST_EMAIL / E2E_TEST_PASSWORD (see CLAUDE.md)
```

---

## Deployment

Client-rendered Vite build deployed on **Vercel** (`vercel.json` = SPA rewrite;
`middleware.js` = Vercel Edge bot-only OG-meta injection for link unfurls). Set
the `VITE_*` vars above in the Vercel project. Build locally (`npm run build`),
deploy a preview, confirm Supabase auth + TMDB-powered pages, then promote.

---

## Documentation index

Start here, in order, depending on your task:

| Doc | Read it for |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Working conventions, guardrails, design language — **read first** |
| [docs/product-doctrine.md](docs/product-doctrine.md) | The wedge, anti-drift rules, surface hierarchy, the feature decision test |
| [docs/feelflick-foundation-readiness-audit.md](docs/feelflick-foundation-readiness-audit.md) | The F0 ground-truth audit + the F1–F10 rebuild roadmap |
| [docs/architecture.md](docs/architecture.md) | Current system architecture |
| [docs/FeelFlick_Overview.md](docs/FeelFlick_Overview.md) | Product overview (features + engine, prose) |
| [docs/product-research-patterns.md](docs/product-research-patterns.md) | Competitive patterns to borrow / refuse, mapped to the wedge |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | World-class design patterns reference |
| [docs/PLANNING.md](docs/PLANNING.md) | Active sprint backlog |
| [CLAUDE-REFERENCE.md](CLAUDE-REFERENCE.md) | Tuneable engine constants + dev-env detail |
| [docs/README.md](docs/README.md) | Full docs-folder index (decisions, audits, runbooks) |

---

## Rebuild status

FeelFlick is being rebuilt in disciplined phases (F0 → F10), each docs/design-then-build
and ending green on `lint → test → build`. See the roadmap in the
[F0 audit §8](docs/feelflick-foundation-readiness-audit.md).

- **F0 — Foundation Readiness Audit** ✅ done
- **F1 — Product Doctrine + README/Docs Alignment** ✅ done
- **F2 — Information Architecture v2** ✅ done (nav centers the Briefing / "Tonight")
- **F3 — Design System Hardening** ✅ done (brand vs semantic tokens)
- **F4 — Landing + Onboarding vNext** ✅ done (landing primitives + trust copy)
- **F5 — Home / Briefing vNext** ✅ done (the pick makes its case — "why this pick")
- **F6A — Film File case-making design** ✅ done (current-state map + tiered plan)
- **F6B — Film File case-making (UI-only)** ✅ done (`PrimaryCaseCard` leads the case)
- **F7 — Cinematic DNA / Taste Profile vNext** ✅ done (honest DNA confidence; no fake cold-state)
- **F8A — Recommendation Trust + Evaluation foundation** ✅ done (metrics framework + offline harness + read-only SQL + explanation rubric; engine untouched)
- **F8B — Recommendation Outcome Capture Repair** ✅ done (wired save/watch/click outcomes back to impressions; engine untouched)
- **F8C — Gated engine tuning** ⏭️ next (blocked until a post-deploy capture baseline confirms outcomes are measurable, then DB-first tuning)

---

*FeelFlick uses the TMDB API but is not endorsed or certified by TMDB.*
</content>
