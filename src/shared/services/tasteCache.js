// src/shared/services/tasteCache.js

/**
 * Taste fingerprint cache — aggregates mood_tags, tone_tags, fit_profile from
 * watch history and caches results in user_profiles_computed for 24h.
 *
 * Mirrors personalRating.js caching pattern.
 */

import { supabase } from '@/shared/lib/supabase/client'
import { dedupeHistoryByMovie } from '@/shared/lib/canonicalHistory'

// === CONFIG ===

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const MIN_FILMS_FOR_FINGERPRINT = 5

// === PUBLIC API ===

/**
 * Get or compute taste fingerprint for a user.
 * Returns cached result if fresh (<24h), otherwise computes from watch history.
 * @param {string} userId
 * @returns {Promise<{topMoodTags: Array, topToneTags: Array, topFitProfiles: Array, total: number}|null>}
 */
export async function getTasteFingerprint(userId) {
  if (!userId) return null

  // Check cache
  const { data: cached } = await supabase
    .from('user_profiles_computed')
    .select('taste_fingerprint, taste_fingerprint_computed_at')
    .eq('user_id', userId)
    .maybeSingle()

  const now = Date.now()
  const isFresh = cached?.taste_fingerprint_computed_at &&
    (now - new Date(cached.taste_fingerprint_computed_at).getTime()) < CACHE_TTL_MS

  if (isFresh && cached.taste_fingerprint) {
    return cached.taste_fingerprint
  }

  // Compute fresh from watch history
  const result = await computeFingerprint(userId)
  if (!result) return null

  // Only persist when computing the signed-in user's own fingerprint —
  // RLS on user_profiles_computed (correctly) rejects writes for other
  // users' rows, which would 403 every time someone visits a friend's
  // /profile-v2/:userId page.
  const { data: { user: authUser } = {} } = await supabase.auth.getUser()
  if (authUser?.id === userId) {
    // Preserve any existing `profile` row written by the recommendation
    // engine; insert a stub `profile: {}` only when no row exists yet
    // (the column is NOT NULL with no default, so a bare upsert 400s for
    // users whose recommendation profile hasn't been built).
    const { data: existing } = await supabase
      .from('user_profiles_computed')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('user_profiles_computed')
        .update({
          taste_fingerprint: result,
          taste_fingerprint_computed_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    } else {
      await supabase
        .from('user_profiles_computed')
        .insert({
          user_id: userId,
          profile: {},
          taste_fingerprint: result,
          taste_fingerprint_computed_at: new Date().toISOString(),
        })
    }
  }

  return result
}

/**
 * Invalidate the taste fingerprint cache for a user.
 * Call after rating, watch status, or sentiment changes.
 * @param {string} userId
 */
export function invalidateTasteFingerprint(userId) {
  return supabase
    .from('user_profiles_computed')
    .update({ taste_fingerprint: null, taste_fingerprint_computed_at: null })
    .eq('user_id', userId)
}

// === INTERNAL ===

/**
 * Aggregate mood_tags, tone_tags, fit_profile from user's watched films.
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
async function computeFingerprint(userId) {
  // user_history has no `status` column — every row IS a watched film by
  // construction (toggleWatched inserts here and toggleWatchlist deletes
  // from here). The earlier `.eq('status','watched')` filter caused every
  // call to 400 with `column user_history.status does not exist`.
  const { data: history, error } = await supabase
    .from('user_history')
    .select('movie_id, watched_at, movies(mood_tags, tone_tags, fit_profile)')
    .eq('user_id', userId)

  if (error || !history) return null

  // F7.3: collapse duplicate watch events to ONE row per film (latest valid watched_at)
  // before aggregating, so a film watched via several paths doesn't multiply-weight its
  // mood/tone/fit tags or inflate `total`. movie_id + watched_at are selected only to make
  // this canonicalisation possible; the aggregation + weights are otherwise unchanged.
  const canonical = dedupeHistoryByMovie(history)

  const moods = {}
  const tones = {}
  const fits = {}
  let total = 0

  for (const h of canonical) {
    const m = h.movies
    if (!m) continue
    total++
    ;(m.mood_tags || []).forEach(t => { moods[t] = (moods[t] || 0) + 1 })
    ;(m.tone_tags || []).forEach(t => { tones[t] = (tones[t] || 0) + 1 })
    if (m.fit_profile) fits[m.fit_profile] = (fits[m.fit_profile] || 0) + 1
  }

  if (total < MIN_FILMS_FOR_FINGERPRINT) return null

  const topN = (obj, n) => Object.entries(obj)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([key, count]) => ({ key, count, share: count / total }))

  return {
    topMoodTags: topN(moods, 12),
    topToneTags: topN(tones, 6),
    topFitProfiles: topN(fits, 5),
    total,
  }
}
