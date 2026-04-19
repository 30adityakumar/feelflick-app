// src/shared/services/tasteCache.js

/**
 * Taste fingerprint cache — aggregates mood_tags, tone_tags, fit_profile from
 * watch history and caches results in user_profiles_computed for 24h.
 *
 * Mirrors personalRating.js caching pattern.
 */

import { supabase } from '@/shared/lib/supabase/client'

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

  // Write to cache
  await supabase.from('user_profiles_computed').upsert({
    user_id: userId,
    taste_fingerprint: result,
    taste_fingerprint_computed_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

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
  const { data: history, error } = await supabase
    .from('user_history')
    .select('movies(mood_tags, tone_tags, fit_profile)')
    .eq('user_id', userId)
    .eq('status', 'watched')

  if (error || !history) return null

  const moods = {}
  const tones = {}
  const fits = {}
  let total = 0

  for (const h of history) {
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
