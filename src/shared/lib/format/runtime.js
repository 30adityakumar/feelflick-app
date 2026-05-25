// FeelFlick — runtime formatter. Replaces ad-hoc "143m" / "2h 23m" forms.

/**
 * Format a runtime in minutes as a human string.
 *
 * - Under 60 minutes → "47m"
 * - Multiple of 60   → "2h"
 * - Otherwise        → "2h 23m"
 *
 * @param {number|null|undefined} minutes
 * @returns {string} empty string if input is missing/zero
 */
export function formatRuntime(minutes) {
  if (!minutes || minutes <= 0) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
