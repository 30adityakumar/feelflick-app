// src/shared/services/skip-signals.js
/**
 * Skip recency decay, surface severity weighting, and cooldown logic.
 * Pure functions — no DB calls.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Time-decay tiers for skip freshness. Recent skips matter more. */
export const SKIP_DECAY_TIERS = [
  { maxDays: 7, weight: 1.0 },
  { maxDays: 30, weight: 0.6 },
  { maxDays: 90, weight: 0.3 },
]

/** Skips older than this get floor weight (not fully forgotten). */
export const SKIP_FORGET_AFTER_DAYS = 90

/** Minimum weight for very old skips — never fully zero. */
export const SKIP_FLOOR = 0.15

/** Surface-specific skip severity. Hero skip = strong signal; row skip = normal. */
export const SURFACE_SKIP_WEIGHT = {
  hero: 1.5,
  quick_picks: 1.0,
  hidden_gems: 1.0,
  because_you_loved: 1.0,
  trending: 1.0,
  mood_based: 1.0,
  favorite_genres: 1.0,
  director_spotlight: 1.0,
  slow_contemplative: 1.0,
  quick_watches: 1.0,
  polarizing_picks: 1.0,
  world_cinema: 1.0,
}

// ============================================================================
// SKIP RECENCY
// ============================================================================

/**
 * Time-decay weight for a skip event. Recent skips carry more weight.
 *
 * @param {string|Date} skippedAt - when the skip occurred
 * @returns {number} 0.15–1.0
 */
export function skipRecencyWeight(skippedAt) {
  const days = (Date.now() - new Date(skippedAt).getTime()) / 86400000
  for (const t of SKIP_DECAY_TIERS) {
    if (days < t.maxDays) return t.weight
  }
  return SKIP_FLOOR
}

// ============================================================================
// SURFACE SEVERITY
// ============================================================================

/**
 * Severity multiplier based on which surface the skip happened on.
 * Hero skips are stronger signals (user actively dismissed the top pick).
 *
 * @param {string} placement - surface name (e.g. 'hero', 'quick_picks')
 * @returns {number} severity multiplier
 */
export function skipSeverity(placement) {
  return SURFACE_SKIP_WEIGHT[placement] ?? 1.0
}

// ============================================================================
// SKIP WEIGHT MAP
// ============================================================================

/**
 * Build per-movie aggregate skip weight from impression rows.
 * Multiple skips compound additively.
 *
 * @param {Array<{ movie_id: number, placement: string, shown_at: string, skipped: boolean }>} impressionRows
 * @returns {Map<number, number>} movie_id → total skip weight
 */
export function buildSkipWeightMap(impressionRows) {
  const map = new Map()
  for (const r of impressionRows) {
    if (!r.skipped) continue
    const w = skipRecencyWeight(r.shown_at) * skipSeverity(r.placement)
    map.set(r.movie_id, (map.get(r.movie_id) || 0) + w)
  }
  return map
}

// ============================================================================
// COOLDOWN SETS
// ============================================================================

/**
 * Build cooldown sets from impression rows.
 * - heroCooldown: films shown as hero in last 7 days
 * - rowCooldown: films shown in any surface in last 3 days
 *
 * @param {Array<{ movie_id: number, placement: string, shown_at: string }>} impressionRows
 * @returns {{ heroCooldown: Set<number>, rowCooldown: Set<number> }}
 */
export function buildCooldownSet(impressionRows) {
  const heroCooldown = new Set()
  const rowCooldown = new Set()
  const now = Date.now()
  for (const r of impressionRows) {
    if (!r.skipped) continue
    const days = (now - new Date(r.shown_at).getTime()) / 86400000
    if (r.placement === 'hero' && days < 7) heroCooldown.add(r.movie_id)
    if (days < 3) rowCooldown.add(r.movie_id)
  }
  return { heroCooldown, rowCooldown }
}
