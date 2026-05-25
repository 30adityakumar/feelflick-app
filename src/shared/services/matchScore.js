// FeelFlick — Match % (system-wide).
//
// One function, one definition: "How well this film aligns with the user's
// accumulated taste signature." Stable for a given (film, user) pair —
// same number on /home, /watchlist, /movie/:id, /history, /lists.
//
// Inputs:
//   engineScore  — the multi-dimensional fit number from
//                  scoreMovieForUser(film, profile, 'default').score.
//                  Typical range 50..150 (lower = bad fit, higher = strong fit).
//                  Use the BASE score (pre any per-surface bonuses like mood
//                  coherence on /home — those are for ranking, not display).
//   profile      — the user's computeUserProfile output. Reads
//                  profile.meta.confidence ∈ {'low','medium','high'} which
//                  comes from watch-history depth.
//
// Output:
//   Integer 0–99 (the display %). Returns null when:
//     • engineScore is null / NaN / non-finite
//     • engineScore < 50 (engine says it's a poor fit — don't show "30%" badge)
//   When the function returns null, callers should HIDE the match badge.
//
// Calibration:
//   Piecewise-linear curve between anchor points. Confidence tiers shape
//   the curve:
//     • HIGH-confidence users: wide spread (30..99) — we have enough data
//       to be honest about poor fits.
//     • MEDIUM users: medium spread (40..96).
//     • LOW/COLD users: compressed spread (50..93) — we don't have enough
//       signal to confidently say "low match"; default to a more generous
//       guess while the engine still learns the user.
//
// Why a curve and not a linear map: the engine's score is not uniform.
// Films cluster in the 80..120 range, and the perceived difference
// between 70 and 90 is bigger than between 130 and 150 (diminishing
// returns at the top). The curve compresses the top and expands the
// middle so the visible % tracks real differentiation.

const FLOOR = 50  // engine scores below this → match % hidden

// Anchor points per confidence tier: [engineScore, displayPercent].
// Piecewise-linear interpolation between anchors.
//
// === Semantic honesty ===
// scoreMovieForUser doesn't have a notion of "100% perfect match." It sums
// ~21 weighted positive signals from user profile vs film attributes —
// every signal that fires adds points; there's no theoretical ceiling.
// An engaged user's top picks easily hit 240-280 simply because more
// signals fire (high base quality + genre match + people affinity + mood
// coherence + content style + ...). The score is a RANKING signal, not a
// GRADE.
//
// The right thing is to reserve "near-perfect" percentages (95-99%) for
// FILMS THAT ARE GENUINE OUTLIERS in the user's catalog — top ~1-3% of
// what we'd ever recommend. Typical top picks should land in the 75-88%
// range ("strong match"), not 95%+, so the badge is honest about what
// we measure: engine confidence, not certainty of enjoyment.
//
// === Empirical score distribution ===
// With the full MOVIE_ENGINE_COLS feeding the engine:
//   • cold-start (< 10 watches): 40–140, top picks 100–140
//   • medium     (10–30 watches): 80–260, top picks 200–260
//   • high       (30+ watches):  120–320+, top picks 240–320+
//
// The curve below maps these to a conservative display range. Each tier's
// "typical top pick" lands around 82-90%; 95%+ is reserved for the user's
// absolute strongest matches (rare).
const ANCHORS = {
  high: [
    [50, 18], [80, 30], [120, 48], [160, 62], [200, 73], [240, 82], [290, 90], [350, 99],
  ],
  medium: [
    [50, 22], [80, 35], [120, 52], [160, 67], [200, 77], [240, 85], [290, 92], [340, 99],
  ],
  low: [
    [50, 38], [80, 52], [110, 65], [140, 75], [170, 82], [210, 90], [260, 99],
  ],
}

function interpolate(anchors, x) {
  if (x <= anchors[0][0]) return anchors[0][1]
  if (x >= anchors[anchors.length - 1][0]) return anchors[anchors.length - 1][1]
  for (let i = 0; i < anchors.length - 1; i++) {
    const [x0, y0] = anchors[i]
    const [x1, y1] = anchors[i + 1]
    if (x >= x0 && x <= x1) {
      const t = (x - x0) / (x1 - x0)
      return y0 + t * (y1 - y0)
    }
  }
  return anchors[anchors.length - 1][1]
}

/**
 * Compute the display match % for a (film, user) pair.
 *
 * @param {object} args
 * @param {number|null} args.engineScore  — scoreMovieForUser(...).score for this film+user
 * @param {object|null} args.profile      — user profile from computeUserProfile
 * @returns {number|null} integer 0-99, or null when the badge should be hidden
 */
export function computeMatchPercent({ engineScore, profile } = {}) {
  if (!Number.isFinite(engineScore)) return null
  if (engineScore < FLOOR) return null
  const confidence = profile?.meta?.confidence
  const tier = confidence === 'high' || confidence === 'medium' || confidence === 'low'
    ? confidence
    : 'low'  // unknown / cold-start defaults to low (compressed, generous spread)
  const y = interpolate(ANCHORS[tier], engineScore)
  return Math.max(0, Math.min(99, Math.round(y)))
}

// Re-exported for tests / debugging. Not part of the stable API.
export const __test__ = { ANCHORS, interpolate, FLOOR }
