// src/shared/services/embedding-scoring.js
/**
 * Embedding similarity scoring primitives.
 *
 * Non-linear curve, recency-weighted seeds, multi-seed aggregation,
 * and stronger anti-seed penalty. All pure functions — no DB calls.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Rating → base weight for seed importance. Only 7+ seeds qualify. */
export const SEED_RATING_MULTIPLIER = {
  10: 1.0,
  9: 1.0,
  8: 0.8,
  7: 0.6,
}

// ============================================================================
// RECENCY DECAY
// ============================================================================

/**
 * Time-decay multiplier for seed freshness. Recent watches matter more.
 *
 * @param {string|Date} watchedAt
 * @returns {number} 0.2–1.0
 */
export function recencyDecay(watchedAt) {
  const days = (Date.now() - new Date(watchedAt).getTime()) / 86400000
  if (days < 30) return 1.0
  if (days < 90) return 0.7
  if (days < 180) return 0.4
  return 0.2
}

// ============================================================================
// NON-LINEAR SIMILARITY CURVE
// ============================================================================

/**
 * Map raw cosine similarity (0–1) to a 0–100 score via a non-linear curve.
 * Tuned for real DB cosine distribution: 0.55–0.75 is the useful band.
 * Below 0.55 is noise → 0. 0.75+ is near-duplicate → 100.
 *
 * @param {number} cosine - raw cosine similarity 0–1
 * @returns {number} 0–100
 */
export function curveSimilarity(cosine) {
  if (cosine < 0.55) return 0
  if (cosine >= 0.75) return 100
  return Math.round(Math.pow((cosine - 0.55) / 0.20, 0.55) * 100)
}

// ============================================================================
// MULTI-SEED AGGREGATION
// ============================================================================

/**
 * Aggregate a candidate movie's matches across multiple seeds.
 * seedWeight is used for sorting/selection only — not for dampening the score.
 * Dynamic position weights that sum to 1.0 based on match count:
 *   1 match: [1.0]  —  single-match films can reach 100
 *   2 matches: [0.7, 0.3]
 *   3 matches: [0.55, 0.30, 0.15]
 *
 * @param {Array<{ seedId: number, cosine: number, seedWeight: number }>} seedSimilarities
 * @returns {number} 0–100
 */
export function aggregateSeedMatches(seedSimilarities) {
  if (seedSimilarities.length === 0) return 0

  // Sort by weighted cosine — seedWeight affects ordering, not scoring
  const sorted = [...seedSimilarities].sort(
    (a, b) => (b.cosine * b.seedWeight) - (a.cosine * a.seedWeight),
  )

  const n = Math.min(3, sorted.length)
  // Dynamic weights by match count — always sum to 1.0
  const positionWeights =
    n === 1 ? [1.0] :
      n === 2 ? [0.7, 0.3] :
        [0.55, 0.30, 0.15]

  let score = 0
  for (let i = 0; i < n; i++) {
    score += curveSimilarity(sorted[i].cosine) * positionWeights[i]
  }

  return Math.min(100, Math.round(score))
}

// ============================================================================
// ANTI-SEED PENALTY
// ============================================================================

/**
 * Penalty for proximity to anti-seed films (rated low / disliked).
 * Stepped thresholds — stronger than the old binary 60/30 system.
 *
 * @param {number} maxAntiCosine - highest cosine similarity to any anti-seed
 * @returns {number} 0–80 penalty
 */
export function antiSeedPenalty(maxAntiCosine) {
  if (maxAntiCosine >= 0.85) return 80
  if (maxAntiCosine >= 0.75) return 50
  if (maxAntiCosine >= 0.65) return 25
  return 0
}

// ============================================================================
// SEED SELECTION
// ============================================================================

/**
 * Select up to 10 top-weighted seeds from the user's positive seeds.
 * Filters to rating >= 7, computes seedWeight from rating × recency,
 * sorts descending, caps at 10.
 *
 * @param {Array<{ id: number, rating: number, watched_at: string }>} positiveSeeds
 * @returns {Array<{ id: number, rating: number, watched_at: string, seedWeight: number }>}
 */
export function selectSeeds(positiveSeeds) {
  return positiveSeeds
    .filter(s => s.rating >= 7)
    .map(s => ({
      ...s,
      seedWeight: (SEED_RATING_MULTIPLIER[s.rating] || 0) * recencyDecay(s.watched_at),
    }))
    .filter(s => s.seedWeight > 0)
    .sort((a, b) => b.seedWeight - a.seedWeight)
    .slice(0, 10)
}
