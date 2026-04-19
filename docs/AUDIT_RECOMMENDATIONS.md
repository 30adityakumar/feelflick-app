# FeelFlick Recommendation Engine Audit

**Date:** 2026-04-19
**Engine version:** 2.8
**Scope:** `/home` (HomePage.jsx) and `/discover` (DiscoverPage.jsx)
**Files audited:** recommendations.js (5,302 lines), 8 homepage components, DiscoverPage.jsx (1,198 lines), 6 hooks, 1 edge function

---

## 1. Home Architecture

### 1.1 Row Inventory (render order)

HomePage.jsx renders **4 rows** in this order:

| # | Row | Component | Data Hook | Service Function | Scoring | Quality Floor | Vote Floor | Embedding Boost | Fallback |
|---|-----|-----------|-----------|-----------------|---------|--------------|-----------|----------------|----------|
| 0 | Hero Top Pick | `HeroTopPick.jsx` | `useTopPick()` | `getTopPickForUser()` | `scoreMovieForUser(…, 'hero')` | ff_audience_rating >= 72 + ff_final_rating >= 7.2 | >= 500 | 0-70 | Language tier 1 > tier 2 > null |
| 1 | Because You Watched | `BecauseYouWatchedSection.jsx` | `useBecauseYouWatchedRows()` | `getBecauseYouWatchedRows()` | `scoreMovieForUser(…, 'because_you_watched')` | min_ff_rating: 70 (embedding RPC) | via embedding | Included in seed similarity | Returns [] (row hidden) |
| 2 | Hidden Gems | `HiddenGemsRow.jsx` | `useHiddenGems()` | `getHiddenGemsForUser()` | `scoreMovieForUser(…, 'hidden_gems')` + gem bonus | ff_audience_rating >= 72 | 1,000-5,000 | 0-60 | `getHiddenGemsFallback()` |
| 3 | New & Noteworthy | `TrendingForYouRow.jsx` | `useTrendingForYou()` | `getTrendingForUser()` | `scoreMovieForUser(…, 'trending')` | ff_audience_rating >= 70 | >= 300 | 0-50 | `getTrendingFallback()` |

### 1.2 Unreachable Rows (code exists, not rendered)

These service functions and components exist in the codebase but are **not mounted** in HomePage.jsx:

| Row | Component | Service Function | Status |
|-----|-----------|-----------------|--------|
| Quick Picks | `QuickPicksRow.jsx` | `getQuickPicksForUser()` | Dead code |
| Mood Carousel | `MoodCarouselRow.jsx` | `getMoodRecommendations()` | Dead code (homepage context) |
| Favorite Genres | (none found) | `getFavoriteGenresForUser()` | Dead code |
| Slow Contemplative | (none found) | `getSlowContemplativeForUser()` | Dead code |
| Quick Watches | (none found) | `getQuickWatchesForUser()` | Dead code |

### 1.3 Row Details

#### Row 0: Hero Top Pick

- **Candidate pools:** (1) Embedding neighbors — 80 per seed; (2) Base quality — year 2019-2024, ff_audience_rating >= 72, vote_count >= 500; (3) Discovery pool — discovery_potential >= 60, ff_audience_rating >= 65; (4) Interest-gated — animation/documentary/family if user prefers
- **Base quality cap:** 72 (taste signals differentiate, not raw quality)
- **Exclusions:** All watched (id + tmdb_id), 48h impression block, 7d skip block (hard-exclude < 8.5 rating, else -40), permanent skip >= 3 times (-30), session genre penalty (-10/genre)
- **Language guard:** STRICT/STRONG/LOOSE from watch history. STRICT injects 1 discovery slot at position 10 (non-primary, >= 8.5 norm, >= 1000 votes)
- **Selection:** Weighted random — top pick wins 65%, top 3 compete
- **Min/max:** Returns exactly 1 movie. Fallback tiers: same-language (ff_audience_rating >= 65, vote_count >= 50) > global (ff_audience_rating >= 80, >= 2020) > null
- **Logging:** `recommendation_impressions` with placement='hero'

#### Row 1: Because You Watched

- **Seed selection:** Fetch 50 recent watches + ratings. Priority: user_rating >= 8 > user_rating >= 7 > source='onboarding' > ffFinalRating DESC. Max 2 seeds.
- **ffFinalRating formula:** `ff_audience_rating / 10 ?? ff_final_rating ?? ff_rating ?? 0` (misleading var name)
- **Per-seed query:** Embedding search via `match_movies_by_seeds` RPC, match_count = limitPerSeed + 10, min_ff_rating = 70
- **Row label:** "Because you **loved** [title]" if user_rating >= 8, else "Because you **watched** [title]"
- **Min/max:** 0-2 rows of 20 movies each. Returns [] if no valid seeds (row hidden via `hideWhenEmpty`)
- **Logging:** `logRowImpressions` (not called — TODO: verify)

#### Row 2: Hidden Gems

