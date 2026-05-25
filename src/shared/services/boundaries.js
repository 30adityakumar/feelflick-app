// Content boundary detection.
//
// Maps the 4 toggles on /preferences ("Hard rules") to TMDB keyword sets and
// certification signals so the engine can act on them and MovieDetail can
// surface a heads-up line.
//
// Semantics (mirror the on-page copy):
//   • graphic — FILTER: hide from recommendations when toggle is on.
//   • sexual  — FILTER: hide from recommendations when toggle is on.
//   • animals — FLAG: don't filter; surface a warning on MovieDetail.
//   • noise   — FLAG: don't filter; surface a warning on MovieDetail.

const KW = (...names) => new Set(names.map((s) => s.toLowerCase()))

// Curated against actual catalog coverage (queried 2026-05-24). Generic terms
// like "violence" / "murder" are excluded — they appear on too many films to
// be a useful "explicit / gore" signal.
export const BOUNDARY_KEYWORDS = {
  graphic: KW(
    'gore', 'torture', 'brutality', 'brutal violence',
    'extreme violence', 'gun violence', 'police brutality',
    'mass murder', 'killing spree', 'massacre',
    'dismemberment', 'decapitation', 'mutilation',
    'axe murder',
  ),
  sexual: KW(
    'sex scene', 'explicit sex', 'eroticism', 'erotic movie',
    'erotic thriller', 'nudity', 'graphic nudity', 'female nudity',
    'male nudity', 'sexual violence', 'sexual abuse', 'sexual assault',
    'rape', 'rape and revenge', 'child sexual abuse',
  ),
  animals: KW(
    'animal cruelty', 'animal death', 'animal abuse', 'animal slaughter',
    'animal horror', 'animal attack',
    'dog death', 'horse death', 'cat death',
  ),
  noise: KW(
    'found footage', 'hybrid found footage', 'shaky cam', 'shaky camera',
    'flashing lights', 'strobe lighting', 'strobe', 'epilepsy warning',
    'flicker effect',
  ),
}

// Per-boundary user-facing label. Matches /preferences exactly.
export const BOUNDARY_LABEL = {
  graphic: 'Graphic violence',
  sexual:  'Explicit sexual content',
  animals: 'Harm to animals',
  noise:   'Sensory-heavy content',
}

// Boundaries that hide the film outright when toggled on.
const FILTER_BOUNDARIES = new Set(['graphic', 'sexual'])
// Boundaries that only surface a heads-up on MovieDetail.
// (kept for symmetry; computed inline below)

/**
 * Returns the set of boundary IDs that a film matches, regardless of which
 * toggles the user has on. Used for "always compute, conditionally show".
 *
 * @param {Object} movie - row with .keywords (jsonb [{id,name}]) + .certification
 * @returns {string[]} subset of ['graphic','sexual','animals','noise']
 */
export function detectMovieBoundaries(movie) {
  if (!movie) return []
  const flags = []
  const keywordSet = new Set(
    (movie.keywords || [])
      .map((k) => (typeof k === 'string' ? k : k?.name))
      .filter(Boolean)
      .map((s) => String(s).toLowerCase()),
  )
  const cert = String(movie.certification || '').trim().toUpperCase()

  for (const [boundary, kws] of Object.entries(BOUNDARY_KEYWORDS)) {
    let matched = false
    for (const k of keywordSet) {
      if (kws.has(k)) { matched = true; break }
    }
    if (!matched && boundary === 'sexual' && cert === 'NC-17') matched = true
    if (matched) flags.push(boundary)
  }
  return flags
}

/**
 * Returns true if the user's toggles + the film's content mean we should
 * hide the film from recommendations. Only graphic/sexual filter; the
 * others flag but don't filter.
 *
 * @param {Object} movie
 * @param {Object} enabledBoundaries - shape { graphic, sexual, animals, noise }
 */
export function shouldFilterByBoundaries(movie, enabledBoundaries) {
  if (!movie || !enabledBoundaries) return false
  const flags = detectMovieBoundaries(movie)
  return flags.some((b) => FILTER_BOUNDARIES.has(b) && enabledBoundaries[b])
}

/**
 * Returns the subset of flags that the user has toggled on AND the film
 * matches. Drives the "Heads up: X, Y" line on MovieDetail.
 */
export function activeMovieBoundaries(movie, enabledBoundaries) {
  if (!enabledBoundaries) return []
  const flags = detectMovieBoundaries(movie)
  return flags.filter((b) => !!enabledBoundaries[b])
}
