// src/shared/services/row-subtitles.js
/**
 * Row subtitle generators.
 * Pure functions — no DB calls.
 */

import { FIT_HUMAN_LABELS } from './hero-reason'

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
