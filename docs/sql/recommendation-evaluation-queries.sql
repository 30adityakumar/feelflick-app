-- ============================================================================
-- FeelFlick — Recommendation evaluation queries (Phase F8A)
-- ============================================================================
-- READ-ONLY. Every statement is a SELECT. There is NO INSERT / UPDATE / DELETE
-- / DDL here by design — this file is an analysis toolkit, not a migration.
-- Tuning the engine is gated by the `recommendation-engine` skill and is F8B
-- work; this file only MEASURES.
--
-- Run against the project DB (read-only) to populate the real-data baseline in
-- docs/recommendation-trust-evaluation-f8a.md. Column names are verified against
-- the live schema as of 2026-06-03.
--
-- Tables used:
--   recommendation_impressions  (movie_id, placement, shown_at, shown_date,
--     skipped, clicked, marked_watched, added_to_watchlist, pick_reason_type,
--     pick_reason_label, score, seed_movie_id, embedding_similarity,
--     algorithm_version)
--   recommendation_events       (mood_session_id, movie_id, rank_position,
--     recommendation_score, recommendation_reason, shown_at, clicked_at,
--     watched_at, skipped_at, added_to_watchlist_at, rating)
--   mood_sessions, user_history, user_ratings, user_watchlist,
--   user_movie_feedback, user_profiles_computed, movies
--
-- Convention: replace ':user_id' / ':since' placeholders before running, or
-- delete the WHERE clause to run global. Bracketed [WINDOW] comments mark
-- tunable time windows.
-- ============================================================================


-- ============================================================================
-- 0. DATA INVENTORY — how much signal do we actually have?
-- ============================================================================
-- Run this FIRST. Every metric below is only as trustworthy as its row count.
SELECT 'recommendation_impressions' AS tbl, COUNT(*) AS rows,
       COUNT(DISTINCT user_id) AS users,
       MIN(shown_at)::date AS first_at, MAX(shown_at)::date AS last_at
  FROM recommendation_impressions
UNION ALL SELECT 'recommendation_events', COUNT(*), COUNT(DISTINCT user_id),
       MIN(shown_at)::date, MAX(shown_at)::date FROM recommendation_events
UNION ALL SELECT 'mood_sessions', COUNT(*), COUNT(DISTINCT user_id),
       MIN(created_at)::date, MAX(created_at)::date FROM mood_sessions
UNION ALL SELECT 'user_history', COUNT(*), COUNT(DISTINCT user_id),
       MIN(watched_at)::date, MAX(watched_at)::date FROM user_history
UNION ALL SELECT 'user_ratings', COUNT(*), COUNT(DISTINCT user_id),
       MIN(rated_at)::date, MAX(rated_at)::date FROM user_ratings
UNION ALL SELECT 'user_movie_feedback', COUNT(*), COUNT(DISTINCT user_id),
       MIN(created_at)::date, MAX(created_at)::date FROM user_movie_feedback
ORDER BY rows DESC;


-- ============================================================================
-- 1. FIT QUALITY — outcome rates + the OUTCOME-CAPTURE GAP
-- ============================================================================
-- The single most important diagnostic today. If outcome_capture_rate is near
-- zero, every rate below it is unmeasurable: you cannot tune toward an outcome
-- you never record. A non-zero skip rate is HEALTHY (skip is a real signal).
SELECT
  COUNT(*)                                                          AS impressions,
  ROUND(100.0 * AVG((skipped)::int), 2)                            AS pct_skipped,
  ROUND(100.0 * AVG((clicked)::int), 2)                           AS pct_clicked,
  ROUND(100.0 * AVG((marked_watched)::int), 2)                    AS pct_watched,
  ROUND(100.0 * AVG((added_to_watchlist)::int), 2)               AS pct_saved,
  ROUND(100.0 * AVG((skipped OR clicked OR marked_watched
                     OR added_to_watchlist)::int), 2)             AS pct_any_outcome
  FROM recommendation_impressions
 -- WHERE shown_at >= now() - interval '30 days'   -- [WINDOW]
;

