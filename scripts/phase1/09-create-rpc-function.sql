-- Drop existing function
DROP FUNCTION IF EXISTS get_mood_recommendations(integer, integer, integer, integer, integer, integer, uuid);

-- Enhanced recommendation function with favorite movies analysis
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
  fav_movie_ids integer[];
  fav_genres integer[];
  avg_fav_pacing double precision;
  avg_fav_intensity double precision;
  avg_fav_depth double precision;
BEGIN
  -- Get user's preferred genres from onboarding
  IF p_user_id IS NOT NULL THEN
    SELECT array_agg(up.genre_id) INTO user_genre_ids
    FROM user_preferences up
    WHERE up.user_id = p_user_id;

    -- Get user's favorite movies from onboarding
    SELECT array_agg(uh.movie_id) INTO fav_movie_ids
    FROM user_history uh
    WHERE uh.user_id = p_user_id 
    AND uh.source = 'onboarding';

    -- If user has favorite movies, analyze them
    IF fav_movie_ids IS NOT NULL AND array_length(fav_movie_ids, 1) > 0 THEN
      -- Get genres from favorite movies
      SELECT array_agg(DISTINCT mg2.genre_id) INTO fav_genres
      FROM movie_genres mg2
      WHERE mg2.movie_id = ANY(fav_movie_ids);

      -- Calculate average taste profile from favorites
      SELECT 
        AVG(m2.pacing_score),
        AVG(m2.intensity_score),
        AVG(m2.emotional_depth_score)
      INTO avg_fav_pacing, avg_fav_intensity, avg_fav_depth
      FROM movies m2
      WHERE m2.id = ANY(fav_movie_ids);
    END IF;
  END IF;

  -- Get experience type preferences
  SELECT et.preferred_genres, et.avoid_genres INTO exp_preferred_genres, exp_avoid_genres
  FROM experience_types et
  WHERE et.id = p_experience_type_id;

  -- Get viewing context preferences
  SELECT vc.prefer_shorter_runtime INTO context_prefer_shorter
  FROM viewing_contexts vc
  WHERE vc.id = p_viewing_context_id;

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
      
      -- User onboarding genre preferences boost
      CASE 
        WHEN user_genre_ids IS NOT NULL AND EXISTS (
          SELECT 1 FROM movie_genres mg 
          WHERE mg.movie_id = m.id 
          AND mg.genre_id = ANY(user_genre_ids)
        ) THEN 8
        ELSE 0
      END +
      
      -- Favorite movies genre boost (stronger signal)
      CASE 
        WHEN fav_genres IS NOT NULL AND EXISTS (
          SELECT 1 FROM movie_genres mg3 
          WHERE mg3.movie_id = m.id 
          AND mg3.genre_id = ANY(fav_genres)
        ) THEN 12
        ELSE 0
      END +
      
      -- Taste profile similarity (pacing/intensity/depth match)
      CASE 
        WHEN avg_fav_pacing IS NOT NULL THEN
          GREATEST(0, 15 - (
            ABS(COALESCE(m.pacing_score, 5) - avg_fav_pacing) +
            ABS(COALESCE(m.intensity_score, 5) - avg_fav_intensity) +
            ABS(COALESCE(m.emotional_depth_score, 5) - avg_fav_depth)
          ))
        ELSE 0
      END +
      
      -- Experience type genre boost
      CASE 
        WHEN exp_preferred_genres IS NOT NULL AND EXISTS (
          SELECT 1 FROM movie_genres mg4
          WHERE mg4.movie_id = m.id 
          AND mg4.genre_id = ANY(exp_preferred_genres)
        ) THEN 8
        ELSE 0
      END +
      
      -- Experience type genre penalty
      CASE 
        WHEN exp_avoid_genres IS NOT NULL AND EXISTS (
          SELECT 1 FROM movie_genres mg5
          WHERE mg5.movie_id = m.id 
          AND mg5.genre_id = ANY(exp_avoid_genres)
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
    AND (fav_movie_ids IS NULL OR m.id != ALL(fav_movie_ids))
  ORDER BY final_score DESC
  LIMIT p_limit;
END;
$$;