# Movie detail clarity audit

**Date:** 2026-04-27
**Auditor:** Claude (read-only pass — no code changed)
**Scope:** `/movie/:id` — 8 block files + index.jsx orchestration
**Status:** Research complete. Phase 2 requires explicit authorization.

---

## (a) Per-block info inventory

**FFRatingHero** (`FFRatingHero.jsx`)
Renders a single dominant rating number with a quality-tier label and the Sparkles icon. Priority chain: personal (`usePersonalRating` → `personalRating.js`, runtime-computed, ≥10-rating gate + confidence ≥50) → audience (`ff_audience_rating`, Supabase column, confidence ≥50) → critic (`ff_critic_rating`, Supabase column, confidence ≥50) → "Rating pending" fallback. This is the page's "is this good?" lead — it sits inside the hero below the title, and at `text-3xl font-black` it is the numerically dominant element above the fold on mobile.

**RatingBreakdown** (`RatingBreakdown.jsx`)
Collapsed accordion titled "The Numbers" that expands to show all FF scores: personal, critic, audience, community — each with a confidence note and a proportional bar. Also gates the "Exceptional for [genre]" badge on `ff_rating_genre_normalized ≥ 8.0`. Community is gated at confidence ≥60 (inconsistent with the ≥50 threshold everywhere else). Role: deeper "is this good?" — secondary, explicitly requires a tap to reveal, positioned below Your Take in the main column.

**MovieSidebar** (`MovieSidebar.jsx` — four named exports)
Four components: `WhereToWatch` (streaming providers from TMDB `/movie/:id/watch/providers`, JustWatch data, flatrate only), `MovieDetails` (Budget, Revenue, Status, Language — all from TMDB response fields `d.budget`, `d.revenue`, `d.status`, `d.original_language`), `ProductionCompanies` (TMDB `movie.production_companies`, logos), `CollectionCard` (TMDB `movie.belongs_to_collection`, navigates to `/collection/:id`). Role: split — WhereToWatch is pure "should I commit?"; MovieDetails and ProductionCompanies are contextual trivia with limited decision weight. `KeywordsSection` is defined here but never imported or used anywhere — dead code.

**MoodChips** (`MoodChips.jsx`)
Renders `mood_tags` (up to 5), `tone_tags` (up to 3), and `fit_profile` — all stored Supabase columns on `public.movies`, populated by the LLM enrichment pipeline (step 07b, OpenAI structured output). Each tag is a clickable link to a browse route (`/mood/:tag`, `/tone/:tag`, `/browse/fit/:profile`). Role: discover-adjacent — answers "what's the vibe?" and provides cross-navigation exits. Appears once in the hero (index.jsx:539, always rendered when internalMovieData is loaded).

**MovieCast** (`MovieCast.jsx`)
Horizontal scroll of up to 10 cast members: profile photo, actor name, character name. Source: TMDB API `d.credits.cast`, sliced at 10 in index.jsx:147. Role: "what's it about?" — builds anticipation and signals talent tier. Completely TMDB-sourced; no FF data.

**MovieImages** (`MovieImages.jsx`)
Horizontal scroll of up to 6 backdrop stills. Source: TMDB API `d.images.backdrops`, sliced at 6. No captions, no interactivity beyond hover-scale. Role: nominally atmospheric, but the backdrop is already full-bleed in the hero — this block adds scroll weight without answering any user question. The weakest block on the page by purpose-to-space ratio.

**MovieVideos** (`MovieVideos.jsx`)
Grid of up to 6 YouTube video thumbnails (trailers, teasers, clips), filtered to YouTube only. Source: TMDB `d.videos.results`. Links out to YouTube; tracks `trackTrailerPlay` on click. Role: "should I commit?" — trailers are high-decision-weight content. However, the primary trailer is already linked from the hero action bar (`ytTrailer` button at index.jsx:553), so MovieVideos adds depth for users who want alternate cuts or featurettes.

**MovieSimilar** (`MovieSimilar.jsx`)
Grid of up to 12 similar films from TMDB `d.recommendations.results`. Renders poster, title, and TMDB `vote_average` (rounded to 1 decimal, `text-[10px] text-white/40`). Navigation goes to `/movie/:tmdbId`. Role: discover-adjacent — exit ramp. Note: `vote_average` is the **only** external (non-FF) rating rendered anywhere on the MovieDetail page.

---

## (b) Redundancy map

