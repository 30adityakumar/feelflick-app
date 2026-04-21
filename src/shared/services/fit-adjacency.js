// src/shared/services/fit-adjacency.js
/**
 * Single source of truth for fit profile adjacency.
 *
 * Directional, 3-tier: close adjacency (strong affinity), far adjacency
 * (weaker affinity), and implicit clash (everything else).
 *
 * Pure functions — no DB calls, no side effects.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const FIT_PROFILES = [
  'prestige_drama', 'genre_popcorn', 'crowd_pleaser', 'challenging_art',
  'arthouse', 'festival_discovery', 'cult_classic', 'comfort_watch',
  'franchise_entry', 'niche_world_cinema',
]

/**
 * Directional adjacency map.
 * FIT_ADJACENCY[source] = { close: [...], far: [...] }
 *
 * source = user's top fit_profile
 * close  = candidate fit_profiles with strong affinity from source's perspective
 * far    = candidate fit_profiles with weaker affinity
 * (absent = implicit clash, scores 0)
 */
export const FIT_ADJACENCY = {
  prestige_drama: {
    close: ['arthouse', 'challenging_art'],
    far:   ['festival_discovery', 'cult_classic'],
  },
  genre_popcorn: {
    close: ['crowd_pleaser', 'franchise_entry'],
    far:   ['cult_classic', 'comfort_watch'],
  },
  crowd_pleaser: {
    close: ['genre_popcorn', 'comfort_watch', 'franchise_entry'],
    far:   ['cult_classic'],
  },
  challenging_art: {
    close: ['arthouse', 'prestige_drama'],
    far:   ['festival_discovery', 'niche_world_cinema'],
  },
  arthouse: {
    close: ['challenging_art', 'festival_discovery', 'prestige_drama'],
    far:   ['niche_world_cinema'],
  },
  festival_discovery: {
    close: ['arthouse', 'niche_world_cinema'],
    far:   ['prestige_drama', 'challenging_art'],
  },
  cult_classic: {
    close: ['genre_popcorn'],
    far:   ['challenging_art', 'crowd_pleaser'],
  },
  comfort_watch: {
    close: ['crowd_pleaser', 'genre_popcorn'],
    far:   ['franchise_entry'],
  },
  franchise_entry: {
    close: ['crowd_pleaser', 'genre_popcorn'],
    far:   [],
  },
  niche_world_cinema: {
    close: ['arthouse', 'festival_discovery'],
    far:   ['challenging_art'],
  },
}

// ============================================================================
// SCORING
// ============================================================================

/**
 * Score a candidate's fit_profile against the user's top fit_profiles.
 * Returns 0-100.
 *
 * @param {string|null} candidateFit - movie's fit_profile
 * @param {string[]} userTopProfiles - user's fit_profiles sorted by count desc
 * @returns {number} 0-100
 */
export function scoreFitAgainstProfiles(candidateFit, userTopProfiles) {
  if (!candidateFit) return 40  // unknown profile
  if (!userTopProfiles?.length) return 50  // cold start

  const top1 = userTopProfiles[0]
  const top2 = userTopProfiles[1]
  const top3 = userTopProfiles[2]

  // Direct matches
  if (candidateFit === top1) return 100
  if (candidateFit === top2) return 80
  if (candidateFit === top3) return 70

  // Adjacency from top-1 (primary)
  const adj1 = FIT_ADJACENCY[top1] || { close: [], far: [] }
  if (adj1.close.includes(candidateFit)) return 70
  if (adj1.far.includes(candidateFit)) return 40

  // Adjacency from top-2 (softer)
  if (top2) {
    const adj2 = FIT_ADJACENCY[top2] || { close: [], far: [] }
    if (adj2.close.includes(candidateFit)) return 60
    if (adj2.far.includes(candidateFit)) return 30
  }

  // Clash — not adjacent to any top profile
  return 0
}

// ============================================================================
// PROFILE PROMOTION
// ============================================================================

/**
 * Promote fit_profiles into the top list if user has a highly-rated film
 * in that profile, even if raw watch share < 15%.
 *
 * @param {Map<string, number>} fitProfileCounts - Map<fit_profile, count>
 * @param {Object[]} ratedSeeds - positive_seeds from profile.rated
 * @param {Map<number, string>} fitProfileById - Map<movie_id, fit_profile>
 * @returns {Object[]} sorted fit_profile entries with { profile, count, share, promoted }
 */
export function promoteRatedFitProfiles(fitProfileCounts, ratedSeeds, fitProfileById) {
  const promoted = new Set()
  for (const seed of ratedSeeds) {
    if (seed.rating >= 8) {
      const fit = fitProfileById.get(seed.id)
      if (fit) promoted.add(fit)
    }
  }

  const total = [...fitProfileCounts.values()].reduce((a, b) => a + b, 0)
  if (total === 0) return []

  const entries = [...fitProfileCounts.entries()]
    .map(([profile, count]) => ({
      profile,
      count,
      share: Math.round((count / total) * 100) / 100,
      promoted: promoted.has(profile),
    }))
    .filter(e => (e.count >= 2 && e.share >= 0.15) || e.promoted)
    .sort((a, b) => {
      // Promoted entries float up unless they already rank high by count
      if (a.promoted !== b.promoted) return a.promoted ? -1 : 1
      return b.count - a.count
    })

  return entries
}
