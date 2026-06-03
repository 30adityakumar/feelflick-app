# FeelFlick — Film File Case-Making vNext (F6A Design + Plan)

> Phase F6A of the rebuild. **Design + data-contract + implementation plan only —
> no behavior change.** It designs how `/movie/:id` (the "Film File") makes its
> case so a recommendation feels *justified*, before F6B implements it.
>
> Read alongside [product-doctrine.md](product-doctrine.md) and
> [home-briefing-vnext-f5.md](home-briefing-vnext-f5.md).
>
> **Date:** 2026-06-03 · **Status:** design (F6A). Implementation deferred to F6B.

---

## 0. Headline correction to the F0 assumption

F0 framed the Film File as "the rich editorial overlay appears seeded for only one
film." **That is misleading.** F6A inspection found the case-making layer is
already rich, tiered, and degrades gracefully — and there is an **automatic,
lazy overlay-generation pipeline already wired**. The genuine gaps are narrower
than "build it from scratch" (see §3). This document is the accurate current-state
map for the Film File; treat it as superseding the F0 "one film" shorthand.

---

## 1. Current-state map

### Route + data-loading flow
- Route: `/movie/:id` → [`MovieDetail.jsx`](../src/features/movie/MovieDetail.jsx)
  (the entry is `MovieDetail`, not `Movie.jsx`). Data: [`useMovieData.jsx`](../src/features/movie/useMovieData.jsx)
  (`useMovieDataFetch(id)`), provided via `MovieDataProvider`.
- `:id` is the **TMDB id**. The page works for any TMDB film, in-catalog or not.

### Data sources
| Source | Provides |
|---|---|
| **TMDB** (`getMovieDetails` + release_dates + watch/providers + person credits) | title, overview, tagline, runtime, genres, cert, languages, poster/backdrop, **trailer/videos**, cast, **similar/recommendations**, budget/revenue, crew (director/writer/dop/composer), **streaming providers** |
| **Supabase `movies`** (`filmDbRow`, `MOVIE_ENGINE_COLS`) | `mood_tags`, `tone_tags`, `fit_profile`, `ff_critic_rating`, `ff_audience_rating`, `llm_*` numerics (pacing/intensity/depth/dialogue/attention), `director_name` |
| **Engine** (`computeUserProfile` + `scoreMovieForUser` + `computeMatchPercent`) | per-user **match %** (`mv.ffMatch`), Pairs-With + Director-shelf reranking |
| **Derived** (pure fns) | `deriveWhyReasons` (Why-this-fits-you cards), `deriveMoodAxes` (6-axis Mood Radar), `boundaryWarnings` (content boundaries the user set that this film matches) |
| **`movies_editorial_overlay`** | curated/auto editorial fields (see below) |
| **`user_settings` / hooks** | content boundaries; `useTasteFingerprint`, `useDirectorAffinity`, `useFriendsLoved`, `useTasteTwin`, `useUserRating` |

### `movies_editorial_overlay` fields (public-read, service-role-write)
`why_for_you` JSONB `{ eyebrow?, headline?, rationale, reasons:[{id,icon,title,detail,moodKey}] }` ·
`mood_fingerprint` JSONB `[{name,weight,hex}]` · `ff_take` JSONB `{body,byline,meta}` ·
`critic_quotes` JSONB `[{quote,author,outlet}]` · `film_palette` JSONB · `daypart_fit` TEXT ·
`hero_signature` TEXT · `arc_points` JSONB · provenance (`curated_by/at`, `updated_at`).

- **Auto-generated** (any *visited* catalog film, lazily, then cached): `ff_take`,
  `critic_quotes`, `daypart_fit` — via the existing
  [`generate-movie-overlay`](../supabase/functions/generate-movie-overlay/index.ts)
  edge function (`requestOverlayGeneration` in `useMovieData`, fired when
  `needsOverlayGeneration(overlay)`), **OpenAI key server-side only**, persisted via
  service-role.
- **Curated only** (currently **Parasite**): the *rich* `why_for_you`,
  `mood_fingerprint`, `film_palette`, `hero_signature`, `arc_points`.

