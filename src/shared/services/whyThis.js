// src/shared/services/whyThis.js
/**
 * Rule-based "why this" explanations for Mood Brief results.
 * Max 12 words. Never mentions percentages or scores.
 */

// ─── Mood ID → canonical tag names ───────────────────────────────────────────

const MOOD_TAG_MAP = {
  1:  ['warm', 'comforting'],
  2:  ['thrilling', 'epic'],
  3:  ['melancholy', 'devastating'],
  4:  ['thought-provoking', 'mind-bending'],
  5:  ['nostalgic', 'bittersweet'],
  6:  ['electric', 'propulsive'],
  7:  ['tense', 'unsettling'],
  8:  ['romantic', 'tender'],
  9:  ['uplifting', 'transcendent'],
  10: ['playful', 'absurd'],
  11: ['dark', 'haunting'],
  12: ['gentle', 'contemplative'],
}

const TONE_TAG_MAP = {
  warm: ['warm', 'hopeful', 'earnest', 'uplifting'],
  sharp: ['sharp', 'sardonic', 'cynical', 'acerbic'],
  bittersweet: ['bittersweet', 'melancholic', 'wistful', 'poignant'],
}

const FIT_PROFILE_COPY = {
  arthouse:        'A director-driven film that rewards attention.',
  crowd_pleaser:   'Accessible and effortless.',
  prestige_drama:  'Deliberate and performance-driven.',
  cult_classic:    'The kind of film that earns devoted fans.',
  genre_standout:  'A standout of its genre.',
  sleeper_hit:     'Under the radar but worth your time.',
  blockbuster:     'Big-screen spectacle done right.',
  indie_darling:   'Intimate and distinctly personal.',
  modern_classic:  'Already earning its place in the canon.',
}

/**
 * Count overlapping elements between two arrays.
 * @param {string[]} a
 * @param {string[]} b
 * @returns {string[]} shared elements
 */
function intersection(a, b) {
  if (!a?.length || !b?.length) return []
  const setB = new Set(b)
  return a.filter((v) => setB.has(v))
}

/**
 * Generates a 1-line "why this" explanation for a film given the brief.
 *
 * @param {{ mood_tags?: string[], tone_tags?: string[], fit_profile?: string,
 *           runtime?: number, release_year?: number, title: string }} movie
 * @param {{ answers: Record<string, any>, anchor?: { id: number, title: string } }} brief
 * @returns {string}
 */
export function buildWhyThis(movie, brief) {
  const answers = brief?.answers ?? {}
  const movieMoodTags = movie.mood_tags ?? []
  const movieToneTags = movie.tone_tags ?? []

  // Derive brief-expected tags
  const briefMoodTags = MOOD_TAG_MAP[answers.feeling] ?? []
  const briefToneTags = TONE_TAG_MAP[answers.tone] ?? []

  // 1. Anchor similarity
  if (brief?.anchor?.title && movie.title === brief.anchor.title) {
    return 'Your anchor film — the brief starts here.'
  }

  // 2. Strong mood + tone match (2+ mood overlap + 1+ tone overlap)
  const sharedMood = intersection(movieMoodTags, briefMoodTags)
  const sharedTone = intersection(movieToneTags, briefToneTags)

  if (sharedMood.length >= 2 && sharedTone.length >= 1) {
    return `Captures the ${sharedMood[0]} and ${sharedTone[0]} you're after.`
  }

  // 3. Strong mood match only (2+ mood overlap)
  if (sharedMood.length >= 2) {
    if (answers.energy === 1) return `A ${sharedMood[0]} film with space to breathe.`
    if (answers.energy === 5) return `A ${sharedMood[0]} film with momentum.`
    return `A ${sharedMood[0]} match.`
  }

  // 4. Tone + runtime match
  if (sharedTone.length >= 1 && answers.time && answers.time !== 'any') {
    const runtimeFits = checkRuntimeFits(movie.runtime, answers.time)
    if (runtimeFits) {
      return `${capitalize(sharedTone[0])} and exactly the length you wanted.`
    }
  }

  // 5. Fit profile match
  if (movie.fit_profile && FIT_PROFILE_COPY[movie.fit_profile]) {
    return FIT_PROFILE_COPY[movie.fit_profile]
  }

  // 6. Single mood overlap
  if (sharedMood.length === 1) {
    return `A ${sharedMood[0]} pick for tonight.`
  }

  // 7. Single tone overlap
  if (sharedTone.length === 1) {
    return `The ${sharedTone[0]} tone you asked for.`
  }

  // 8. Fallback — count overlapping dimensions
  let overlapCount = 0
  if (sharedMood.length > 0) overlapCount++
  if (sharedTone.length > 0) overlapCount++
  if (answers.time && answers.time !== 'any' && checkRuntimeFits(movie.runtime, answers.time)) overlapCount++
  if (answers.era && answers.era !== 'any' && checkEraFits(movie.release_year, answers.era)) overlapCount++
  overlapCount = Math.max(overlapCount, 2) // Always show at least 2

  return `Matches your brief across ${overlapCount} dimensions.`
}

function checkRuntimeFits(runtime, time) {
  if (!runtime) return false
  if (time === 'short') return runtime <= 90 && runtime >= 60
  if (time === 'standard') return runtime > 90 && runtime <= 150
  if (time === 'long') return runtime > 150
  return false
}

function checkEraFits(releaseYear, era) {
  if (!releaseYear) return false
  if (era === 'modern') return releaseYear >= 2015
  if (era === 'recent') return releaseYear >= 2000
  if (era === 'classic') return releaseYear < 2000
  return false
}

function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}
