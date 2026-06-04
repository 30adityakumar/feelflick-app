# F8B — Recommendation Outcome Capture Repair

> **Phase F8B. Instrumentation/measurement repair — NOT tuning.** F8B fixes the
> broken outcome-capture pipeline F8A found, so recommendation outcomes become
> measurable and trustworthy. It changes NO scoring, thresholds, ranking,
> candidate generation, `ENGINE_VERSION`, prompts, edge functions, routes, or
> schema. The wedge it defends: you cannot honestly claim "the right film" or
> tune toward it until you can measure whether a recommendation was acted on.

**Status:** ✅ repaired (capture wired; verification queries ready; new baseline
to be collected post-deploy). **Date:** 2026-06-03. **Engine:** untouched (`ENGINE_VERSION = '2.17'`).

---

## 1. The problem (from F8A)

F8A's read-only baseline showed outcome capture was effectively broken:

- 3,288 `recommendation_impressions` — but **~0.5% recorded a watch, ~2% a skip,
  0.1% a click, 0.2% a save.**
- `recommendation_events` funnel: 1,657 shown → 16 clicked → **0 watched / 0
  skipped / 0 saved / 0 rated.**

We logged what we *showed* abundantly and captured almost no *outcome* — so fit
quality (watch/save vs skip) was unmeasurable, and any tuning would be blind.

---

## 2. Current-state map (what was/wasn't captured, before F8B)

`recommendation_impressions` is the canonical outcome store — it feeds the
engine's skip-signal model (`computeNegativeSignals`). Its outcome columns
(`clicked`, `skipped`, `marked_watched`, `added_to_watchlist`) are flipped by
`updateImpression(userId, movieId, action)` (recommendations.js), which resolves
the user's most-recent impression for that film and sets one flag.

| Outcome | Surface | Before F8B | Verdict |
|---|---|---|---|
| **shown** | Briefing (`logSurfaceImpressions`, placement `hero`), carousels (`logRowImpressions`), Discover | logged | ✅ working (3,288 rows) |
| **skipped** | Briefing "Skip" → `Home.onSkip` → `updateImpression('skipped')`; Discover | logged | ✅ working |
| **clicked** | **Carousel** `MovieCard.handleNavigate` → `updateImpression(user, movie, placement, …)` | **BUG**: passed `placement` as the *action* arg; `updateImpression` only matches `clicked\|skipped\|watched\|saved`, so it silently no-op'd | ❌ broken |
| **clicked** | **Briefing** poster / "See More" → `onWatch` → navigate | never called `updateImpression('clicked')` | ❌ missing |
| **clicked** | Discover top pick | `updateImpression('clicked')` | ✅ working |
| **saved** | **All** save buttons (Briefing, carousels, Movie page) → `useUserMovieStatus.toggleWatchlist` → `user_watchlist` | wrote watchlist row but **never** `updateImpression('saved')` | ❌ broken |
| **watched** | **All** watched buttons → `useUserMovieStatus.toggleWatched` → `user_history` | wrote history row but **never** `updateImpression('watched')` | ❌ broken |
| **saved/watched** | Discover | own handlers call `updateImpression` | ✅ working |
| **rating** | Movie page `YourTake` → `useUserRating` → `user_ratings` | captured generically; **no** recommendation link (`recommendation_impressions` has no rating column) | ⚠️ generic only |
| **thumbs / sentiment** | `useUserRating.persistReaction` → `user_movie_feedback` | captured generically; no rec link | ⚠️ generic only |
| **rating (events path)** | `RecommendationFeedback` → `trackRating` → `recommendation_events.rating` | **component rendered nowhere** (dead) | ☠️ dead path |
| **events funnel** | `useRecommendationTracking.trackRecommendation*` | `Shown`/`Clicked`/`Watched`/`AddedToWatchlist` callers all removed; only `trackRating` referenced (by the dead component) | ☠️ dead path (stopped writing 2026-05-14) |

**Root causes:** (1) `useUserMovieStatus` — the single hook behind save/watch on
the Briefing, every carousel card, and the Movie page — wrote to
`user_watchlist`/`user_history` but never attributed the outcome to the
impression; (2) the carousel click passed the wrong argument; (3) the Briefing
open never recorded a click. Discover was already correct because it bypasses the
hook with its own handlers.

---

## 3. The F8B tracking contract

Canonical outcome store = `recommendation_impressions` (boolean outcome flags;
the table the engine already learns skips from). `recommendation_events` is left
as a legacy/parallel funnel (out of scope; see §8).

