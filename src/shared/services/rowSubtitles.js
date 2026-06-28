// src/shared/services/rowSubtitles.js
/**
 * Row subtitle generators.
 * Pure functions — no DB calls.
 */

import { FIT_HUMAN_LABELS } from './heroReason'

// === SHORT FIT LABELS (for subtitle copy) ===

const FIT_SHORT = {
  prestige_drama: 'prestige dramas',
  genre_popcorn: 'genre cinema',
  crowd_pleaser: 'crowd-pleasers',
  challenging_art: 'challenging art',
  arthouse: 'arthouse',
  festival_discovery: 'festival picks',
  cult_classic: 'cult classics',
  comfort_watch: 'comfort watches',
  franchise_entry: 'franchise films',
  niche_world_cinema: 'world cinema',
}

/**
 * Build a subtitle string for the "Top of your taste" row
 * from the user's top 2 fit profiles.
 *
 * Examples:
 *   "Leaning into prestige dramas and arthouse"
 *   "Leaning into cult classics"
 *   null (if profile has no fit data)
 *
 * @param {Object|null} profile - v3 user profile
 * @returns {string|null}
 */
export function topOfTasteSubtitle(profile) {
  const fits = profile?.affinity?.fit_profiles
  if (!Array.isArray(fits) || fits.length === 0) return null

  const labels = fits
    .slice(0, 2)
    .map(f => FIT_SHORT[f.profile] || FIT_HUMAN_LABELS[f.profile])
    .filter(Boolean)

  if (labels.length === 0) return null
  if (labels.length === 1) return `Leaning into ${labels[0]}`
  return `Leaning into ${labels[0]} and ${labels[1]}`
}

// ============================================================================
// MOOD ROW
// ============================================================================

const VOWEL_SOUND = /^[aeiou]/i
const STRONG_TONES = new Set(['bittersweet', 'melancholic', 'tense', 'dark', 'uplifting', 'whimsical'])

/**
 * Build a dynamic title for the mood row.
 * Strong tone signal (count >= 8, allowlisted) overrides mood; falls back to generic.
 *
 * @param {Object|null} profile - v3 user profile
 * @returns {{ title: string, lead: string|null, kind: 'tone'|'mood' }}
 */
export function moodRowTitle(profile) {
  const topTone = profile?.affinity?.tone_tags?.[0]
  const topMood = profile?.affinity?.mood_tags?.[0]

  // Tone override: high count + allowlisted strong tone only
  if (topTone && topTone.count >= 8 && STRONG_TONES.has(topTone.tag)) {
    const article = VOWEL_SOUND.test(topTone.tag) ? 'an' : 'a'
    return { title: `Films with ${article} ${topTone.tag} edge`, lead: topTone.tag, kind: 'tone' }
  }
  if (topMood) {
    return { title: `Films that feel ${topMood.tag}`, lead: topMood.tag, kind: 'mood' }
  }
  return { title: 'Films for your mood', lead: null, kind: 'mood' }
}

/**
 * Build a subtitle for the mood row from top 3 mood tags.
 *
 * Examples:
 *   "Drawing from your taste for tense, mysterious and thrilling films"
 *   "Drawing from your taste for melancholic films"
 *   null
 *
 * @param {Object|null} profile - v3 user profile
 * @returns {string|null}
 */
export function moodRowSubtitle(profile) {
  const tags = (profile?.affinity?.mood_tags || []).slice(0, 3).map(m => m.tag)
  if (tags.length === 0) return null
  if (tags.length === 1) return `Drawing from your taste for ${tags[0]} films`
  const last = tags[tags.length - 1]
  const rest = tags.slice(0, -1)
  return `Drawing from your taste for ${rest.join(', ')} and ${last} films`
}

// ============================================================================
// FACET LABELS (mood signature · tones)
// ============================================================================

/** Sentence-case the first letter only (tags are stored lower-case). */
function cap(s) {
  return typeof s === 'string' && s.length ? s[0].toUpperCase() + s.slice(1) : s
}

/**
 * Compact label for the "Mood signature" row title — the user's top 1–2
 * rating-weighted mood tags, e.g. "Tense & melancholic".
 *
 * @param {Object|null} profile - v3 user profile
 * @returns {string|null}
 */
export function moodSignatureLabel(profile) {
  const tags = (profile?.affinity?.mood_tags || []).slice(0, 2).map(m => m.tag).filter(Boolean)
  if (tags.length === 0) return null
  if (tags.length === 1) return cap(tags[0])
  return `${cap(tags[0])} & ${tags[1]}`
}

/**
 * Compact label for the "Signature tones" row title — the user's top 2–3
 * rating-weighted tone tags, e.g. "Cerebral, atmospheric & noir".
 *
 * @param {Object|null} profile - v3 user profile
 * @returns {string|null}
 */
export function signatureTonesLabel(profile) {
  const tags = (profile?.affinity?.tone_tags || []).slice(0, 3).map(t => t.tag).filter(Boolean)
  if (tags.length === 0) return null
  if (tags.length === 1) return cap(tags[0])
  const last = tags[tags.length - 1]
  const rest = tags.slice(0, -1)
  return `${cap(rest[0])}${rest.length > 1 ? ', ' + rest.slice(1).join(', ') : ''} & ${last}`
}

/**
 * DNA-strip taste signals derived from the SAME v3 affinity the facet rows use,
 * so the Cinematic DNA strip can't say "still taking shape" while the rows below
 * it confidently show Mood/Tone facets. Shaped to match the fingerprint-derived
 * `dna` object (motifs = tones, topMoods, topFit) so HomeDnaStrip consumes either
 * source uniformly. Returns null when there's no real affinity signal — then the
 * caller keeps the (honest, possibly-empty) fingerprint dna untouched.
 *
 * @param {Object|null} profile - v3 user profile
 * @returns {{ motifs: string[]|null, topMoods: {label:string, weight:number}[]|null, topFit: string|null }|null}
 */
export function dnaSignalsFromProfile(profile) {
  const aff = profile?.affinity
  if (!aff) return null
  const motifs = (aff.tone_tags || []).slice(0, 3).map(t => cap(t.tag)).filter(Boolean)
  const topMoods = (aff.mood_tags || []).slice(0, 6)
    .map(m => ({ label: cap(m.tag), weight: m.weight ?? m.count ?? 0 }))
    .filter(m => m.label)
  const topFit = aff.fit_profiles?.[0]?.profile || null
  if (motifs.length === 0 && topMoods.length === 0) return null
  return {
    motifs: motifs.length ? motifs : null,
    topMoods: topMoods.length ? topMoods : null,
    topFit,
  }
}
