# FeelFlick Supabase Schema Reference

> Auto-generated from live DB introspection on 2026-04-19.
> 36 tables, 1 view in `public` schema. PostgreSQL 15.8 + pgvector.

---

## Rating Architecture (5-Score System)

Every movie can carry up to five distinct ratings, each answering a different question:

| Column | Type | Range | Source | Purpose |
|--------|------|-------|--------|---------|
| `ff_critic_rating` | smallint | 0-100 | Weighted external critics (RT, Metacritic) | "Do critics rate it highly?" |
| `ff_audience_rating` | smallint | 0-100 | Weighted external audience (TMDB, IMDb, Trakt) | "Do general audiences like it?" |
| `ff_community_rating` | smallint | 0-100 | FeelFlick user votes (`ff_community_votes`) | "Do our users like it?" |
| `ff_rating_genre_normalized` | numeric | 0-10 | Genre-curve-adjusted composite | "How good is it for its genre?" |
| `ff_personal_rating` | jsonb | per-user | Cached in `user_profiles_computed.personal_ratings` | "How much will this specific user like it?" |

**Deprecated (removal target 2026-05-18):**
- `ff_rating` numeric -- old composite, replaced by critic/audience split
- `ff_final_rating` numeric -- old final blend, replaced by genre-normalized

**User-submitted ratings:** `user_ratings.rating` is **integer 1-10** (not 1-5).

---

## Catalog Domain

### movies
Master catalog of all films with comprehensive TMDB metadata plus FeelFlick enrichments.

| Detail | Value |
|--------|-------|
| Rows | ~6,608 |
| PK | `id` (integer, TMDB movie ID) |
| Key columns | `title`, `release_date`, `overview`, `runtime`, `poster_path`, `backdrop_path` |
| TMDB metadata | `tmdb_id`, `imdb_id`, `vote_average`, `vote_count`, `popularity`, `original_language`, `budget`, `revenue`, `certification` |
| Mood scoring | `pacing_score`, `intensity_score`, `emotional_depth_score`, `quality_score` (legacy 1-10) |
| Mood scoring (100-scale) | `pacing_score_100`, `intensity_score_100`, `emotional_depth_score_100` |
| LLM enrichment | `llm_pacing`, `llm_intensity`, `llm_emotional_depth`, `llm_dialogue_density`, `llm_attention_demand` (smallint 0-100), `llm_confidence`, `llm_enriched_at`, `llm_model_version` |
| Content tags | `mood_tags` (text[]), `tone_tags` (text[]), `fit_profile` (text) |
| Rating cols | `ff_critic_rating`, `ff_audience_rating`, `ff_community_rating`, `ff_rating_genre_normalized`, `ff_rating` (deprecated), `ff_final_rating` (deprecated) |
| Cast summary | `director_name`, `lead_actor_name`, `writer_name`, `cinematographer_name`, `starpower_score`, `avg_cast_popularity`, `top3_cast_avg` |
| Embeddings | `embedding` (vector), `has_embeddings`, `last_embedding_at` |
| Pipeline flags | `status` (text), `has_scores`, `has_credits`, `has_keywords`, `has_cast_metadata`, `is_valid`, `retry_count`, `last_error`, `error_type` |
| Social | `wikidata_id`, `facebook_id`, `instagram_id`, `twitter_id` |
| Collection | `collection_id`, `collection_name` |
| Timestamps | `inserted_at`, `updated_at`, `fetched_at`, `last_tmdb_sync`, `processing_completed_at` |

**Read:** `src/shared/services/recommendations.js`, `src/shared/services/ratings.js`, `src/shared/services/personalRating.js`, `src/shared/api/browse.js`, `src/app/pages/MovieDetail/index.jsx`, `src/app/homepage/components/HeroTopPick.jsx`
**Write:** `src/shared/lib/movies/ensureMovieInDb.js`, `scripts/pipeline/02-fetch-movie-metadata.js`, `scripts/pipeline/07-calculate-movie-scores.js`, `scripts/pipeline/07b-enrich-mood-llm.js`, `scripts/pipeline/08-generate-embeddings.js`

