# FeelFlick

**Movies, made personal.**

FeelFlick is a **personal movie discovery platform** — it helps people discover
movies through their **taste**, their **mood**, and their **curiosity**, and tells
them *why* a film fits. The right amount of choice: not one mandatory pick, and not
an endless feed to scroll.

Three complementary ways to find a movie:

- **Made for you** (Home) understands the person — personalized to taste, history,
  ratings, saves, skips, and Cinematic DNA. It may lead with a prominent hero
  recommendation, but it isn't restricted to one movie.
- **Tuned to the moment** (Discover) understands the moment — mood- and
  situation-based, returning a small, focused, finite selection.
- **Yours to explore** (Browse) follows explicit curiosity — direct filters
  (genre, language, year, runtime, rating, people, availability, collections).

Personalization combines taste and context; every recommendation is explained from
real signals; **Cinematic DNA** is a living, evolving picture of your taste — never
fixed or infallible. Anti-scroll still holds, redefined as *bounded, intentional
choice* — not a mandatory single pick.

> **Target direction vs. current runtime.** The above is the approved target
> direction. Parts of the shipped app still reflect the former single-pick model
> (Home leads with one "Briefing" pick over an invisible queue; Discover resolves
> to one film). That is the current baseline being migrated, not the target — this
> README does not claim multi-film interfaces that aren't shipped yet.

The full product doctrine lives in [docs/product-doctrine.md](docs/product-doctrine.md)
(rationale: [docs/decisions/020-personal-movie-discovery-and-bounded-choice.md](docs/decisions/020-personal-movie-discovery-and-bounded-choice.md)).
For how to work in this repo (conventions, guardrails, workflows), the source of
truth is [CLAUDE.md](CLAUDE.md).

---

## What FeelFlick is *not*

These are anti-goals, not missing features. Building toward any of them is drift:

- **Not a Letterboxd clone** — we don't lead with the diary/social feed; logging
  is a signal substrate, not the product.
- **Not a TMDB wrapper** — TMDB is our metadata source, not our value.
- **Not a Netflix-style endless grid** — discovery is bounded, intentional, and
  explained, not an infinite wall of generic carousels.
- **Not a JustWatch replacement** — where-to-watch is a convenience, not the central value.
- **Not a generic movie tracker** — the value is personally relevant, explained discovery, not the ledger.

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
| Hosting | Cloudflare Pages (live domain) + Vercel (PR previews / edge middleware for bot OG-meta) |

There is **no dedicated app server** — the React SPA talks directly to Supabase,
calls TMDB with a read-only key, and reaches OpenAI only through Supabase Edge
Functions.

---

## Key surfaces / routes

Defined in [src/app/router.jsx](src/app/router.jsx). Grouped by product role
(full rationale in [docs/product-doctrine.md](docs/product-doctrine.md)):

**Discovery modes** (complementary — none subordinate by doctrine)
- `/` — Landing (anonymous) / redirect to `/home` (authenticated)
- `/home` — **Made for you**: personalized recommendations (labeled **Tonight** in nav). Currently leads with a single "Briefing" pick — see the runtime note above.
- `/discover` — **Tuned to the moment**: mood- and situation-based discovery (natural-language mood input)
- `/browse`, `/mood/:tag`, `/tone/:tag`, `/browse/fit/:profile`, `/collection/:id` — **Yours to explore**: direct filters + catalog navigation

**Supporting surfaces** (evidence, trust, control, memory)
- `/movie/:id` — **Film File**: the editorial case for a film
- `/profile`, `/profile/:userId` — Cinematic DNA (taste made visible)
- `/preferences` — engine dials
- `/watchlist` — saved intent · `/history` (+ `/watched`) — the Diary (taste memory)
- `/lists`, `/lists/curated/:slug`, `/lists/personal/:type`, `/lists/:listId` — editorial collections
- `/people` — taste twins (a *later* compounding lever; thin pre-scale)
- `/onboarding` — cold-start taste seeding
- `/about`, `/privacy`, `/terms` — legal · `/admin/cache-monitoring` — email-allowlisted ops tool

**Parked** (built but unrouted) — `/feed`, `/challenges` redirect to `/home`.

> **Nav note (current runtime).** The shipped navigation still centers **Tonight**
> and routes Browse/Discover as secondary, reflecting the former surface hierarchy
> ([docs/ia-v2-decision-record.md](docs/ia-v2-decision-record.md), now a historical
> record). Re-leveling navigation around three complementary modes is a separate,
> later change — not part of this documentation update.

---

## Recommendation engine (high level)

