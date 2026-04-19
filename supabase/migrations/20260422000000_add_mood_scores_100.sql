ALTER TABLE movies ADD COLUMN IF NOT EXISTS pacing_score_100 integer;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS intensity_score_100 integer;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS emotional_depth_score_100 integer;
