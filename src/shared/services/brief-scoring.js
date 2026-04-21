// src/shared/services/brief-scoring.js
/**
 * Brief-driven scoring for Discover.
 * Maps mood-brief answers to hard filters, weight overrides, and ephemeral seeds.
 * Pure functions — no DB calls.
 */

import { scoreMovieV3 } from './scoring-v3'
import { QUESTION_SET } from '@/app/pages/discover/questions'

// ============================================================================
// VIBE UNPACKING
// ============================================================================

/**
 * Unpack the composite 'vibe' answer into separate feeling + tone values.
 * The vibe question merges feeling + tone into a single card selection.
 *
 * @param {Object} brief - raw brief answers { vibe, attention, time, company, anchor? }
 * @returns {{ feeling: string|null, tone: string|null }} unpacked values
 */
export function unpackVibe(brief) {
  if (!brief.vibe) return { feeling: null, tone: null }
  const vibeQuestion = QUESTION_SET.find(q => q.id === 'vibe')
  const opt = vibeQuestion?.options.find(o => o.value === brief.vibe)
  return { feeling: opt?.feeling ?? null, tone: opt?.tone ?? null }
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Base BRIEF preset — balanced across dims, mood-leaning. */
export const BRIEF_WEIGHTS_BASE = {
  embedding: 0.20, fit: 0.15, mood: 0.25,
  director_genre: 0.10, content: 0.15, quality: 0.15, negative: 0.00,
}

/** Tone → mood_tags that should get a scoring boost. */
export const TONE_MOOD_TAGS = {
  sharp:       ['tense', 'dark', 'mysterious', 'thrilling', 'suspenseful'],
  warm:        ['heartwarming', 'uplifting', 'comforting', 'hopeful', 'gentle'],
  bittersweet: ['melancholic', 'bittersweet', 'poignant', 'nostalgic', 'wistful'],
}

/** Tone boost applied per matching mood_tag on a candidate film. */
const TONE_BOOST_PER_TAG = 8
/** Max tone boost per film. */
const TONE_BOOST_CAP = 25

/** Penalty when film's mood_tags clash with the brief's tone. */
const TONE_CLASH_PENALTY = 15

/** Tags that clash with each tone direction. */
const TONE_CLASH_TAGS = {
  sharp:       ['heartwarming', 'uplifting', 'comforting', 'gentle', 'hopeful', 'warm'],
  warm:        ['tense', 'dark', 'disturbing', 'bleak', 'nihilistic'],
  bittersweet: ['thrilling', 'action-packed', 'silly', 'absurd'],
}

// ============================================================================
// HARD FILTERS
// ============================================================================

/**
 * Derive hard query filters from brief answers.
 * Values match QUESTION_SET option values in discover/questions.js.
 *
 * Era and familiarity questions removed — era uses profile era_floor,
 * familiarity defaults to exclude watched (Discover = discovery).
 *
 * @param {Object} brief - { time, company, vibe, attention }
 * @returns {Object} filter config consumed by query builder
 */
export function briefHardFilters(brief) {
  const filters = {}

  // time → runtime band (option values: 'short', 'medium', 'long', 'any')
  if (brief.time === 'short')  filters.runtime = { max: 100 }
  if (brief.time === 'medium') filters.runtime = { min: 90, max: 140 }
  if (brief.time === 'long')   filters.runtime = { min: 130 }

  // Always exclude watched in Discover
  filters.excludeWatched = true

  // company → family-friendly gate
  if (brief.company === 'family') filters.familyFriendly = true

  return filters
}

// ============================================================================
// WEIGHT OVERRIDES
// ============================================================================

/**
 * Derive weight adjustments from brief answers.
 * Uses unpacked vibe (feeling + tone). Mood selection bumps mood dimension;
 * anchor bumps embedding; explicit tone halves fit weight.
 * Always normalized to sum to 1.0.
 *
 * @param {Object} brief - raw brief answers (may contain vibe or feeling/tone)
 * @returns {Object} weight map { embedding, fit, mood, ... }
 */
export function briefWeightOverrides(brief) {
  const { feeling, tone } = unpackVibe(brief)
  const w = { ...BRIEF_WEIGHTS_BASE }

  if (feeling) w.mood = 0.45             // vibe selected → push mood dim
  if (brief.anchor) w.embedding = 0.35   // anchor film → push embedding
  if (tone && tone !== 'any') {
    w.fit *= 0.5     // halve fit weight — brief tone overrides profile preferences
    w.mood += 0.10   // shift weight to mood dimension
  }

  // Normalize to 1.0
  const sum = Object.values(w).reduce((a, b) => a + b, 0)
  for (const k of Object.keys(w)) w[k] = w[k] / sum
  return w
}

// ============================================================================
// BRIEF SIGNAL CHECK
// ============================================================================

/**
 * Returns true if the brief has any meaningful signal beyond defaults.
 * Empty brief ("Surprise me" shortcut) falls back to TOP_OF_TASTE weights.
 *
 * @param {Object} brief
 * @returns {boolean}
 */
export function hasBriefSignal(brief) {
  return !!(brief.vibe || brief.anchor || brief.attention)
}

// ============================================================================
// EPHEMERAL SEED INJECTION
// ============================================================================

/**
 * Build seed list for brief query. If an anchor film is present, inject it
 * as a high-weight ephemeral seed so embedding neighbors cluster around it.
 *
 * @param {Object|null} profile - v3 profile
 * @param {Object} brief - { anchor?: { id, title, year } }
 * @returns {Object[]} seed array for scoring context
 */
export function buildBriefSeeds(profile, brief) {
  const baseSeeds = profile?.rated?.positive_seeds || []
  if (!brief.anchor) return baseSeeds

  const anchorSeed = {
    id: brief.anchor.id,
    rating: 9,
    weight: 5,
    watched_at: new Date().toISOString(),
  }
  return [anchorSeed, ...baseSeeds]
}

// ============================================================================
// TONE BOOST
// ============================================================================

/**
 * Compute a scoring bonus for films whose mood_tags match the brief's tone.
 * Returns 0 if tone is 'any' or not in TONE_MOOD_TAGS.
 *
 * @param {Object} movie
 * @param {Object} brief
 * @returns {number} 0–TONE_BOOST_CAP
 */
export function computeToneBoost(movie, brief) {
  const { tone } = unpackVibe(brief)
  const toneTags = TONE_MOOD_TAGS[tone]
  if (!toneTags) return 0

  const movieMoodTags = Array.isArray(movie.mood_tags) ? movie.mood_tags : []
  const movieToneTags = Array.isArray(movie.tone_tags) ? movie.tone_tags : []
  const allTags = [...movieMoodTags, ...movieToneTags]

  const matches = allTags.filter(t => toneTags.includes(t)).length
  return Math.min(matches * TONE_BOOST_PER_TAG, TONE_BOOST_CAP)
}

/**
 * Compute a penalty for films whose tags clash with the brief's tone.
 * Only applies when the film has ZERO overlap with the tone's positive tags
 * AND has tags from the clash set.
 *
 * @param {Object} movie
 * @param {Object} brief
 * @returns {number} 0 or -TONE_CLASH_PENALTY
 */
export function computeToneClash(movie, brief) {
  const { tone } = unpackVibe(brief)
  const clashTags = TONE_CLASH_TAGS[tone]
  if (!clashTags) return 0

  const toneTags = TONE_MOOD_TAGS[tone] || []
  const movieMoodTags = Array.isArray(movie.mood_tags) ? movie.mood_tags : []
  const movieToneTags = Array.isArray(movie.tone_tags) ? movie.tone_tags : []
  const allTags = [...movieMoodTags, ...movieToneTags]

  // No clash if film already has positive tone overlap
  if (allTags.some(t => toneTags.includes(t))) return 0

  // Clash if film has tags from the opposing set
  if (allTags.some(t => clashTags.includes(t))) return -TONE_CLASH_PENALTY

  return 0
}

// ============================================================================
// BRIEF REASON
// ============================================================================

/** Feeling label map — vibe options use string feeling values. */
const FEELING_LABELS = {
  cozy: 'cozy', adventurous: 'adventurous', heartbroken: 'heartbroken',
  curious: 'curious', dark: 'dark', silly: 'funny',
  inspired: 'inspiring',
}

/**
 * Generate a grounded reason string for a brief result.
 * Falls through a priority chain until a reason is found.
 *
 * @param {Object} movie
 * @param {Object} breakdown - v3 dimension scores
 * @param {Object} brief - brief answers + anchor
 * @returns {string}
 */
export function generateBriefReason(movie, breakdown, brief) {
  const { feeling, tone } = unpackVibe(brief)
  const movieMoodTags = Array.isArray(movie.mood_tags) ? movie.mood_tags : []
  const movieToneTags = Array.isArray(movie.tone_tags) ? movie.tone_tags : []
  const genre = movie.primary_genre || movie.genres?.[0]?.name || 'film'

  // 1. Anchor similarity
  if (brief.anchor && breakdown.embedding >= 65) {
    return `Similar to ${brief.anchor.title}`
  }

  // 2. Tone match — film has mood/tone tags matching the brief tone
  const toneTags = TONE_MOOD_TAGS[tone]
  if (toneTags) {
    const matchedTag = [...movieMoodTags, ...movieToneTags].find(t => toneTags.includes(t))
    if (matchedTag) return `${capitalize(genre)} with a ${matchedTag} edge`
  }

  // 3. Feeling match — film's mood_tags align with the selected feeling
  const feelingLabel = FEELING_LABELS[feeling]
  if (feelingLabel && movieMoodTags.some(t => t.includes(feelingLabel) || feelingLabel.includes(t))) {
    return `Feels ${feelingLabel}`
  }

  // 4. Quality standout
  if (breakdown.quality >= 85) {
    return `${capitalize(genre)} at its best`
  }

  // 5. Strong embedding (user taste)
  if (breakdown.embedding >= 55) {
    return 'Close to your taste profile'
  }

  // 6. Generic fallback with genre
  return `${capitalize(genre)} pick for your brief`
}

/** @param {string} s */
function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

// ============================================================================
// SCORING
// ============================================================================

/**
 * Score a movie for a brief-driven Discover query.
 * Uses v3 7-dimension engine with brief-specific weight overrides,
 * plus a tone boost for mood_tag alignment with the brief's tone.
 *
 * @param {Object} movie
 * @param {Object} profile - v3 profile
 * @param {Object} context - from precomputeScoringContext
 * @param {Object} brief - brief answers + anchor
 * @returns {{ final: number, breakdown: Object, toneBoost: number }}
 */
export function scoreMovieForBrief(movie, profile, context, brief) {
  const weights = hasBriefSignal(brief)
    ? briefWeightOverrides(brief)
    : null // null → scoreMovieV3 falls back to ROW_WEIGHTS.BRIEF (≈ TOP_OF_TASTE)

  const result = scoreMovieV3(movie, profile, context, 'BRIEF', { weightsOverride: weights })

  // Tone boost: reward films whose mood/tone tags match the brief's tone
  const toneBoost = computeToneBoost(movie, brief)
  // Tone clash: penalize films whose tags oppose the brief's tone
  const toneClash = computeToneClash(movie, brief)

  return {
    ...result,
    final: Math.max(0, result.final + toneBoost + toneClash),
    toneBoost,
    toneClash,
  }
}