The engine ([src/shared/services/recommendations.js](src/shared/services/recommendations.js)
+ satellites) is a **blend**, not one signal. It builds a cached user profile,
then scores candidate films against it. Today it produces the current Briefing's
single visible pick (weighted-random over top candidates; #1 wins ~65%) shipped
with a generated "why this is the one" line
([heroReason.js](src/shared/services/heroReason.js)). The single-pick *presentation*
is current runtime, not a permanent product rule — the product direction is bounded,
finite, personal selections (see [docs/product-doctrine.md](docs/product-doctrine.md)).

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

Client-rendered Vite build. The **live domain `app.feelflick.com` is served by
Cloudflare Pages** (`public/_redirects` = SPA fallback, `public/_headers` =
security headers); a **Vercel** deploy runs in parallel for PR previews
(`vercel.json` mirrors the SPA rewrite + headers; `middleware.js` = Vercel Edge
bot-only OG-meta injection). Set the `VITE_*` vars in the serving platform.
Build locally (`npm run build`), deploy a preview, confirm Supabase auth +
TMDB-powered pages, then promote. Security headers + the Sentry observability fix
are covered in [docs/production-observability-security-f9d.md](docs/production-observability-security-f9d.md).

---

## Documentation index

Start here, in order, depending on your task:

| Doc | Read it for |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Working conventions, guardrails, design language — **read first** |
| [docs/product-doctrine.md](docs/product-doctrine.md) | Canonical product doctrine — personal movie discovery, the three modes, bounded choice, Cinematic DNA, anti-drift rules, the decision test |
| [docs/feelflick-foundation-readiness-audit.md](docs/feelflick-foundation-readiness-audit.md) | The F0 ground-truth audit + the F1–F10 rebuild roadmap |
| [docs/architecture.md](docs/architecture.md) | Current system architecture |
| [docs/FeelFlick_Overview.md](docs/FeelFlick_Overview.md) | Product overview (features + engine, prose) |
| [docs/product-research-patterns.md](docs/product-research-patterns.md) | Competitive patterns to borrow / refuse (research memo; predates ADR 020) |
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
- **F9A — Release / CI / Production Hardening Prep** ✅ done (validation matrix + release-readiness doc)
- **F9B — Linux visual baseline** ✅ done (regenerated via the `visual-baselines/*` CI flow)
- **F9C — Merge / deploy / smoke / outcome baseline** ✅ done (rebuild **merged → `main` (#169)** + **deployed to production**; smoke-green; F8B outcome capture **verified working in prod**)
- **F9D — Production observability + security headers** ✅ done (Sentry 403 root-caused to an Allowed-Domains filter → one-time dashboard fix; safe security headers shipped via `public/_headers` + `vercel.json`; CSP drafted/deferred)
- **F9E — Merge + verify** ✅ done (PR #171 merged; **security headers verified LIVE on `app.feelflick.com`**)
- **F9F — Sentry ingest verification** ✅ done (after the Allowed-Domains fix, **production error monitoring is live** — 403 gone, a test error landed in Sentry Issues from `app.feelflick.com`)
- **F9G — CSP report-only** ✅ done (shipped `Content-Security-Policy-Report-Only` via `public/_headers` — never blocks; reports to Sentry)
- **F9G.1 — CSP report-only verified in prod** ✅ done (live + non-breaking; reporting pipeline confirmed; one inline-script violation found)
- **F9G.2 — Cloudflare inline-script diagnosis** ✅ done (the violation is **Cloudflare JavaScript Detections**, not the RUM beacon; per-request → no hash)
- **F9G.3 — JSD CSP resolution (Pages Function nonce)** ✅ done (new `functions/_middleware.js` emits a per-request CSP nonce so Cloudflare auto-nonces its JSD script — no `'unsafe-inline'`; verified on preview)
- **F9G.4 — CSP nonce prod verification** ✅ done (merged; on prod the report-only CSP carries a **rotating nonce** and **Cloudflare's JSD script is now nonced** → the violation is **gone**; CSP now reports **zero** violations → enforcement eligible after a short monitoring window)
- **F9H — Non-skip CI gates** ✅ done (documented the secrets that make E2E + Lighthouse real gates; workflows already auto-flip once secrets are added — `docs/ci-nonskip-gates-f9h.md`)
- **F9H.1 — Enable real CI gates** ✅ done (uploaded the 5 repo secrets from approved local sources — no values exposed — + restricted the Lighthouse collect to `index.html`; **E2E + Lighthouse now run for real** — `docs/ci-real-gates-verification-f9h1.md`)
- **F10A — Private preview + outcome baseline** ✅ done (preview plan + decision criteria, tester guide, launch runbook, feedback template, outcome-baseline collection plan; pre-preview dev baseline; engine frozen — `docs/private-preview-*-f10a.md`, `docs/outcome-baseline-collection-f10a.md`)
- **F10B — Run private preview, Wave 1** 🟡 in progress (prepared the Wave-1 operating sheet + tester invite copy + a PII-free tracker template; ran + recorded the pre-invite readiness gate — prod/headers/CSP/Sentry/CI/Cloudflare/Supabase all healthy; **invites not yet sent** — `docs/private-preview-wave-1-f10b.md`)
- **F10C — Synthetic persona usability lab** ✅ done (a parallel UX-inspection track while awaiting real testers: persona schema + 16 archetypes + task script + rubric + Claude prompt pack + tooling proposal + a 2-persona pilot — **synthetic ≠ real-user validation; does not unblock F8C** — `docs/personas/`)
- **F10D — Full synthetic 16-persona journey simulation** ✅ done (ran all 16 personas + produced cohort findings, a simulated outcome matrix, a 5-bucket UX backlog, and **real-preview watch-items** with confirm/disprove criteria — **synthetic ≠ validation; does not unblock F8C; nothing implemented** — `docs/personas/*-f10d.md`)
- **F11A — UI consistency + visual design audit** ✅ done (a parallel polish track: UI inventory, consistency audit (P0–P3), 12-route visual audit, FeelFlick visual direction + do-not-become, Claude UI-skills recommendation, and a 6-wave **F11B** implementation roadmap — **audit only, no UI implementation; engine frozen; does not unblock F8C** — `docs/ui/`)
- **F8C — Gated engine tuning** ⏭️ next — **still blocked** until the **F10B private preview** (Wave 1 → 2) collects a non-trivial, stable real-user outcome baseline (capture mechanism is proven; real-user volume is not there yet)

---

*FeelFlick uses the TMDB API but is not endorsed or certified by TMDB.*
</content>
