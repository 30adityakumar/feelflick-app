# FeelFlick — Foundation Readiness Audit (Phase F0)

> **Status:** Docs/audit only. No app code, schema, RLS, migrations, auth,
> recommendation scoring, Edge Functions, packages, or production config were
> changed in this phase.
> **Date:** 2026-06-03
> **Author:** F0 audit pass (Claude Code)
> **Scope of inspection:** the repository as it stands on branch
> `docs/f0-foundation-readiness-audit` (cut from `refactor/eyebrow-account-profile`,
> which carries an in-progress Eyebrow rollout in its working tree — see §10).
>
> **F1 follow-up (2026-06-03):** F1 (Product Doctrine + README/Docs Alignment) was
> started *only after* this F0 audit was cleanly committed as the baseline. F1
> added `product-doctrine.md` + `product-research-patterns.md`, rewrote the README
> and `architecture.md`, and reconciled the overview/planning/docs-index. F1
> verification corrected two F0 assumptions: `gpt-5.4-mini` is the *actual* model
> string in `scripts/pipeline/` (faithful to code, not doc-drift), and the mood
> taxonomy is 12 named moods (with a separate 6-mood Home session set). This audit
> itself was **not** rewritten.

This is the baseline document for a disciplined, phase-by-phase rebuild of
FeelFlick into a world-class, production-grade product — mirroring the
HappyWalls approach. It does **not** propose changes to ship now; it establishes
ground truth, names the risks, and lays out the phased roadmap (F1–F10) with an
explicit recommendation for what to do first.

The canonical sources of truth this audit reconciles against:
- `CLAUDE.md` (root) — working conventions + the wedge/North Star.
- `CLAUDE-REFERENCE.md` — tuneable constants, dev env.
- `docs/` — `architecture.md`, `FeelFlick_Overview.md`, `DESIGN_SYSTEM.md`,
  `user-journey.md`, `SUPABASE_SCHEMA.md`, `PLANNING.md`, ADRs, audits, runbooks.

**Headline verdict (full version in §9):** the *engine and feature surfaces are
substantially built and the validation gates are green*, but the *narrative
layer that should anchor a rebuild — README and the long-form docs — is stale or
wrong*. The single highest-leverage first move is **F1: Product Doctrine + README/docs
alignment**, because every later phase will otherwise be planned against
inaccurate maps.

---

## 0. Validation snapshot (this phase)

Run on this branch, 2026-06-03:

| Gate | Command | Result |
|---|---|---|
| Lint | `npm run lint` | ✅ exit 0 — clean, 0 warnings (`eslint src`) |
| Unit/component tests | `npm run test` | ✅ 33 files / **417 tests** passed (4.63s) |
| Production build | `npm run build` | ✅ exit 0 — 2772 modules transformed, no chunk-size warning |
| E2E (Playwright) | `npm run test:e2e` | ⏸️ **Not run in F0** — see note below |

**E2E note:** the suite is real and CI-wired (`e2e/public/*`, `e2e/app/*`,
`e2e/visual/*`, `@axe-core/playwright`), but it requires a live dev server, real
Supabase auth against the dev test user (`E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD`),
and Chromium browser binaries. F0 is a read-only audit that must not touch auth
or sign in/out flows beyond what's needed, and running it adds no signal to a
docs-only deliverable. It is folded into **F9 (Production Hardening)** as a gate
to run green before private preview. A green `npm run build` only proves the
surfaces *compile* — it does **not** exercise runtime rendering, navigation, or
auth, and is **not** a substitute for the e2e/visual/a11y suite. That coverage is
explicitly deferred to F9.

Largest production chunks (gzip): `react` 384.17 kB, `vendor` 354.70 kB
(115.4 kB gz), `recommendations` 259.34 kB (**69.7 kB gz**), `motion` 126.8 kB,
`index.css` 114.13 kB (16.9 kB gz). The engine is correctly code-split into its
own lazy chunk; see §6 for the bundle discussion.

---

## 1. Product identity

### 1.1 What FeelFlick currently *appears* to be

Three readings of the same repo, in tension:

1. **The intended product (per `CLAUDE.md` + the v3 landing):** a mood-first,
   taste-deep engine that produces **one justified nightly pick** ("The Briefing")
   and tells you *why* it's the one. Anti-scroll. This is crisply stated and
   defended in CLAUDE.md's "wedge" section.

2. **The product the route table implies:** a fairly broad movie-discovery app —
   `/home`, `/discover`, `/browse`, `/mood/:tag`, `/tone/:tag`, `/browse/fit/:profile`,
   `/collection/:id`, `/lists` (+ curated + personal), `/people`, `/profile`,
   `/watchlist`, `/history`, `/movie/:id`. That is a *lot* of surface for a "one
   pick a night" product, and several of those surfaces are browse/grid-shaped.

3. **The product the long-form docs describe:** `FeelFlick_Overview.md` leads with
   "18-dimension scoring," "5-score rating architecture," "44 auto-generated mood
   landing pages," "10 curated lists," "taste challenges." This reads as a
   *cinephile data platform* — closer to a TMDB-plus-Letterboxd hybrid than to
   "one film tonight."

The gap between reading #1 and readings #2/#3 is the central product-identity
finding of this audit. **The doctrine is sharp; the surface area has drifted
wide.** That isn't necessarily wrong — supporting surfaces can legitimately feed
the nightly pick — but it is currently *undefended in the IA*: nothing in the
product visibly subordinates browse/lists/discover to the Briefing.

### 1.2 The strongest wedge

Unchanged and correct, quoted from CLAUDE.md:

> **Mood-first, taste-deep — a single justified nightly pick that makes its case. Anti-scroll.**

The defensibility argument (TMDB has data but doesn't recommend; Netflix
recommends but buries you; Letterboxd logs the past; Apple/Stripe are craft
benchmarks) is genuinely differentiated. The moat is the **third clause** — the
case-making layer (`heroReason.js`, `briefScoring.js`, the editorial overlay,
the Film File). This is the part competitors structurally don't do, and the part
most at risk of being under-built relative to the engine.

### 1.3 What it should explicitly *not* become

From CLAUDE.md's anti-drift test, plus what the code makes tempting:

- ❌ An infinite/endless feed (betrays *anti-scroll*).
- ❌ A wall of carousels as the *primary* surface (betrays *the single pick*).
  **Live risk:** `/home` already renders 7+ stacked sections below the Briefing
  (ContinueWatching, CuratedLists, TasteMatch, TasteTwinPulse, CinematicDNA,
  QuickLog, PageEndCard). The Briefing is first and primary, but the page tail is
  carousel-shaped.
- ❌ Making the user do the curation work (betrays *it picks for you*).
- ❌ A pick shown without its case (betrays *makes its case*).
- ❌ Recs that ignore mood or ignore taste.
- ❌ A TMDB wrapper / a Letterboxd clone / a Netflix grid.

### 1.4 Do current routes/features support or dilute the wedge?

