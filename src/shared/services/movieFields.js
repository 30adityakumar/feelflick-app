// Movie table columns the recommendation engine + match % depend on.
//
// scoreMovieForUser in recommendations.js reads ~25 fields off a movie row
// (movie.keywords, movie.genres, movie.pacing_score, movie.starpower_score,
// etc.). If a surface's SELECT misses any of these, the engine sees them as
// undefined and silently contributes 0 for those dimensions — the same
// (film, user) pair then scores DIFFERENTLY on different pages.
//
// Every surface that wants to compute a consistent match % must pull
// MOVIE_ENGINE_COLS so the engine receives the same input.
//
// Note: llm_* fields are NOT used by the engine. They power UI components
// (e.g., /movie/:id mood radar). Included here so the column list is a
// single source of truth for "everything a movie row needs to be useful."
// If you want a leaner SELECT (no radar fields), strip llm_* externally.
export const MOVIE_ENGINE_COLS = `
  id, tmdb_id, title, release_date, release_year, runtime,
  director_name, lead_actor_name, primary_genre, genres, keywords,
  certification,
  poster_path, backdrop_path, original_language,
  overview, tagline, vote_average, popularity,
  mood_tags, tone_tags, fit_profile,
  ff_audience_rating, ff_audience_confidence,
  ff_critic_rating, ff_critic_confidence,
  ff_final_rating, ff_rating, ff_rating_genre_normalized, ff_confidence,
  discovery_potential, polarization_score, starpower_score,
  accessibility_score, cult_status_score, quality_score,
  pacing_score, intensity_score, emotional_depth_score,
  dialogue_density, attention_demand, vfx_level_score,
  user_satisfaction_score, user_satisfaction_confidence,
  llm_pacing, llm_intensity, llm_emotional_depth,
  llm_dialogue_density, llm_attention_demand
`