### Current UI section order (`MovieDetail.jsx`)
`MovieHero` (poster/title/meta/ratings/match-ring/actions) → **`WhyForYou`**
(`overlay.why_for_you.reasons ?? deriveWhyReasons`) → `YourTake` (rate) →
`TheTake` (`ff_take`) → `CriticQuotes` (`critic_quotes`) → `MoodRadar`
(`overlay.mood_fingerprint ?? deriveMoodAxes`) → `Synopsis` → `Providers` →
`Videos` → `FriendsLoved` → `TasteTwinReview` → `PairsWith` → `Cast` →
`DirectorShelf` → `Timeline` → `Details` → `Footer`. Plus `StickyActionBar`,
`ScrollProgress`, `FilmGrain`, `PageSkeleton`, `PageError`.

### State variance
| Condition | Effect |
|---|---|
| **Direct `/movie/:id`** | Full page; engine match % only if signed in + in-catalog. |
| **From Home/Briefing** | Same data layer (no special hand-off; `engineReason` is a Home concept, not re-shown here). |
| **Unauthenticated** | No match %, no boundaries, no personalized Why (header → "Sign in to see how it lines up"); Why = descriptive cards; similar/dir-shelf = TMDB order. Overlay still loads/generates (anon key). |
| **Cold-start (signed in, <5 rated)** | `fingerprint` null → Why = descriptive cards + "Rate 5+ to unlock"; match % may compute but weak. |
| **Not in `movies` catalog** | No `filmDbRow` → no mood/fit/llm signals, no overlay/generation, no match %; page still renders from TMDB. |

### What's tracked
`trackTrailerPlay`, `trackShare`, rating writes (`YourTake`), watchlist/watched
toggles (`useUserMovieStatus`). **No `recommendation_impressions` logging on
`/movie`** (Film File views don't feed the engine's impression model — an F8-class
observation, not an F6 task).

---

## 2. Current case-making layer (what exists today)

| Surface | Source | Degrades to |
|---|---|---|
| **Home `WhyThisPick`** (F5) | `film.engineReason` (pickReason.label) | nothing on cold-start |
| **`WhyForYou`** (Film File) | `overlay.why_for_you` → `deriveWhyReasons` (mood overlap, fit match, director affinity, runtime — personalized cards bubble above descriptive) | descriptive film cards; header adapts (anon / cold-start / warm via `deriveWhyHeader`) |
| **`TheTake`** | `ff_take` (auto/curated) | hidden when null |
| **`CriticQuotes`** | `critic_quotes` (auto/curated) | hidden when null |
| **`MoodRadar`** | `overlay.mood_fingerprint` → `deriveMoodAxes(llm_*)` | hidden when no LLM signal |
| **Match ring / ratings** | `mv.ffMatch` (engine), `ff_critic/audience_rating` | self-hide when null |
| **`boundaryWarnings`** | user boundaries × film | empty when none / anon — *this is the honest "skip tonight if…" mechanism* |
| **`heroReason.js` / `briefScoring.js`** | engine reason generators (used by Home/Briefing, not the Film File) | "Picked for you" |

**The degradation is real and already coded** (`overlay ?? derived`, every section
self-hides, `deriveWhyReasons` is documented to "never fabricate").

---

## 3. The case-making gap (precise)

1. **The lead case prose (`why_for_you`) is curated-only.** The auto-generator
   produces `ff_take`/`critic_quotes`/`daypart_fit` but **not** the rich
   `why_for_you`. So for ~every non-Parasite film the "why this fits you" is
   `deriveWhyReasons` — good, honest cards, but a *list of signals*, not a single
   confident narrative case.
2. **The case is distributed across four sections** (`WhyForYou`, `TheTake`,
   `CriticQuotes`, `MoodRadar`) with `YourTake` wedged between. There is **no single
   primary "this is why we chose it" card that leads** — the user assembles the case
   themselves from four blocks.
