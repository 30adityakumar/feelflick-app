-- ============================================================================
-- Pre-computed movie similarity table
-- ============================================================================
-- Replaces real-time match_movies_by_seeds RPC (sequential scan on 3072-dim
-- embeddings) with a pre-built neighbor graph. Build via pipeline step 11.
--
-- Each row: source_id's rank-th nearest neighbor is neighbor_id at cosine distance.
-- Top 100 neighbors per film ≈ 6,000 films × 100 = 600K rows.

CREATE TABLE IF NOT EXISTS movie_similarity (
  source_id integer NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  neighbor_id integer NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  cosine real NOT NULL,
  rank smallint NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_id, neighbor_id),
  CHECK (source_id != neighbor_id),
  CHECK (cosine >= 0 AND cosine <= 1)
);

-- Fast lookup: "give me source_id's top N neighbors ordered by rank"
CREATE INDEX idx_movie_similarity_source_rank
  ON movie_similarity (source_id, rank);

-- Reverse lookup: "which films have neighbor_id as a neighbor?"
CREATE INDEX idx_movie_similarity_neighbor
  ON movie_similarity (neighbor_id);

-- Build freshness tracking (for incremental rebuilds)
ALTER TABLE movies ADD COLUMN IF NOT EXISTS similarity_built_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_movies_similarity_stale
  ON movies (similarity_built_at)
  WHERE embedding IS NOT NULL;

-- ============================================================================
-- RPC: find_top_neighbors (offline pipeline use only)
-- ============================================================================
-- One-shot pgvector scan for a single source embedding. Slow (~2s) but runs
-- offline in the build pipeline, not at request time.

CREATE OR REPLACE FUNCTION find_top_neighbors(
  source_embedding vector(3072),
  exclude_id int,
  k int DEFAULT 100
) RETURNS TABLE(id int, similarity real) AS $$
  SELECT m.id, (1 - (m.embedding <=> source_embedding))::real AS similarity
  FROM movies m
  WHERE m.embedding IS NOT NULL
    AND m.id != exclude_id
    AND m.is_valid = true
    AND m.poster_path IS NOT NULL
  ORDER BY m.embedding <=> source_embedding
  LIMIT k;
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- RPC: get_seed_neighbors (runtime use — replaces match_movies_by_seeds)
-- ============================================================================
-- Reads pre-computed movie_similarity table. Index scan, sub-10ms.
-- Returns full movie data + similarity + matched_seed_id for direct use
-- in scoring-v3.js and recommendations.js.

CREATE OR REPLACE FUNCTION get_seed_neighbors(
  seed_ids int[],
  exclude_ids int[] DEFAULT ARRAY[]::int[],
  top_n int DEFAULT 500,
  min_ff_rating numeric DEFAULT 0
) RETURNS TABLE(
  id int,
  similarity real,
  matched_seed_id int
) AS $$
  WITH ranked AS (
    SELECT
      ms.neighbor_id,
      ms.source_id AS matched_seed_id,
      ms.cosine,
      ROW_NUMBER() OVER (PARTITION BY ms.neighbor_id ORDER BY ms.cosine DESC) AS rn
    FROM movie_similarity ms
    WHERE ms.source_id = ANY(seed_ids)
      AND ms.neighbor_id <> ALL(exclude_ids)
  )
  SELECT
    m.id,
    r.cosine AS similarity,
    r.matched_seed_id
  FROM ranked r
  JOIN movies m ON m.id = r.neighbor_id
  WHERE r.rn = 1
    AND m.is_valid = true
    AND m.poster_path IS NOT NULL
    AND COALESCE(m.ff_audience_rating, 0) >= min_ff_rating
  ORDER BY r.cosine DESC
  LIMIT top_n;
$$ LANGUAGE sql STABLE;

GRANT EXECUTE ON FUNCTION find_top_neighbors TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_seed_neighbors TO authenticated, anon;

COMMENT ON TABLE movie_similarity IS 'Pre-computed top-100 nearest neighbors per film (cosine similarity on 3072-dim embeddings). Built by pipeline step 11.';
COMMENT ON FUNCTION find_top_neighbors IS 'Offline: single-source pgvector scan. Used by build pipeline only.';
COMMENT ON FUNCTION get_seed_neighbors IS 'Runtime: fast index lookup on movie_similarity. Replaces match_movies_by_seeds.';
