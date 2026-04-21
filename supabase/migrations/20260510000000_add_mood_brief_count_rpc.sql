-- Fast candidate count for the Mood Brief live counter.
-- Returns approximate pool size as filters narrow.
CREATE OR REPLACE FUNCTION public.count_brief_candidates(
  p_mood_id integer DEFAULT NULL,
  p_energy integer DEFAULT NULL,
  p_attention text DEFAULT NULL,
  p_tone text DEFAULT NULL,
  p_time text DEFAULT NULL,
  p_era text DEFAULT NULL,
  p_languages text[] DEFAULT NULL
) RETURNS integer
LANGUAGE sql STABLE AS $$
  SELECT COUNT(*)::integer FROM public.movies m
  WHERE m.is_valid = true
    AND m.poster_path IS NOT NULL
    AND m.tmdb_id IS NOT NULL
    AND m.ff_rating_genre_normalized >= 6.5
    AND m.ff_confidence >= 40
    AND (p_languages IS NULL OR m.original_language = ANY(p_languages))
    AND (p_energy IS NULL OR (
      m.pacing_score_100 BETWEEN (p_energy * 20 - 35) AND (p_energy * 20 + 35)
      AND m.intensity_score_100 BETWEEN (p_energy * 20 - 35) AND (p_energy * 20 + 35)
    ))
    AND (p_attention IS NULL OR p_attention = 'either' OR (
      CASE p_attention
        WHEN 'lean-in' THEN m.attention_demand >= 60
        WHEN 'lean-back' THEN m.attention_demand <= 55
      END
    ))
    AND (p_tone IS NULL OR p_tone = 'any' OR (
      CASE p_tone
        WHEN 'warm' THEN m.tone_tags && ARRAY['warm','hopeful','earnest','uplifting']::text[]
        WHEN 'sharp' THEN m.tone_tags && ARRAY['sharp','sardonic','cynical','acerbic']::text[]
        WHEN 'bittersweet' THEN m.tone_tags && ARRAY['bittersweet','melancholic','wistful','poignant']::text[]
      END
    ))
    AND (p_time IS NULL OR p_time = 'any' OR (
      CASE p_time
        WHEN 'short' THEN m.runtime <= 90 AND m.runtime >= 60
        WHEN 'standard' THEN m.runtime > 90 AND m.runtime <= 150
        WHEN 'long' THEN m.runtime > 150
      END
    ))
    AND (p_era IS NULL OR p_era = 'any' OR (
      CASE p_era
        WHEN 'modern' THEN m.release_year >= 2015
        WHEN 'recent' THEN m.release_year >= 2000
        WHEN 'classic' THEN m.release_year < 2000
      END
    ));
$$;

GRANT EXECUTE ON FUNCTION public.count_brief_candidates TO authenticated, anon;
