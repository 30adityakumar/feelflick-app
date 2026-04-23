// src/shared/services/quality-tiers.js
/**
 * Unified quality floor constants per surface tier.
 *
 * Replaces inconsistent ad-hoc floors scattered across homepage-rows.js
 * and recommendations.js. Every candidate query should use applyQualityFloor()
 * instead of inline .gte() chains for quality columns.
 *
 * Scale: ff_audience_rating and ff_critic_rating are 0-100.
 */

export const QUALITY_TIERS = {
  HERO: {
    ff_audience_rating_min: 78,
    ff_audience_confidence_min: 65,
    vote_count_min: 200,
  },
  // Relaxed floor for neighbor-language rescue candidates.
  // Keeps audience rating high (≥75) but allows lower confidence (≥30)
  // so culturally adjacent languages with thinner vote pools still qualify.
  NEIGHBOR: {
    ff_audience_rating_min: 75,
    ff_audience_confidence_min: 30,
    vote_count_min: 200,
  },
  SIGNATURE: {
    ff_audience_rating_min: 75,
    ff_audience_confidence_min: 60,
    vote_count_min: 200,
  },
  CONTEXT: {
    ff_audience_rating_min: 68,
    ff_audience_confidence_min: 50,
    vote_count_min: null,
  },
  NICHE_CRITICS: {
    ff_critic_rating_min: 72,
    ff_audience_rating_max: 65,
    ff_audience_confidence_min: 50,
    vote_count_min: null,
  },
  NICHE_UNDER90: {
    ff_audience_rating_min: 70,
    ff_audience_confidence_min: 50,
    runtime_min: 60,
    runtime_max: 90,
    vote_count_min: null,
  },
}

/**
 * Apply quality floor filters on a Supabase query builder.
 *
 * @param {Object} query - Supabase query builder (chainable)
 * @param {string} tier - key from QUALITY_TIERS (e.g. 'HERO', 'SIGNATURE')
 * @returns {Object} the (possibly modified) query builder
 */
export function applyQualityFloor(query, tier) {
  const t = QUALITY_TIERS[tier]
  if (!t) throw new Error(`Unknown quality tier: ${tier}`)
  if (t.ff_audience_rating_min != null) query = query.gte('ff_audience_rating', t.ff_audience_rating_min)
  if (t.ff_audience_rating_max != null) query = query.lte('ff_audience_rating', t.ff_audience_rating_max)
  if (t.ff_audience_confidence_min != null) query = query.gte('ff_audience_confidence', t.ff_audience_confidence_min)
  if (t.ff_critic_rating_min != null) query = query.gte('ff_critic_rating', t.ff_critic_rating_min)
  if (t.vote_count_min != null) query = query.gte('vote_count', t.vote_count_min)
  if (t.runtime_min != null) query = query.gte('runtime', t.runtime_min)
  if (t.runtime_max != null) query = query.lte('runtime', t.runtime_max)
  return query
}