-- 1b. Outcome capture by placement — which surfaces capture engagement at all?
SELECT placement,
       COUNT(*) AS impressions,
       ROUND(100.0 * AVG((skipped OR clicked OR marked_watched
                          OR added_to_watchlist)::int), 2) AS pct_any_outcome,
       ROUND(100.0 * AVG((marked_watched)::int), 2)        AS pct_watched,
       ROUND(100.0 * AVG((skipped)::int), 2)               AS pct_skipped
  FROM recommendation_impressions
 GROUP BY placement
 ORDER BY impressions DESC;

-- 1c. recommendation_events funnel (mood-session-scoped path)
SELECT COUNT(*)                       AS shown,
       COUNT(clicked_at)              AS clicked,
       COUNT(watched_at)              AS watched,
       COUNT(skipped_at)              AS skipped,
       COUNT(added_to_watchlist_at)   AS saved,
       COUNT(rating)                  AS rated
  FROM recommendation_events;


-- ============================================================================
-- 2. REPEATED-PICK FATIGUE (hero déjà vu)
-- ============================================================================
-- distinct_ratio close to 1.0 = the hero rarely repeats. consecutive_repeats
-- counts adjacent same-movie hero impressions per user (the "I saw this
-- yesterday" feel). Pair with skip-on-repeat (2b) to separate fatigue from a
-- legitimately re-surfaced strong pick.
WITH hero AS (
  SELECT user_id, movie_id, shown_at,
         LAG(movie_id) OVER (PARTITION BY user_id ORDER BY shown_at) AS prev_movie_id
    FROM recommendation_impressions
   WHERE placement = 'hero'
)
SELECT
  COUNT(*)                                                  AS hero_impressions,
  COUNT(DISTINCT movie_id)                                  AS distinct_heroes,
  ROUND(COUNT(DISTINCT movie_id)::numeric
        / NULLIF(COUNT(*), 0), 3)                           AS distinct_ratio,
  SUM((movie_id = prev_movie_id)::int)                      AS consecutive_repeats,
  ROUND(100.0 * AVG((movie_id = prev_movie_id)::int)
        FILTER (WHERE prev_movie_id IS NOT NULL), 2)        AS pct_consecutive_repeat
  FROM hero;

-- 2b. Movies re-shown as hero 3+ times to the same user (top fatigue offenders)
SELECT user_id, movie_id, COUNT(*) AS times_shown_as_hero,
       SUM((skipped)::int) AS times_skipped
  FROM recommendation_impressions
 WHERE placement = 'hero'
 GROUP BY user_id, movie_id
HAVING COUNT(*) >= 3
 ORDER BY times_shown_as_hero DESC
 LIMIT 50;


-- ============================================================================
-- 3. DIVERSITY & ANTI-BUBBLE  (joins movies for director/genre/era/language)
-- ============================================================================
-- 3a. Within-day, within-surface diversity for one user (distinct values / N).
--     Low director/genre/decade ratios = clustered rows. A deliberately narrow
--     slot (director_spotlight) is EXPECTED to be low — read per placement.
SELECT i.placement, i.shown_date,
       COUNT(*)                              AS films,
       COUNT(DISTINCT m.director_name)       AS distinct_directors,
       COUNT(DISTINCT m.primary_genre)       AS distinct_genres,
       COUNT(DISTINCT (m.release_year/10))   AS distinct_decades
  FROM recommendation_impressions i
  JOIN movies m ON m.id = i.movie_id
 -- WHERE i.user_id = ':user_id'
 GROUP BY i.placement, i.shown_date
 ORDER BY i.shown_date DESC, i.placement
 LIMIT 100;

-- 3b. Language anti-bubble — dominant-language share across what was surfaced.
--     High pct_english with low distinct_languages = bubble risk (interpret
--     against the user's own seed languages, not as an absolute defect).
SELECT i.user_id,
       COUNT(*)                                          AS films,
       COUNT(DISTINCT m.original_language)               AS distinct_languages,
       ROUND(100.0 * AVG((m.original_language = 'en')::int), 1) AS pct_english,
       ROUND(100.0 * AVG((m.original_language <> 'en')::int), 1) AS pct_non_english
  FROM recommendation_impressions i
  JOIN movies m ON m.id = i.movie_id
 GROUP BY i.user_id
 ORDER BY films DESC;

-- 3c. Popularity-bias check — are surfaced films skewing high vote_count?
--     (Anti-recency/anti-popularity is intentional; this verifies it holds.)
SELECT i.placement,
       ROUND(AVG(m.vote_count))            AS avg_vote_count,
       ROUND(AVG(m.popularity)::numeric,1) AS avg_popularity,
       ROUND(AVG(m.release_year))          AS avg_release_year
  FROM recommendation_impressions i
  JOIN movies m ON m.id = i.movie_id
 GROUP BY i.placement
 ORDER BY avg_vote_count DESC;


-- ============================================================================
-- 4. REASON / EXPLANATION COVERAGE
-- ============================================================================
-- 4a. Grounded vs generic reason share + seed grounding.
SELECT
  COUNT(*)                                                          AS impressions,
  COUNT(DISTINCT pick_reason_type)                                  AS distinct_reason_types,
  ROUND(100.0 * AVG((pick_reason_type IS NULL
        OR pick_reason_type IN ('unknown','generic','default','fallback'))::int), 2)
                                                                    AS pct_generic,
  ROUND(100.0 * AVG((seed_movie_id IS NOT NULL)::int), 2)          AS pct_with_seed,
  ROUND(100.0 * AVG((embedding_similarity IS NOT NULL)::int), 2)   AS pct_with_similarity
  FROM recommendation_impressions;

-- 4b. Reason-type distribution (which justifications the engine actually emits)
SELECT COALESCE(pick_reason_type, '(null)') AS reason_type,
       COUNT(*) AS n,
       ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS pct
  FROM recommendation_impressions
 GROUP BY pick_reason_type
 ORDER BY n DESC;

-- 4c. Outcome BY reason type — does a given reason earn watches or skips?
--     (Only meaningful once §1 outcome-capture is non-trivial. Until then this
--     reports near-zero and is itself the evidence of the capture gap.)
SELECT COALESCE(pick_reason_type,'(null)') AS reason_type,
       COUNT(*)                            AS shown,
       ROUND(100.0 * AVG((marked_watched)::int), 2) AS pct_watched,
       ROUND(100.0 * AVG((skipped)::int), 2)        AS pct_skipped
  FROM recommendation_impressions
 GROUP BY pick_reason_type
HAVING COUNT(*) >= 20
 ORDER BY shown DESC;


-- ============================================================================
-- 5. FEEDBACK-LOOP HEALTH
-- ============================================================================
-- 5a. Thumbs feedback volume + balance (amplify/dampen signal into scoring).
SELECT COUNT(*) AS feedback_rows,
       COUNT(DISTINCT user_id) AS users,
       SUM((feedback_value = 1)::int)  AS positive,
       SUM((feedback_value = -1)::int) AS negative
  FROM user_movie_feedback;

-- 5b. Engine-version churn — how many algorithm_versions are mixed in the data?
--     (Mixing versions makes longitudinal comparison unsafe; slice by version.)
SELECT algorithm_version, COUNT(*) AS impressions,
       MIN(shown_at)::date AS first_at, MAX(shown_at)::date AS last_at
  FROM recommendation_impressions
 GROUP BY algorithm_version
 ORDER BY last_at DESC;


-- ============================================================================
-- 6. COLD vs WARM SEGMENTATION
-- ============================================================================
-- Always slice evaluation by taste depth — cold (<5), warming (5-19), warm
-- (20+). Averaging across tiers hides the cold-start trust problem.
WITH depth AS (
  SELECT user_id, COUNT(*) AS films_logged
    FROM user_history
   GROUP BY user_id
)
SELECT CASE
         WHEN films_logged < 5  THEN 'cold'
         WHEN films_logged < 20 THEN 'warming'
         ELSE 'warm'
       END AS tier,
       COUNT(*)            AS users,
       SUM(films_logged)   AS total_films,
       ROUND(AVG(films_logged), 1) AS avg_films
  FROM depth
 GROUP BY tier
 ORDER BY avg_films;
