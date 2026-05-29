---
name: recommendation-engine
description: >
  Guide and gate any work on FeelFlick's recommendation engine. Trigger on:
  "recommendations", "scoring", "ranking", "mood to film", "pgvector",
  "similarity", "embeddings", "engine tuning", "why this movie", "skip signal",
  "anti-recency", "decay", "discover", or any change to mood_sessions,
  recommendation_events/impressions, movie_similarity, movie_mood_scores,
  user_profiles_computed, or scripts/pipeline/.
---

# Recommendation Engine

FeelFlick's core: turn a stated mood into the right film. The engine is
content-based filtering + pgvector cosine similarity + behavioral signals.
This is the most valuable AND most fragile subsystem — treat changes with care.

## Architecture (what's actually there)
- **Catalog:** `movies` (~12k), `movie_genres`, `movie_keywords`, `people`,
  `movie_mood_scores` (~96k pre-computed movie×mood compatibility 0–100).
- **Vectors:** 3072-dim OpenAI embeddings; `movie_similarity` (~926k pre-computed
  top-N cosine neighbors, built by `scripts/pipeline/11-build-similarity.js`).
- **Intent:** `mood_sessions` (mood + context + experience + energy/intensity).
- **Signals:** `recommendation_events` (mood-session-scoped: click/watch/skip/rate),
  `recommendation_impressions` (homepage-row-scoped — feeds skip signals into
  `scoreMovieForUser`), `user_interactions`, `user_ratings`.
- **Cache:** `user_profiles_computed` (taste profile, TTL — invalidated by
  `invalidate_user_profile_cache`; cleaned by `cleanup_expired_profile_caches`).
- **Pipeline:** `scripts/pipeline/` ingest TMDB → embed → score → build similarity.
- **Service code:** `src/shared/services/recommendations.js`, `interactions.js`.
- **RPCs:** `get_mood_recommendations(_v2)`, `match_movies`, `get_seed_neighbors`,
  `match_movies_by_seeds`, `find_top_neighbors`.

## Hard rules
1. **DB-FIRST — always.** Before changing any filter / score / limit, query the
   ACTUAL data: catalog distribution (genre/decade/runtime/language), tag & mood
   coverage, and **candidate pool composition at each pipeline stage**. Never tune
   from assumptions. (See [[feedback_db_first_analysis]].) Show the numbers that
   justify the change.
2. **Anti-recency + decay are intentional.** Don't "fix" the engine by surfacing
   newest/most-popular — that's the trending behaviour FeelFlick rejects. Preserve
   signal decay and the anti-recency bias.
3. **Skips are signal, not noise.** Skip rate (`recommendation_impressions`) feeds
   scoring. Don't drop or flatten it.
4. **Validate against real outcomes.** Justify scoring changes against
   `recommendation_events`/`impressions`, not vibes. State expected effect on
   skip-rate / watch-rate.
5. **Cache + DDL safety** → defer to [[supabase-change]]. Re-scoring or schema
   changes have TTL and pipeline implications; service_role runs the pipeline.

## Output
Lead with the data (the pool/coverage numbers), then the proposed change, then the
expected measurable effect. If you're reasoning without having queried the data, stop.