- **Candidate pools:** (1) Classic gems — ff_audience_rating >= 72, ff_confidence >= 60, vote_count 1K-5K, no genre filter, limit 100; (2) Cult gems — same + cult_status_score >= 60, limit 50; (3) Embedding neighbors — client-side filtered to vote_count 1K-5K
- **Gem bonus:** popularity < 10: +25, < 20: +18, < 30: +10; cult_status_score >= 70: +20
- **Min/max:** 20 movies. Fallback: `getHiddenGemsFallback(limit)`
- **Logging:** `logRowImpressions(…, 'hidden_gems')`

#### Row 3: New & Noteworthy (Trending)

- **Candidate pools:** (1) Recent popular — year >= currentYear-2, ff_audience_rating >= 70, ff_confidence >= 60, vote_count >= 300, order by popularity DESC, limit 100; (2) This year — year === currentYear, same thresholds, limit 50; (3) Embedding neighbors — client-side filtered year >= currentYear-1
- **Min/max:** 20 movies. Fallback: `getTrendingFallback(limit)`
- **Logging:** `logRowImpressions(…, 'trending')`

### 1.4 scoreMovieForUser Breakdown (18 dimensions)

All home rows share this scoring function. The `rowType` parameter only affects:
- `'hero'`: caps base quality at 72, enables polarization penalty

| # | Dimension | Range | Key Behavior |
|---|-----------|-------|-------------|
| 1 | Base quality | 0-90+ (hero: cap 72) | `ff_audience_rating/10 ?? ff_final_rating ?? ff_rating ?? 7.0` then `* 10` |
| 2 | Discovery bonus | 0-20 | discovery_potential >= 60 AND user watchesHiddenGems |
| 3 | Polarization penalty | 0 or -20 | Hero only, polarization_score >= 70 |
| 4 | Accessibility | 0-15 | accessibility_score + abandonment history |
| 5 | Starpower | 0 or 15 | Low-confidence users + starpower_score >= 70 |
| 6 | Cult status | -15 to +20 | cult_status_score + user profile |
| 7 | Language match | -50 to +50 | Primary/secondary/region affinity |
| 8 | Genre match | -30 to +40 | avoided(-30), fatigued(-10), preferred(+13, cap 40), top(+10), secondary(+4) |
| 9 | Content match | 0-40 | Pacing, intensity, depth, dialogue, attention, VFX alignment |
| 10 | Themes/keywords | 0-15 | +3 per keyword match |
| 11 | People | 0-50 | Director +20-50, lead actor +5-20 |
| 12 | Era & runtime | varies | Era preference + runtime preference |
| 13 | Recency | 0-15 | 6-tier year decay |
| 14 | Quality bonus | 0-33 | ff_audience_rating tiers (+25/+18/+10/+4) + vote_count bonus (+8/+4) |
| 15 | Seed similarity | 0-capped | Embedding + metadata similarity |
| 16 | Negative signals | varies | Skip genre penalty, skip person penalty, feedback penalties |
| 17 | Diversity penalty | -5 to -20 | Overlap with seed films |
| 18 | Feedback signals | varies | Thumbs up/down, post-watch sentiment (v2.4) |
| 19 | Fit profile | -25 to +12 | franchise_entry fatigue, challenging_art mismatch (v2.6) |
| 20 | User satisfaction | -20 to +15 | Aggregated community feedback, requires confidence >= 60 (v2.7) |

### 1.5 Which Rows Use mood_tags / tone_tags / fit_profile?

| Signal | Hero | Because Watched | Hidden Gems | Trending |
|--------|------|----------------|-------------|----------|
| mood_tags | NO | NO | NO | NO |
| tone_tags | NO | NO | NO | NO |
| fit_profile | YES (via dim 19) | YES (via dim 19) | YES (via dim 19) | YES (via dim 19) |

**Finding:** mood_tags and tone_tags are **completely unused on /home**. They only participate via `scoreMoodAffinity()` in the Discover flow. This means the enrichment pipeline that populates mood_tags and tone_tags on movies provides zero value to the homepage — a significant gap.

### 1.6 Which Rows Use ff_personal_rating vs ff_audience_rating?

No row uses `ff_personal_rating` directly. The primary quality signal chain is:

```
ff_audience_rating (0-100, preferred)
  → ff_final_rating (0-10, fallback)
    → ff_rating (0-10, last resort)
      → 7.0 (hardcoded default)
```

`ff_audience_rating` is used for:
- All quality floor filters (hero >= 72, gems >= 72, trending >= 70)
- Base quality score calculation (dimension 1)
- Quality bonus tiers (dimension 14)
- Seed selection priority in BecauseYouWatched

### 1.7 User History Tier Analysis

#### 0 watches (cold start)

| Row | Visible? | Behavior |
|-----|----------|----------|
| Hero | YES | Base quality pool only (no embeddings). No language guard. Fallback tier 2: ff_audience_rating >= 80, >= 2020. Starpower boost active. |
| Because Watched | NO | Returns [] — no seeds exist. Row hidden. |
| Hidden Gems | YES | No embedding neighbors, but classic + cult pools still query. No language guard. Generic high-quality gems. |
| Trending | YES | No embedding neighbors, but recent popular + this year pools still query. Generic trending. |

