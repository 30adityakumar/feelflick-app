// src/features/home-v2/edition.js
// Computes the masthead Issue + Volume + Edition Nº labels deterministically
// from the FeelFlick launch date. Replaces the previous hardcoded
// META.issueNum / 'Edition Nº 142' constants across home-v2, discover-v5,
// and any future surface that wants the dated masthead chip.
//
// LAUNCH_DATE is the anchor "Issue 001 · Edition Nº 001". One issue per
// calendar day; volumes roll every 365 days.

const LAUNCH_DATE = new Date('2026-05-18T00:00:00Z')
const ROMAN = ['I', 'II', 'III', 'IV', 'V']

function daysSinceLaunch(now = Date.now()) {
  const ms = now - LAUNCH_DATE.getTime()
  return Math.max(1, Math.floor(ms / 86_400_000) + 1)
}

/**
 * @returns {{ issueNum: string, volume: string, edition: string }}
 *   issueNum — zero-padded 3-digit string (e.g. '042'), used in the home masthead
 *   volume   — roman numeral (rolls every 365 days), capped at 'V'
 *   edition  — same numeric value as issueNum, used in discover-v5 "Edition Nº NN"
 */
export function currentEdition() {
  const days = daysSinceLaunch()
  const volumeIdx = Math.min(ROMAN.length - 1, Math.floor((days - 1) / 365))
  return {
    issueNum: String(days).padStart(3, '0'),
    volume: ROMAN[volumeIdx],
    edition: String(days).padStart(3, '0'),
  }
}
