-- Add indexes for recommendation queries
-- Run this in Supabase SQL Editor

-- User history indexes
CREATE INDEX IF NOT EXISTS idx_user_history_user_id 
  ON user_history(user_id);
  
CREATE INDEX IF NOT EXISTS idx_user_history_user_watched 
  ON user_history(user_id, watched_at DESC);

-- User preferences index
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
  ON user_preferences(user_id);

-- Movies indexes for filtering
CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id 
  ON movies(tmdb_id) WHERE tmdb_id IS NOT NULL;
  
CREATE INDEX IF NOT EXISTS idx_movies_quality 
  ON movies(vote_average, popularity) 
  WHERE vote_average IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_movies_pacing 
  ON movies(pacing_score) 
  WHERE pacing_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_movies_intensity 
  ON movies(intensity_score) 
  WHERE intensity_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_movies_runtime 
  ON movies(runtime) 
  WHERE runtime IS NOT NULL;

-- Composite index for themed rows
CREATE INDEX IF NOT EXISTS idx_movies_themed_rows 
  ON movies(vote_average, popularity, pacing_score, intensity_score) 
  WHERE vote_average IS NOT NULL;

-- Analyze tables to update statistics
ANALYZE user_history;
ANALYZE user_preferences;
ANALYZE movies;