---

### genres
Standard TMDB genre lookup (Action, Comedy, Drama, etc.).

| Detail | Value |
|--------|-------|
| Rows | 19 |
| PK | `id` (integer) |
| Columns | `id`, `name` |

**Write:** `scripts/phase1/04-sync-genres.js`, `scripts/pipeline/03-fetch-genres-keywords.js`

---

### movie_genres
Junction: movies to genres (many-to-many).

| Detail | Value |
|--------|-------|
| Rows | ~17,534 |
| PK | (`movie_id`, `genre_id`) |
| FK | `movie_id` -> `movies.id`, `genre_id` -> `genres.id` |

**Read:** `scripts/pipeline/07-calculate-movie-scores.js`
**Write:** `scripts/pipeline/03-fetch-genres-keywords.js`

---

### keywords
TMDB keyword taxonomy for granular tagging beyond genres.

| Detail | Value |
|--------|-------|
| Rows | 90 |
| PK | `id` (integer) |
| Columns | `id`, `name` |

**Write:** `scripts/pipeline/03-fetch-genres-keywords.js`

---

### movie_keywords
Junction: movies to keywords (many-to-many).

| Detail | Value |
|--------|-------|
| Rows | ~92,175 |
| PK | (`movie_id`, `keyword_id`) |
| FK | `movie_id` -> `movies.id`, `keyword_id` -> `keywords.id` |

**Write:** `scripts/pipeline/03-fetch-genres-keywords.js`

---

### people
Directory of cast and crew (actors, directors, writers).

| Detail | Value |
|--------|-------|
| Rows | ~330,946 |
| PK | `id` (integer, TMDB person ID) |
| Columns | `name`, `profile_path`, `known_for_department`, `gender`, `popularity`, `json_data` (jsonb) |

**Write:** `scripts/pipeline/04-fetch-cast-crew.js`

---

### movie_people
Junction: movies to cast/crew with role details.

| Detail | Value |
|--------|-------|
| Rows | ~322,739 |
| PK | (`movie_id`, `person_id`, `job`) |
| FK | `movie_id` -> `movies.id`, `person_id` -> `people.id` |
| Columns | `job`, `character`, `department`, `billing_order` |

**Read:** `scripts/pipeline/05-calculate-cast-metadata.js`
**Write:** `scripts/pipeline/04-fetch-cast-crew.js`

---

### movie_cast_metadata
Pre-computed cast popularity aggregates per movie.

| Detail | Value |
|--------|-------|
| Rows | ~5,898 |
| PK | `movie_id` |
| FK | `movie_id` -> `movies.id` |
| Columns | `avg_cast_popularity`, `max_cast_popularity`, `top_3_cast_avg`, `cast_count`, `calculated_at` |

**Read:** `scripts/phase1/16-calculate-metadata.js`

---

### ratings_external
Aggregated ratings from IMDb, Rotten Tomatoes, Metacritic, and Trakt.

| Detail | Value |
|--------|-------|
| Rows | ~6,542 |
| PK | `movie_id` |
| FK | `movie_id` -> `movies.id` |
| Columns | `imdb_rating`, `imdb_votes`, `rt_rating`, `rt_critics_count`, `metacritic_score`, `trakt_rating`, `trakt_votes`, `trakt_fetched_at`, `fetched_at`, `fetch_error_type`, `fetch_error` |

**Read:** `scripts/pipeline/07-calculate-movie-scores.js`
**Write:** `scripts/pipeline/06-fetch-external-ratings.js`, `scripts/pipeline/06b-fetch-trakt-ratings.js`

---

### moods
Master lookup of emotional states (Adventurous, Cozy, Heartbroken, etc.). Each mood has cinematic mapping attributes that guide the recommendation algorithm.

| Detail | Value |
|--------|-------|
| Rows | 0 (populated via `scripts/phase1/01-populate-moods.js`) |
| PK | `id` (integer) |
| Columns | `name`, `description`, `emoji`, `category`, `pacing_preference`, `intensity_level`, `emotional_depth`, `escapism_factor`, `active`, `display_order` |