| Route / surface | Supports the wedge? | Note |
|---|---|---|
| `/home` (Briefing) | ✅ Core | The nightly pick lives here; this *is* the wedge. The section tail dilutes slightly. |
| `/movie/:id` (Film File) | ✅ Core | The case-making layer; editorial overlay is the moat. |
| `/onboarding` | ✅ Core | Cold-start taste seeding feeds the pick. |
| `/profile` (Cinematic DNA) | ✅ Supports | Makes taste *visible* — the "house." Trust-building. |
| `/preferences` | ✅ Supports | Engine dials; legitimate control surface. |
| `/discover` | ⚠️ Adjacent | Mood→films, but plural results = a second recommender surface that can compete with the Briefing for "what do I watch" intent. |
| `/watchlist`, `/history` | ⚠️ Supports/neutral | Queue + diary feed signal; fine as utilities, risk only if elevated to primary. |
| `/browse`, `/mood/:tag`, `/tone/:tag`, `/browse/fit/:profile`, `/collection/:id` | ⚠️ Dilution risk | Browse/grid surfaces. Useful for catalog spelunking, but they are the "endless grid" shape the wedge rejects if they become primary. |
| `/lists` (+ curated/personal) | ⚠️ Dilution risk | Editorial lists are on-brand as *seasoning*; as a primary destination they pull toward Letterboxd. |
| `/people` (taste twins) | ⚠️ Future moat | Social/taste-twin compounding is explicitly a "later" lever in CLAUDE.md ("let Letterboxd-style community compound once there are users"). Built early; thin data today. |
| `/admin/cache-monitoring` | ✅ Internal | Email-allowlisted ops tool. Neutral. |
| `/feed`, `/challenges` | ➖ Parked | Built but unrouted (redirect to `/home`). Correctly quarantined. |

### 1.5 Anti-drift risks (ranked)

1. **Surface sprawl vs. the single pick.** The app has ~13 user-facing route
   families; the wedge is about *one*. Nothing in the IA visibly ranks the
   Briefing above the browse/lists/discover surfaces. **This is the #1 identity
   risk** and the reason F2 (IA v2) is in the roadmap.
2. **The case-making layer is the moat but is under-documented and seeded for
   one film.** `movies_editorial_overlay` has **only Parasite seeded** (per
   `architecture.md` + the seed migration). `heroReason.js` generates a *short*
   line ("Because you loved X", "More from {director}") — good, but thin relative
   to the "makes its case" ambition. If the case is weak, the wedge collapses to
   "another recommender."
3. **Discover as a shadow Briefing.** Two engine-backed "what to watch" surfaces
   (`/home` Briefing and `/discover`) can confuse the core promise of *one*.
4. **Docs describe a wider product than the doctrine.** `FeelFlick_Overview.md`
   markets breadth ("18 dimensions," "44 pages," "5 scores"); a rebuild anchored
   to that doc will widen, not sharpen. (See §6 doc-accuracy findings.)

---

## 2. Current app architecture

### 2.1 High-level shape

Client-rendered **React 19 SPA** (Vite 8, React Router 7, TanStack Query, Framer
Motion, Tailwind 4). No application server. The browser talks **directly** to:
- **Supabase** (Postgres + pgvector + Auth + Storage + Edge Functions) via the JS client,
- **TMDB** via a read-only client key (rate-limited wrapper in `shared/api/tmdb.js`),
- **OpenAI** *only* through Supabase Edge Functions (key server-side; never `VITE_`),
- **PostHog** (product analytics) + **Sentry** (errors/replay) client-side.

Deployed on Vercel (`vercel.json` = SPA rewrite; `middleware.js` = Vercel Edge
bot-only SSR meta injection for `/movie/:id` and `/lists/:id` link unfurls).

### 2.2 Route structure (`src/app/router.jsx`, the highest-traffic file)

- **Public branch** (`PublicShell`, no app chrome): `/` (RootEntry → Landing or
  `/home`), `/auth/callback`, `/about`, `/privacy`, `/terms`, a cluster of legacy
  auth aliases that all `Navigate` to `/`, and `/logout`.
- **Onboarding branch** (`OnboardingShell`, auth-required, no app chrome): `/onboarding`.
- **App branch** (`AppShell` with global header + bottom nav):
  - publicly viewable: `/movie/:id`, `/browse`, `/discover`, `/mood/:tag`,
    `/tone/:tag`, `/browse/fit/:profile`, `/collection/:id`, `/lists/curated/:slug`,
    `/lists/personal/:type`, `/lists/:listId`;
  - admin (auth + email allowlist via `resolveAdminAccess`): `/admin/cache-monitoring`;
  - auth-required + onboarding-gated (`RequireAuth` → `PostAuthGate`): `/home`,
    `/account`, `/preferences`, `/watchlist`, `/history` (+ `/watched` alias),
    `/profile` (+ `/profile/:userId`), `/people`, `/lists`; `/feed` + `/challenges`
    redirect to `/home`.
- `/movies`, `/trending` → `/browse`; `/app`, `/app/*` → de-prefixed alias; `*` → live 404.
- Routing is wrapped with `Sentry.wrapCreateBrowserRouterV7`. All page components
  are `lazy()`-loaded; Suspense fallback is the `RouteSkeleton` (content-shaped
  pulse, per the no-spinners rule).

**Observation:** the router is clean, well-commented, and already free of the
`*-legacy`/`*-v2` route twins the old architecture doc still describes. This is
the most trustworthy single file for "what the app actually is."

### 2.3 Feature folder structure (`src/features/`)

One folder per surface, lowercase domain noun, no version suffix (matches
CLAUDE.md). File counts: landing 16, movie 13, onboarding 12, profile 9, lists 8,
home 8, browse 7, account 6, watchlist/people/history 4 each, preferences/legal/
discover 3 each, feed/challenges 1 each (parked).

Two decomposition patterns, both honored:
- **Editorial surfaces** (`landing/`) → `sections/` subfolder, `data.js`,
  `primitives.jsx`, slim entry shell.
- **Data-driven app surfaces** (`home`, `movie`, `account`, `profile`) →
  `sections-top.jsx` / `sections-bottom.jsx` split + `useXxxData.jsx` context
  provider + `data.js` tokens + `.css`.

Some `sections-*.jsx` files are very large (`movie/sections-bottom.jsx` ~45 KB,
`movie/sections-top.jsx` ~41 KB, `home/sections-bottom.jsx` ~38 KB). They're
*organized* but they're approaching "one giant file" territory — flagged for the
relevant vNext phases, not for F0.

### 2.4 Shared UI / component structure

- `src/shared/ui/` — low-level primitives: `Button`, `Modal`, `Input`, `Textarea`,
  `Select`, `Checkbox`, `EmptyState`, `Eyebrow`, `SectionHeader`, `Tooltip`,
  `BrandSplash` (+ `index.js` barrel, `__tests__/`).
- `src/shared/components/` — domain widgets: `StarRating`, `FollowButton`,
  `MatchBadge`, `MoodPill`, `ActionButton`, `Pagination`, `RecommendationFeedback`,
  `MovieSentimentWidget`, `QuickSentimentPicker`, `DatabaseValidationPanel`, etc.
- `src/components/` — app-wide canonical UI: `carousel/` (the MovieCard hover
  "LAW": `Card`, `Row`, `hooks/useMovieCardHover`), `layout/` (`TopNav`, `Footer`),
  `ToastNotification`.

The three-tier split (`ui` = primitives, `shared/components` = domain widgets,
`components` = app chrome) is coherent and documented in CLAUDE.md.

