// src/features/browse/browsePresentation.js
// Pure, testable helpers that decide a card's OBJECTIVE evidence line + (rare)
// badge from real catalogue fields and the active sort. No personalization, no
// match %, no "Best fit", no fabricated reasons — when a trustworthy field is
// absent the helper returns null and the card simply shows nothing extra.

// Critic numbers/badges are only trustworthy above this confidence; below it we
// omit the critic claim entirely (the sort still ORDERS by critic — see browse.js).
export const CRITIC_CONFIDENCE_MIN = 60

const isTmdbOnly = (f) => f && f.id < 0 // text-search rows have no FeelFlick metadata

/**
 * Objective, sort-appropriate evidence for a card. Returns { lead, detail } or null.
 */
export function cardEvidence(film, sort) {
  if (!film || isTmdbOnly(film)) return null
  switch (sort) {
    case 'discovery_potential.desc':
      return film.hidden > 0
        ? { lead: `Discovery potential ${film.hidden}`, detail: 'Ordered by underexposure and credible quality.' }
        : null
    case 'ff_critic_rating.desc':
      // No fake critic number when evidence is thin — order still places these last.
      return (film.critic > 0 && film.criticConfidence >= CRITIC_CONFIDENCE_MIN)
        ? { lead: `Critics ${film.critic}`, detail: 'Personal taste does not affect this order.' }
        : { lead: 'Critic rating not established', detail: 'Personal taste does not affect this order.' }
    case 'release_date.desc':
    case 'release_date.asc':
      return null // the year already shows in card meta
    case 'cult_status_score.desc':
      return film.cult > 0 ? { lead: `Cult signal ${film.cult}`, detail: 'Ordered by cult following.' } : null
    case 'ff_rating.desc':
    default:
      return film.ff > 0
        ? { lead: `FeelFlick ${film.ff}`, detail: 'FeelFlick’s overall rating in this territory.' }
        : null
  }
}

/**
 * At most ONE rare, objective badge per card, gated to trustworthy thresholds and
 * biased toward the active sort / quality lens. Most cards return null.
 * @param {object} film
 * @param {string} sort
 * @param {string[]} [qualityLens]  active vibe lenses (e.g. ['hidden','cult'])
 */
export function cardBadge(film, sort, qualityLens = []) {
  if (!film || isTmdbOnly(film)) return null
  const lens = new Set(qualityLens)
  const isCriticsPick = film.critic >= 92 && film.criticConfidence >= CRITIC_CONFIDENCE_MIN
  const isCult = film.cult >= 75
  const isHidden = film.hidden >= 70
  const isExceptional = !!film.exceptional

  // Prefer the badge that matches what the user is currently looking through.
  if ((sort === 'ff_critic_rating.desc' || lens.has('critic')) && isCriticsPick) return "Critics' pick"
  if ((sort === 'discovery_potential.desc' || lens.has('hidden')) && isHidden) return 'Hidden gem'
  if ((sort === 'cult_status_score.desc' || lens.has('cult')) && isCult) return 'Cult classic'

  // Otherwise a single strong objective signal, in priority order.
  if (isExceptional) return 'Exceptional for genre'
  if (isCriticsPick) return "Critics' pick"
  if (isCult) return 'Cult classic'
  if (isHidden) return 'Hidden gem'
  return null
}

// Honest, per-sort ranking explanation (the "i" disclosure copy).
export function rankingCopy(sort) {
  switch (sort) {
    case 'discovery_potential.desc':
      return 'You chose the territory. These are ordered by discovery potential — underseen films with credible quality signals. Your personal taste does not determine this order.'
    case 'ff_critic_rating.desc':
      return 'You chose the territory. These are ordered by critic rating; films without enough critic evidence sort last. Your personal taste does not determine this order.'
    case 'release_date.desc':
      return 'You chose the territory. These are ordered newest first. Your personal taste does not determine this order.'
    case 'cult_status_score.desc':
      return 'You chose the territory. These are ordered by cult following. Your personal taste does not determine this order.'
    case 'ff_rating.desc':
    default:
      return 'You chose the territory — genre, era, language, runtime, filmmaker, or qualities. These are ordered by FeelFlick’s overall rating (a blend of critic, audience and community signals). Browse personalizes through your Start-somewhere paths, Hide watched, and Taste twins — not a hidden per-film score.'
  }
}

// Short summary suffix shown next to the result count, by sort.
export function sortSummary(sort) {
  switch (sort) {
    case 'discovery_potential.desc': return 'ordered by discovery potential'
    case 'ff_critic_rating.desc':    return 'ordered by critic rating'
    case 'release_date.desc':        return 'newest first'
    case 'cult_status_score.desc':   return 'ordered by cult following'
    case 'ff_rating.desc':
    default:                         return 'ordered by FeelFlick rating'
  }
}

// The four primary sort tabs surfaced in the UI (other sort values stay valid
// from the URL for back-compat but aren't primary controls).
export const PRIMARY_SORTS = [
  { value: 'ff_rating.desc', label: 'FeelFlick rating' },
  { value: 'discovery_potential.desc', label: 'Hidden gems' },
  { value: 'ff_critic_rating.desc', label: 'Critics' },
  { value: 'release_date.desc', label: 'Newest' },
]
