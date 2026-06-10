// peoplePresentation.js — PURE taste-match presentation derivation for People (F8.3).
// No React, no Supabase, no side effects. Turns the raw similarity signals (overall_similarity →
// matchPct, movies_in_common, and the discoverable fingerprint `total`) into HONEST, evidence-
// qualified, de-precisioned presentation. It NEVER changes ranking, the raw similarity value, or
// candidate order — it only decides what a card may truthfully claim.
//
// Honesty contract:
//   * a taste match is an ALGORITHMIC estimate — never friendship, mutual interest, endorsement, or
//     film-specific agreement;
//   * exact percentages are not surfaced — only conservative qualitative bands;
//   * a quantified compatibility claim requires real shared evidence (films in common), and a
//     sparse / forming counterpart gets a cautious state instead of a confident band;
//   * the only relationship state is the explicit one-way follow (Follow / Following).
//
// Cross-user RLS (F8.2) exposes only the other user's `total` (watched count, from the opt-in
// discoverable fingerprint) and `moviesInCommon` (shared films) — NOT their ratings — so social
// eligibility is built from those two signals. The watched floor below (5) deliberately matches the
// Profile maturity model's forming watched-floor (classifyProfileMaturity in
// src/features/profile/derive/profilePresentation.js); it is restated here rather than imported to
// avoid an inappropriate People→Profile feature dependency and because the social inputs differ
// (no ratedCount is available cross-user).

export const MIN_IN_COMMON = 3       // below this many shared films we make NO quantified match claim
export const STRONG_IN_COMMON = 12   // strong shared evidence → may show the top band
export const MIN_WATCHED = 5         // the counterpart's profile must clear the forming watched-floor

export const SOCIAL_EVIDENCE = {
  INSUFFICIENT: 'insufficient', // not enough shared films to claim anything
  FORMING: 'forming',           // counterpart profile too sparse
  EMERGING: 'emerging',         // qualified but cautious
  ESTABLISHED: 'established',    // qualified, full presentation
}

// Classify how much we can honestly say about a match, from the available cross-user evidence.
export function classifySocialEvidence({ moviesInCommon = null, total = null } = {}) {
  const inCommon = Number.isFinite(moviesInCommon) ? moviesInCommon : null
  const watched = Number.isFinite(total) ? total : null
  if (inCommon == null || inCommon < MIN_IN_COMMON) return SOCIAL_EVIDENCE.INSUFFICIENT
  // counterpart's own profile is explicitly tiny → cautious even with some overlap
  if (watched != null && watched < MIN_WATCHED) return SOCIAL_EVIDENCE.FORMING
  if (inCommon >= STRONG_IN_COMMON || (watched != null && watched >= 15)) return SOCIAL_EVIDENCE.ESTABLISHED
  return SOCIAL_EVIDENCE.EMERGING
}

// Conservative qualitative band from the match percentage — NEVER a raw percentage, never
// "perfect / soulmate / predicts you" language. Returns null for invalid input.
export const TASTE_BANDS = {
  VERY_CLOSE: 'Very close taste',
  STRONG: 'Strong taste overlap',
  SOME: 'Some taste overlap',
}
export function tasteBand(matchPct) {
  const m = Number.isFinite(matchPct) ? Math.max(0, Math.min(100, matchPct)) : null
  if (m == null) return null
  if (m >= 75) return TASTE_BANDS.VERY_CLOSE
  if (m >= 55) return TASTE_BANDS.STRONG
  return TASTE_BANDS.SOME
}

// "Based on N films in common" — only when the source value genuinely supports it. Correct
// grammar; never fabricated; never derived from a total-watched count; hidden when 0/null/invalid.
export function formatTasteEvidence({ moviesInCommon = null } = {}) {
  const n = Number.isFinite(moviesInCommon) ? moviesInCommon : null
  if (n == null || n <= 0) return null
  return `Based on ${n} film${n === 1 ? '' : 's'} in common`
}

// The full presentation for a taste-match card.
//   { qualified, band, evidence, caption, maturity }
// - qualified=false → no quantified claim; `caption` is the cautious fallback, `band`/`evidence` null.
// - qualified=true  → `band` is the qualitative label, `evidence` the films-in-common context (may be
//   null if the source value is absent for this rail), `caption` defaults to the band.
// Emerging counterparts never receive the top "Very close" band.
export function deriveTasteMatchPresentation({ matchPct = null, moviesInCommon = null, total = null } = {}) {
  const maturity = classifySocialEvidence({ moviesInCommon, total })
  if (maturity === SOCIAL_EVIDENCE.INSUFFICIENT) {
    return { qualified: false, band: null, evidence: null, caption: 'Not enough shared evidence yet', maturity }
  }
  if (maturity === SOCIAL_EVIDENCE.FORMING) {
    return { qualified: false, band: null, evidence: null, caption: 'Taste still forming', maturity }
  }
  let band = tasteBand(matchPct)
  if (maturity === SOCIAL_EVIDENCE.EMERGING && band === TASTE_BANDS.VERY_CLOSE) band = TASTE_BANDS.STRONG
  const evidence = formatTasteEvidence({ moviesInCommon })
  return { qualified: true, band, evidence, caption: band, maturity }
}

// Relationship label — ONLY the explicit one-way follow state. Never "friend".
export function deriveRelationshipLabel({ following = false } = {}) {
  return following ? 'Following' : 'Follow'
}

// Count noun for a set of accounts the viewer FOLLOWS (never "friends").
export function formatFollowCount(n) {
  const c = Number.isFinite(n) ? Math.max(0, n) : 0
  return `${c} ${c === 1 ? 'person' : 'people'} you follow`
}
