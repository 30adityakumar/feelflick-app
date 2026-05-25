// Shared DNA confidence formula.
//
// One formula, one number. /profile (QuickStats) and /account (Identity
// stat card) both call this so users never see different DNA percentages
// across surfaces. Anything else that wants to display "how confident are
// we in this user's taste fingerprint" should import from here too.
//
// Blends three signals:
//   • watch-history breadth (filmsLogged, caps at 100)    — 30%
//   • ratings count (taste calibration, caps at 30)       — 50%
//   • fingerprint richness (distinct mood tags, cap 12)   — 20%
//
// At 100/30/12 the score saturates at 100. The earlier single-input
// formula (filmsRated / 50 × 100) underweighted a rich watch history
// when the user hadn't rated much yet — a 200-film viewer with 0 ratings
// showed up at 0% confidence even though we had plenty of fingerprint.

/**
 * @param {object} input
 * @param {number} [input.filmsLogged=0]
 * @param {number} [input.filmsRated=0]
 * @param {number} [input.distinctMoodTags=0]  — count of distinct mood tags
 *   in the user's taste fingerprint (e.g. fingerprint.topMoodTags.length).
 * @returns {number} 0-100 integer
 */
export function computeDnaConfidence({ filmsLogged = 0, filmsRated = 0, distinctMoodTags = 0 } = {}) {
  const history     = Math.min(filmsLogged / 100, 1) * 30
  const ratings     = Math.min(filmsRated / 30, 1) * 50
  const fingerprint = Math.min((distinctMoodTags || 0) / 12, 1) * 20
  return Math.min(100, Math.round(history + ratings + fingerprint))
}