| Action | Surface(s) | IDs used | Destination | Behavior | Fallback when no rec context |
|---|---|---|---|---|---|
| shown | Briefing, carousels, Discover | user, movie, placement, reason | `recommendation_impressions` (insert) | per-day-deduped upsert (unchanged) | n/a |
| clicked / opened | carousel card; Briefing poster + "See More" | user, movie | `recommendation_impressions.clicked` | set flag via `updateImpression('clicked')` (carousel) / `recordRecommendationOutcome` (Briefing) | carousel gated on `placement`; Briefing no-ops if no recent impression |
| skipped | Briefing "Skip"; Discover | user, movie | `recommendation_impressions.skipped` + `user_interactions('dismiss')` | unchanged (already correct) | n/a (skip only exists on rec surfaces) |
| saved | Briefing / carousel / Movie save | user, internal movie id | `user_watchlist` **+** `recommendation_impressions.added_to_watchlist` | watchlist write (source of truth) **then** `recordRecommendationOutcome('saved')` | helper no-ops → generic watchlist row only |
| marked watched | Briefing / carousel / Movie watched | user, internal movie id | `user_history` **+** `recommendation_impressions.marked_watched` | history write (source of truth) **then** `recordRecommendationOutcome('watched')` | helper no-ops → generic history row only |
| rating | Movie page YourTake | user, internal movie id | `user_ratings` (+ `user_movie_feedback` for sentiment) | unchanged | generic only — rec-link is a known gap (§7) |

**Attribution rule (the key decision).** An action is attributed to a
recommendation **only when the user was shown that film recently** — i.e. the
most-recent `recommendation_impressions` row for `(user, movie)` is within
`OUTCOME_ATTRIBUTION_WINDOW_HOURS` (72h, aligned with the hero skip-cooldown).
The impression *is* the recommendation context: if the engine surfaced the film
in-window, an action on it is a genuine conversion regardless of the click path
the user took; if it didn't, there is nothing to attribute and the action stays a
generic `user_watchlist`/`user_history` row. This:

- captures Briefing/carousel save·watch·click (a fresh impression always exists),
- **auto-captures the Briefing's primary "See More" → Movie-page → Save
  conversion** (the hero impression is seconds old) with **no nav-state threading
  and no schema change**,
- never falsely attaches a generic/direct action (no recent impression → no-op),
- is idempotent — flags are booleans, so repeating an action can't double-count.

**Rules honored:** no double counting (boolean flags); generic movie actions
stay generic; non-recommendation flows untouched; best-effort/fire-and-forget so
a tracking failure never blocks a user action or surfaces an error.

---

## 4. Changes made

| File | Change |
|---|---|
| **NEW** `src/shared/services/recommendationOutcomes.js` | `recordRecommendationOutcome({userId, movieId, action, withinHours})` — recency-gated attribution; reads the latest impression, attributes via the canonical `updateImpression` only if recent; never throws. Exports `OUTCOME_ATTRIBUTION_WINDOW_HOURS` (72) + `ATTRIBUTABLE_ACTIONS`. |
| `src/shared/hooks/useUserMovieStatus.js` | After a successful watchlist **ADD** → `recordRecommendationOutcome('saved')`; after a successful watched **MARK** → `recordRecommendationOutcome('watched')`. Not on remove/unmark. Fire-and-forget, after the existing DB writes. |
| `src/components/carousel/CardContent/MovieCard.jsx` | Fixed the click write: `updateImpression(user.id, movie.id, 'clicked')` (was passing `placement` as the action → silent no-op). Still gated on `placement` so only recommendation-row cards attribute. |
| `src/features/home/sections-top.jsx` | `BriefingSlide` now opens via `handleOpen`, which records the `clicked` outcome (recency-gated) before `onWatch` navigates. Poster + "See More" both use it. |
| `docs/sql/recommendation-evaluation-queries.sql` | New **§7** read-only verification queries: capture-by-placement, conversion funnel (clicked→saved/watched, shown→outcome), attributed-vs-generic split. |
| `src/shared/services/eval/recommendationEval.js` + runner | New pure metrics `conversionFunnel` + `captureByPlacement`, surfaced in `summarizeEvaluation` and the runner output. |

---

## 5. Existing schema reused — no schema change