**Cold start homepage:** Hero + Hidden Gems + Trending = 3 rows. No personalization. Content is identical for all new users with no onboarding prefs.

#### 5 watches

| Row | Visible? | Behavior |
|-----|----------|----------|
| Hero | YES | Embeddings from 3-4 seeds. Language guard forming (likely LOOSE or no guard). Content/genre alignment emerging. |
| Because Watched | MAYBE | Needs >= 1 qualifying seed (watched, not onboarding-only). If user rated any >= 7, row appears. |
| Hidden Gems | YES | Embedding neighbors now contribute. Genre alignment starts. |
| Trending | YES | Embedding neighbors contribute. Personalization emerging. |

#### 50 watches

| Row | Visible? | Behavior |
|-----|----------|----------|
| Hero | YES | Full personalization. 8 seeds. Language guard likely STRICT or STRONG. All 20 scoring dimensions active. |
| Because Watched | YES | 2 seed rows based on highest-rated films. Strong embedding neighborhood. |
| Hidden Gems | YES | Fully personalized with embedding + gem bonus. |
| Trending | YES | Fully personalized. |

### 1.8 Redundancy Analysis

**Hidden Gems vs Slow Contemplative:** Not comparable — Slow Contemplative is dead code (not rendered). No redundancy on the live homepage.

**Hidden Gems vs Trending overlap risk:** Low. Hidden Gems requires vote_count 1K-5K (hard cap); Trending requires vote_count >= 300 with recency focus. The vote count ranges can overlap (1K-5K range), but Trending's year filter (currentYear-2) and popularity sort create natural separation from the "hidden" quality of gems.

**Hero vs all rows:** Hero has the strongest filters (ff_audience_rating >= 72, vote_count >= 500, year 2019-2024) and weighted random selection. Overlap is possible but unlikely to cause visible repetition since PersonalizedCarouselRow deduplicates by tmdb_id.

**Gap:** With only 4 rows, the homepage is thin. The 5 dead-code row types (Quick Picks, Mood Carousel, Favorite Genres, Slow Contemplative, Quick Watches) would add variety but are unreachable.

---

## 2. Discover Architecture

### 2.1 Flow Diagram

```
                          DiscoverPage.jsx
                         4-Stage Wizard UI
                                |
    ┌───────────────────────────┼───────────────────────────┐
    |                           |                           |
Stage 0: Mood              Stage 1: Dials            Stage 2: Context
 - 12 moods (id 1-12)       - Intensity (1-5)         - Viewing context (1-5)
 - Free-text input           - Pacing (1-5)            - Experience type (1-5)
 - [optional NL parse]       - Time of day             |
    |                           |                      "Find my movies"
    |   ┌───────────────────────┘                           |
    |   |  useNLMoodParse()                                 |
    |   |  POST → ai-mood-context (action:'parse')          |
    |   |  gpt-4.1-mini, temp 0.1, max 60 tokens            |
    |   |  Returns: {intensity, pacing} or null (3s timeout) |
    |   └───────────────────────┐                           |
    |                           |                           |
    └───────────────────────────┼───────────────────────────┘
                                |
                        Stage 3: Results
                                |
               ┌────────────────┼────────────────┐
               |                |                |
       useMoodSession()   useRecommendations()  useAIMoodContext()
       INSERT mood_sessions    |                 POST → ai-mood-context
               |                |                gpt-4.1-mini, temp 0.8
               |                |                stream: narration + explanations
               |                |                (2s fallback text)
               |                |
               |     getMoodRecommendations()
               |                |
               |        ┌───────┼───────┐
               |        |               |
               |   computeUser     loadMoodData()
               |   Profile()       (discover_moods + genre_weights)
               |        |               |
               |        └───────┬───────┘
               |                |
               |     fetchMoodCandidates()
               |        |
               |        | DB query: movies WHERE
               |        |   is_valid = true
               |        |   poster_path IS NOT NULL
               |        |   tmdb_id IS NOT NULL
               |        |   ff_rating_genre_normalized >= 6.5
               |        |   ff_confidence >= 40
               |        |   + language guard (profile)
               |        |   + mood-specific (e.g. mood 12: year <= 2000)
               |        |   ORDER BY ff_rating_genre_normalized DESC
               |        |   LIMIT 300
               |        |
               |        | Client-side: keep movies with >= 1 mood genre
               |        | If < 15 candidates → fallback to TMDB API
               |        |
               |     Per-candidate scoring:
               |        |
               |        |  combined = 0.55 * scoreMovieForUser(movie, profile, 'mood')
               |        |           + 0.45 * scoreMoodAffinity(movie, moodId, moodData, params)
               |        |
               |        | Sort by combined DESC, take top 5
               |        |
               |     Normalize match_percentage:
               |        |   65 + (combined / maxCombined) * 34  →  range 65-99%
               |        |
               |     Return 5 movies with final_score + match_percentage
               |
        useRecommendationTracking()
               |
        INSERT recommendation_events per movie shown
        UPDATE on click / watch / watchlist / rate
```