| Field | Block A (line) | Block B (line) | Severity |
|---|---|---|---|
| Genres | Hero genre pills — `hidden sm:flex` (index.jsx:529) | Mobile overview card — `md:hidden` (index.jsx:654) | **MED** — same 4 genre names render for sm–md (640–768px) screens where both conditions are true simultaneously |
| Director / Writer | Hero credits — `hidden sm:block` (index.jsx:501) | Mobile credits card — `sm:hidden` (index.jsx:668) | **MED** — breakpoints overlap slightly at exactly 640px boundary; on sm the hero credits are shown AND the sm:hidden card vanishes, so in practice exclusive — but the data is duplicated in the JSX for no gain |
| Overview | Hero — `hidden md:block line-clamp-3` (index.jsx:542) | Mobile overview card — `md:hidden` (index.jsx:662) | **LOW** — strictly breakpoint-exclusive (md hides the card, md shows the hero text); user never sees both at once |
| Trailer link | Hero action button — `ytTrailer` (index.jsx:554) | MovieVideos first thumbnail (MovieVideos.jsx:19) | **MED** — the same trailer YouTube link is the hero button's `href` AND the first card in the Videos section; user sees two paths to the identical video |
| "Perfect for" moods | MoodPills (movie_mood_scores) — `hidden sm:block` (index.jsx:549) | MoodChips (mood_tags, LLM) — always rendered (index.jsx:539) | **MED** — both chip rows appear simultaneously in the hero at sm+; semantically they say the same thing ("this film has these vibes") from different data sources; user cannot distinguish them |
| Mood tags (mobile) | MoodPills — `sm:hidden` block below hero (index.jsx:684) | MoodChips in hero — always visible (index.jsx:539) | **LOW** — on mobile, MoodPills renders below hero while MoodChips renders in hero; different visual context |

---

## (c) Visual hierarchy — above the fold

### Desktop (≥1280px)

The hero occupies `h-[74vh]`. The content grid begins with `mt-4 md:-mt-6` overlap. First three blocks visible without scrolling:

1. **Hero** — backdrop image + poster + title + FFRatingHero + meta chips + genre pills + MoodChips + overview (line-clamp-3) + MoodPills + action buttons. This is a single composited surface, not a discrete "block" in the content grid sense.
2. **Your Take** (index.jsx:695) — for authenticated watched users this is the first content card. For unauthenticated or not-yet-watched users, it collapses to a ghost placeholder or is absent, making the first real content card…
3. **RatingBreakdown** (index.jsx:773) — collapsed accordion "The Numbers."

**Most visually prominent element — desktop:** The movie title at `text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight tracking-tight drop-shadow-2xl` (index.jsx:491). At ≥1280px this renders at `text-4xl` (36px). The FFRatingHero number is `text-3xl` (30px, index.jsx:43). The title wins by 6px of type size, and its longer string gives it greater visual mass. **The FF rating does not lead — the title does.** This is the single biggest hierarchy concern: FeelFlick's core value proposition (the rating) is one size step below the film title.

### Mobile (≤390px)

Hero is `h-[64vh]`. First viewport contains: backdrop, poster at `h-[120px] w-[80px]`, title at `text-lg` (18px, font-black), FFRatingHero at `text-3xl` (30px, font-black), meta chips, MoodChips, action buttons.

**Mobile hierarchy verdict: the FF rating wins the eye.** At `text-3xl font-black` it is larger than the title (`text-lg`, 18px). The sparkle icon and `/100` suffix make the number unmistakable. The first viewport does answer "is this good?" — this is correct and should be preserved. The desktop hierarchy should be brought to match this behavior by enlarging FFRatingHero, not by shrinking the title.

---

## (d) FF 5-score rendering

### ff_critic_rating
- **Column:** Real stored Supabase column (`smallint 0–100`), added migration `20260429000000_split_rating_scores.sql`.
- **FFRatingHero.jsx:29** — rendered as primary when personal and audience unavailable, gated on `ff_critic_confidence >= 50`. Font: `text-3xl font-black text-white`. ✅ Confidence gate correct.
- **RatingBreakdown.jsx:33** — always added to rows if non-null, regardless of confidence. Font (expanded): `text-lg font-bold text-white`. ⚠️ No confidence gate on the row value — a `ff_critic_confidence` of 10 and 95 display at identical visual weight.

### ff_audience_rating
- **Column:** Real stored Supabase column (`smallint 0–100`), same migration.
- **FFRatingHero.jsx:25** — primary when no personal, gated on `ff_audience_confidence >= 50`. Font: `text-3xl font-black`. ✅ Correct.
- **RatingBreakdown.jsx:43** — always added to rows if non-null. ⚠️ Same no-confidence-gate issue as critic.
- **MovieCardRating.jsx:24** — carousel cards (not on detail page) with confidence ≥50. ✅

