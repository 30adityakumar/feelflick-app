// src/features/profile/derive/ratingLanguage.js
// Pure deterministic "rating language" derivation for Cinematic DNA → Response.
//
// RATING CONTRACT (verified against the write path):
//   user_ratings.rating is the canonical integer 1–10 scale. The in-app star UI writes
//   stars(1–5) × 2 (useUserRating.js:158) → even values {2,4,6,8,10} = whole stars; external
//   imports (Trakt, NUMERIC rating) can write ANY integer 1–10 → odd values = half-stars.
//   So the scale is HALF-STAR-CAPABLE: displayed stars = rating / 2 (0.5★ … 5.0★).
//   The histogram therefore uses TEN 0.5★ buckets keyed by the stored integer 1..10 — it
//   represents the exact stored contract and never invents or merges values.
//
// Nothing here is sent to or produced by the LLM. Every number is computed from the already-
// fetched canonical rating rows. Invalid/null ratings are ignored; ties resolve deterministically.

// Minimum valid ratings before any behavioural interpretation (selectivity language) is shown.
// Below this we present factual counts only (documented product threshold, not a guarantee).
export const MIN_RATINGS_FOR_LANGUAGE = 8

function isValidRating(r) {
  return Number.isInteger(r) && r >= 1 && r <= 10
}

/**
 * @param {{ ratings?: Array<{ rating?: number }> }} args
 * @returns {null | {
 *   count, buckets, average, averageStars, mode, modeStars, fiveStarCount,
 *   topShare, spread, languageKey, summaryLine, eligible, interpret
 * }}
 */
export function deriveRatingLanguage({ ratings = [] } = {}) {
  const valid = (Array.isArray(ratings) ? ratings : [])
    .map((r) => r?.rating)
    .filter(isValidRating)
  const count = valid.length
  if (count === 0) return null

  // Ten 0.5★ buckets (rating 1..10). count[i] = number of ratings whose stored value === i+1.
  const counts = Array.from({ length: 10 }, () => 0)
  for (const r of valid) counts[r - 1] += 1
  const buckets = counts.map((c, i) => ({ rating: i + 1, stars: (i + 1) / 2, count: c }))

  const sum = valid.reduce((a, r) => a + r, 0)
  const averageRaw = sum / count // 1..10
  const averageStars = Math.round((averageRaw / 2) * 10) / 10 // 0.5..5.0, one decimal

  // Mode = most-used stored rating; deterministic tie-break → highest rating wins (favours the
  // clearer signal, and is stable regardless of input order).
  let modeRating = valid[0]
  let best = -1
  for (let i = 9; i >= 0; i--) { if (counts[i] > best) { best = counts[i]; modeRating = i + 1 } }
  const modeStars = modeRating / 2

  const fiveStarCount = counts[9] // rating === 10 → 5.0★
  const fiveStarShare = fiveStarCount / count
  const topShare = (counts[8] + counts[9]) / count // 4.5★ + 5★

  // Spread = population standard deviation in star units (0.5★ steps), rounded.
  const meanStars = averageRaw / 2
  const variance = valid.reduce((a, r) => a + ((r / 2) - meanStars) ** 2, 0) / count
  const spread = Math.round(Math.sqrt(variance) * 100) / 100

  // Smallest-defensible interpretation: a deterministic key from MORE THAN the average alone
  // (average band + how rare a 5★ is + how concentrated the top end is). Each branch is tested.
  const eligible = count >= MIN_RATINGS_FOR_LANGUAGE
  let languageKey = 'calibrating'
  if (eligible) {
    if (averageStars >= 4.2 && fiveStarShare >= 0.18) languageKey = 'generous'
    else if (averageStars >= 3.6 && fiveStarShare < 0.12) languageKey = 'warm-selective'
    else if (averageStars >= 3.6) languageKey = 'warm'
    else if (averageStars >= 3.0) languageKey = 'measured'
    else languageKey = 'demanding'
  }

  // Concentration band for the factual summary line (where most ratings land).
  const sorted = [...valid].sort((a, b) => a - b)
  const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]
  const lo = q(0.25)
  const hi = q(0.75)
  const summaryLine = lo === hi
    ? `Most of your ratings land around ${hi} out of 10.`
    : `Most ratings land between ${lo} and ${hi} out of 10.`

  const interpret = {
    calibrating: 'Still calibrating.',
    generous: 'Generous with high ratings.',
    'warm-selective': 'Warm, but selective.',
    warm: 'Warm in your praise.',
    measured: 'Measured in your praise.',
    demanding: 'A demanding scale.',
  }[languageKey]

  return { count, buckets, average: averageRaw, averageStars, mode: modeRating, modeStars, fiveStarCount, topShare, spread, languageKey, interpret, summaryLine, eligible }
}