### 2.2 scoreMoodAffinity Breakdown (max ~125 points)

| # | Component | Range | Formula |
|---|-----------|-------|---------|
| 1 | Mood tag intersection | 0-45 | `min(matches * 15, 45)` — preferred_tags vs movie.mood_tags |
| 2 | Tone tag intersection | 0-10 | `min(toneMatches * 5, 10)` — preferred_tones vs movie.tone_tags |
| 3 | Avoided tag penalty | -20 per match | Hard penalty for mood-incompatible tags |
| 4 | Genre affinity | 0-25 | `min(25, sum(weight * 10))` per mood_genre_weight |
| 5 | Pacing alignment | -15 to 0 | `max(-15, -(|moviePacing - targetPacing| / 8))` |
| 6 | Intensity alignment | -15 to 0 | Same formula as pacing |
| 7 | Viewing context | -10 to +15 | Lookup table `CONTEXT_MODIFIERS[ctx][mood]` |
| 8 | Experience type | 0-15 | Function `EXPERIENCE_MODIFIERS[expType](movie)` |
| 9 | Time of day | 0 or +5 | Morning/afternoon/evening/night mood pairings |

**Combined weight:** 55% scoreMovieForUser + 45% scoreMoodAffinity

### 2.3 Dial Impact Analysis — "Cozy" (mood_id=1)

**Pacing/Intensity alignment penalty formula:**
```
targetPacing = (pacing_dial / 5) * 100
penalty = max(-15, -(|moviePacing100 - targetPacing| / 8))
```

**Scenario: "Cozy" mood, a movie with pacing_score_100=30, intensity_score_100=25**

| Dial Setting | Target Pacing | Pacing Penalty | Target Intensity | Intensity Penalty | Total Mood Penalty |
|-------------|--------------|----------------|-----------------|-------------------|-------------------|
| intensity=1, pacing=1 | 20 | -(10/8) = -1.25 | 20 | -(5/8) = -0.63 | -1.88 |
| intensity=3, pacing=3 | 60 | -(30/8) = -3.75 | 60 | -(35/8) = -4.38 | -8.13 |
| intensity=5, pacing=5 | 100 | -(70/8) = -8.75 | 100 | -(75/8) = -9.38 | -15 (capped) |

The penalty spread for this movie from dial=1 to dial=5 is **-1.88 vs -15** — a delta of ~13 points.

**But this penalty operates on the 45%-weighted mood score.** In the combined formula:
```
penalty_impact = 0.45 * 13 = ~5.9 points on the combined score
```

**For context:** Base quality alone can contribute 60-90 points (55% weight = 33-50 combined). The dial delta of ~6 points represents roughly **10-18%** of a typical combined score.

**Estimated overlap analysis for Cozy, intensity=1/pacing=1 vs intensity=5/pacing=5:**

- Tag intersection (0-55) and genre affinity (0-25) are **identical** regardless of dials — these are the dominant mood signals
- Viewing context and experience type are **identical** regardless of dials
- Only pacing/intensity alignment changes — max delta of ~6 combined points
- The 55% user profile score is **identical** regardless of dials

**Predicted overlap: 70-85%.** Dials shift rankings at the margins but rarely promote a completely different film into the top 5. The tag intersection (up to 45 points at 45% weight = 20 combined points) dominates, making the 6-point dial delta a secondary signal.

**Verdict:** Dials have **weak but measurable impact**. They won't surface fundamentally different films — they'll reorder borderline candidates within the same mood-aligned pool.

### 2.4 Free-Text Path Impact

Free-text is parsed by `ai-mood-context` edge function (gpt-4.1-mini, temperature 0.1, 60 tokens) into `{intensity, pacing}` overrides.

**Impact chain:** Free text → LLM → override intensity/pacing dials → same 6-point max delta as manual dial adjustment.

Free-text **cannot** change: mood selection, viewing context, experience type, time of day. It only adjusts the two weakest signals (pacing/intensity alignment).

**Verdict:** Free-text has **minimal impact on output**. It's a UX affordance, not a recommendation lever.

### 2.5 fit_profile Gating in Discover

`fit_profile` is checked inside `scoreMovieForUser()` (dimension 19), which Discover calls with 55% weight. There is **no additional fit_profile logic** in `scoreMoodAffinity()` or `fetchMoodCandidates()`.

**Does it suppress crowd_pleaser for arthouse moods?** No. The only suppressions are:
- `franchise_entry` + user has `franchiseFatigue` → -25 (at 55% weight = -13.75 combined)
- `challenging_art` + user has no arthouse history + dominant preference elsewhere → -8 (at 55% weight = -4.4 combined)

There is no mood-specific fit_profile gating. A crowd_pleaser comedy surfaces identically for "Dark" and "Cozy" moods — only the mood_tags/tone_tags intersection differentiates.

### 2.6 Language Guard in Discover

Same system as homepage. Language openness computed from watch history:

| Openness | Condition | Allowed Languages | DB Filter |
|----------|-----------|-------------------|-----------|
| STRICT | primaryDominance >= 80% | primary + top 1-2 | eq() or in() |
| STRONG | primaryDominance 50-80% | primary + top 3 | in() |
| LOOSE | primaryDominance < 50% | >= 4 languages | No filter (wide open) |
| Cold start | No history | [] | No filter |

**Impact on candidate pool size:** With LIMIT 300 and ff_rating_genre_normalized >= 6.5:
- No filter: ~300 candidates (diverse languages)
- STRICT (1 language, e.g. English): ~200-250 candidates (English-dominant catalog)
- STRICT (1 language, e.g. Korean): ~15-40 candidates (may trigger TMDB fallback)

**Risk:** Non-English STRICT users can easily fall below the 15-candidate threshold, triggering the TMDB API fallback which uses completely different data (no FeelFlick enrichment, no mood_tags, no ff_audience_rating). This is a quality cliff.

---

## 3. Shared vs Distinct Logic

### 3.1 What's Shared

| Component | Home | Discover | Notes |
|-----------|------|----------|-------|
| `computeUserProfile()` | YES | YES | Same function, 60s memory cache shared |
| `scoreMovieForUser()` | YES (100% weight) | YES (55% weight) | Same 20-dimension scoring |
| Language guard | YES | YES | Same openness classification |
| `movies` table | YES | YES | Same candidate source |
| `recommendationCache` | YES | YES | Same caching layer |
| fit_profile scoring | YES | YES | Same dimension 19 logic |

### 3.2 What's Distinct

| Component | Home | Discover |
|-----------|------|----------|
| Mood affinity scoring | NO (`scoreMoodAffinity` not called) | YES (45% weight) |
| mood_tags / tone_tags | NOT USED | Used in scoreMoodAffinity |
| Pacing/intensity dials | NOT USED | Affects mood penalty (weak) |
| Viewing context / experience type | NOT USED | +0 to +15 points per modifier |
| Embedding search | YES (per-row) | NO (not in discover) |
| Candidate pool strategy | Multiple specialized pools per row | Single pool (ff_rating_genre_normalized >= 6.5, limit 300) |
| Quality floor | ff_audience_rating >= 70-72 | ff_rating_genre_normalized >= 6.5 |
| LLM calls | NONE | 2 (dial parse + narration/explanations) |
| Session tracking | `recommendation_impressions` | `mood_sessions` + `recommendation_events` + `mood_session_abandoned` |

### 3.3 Is Discover Built on Top of Home?

**Partially yes.** Discover reuses the core infrastructure:
- `computeUserProfile()` — identical
- `scoreMovieForUser()` — identical (rowType='mood' has no special behavior)
- Language guard — identical

But Discover has its own:
- Candidate fetching (`fetchMoodCandidates` — no embeddings, different quality floor)
- Scoring layer (`scoreMoodAffinity` — 45% blend)
- Session management (different tables)
- AI integration (narration + explanations)

**Architecture:** Discover is a **sibling** of the homepage rows, not a child. Both inherit from the same scoring engine but diverge at the candidate selection and blending layers.

---

## 4. Identified Quality Issues (prioritized)

### P0 — Critical

#### 4.1 Dials are cosmetic (pacing/intensity have ~6pt combined impact)

**Problem:** The pacing and intensity dials contribute a maximum of ~6 combined points out of typical scores of 40-80+. Tag intersection (20 combined points) and base quality (33-50 combined points) dominate. Users interact with dials expecting meaningful output changes but get ~70-85% overlap between extreme settings.

**Root cause:** The penalty formula `max(-15, -(diff / 8))` at 45% weight produces tiny deltas. The 55/45 user/mood split further dilutes dial influence because the user score is dial-independent.

**Impact:** Users lose trust in the system. "I moved the slider and got the same movies" is a common abandonment pattern.

#### 4.2 Free-text input is nearly decorative

**Problem:** Free text only modifies pacing and intensity dials (already weak). It cannot change mood selection, genres, tags, or any high-impact signal. A user typing "I want something like Wes Anderson but darker" gets the same effective adjustment as moving a slider.

**Root cause:** The LLM parse (gpt-4.1-mini, 60 tokens) outputs only `{intensity, pacing}`. No semantic understanding flows into candidate selection or scoring.

**Impact:** The textarea promises natural-language understanding but delivers slider automation.

#### 4.3 Homepage ignores mood_tags and tone_tags entirely

**Problem:** The enrichment pipeline populates mood_tags and tone_tags on every movie, but `scoreMovieForUser()` never reads them. These signals only activate through `scoreMoodAffinity()` in Discover. The homepage — which most users see most often — gets zero benefit from mood/tone enrichment.

**Root cause:** mood_tags/tone_tags were designed for the Discover flow and were never integrated into the homepage scoring dimensions.

**Impact:** Homepage recommendations are mood-blind. A user who just finished a melancholy film gets the same "Because You Watched" results regardless of whether the seed film's mood aligns with the recommendations.

### P1 — High

#### 4.4 Discover has no embedding search