### 2.5 Data / service structure (`src/shared/services/`, 26 modules)

The engine and its satellites. Notable modules:
- `recommendations.js` — **6,714 LOC / ~255 KB**, the monolith (see §4).
- Engine satellites: `scoringV3.js`, `briefScoring.js`, `heroReason.js`,
  `embeddingScoring.js`, `fitAdjacency.js`, `diversity.js`, `exclusions.js`,
  `skipSignals.js`, `qualityTiers.js`, `matchScore.js`, `personalRating.js`,
  `dnaConfidence.js`, `homepageRows.js` (842 LOC), `rowSubtitles.js`.
- Behavioral/IO: `interactions.js`, `feedback.js`, `watchlist.js`, `onboarding.js`,
  `tasteCache.js`, `movieFields.js`, `boundaries.js`, `challenges.js` (parked),
  `analytics.js`, `databaseValidation.js`.

`shared/lib/` holds the kernel: `supabase/client.js`, `api/tmdb.js` (via
`shared/api`), `cache.js` (in-memory TTL + in-flight dedupe), `tokens.js` (design
tokens), `curatedLists.js`, `discoverQuestions.js`, `queryClient.js`, `vitals.js`,
`auth/` (`oauthNonce`, `onboardingStatus`), `format/date`, `movies/ensureMovieInDb`.

Hooks (`shared/hooks/`, ~19): `useAuthSession`, `useRecommendations`,
`useHomepageRows`, `useMoodBrief`, `useMoodSession`, `useNLMoodParse`,
`useTasteFingerprint`, `useRecommendationTracking`, `useInteractionTracking`,
`usePageMeta`, `useMovieRating`/`usePersonalRating`, `useUserMovieStatus`,
`useReflectionPrompt`, `usePendingDeletion`, `useGoogleAuth`, `useUnreadFeed`,
`useBriefCandidateCount`, and the just-added (untracked) `useInView`.

### 2.6 Auth flow

A two-part flow tuned to avoid flash-of-unauthenticated:
1. **`main.jsx` (pre-React):** `handleOAuthHash()` runs *before* `createRoot`.
   If the URL hash carries `access_token`, it validates a same-origin OAuth
   **nonce** (`oauthNonce.js`), checks we're on `/auth/callback`, calls
   `supabase.auth.setSession(...)`, strips the hash via `history.replaceState`,
   and falls through to mount (no full reload). On any failure it hard-redirects
   to `/`. Sentry + web-vitals + PostHog all init here.
2. **Runtime:** `useAuthSession` is a `useSyncExternalStore` singleton over
   `supabase.auth.getSession()` + `onAuthStateChange`, with a **5s safety
   timeout** that resolves as unauthenticated if Supabase is unreachable (so the
   landing renders rather than spinning). `RootEntry` routes authed→`/home`,
   anon→Landing. `RequireAuth` guards; `PostAuthGate` redirects users without
   `onboarding_complete` to `/onboarding`. `AdminOnly` adds an email-allowlist gate.

This is **production-grade and well-reasoned** — the nonce check, the safety
timeout, and the no-reload mount are all real hardening.

### 2.7 Recommendation-related services

Covered in depth in §4. Architecturally: a single profile build
(`computeUserProfile` / `computeUserProfileV3`) → cached (in-memory 60s +
`user_profiles_computed` 24h + `taste_fingerprint` 24h) → many row/slot
producers score against it (`getTopPickForUser`, `getMoodRecommendations`,
`getHiddenGemsForUser`, `getBecauseYouWatchedRows`, the homepage row builders…).

### 2.8 External touchpoints

| Service | How it's used | Surface in repo |
|---|---|---|
| **Supabase** | Direct client reads/writes; Auth; Storage (avatars); 4 Edge Functions; pg_cron stats; pgvector similarity. RLS hardened 2026-05-29 (18 catalog/engine tables). | `shared/lib/supabase/`, `supabase/migrations/` (47), `supabase/functions/` (4) |
| **TMDB** | Read-only key, client-side, 40 req/10s rate limiter, tiered cache (1m/5m/12h). Attribution present in `Terms.jsx`. | `shared/api/tmdb.js` |
| **OpenAI** | Server-side only via Edge Functions (`ai-mood-context`, `generate-movie-overlay`, `generate-reflection-prompt`, `generate-taste-summary`). No `VITE_OPENAI_*`. | `supabase/functions/` |
| **PostHog** | Client analytics, init in `main.jsx` via `analytics.js`. Optional (key-gated). | `shared/services/analytics.js` |
| **Sentry** | Errors + tracing (0.2) + replay (mask all text, media visible). Prod-only. | `main.jsx`, `ErrorBoundary.jsx` |

### 2.9 What already feels production-grade

- Auth flow (nonce, safety timeout, no-reload OAuth mount).
- Routing (lazy, guarded, Sentry-wrapped, skeleton fallbacks, no legacy cruft).
- Security posture **in code/migrations**: RLS hardening pass, pinned function
  `search_path`, IDOR-prone definer-function lockdown, CORS-hardened edge functions.
- Observability wiring (Sentry + PostHog + web-vitals).
- Test + CI discipline: 417 unit/component tests green, Playwright e2e + visual
  regression (per-platform baselines) + runtime a11y (`@axe-core/playwright`) in CI.
- Design-token consolidation (`tokens.js`) and a real primitive library.
- Performance-minded `index.html` (preconnects, single font request, CLS-safe
  header var, structured data, OG/Twitter meta).

### 2.10 What feels fragile, stale, duplicated, or unclear

- **`recommendations.js` is a 6,714-LOC monolith.** Single file, 35+ exports, a
  changelog header that stops at v2.7 while `ENGINE_VERSION` is `2.17`. High
  cognitive load; hard to test in isolation; the #1 maintainability risk.
- **Stale long-form docs (the biggest finding):**
  - `README.md` is the **default "Supabase Vite User Management" template** — it
    has nothing to do with FeelFlick (magic-link signup, avatar storage). Anyone
    landing in the repo is actively misinformed.
  - `docs/architecture.md` describes a **superseded codebase**: "React 18,"
    `*-v2`/`*-v5`/`*-legacy` folders and routes, `contexts/`, `src/app/pages/`,
    `recommendation-cache.js`, `ENGINE_VERSION 2.4`, `text-embedding-3-small`,
    and — critically — frames **"RLS disabled on 18 tables" as an open critical
    issue**, though it was *resolved* 2026-05-29 (migrations `20260529000000`–
    `000500`; memory `project_rls_exposure`). A reader could "fix" an
    already-fixed problem or trust a wrong threat model.
  - `docs/FeelFlick_Overview.md` has factual drift: "React 18," "GPT-5.4-mini"
    (not a real model), film count "6,482" vs `index.html`'s "6,700+," and lists
    11 moods while claiming "12."
  - `docs/PLANNING.md` "Up Next" lists ESLint violations (rules-of-hooks ×8,
    unescaped-entities ×47) and npm-audit vulns — but `npm run lint` is **clean**
    today, so that backlog is at least partly stale.
