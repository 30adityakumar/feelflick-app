// src/shared/services/diversity.js
/**
 * Diversity, rotation, and cross-row dedup utilities.
 * Pure functions — no DB calls.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Penalties applied during greedy diversification. */
export const DIVERSITY_PENALTIES = {
  sameDirector: 12,
  samePrimaryGenre: 8,
  sameReleaseYearBand: 4, // within ±2 years
}

// ============================================================================
// WITHIN-ROW DIVERSITY
// ============================================================================

/**
 * Greedy diversification: pick highest-scored first, then re-score remaining
 * with penalties for dimensions shared with already-picked films.
 *
 * @param {Object[]} scoredCandidates - must have _score, director_name, primary_genre, release_year
 * @param {number} [targetCount=8]
 * @returns {Object[]}
 */
export function diversifyRow(scoredCandidates, targetCount = 8) {
  if (scoredCandidates.length === 0) return []
  const picked = []
  const remaining = [...scoredCandidates].sort((a, b) => b._score - a._score)

  while (picked.length < targetCount && remaining.length > 0) {
    if (picked.length === 0) {
      picked.push(remaining.shift())
      continue
    }
    // Re-score remaining with diversity penalties
    for (const c of remaining) {
      let penalty = 0
      for (const p of picked) {
        if (c.director_name && c.director_name === p.director_name) {
          penalty += DIVERSITY_PENALTIES.sameDirector
        }
        if (c.primary_genre && c.primary_genre === p.primary_genre) {
          penalty += DIVERSITY_PENALTIES.samePrimaryGenre
        }
        if (c.release_year && p.release_year
          && Math.abs(c.release_year - p.release_year) <= 2) {
          penalty += DIVERSITY_PENALTIES.sameReleaseYearBand
        }
      }
      c._diversityAdjusted = c._score - penalty
    }
    remaining.sort((a, b) => b._diversityAdjusted - a._diversityAdjusted)
    picked.push(remaining.shift())
  }
  return picked
}

// ============================================================================
// HERO ROTATION
// ============================================================================

/**
 * Select diverse hero candidates for day-hash rotation.
 * Filters to score >= 70 first, then diversifies.
 *
 * @param {Object[]} scoredCandidates - hero-scored candidates with _score
 * @param {number} [count=3]
 * @returns {Object[]}
 */
export function selectHeroCandidates(scoredCandidates, count = 3) {
  if (!scoredCandidates?.length) return []

  const threshold = 65
  const filtered = scoredCandidates.filter(c => c._score >= threshold)
  const diverse = diversifyRow(filtered, count)

  // Backfill from full pool if still short (regardless of diverse count)
  if (diverse.length < count) {
    const pickedIds = new Set(diverse.map(c => c.id))
    for (const c of scoredCandidates) {
      if (diverse.length >= count) break
      if (!pickedIds.has(c.id)) {
        diverse.push(c)
        pickedIds.add(c.id)
      }
    }
  }

  return diverse.slice(0, count)
}

/**
 * Stable day-based hash index. Same user + same day = same index.
 * Different user or different day = different index.
 *
 * @param {string} userId
 * @param {number} count - number of candidates to pick from
 * @returns {number} 0-based index
 */
export function dayHashIndex(userId, count) {
  if (count <= 0) return 0
  const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  let hash = 0
  for (const ch of (userId + date)) {
    hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0
  }
  return Math.abs(hash) % count
}

// ============================================================================
// CROSS-ROW SOFT DEDUP
// ============================================================================

/**
 * Soft dedup: remove films already shown in earlier rows, but only if
 * the pool stays above threshold. Prevents empty rows from over-dedup.
 *
 * @param {Object[]} candidates - film objects with .id
 * @param {Set<number>} shownIds - IDs already picked by prior rows
 * @param {number} [threshold=6] - minimum films required post-dedup
 * @returns {Object[]}
 */
export function softDedupe(candidates, shownIds, threshold = 6) {
  const deduped = candidates.filter(c => !shownIds.has(c.id))
  return deduped.length >= threshold ? deduped : candidates
}