**Read:** `scripts/pipeline/09-calculate-mood-scores.js`

---

### movie_mood_scores
Pre-computed compatibility scores (0-100) for every movie-mood pair.

| Detail | Value |
|--------|-------|
| Rows | ~96,585 |
| PK | (`movie_id`, `mood_id`) |
| FK | `movie_id` -> `movies.id`, `mood_id` -> `moods.id` |
| Columns | `score`, `genre_match_score`, `pacing_match_score`, `intensity_match_score`, `user_feedback_score`, `times_recommended`, `success_rate` |

**Read/Write:** `scripts/pipeline/09-calculate-mood-scores.js`

---

### viewing_contexts
Lookup: who the user is watching with (Alone, Partner, Friends, Family, Kids). Contains recommendation adjustment rules.

| Detail | Value |
|--------|-------|
| Rows | 0 (populated via `scripts/phase1/02-populate-viewing-contexts.js`) |
| PK | `id` (integer) |
| Columns | `name`, `description`, `icon`, `prefer_shorter_runtime`, `content_rating_filter`, `active`, `display_order` |

---

### experience_types
Lookup: desired experience (Escape, Laugh, Cry, Think, Zone Out). Weights recommendations toward matching genres/themes.

| Detail | Value |
|--------|-------|
| Rows | 0 (populated via `scripts/phase1/03-populate-experience-types.js`) |
| PK | `id` (integer) |
| Columns | `name`, `description`, `preferred_genres` (text[]), `avoid_genres` (text[]), `active`, `display_order` |

---

## User Domain

### users
Core authentication and profile table. Links to `auth.users` for Supabase auth.

| Detail | Value |
|--------|-------|
| Rows | 2 |
| PK | `id` (uuid, matches `auth.users.id`) |
| FK | `default_viewing_context_id` -> `viewing_contexts.id` |
| Columns | `name`, `email`, `avatar_url`, `signup_source`, `joined_at`, `onboarding_complete`, `onboarding_completed_at`, `total_mood_sessions`, `total_movies_watched`, `favorite_moods` (int[]), `last_active_at` |

**Read:** `src/features/auth/PostAuthGate.jsx`, `src/app/pages/people/UserSearchPage.jsx`, `src/app/pages/profile/TasteProfile.jsx`
**Write:** `src/shared/lib/supabase/onboarding.js`, `src/features/onboarding/Onboarding.jsx`

---

### user_ratings
Explicit user feedback with star ratings and optional reviews. Links back to mood session.

| Detail | Value |
|--------|-------|
| Rows | 8 |
| PK | `id` (uuid) |
| FK | `user_id` -> `users.id`, `movie_id` -> `movies.id`, `mood_session_id` -> `mood_sessions.id` |
| Columns | `rating` (**integer 1-10**), `review_text`, `rated_at`, `helpful_count`, `source` |

**Read:** `src/shared/services/ratings.js`, `src/shared/services/personalRating.js`, `src/shared/hooks/useMovieRating.js`
**Write:** `src/shared/hooks/useMovieRating.js`, `src/shared/components/MovieSentimentWidget.jsx`

---

### user_history
Watch history tracking. Records when a user watched a movie and through which source.

| Detail | Value |
|--------|-------|
| Rows | 161 |
| PK | `id` (uuid) |
| FK | `user_id` -> `users.id`, `movie_id` -> `movies.id`, `mood_session_id` -> `mood_sessions.id` |
| Columns | `watched_at`, `watch_duration_minutes`, `source`, `created_at` |

**Read:** `src/shared/services/recommendations.js`, `src/shared/services/tasteCache.js`, `src/app/pages/watched/WatchedHistory.jsx`, `src/app/pages/profile/TasteProfile.jsx`
**Write:** `src/shared/hooks/useUserMovieStatus.js`, `src/app/pages/watchlist/Watchlist.jsx`

