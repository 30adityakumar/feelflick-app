// src/shared/services/hero-reason.js
/**
 * Hero pick reasoning, era floor, and tie-break sort.
 * Pure functions — no DB calls.
 */

// ============================================================================
// ERA FLOOR
// ============================================================================

/** Fit profiles that skew modern — impose a 2010+ floor. */
const MODERN_FIT_PROFILES = new Set([
  'genre_popcorn', 'crowd_pleaser', 'franchise_entry', 'comfort_watch',
])

/**
 * Per-fit-profile era floor for hero candidates.
 * Modern profiles (popcorn, crowd-pleaser) get max(userP5, 2010).
 * Arthouse/niche profiles respect the user's own p5.
 *
 * @param {Object} profile - v3 profile
 * @returns {number} minimum release_year for hero
 */
export function heroEraFloor(profile) {
  const topFit = profile?.affinity?.fit_profiles?.[0]?.profile
  const userP5 = profile?.filters?.era_floor || 1985
  if (topFit && !MODERN_FIT_PROFILES.has(topFit)) return userP5
  return Math.max(userP5, 2010)
}

// ============================================================================
// HERO REASON
// ============================================================================

/** Human-readable labels for fit profiles. */
export const FIT_HUMAN_LABELS = {
  prestige_drama: 'A prestige drama for you',
  genre_popcorn: 'Genre done right',
  crowd_pleaser: 'A crowd-pleaser you haven\'t seen',
  challenging_art: 'Something to sink into',
  arthouse: 'An arthouse pick',
  festival_discovery: 'A festival find',
  cult_classic: 'A cult classic',
  comfort_watch: 'Easy comfort',
  franchise_entry: 'Franchise, done well',
  niche_world_cinema: 'World cinema for you',
}

/**
 * Generate a grounded reason for why a hero pick was chosen.
 * Uses the scoring breakdown to determine the dominant dimension.
 *
 * @param {Object} movie
 * @param {Object} breakdown - scoring breakdown { embedding, director_genre, mood, fit, quality }
 * @param {Object} profile - v3 profile
 * @param {Map} seedNeighborMap - from scoring context
 * @returns {{ type: string, text: string, seedId?: number }}
 */
export function generateHeroReason(movie, breakdown, profile, seedNeighborMap) {
  if (!breakdown) return { type: 'generic', text: 'Picked for you' }

  const dims = [
    { key: 'embedding', val: breakdown.embedding || 0 },
    { key: 'director_genre', val: breakdown.director_genre || 0 },
    { key: 'mood', val: breakdown.mood || 0 },
    { key: 'fit', val: breakdown.fit || 0 },
    { key: 'quality', val: breakdown.quality || 0 },
  ].sort((a, b) => b.val - a.val)
  const top = dims[0]

  if (top.key === 'embedding' && top.val >= 65) {
    const seedMatches = seedNeighborMap?.get?.(movie.id)
    if (seedMatches && seedMatches.size > 0) {
      const sorted = [...seedMatches.entries()].sort((a, b) => b[1].cosine - a[1].cosine)
      const seedTitle = sorted[0][1].seedTitle || movie.matched_seed_title
      if (seedTitle) {
        return { type: 'seed', text: `Because you loved ${seedTitle}`, seedId: sorted[0][0] }
      }
    }
  }

  if (top.key === 'director_genre' && top.val >= 90 && movie.director_name) {
    return { type: 'director', text: `More from ${movie.director_name}` }
  }

  if (top.key === 'mood' && top.val >= 85) {
    const tag = profile?.affinity?.mood_tags?.[0]?.tag
    if (tag) return { type: 'mood', text: `Matches your taste for ${tag} films` }
  }

  if (top.key === 'fit' && top.val === 100) {
    const fit = profile?.affinity?.fit_profiles?.[0]?.profile
    const label = FIT_HUMAN_LABELS[fit] || 'Built for your taste'
    return { type: 'fit', text: label }
  }

  if (top.key === 'quality' && top.val >= 85 && movie.primary_genre) {
    return { type: 'quality', text: `${movie.primary_genre} at its best` }
  }

  return { type: 'generic', text: 'Picked for you' }
}

// ============================================================================
// TIE-BREAK SORT
// ============================================================================

/**
 * Multi-factor tie-break sort for hero candidates.
 * Score → confidence → embedding → year → anti-popularity.
 *
 * @param {Object} a
 * @param {Object} b
 * @returns {number}
 */
export function tieBreakSort(a, b) {
  if (b._score !== a._score) return b._score - a._score
  const bConf = b.ff_audience_confidence || 0
  const aConf = a.ff_audience_confidence || 0
  if (bConf !== aConf) return bConf - aConf
  const aEmb = a._breakdown?.embedding || 0
  const bEmb = b._breakdown?.embedding || 0
  if (bEmb !== aEmb) return bEmb - aEmb
  const bYear = b.release_year || 0
  const aYear = a.release_year || 0
  if (bYear !== aYear) return bYear - aYear
  const aPop = a.popularity || 0
  const bPop = b.popularity || 0
  if (aPop !== bPop) return aPop - bPop // lower popularity wins (discovery)
  return a.id - b.id
}
