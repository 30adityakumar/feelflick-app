# F8A — Recommendation Trust + Evaluation Foundation

> **Phase F8A. Evaluation-first — NO engine tuning.** This document and its
> companion code (`src/shared/services/eval/`, `scripts/eval/`,
> `docs/sql/recommendation-evaluation-queries.sql`) build the *measurement*
> layer that must exist **before** any scoring change. F8A does not alter
> scoring, thresholds, ranking, `ENGINE_VERSION`, schema, RLS, edge functions,
> prompts, routes, auth, or UI. The first phase allowed to *tune* is **F8B**,
> and it is gated by the `recommendation-engine` skill (DB-first analysis).
>
> The wedge this protects: *mood-first, taste-deep — a single justified nightly
> pick that makes its case. Anti-scroll.* You cannot defend "makes its case" or
> "the right film" without being able to measure whether the case is honest and
> the fit is real. Today that question is answered by vibes (F0 risk #3). This
> closes that gap.

**Status:** ✅ foundation shipped (harness + SQL + rubric + baseline).
**Date:** 2026-06-03. **Engine:** `recommendations.js` `ENGINE_VERSION = '2.17'` (unchanged).

---

## 1. Current-state map — how a pick is made, justified, and tracked

### 1.1 The scoring spine (read-only inventory)

| Module | LOC | Role |
|---|---|---|
| `recommendations.js` | 6,714 | The monolith. `computeUserProfile` / `computeUserProfileV3`, `scoreMovieForUser`, `getTopPickForUser` (the hero), all row builders, impression logging. |
| `scoringV3.js` | 448 | `scoreMovieV3` — the 7-dimension scorer (embedding, fit, mood, director_genre, content, quality, negative). |
| `briefScoring.js` | 311 | Discover brief → weights/filters/seeds + `generateBriefReason`. |
| `heroReason.js` | 131 | `generateHeroReason` (the hero's "why"), era floor, tie-break sort. |
| `homepageRows.js` | 842 | Row assembly for /home. |
| `embeddingScoring.js` | 135 | pgvector cosine-neighbor scoring. |
| `diversity.js` | 131 | `diversifyRow`, `selectHeroCandidates`, `dayHashIndex`, `softDedupe`. |
| `skipSignals.js` | 120 | Skip recency decay, surface severity, cooldown sets. |
| `exclusions.js` | 256 | Watched / hard-exclude / de-rate filtering. |
| `qualityTiers.js` | 69 | Quality-tier gating. |
| `matchScore.js` | 114 | `computeMatchPercent` — the displayed Match %. |
| `fitAdjacency.js`, `dnaConfidence.js`, `feedback.js`, `interactions.js` | — | Fit graph, DNA confidence, thumbs feedback, interaction logging. |

The pick: `getTopPickForUser` scores hero candidates, filters to `_score ≥ 65`,
diversifies (`selectHeroCandidates`), then **weighted-random** over the top set
(day-hash stable per user/day) — #1 wins ~65%. Diversity penalties:
same-director −12, same-genre −8, same-decade(±2y) −4.

### 1.2 Where the pick "makes its case" (the explanation surfaces)

| Surface | Source | Shape |
|---|---|---|
| /home Briefing | `engineReason` ← `pickReason.label` (`generateHeroReason`) | one line: `Because you loved {seed}` / `More from {director}` / `Matches your taste for {tag} films` / fit label / `{genre} at its best` / **`Picked for you`** (generic fallback). |
| /home `WhyThisPick` (F5) | renders `film.engineReason` | null-safe; no fabrication on cold-start. |
| Discover | `generateBriefReason` | `Similar to {anchor}` / `{Genre} with a {tag} edge` / `Feels {feeling}` / `{Genre} at its best` / `Close to your taste profile` / `{Genre} pick for your brief`. |
| /movie Film File (F6B) | `PrimaryCaseCard` (`ff_take` → `deriveWhyHeader` → standalone) + `deriveWhyReasons` cards + `MoodRadar` + boundary warnings | the rich, tiered case; never fabricates. |
| Match % (everywhere) | `computeMatchPercent` | calibrated 0–99, **hidden** below engine-score 50; honest-by-design (top picks land 75–88%, 95%+ reserved for true outliers). |

`generateHeroReason` thresholds (the bar each reason must clear): embedding ≥65
(needs a named seed), director_genre ≥90, mood ≥85, fit ==100, quality ≥85 —
else `"Picked for you"`. So the *type* is grounded by construction, but the
prose is short and templated (F0 risk #2).

### 1.3 What gets tracked (the evaluation substrate)

| Table | Written by | Captures |
|---|---|---|
| `recommendation_impressions` | `logRowImpressions` / `logSurfaceImpressions` (home + discover) | what was SHOWN per surface: `placement`, `pick_reason_type/label`, `score`, `seed_movie_id`, `embedding_similarity`, `algorithm_version`, + outcome flags `skipped/clicked/marked_watched/added_to_watchlist` set later by `updateImpression`. Feeds skip signals back into scoring. |
| `recommendation_events` | `useRecommendationTracking` | mood-session-scoped funnel: `shown_at`, `clicked_at`, `watched_at`, `skipped_at`, `added_to_watchlist_at`, `rating`, `rank_position`, `recommendation_reason`. |
| `mood_sessions` | `useMoodSession` | mood + context + energy/intensity per Discover session. |
| `user_history` / `user_ratings` / `user_watchlist` | feature surfaces | ground-truth taste signal. |
| `user_movie_feedback` | `feedback.js` | thumbs up/down → amplify/dampen affinity. |
| `user_interactions` | `interactions.js` | view/hover/search/filter telemetry. |

**Known instrumentation gap (code-level):** `/movie` does NOT log a rec
impression — Film File visits are invisible to the learning loop. `recommendation_impressions`
outcome flags are set non-destructively (a film can be both clicked and
watched), but only when the user actually acts on the surface that logs it.

---

## 2. Evaluation metrics framework

Six families. Each: **why it matters · data source · calculation · healthy
direction · limitation · measurable now?** All are implemented as pure
functions in [`src/shared/services/eval/recommendationEval.js`](../src/shared/services/eval/recommendationEval.js)
and as SELECTs in [`docs/sql/recommendation-evaluation-queries.sql`](sql/recommendation-evaluation-queries.sql).

### 2.1 Fit quality (outcome rates)
- **Why:** the pick's whole job is to be watched, not skipped. This is the
  closest proxy we have to "was it the right film?"
- **Source:** `recommendation_impressions` outcome flags; `recommendation_events` funnel.
- **Calc:** `skip/click/watch/save = outcome / impressions`; plus
  `outcomeCaptureRate = (any outcome) / impressions`.
- **Healthy:** watch/save ↑, skip ↓ — **but only once `outcomeCaptureRate` is
  trustworthy.**
- **Limitation:** skip is *also* a deliberate engine signal — a non-zero skip
  rate is healthy, not a bug. Watch ≠ enjoyment (need a post-watch rating to close that).
- **Now?** Structure yes; values **no** — capture is near-zero today (see §5).

### 2.2 Repeated-pick fatigue (déjà vu) — product trust
- **Why:** a returning user who sees yesterday's pick stops trusting the ritual (F0 risk #4).
- **Source:** `recommendation_impressions` where `placement='hero'`, per user, ordered by `shown_at`.
- **Calc:** `distinctRatio = distinct heroes / hero impressions`;
  `consecutiveRepeatRate = adjacent same-movie pairs / adjacent pairs`; `maxStreak`.
- **Healthy:** distinctRatio ↑, consecutiveRepeatRate ↓, maxStreak small.
- **Limitation:** a re-surfaced *strong* pick isn't always fatigue — cross-reference skip-on-repeat (SQL §2b).
- **Now?** **Yes** — measurable today (see §5).

### 2.3 Diversity / anti-bubble
- **Why:** a wall of the same director/genre/decade betrays "taste-deep"; one-language lock-in betrays the anti-bubble claim.
- **Source:** `recommendation_impressions` ⨝ `movies` (`director_name`, `primary_genre`, `release_year`, `original_language`).
- **Calc:** distinct values / N per axis (composite = mean); language dominant-share + non-English share.
- **Healthy:** composite ↑ within a row; dominant-language share ↓ (within reason).
- **Limitation:** intentionally-narrow slots (director spotlight) SHOULD score low — read per-placement, never as one global target.
- **Now?** **Yes.**

### 2.4 Reason / explanation coverage
- **Why:** "makes its case" requires a real, grounded reason — not a generic fallback.
- **Source:** `recommendation_impressions.pick_reason_type` / `seed_movie_id`.
- **Calc:** grounded share (typed, non-generic), generic share, seed share, distinct types.
- **Healthy:** grounded ↑, generic ↓.
- **Limitation:** a typed reason can still be vague prose — pair with §2.5.
- **Now?** **Yes.**

### 2.5 Explanation quality (the rubric, §6)
- **Why:** the moat is the *case*; a fabricated or empty reason actively destroys trust.
- **Source:** the reason strings themselves (`pick_reason_label`, `recommendation_reason`).
- **Calc:** `scoreExplanation` → verdict ∈ {good, weak, generic, unsafe} (rubric §6).
- **Healthy:** good share ↑; **unsafe share == 0 (hard gate).**
- **Limitation:** heuristic — it cannot judge true *relevance* (needs the user's profile); it reliably catches emptiness + fabrication, which are what matter for trust.
- **Now?** **Yes** (offline, over the reason corpus).

### 2.6 Cold vs warm segmentation
- **Why:** the cold→warm jump is where trust is won or lost (F0 risk #6); averaging across tiers hides it.
- **Source:** `user_history` counts per user.
- **Calc:** tier by films logged — cold (<5), warming (5–19), warm (20+).
- **Healthy:** N/A — it's a *slicing dimension*; every other metric is read within it.
- **Limitation:** films-logged is a coarse proxy for taste depth (a rater with 8 deep ratings may be "warmer" than a logger with 25 unrated).
- **Now?** **Yes.**

---

## 3. The offline evaluation harness

**Design principle — SAFE BY CONSTRUCTION.** The harness is pure + offline:
no DB, no network, no engine mutation, no auth. The engine is deliberately
**not imported** so the metrics can score *any* engine version's output without
coupling to internals F8B will change.

| Artifact | What |
|---|---|
| `src/shared/services/eval/recommendationEval.js` | Pure metric functions (§2). Zero imports, null-safe, JSDoc'd. Defines *what good looks like*; never tunes. |
| `src/shared/services/eval/fixtures.js` | 100% synthetic records (no PII), crafted to exercise every metric + all four rubric verdicts. |
| `scripts/eval/run-recommendation-eval.mjs` | Offline runner → writes `docs/eval/recommendation-eval-baseline.{json,md}`. Run: `node scripts/eval/run-recommendation-eval.mjs`. |
| `src/shared/services/eval/__tests__/recommendationEval.test.js` | Vitest contract tests for every metric + rubric verdict. |
| `docs/sql/recommendation-evaluation-queries.sql` | Read-only SELECT templates mirroring §2, verified against the live schema. |

**Record shapes mirror the live tables** (`ImpressionRecord` ≅
`recommendation_impressions`, `FilmRecord` ≅ scored film, `ReasonRecord` ≅ a
reason string). So the *same* metric code runs against a read-only DB export in
F8B with no change — only the data source swaps from fixtures to a snapshot.

**Why fixtures, not live data, for the committed baseline:** the live DB holds
only thin pre-launch dev data (8 test users — see §5), not enough for a
statistically meaningful baseline, and it is the user's real project. The
fixture baseline is a *reproducible worked example* of the metrics; the real
read-only snapshot (§5) is reported separately and was gathered via the §-SQL
templates, not committed as data.

---

## 4. Fixture baseline (reproducible worked example)

From `node scripts/eval/run-recommendation-eval.mjs` (synthetic — see
[`docs/eval/recommendation-eval-baseline.md`](eval/recommendation-eval-baseline.md)):

- **Fit:** outcome-capture 0.625, skip 0.25, watch 0.125 (synthetic, by design).
- **Hero fatigue:** distinctRatio 0.833, consecutiveRepeatRate 0.25, maxStreak 2 (the fixture plants one déjà-vu repeat).
- **Diversity:** composite 0.5 (director 0.667 / genre 0.5 / decade 0.333 — deliberately clustered).
- **Language:** dominant-share 0.833 English, non-English 0.167.
- **Reason coverage:** grounded 0.875, generic 0.125, seed 0.375.
- **Explanation quality:** mean 0.531; **good 3 · weak 1 · generic 2 · unsafe 2** — all four verdicts exercised; the two unsafe lines are caught fabrications.

These numbers exist to prove the harness *discriminates*, not to describe the product.

---

## 5. Real-data baseline (read-only snapshot — 2026-06-03)

Gathered via the §-SQL templates against the project DB (read-only). **This is
pre-launch dev data — 8 test users — so treat every value as a wiring check,
not a product verdict.**

| Table | rows | users | window |
|---|---|---|---|
| recommendation_impressions | 3,288 | 8 | 2026-04-04 → 06-03 |
| recommendation_events | 1,657 | 2 | 2026-04-08 → 05-14 |
| user_interactions | 729 | 8 | — |
| mood_sessions | 108 | 3 | — |
| user_history | 106 | 8 | — |
| user_ratings | 59 | 8 | — |
| user_watchlist | 17 | 4 | — |
| user_movie_feedback | 11 | 2 | — |

- **Fit / outcome-capture (the headline):** of 3,288 impressions — **~2%
  skipped, 0.1% clicked, 0.5% watched, 0.2% saved.** `recommendation_events`
  funnel: 1,657 shown → **16 clicked → 0 watched → 0 skipped → 0 saved → 0
  rated.** → **Outcome capture is effectively broken. We log what we show
  abundantly and capture almost no outcome.** This is the binding constraint on
  *all* fit/quality evaluation.
- **Reason coverage (a bright spot):** ~40 distinct `pick_reason_type` values;
  **only 1 of 3,288 is `default`/generic (0.03%)**; 32.4% carry a seed. The
  engine almost always attaches a typed, grounded reason.
- **Hero fatigue (healthy):** 516 hero impressions, 247 distinct heroes,
  distinctRatio **0.479**, **consecutive-repeat 0.2% (1 occurrence)**. Weighted-
  random + cooldowns are doing their job; déjà vu is essentially absent.
- **Language:** **89.2% English**, 20 distinct languages across surfaced films.
  The anti-bubble injects ~11% non-English; English still dominates (expected
  given catalog + dev users' taste — flag, not defect).
- **Engine-version churn:** 9 distinct `algorithm_version` values mixed in the
  impression history — longitudinal comparison must slice by version.
- **Cold/warm:** warming 6 users (avg 7.7 films), warm 2 (avg 30); no logged-
  cold cohort yet.

---

## 6. Explanation-quality rubric

Applied by `scoreExplanation(reason)` and intended for human review of new
reason templates. **Safety is a hard gate; everything else is graded.**

### Dimensions
| Dimension | Question | How checked |
|---|---|---|
| **Safe** (gate) | Does it avoid unsupported claims? | No `FABRICATION_PATTERNS` match (fake critics, "award-winning", "#1", "people like you" counts, streaming claims). Fail ⇒ **UNSAFE**. |
| **Grounded** | Is there a real reason type? | `pick_reason_type` ∉ {null, unknown, generic, default, fallback}. |
| **Specific** | Does it name something concrete? | mentions a seed title, a proper noun, or a genre/era cue. |
| **Mood-relevant** | Does it speak to how they want to feel? | (human) reflects the session mood/tone where one was given. |
| **Taste-relevant** | Is it grounded in *their* history? | (human) references a seed / director / genre the user actually likes. |
| **Honest** | No overpromise of certainty? | no "perfect"/"guaranteed"; Match % framed as evidence not a grade. |
| **Brief** | One line, not a paragraph? | word count ∈ [2, 14]. |
| **Useful** | Would it help decide tonight? | (human) adds information beyond the title. |

### Verdicts (precedence: unsafe > generic > weak > good)
| Verdict | Definition | Example |
|---|---|---|
| **good** | safe + grounded + specific + brief + non-generic | `Because you loved Parasite` · `More from Denis Villeneuve` |
| **weak (acceptable)** | safe + grounded, but vague (no concrete entity) | `Close to your taste profile` · `Built for your taste` |
| **generic (replace)** | safe but says nothing / untyped | `Picked for you` · `Recommended for you` |
| **unsafe (never ship)** | any fabricated / unsupported claim | `Critics agree this is the best film of the year` · `Award-winning and now streaming on Netflix` |

**Bar:** unsafe share **must be 0**. Generic share should trend down (F8B may
add fallback reasons that are weak-but-honest rather than empty). Weak is
tolerable on cold-start (we genuinely know less); it should fall as the user warms.

---

## 7. Data gaps & what F8B should fix FIRST (gated)

Ranked by how much they block measurement. **These are recommendations, not F8A
changes** — each requires its own gated phase (`recommendation-engine` /
`supabase-change` skills, DB-first analysis).

1. **🔴 Fix outcome capture before any scoring change.** With ~0.5% watch
   capture and a 0-watch/0-skip events funnel, there is no outcome signal to
   tune against — tuning now would be flying blind. Audit `updateImpression`
   call sites (watch/save/skip/rate) on /home + Discover, and the
   `recommendation_events` update path (only `clicked_at` ever fires). This is
   the single highest-leverage fix and it is *instrumentation*, not scoring.
2. **🔴 Add a post-watch quality signal.** Watch ≠ enjoyment. Without a rating
   or thumbs after the watch, fit quality is unfalsifiable. (Ties to the existing
   `user_movie_feedback` loop — 11 rows today.)
3. **🟠 Log a /movie impression.** Film File visits are invisible to the loop
   (§1.3) — the most considered surface produces no rec signal.
4. **🟠 Stamp + slice by `algorithm_version`.** 9 versions are mixed; pre/post
   comparison is unsafe until evaluation always filters by version.
5. **🟡 Then, and only then, tuning candidates** (each DB-first, each with a
   stated expected effect on skip/watch): language anti-bubble strength (89%
   English), generic-reason reduction, repeated-pick guard surfaced to the user.

**F8B entry gate:** do not touch scoring until (1) is fixed and the harness can
read a non-trivial `outcomeCaptureRate`. Lead every F8B change with the pool/
coverage numbers (skill rule #1), then the change, then the expected measurable
effect.

---

## 8. Non-scope (explicitly NOT done in F8A)

No change to: scoring / thresholds / ranking / weights · `ENGINE_VERSION` ·
schema / RLS / migrations · edge functions · OpenAI prompts · data generation ·
auth / routes / packages / config · any UI surface. No F8B tuning started. The
`recommendation-engine` skill's DB-first mandate was honored for the read-only
baseline (§5); no writes were issued.

---

## 9. Validation

- `node scripts/eval/run-recommendation-eval.mjs` → writes baseline, exits 0.
- New Vitest suite `recommendationEval.test.js` green.
- Read-only SQL templates verified to execute against the live schema (§5 numbers).
- `lint → test → build` green (see commit).

---

## 10. Risk register

| Risk | Mitigation |
|---|---|
| Heuristic rubric mislabels nuanced prose | Verdicts are conservative; only the *unsafe* gate is automated-blocking. Human dimensions (mood/taste/useful) stay human. |
| Fixture baseline mistaken for product truth | Every artifact is labeled SYNTHETIC; real data is a separate, clearly-thin §5. |
| Metrics drift from engine internals | Intentional decoupling — metrics score *output*, not internals; record shapes mirror tables, not code. |
| Someone tunes before capture is fixed | §7 makes "fix capture first" the explicit F8B entry gate. |