---

### user_watchlist
"Want to watch" queue. Tracks when added, current status, and recommendation attribution.

| Detail | Value |
|--------|-------|
| Rows | 12 |
| PK | (`user_id`, `movie_id`) |
| FK | `user_id` -> `users.id`, `movie_id` -> `movies.id`, `mood_session_id` -> `mood_sessions.id` |
| Columns | `added_at`, `status` (default `want_to_watch`), `added_from_recommendation`, `source`, `watched_at`, `removed_at`, `reason_added` (text[]), `priority`, `deferred_at` |

**Read:** `src/shared/services/watchlist.js`, `src/shared/hooks/useWatchlistActions.js`
**Write:** `src/shared/services/watchlist.js`, `src/shared/hooks/useUserMovieStatus.js`

---

### user_movie_feedback
Per-movie sentiment feedback (thumbs up/down, sentiment, what stood out).

| Detail | Value |
|--------|-------|
| Rows | 57 |
| PK | `id` (uuid) |
| FK | `movie_id` -> `movies.id` |
| Columns | `user_id`, `feedback_type`, `feedback_value` (smallint), `page`, `placement`, `position`, `mood_id`, `viewing_context`, `experience_type`, `algo_version`, `recommendation_score`, `sentiment` (enum), `watched_confirmed`, `watched_at`, `viewing_context_tags` (text[]), `what_stood_out` (text[]), `movie_id` |

**Read:** `src/shared/services/feedback.js`, `src/shared/hooks/useFeedback.js`
**Write:** `src/shared/services/feedback.js`

---

### user_interactions
General-purpose interaction tracking for behavioral analysis.

| Detail | Value |
|--------|-------|
| Rows | 347 |
| PK | `id` (bigint, serial) |
| FK | `movie_id` -> `movies.id` |
| Columns | `user_id`, `interaction_type` (text), `metadata` (jsonb), `source`, `session_id`, `duration_ms`, `created_at` |

Common `interaction_type` values: `mood_chip_click`, `watchlist_add`, `card_expand`, `detail_view`, etc.

**Write:** `src/shared/services/interactions.js`

---

### user_preferences
Genre selections from onboarding. Informs initial recommendations before behavioral data exists.

| Detail | Value |
|--------|-------|
| Rows | 52 |
| PK | (`user_id`, `genre_id`) |
| FK | `user_id` -> `users.id`, `genre_id` -> `genres.id` |

**Read:** `src/shared/services/recommendations.js`
**Write:** `src/app/header/components/Preferences.jsx`

---

### user_profiles_computed
Cached user preference profiles to avoid real-time computation. Includes taste fingerprint and personal ratings cache.

| Detail | Value |
|--------|-------|
| Rows | 8 |
| PK | `user_id` (uuid) |
| FK | `user_id` -> `users.id` |
| Columns | `profile` (jsonb), `seed_films` (jsonb), `computed_at`, `data_points`, `confidence` (text), `personal_ratings` (jsonb), `personal_ratings_computed_at`, `taste_fingerprint` (jsonb), `taste_fingerprint_computed_at` |

`taste_fingerprint` schema: `{topMoodTags, topToneTags, topFitProfiles}` — aggregated from watch history. TTL 24h.
`personal_ratings` schema: `{movieId: {rating, confidence, factors}}` — per-user predicted ratings. TTL 24h.

**Read/Write:** `src/shared/services/personalRating.js`, `src/shared/services/tasteCache.js`, `src/shared/services/recommendations.js`

---

### user_similarity
Pre-computed similarity scores between users for collaborative filtering.

| Detail | Value |
|--------|-------|
| Rows | 0 |
| PK | (`user_a_id`, `user_b_id`) |
| FK | `user_a_id` -> `users.id`, `user_b_id` -> `users.id` |
| Columns | `mood_similarity`, `rating_similarity`, `genre_similarity`, `overall_similarity`, `movies_in_common` |

**Read:** `src/shared/services/recommendations.js`

---

### user_follows
Social follow graph between users.

