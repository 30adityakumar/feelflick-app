-- Drop existing function
DROP FUNCTION IF EXISTS get_mood_recommendations(integer, integer, integer, integer, integer, integer, uuid);

-- Create recommendation function with context & experience filtering
CREATE OR REPLACE FUNCTION get_mood_recommendations(
  p_mood_id integer,
  p_viewing_context_id integer DEFAULT 1,
  p_experience_type_id integer DEFAULT 1,
  p_energy_level integer DEFAULT 5,
  p_intensity_openness integer DEFAULT 5,
  p_limit integer DEFAULT 20,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  movie_id integer,
  tmdb_id bigint,
  title text,
  poster_path text,
  backdrop_path text,
  runtime integer,
  vote_average double precision,
  release_date date,
  final_score double precision
)
LANGUAGE plpgsql
AS $$
DECLARE
  user_genre_ids integer[];
  exp_preferred_genres integer[];
  exp_avoid_genres integer[];
  context_prefer_shorter boolean;
BEGIN
  -- Get user's preferred genres
  IF p_user_id IS NOT NULL THEN
    SELECT array_agg(genre_id) INTO user_genre_ids
    FROM user_preferences
    WHERE user_id = p_user_id;
  END IF;

  -- Get experience type preferences
  SELECT preferred_genres, avoid_genres INTO exp_preferred_genres, exp_avoid_genres
  FROM experience_types
  WHERE id = p_experience_type_id;

  -- Get viewing context preferences
  SELECT prefer_shorter_runtime INTO context_prefer_shorter
  FROM viewing_contexts
  WHERE id = p_viewing_context_id;

  RETURN QUERY
  SELECT 
    m.id as movie_id,
    m.tmdb_id,
    m.title,
    m.poster_path,
    m.backdrop_path,
    m.runtime,
    m.vote_average,
    m.release_date,
    (
      mms.score + 
      COALESCE(m.quality_score * 0.3, (m.vote_average - 6.0) * 5) +
      -- User preference boost
      CASE 
        WHEN user_genre_ids IS NOT NULL AND EXISTS (
          SELECT 1 FROM movie_genres mg 
          WHERE mg.movie_id = m.id 
          AND mg.genre_id = ANY(user_genre_ids)
        ) THEN 10
        ELSE 0
      END +
      -- Experience type genre boost
      CASE 
        WHEN exp_preferred_genres IS NOT NULL AND EXISTS (
          SELECT 1 FROM movie_genres mg 
          WHERE mg.movie_id = m.id 
          AND mg.genre_id = ANY(exp_preferred_genres)
        ) THEN 8
        ELSE 0
      END +
      -- Experience type genre penalty
      CASE 
        WHEN exp_avoid_genres IS NOT NULL AND EXISTS (
          SELECT 1 FROM movie_genres mg 
          WHERE mg.movie_id = m.id 
          AND mg.genre_id = ANY(exp_avoid_genres)
        ) THEN -15
        ELSE 0
      END +
      -- Runtime penalty for viewing context
      CASE 
        WHEN context_prefer_shorter = true AND m.runtime > 120 THEN -8
        ELSE 0
      END
    )::double precision as final_score
  FROM movie_mood_scores mms
  JOIN movies m ON m.id = mms.movie_id
  WHERE mms.mood_id = p_mood_id
    AND mms.score >= 30
    AND m.vote_average >= 6.0
  ORDER BY final_score DESC
  LIMIT p_limit;
END;
$$;