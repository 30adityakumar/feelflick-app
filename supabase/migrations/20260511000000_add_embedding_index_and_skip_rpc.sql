-- NOTE: HNSW/IVFFlat vector indexes require dims ≤ 2000 on pgvector < 0.7.0.
-- Our embeddings are 3072-dim (text-embedding-3-large), so no index is possible
-- on the current Supabase instance (pgvector 0.5.x). match_movies_by_seeds does
-- sequential scan. Mitigated by batching all seeds into a single RPC call.
--
-- When pgvector is upgraded to 0.7.0+, add:
-- CREATE INDEX idx_movies_embedding_hnsw ON public.movies
--   USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- RPC: returns movie_ids with high skip rates across all users.
-- Used by getCommunityHighSkipSet in recommendations.js.
-- Previously missing — JS fell back to fetching all impressions client-side.
CREATE OR REPLACE FUNCTION get_high_skip_movies(
  min_impressions int DEFAULT 20,
  min_skip_rate numeric DEFAULT 0.40
) RETURNS TABLE(movie_id int) AS $$
  SELECT ri.movie_id
  FROM recommendation_impressions ri
  GROUP BY ri.movie_id
  HAVING COUNT(*) >= min_impressions
    AND COUNT(*) FILTER (WHERE ri.skipped = true)::float / COUNT(*) > min_skip_rate;
$$ LANGUAGE sql STABLE;
