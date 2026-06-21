// src/features/discover/discoverDirections.js
// Pure, deterministic semantic-direction builder for the redesigned /discover
// result. Given the SAME ranked candidate pool + context it always returns the
// same { closest, gentler, bolder } roles — this is the single source of truth
// for the three visible directions (the inline scoring in Discover.jsx produces
// the ranked pool; this file assigns SEMANTIC ROLES to it).
//
// Roles are semantic, never ordinal: "Gentler" is not "the second-ranked film",
// it is a film that genuinely reduces pressure relative to the lead while staying
// honestly aligned to the moment. When no candidate clears a role's thresholds we
// return null for that role — the UI renders fewer directions rather than
// fabricate one.
//
// ── Field scales (audited against e2e/fixtures/discover.js + useDiscoverData) ──
//   film.fit[axis]          0..1   mood-tag-derived fit per mood axis
//   film.moodFitRaw         0..1   avg fit across the user's selected moods (set in Discover.jsx)
//   film._rankScore         engine+UI composite (UNBOUNDED, ~0..200) — used ONLY for
//                           ordering (lead = top-ranked above the mood floor) + tie-breaks,
//                           NEVER as a delta magnitude (its scale is not stable enough to
//                           threshold on). All delta thresholds below use normalized 0..1 axes.
//   film._raw.llm_intensity / llm_attention_demand / llm_emotional_depth / llm_pacing   0..100
//   film._raw.discovery_potential / polarization_score                                  0..100
//   film._raw.original_language                                                          ISO code
//
// All pressure/novelty axes are normalized to 0..1 (value / 100) before any
// comparison so unlike fields are never combined raw.

import { TOP_MOOD_FIT_FLOOR, ALT_MOOD_FIT_FLOOR } from './derive'

// ── Named thresholds (all on normalized 0..1 axes) ─────────────────────────────
// A direction must keep at least one selected mood at this fit (so it still
// answers what the user asked). Sits between the lead floor (0.35) and the
// alternate floor (0.25): an alternate may lean a little off the *primary* mood
// but must still clearly hold one of the chosen moods.
export const PRIMARY_MOOD_PRESERVE = 0.30
// Overall moment-fit floor for any alternate (= the engine's existing alt floor).
export const MIN_MOMENT_FIT = ALT_MOOD_FIT_FLOOR // 0.25
// An alternate's moment fit may be at most this far below the lead's — past this
// the film no longer answers the same night.
export const MAX_FIT_DROP = 0.20
// Gentler must reduce the composite pressure index by at least this much vs lead.
export const MIN_GENTLER_DELTA = 0.12
// Bolder must raise the composite novelty index by at least this much vs lead.
export const MIN_BOLDER_DELTA = 0.12
// A gentler film may not INCREASE any single pressure axis by more than this
// (small slack absorbs noise without letting a "gentler" pick actually spike one
// dimension). Likewise a bolder film may not DROP novelty on the whole.
export const PRESSURE_AXIS_SLACK = 0.08

// Float tolerance so a delta sitting EXACTLY on a threshold is inclusive
// (boundary-test stable; avoids 0.11999… < 0.12 rejections).
const DELTA_EPS = 1e-6
const clamp01 = (n) => Math.max(0, Math.min(1, n))
const norm100 = (v) => (Number.isFinite(v) ? clamp01(v / 100) : null)

// Pressure axes a "gentler" direction lowers. Mean of the present axes.
function pressureProfile(film) {
  const r = film?._raw || {}
  return {
    intensity: norm100(r.llm_intensity),
    attention: norm100(r.llm_attention_demand),
    depth: norm100(r.llm_emotional_depth),
    pacing: norm100(r.llm_pacing),
  }
}
function meanDefined(obj) {
  const vals = Object.values(obj).filter((v) => v != null)
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}
export function pressureIndex(film) { return meanDefined(pressureProfile(film)) }

// Novelty/risk axes a "bolder" direction raises: discovery potential, polarization,
// and language-unfamiliarity relative to what the user usually watches.
export function noveltyIndex(film, familiarLanguages) {
  const r = film?._raw || {}
  const discovery = norm100(r.discovery_potential)
  const polar = norm100(r.polarization_score)
  const lang = r.original_language
  const familiar = familiarLanguages && familiarLanguages.size > 0 ? familiarLanguages : new Set(['en'])
  const unfamiliar = lang ? (familiar.has(lang) ? 0 : 1) : null
  return meanDefined({ discovery, polar, unfamiliar })
}