### ff_community_rating
- **Column:** Real stored Supabase column (`smallint 0–100` after `20260430000000_upgrade_community_rating.sql`). Populated nightly by step 10 satisfaction pipeline.
- **RatingBreakdown.jsx:53** — shown in expanded rows only when `ff_community_confidence >= 60`. At confidence <60, shows a "Gathering ratings…" placeholder row instead. Font when visible: `text-lg font-bold text-white`. ✅ Gated, but uses threshold **60**, not 50 — inconsistent with critic/audience.
- **NOT in FFRatingHero** — community does not participate in the hero priority chain. This is defensible (community is a satisfaction composite, not a quality signal) but undocumented.

### ff_personal_rating
- **NOT a DB column.** Runtime-computed by `personalRating.js`, cached in `user_profiles_computed.personal_ratings` (JSON map keyed by movie_id).
- **Activation gate:** `MIN_RATINGS_FOR_PERSONAL = 10` ratings in `user_ratings`. Returns null below that threshold; both FFRatingHero and RatingBreakdown gracefully fall back.
- **FFRatingHero.jsx:21** — renders as primary when `personalRating.confidence >= 50`. Font: `text-3xl font-black text-white`. Label: "Your Match". ✅
- **RatingBreakdown.jsx:22** — shown as top row in purple (`text-purple-300`, `bg-purple-400` bar). ✅
- **Cold-start behavior is correct** — 4 scores render for users with <10 ratings; personal activates once gate is met. No change needed.
- The "Your Take" card (index.jsx:697) shows the user's own raw star rating from `user_ratings` — this is a different thing from `ff_personal_rating` and correctly appears separately.

### ff_rating_genre_normalized
- **Column:** Real stored Supabase column (`numeric`), populated by data pipeline. Not created in any tracked migration (pre-existing or pipeline-managed).
- **RatingBreakdown.jsx:74** — used as threshold only (`>= 8.0`), renders as a badge label "Exceptional for [genre]" on the collapsed header. **Never displayed as a number.**
- **MovieCardRating.jsx:33** — "TOP" badge on carousel cards. Not used in MovieDetail.
- ⚠️ `ff_rating_genre_normalized` is fetched in the `index.jsx:261` select but never rendered as a score to the user — only as a binary badge. Its numerical value is invisible.

### External rating comparison
TMDB `vote_average` renders in MovieSimilar at `text-[10px] text-white/40` — the smallest, lowest-contrast text on the page. All FF scores in FFRatingHero are at `text-3xl font-black text-white` — dramatically larger. **No external rating competes with FF scores in the hero or content area.**

---

## (e) External ratings

| Source | Block | Line | Field | Visual prominence | Vs FF score |
|---|---|---|---|---|---|
| TMDB `vote_average` | MovieSimilar | MovieSimilar.jsx:34–36 | `m.vote_average` from TMDB recommendations | `text-[10px] text-white/40` — smallest text on page, barely legible | Loses completely to FFRatingHero `text-3xl font-black` |

**No other external ratings render on the page.** IMDB rating, Rotten Tomatoes, Metacritic, and Trakt do not appear anywhere in MovieDetail. The deprecated `ff_rating` and `ff_final_rating` columns are fetched (index.jsx:261) but never rendered.

**Verdict:**