| Detail | Value |
|--------|-------|
| Rows | 5 |
| PK | (`follower_id`, `following_id`) |
| FK | `follower_id` -> `users.id`, `following_id` -> `users.id` |

**Read:** `src/app/pages/people/UserSearchPage.jsx`, `src/app/pages/feed/FeedPage.jsx`
**Write:** `src/shared/components/FollowButton.jsx`

---

### user_sessions
Session tracking for engagement analysis.

| Detail | Value |
|--------|-------|
| Rows | 352 |
| PK | `id` (uuid) |
| Columns | `user_id`, `started_at`, `ended_at`, `duration_seconds`, `device_type`, `browser`, `referrer`, `pages_viewed`, `movies_viewed`, `interactions_count`, `metadata` (jsonb) |

**Read/Write:** `src/shared/services/interactions.js`

---

### user_events
Lightweight event tracking for browsing behavior.

| Detail | Value |
|--------|-------|
| Rows | 0 |
| PK | `id` (uuid) |
| FK | `movie_id` -> `movies.id` |
| Columns | `user_id`, `event_type`, `movie_id`, `metadata` (jsonb), `session_id`, `created_at` |

**Write:** `src/shared/services/events-tracker.js`

---

## Recommendations Domain

### mood_sessions
Core table linking user emotional state to a browsing session. Central hub connecting intent to recommendations to outcomes.

| Detail | Value |
|--------|-------|
| Rows | 49 |
| PK | `id` (uuid) |
| FK | `user_id` -> `users.id`, `mood_id` -> `moods.id`, `viewing_context_id` -> `viewing_contexts.id`, `experience_type_id` -> `experience_types.id` |
| Columns | `energy_level`, `intensity_openness`, `created_at`, `session_ended_at`, `recommendations_viewed`, `time_of_day`, `day_of_week`, `device_type`, `experiment_id` |

**Read/Write:** `src/shared/hooks/useMoodSession.js`

---

### mood_session_abandoned
Tracks abandoned mood sessions for funnel analysis.

| Detail | Value |
|--------|-------|
| Rows | 12 |
| PK | `id` (bigint) |
| Columns | `user_id`, `selected_mood_id`, `reached_stage` (smallint), `had_free_text`, `created_at` |

**No active codebase references.** Written by a database trigger or edge function.

---

### recommendation_events
Mood-session-scoped recommendation tracking. Captures what was shown and user actions (click/watch/skip/rate).

| Detail | Value |
|--------|-------|
| Rows | 403 |
| PK | `id` (uuid) |
| FK | `mood_session_id` -> `mood_sessions.id`, `movie_id` -> `movies.id`, `user_id` -> `users.id` |
| Columns | `rank_position`, `recommendation_score`, `recommendation_reason`, `shown_at`, `clicked_at`, `added_to_watchlist_at`, `watched_at`, `skipped_at`, `rating` (smallint) |

**Write:** `src/shared/hooks/useRecommendationTracking.js`

---

### recommendation_impressions
Homepage-row-scoped impression tracking. Drives skip-signal feedback into `scoreMovieForUser`.

| Detail | Value |
|--------|-------|
| Rows | ~6,584 |
| PK | `id` (uuid) |
| FK | `movie_id` -> `movies.id`, `user_id` -> `users.id`, `seed_movie_id` -> `movies.id` |
| Columns | `placement` (text: hero, quick_picks, because_you_watched, etc.), `shown_at`, `shown_date`, `clicked`, `clicked_at`, `skipped`, `added_to_watchlist`, `marked_watched`, `pick_reason_type`, `pick_reason_label`, `score`, `seed_movie_title`, `embedding_similarity`, `algorithm_version` |

**Write:** `src/shared/hooks/useRecommendationTracking.js`

---

### movie_recommendations
Pre-computed "similar movies" pairs. Not yet populated.

| Detail | Value |
|--------|-------|
| Rows | 0 |
| PK | (`movie_id`, `recommended_movie_id`) |
| FK | `movie_id` -> `movies.id`, `recommended_movie_id` -> `movies.id` |
| Columns | `reason`, `rank` |

