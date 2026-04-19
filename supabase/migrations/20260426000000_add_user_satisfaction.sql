-- Aggregated user satisfaction score per movie.
-- Computed by pipeline step 10 from ratings, feedback, sentiment, and completion data.

ALTER TABLE movies ADD COLUMN IF NOT EXISTS user_satisfaction_score smallint
  CHECK (user_satisfaction_score IS NULL OR (user_satisfaction_score BETWEEN 0 AND 100));
ALTER TABLE movies ADD COLUMN IF NOT EXISTS user_satisfaction_confidence smallint
  CHECK (user_satisfaction_confidence IS NULL OR (user_satisfaction_confidence BETWEEN 0 AND 100));
ALTER TABLE movies ADD COLUMN IF NOT EXISTS user_satisfaction_sample_size integer DEFAULT 0;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS user_satisfaction_computed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_movies_user_satisfaction_score ON movies(user_satisfaction_score) WHERE user_satisfaction_score IS NOT NULL;