**Problem:** Homepage uses `match_movies_by_seeds` RPC for embedding-based similarity (pgvector cosine). Discover's `fetchMoodCandidates()` does a flat table scan ordered by `ff_rating_genre_normalized DESC`. This means Discover can't find films that are mood-similar at the embedding level — it only gets quality-ranked films that happen to share a mood genre.

**Root cause:** `fetchMoodCandidates` was built before embeddings were integrated into the homepage engine and was never upgraded.

**Impact:** Discover surfaces "good films in the right genre" rather than "films that feel similar." A user selecting "Dark" gets high-rated thrillers/horror, not necessarily films with dark *tone*.

#### 4.5 Five dead-code row types waste enrichment

**Problem:** `getQuickPicksForUser`, `getFavoriteGenresForUser`, `getSlowContemplativeForUser`, `getQuickWatchesForUser`, and the MoodCarousel component exist with full scoring logic but are never rendered. The service functions log impressions that never fire.

**Root cause:** Rows were built speculatively or disabled during iteration and never cleaned up or re-enabled.

**Impact:** Wasted code surface. The homepage is thin (4 rows) while 5 additional row types rot unreachable.

#### 4.6 Non-English STRICT users hit TMDB fallback cliff

**Problem:** Discover limits candidates to 300 with a language guard filter. For STRICT users watching primarily in Korean, Japanese, Hindi, etc., the intersection of (language filter + ff_rating_genre_normalized >= 6.5 + mood genre match) can drop below 15, triggering a TMDB API fallback. TMDB fallback movies lack mood_tags, tone_tags, fit_profile, and all FeelFlick enrichment — `scoreMoodAffinity` scores them near 0 on tags.

**Root cause:** Candidate pool of 300 is sized for English-dominant catalogs. No enrichment-aware fallback exists.

**Impact:** Non-English users get noticeably worse Discover results. The quality cliff is invisible — no error, just degraded recommendations.

### P2 — Medium

#### 4.7 match_percentage is cosmetically inflated (65-99% range)

**Problem:** `match_percentage = min(99, round(65 + (combined / maxCombined) * 34))`. The minimum is 65% even for the worst result in any set. The top result is always ~99%. Users cannot distinguish strong vs weak matches.

**Root cause:** Intentional UX decision to avoid showing "low" percentages, but the 34-point range (65-99) provides almost no information.

**Impact:** Users see "87% match" and "92% match" and cannot tell if the difference is meaningful. The metric trains users to ignore it.

#### 4.8 BecauseYouWatched seed rating variable is misnamed

**Problem:** Line 3847: `ffFinalRating: movie.ff_audience_rating != null ? movie.ff_audience_rating / 10 : (movie.ff_final_rating ?? movie.ff_rating ?? 0)`. The variable is named `ffFinalRating` but preferentially uses `ff_audience_rating`.

**Root cause:** Variable name wasn't updated when ff_audience_rating was promoted to primary in v2.5.

**Impact:** Maintenance confusion. Low severity but symptomatic of rating signal naming drift across the codebase.

#### 4.9 Discover CONTEXT_MODIFIERS mood IDs don't match UI mood names

**Problem:** The comment block (line 3443-3444) says mood IDs are: 1=Cozy, 2=Adventurous, 3=Futuristic, 4=Thoughtful, 5=Whimsical, 6=Enlightened, 7=Musical, 8=Romantic, 9=Suspenseful, 10=Silly, 11=Dark, 12=Nostalgic. But the DiscoverPage UI (line 30-43) defines: 1=Cozy, 2=Adventurous, 3=Heartbroken, 4=Curious, 5=Nostalgic, 6=Energized, 7=Anxious, 8=Romantic, 9=Inspired, 10=Silly, 11=Dark, 12=Overwhelmed.

**Every mood ID from 3-9 and 12 is mismatched between the scoring constants and the UI.** For example:
- User selects "Heartbroken" (UI id=3) → scoring applies "Futuristic" context modifiers
- User selects "Nostalgic" (UI id=5) → scoring applies "Whimsical" context modifiers
- User selects "Overwhelmed" (UI id=12) → scoring applies "Nostalgic" modifiers (including year <= 2000 filter)

**Root cause:** The CONTEXT_MODIFIERS and time-of-day mappings were written against a different mood ID scheme than the current UI.

**Impact:** **This is a functional bug masquerading as P2.** Context modifiers, experience modifiers, time-of-day bonuses, and the Nostalgic year filter are all applying to the wrong moods. Actual severity is P0 but categorized here because the max impact per signal is only 5-15 points.

#### 4.10 Discover doesn't deduplicate against homepage

**Problem:** Discover and homepage maintain separate tracking tables (`recommendation_events` vs `recommendation_impressions`). Neither system checks the other's shown history. A user who saw a film on the homepage hero and then enters Discover can see it again.

**Root cause:** The two systems evolved independently. Discover only filters by `watchedIds` (from user_movie_status), not by homepage impressions.

**Impact:** Cross-surface repetition. Low severity because Discover is a distinct intentional action, but repeat impressions waste limited recommendation slots.