// The set of languages the user is "familiar" with — their primary watched
// language (when known) plus English as the catalogue default.
export function familiarLanguagesOf(profile) {
  const set = new Set(['en'])
  const primary = profile?.filters?.language_primary
  if (primary) set.add(primary)
  return set
}

// Strongest selected-mood fit for a film (does it still hold one chosen mood?).
function primaryMoodFit(film, selected) {
  if (!Array.isArray(selected) || selected.length === 0) return film?.moodFitRaw ?? 0
  return selected.reduce((best, id) => Math.max(best, film?.fit?.[id] ?? 0), 0)
}

// Shared eligibility every alternate must satisfy relative to the lead.
function eligibleAlternate(film, lead, selected) {
  if (!film || !lead || film.id === lead.id) return false
  if (primaryMoodFit(film, selected) < PRIMARY_MOOD_PRESERVE) return false
  if ((film.moodFitRaw ?? 0) < MIN_MOMENT_FIT) return false
  if ((lead.moodFitRaw ?? 0) - (film.moodFitRaw ?? 0) > MAX_FIT_DROP) return false
  return true
}

// Tie-break: larger honest delta, then closer moment fit, then engine rank, then
// stable id — fully deterministic for a fixed pool.
function pickBest(cands, deltaOf) {
  let best = null
  for (const c of cands) {
    const d = deltaOf(c)
    if (d == null) continue
    if (!best) { best = { c, d }; continue }
    if (d > best.d + 1e-9) { best = { c, d }; continue }
    if (Math.abs(d - best.d) <= 1e-9) {
      const cf = c.moodFitRaw ?? 0, bf = best.c.moodFitRaw ?? 0
      if (cf > bf + 1e-9) { best = { c, d }; continue }
      if (Math.abs(cf - bf) <= 1e-9) {
        const cr = c._rankScore ?? 0, br = best.c._rankScore ?? 0
        if (cr > br + 1e-9 || (Math.abs(cr - br) <= 1e-9 && c.id < best.c.id)) best = { c, d }
      }
    }
  }
  return best?.c || null
}

/**
 * Select a single alternate film for a role relative to a FIXED lead. Shared by
 * buildDiscoverDirections (initial roles) and the session reserve refill, so role
 * semantics never diverge between the two paths.
 *
 * @param {'gentler'|'bolder'} role
 * @param {Array} ranked
 * @param {{lead, selected?, profile?, excludeIds?:Set}} opts
 * @returns film annotated with _direction + _directionDelta, or null
 */
export function pickAlternate(role, ranked, { lead, selected = [], profile = null, excludeIds = new Set() } = {}) {
  if (!lead) return null
  const pool = (Array.isArray(ranked) ? ranked : []).filter(Boolean)
  const familiar = familiarLanguagesOf(profile)

  if (role === 'gentler') {
    const leadPressure = pressureIndex(lead)
    const leadAxes = pressureProfile(lead)
    if (leadPressure == null) return null
    const cands = pool.filter((f) => {
      if (f.id === lead.id || excludeIds.has(f.id)) return false
      if (!eligibleAlternate(f, lead, selected)) return false
      const p = pressureIndex(f)
      if (p == null || leadPressure - p < MIN_GENTLER_DELTA - DELTA_EPS) return false
      const axes = pressureProfile(f) // gentler must not spike any single pressure axis
      for (const k of Object.keys(axes)) {
        if (axes[k] != null && leadAxes[k] != null && axes[k] - leadAxes[k] > PRESSURE_AXIS_SLACK) return false
      }
      return true
    })
    const best = pickBest(cands, (f) => leadPressure - pressureIndex(f))
    return best ? { ...best, _direction: 'gentler', _directionDelta: +(leadPressure - pressureIndex(best)).toFixed(4) } : null
  }

  if (role === 'bolder') {
    const leadNovelty = noveltyIndex(lead, familiar)
    if (leadNovelty == null) return null
    const cands = pool.filter((f) => {
      if (f.id === lead.id || excludeIds.has(f.id)) return false
      if (!eligibleAlternate(f, lead, selected)) return false
      const n = noveltyIndex(f, familiar)
      if (n == null || n - leadNovelty < MIN_BOLDER_DELTA - DELTA_EPS) return false
      return true
    })
    const best = pickBest(cands, (f) => noveltyIndex(f, familiar) - leadNovelty)
    return best ? { ...best, _direction: 'bolder', _directionDelta: +(noveltyIndex(best, familiar) - leadNovelty).toFixed(4) } : null
  }
  return null
}

