// src/features/movie/derive/matchBand.js
// Qualitative fit band for the Film File's PrimaryCase (F5.3).
//
// F5.3 removes the precise user-match integer from the Film File (Home + Discover
// already dropped visible %). At most ONE qualitative band may remain, in the
// PrimaryCase only. This helper maps the engine's mv.ffMatch (computed unchanged by
// computeMatchPercent) to a conservative band — it does NOT recompute anything and
// NEVER returns a percentage.
//
// Bands (from matchScore.js's own calibration notes: ~75–88% is a typical strong
// match; 90%+ is deliberately rare/outlier; below 60% does not justify a prominent
// positive recommendation claim):
//   >= 90 → 'Exceptional fit'
//   >= 75 → 'Strong fit'
//   >= 60 → 'Good fit'
//   else  → null  (no visible fit claim)
//
// Pure: no side effects, non-mutating (primitive input).

/**
 * @param {number|null|undefined} matchPct engine match % (0–99) or null
 * @returns {'Exceptional fit'|'Strong fit'|'Good fit'|null}
 */
export function deriveMatchBand(matchPct) {
  if (!Number.isFinite(matchPct)) return null // null / undefined / NaN / Infinity
  if (matchPct >= 90) return 'Exceptional fit'
  if (matchPct >= 75) return 'Strong fit'
  if (matchPct >= 60) return 'Good fit'
  return null // < 60 (incl. negatives) → no fit claim
}