3. **`critic_quotes` framing risk.** The auto-generated quotes are *deliberately
   invented friend-voice personas* (prompt: "invent a persona… **No real critic
   names**", author like "A weekend viewer"). They do **not** impersonate real
   critics — but they render in a section named **"CriticQuotes"** with
   `author · outlet` review styling, which can read as fabricated *reviews*. The
   doctrine forbids "fake critic claims," so the **framing** must change (label them
   honestly as voices/reactions, not critic reviews) even though the content is
   non-impersonating.
4. **Parasite placeholders in `data.js`.** `TIMELINE` + `DNA_DELTA` are hard-coded
   Parasite data. `TimelineSection` *correctly gates* `TIMELINE` to Parasite only
   (not fabricated elsewhere), and `DNA_DELTA` backs a locked/projected card — but
   these are stale placeholders to clean up.
5. **No `/movie` impression logging.** (F8-class; noted, not fixed in F6.)

---

## 4. Tiered case hierarchy (formalized — degrade gracefully)

The design ratifies what mostly exists and names the tiers so F6B can lead with the
strongest available case and fall back cleanly. **Never fabricate; never overstate.**

- **Tier 1 — Rich editorial case** (curated overlay present): lead with curated
  `why_for_you` (FeelFlick take, why-this-fits, mood fit, "what kind of night",
  before-you-press-play) + `ff_take` + `mood_fingerprint`. *Source:* hand-curation
  (Parasite today) and, later, a generated `why_for_you` (Option C).
- **Tier 2 — Personalized + auto-generated case** (signed-in, in-catalog, fingerprint
  present): lead with the **strongest `deriveWhyReasons` card** + the engine
  **match %** + auto `ff_take` + `MoodRadar` + `daypart_fit` + `boundaryWarnings`.
  Existing safe signals only — no hallucinated facts, no fake confidence, no fake
  critic claims. **Most films land here.**
- **Tier 3 — Minimal honest case** (anon / cold-start / off-catalog): the film's
  *standalone* profile (mood/tone/fit/runtime, descriptive `deriveWhyReasons`), an
  honest "why generally worth considering," **what's missing** ("we don't have your
  taste yet"), and **how to improve future picks** ("rate 5+ films / sign in").
  `deriveWhyHeader` already produces this copy.

---

## 5. UI information hierarchy proposal (design only — F6B implements)

Goal: the case **leads**, supports the single-pick ritual, and never becomes a data
dump. Prefer reasons over numbers; numbers only when meaningful + explainable.

1. **Hero** — poster, title, meta (year · runtime · director · cert), one trust line
   (match % *with a plain-language gloss* when present; otherwise the FF
   critic/audience chip, self-hiding).
2. **Primary case card (NEW, consolidated)** — the single "Why this is the one":
   the lead reason (Tier 1 `why_for_you.rationale` / Tier 2 strongest derived card /
   Tier 3 honest standalone), with the match % inline. This is the F6B centerpiece.
3. **Why this fits you** — the remaining `deriveWhyReasons` cards (mood / fit /
   director / runtime), personalized-above-descriptive.
4. **Mood fit** — `MoodRadar` (kept; self-hides without LLM signal).
5. **Taste signals** — FriendsLoved / TasteTwin (self-hiding social proof, real).
6. **Before you press play** — `boundaryWarnings` (honest "skip tonight if…") +
   `daypart_fit` ("best on a quiet weeknight") + runtime/era caveats.
7. **FeelFlick take** — `ff_take`, framed as an editorial hook (subjective, not fact).
8. **Voices** — *reframed* `critic_quotes` (honest "what it feels like to watch,"
   clearly not critic reviews) — or drop if it can't be framed honestly.
9. **Trailer / actions**, **Your rating** (`YourTake`), **Watchlist/log**.
10. **Supporting rows** — Synopsis, Providers (real TMDB only), Videos, Pairs-With,
    Cast, Director shelf, Timeline (gated/real), Details.
11. **Fallback / unauth / cold-start** — Tier 3 copy; sign-in / rate-more nudges; no
    locked teasers that imply data we don't have.

Rules honored: no streaming claims beyond real TMDB providers; no certainty
language; honest caveats surfaced (boundaries, "first time this director shows up
for you," "rate 5+ to personalize").

---

## 6. Data contracts for F6B

### Safe to use now (reliable, honest)
TMDB metadata (title/overview/runtime/genres/cert/poster/backdrop/trailer/cast/
providers); `movies.{mood_tags,tone_tags,fit_profile,llm_*,ff_critic_rating,
ff_audience_rating,director_name}`; engine `ffMatch` (when signed-in + in-catalog);
`deriveWhyReasons` / `deriveMoodAxes` outputs; `boundaryWarnings`; overlay
`ff_take` / `daypart_fit`; curated `why_for_you` / `mood_fingerprint` /
`hero_signature` / `film_palette` when present.

### Unreliable / sparse (handle carefully)
- `why_for_you` (rich) — **Parasite only** today; F6B must lead with it *when present*
  and degrade to derived otherwise.
- `critic_quotes` — invented personas; **framing risk** (see §3.3) → reframe, don't
  present as critic reviews.
- `data.js` `TIMELINE` / `DNA_DELTA` — Parasite placeholders (gated/locked); clean up.
- `mv.ffMatch` — null for off-catalog/anon; the gloss must explain absence, not fake it.

### New fields possibly needed later (NOT in F6B unless Option C)
- A generated `why_for_you` (would need an Edge-Function prompt addition) — Option C.
- `release_timeline` JSONB (per-film, to retire the Parasite `TIMELINE` fallback) — later.

### Constraints (already satisfied — verify, don't change)
- **OpenAI key:** server-side only in `generate-movie-overlay` (Supabase secret);
  client calls the function with the **anon** key. **Never** add `VITE_OPENAI_*`.
- **No hallucinated/unverified claims stored or shown:** `ff_take` = subjective hook
  (OK); `critic_quotes` = invented personas (reframe); no fabricated facts/dates/box-
  office/critic names.
- **TMDB attribution/compliance:** posters/backdrops/metadata are TMDB; `/terms`
  already attributes "uses the TMDB API but is not endorsed or certified by TMDB."
  Providers come from TMDB `watch/providers` (real, region US) — keep the JustWatch
  link/attribution; do not assert availability beyond what TMDB returns.
- **RLS:** `movies_editorial_overlay` is **public-SELECT, service-role-write**
  (verified in `20260517000000_add_movies_editorial_overlay.sql`). No new
  table/policy is needed for Options A/B. Option C touches only the Edge Function
  (writes via service-role) — no schema/RLS change.

**No schema, RLS, migration, or Edge-Function change is made in F6A.**

---

## 7. Overlay coverage assessment

- **`ff_take`/`critic_quotes`/`daypart_fit`:** generated **lazily on first visit** of
  any catalog film, then cached. Coverage = "films that have been opened," not the
  whole catalog. No bulk pre-generation exists (and F6 will not add one).
- **`why_for_you` (rich) / `mood_fingerprint` / `film_palette` / `hero_signature` /
  `arc_points`:** **curated only** (Parasite). No generation path exists.
- Implication: F6B should **not** depend on rich `why_for_you` coverage. Lead with it
  *when present*; otherwise the consolidated primary case is built from Tier-2 derived
  signals (which exist for every in-catalog film).

---

## 8. F6B implementation options

### Option A — UI-only, existing fields (LOWEST RISK) — **recommended for F6B**
- **Scope:** add a single consolidated **Primary Case card** that leads with the best
  available reason (Tier 1 `why_for_you.rationale` → Tier 2 strongest derived card +
  match-% gloss → Tier 3 honest standalone); reframe `CriticQuotes` honestly (or hide);
  clean up the `data.js` Parasite placeholders; tighten cold-start/anon copy. Reorder
  to put the case first per §5.
- **Non-scope:** no schema, no Edge Function, no generation, no engine/scoring, no new
  data fields.
- **Files likely touched:** `MovieDetail.jsx` (order), `sections-top.jsx` (new case
  card + CriticQuotes reframe), `derive/whyForYou.js` (maybe a "primary reason"
  selector), `data.js` (remove/quarantine placeholders), `movie.css`.
- **Data contracts:** read-only use of existing fields; no writes change.
- **Risks:** low — visual/copy only; `/movie` a11y + the recommendations e2e
  (poster→`/movie`) must stay green; Film File is **not** visual-baseline tested.
- **Tests:** `deriveWhyReasons`/`deriveWhyHeader` contract tests (added in F6A as a
  baseline); a primary-case-selector test in F6B.
- **Validation:** lint/test/build + authenticated `/movie` e2e (a11y + poster nav).

### Option B — Overlay read-path hardening + fallback (MEDIUM)
- **Scope:** everything in A + a formal Tier-1/2/3 resolver that prefers curated
  `why_for_you`, surfaces `daypart_fit`/`ff_take` in the primary case, and renders a
  consistent "before you press play" block. Still **no new generation**.
- **Non-scope:** no Edge Function / schema / generation.
- **Risk:** medium (more of the page restructured). Recommended only if A proves too
  thin.

### Option C — Extend generation to `why_for_you` (HIGHER RISK — separate gated phase)
- **Scope:** add a `why_for_you` (and optionally `mood_fingerprint`) generation path
  to the `generate-movie-overlay` Edge Function so non-curated films get a richer Tier-1
  case; validation + honesty guards in the prompt; optional bulk backfill script.
- **Non-scope of F6B:** this is **not** F6B. It touches an Edge Function + OpenAI
  prompt + (optional) a backfill pipeline → must go through the `supabase-change`
  skill + DB-first review + honesty review of generated prose.
- **Risk:** higher — generated narrative prose raises the hallucination bar; needs
  careful prompt + validation so it never asserts unverified facts.

**Recommended order:** **F6B = Option A** (UI-only, ship the consolidated honest
primary case on existing data). Defer **Option C** to a later gated phase (after F8's
recommendation-trust/eval work, or as a dedicated `supabase-change` phase) once we
want generated `why_for_you` coverage.

---

## 9. Recommended F6B scope (explicit)

**In scope (F6B = Option A):**
- A consolidated **Primary Case card** that leads the Film File, tier-aware.
- Honest reframing (or removal) of the `critic_quotes` "CriticQuotes" section.
- Cleanup of `data.js` Parasite placeholders; verify `TimelineSection`/locked cards
  degrade honestly off-Parasite.
- Tightened anon / cold-start / off-catalog copy (Tier 3).

**Explicit non-scope (F6B):**
- No schema/RLS/migration; no Edge Function change; no overlay generation change; no
  `why_for_you` generation (Option C, later); no engine/scoring/`ENGINE_VERSION`; no
  route/IA/auth/packages; no bulk data generation; no broad redesign of other surfaces.

---

## 10. Validation plan (for F6B)
- `npm run lint && npm run test && npm run build` green.
- Authenticated `/movie/:id` e2e: a11y (0 non-contrast serious/critical) + the
  recommendations e2e (poster → `/movie/:id`) + watchlist e2e still green.
- Manual pass across the four states: warm signed-in, cold-start, anonymous,
  off-catalog (e.g. an obscure TMDB id) — confirm graceful degradation, no fabricated
  case, no fake critic claims, no false streaming claims.
- Film File is **not** visual-baseline tested — note in the F6B report.

## 11. Risks & open questions
- **Hallucination/honesty:** `ff_take` (subjective hook, OK) vs `critic_quotes`
  (invented personas — reframe). Any Option-C generated `why_for_you` must be
  fact-free narrative, prompt-guarded.
- **Coverage:** lazy generation means a cold first-visit shows the Tier-2 derived case
  before `ff_take` merges in — F6B's primary card must read well on the derived path
  alone.
- **Match-% literacy:** the number must carry a plain gloss; never imply certainty.
- **Open question:** keep `critic_quotes` (reframed as "voices/reactions") or drop it?
  → decide in F6B; default to honest reframe, drop if it can't be made unambiguous.
- **Open question:** is a `release_timeline` field worth adding to retire the Parasite
  `TIMELINE` fallback? → later, not F6B.
</content>