/**
 * Assign Closest / Gentler / Bolder roles over a ranked pool.
 *
 * @param {Array}  ranked    candidate films, ALREADY sorted by _rankScore desc and
 *                           already exclusion/session filtered (the canonical pipeline)
 * @param {object} opts
 * @param {string[]} opts.selected   selected mood ids
 * @param {object}   [opts.profile]  computeUserProfile result (for familiar languages)
 * @param {boolean}  [opts.allowAlternates=true]  false → lead only (e.g. fallback data
 *                                                  with no llm_* fields → no honest deltas)
 * @returns {{ closest, gentler, bolder, exhaustedPool: boolean }}
 *          roles are film objects annotated with `_direction` + `_directionDelta`;
 *          missing roles are null.
 */
export function buildDiscoverDirections(ranked, { selected = [], profile = null, allowAlternates = true } = {}) {
  const pool = Array.isArray(ranked) ? ranked.filter(Boolean) : []
  if (pool.length === 0) return { closest: null, gentler: null, bolder: null, exhaustedPool: true }

  // Closest fit = highest-ranked film clearing the lead mood-fit floor (same rule
  // as the engine's slot-1). Falls back to the top-ranked film only if none clear
  // it (extreme cold-start), matching diversifyTop3's behaviour.
  let lead = pool.find((f) => (f.moodFitRaw ?? 0) >= TOP_MOOD_FIT_FLOOR) || pool[0]
  lead = { ...lead, _direction: 'closest', _directionDelta: null }

  if (!allowAlternates) {
    return { closest: lead, gentler: null, bolder: null, exhaustedPool: pool.length <= 1 }
  }

  // Gentler + Bolder via the single shared role selector (one source of truth,
  // reused by the session's reserve refill). Bolder excludes the gentler pick.
  const gentler = pickAlternate('gentler', pool, { lead, selected, profile })
  const bolder = pickAlternate('bolder', pool, { lead, selected, profile, excludeIds: new Set(gentler ? [gentler.id] : []) })

  // Pool is "exhausted of roles" only when nothing beyond the lead can fill any
  // remaining role from the given pool.
  const usedIds = new Set([lead.id, gentler?.id, bolder?.id].filter(Boolean))
  const remainingEligible = pool.some((f) => !usedIds.has(f.id) && eligibleAlternate(f, lead, selected))
  return { closest: lead, gentler, bolder, exhaustedPool: !remainingEligible && !gentler && !bolder }
}

// Human, honest one-line delta explanation for an alternate card. Names the
// concrete dimension that changed relative to the lead — never a vague claim.
export function directionDeltaCopy(role, film, lead, familiar) {
  if (!film || !lead) return null
  if (role === 'gentler') {
    const f = pressureProfile(film), l = pressureProfile(lead)
    const drops = [
      ['asks for less attention', l.attention != null && f.attention != null ? l.attention - f.attention : 0],
      ['carries less emotional weight', l.depth != null && f.depth != null ? l.depth - f.depth : 0],
      ['runs at a calmer intensity', l.intensity != null && f.intensity != null ? l.intensity - f.intensity : 0],
      ['keeps a gentler pace', l.pacing != null && f.pacing != null ? l.pacing - f.pacing : 0],
    ].sort((a, b) => b[1] - a[1])
    return `Holds the mood, but ${drops[0][0]}.`
  }
  if (role === 'bolder') {
    const lang = film?._raw?.original_language
    if (lang && familiar && !familiar.has(lang)) return 'Same mood, but reaches for a less familiar language.'
    const f = film?._raw || {}, l = lead?._raw || {}
    if ((f.polarization_score ?? 0) - (l.polarization_score ?? 0) >= 12) return 'Same mood, but a more divisive, riskier choice.'
    return 'Same mood, but a more surprising, less obvious pick.'
  }
  return null
}

export const DIRECTION_LABEL = { closest: 'Closest fit', gentler: 'Gentler direction', bolder: 'Bolder direction' }
// Impression placement per role (distinct rows in recommendation_impressions).
export const DIRECTION_PLACEMENT = {
  closest: 'discover_lead',
  gentler: 'discover_gentler',
  bolder: 'discover_bolder',
  promoted: 'discover_promoted_lead',
}
