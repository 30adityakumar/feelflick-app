-- Update match_movies_by_seeds to use ff_final_rating and return community rating fields.
-- ff_final_rating = ff_rating for movies with no user votes, so the filter is backwards-compatible.

CREATE OR REPLACE FUNCTION public.match_movies_by_seeds(
  seed_ids    integer[],
  exclude_ids integer[],
  match_count integer DEFAULT 50,
  min_ff_rating numeric DEFAULT 6.0
)
RETURNS TABLE(
  id                    integer,
  tmdb_id               bigint,
  title                 text,
  overview              text,
  tagline               text,
  original_language     text,
  runtime               integer,
  release_year          integer,
  release_date          date,
  poster_path           text,
  backdrop_path         text,
  trailer_youtube_key   text,
  ff_rating             numeric,
  ff_final_rating       numeric,
  ff_community_rating   numeric,
  ff_community_votes    integer,
  ff_confidence         integer,
  quality_score         integer,
  vote_average          double precision,
  vote_count            integer,
  popularity            double precision,
  revenue               bigint,
  pacing_score          integer,
  intensity_score       integer,
  emotional_depth_score integer,
  dialogue_density      integer,
  attention_demand      integer,
  vfx_level_score       integer,
  cult_status_score     integer,
  starpower_score       integer,
  director_name         text,
  lead_actor_name       text,
  genres                jsonb,
  keywords              jsonb,
  primary_genre         text,
  similarity            double precision,
  matched_seed_id       integer,
  matched_seed_title    text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH seed_data AS (
    SELECT
      m.id       AS seed_id,
      m.title    AS seed_title,
      m.embedding
    FROM movies m
    WHERE m.id = ANY(seed_ids)
      AND m.embedding IS NOT NULL
  ),
  similarity_scores AS (
    SELECT
      m.id,
      m.tmdb_id,
      m.title,
      m.overview,
      m.tagline,
      m.original_language,
      m.runtime,
      m.release_year,
      m.release_date,
      m.poster_path,
      m.backdrop_path,
      m.trailer_youtube_key,
      m.ff_rating,
      COALESCE(m.ff_final_rating, m.ff_rating) AS ff_final_rating,
      m.ff_community_rating,
      m.ff_community_votes,
      m.ff_confidence,
      m.quality_score,
      m.vote_average,
      m.vote_count,
      m.popularity,
      m.revenue,
      m.pacing_score,
      m.intensity_score,
      m.emotional_depth_score,
      m.dialogue_density,
      m.attention_demand,
      m.vfx_level_score,
      m.cult_status_score,
      m.starpower_score,
      m.director_name,
      m.lead_actor_name,
      m.genres,
      m.keywords,
      m.primary_genre,
      (1 - (m.embedding <=> sd.embedding))::DOUBLE PRECISION AS similarity,
      sd.seed_id    AS matched_seed_id,
      sd.seed_title AS matched_seed_title
    FROM movies m
    CROSS JOIN seed_data sd
    WHERE m.embedding IS NOT NULL
      AND m.is_valid = TRUE
      AND COALESCE(m.ff_final_rating, m.ff_rating) >= min_ff_rating
      AND m.id != ALL(seed_ids)
      AND m.id != ALL(exclude_ids)
      AND m.backdrop_path IS NOT NULL
  ),
  best_matches AS (
    SELECT DISTINCT ON (ss.id)
      ss.*
    FROM similarity_scores ss
    ORDER BY ss.id, ss.similarity DESC
  )
  SELECT
    bm.id,
    bm.tmdb_id,
    bm.title,
    bm.overview,
    bm.tagline,
    bm.original_language,
    bm.runtime,
    bm.release_year,
    bm.release_date,
    bm.poster_path,
    bm.backdrop_path,
    bm.trailer_youtube_key,
    bm.ff_rating,
    bm.ff_final_rating,
    bm.ff_community_rating,
    bm.ff_community_votes,
    bm.ff_confidence,
    bm.quality_score,
    bm.vote_average,
    bm.vote_count,
    bm.popularity,
    bm.revenue,
    bm.pacing_score,
    bm.intensity_score,
    bm.emotional_depth_score,
    bm.dialogue_density,
    bm.attention_demand,
    bm.vfx_level_score,
    bm.cult_status_score,
    bm.starpower_score,
    bm.director_name,
    bm.lead_actor_name,
    bm.genres,
    bm.keywords,
    bm.primary_genre,
    bm.similarity,
    bm.matched_seed_id,
    bm.matched_seed_title
  FROM best_matches bm
  ORDER BY bm.similarity DESC
  LIMIT match_count;
END;
$$;