**No active codebase references.**

---

### discover_moods
Mood definitions used by the discover/recommendation engine (separate from the `moods` lookup).

| Detail | Value |
|--------|-------|
| Rows | 12 |
| PK | `id` (integer) |
| Columns | `name`, `preferred_tags` (text[]), `avoided_tags` (text[]), `preferred_tones` (text[]) |

**Read:** `src/shared/services/recommendations.js`

---

### discover_mood_genre_weights
Genre weights per mood with pacing/intensity ranges for the discover engine.

| Detail | Value |
|--------|-------|
| Rows | 34 |
| PK | `id` (bigint) |
| Columns | `mood_id`, `genre_id`, `weight` (numeric), `pacing_min`, `pacing_max`, `intensity_min`, `intensity_max` |

**Read:** `src/shared/services/recommendations.js`

---

## Lists Domain

### lists
User-created movie lists (public or private).

| Detail | Value |
|--------|-------|
| Rows | 1 |
| PK | `id` (uuid) |
| FK | `user_id` -> `users.id` |
| Columns | `title`, `description`, `is_public` (default true), `created_at`, `updated_at` |

**Read/Write:** `src/app/pages/lists/ListsPage.jsx`, `src/app/pages/lists/CreateListModal.jsx`

---

### list_movies
Junction: lists to movies with ordering and notes.

| Detail | Value |
|--------|-------|
| Rows | 4 |
| PK | (`list_id`, `movie_id`) |
| FK | `list_id` -> `lists.id`, `movie_id` -> `movies.id` |
| Columns | `added_at`, `note`, `position` |

**Read/Write:** `src/app/pages/lists/ListDetailPage.jsx`, `src/app/pages/lists/AddToListModal.jsx`

---

## Pipeline Domain

### discovery_cursors
Tracks TMDB discovery pagination state per strategy to avoid re-fetching.

| Detail | Value |
|--------|-------|
| Rows | 47 |
| Columns | `strategy_name` (text), `last_page_fetched`, `exhausted`, `last_run_at` |

**Read/Write:** `scripts/pipeline/01-discover-new-movies.js`

---

### update_runs
Pipeline run metadata: what ran, when, and what it produced.

| Detail | Value |
|--------|-------|
| Rows | 0 |
| PK | `id` (uuid) |
| Columns | `run_type`, `started_at`, `completed_at`, `movies_added`, `movies_updated`, `scores_calculated`, `embeddings_generated`, `api_calls_used` (jsonb), `errors` (jsonb), `status` |

**Read/Write:** `scripts/utils/supabase.js`, `scripts/utils/pipeline-logger.js`

---

## Views

### vw_movies_scored
Read-only view of scored, valid movies with genre/keyword counts.

```sql
SELECT m.id, m.title, m.ff_rating, m.quality_score,
       m.cult_status_score, m.vfx_level_score, m.starpower_score,
       count(DISTINCT mg.genre_id) AS genre_count,
       count(DISTINCT mk.keyword_id) AS keyword_count
FROM movies m
LEFT JOIN movie_genres mg ON mg.movie_id = m.id
LEFT JOIN movie_keywords mk ON mk.movie_id = m.id
WHERE m.is_valid = true AND m.has_scores = true
GROUP BY m.id, ...;
```

---

## Tables Dropped (2026-04-19)

The following tables were confirmed unused (zero rows AND zero code references) and removed in migration `20260506000000_drop_unused_tables.sql`:

`user_movie_interactions`, `mood_transitions`, `movie_content_features`, `recommendation_experiments`, `mood_genre_affinity`, `movie_engagement_events`, `movie_cowatch_patterns`, `movie_completion_stats`, `staging_ratings_external`, `movie_update_queue`, `homepage_recommendation_cache`, `user_movie_notes`, `user_preferences_audit`

Also dropped: `user_engagement_stats` (materialized view), `user_movie_feedback.tmdb_id` (dead column).
