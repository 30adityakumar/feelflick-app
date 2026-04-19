// src/shared/services/personalRating.js

/**
 * ff_personal_rating — predicted 0-100 score for this user × this movie.
 * Formula:
 *   0.40 × base_objective      (blend of audience + critic + community, confidence-weighted)
 *   0.35 × taste_match         (from scoreMovieForUser, normalized to 0-100)
 *   0.15 × user_rating_offset  (user's avg delta vs global, applied as adjustment)
 *   0.10 × trust_network       (friends' ratings; 0 until social ships)
 *
 * Gated: only computed when user has ≥10 ratings. Otherwise returns null.
 * Cached 24h in user_profiles_computed.personal_ratings[movie_id].
 */

import { supabase } from '@/shared/lib/supabase/client'
import { scoreMovieForUser, computeUserProfile } from './recommendations'

// === CONFIG ===

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const MIN_RATINGS_FOR_PERSONAL = 10

// === PUBLIC API ===

/**
 * Get or compute ff_personal_rating for a user × movie pair.
 * Returns cached result if fresh (<24h), otherwise computes and caches.
 * @param {string} userId
 * @param {object} movie - Movie row with ff_audience_rating, ff_critic_rating, etc.
 * @param {object} [opts]
 * @returns {Promise<{rating: number, confidence: number, components: object}|null>}
 */
export async function getPersonalRating(userId, movie, opts = {}) {
  if (!userId || !movie?.id) return null

  // Check cache
  const { data: cached } = await supabase
    .from('user_profiles_computed')
    .select('personal_ratings, personal_ratings_computed_at')
    .eq('user_id', userId)
    .maybeSingle()

  const now = Date.now()
  const isFresh = cached?.personal_ratings_computed_at &&
    (now - new Date(cached.personal_ratings_computed_at).getTime()) < CACHE_TTL_MS

  if (isFresh && cached.personal_ratings?.[movie.id]) {
    return cached.personal_ratings[movie.id]
  }

  // Compute fresh
  const result = await computePersonalRating(userId, movie, opts)
  if (!result) return null

  // Merge into cache (don't blow away other movies)
  const updatedMap = { ...(cached?.personal_ratings || {}), [movie.id]: result }
  await supabase.from('user_profiles_computed').upsert({
    user_id: userId,
    personal_ratings: updatedMap,
    personal_ratings_computed_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  return result
}

/**
 * Invalidate the personal rating cache for a user.
 * Call after rating, sentiment, or watch status changes.
 * @param {string} userId
 */
export function invalidatePersonalCache(userId) {
  return supabase
    .from('user_profiles_computed')
    .update({ personal_ratings: {}, personal_ratings_computed_at: null })
    .eq('user_id', userId)
}

// === INTERNAL ===

/**
 * Compute personal rating from scratch.
 * @param {string} userId
 * @param {object} movie
 * @param {object} opts
 * @param {object} [opts.profile] - Pre-computed user profile (avoids re-fetch)
 * @returns {Promise<{rating: number, confidence: number, components: object}|null>}
 */
async function computePersonalRating(userId, movie, { profile } = {}) {
  // Check rating count gate
  const { count } = await supabase
    .from('user_ratings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if ((count ?? 0) < MIN_RATINGS_FOR_PERSONAL) return null

  // 1. Base objective — confidence-weighted blend of the three base scores
  const baseObjective = computeBaseObjective(movie)
  if (baseObjective == null) return null

  // 2. Taste match from scoreMovieForUser
  const userProfile = profile ?? await computeUserProfile(userId)
  const scoreResult = scoreMovieForUser(movie, userProfile, 'personal')
  // scoreMovieForUser returns 0-~200 raw; normalize to 0-100
  const tasteMatch = Math.max(0, Math.min(100, scoreResult.score / 2))

  // 3. User rating offset — user's avg vs global 70 (7.0 on 0-10)
  const { data: userStats } = await supabase
    .from('user_ratings')
    .select('rating')
    .eq('user_id', userId)

  const userAvg = userStats?.length
    ? (userStats.reduce((s, r) => s + r.rating, 0) / userStats.length) * 10
    : 70
  const offset = userAvg - 70 // +ve if generous rater, -ve if tough
  const offsetAdjustment = -offset * 0.3 // pull toward user's personal scale

  // 4. Trust network — 0 until social lands
  const trustNetwork = 0

  const personal = Math.round(
    0.40 * baseObjective +
    0.35 * tasteMatch +
    0.15 * (baseObjective + offsetAdjustment) +
    0.10 * (trustNetwork || baseObjective) // fallback to objective if no trust signal
  )

  // Confidence: user data strength + movie data strength
  const userConfidence = Math.min(100, (count ?? 0) * 3)
  const movieConfidence = Math.min(
    movie.ff_audience_confidence ?? 0,
    movie.ff_critic_confidence ?? 0
  )
  const confidence = Math.round((userConfidence + movieConfidence) / 2)

  return {
    rating: Math.max(0, Math.min(100, personal)),
    confidence,
    components: {
      baseObjective: Math.round(baseObjective),
      tasteMatch: Math.round(tasteMatch),
      userOffset: Math.round(offsetAdjustment),
    },
  }
}

/**
 * Confidence-weighted blend of audience + critic + community scores.
 * Returns null if no signal meets its confidence threshold.
 * @param {object} movie
 * @returns {number|null} 0-100
 */
function computeBaseObjective(movie) {
  const signals = []

  if (movie.ff_audience_rating != null && (movie.ff_audience_confidence ?? 0) >= 50) {
    signals.push({ value: movie.ff_audience_rating, weight: 0.45 })
  }
  if (movie.ff_critic_rating != null && (movie.ff_critic_confidence ?? 0) >= 50) {
    signals.push({ value: movie.ff_critic_rating, weight: 0.35 })
  }
  if (movie.ff_community_rating != null && (movie.ff_community_confidence ?? 0) >= 60) {
    signals.push({ value: movie.ff_community_rating, weight: 0.20 })
  }

  if (signals.length === 0) return null

  const totalWeight = signals.reduce((s, x) => s + x.weight, 0)
  return signals.reduce((s, x) => s + x.value * x.weight, 0) / totalWeight
}
