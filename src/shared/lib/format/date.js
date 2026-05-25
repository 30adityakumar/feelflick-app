// FeelFlick — date formatters.
// Replaces 7 ad-hoc toLocaleDateString call sites scattered across the app.
// All return strings; null/undefined inputs return ''.

const LOCALE = 'en-US'

function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

/**
 * "March 2024" — month long + year only.
 * Use for "joined" / "member since" style fields where the day is noise.
 *
 * @param {string|Date|null|undefined} value
 * @returns {string}
 */
export function formatMonthYear(value) {
  const d = toDate(value)
  if (!d) return ''
  return d.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })
}

/**
 * "March 14, 2024" — full readable date.
 * Use for release dates, blog post dates, anything where day matters.
 *
 * @param {string|Date|null|undefined} value
 * @returns {string}
 */
export function formatFullDate(value) {
  const d = toDate(value)
  if (!d) return ''
  return d.toLocaleDateString(LOCALE, { month: 'long', day: 'numeric', year: 'numeric' })
}

/**
 * "Mar 14, 2024" — short month + day + year.
 * Use for diary entries / activity feeds where space is tighter but year
 * still matters (older items must remain disambiguated).
 *
 * @param {string|Date|null|undefined} value
 * @returns {string}
 */
export function formatShortDate(value) {
  const d = toDate(value)
  if (!d) return ''
  return d.toLocaleDateString(LOCALE, { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * "Mar 2024" — short month + year (no day).
 * Use for monthly grouping headers.
 *
 * @param {string|Date|null|undefined} value
 * @returns {string}
 */
export function formatShortMonthYear(value) {
  const d = toDate(value)
  if (!d) return ''
  return d.toLocaleDateString(LOCALE, { month: 'short', year: 'numeric' })
}