| Source | Verdict | Reason |
|---|---|---|
| TMDB `vote_average` (MovieSimilar) | **KEEP_RELEGATED** | Already at lowest visual weight; removing it would strip the only quality signal from "More like this" cards which have no FF data. Relegate is the right call — it's already there. |
| IMDB / RT / Metacritic | **REMOVE (don't add)** | Not currently rendered. Do not add them to RatingBreakdown as a "compare to" row — it would visually compete with FF scores and undermine FeelFlick's differentiated rating identity. |

---

## (f) Screenshots

![Desktop view](./assets/2026-04-27-movie-detail-555604-desktop.png)
*(Aditya to capture: Chrome ≥1280px, `/movie/555604`, signed in as a user with ≥10 ratings so personal rating activates)*

![Mobile view](./assets/2026-04-27-movie-detail-555604-mobile.png)
*(Aditya to capture: Safari 390px or Chrome DevTools → iPhone 14 Pro, `/movie/555604`, same user)*

**Chosen TMDB id: 555604 (Guardians of the Galaxy Vol. 3, 2023).** Rationale: high IMDB vote count (800k+) means `ff_audience_rating` and `ff_critic_rating` are almost certainly populated with high confidence; it has a large cast (10 credited actors with photos), multiple trailers on YouTube, 12+ TMDB recommendations, and belongs to a collection (MCU) which exercises `CollectionCard`. If GotG3 doesn't have FF ratings in the database, substitute TMDB id 238 (The Godfather) which is certain to have full external data. Note the chosen id can change — the audit conclusions are not TMDB-id-dependent.

---

## Recommended Phase 2 changes

### 1. Blocks to remove

- **MovieImages** — 6 backdrop stills duplicate the hero's full-bleed backdrop and answer no user question. The block adds ~300px of scroll height with zero decision value. Remove entirely. The hero already provides the visual atmosphere.
- **`KeywordsSection` in MovieSidebar.jsx** — defined at lines 102–122 but never imported or rendered. Delete the dead export.

### 2. Blocks to consolidate

**Merge MoodChips (LLM mood_tags/tone_tags/fit_profile) + MoodPills ("Perfect for", movie_mood_scores) into a single chip row in the hero.** MoodChips absorbs MoodPills — both say "this film's vibe is X", and users cannot distinguish which table the data comes from. The merged block renders: fit_profile badge first, then LLM mood_tags, then "Perfect for" moods from movie_mood_scores, then tone_tags. Remove the duplicate `sm:hidden` MoodPills block below the hero on mobile (index.jsx:683–687) — the merged hero chip row handles all screen sizes.

**Merge the mobile overview card + mobile credits card** (index.jsx:650–680) into a single "Quick take" card on mobile. They always appear together, have identical styling, and splitting them wastes a card border.

### 3. Hierarchy reorder

Current main-column render order after hero:
`[mobile overview] → [mobile credits] → [mobile mood tags] → [mobile where-to-watch] → [Your Take] → [RatingBreakdown] → [MovieCast] → [MovieVideos] → [MovieImages] → [MovieSimilar]`

**Proposed order — no changes to hero or sidebar:**
1. `[mobile quick-take card]` — merged overview + credits (mobile only)
2. `[mobile mood tags]` — remove once MoodChips/MoodPills merge lands
3. `[mobile where-to-watch]` — stays (decision-critical for mobile)
4. `[Your Take]` — stays (first content block for logged-in watched users)
5. `[RatingBreakdown]` — stays
6. `[MovieCast]` — stays
7. `[MovieVideos]` — stays
8. `[MovieSimilar]` — **move before MovieImages** (discovery exit > gallery)
9. ~~`[MovieImages]`~~ — removed

The current order is almost correct; the only structural change is moving MovieSimilar before MovieImages (which is being removed anyway).

### 4. External-rating treatment

**RELEGATE to a single subordinate row** — which is already the status quo. The only external rating rendering (TMDB `vote_average` in MovieSimilar at `text-[10px] text-white/40`) is already maximally relegated. Enforce this as a standing rule: no new external rating sources are added to the page. The dead fetch of deprecated `ff_rating` and `ff_final_rating` in index.jsx:261 should be removed from the select query to prevent accidental re-introduction.

### 5. ff_personal_rating cold-start handling

**Confirm hide-until-active.** The current implementation is correct: `personalRating.js` returns null below 10 ratings, both FFRatingHero and RatingBreakdown fall back gracefully, and 4 scores render for sub-10-rating users. No change needed to the activation logic. One small inconsistency to fix: the community confidence gate in RatingBreakdown is 60, while critic and audience use 50. Normalize all three to 50 (matching FFRatingHero), or explicitly document the 60 threshold in a code comment explaining why community requires higher confidence.

### 6. Estimated Phase 2 implementation time

| Change | Time |
|---|---|
| Remove MovieImages block from index.jsx and delete MovieImages.jsx | 15 min |
| Delete KeywordsSection dead export from MovieSidebar.jsx | 10 min |
| Merge mobile overview + credits into one "quick take" card | 30 min |
| Merge MoodChips + MoodPills into single chip row (reconcile two data sources, remove duplicate mobile block, update tests) | 2h |
| Move MovieSimilar before MovieImages in render order | 5 min |
| Remove deprecated ff_rating + ff_final_rating from index.jsx select query | 10 min |
| Normalize community confidence gate from 60 → 50 in RatingBreakdown | 10 min |
| Fix RatingBreakdown to hide (not just note) low-confidence critic/audience values | 30 min |
| **Desktop hero: enlarge FFRatingHero to match or exceed title size** | 30 min |

**Total: ~4.5 hours.** Well within the 16-hour budget. Phase 2 is a single session.

**One flag before authorizing:** The desktop hierarchy issue in (c) — FF rating is `text-3xl` while title is `text-4xl` — is the highest-priority single change. If Aditya authorizes only one thing from this audit, it should be making the FFRatingHero number dominant on desktop (e.g., bump to `text-4xl` or `text-[2.5rem]`, or apply the brand gradient color to the number). Everything else is structural cleanup; this one changes the page's identity.