---

## 5. Cold-Start Analysis

### 5.1 Empty Profile Defaults

```
languages.primary:      null      → no language guard
genres.preferred:        []        → from onboarding prefs only
contentProfile:          all 5s   → neutral pacing/intensity/depth
affinities:              empty    → no director/actor signal
themes:                  empty    → no keyword matching
fitProfileAffinity:      {}       → no franchise fatigue, no art bias
qualityProfile:
  totalMoviesWatched:    0
  watchesHiddenGems:     false    → no discovery bonus
  avgFFRating:           null
meta.confidence:         'none'   → starpower boost disabled (needs 'low')
meta.onboardingWeight:   3.0      → high influence from onboarding picks
```

### 5.2 Cold-Start Experience by Surface

#### /home with 0 watches

| Row | State | Content |
|-----|-------|---------|
| Hero | Shows 1 film | Base quality pool only. ff_audience_rating >= 72, vote_count >= 500, year 2019-2024. No embeddings. No language bias. Effectively "best rated recent film" globally. |
| Because You Watched | HIDDEN | No seeds. Row not rendered. |
| Hidden Gems | Shows 20 films | Classic + cult gem pools (ff_audience_rating >= 72, vote 1K-5K). No embedding neighbors. No language bias. Same for all new users. |
| Trending | Shows 20 films | Recent popular (year >= currentYear-2, ff_audience_rating >= 70, vote >= 300). No embedding neighbors. No language bias. Same for all new users. |

**Assessment:** 3 visible rows, ~41 films. Entirely unpersonalized. Content is identical for every new user regardless of location, language, or onboarding selections (onboarding genres only affect scoring, not candidate pools). Acceptable for first session but risks showing irrelevant language content to non-English users.

#### /discover with 0 watches

| Component | State | Content |
|-----------|-------|---------|
| Mood selection | Works normally | 12 moods available |
| Dials | Default intensity=3, pacing=3 | Free-text parse has no profile context |
| Candidates | 300 films, no language filter | All languages, ff_rating_genre_normalized >= 6.5 |
| User scoring (55%) | Minimal differentiation | No genre/content/people/language preferences. Base quality dominates. |
| Mood scoring (45%) | Fully active | mood_tags, tone_tags, genre weights all work without user history |

**Assessment:** Discover actually works *better* for cold-start users than homepage, because `scoreMoodAffinity()` doesn't depend on user history. The mood signal (45% weight) provides real differentiation even with zero watches. However, the lack of language guard means non-English-speaking users may get primarily English results.

### 5.3 Onboarding Integration

- Onboarding movies are excluded from language profile computation (prevents English leakage from English-dominant onboarding catalog)
- Onboarding weight starts at 3.0, decays to 1.5 after 50+ watches
- Onboarding movies with `source='onboarding'` are tier-3 seeds for BecauseYouWatched (lowest priority)
- If user has ONLY onboarding movies (no real watches), profile is treated as empty (`buildEmptyProfile`)

**Gap:** Onboarding genre preferences are computed but only used in scoring (dimension 8: genre match). They don't influence candidate pool queries. A user who selects "I love horror" during onboarding still sees the same candidate pool as one who selects "I love romance" — just scored differently within that pool.

---

## 6. Recommendations

### R1: Make dials meaningful (addresses 4.1, 4.2)

**Current state:** Dials contribute ~6 combined points. Tag intersection contributes ~20.

**Proposal:** Either:
- (a) Increase pacing/intensity weight by changing the penalty formula from `max(-15, -(diff/8))` to `max(-30, -(diff/4))` — doubles the penalty range per dimension, quadruples sensitivity. This would make dial delta ~24 combined points, comparable to tag intersection.
- (b) Move to a two-phase model: dials filter candidates (exclude movies with >40-point pacing/intensity mismatch) before scoring. This guarantees different pools for different dial settings.
- (c) Expand free-text parsing to output genre preferences, tag preferences, and specific film references — not just intensity/pacing overrides.

**Expected impact:** Users moving dials from 1 to 5 would see <40% overlap instead of 70-85%.

### R2: Fix mood ID mismatch (addresses 4.9)

**Current state:** CONTEXT_MODIFIERS, EXPERIENCE_MODIFIERS, getTimeOfDayBonus, and the mood 12 year filter all use stale mood IDs that don't match the UI.

**Proposal:** Remap all scoring constants to match the current UI mood IDs (Cozy=1, Adventurous=2, Heartbroken=3, Curious=4, Nostalgic=5, Energized=6, Anxious=7, Romantic=8, Inspired=9, Silly=10, Dark=11, Overwhelmed=12). This also means moving the year <= 2000 filter from mood 12 (now Overwhelmed) to mood 5 (now Nostalgic).

**Expected impact:** Context modifiers, time-of-day bonuses, and experience modifiers will actually match user intent. Currently they're decorrelated.

### R3: Bring mood_tags / tone_tags to homepage (addresses 4.3)

**Current state:** mood_tags and tone_tags are only used in Discover.

