-- LLM mood enrichment columns for movies table
-- Step 07b populates these via OpenAI structured output

ALTER TABLE movies ADD COLUMN IF NOT EXISTS mood_tags text[];
ALTER TABLE movies ADD COLUMN IF NOT EXISTS tone_tags text[];
ALTER TABLE movies ADD COLUMN IF NOT EXISTS fit_profile text
  CHECK (fit_profile IS NULL OR fit_profile IN (
    'crowd_pleaser', 'prestige_drama', 'arthouse', 'genre_popcorn',
    'festival_discovery', 'cult_classic', 'niche_world_cinema',
    'franchise_entry', 'comfort_watch', 'challenging_art'
  ));
ALTER TABLE movies ADD COLUMN IF NOT EXISTS llm_pacing smallint CHECK (llm_pacing IS NULL OR (llm_pacing BETWEEN 0 AND 100));
ALTER TABLE movies ADD COLUMN IF NOT EXISTS llm_intensity smallint CHECK (llm_intensity IS NULL OR (llm_intensity BETWEEN 0 AND 100));
ALTER TABLE movies ADD COLUMN IF NOT EXISTS llm_emotional_depth smallint CHECK (llm_emotional_depth IS NULL OR (llm_emotional_depth BETWEEN 0 AND 100));
ALTER TABLE movies ADD COLUMN IF NOT EXISTS llm_dialogue_density smallint CHECK (llm_dialogue_density IS NULL OR (llm_dialogue_density BETWEEN 0 AND 100));
ALTER TABLE movies ADD COLUMN IF NOT EXISTS llm_attention_demand smallint CHECK (llm_attention_demand IS NULL OR (llm_attention_demand BETWEEN 0 AND 100));
ALTER TABLE movies ADD COLUMN IF NOT EXISTS llm_confidence smallint CHECK (llm_confidence IS NULL OR (llm_confidence BETWEEN 0 AND 100));
ALTER TABLE movies ADD COLUMN IF NOT EXISTS llm_enriched_at timestamptz;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS llm_model_version text;

CREATE INDEX IF NOT EXISTS idx_movies_mood_tags ON movies USING gin(mood_tags);
CREATE INDEX IF NOT EXISTS idx_movies_tone_tags ON movies USING gin(tone_tags);
CREATE INDEX IF NOT EXISTS idx_movies_fit_profile ON movies(fit_profile);
CREATE INDEX IF NOT EXISTS idx_movies_llm_enriched_at ON movies(llm_enriched_at) WHERE llm_enriched_at IS NOT NULL;
