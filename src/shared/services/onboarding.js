// src/shared/services/onboarding.js
import { supabase } from '@/shared/lib/supabase/client'
import { fetchJson } from '@/shared/api/tmdb'
import { computeUserProfileV3 } from './recommendations'
import { getTasteFingerprint } from './tasteCache'
import { trackEvent, EVENTS, countBucket } from './betaEvents'

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
 *   4. users.onboarding_complete = true (+ taste_baseline_moods if provided)
 *   5. auth metadata update
 *   6. computeUserProfileV3 (sync — ensures /home has profile on first load)
 *   7. Verify profile row exists, retry once if missing
 *
 * @param {{
 *   session: import('@supabase/supabase-js').Session,
 *   selectedGenres: number[],
 *   favoriteMovies: object[],
 *   ratings: Record<number, number>,
 *   moods?: string[],  // Onboarding mood baseline keys (e.g. 'cozy', 'wired'). Optional for legacy flow.
 *   markAuthComplete?: boolean,  // Defaults true. Set false to defer the auth.updateUser
 *                                 // flip — callers that want to play a celebration
 *                                 // animation before PostAuthGate auto-navigates can
 *                                 // skip it here and call markOnboardingAuthComplete()
 *                                 // themselves when ready.
 * }} params
 * @returns {Promise<void>}
 */
export async function markOnboardingAuthComplete() {
  await supabase.auth.updateUser({
    data: { onboarding_complete: true, has_onboarded: true },
  })
}

export async function completeOnboarding({ session, selectedGenres, favoriteMovies, ratings, moods = [], markAuthComplete = true }) {
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
      // Idempotent re-run: REPLACE this user's onboarding-sourced history (delete
      // by source + insert) so a re-run can't duplicate rows — the
      // (user_id, movie_id, watched_at) uniqueness lets a fresh watched_at evade
      // dedupe. Only source='onboarding' rows are touched; any non-onboarding
      // history (e.g. later logs) is preserved. No verified onConflict target is
      // captured in the repo migrations, so we use this conservative replace-by-
      // source strategy rather than an unverified upsert (F2.24).
      await supabase.from('user_history').delete().eq('user_id', user_id).eq('source', 'onboarding')
      const { error: historyError } = await supabase.from('user_history').insert(historyRows)
      if (historyError) throw new Error('Could not save your favorite movies')
    }
  }

  // 4. Ratings — one row per rated film. Build the rows (resolving internal IDs),
  //    then REPLACE this user's onboarding-sourced ratings (delete by source +
  //    batch insert) so a re-run can't hit the (user_id, movie_id) uniqueness
  //    conflict (a re-run previously raised 23505). Only source='onboarding' rows
  //    are touched; non-onboarding ratings are preserved. Persistence stays
  //    NON-FATAL — the profile computes fine without these rows. Same conservative
  //    replace-by-source rationale as history (no verified onConflict target in
  //    the repo migrations) (F2.24).
  const ratingEntries = Object.entries(ratings || {})
  if (ratingEntries.length > 0) {
    const ratingRows = []
    for (const [tmdbIdStr, rating] of ratingEntries) {
      const tmdbId = Number(tmdbIdStr)
      const movie = favoriteMovies.find(m => m.id === tmdbId)
      if (!movie) continue
      try {
        const internalId = internalIdMap[tmdbId] ?? (movie.internalId || await ensureMovieExists(movie))
        ratingRows.push({ user_id, movie_id: internalId, rating, source: 'onboarding' })
      } catch (err) {
        // Non-fatal — skip a film whose internal id can't be resolved.
        console.warn(`Could not resolve movie for rating (tmdbId ${tmdbId}):`, err)
      }
    }
    if (ratingRows.length > 0) {
      try {
        await supabase.from('user_ratings').delete().eq('user_id', user_id).eq('source', 'onboarding')
        const { error: ratingError } = await supabase.from('user_ratings').insert(ratingRows)
        if (ratingError) console.warn('Could not save onboarding ratings:', ratingError)
      } catch (err) {
        // Non-fatal — profile computes fine without individual rating rows.
        console.warn('Could not save onboarding ratings:', err)
      }
    }
  }

  // 5. Mark onboarding complete in users table.
  //    taste_baseline_moods is the cold-start mood signal from Onboarding Step 1.
  //    Skipped for the legacy flow (moods omitted/empty) so we don't clobber existing values.
  const userUpdate = {
    onboarding_complete: true,
    onboarding_completed_at: now,
  }
  if (Array.isArray(moods) && moods.length > 0) {
    userUpdate.taste_baseline_moods = moods
  }
  await supabase.from('users').update(userUpdate).eq('id', user_id)

  // 6. Update auth metadata so PostAuthGate stops redirecting to /onboarding.
  //    Skip when the caller wants to defer this flip until after a celebration
  //    animation completes — otherwise PostAuthGate fires onAuthStateChange
  //    and yanks the user to /home mid-animation.
  if (markAuthComplete) {
    await markOnboardingAuthComplete()
  }

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

  // 7b. Pre-warm the taste fingerprint cache (mood/tone/fit aggregates over the
  //     user's onboarding picks). Without this, /home's Cinematic DNA section
  //     renders placeholders on first visit and only populates when the user
  //     later opens /profile or /watchlist (which both call getTasteFingerprint).
  //     Onboarding gives us 5+ history rows so MIN_FILMS_FOR_FINGERPRINT passes.
  //     Non-fatal — /home falls back to placeholders if this errors.
  try {
    await getTasteFingerprint(user_id)
  } catch (err) {
    console.warn('Taste fingerprint pre-warm failed (non-fatal):', err)
  }

  // 8. Analytics — B1.4b: through the central fail-closed wrapper, COARSE BUCKETS only
  // (no raw counts that could fingerprint a taste profile, no titles/genres/moods text).
  trackEvent(EVENTS.onboarding_completed, {
    surface: 'onboarding',
    genre_count_bucket: countBucket(selectedGenres.length),
    movie_count_bucket: countBucket(favoriteMovies.length),
    rating_count_bucket: countBucket(ratingEntries.length),
    mood_count_bucket: countBucket(Array.isArray(moods) ? moods.length : 0),
  })
}