**Proposal:** Add a new scoring dimension to `scoreMovieForUser()` that computes mood coherence between a candidate and the seed films (for BecauseYouWatched) or between a candidate and the user's recent mood history (from mood_sessions table). Even a lightweight +/- 10 point signal would improve homepage relevance.

**Expected impact:** "Because You Watched [melancholy film]" would favor other contemplative films over action blockbusters.

### R4: Add embeddings to Discover (addresses 4.4)

**Current state:** Discover does a flat table scan. Homepage uses pgvector cosine similarity.

**Proposal:** After `fetchMoodCandidates()` returns the base pool, run a secondary embedding search using mood-representative seed films (e.g., the top 3 films for that mood by tag match count) to find tonally similar films that may not share a genre.

**Expected impact:** Discover surfaces films based on *feel* not just genre. A "Cozy" query could find a warm sci-fi or a gentle documentary that the genre filter would miss.

### R5: Clean up dead rows or ship them (addresses 4.5)

**Current state:** 5 row types exist as fully implemented dead code.

**Proposal:** Either remove the dead code (reduce maintenance surface) or re-enable the most valuable rows. Candidates for revival:
- **Quick Watches** (runtime < 90min) — high utility for time-constrained users
- **Slow Contemplative** — differentiating, mood-aligned, would benefit from mood_tags integration

**Expected impact:** Richer homepage with more varied recommendation surfaces.

### R6: Non-English candidate pool resilience (addresses 4.6)

**Current state:** 300-limit pool with language filter can fall below 15 for non-English STRICT users, triggering unenriched TMDB fallback.

**Proposal:** (a) Increase pool limit to 500 for non-English language guards. (b) When pool < 30 (not 15), progressively relax quality floor from 6.5 to 5.5 before falling back to TMDB. (c) If TMDB fallback fires, log it as a quality event for monitoring.

**Expected impact:** Non-English users stay on the enriched pipeline. TMDB fallback becomes rare.

### R7: Compress match_percentage range (addresses 4.7)

**Current state:** 65-99% for all results.

**Proposal:** Use the raw combined score distribution to compute percentiles within the full candidate pool (not just top N). Display as "Top 5% match" / "Top 15% match" — relative to all films, not just shown films. Alternatively, widen the display range to 40-99%.

**Expected impact:** Users can distinguish strong from weak recommendations. The metric becomes informative.

---

## Appendix A: Key File Index

| File | Lines | Role |
|------|-------|------|
| `src/app/homepage/HomePage.jsx` | 106 | Entry point — mounts 4 rows |
| `src/app/homepage/components/HeroTopPick.jsx` | ~850 | Hero single-movie selection + skip tracking |
| `src/app/homepage/components/BecauseYouWatchedSection.jsx` | 83 | Orchestrates seed rows |
| `src/app/homepage/components/HiddenGemsRow.jsx` | 40 | Hidden gems row wrapper |
| `src/app/homepage/components/TrendingForYouRow.jsx` | 40 | Trending row wrapper |
| `src/app/homepage/components/PersonalizedCarouselRow.jsx` | 114 | Shared carousel wrapper (dedup, filtering, empty state) |
| `src/app/homepage/components/QuickPicksRow.jsx` | ~40 | DEAD CODE — not rendered |
| `src/app/homepage/components/MoodCarouselRow.jsx` | ~40 | DEAD CODE — not rendered |
| `src/app/pages/discover/DiscoverPage.jsx` | 1,198 | 4-stage wizard UI |
| `src/shared/hooks/useRecommendations.js` | 650+ | React hooks for all recommendation data fetching |
| `src/shared/hooks/useNLMoodParse.js` | 75 | Free-text → dial override via LLM |
| `src/shared/hooks/useAIMoodContext.js` | 136 | AI narration + per-movie explanations |
| `src/shared/hooks/useMoodSession.js` | 98 | Mood session lifecycle tracking |
| `src/shared/hooks/useRecommendationTracking.js` | 110 | Discover event tracking |
| `src/shared/services/recommendations.js` | 5,302 | Core engine — profile, scoring, candidates |
| `supabase/functions/ai-mood-context/index.ts` | 222 | Edge function — LLM parse + narration |

## Appendix B: Logging Table Usage

| Table | Written By | Surface | Fields |
|-------|-----------|---------|--------|
| `recommendation_impressions` | `logImpression()` (hero), `logRowImpressions()` (other home rows) | /home | user_id, movie_id, placement, shown_at, pick_reason_type, pick_reason_label, score, algorithm_version, seed_movie_id |
| `mood_sessions` | `useMoodSession()` | /discover | user_id, mood_id, viewing_context_id, experience_type_id, energy_level, intensity_openness, time_of_day, day_of_week, device_type |
| `recommendation_events` | `useRecommendationTracking()` | /discover | mood_session_id, user_id, movie_id, rank_position, recommendation_score, shown_at, clicked_at, watched_at, added_to_watchlist_at, rating |
| `mood_session_abandoned` | DiscoverPage unmount handler | /discover | user_id, selected_mood_id, reached_stage, had_free_text |
