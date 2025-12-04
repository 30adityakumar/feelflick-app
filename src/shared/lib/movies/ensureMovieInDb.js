// src/shared/lib/movies/ensureMovieInDb.js
import { supabase } from '@/shared/lib/supabase/client'

/**
 * Ensure a TMDB movie exists in the `movies` table and return its internal id.
 * Shared across HeroSlider, HeroTopPick, etc.
 *
 * @param {object} movie - TMDB movie object (must have `id`, `title`, etc.)
 * @returns {Promise<number | null>} internal movies.id
 */
export async function ensureMovieInDb(movie) {
  if (!movie) return null

  try {
    // 1) Try to find by tmdb_id
    const { data: existing, error: existingError } = await supabase
      .from('movies')
      .select('id')
      .eq('tmdb_id', movie.id)
      .maybeSingle()

    if (existingError) {
      console.error('[ensureMovieInDb] lookup error:', existingError)
    }

    if (existing?.id) {
      return existing.id
    }

    // 2) Upsert and return internal id
    const { data: inserted, error } = await supabase
      .from('movies')
      .upsert(
        {
          tmdb_id: movie.id,
          title: movie.title,
          original_title: movie.original_title,
          overview: movie.overview,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          release_date: movie.release_date || null,
          vote_average: movie.vote_average,
          vote_count: movie.vote_count,
          popularity: movie.popularity,
          original_language: movie.original_language,
          json_data: movie
        },
        { onConflict: 'tmdb_id' }
      )
      .select('id')
      .single()

    if (error) {
      console.error('[ensureMovieInDb] upsert error:', error)
      return null
    }

    return inserted?.id ?? null
  } catch (err) {
    console.error('[ensureMovieInDb] unexpected error:', err)
    return null
  }
}
