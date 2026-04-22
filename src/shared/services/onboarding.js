// src/shared/services/onboarding.js
import { supabase } from '@/shared/lib/supabase/client'
import { fetchJson } from '@/shared/api/tmdb'
import { computeUserProfileV3 } from './recommendations'
import { track } from './analytics'

// === HELPERS ===

/**
 * Ensure the users row exists. Inserts one if missing.
 * @param {{ id: string, email: string, user_metadata: object }} user
 */
async function ensureUserRow(user) {
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existing) return

  const { error } = await supabase.from('users').insert({
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || null,
  })

  if (error) throw new Error('Could not create your profile')
}

/**
 * Resolve internal movie ID, inserting the movie if it doesn't exist yet.
 * @param {object} tmdbMovie — TMDB-shaped movie object with at least `id`, `poster_path`, `title`
 * @returns {Promise<string>} internal UUID from movies table
 */
async function ensureMovieExists(tmdbMovie) {
  const { data: existing } = await supabase
    .from('movies')
    .select('id')
    .eq('tmdb_id', tmdbMovie.id)
    .maybeSingle()

  if (existing) return existing.id

  // Try to fetch full movie details; fall back to search data
  let fullMovie = tmdbMovie
  try {
    fullMovie = await fetchJson(`/movie/${tmdbMovie.id}`)
  } catch (err) {
    console.warn('Could not fetch full movie details, using search data:', err)
  }

  const movieRow = {
    tmdb_id: fullMovie.id,
    title: fullMovie.title,
    original_title: fullMovie.original_title,
    release_date: fullMovie.release_date || null,
    overview: fullMovie.overview || null,
    poster_path: fullMovie.poster_path,
    backdrop_path: fullMovie.backdrop_path,
    runtime: fullMovie.runtime || null,
    vote_average: fullMovie.vote_average || null,
    vote_count: fullMovie.vote_count || null,
    popularity: fullMovie.popularity || null,
    original_language: fullMovie.original_language,
    adult: fullMovie.adult || false,
    budget: fullMovie.budget || null,
    revenue: fullMovie.revenue || null,
    status: fullMovie.status || null,
    tagline: fullMovie.tagline || null,
    homepage: fullMovie.homepage || null,
    imdb_id: fullMovie.imdb_id || null,
    json_data: fullMovie,
  }

  const { data: inserted, error } = await supabase
    .from('movies')
    .upsert(movieRow, { onConflict: 'tmdb_id', ignoreDuplicates: false })
    .select('id')
    .single()

  if (error) throw new Error(`Could not save movie: ${fullMovie.title}`)
  return inserted.id
}

// === PUBLIC API ===

/**
 * Persist all onboarding signals, compute the user profile, and mark onboarding complete.
 *
 * Write order:
 *   1. user_preferences (genre IDs)
 *   2. user_history (one row per favoriteMovie, source: 'onboarding')
 *   3. user_ratings (one row per rated film, source: 'onboarding')
 *   4. users.onboarding_complete = true
 *   5. auth metadata update
 *   6. computeUserProfileV3 (sync — ensures /home has profile on first load)
 *   7. Verify profile row exists, retry once if missing
 *
 * @param {{
 *   session: import('@supabase/supabase-js').Session,
 *   selectedGenres: number[],
 *   favoriteMovies: object[],
 *   ratings: Record<number, number>,
 * }} params
 * @returns {Promise<void>}
 */
export async function completeOnboarding({ session, selectedGenres, favoriteMovies, ratings }) {
  const user = session?.user
  if (!user?.id) throw new Error('No authenticated user.')

  const user_id = user.id
  const now = new Date().toISOString()

  // 1. Ensure users row exists
  await ensureUserRow(user)

  // 2. Genre preferences — replace any existing rows
  if (selectedGenres.length > 0) {
    await supabase.from('user_preferences').delete().eq('user_id', user_id)
    const genreRows = selectedGenres.map(genre_id => ({ user_id, genre_id }))
    const { error: prefError } = await supabase
      .from('user_preferences')
      .upsert(genreRows, { onConflict: 'user_id,genre_id' })
    if (prefError) throw new Error('Could not save your genre preferences')
  }

  // 3. Watch history for all favorite films (resolve internal IDs in parallel)
  const internalIdMap = {}
  if (favoriteMovies.length > 0) {
    const movieIdResults = await Promise.all(
      favoriteMovies.map(async (tmdbMovie) => {
        try {
          const internalId = await ensureMovieExists(tmdbMovie)
          internalIdMap[tmdbMovie.id] = internalId
          return { user_id, movie_id: internalId, watched_at: now, source: 'onboarding', watch_duration_minutes: null, mood_session_id: null }
        } catch (err) {
          console.error(`Failed to process movie ${tmdbMovie.title}:`, err)
          return null
        }
      })
    )

    const historyRows = movieIdResults.filter(Boolean)
    if (historyRows.length > 0) {
      const { error: historyError } = await supabase.from('user_history').insert(historyRows)
      if (historyError) throw new Error('Could not save your favorite movies')
    }
  }

  // 4. Ratings — one row per rated film (all films the user assigned a sentiment to)
  const ratingEntries = Object.entries(ratings || {})
  if (ratingEntries.length > 0) {
    for (const [tmdbIdStr, rating] of ratingEntries) {
      const tmdbId = Number(tmdbIdStr)
      const movie = favoriteMovies.find(m => m.id === tmdbId)
      if (!movie) continue
      try {
        const internalId = internalIdMap[tmdbId] ?? (movie.internalId || await ensureMovieExists(movie))
        await supabase.from('user_ratings').insert({
          user_id,
          movie_id: internalId,
          rating,
          source: 'onboarding',
        })
      } catch (err) {
        // Non-fatal — profile computes fine without individual rating rows
        console.warn(`Could not save rating for tmdbId ${tmdbId}:`, err)
      }
    }
  }

  // 5. Mark onboarding complete in users table
  await supabase.from('users').update({
    onboarding_complete: true,
    onboarding_completed_at: now,
  }).eq('id', user_id)

  // 6. Update auth metadata so PostAuthGate stops redirecting to /onboarding
  await supabase.auth.updateUser({
    data: { onboarding_complete: true, has_onboarded: true },
  })

  // 7. Compute profile synchronously — /home needs it on first load
  try {
    await computeUserProfileV3(user_id, { forceRefresh: true })

    // Verify the profile row was written; retry once if missing
    const { data: profile } = await supabase
      .from('user_profiles_computed')
      .select('user_id')
      .eq('user_id', user_id)
      .maybeSingle()

    if (!profile) {
      console.warn('Profile row missing after compute — retrying once')
      await computeUserProfileV3(user_id, { forceRefresh: true })
    }
  } catch (err) {
    console.warn('Profile computation failed during onboarding:', err)
  }

  // 8. Analytics
  track('onboarding_completed', {
    genre_count: selectedGenres.length,
    movie_count: favoriteMovies.length,
    rating_count: ratingEntries.length,
  })
}