- **Design drift (minor, real):** `tokens.js` `HP` still exports `amber`/`red`,
  and amber/orange radial gradients live in `router.jsx` (`LandingBg`,
  `OnboardingShell`), `ErrorBoundary.jsx`, `header/components/SearchBar.jsx`, and
  `landing/sections/FilmFile.jsx` — contradicting "purple + pink only, no
  amber/orange in gradients." Two inline `HP` redeclarations remain
  (`features/discover/Discover.jsx`, `features/browse/data.js`).
- **`SUPABASE_SCHEMA.md` is self-flagged auto-generated/stale** (the live DB is
  the source of truth). Fine as long as nobody trusts it for current state.

---

## 3. UX surface audit

For each surface: **role**, **does it support "one justified nightly pick"**,
**likely-good**, **likely-short**, **fix-later**, **don't-touch-yet**. Quality is
assessed by reading code/structure, not live QA (that's F4–F7 + F9 territory).

### Landing (`/`, `features/landing/`)
- **Role:** public conversion surface; the doctrine's shop window.
- **Wedge:** ✅ Strong — copy is on-message ("Films that know you," "The right
  film. Right now."), sections map to the pitch (TheProblem, Ritual, FilmFile,
  Briefing, DNA, Community, Pricing, FinalCTA). Visual-regression tested.
- **Likely good:** editorial polish, `Reveal`/`Stars`/`Poster` primitives,
  decomposed sections, approved copy enforced by CLAUDE.md.
- **Likely short:** `Community` section risks fabricated social proof (CLAUDE.md
  forbids fake counts — verify it's honest); `Pricing` exists though the product
  markets "always free" (reconcile). Amber gradient in `FilmFile`.
- **Fix later:** F4. **Don't touch yet:** the visual baseline (re-baseline deliberately).

### Auth (`features/auth/`: `OAuthCallback`, `PostAuthGate`)
- **Role:** Google OAuth completion + onboarding gate.
- **Wedge:** ✅ Neutral/supporting (gateway to the pick).
- **Likely good:** robust (see §2.6); the only auth path is Google OAuth.
- **Likely short:** single-provider (no email fallback) — a deliberate
  simplification, but a preview-readiness question. No visible auth-error surface
  beyond redirects.
- **Fix later:** F9. **Don't touch yet:** the `main.jsx` nonce/hash handler (highest-stakes code).

### Onboarding (`/onboarding`, `features/onboarding/`)
- **Role:** cold-start taste seeding — movies, genres, mood, rating steps.
- **Wedge:** ✅ Core — directly seeds the first night's pick.
- **Likely good:** decomposed steps, skip handling, tests
  (`OnboardingSkip`, `OnboardingSteps`), mood-reactive ambient.
- **Likely short:** "value before commitment" (the `DESIGN_SYSTEM.md` ideal)
  isn't obviously realized — does the user *see a pick* before finishing? Worth
  validating in F4.
- **Fix later:** F4. **Don't touch yet:** onboarding→home handoff overlay timing.

### Home / Briefing (`/home`, `features/home/`)
- **Role:** **the product.** The Briefing = tonight's single pick + reason +
  watch/save/skip; then supporting sections.
- **Wedge:** ✅✅ This *is* the wedge — but the 7-section tail (ContinueWatching,
  CuratedLists, TasteMatch, TasteTwinPulse, CinematicDNA, QuickLog, PageEndCard)
  is the carousel-shaped dilution risk.
- **Likely good:** Briefing-first ordering, skip writes real negative signal
  (`updateImpression` + `dismiss` interaction), mood-reactive ambient, honest
  no-toast feedback.
- **Likely short:** the case-making line is short; section-tail length pulls
  toward "a feed." Mood tab logic is subtle (baseline mood snap).
- **Fix later:** F5. **Don't touch yet:** the skip→impression write contract (engine depends on it).

### Movie detail / Film File (`/movie/:id`, `features/movie/`)
- **Role:** the case-making moat — why *this* film, for you.
- **Wedge:** ✅✅ Core (third clause of the wedge).
- **Likely good:** large editorial build, derive/hooks split, `movie.css`, bot
  SSR meta for unfurls.
- **Likely short:** `movies_editorial_overlay` seeded for **one film (Parasite)**
  — the richest version of "makes its case" exists for a single title; everything
  else falls back to generated/short reasons. This is the moat's weakest seam.
- **Fix later:** F6 (Film File vNext) — likely the most differentiating phase.
  **Don't touch yet:** the overlay schema until F6 design is set.

### Discover (`/discover`, `features/discover/`)
- **Role:** AI/mood-driven multi-result discovery (natural-language mood parse).
- **Wedge:** ⚠️ Adjacent — a *plural* recommender that can shadow the singular Briefing.
- **Likely good:** NL mood parsing (`useNLMoodParse`), mood-session logging.
- **Likely short:** purpose overlap with Home; inline `HP` redeclaration (drift);
  largest CSS of any surface (6.46 kB) hints at heavy bespoke styling.
- **Fix later:** F2 (decide its relationship to the Briefing) then F8.
  **Don't touch yet:** mood-session schema.

### Watchlist / Queue (`/watchlist`, `features/watchlist/`)
- **Role:** saved-for-later queue.
- **Wedge:** ✅ Supporting utility (feeds signal).
- **Likely good:** small, focused, scored via the engine.
- **Likely short:** standard queue UX; no obvious differentiation.
- **Fix later:** F9 polish. **Don't touch yet:** nothing critical.

### History / Diary (`/history` + `/watched`, `features/history/`)
- **Role:** watched-films diary; quick-log + rating feed signal.
- **Wedge:** ✅ Supporting (the "everything you've loved" substrate).
- **Likely good:** dual route alias, quick-rate flow described in overview.
- **Likely short:** Letterboxd-adjacent; keep it a *utility*, not a destination.
- **Fix later:** F7-adjacent. **Don't touch yet:** rating write paths.

### Profile / Cinematic DNA (`/profile`, `/profile/:userId`, `features/profile/`)
- **Role:** makes taste *visible* — the "house"; trust-builder.
- **Wedge:** ✅ Supporting moat (DNA confidence shown consistently via `dnaConfidence.js`).
- **Likely good:** shared DNA-confidence formula (one number across surfaces),
  archetype/derive logic, taste-summary edge function.
- **Likely short:** needs ≥5 watched films to be rich; cold-state may feel empty.
- **Fix later:** F7 (Taste Profile vNext). **Don't touch yet:** `dnaConfidence` formula (shared contract).

### Preferences (`/preferences`, `features/preferences/`)
- **Role:** engine dials (mood weights, runtime, language, boundaries…).
- **Wedge:** ✅ Supporting (control without doing the curation).
- **Likely good:** maps to `user_settings` JSONB; gated by `recommendation-engine` skill.
- **Likely short:** power-user surface; discoverability/trust framing unclear.
- **Fix later:** F8. **Don't touch yet:** the settings→engine contract.

### Lists (`/lists`, curated + personal, `features/lists/`)
- **Role:** editorial + personal lists; Create/AddToList modals.
- **Wedge:** ⚠️ On-brand as seasoning; dilution risk as a primary destination.
- **Likely good:** curated-list config, personal-list kinds (director/genre/similar/fit/actor).
- **Likely short:** pulls toward Letterboxd if elevated; verify it stays subordinate to the pick.
- **Fix later:** F2 IA decision. **Don't touch yet:** nothing critical.

### People / Taste twins (`/people`, `features/people/`)
- **Role:** social/taste-twin discovery + follow graph.
- **Wedge:** ⚠️ Future moat — explicitly a "compound later, once there are users" lever.
- **Likely short:** thin data today (`user_follows`/`user_similarity` rows are few);
  risk of an empty-feeling social surface pre-scale.
- **Fix later:** post-preview. **Don't touch yet:** keep parked-but-routed; don't invest before users.

### Admin tools (`/admin/cache-monitoring`, `app/admin/`)
- **Role:** internal cache/ops monitoring, email-allowlist-gated.
- **Wedge:** ➖ Internal. **Likely good:** proper access states (loading/anon/unconfigured/forbidden).
- **Likely short:** amber gradient drift; admin-only so low priority.
- **Fix later:** F9. **Don't touch yet:** the allowlist gate.

### Legal pages (`/about`, `/privacy`, `/terms`, `features/legal/`)
- **Role:** compliance + trust; TMDB attribution lives in `Terms.jsx`.
- **Wedge:** ➖ Trust substrate. **Likely good:** real content, `usePageMeta`,
  TMDB attribution present and correctly worded ("not endorsed or certified by TMDB").
- **Likely short:** need a legal/privacy review for a real preview (PostHog,
  Sentry replay, data retention claims vs. reality).
- **Fix later:** F9/F10. **Don't touch yet:** attribution wording.

### Error / empty / loading states
- **Role:** resilience. **Wedge:** ➖ Substrate.
- **Likely good:** `ErrorBoundary` + per-route `errorElement`, `RouteSkeleton`,
  `EmptyState` primitive, `BrandSplash`, skeletons-not-spinners enforced,
  section-hide rule (`return null` on empty).
- **Likely short:** error states use amber drift; coverage uniformity unverified.
- **Fix later:** F3/F9. **Don't touch yet:** the boundary contracts.

### Mobile navigation (`AppShell` + `BottomNav`)
- **Role:** primary mobile chrome.
- **Wedge:** ⚠️ The nav *is* the IA — if it gives browse/lists equal weight to the
  Briefing, it encodes the sprawl.
- **Fix later:** F2 (IA v2 is largely a nav decision). **Don't touch yet:** until F2.

---

## 4. Recommendation system audit (audit only — no tuning)

Centered on `shared/services/recommendations.js` (6,714 LOC, `ENGINE_VERSION
'2.17'`) and its satellites. Governed by the `recommendation-engine` +
`supabase-change` skills, which mandate **DB-first analysis before any tuning**
(memory `feedback_db_first_analysis`). F0 deliberately does **no** tuning.

### 4.1 Signals used today
A blend (not one signal), per CLAUDE.md + code:
- **Taste:** content-based affinity (genre/director/actor) + pgvector cosine
  similarity over OpenAI `text-embedding-3-large` (3072-dim), seeded from recent +
  top-rated watches (`embeddingScoring.js`, `fitAdjacency.js`).
- **Quality gating:** `ff_final_rating` (critic ⊕ community) floors + TMDB
  `vote_count` thresholds + quality tiers (`qualityTiers.js`); `THRESHOLDS`
  (`MIN_FF_RATING 6.5`, `MIN_FF_CONFIDENCE 50`, `MIN_VOTE_COUNT 150`).
- **Behavioral:** layered skip system — 48h hard-exclude → 7-day de-rate →
  permanent learning for 3×+ repeat skippers (`skipSignals.js`, `exclusions.js`),
  plus ratings, re-watches, and a thumbs feedback loop (`feedback.js`).
- **Mood:** per-session mood signature over `mood_tags`/`tone_tags`/`fit_profile`
  + `moodWeights`, powering the Briefing's "Mood match" slot (`briefScoring.js`).
- **Anti-bias:** anti-recency (older masterpieces not penalized), signal decay,
  diversity de-clustering (`diversity.js`), and a **language anti-bubble**
  (STRICT/STRONG modes inject a discovery slot).

### 4.2 Mood logic
`computeMoodSignature` over controlled-vocabulary tags; `scoreMoodAffinity` +
`getMoodRecommendations`; NL parsing via `useNLMoodParse` (Edge Function). The
Briefing's per-mood pick is a **weighted-random** single result (#1 wins ~65%),
tuned by DNA confidence. Mood sessions logged to `mood_sessions` (+ `_abandoned`).

### 4.3 Taste logic
`computeUserProfile` / `computeUserProfileV3` build the user vector from
`user_history`, `user_ratings`, `user_preferences`, `user_interactions`, feedback,
and sentiment; ratings *amplify* affinity (5★ → 2×, 1–2★ → 0.3×). Embedding
neighbors drive "Because you loved X." `precomputeScoringContext` +
`scoreMovieV3` do the heavy scoring.

### 4.4 Quality gating
`ff_final_rating = ff_rating·(1−w) + ff_community_rating·w`, community weight
0→20% as user votes accumulate. Vote-count floors per pool (hero uses higher
floors; hidden-gems pool uses a lower floor of 50). Genre-normalized ratings
surface "exceptional for its kind."

### 4.5 Feedback loops
- Thumbs up/down (`user_movie_feedback`) → amplify/suppress affinity.
- Skips: hero skip writes `recommendation_impressions.skipped = true` (read by
  `computeNegativeSignals`) **and** a `dismiss` interaction. Time-decayed (>180d →
  20% strength). Session genre penalty ("not in the mood for X tonight," resets on nav).
- Ratings + completion + sentiment all feed the profile.

### 4.6 Impression logging
`recommendation_impressions` (homepage/row-scoped, drives skip feedback) +
`recommendation_events` (mood-session-scoped) + `mood_sessions`/`_abandoned`.
`logSurfaceImpressions` + `updateImpression` are the write paths; the Briefing
logs a `placement:'hero'` row when a slide becomes active, which the skip handler
later flips. **This contract is load-bearing and must not be broken casually.**

### 4.7 Caching / versioning
- In-memory: `profileMemoryCache`/`seedMemoryCache` (60s TTL) + in-flight dedupe;
  `recommendationCache` (`shared/lib/cache.js`, 5m default).
- Persistent: `user_profiles_computed` (profile + fingerprint + personal_ratings,
  24h) and `taste_fingerprint` (`tasteCache.js`, 24h TTL).
- `ENGINE_VERSION` bump invalidates cached profiles (currently `2.17`).

### 4.8 Cold-start behavior
- `getPopularForColdStartRow` (unpersonalized) + `getOnboardingSeededRow` (uses
  onboarding picks) + `getGreatStartingPoints`.
- `isColdStart` = 0 watched films; fit-profile hard gate is skipped on cold start;
  every surface falls back to mood-tag overlap + `ff_audience_rating` when
  `profile` is null. DNA confidence (`dnaConfidence.js`) gates how strongly taste
  is trusted (history 30% / ratings 50% / fingerprint 20%).

### 4.9 Trust / explanation layer
`heroReason.js` chooses the dominant scoring dimension and emits a grounded line:
`"Because you loved {seed}"`, `"More from {director}"`, `"Matches your taste for
{tag} films"`, fit-profile labels, `"{genre} at its best"`, else `"Picked for
you"`. `briefScoring.generateBriefReason` does the Briefing equivalent. The
editorial overlay (`movies_editorial_overlay`: `why_for_you`, `ff_take`,
`hero_signature`, …) is the *rich* version — but **seeded for one film**.

### 4.10 Risks (audit only — do not act in F0)
1. **Monolith risk.** 6,714 LOC in one file with a changelog that desyncs from
   `ENGINE_VERSION` is the top maintainability/correctness risk. Future tuning
   is high-blast-radius.
2. **Explanation thinness vs. the moat.** `heroReason` lines are short and
   templated; the rich overlay exists for one title. The "makes its case" promise
   is the differentiator and is currently the least-built part. (F6/F8.)
3. **No offline evaluation harness.** There's no visible way to measure rec
   quality (precision/diversity/repeat-rate) before/after a tuning change — so
   "did this make the pick better?" is currently answered by vibes. (F8.)
4. **Repeated-pick distrust.** Weighted-random + skip cooldowns mitigate, but
   there's no explicit "you've seen this pick before" guard surfaced to the user;
   a returning user could feel déjà vu. (Measure in F8 before changing.)
5. **Popularity / language bias.** Anti-recency + language anti-bubble exist, but
   vote-count floors inherently favor well-voted (often English/Western) films;
   STRICT/STRONG injection is the only counterweight. Worth *measuring* (F8).
6. **Overfitting on thin history.** 5-watch users get gated, fallback-heavy recs;
   the jump from cold to warm is where trust is won or lost. (F5/F8.)
7. **Two recommenders (Home vs. Discover).** Product-level risk that the
   singular promise is undercut by a parallel plural surface. (F2.)

---

## 5. Design system & visual consistency audit (no refactor in F0)

### 5.1 Tokens
`src/shared/lib/tokens.js` is the single source of truth: `HP` (feature-surface
palette), `HP_GRAD` (the one brand gradient), `C` (landing palette, aliased to the
same hexes). CSS custom properties in `src/index.css :root` mirror it
(`--purple-*`, `--pink-*`, `--brand-gradient`, `--font-display/body`, `--bg-*`).

### 5.2 Typography
Two faces, one Google Fonts request (`index.html`): **Outfit** (display: 200–300
≥56px, 400–500 section, 600 buttons; italic = synthesized oblique for accent
fragments) + **Inter** (body 300–900). Landing uses `.ff-d1/.ff-d2/.ff-eyebrow/
.ff-italic` CSS classes; feature surfaces use inline styles referencing the CSS
vars. Forbidden faces (Playfair, Satoshi, Fraunces, JetBrains Mono) are documented
and absent.

### 5.3 Color
Brand palette = purple + pink only; one brand gradient
(`linear-gradient(135deg,#9333ea,#ec4899)`). **Drift found:** `HP.amber`/`HP.red`
still exported, and amber/orange radial gradients persist in `router.jsx`
(`LandingBg`, `OnboardingShell`), `ErrorBoundary.jsx`,
`header/components/SearchBar.jsx`, and `landing/sections/FilmFile.jsx`. This
contradicts "no amber/rose/orange in gradients."

### 5.4 Buttons / pills / tags / eyebrows / cards
Canonical primitives exist: `Button` (variants primary/secondary/ghost/icon/
destructive), `Eyebrow` (the kicker — currently being rolled out across surfaces;
see §10), `SectionHeader`, `MoodPill`, `MatchBadge`, `ActionButton`,
`StarRating`, `FollowButton`, `EmptyState`. Memory `project_design_consolidation`
records that the canonical dedup is **done**, and remaining per-surface button/
pill/hover variation is *deliberate*, not accidental — so F3 should harden, not
re-grind.

### 5.5 MovieCard / carousel
The hover "LAW" is documented and owned by three files (`useMovieCardHover`,
`Row/index`, `Card/index` + `MovieCard`): pure poster scale-up (Apple TV+ style),
no portal/overlay/expanding panel, static below-card title. ADR 002 records the
decision. Tested (`MovieCard.test`, `Row.test`).

### 5.6 Drift risks & remaining duplicated inline UI
- Amber/orange gradient drift (above).
- Two inline `HP` redeclarations: `features/discover/Discover.jsx`,
  `features/browse/data.js` (CLAUDE.md flags the browse one as a known holdout).
- Eyebrow rollout is mid-flight (uncommitted on the parent branch) — some surfaces
  may still hand-roll uppercase kickers until it lands.
- Very large `sections-*.jsx` files concentrate inline style; not "duplicated" but
  hard to keep consistent by eye.

### 5.7 Suggested future design-system phases
- **F3 (Design System Hardening):** retire `amber`/`red` from `HP` and replace the
  amber/orange ambient gradients with brand purple/pink; fold the two inline `HP`
  holdouts into `tokens.js`; finish the Eyebrow rollout; add a tokens/Storybook-style
  reference page; lock the primitive APIs.
- Later: consider a Tailwind-token bridge so inline-style surfaces and utility
  surfaces share one scale (without blocking the no-TypeScript constraint).

---

## 6. Production readiness audit

| Area | State | Finding |
|---|---|---|
| **README accuracy** | 🔴 Stale | `README.md` is the **default Supabase Vite template** — not FeelFlick. Top priority to replace (F1). |
| **Long-form docs** | 🟠 Partly stale | `architecture.md`, `FeelFlick_Overview.md`, `PLANNING.md` carry factual drift (React 18, removed folders, RLS-open, GPT-5.4-mini, ESLint backlog). `CLAUDE.md`/`CLAUDE-REFERENCE.md` are current. |
| **Env var clarity** | 🟢 Good | CLAUDE.md documents all `VITE_*`; server-only keys (`OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, etc.) live in `.env`, which is **gitignored and not tracked** (verified). |
| **Build/test/lint** | 🟢 Green | Lint clean, 417 tests pass, build OK (this phase). |
| **E2E scripts** | 🟢 Present | Playwright public/app/visual + a11y; CI workflow `visual-regression.yml`. Not run in F0 (see §0). |
| **Error boundaries** | 🟢 Good | `ErrorBoundary` + per-route `errorElement` throughout; `SectionErrorBoundary` tested. |
| **Loading/error states** | 🟢 Good | Skeletons-not-spinners, `RouteSkeleton`, `BrandSplash`, `EmptyState`, section-hide rule. |
| **Accessibility** | 🟡 Guarded | Runtime axe in CI + `eslint-plugin-jsx-a11y` + `a11y-audit` skill. Risk: `textFaint` contrast history, amber drift, and large bespoke surfaces need a focused pass (F3/F9). |
| **Performance** | 🟡 Watch | Engine chunk ships to client (`recommendations` 259 KB / 69.7 KB gz, lazy-split); `vendor` 354 KB (115 gz) + `react` 384 KB + `motion` 127 KB. No >500 KB warning. `perf-guard` skill + web-vitals + lighthouserc present. Posters lazy/srcset per CLAUDE.md. |
| **Bundle / code-splitting** | 🟢 Good | Per-route lazy chunks; manual vendor/react/motion/router/recommendations split. Engine is correctly *not* in the main entry. |
| **Observability** | 🟢 Good | Sentry (errors/trace 0.2/replay, text masked) + PostHog (key-gated) + web-vitals. |
| **Supabase / RLS** | 🟢 Hardened (code) | RLS + write lockdown on 18 tables, pinned `search_path`, IDOR-fn lockdown, CORS-hardened edge fns (migrations `20260529*`). Live-DB advisor re-check belongs in F9. |
| **TMDB attribution** | 🟢 Present | `Terms.jsx` attributes TMDB and states non-endorsement. Consider a visible footer attribution too (F9). |
| **OpenAI key safety** | 🟢 Good | Server-side only via Edge Functions; no `VITE_OPENAI_*`; CLAUDE.md forbids it. |
| **Auth / session** | 🟢 Good | Nonce-checked OAuth, 5s safety timeout, no-reload mount. Single-provider (Google) is a preview scope question. |
| **Legal / privacy / terms** | 🟡 Needs review | Pages exist with real content; need a compliance pass reconciling PostHog/Sentry-replay/data-retention claims with reality (F9/F10). |
| **Deployment readiness** | 🟡 Mostly | Vercel SPA rewrite + bot SSR middleware + structured data/OG. **No CSP / security headers** configured in `vercel.json` (only a rewrite). Add headers in F9. |

---

## 7. Competitive / product research framing (checklist for F1)

No broad web research was performed in F0 (per task scope). The following is the
**research checklist to execute at the start of F1**, framed around the wedge —
each item asks "what can we *borrow to sharpen the single justified pick*," not
"what features do they have."

- **Letterboxd** — diary/log UX, social taste signals, review tone, dark-cinema
  visual language. *Borrow:* identity/diary as substrate. *Reject:* feed-as-product.
- **Netflix** — "% Match" framing, row taxonomy, measurement culture, autoplay
  restraint. *Borrow:* match-confidence presentation. *Reject:* the endless grid.
- **Apple TV+ / Apple** — craft, typography, motion restraint, poster-forward
  layouts, the "one editorial spotlight" pattern. *Borrow:* the single-hero ritual.
- **JustWatch** — availability/where-to-watch, filter ergonomics. *Borrow:*
  streaming-provider chips done cleanly. *Reject:* filter-maze as the core loop.
- **Trakt** — scrobbling, history depth, API/data model for watch state.
  *Borrow:* low-friction logging. *Reject:* power-user-only complexity.
- **TMDB** — data model, attribution norms, image pipeline. *Borrow:* metadata
  discipline + compliant attribution. *Reject:* "data dump as product."
- **Taste/quiz apps (Gyroscope, Spotify Wrapped/onboarding, Gentler Streak)** —
  taste-onboarding that *feels like browsing*, identity reveal, "value before
  commitment." *Borrow:* dynamic onboarding + DNA reveal.
- **Recommendation-explanation patterns** (Spotify "Made for you," YouTube
  "Because you watched," Amazon rationale lines, Pandora's Music Genome) — how to
  make a *reason* feel earned, not templated. *Directly informs F6/F8.*
- **Habit / ritual products (Duolingo, Headspace, Oura, BeReal)** — the nightly
  ritual, streaks-without-anxiety, one-thing-a-day framing, the daily "open it"
  prompt. *Directly informs F5 (the Briefing as a nightly ritual).*
- **Emotional design patterns (Headspace, Calm, Finch)** — mood-as-input UI,
  color-as-emotion, copy warmth, reduced-motion empathy. *Informs F4/F5.*

Deliverable of the F1 research sub-task: a 1–2 page "patterns we steal vs.
patterns we refuse" memo, mapped to the wedge, feeding F4–F8.

---

## 8. Recommended phased roadmap (F1 → F10)

HappyWalls-style. Each phase: **Objective · Scope · Non-scope · Deliverables ·
Validation · Risk · Depends on.** Phases are doc/design-then-build; every build
phase ends green on `lint → test → build` (+ e2e from F9).

### F1 — Product Doctrine + README/Docs Alignment
- **Objective:** make the repo's narrative layer *true* and the doctrine
  unambiguous, so every later phase is planned against an accurate map.
- **Scope:** rewrite `README.md` (FeelFlick, not the Supabase template); correct
  `docs/architecture.md` (React 19, current folders, RLS *resolved*, engine v2.17,
  embedding-3-large, no `recommendation-cache.js`); reconcile `FeelFlick_Overview.md`
  (model names, film count, mood count); refresh/triage `PLANNING.md`; write the
  one-page "doctrine" (wedge + anti-drift + surface hierarchy) + the §7 research memo.
- **Non-scope:** no app code, no schema, no engine, no design changes.
- **Deliverables:** accurate README + architecture + overview; doctrine doc;
  research memo; this audit linked from README/docs index.
- **Validation:** every claim in the touched docs cross-checked against code/migrations;
  `lint/test/build` still green (docs-only, so trivially).
- **Risk:** 🟢 Low. **Depends on:** F0.

### F2 — Information Architecture v2
- **Objective:** make the IA *enforce* the wedge — the Briefing is visibly primary;
  browse/lists/discover/people are visibly subordinate.
- **Scope:** nav + route hierarchy decision (desktop header + mobile BottomNav);
  resolve Home-vs-Discover overlap; decide the fate of browse/mood-pages/lists as
  supporting vs. primary; define the empty/low-data behavior of People.
- **Non-scope:** no visual redesign of surfaces (that's F3–F7); no engine changes;
  no route *deletions* without sign-off (Hard Stop: renaming/moving files).
- **Deliverables:** IA decision record (ADR), annotated nav map, redirect plan.
- **Validation:** every route still reachable or intentionally redirected; click-path
  to "tonight's pick" ≤ 1 from any entry; a11y of nav.
- **Risk:** 🟡 Medium (touches routing — the highest-traffic file). **Depends on:** F1.

### F3 — Design System Hardening
- **Objective:** zero drift; locked primitives; one palette.
- **Scope:** retire `HP.amber`/`HP.red`; replace amber/orange ambient gradients
  with brand purple/pink in `router`/`ErrorBoundary`/`SearchBar`/`FilmFile`; fold
  the 2 inline `HP` holdouts into `tokens.js`; finish the Eyebrow rollout (§10);
  primitive API freeze + a reference/showcase page; a11y contrast sweep.
- **Non-scope:** no new surfaces; no engine; don't re-grind already-deliberate
  per-surface variation (memory `project_design_consolidation`).
- **Deliverables:** drift-free tokens, updated `DESIGN_SYSTEM.md`, primitive reference.
- **Validation:** grep proves no amber/orange gradients + no inline `HP`; visual
  baselines re-based deliberately; `lint/test/build` green.
- **Risk:** 🟢 Low–Medium. **Depends on:** F1 (F2 helpful, not required).

### F4 — Landing + Onboarding vNext
- **Objective:** convert in 5 seconds; deliver taste value before commitment.
- **Scope:** landing message/sections tightening (reconcile Pricing vs. "always
  free"; verify Community has no fabricated proof); onboarding "see a pick before
  you finish"; DNA-reveal moment.
- **Non-scope:** engine scoring changes; back-end.
- **Deliverables:** updated landing/onboarding, re-based visual baselines, copy doc.
- **Validation:** visual regression + a11y green; onboarding e2e; manual funnel walk.
- **Risk:** 🟡 Medium (visual-regression-tested surfaces). **Depends on:** F1, F3.

### F5 — Home / Briefing vNext
- **Objective:** make the Briefing feel like a *nightly ritual with one trusted
  pick*, and de-risk the carousel tail.
- **Scope:** Briefing presentation (reason prominence, watch/save/skip clarity,
  "why this is the one"); decide section-tail ordering/trimming; returning-user
  "you've seen this" guard at the UI level.
- **Non-scope:** engine scoring/threshold tuning (that's F8, gated by
  `recommendation-engine` skill + DB-first analysis); the skip→impression write
  contract stays intact.
- **Deliverables:** Briefing vNext, ritual framing, section-tail decision.
- **Validation:** home e2e + recommendations e2e green; impression writes verified;
  a11y; visual.
- **Risk:** 🟡 Medium. **Depends on:** F1, F2, F3.

### F6 — Film File vNext (the moat)
- **Objective:** make "makes its case" real for *every* pick, not one seeded film.
- **Scope:** design the case-making layer (why-for-you, ff_take, critic context,
  mood fingerprint) to degrade gracefully from rich overlay → generated → minimal;
  plan to scale `movies_editorial_overlay` beyond Parasite (generation pipeline,
  not hand-seeding).
- **Non-scope:** schema changes ship via migration with sign-off (Hard Stop);
  no engine scoring changes.
- **Deliverables:** Film File vNext design + overlay-coverage plan + (if approved)
  a migration + edge-function spec for overlay generation.
- **Validation:** renders correctly across coverage tiers; a11y; visual; build.
- **Risk:** 🟠 Medium–High (touches the moat + likely schema/edge work). **Depends on:** F1, F3, F5.

### F7 — Cinematic DNA / Taste Profile vNext
- **Objective:** make taste *visibly* compound — the trust-building "house."
- **Scope:** profile presentation, DNA-confidence framing, cold→warm progression,
  taste-summary quality.
- **Non-scope:** `dnaConfidence` formula change without cross-surface review (shared contract).
- **Deliverables:** Taste Profile vNext, cold-state design.
- **Validation:** consistent DNA number across `/profile` + `/account`; a11y; visual.
- **Risk:** 🟡 Medium. **Depends on:** F1, F3.

### F8 — Recommendation Trust + Evaluation
- **Objective:** be able to *measure* pick quality, then tune deliberately.
- **Scope:** offline evaluation harness (precision/diversity/repeat-rate/
  language-mix/cold-vs-warm); explanation-quality rubric; *then* gated tuning of
  thresholds/weights — **DB-first analysis mandatory** (`recommendation-engine`
  skill); consider modularizing `recommendations.js`.
- **Non-scope:** no UI redesign; no tuning before the harness exists.
- **Deliverables:** eval harness + baseline metrics report + (optional, gated)
  tuning PRs with before/after metrics; ENGINE changelog/`ENGINE_VERSION` resync.
- **Validation:** harness reproducible; every tuning change shows metric movement;
  `lint/test/build` green.
- **Risk:** 🔴 High (engine blast radius). **Depends on:** F1, F5; benefits from F6/F7.

### F9 — Production Hardening
- **Objective:** preview-grade reliability, security, performance, compliance.
- **Scope:** run + green the full e2e/visual/a11y suite; add CSP/security headers
  to Vercel; live Supabase advisor re-check; Lighthouse/web-vitals budget
  enforcement; bundle review; visible TMDB attribution; legal/privacy reconciliation;
  error/empty-state uniformity sweep.
- **Non-scope:** new features.
- **Deliverables:** green e2e, headers, perf budget, compliance memo, security re-check.
- **Validation:** all gates green incl. e2e; Lighthouse meets budget; advisor clean.
- **Risk:** 🟡 Medium. **Depends on:** the surface phases it hardens (F4–F7).

### F10 — Private Preview Readiness
- **Objective:** ship to a small real-user cohort safely.
- **Scope:** invite/allowlist flow, feedback capture, analytics funnels (PostHog),
  Sentry alerting, rollback plan, day-1 runbook, support/legal final.
- **Non-scope:** public GA, paid tiers, social-at-scale (People moat is post-preview).
- **Deliverables:** preview runbook, instrumented funnels, go/no-go checklist.
- **Validation:** dry-run with the dev test user end-to-end; alerting verified;
  rollback rehearsed.
- **Risk:** 🟡 Medium. **Depends on:** F1–F9.

**Dependency spine:** F1 → F2 → (F3 ↘) → F4/F5 → F6/F7 → F8 → F9 → F10.
F3 unblocks all visual phases; F8 should not precede F5 (need the surface to
measure) and must be skill-gated.

---

## 9. Immediate next recommendation

**Do F1 (Product Doctrine + README/Docs Alignment) first.**

**Why:**
1. **The maps are wrong, and a rebuild navigates by maps.** `README.md` is a
   foreign template; `architecture.md` describes a codebase that no longer exists
   (React 18, `-v2`/`-legacy` folders) and frames an *already-resolved* RLS issue
   as an open critical threat. Planning F2–F10 against these docs risks
   re-solving solved problems and mis-scoping real ones. Fixing the docs is the
   cheapest possible way to de-risk every later phase.
2. **The doctrine needs to be settled before IA.** F2 (IA v2) hinges on a single
   question — *what is subordinate to the nightly pick?* — that is a doctrine
   decision, not a code decision. F1 produces that decision artifact.
3. **It is zero-risk and unblocks the research that feeds the design phases.** F1
   is docs-only (no Hard Stops triggered), so it can proceed immediately and in
   parallel with no threat to the green build, while producing the §7 research
   memo that F4–F8 depend on.
4. **It compounds.** An accurate README + architecture + doctrine is the substrate
   every subsequent phase reads at session start (CLAUDE.md literally instructs
   reading these docs first). Getting them right pays interest across the whole
   rebuild.

Concretely, F1's first three commits should be: (1) replace `README.md`;
(2) correct `docs/architecture.md`; (3) reconcile `FeelFlick_Overview.md` +
`PLANNING.md` — each verified line-by-line against code and migrations.

---

## 10. What was intentionally NOT touched (and why)

- **No app code, schema, RLS, migrations, auth, engine scoring, Edge Functions,
  or production config** were changed — F0 is audit-only by mandate.
- **No packages / dependencies** added or removed; no `vite.config.js`,
  `eslint.config.js`, `tailwind.config.js` edits (all Hard Stops).
- **No README rewrite in F0** — only this audit was created. The README *is*
  stale (Supabase template), but rewriting it is the substance of **F1**; doing it
  here would exceed the F0 mandate and pre-empt the doctrine decision. (If a
  minimal pointer to this audit is desired before F1, that's a one-line addition —
  see the closing summary.)
- **The in-progress Eyebrow rollout was left untouched.** This branch was cut from
  `refactor/eyebrow-account-profile`, whose working tree carries uncommitted
  changes (`landing/*`, `movie/sections-top.jsx`, `profile/sections-top.jsx`, the
  new `shared/hooks/useInView.js`). Those are pre-existing WIP, not part of F0, and
  remain exactly as they were.
- **`recommendations.js` was read but not modified.** Any engine change is gated by
  the `recommendation-engine` skill + DB-first analysis and belongs to F8.
- **No formatting churn / unrelated cleanup** — the amber/orange drift, the inline
  `HP` holdouts, and the doc inaccuracies are *documented here* for F1/F3 rather
  than silently fixed.
</content>
</invoke>