The repair writes **only existing columns**:
`recommendation_impressions.{clicked, skipped, marked_watched, added_to_watchlist}`.
`updateImpression` already performs this owner-scoped `UPDATE` from the client
(the skip path has run in production), so RLS already permits it. **No migration,
no RLS change, no edge-function change** was required — the schema could already
represent every outcome link F8B needs. (The one thing it cannot represent is a
*rating* as an impression flag; that's a deliberate non-change — see §7.)

---

## 6. Data contracts preserved

Unchanged & verified: Briefing display + slide rotation, `WhyThisPick`, Film File
`PrimaryCaseCard`, skip/save/watch/rating *behavior* (the DB writes that are the
source of truth all still happen first; attribution is additive & fire-and-forget),
watchlist/history mutual-exclusivity, `user_interactions`/analytics writes,
`source` strings (no new value introduced, so the `user_watchlist`/`user_history`
CHECK constraints are untouched), auth/onboarding gates, routes/IA, and the
recommendation **output order** (no scoring touched).

---

## 7. Tests added

| Test | Covers |
|---|---|
| `src/shared/services/__tests__/recommendationOutcomes.test.js` (8) | recent → attribute; **no impression → generic, not attached**; **stale → not attached**; window edge; invalid args; never throws; idempotent; action set. |
| `src/shared/hooks/__tests__/useUserMovieStatus.test.js` (4) | save ADD → `saved`; watched MARK → `watched`; remove → not attributed; unmark → not attributed. |
| `src/components/carousel/__tests__/MovieCard.test.jsx` (+2) | click with placement → `updateImpression(…, 'clicked')`; no placement → no outcome write. |
| `src/shared/services/eval/__tests__/recommendationEval.test.js` (+3) | `conversionFunnel` + `captureByPlacement`. |

All unit tests use mocks/stubs — no live DB.

---

## 8. How to verify (read-only) + baseline to re-measure

Run **§7** of `docs/sql/recommendation-evaluation-queries.sql` against the DB
**after the repair ships and real users act** (filter to post-deploy with the
`[WINDOW]` clause), and compare to the F8A baseline:

| Metric | F8A baseline | F8B target (post-deploy) |
|---|---|---|
| impressions with any outcome | ~2% | materially higher |
| pct watched | ~0.5% | materially higher |
| pct clicked | 0.1% | materially higher (carousel + Briefing now fire) |
| clicked→saved / clicked→watched | unmeasurable | now computable |
| attributed-vs-generic save/watch | n/a | most rec-surface actions attributed |

> **The new real-data baseline must be collected after deployment + real usage.**
> F8B does not claim the *numbers* improved — only that the capture *paths* are
> now wired and unit-verified. The pre-launch dev DB (8 test users) cannot prove
> the lift; that requires post-deploy traffic.

---

## 9. Remaining gaps (for later, gated phases)

1. **Rating ↔ recommendation link.** Ratings/sentiment land in
   `user_ratings`/`user_movie_feedback` but aren't tied to the impression
   (`recommendation_impressions` has no rating column). Capturing "this rec led
   to a rating" needs either a new column (schema change → `supabase-change`
   skill) or wiring `mood_session_id` / reviving the `recommendation_events`
   path. Deferred.
2. **`recommendation_events` + `RecommendationFeedback` are dead.** The
   mood-session funnel stopped being written and the feedback component is
   unmounted. Either revive deliberately or remove — a separate decision, not
   outcome-capture repair.
3. **`/movie` logs no impression.** Direct Film File visits remain invisible to
   the loop (an F8A finding). F8B captures Movie-page *actions* when they follow
   a recent recommendation, but doesn't create a Film File impression itself.
4. **Long-horizon attribution.** A watch >72h after the surfacing impression is
   intentionally not back-attributed (avoids stale attribution); it's still
   captured in `user_history`. A session-linked approach could extend this later.

---

## 10. Non-scope (explicitly NOT done)

No scoring / threshold / ranking / candidate-generation change · no
`ENGINE_VERSION` bump · no schema / RLS / migration · no edge-function or OpenAI
prompt change · no package change · no UI redesign or route/IA change · no data
generation · F8C tuning **not** started.

---

## 11. F8C tuning gate

F8C (gated engine tuning) may begin once a **post-deploy** real-data baseline
collected via §7 confirms `outcomeCaptureRate` is non-trivial and stable, sliced
by `algorithm_version` and cold/warm tier. Until that baseline exists, tuning is
still blind — keep it blocked. When unblocked, every F8C change leads with the
pool/coverage numbers (`recommendation-engine` skill), then the change, then the
expected measurable effect on skip/watch.
