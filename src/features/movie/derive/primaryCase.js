// src/features/movie/derive/primaryCase.js
// Pure tier-selection decision for the Film File's PrimaryCaseCard (F6B).
//
// Extracted MECHANICALLY from PrimaryCaseCard.jsx so the current case hierarchy is
// independently testable before F5.4 intentionally changes the trust hierarchy.
// F5.2 only EXPOSES and TESTS today's behavior — it does not change which case wins,
// the labels, the lead text, the match-availability rule, chip selection, the nudge,
// or the self-hide decision. All of those remain byte-identical to the prior inline
// logic; `tier`/`provenance` are NEW, non-rendered metadata.
//
// Pure: no React, no browser APIs, no side effects, non-mutating.

// Identical to the capitalize previously inline in PrimaryCaseCard.jsx.
const capitalize = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : ''

/**
 * @param {object} args
 * @param {object|null} args.ffTake     overlay.ff_take ({ body, byline, meta }) or null
 * @param {object|null} args.whyHeader  { eyebrow, headline, rationale } (tier-adaptive)
 * @param {number|null} args.matchPct   engine match % (0–100) or null
 * @param {string[]} [args.moodTags]    film mood_tags
 * @param {string|null} [args.fitProfile] film fit_profile
 * @param {boolean} [args.signedIn]
 * @returns {{
 *   tier: 'generated_take'|'adaptive_reason'|'standalone'|'signals_only'|'empty',
 *   label: string, lead: string, hasMatch: boolean, chips: string[],
 *   showNudge: boolean, shouldRender: boolean, isTake: boolean,
 *   provenance: 'generated'|'derived'|'static'|null
 * }}
 */
export function derivePrimaryCase({
  ffTake, whyHeader, matchPct, moodTags = [], fitProfile, signedIn = false,
}) {
  // --- current PrimaryCaseCard logic, moved verbatim ---
  const take = (ffTake?.body || '').trim()
  const isTake = Boolean(take)
  const label = take
    ? (ffTake.byline?.trim() || 'FeelFlick’s read')
    : (whyHeader?.eyebrow || 'How this reads')
  const lead = take || (whyHeader?.rationale || '').trim()

  const hasMatch = Number.isFinite(matchPct) && matchPct > 0

  const chips = []
  if (Array.isArray(moodTags) && moodTags[0]) chips.push(capitalize(moodTags[0]))
  if (fitProfile) chips.push(capitalize(fitProfile))

  // Nudge anon users toward the personal fit — but only when the lead itself
  // doesn't already say "sign in" (the anon header rationale does).
  const showNudge = !signedIn && isTake

  // Self-hide only when there is truly no useful case to make.
  const shouldRender = Boolean(lead) || hasMatch || chips.length > 0

  // --- NEW metadata (not rendered): which case won + its provenance ---
  let tier
  let provenance
  if (isTake) {
    tier = 'generated_take'   // the generated ff_take editorial hook
    provenance = 'generated'
  } else if (lead) {
    // The adaptive whyHeader rationale. "Why this fits you" = warm, fingerprint-
    // derived (real-origin/derived). Otherwise it is the cold/signed-out static
    // standalone copy (deriveWhyHeader's "Editorial fingerprint" branches).
    if (whyHeader?.eyebrow === 'Why this fits you') {
      tier = 'adaptive_reason'
      provenance = 'derived'
    } else {
      tier = 'standalone'
      provenance = 'static'
    }
  } else if (hasMatch || chips.length > 0) {
    tier = 'signals_only'      // only the match % and/or descriptive chips
    provenance = 'derived'
  } else {
    tier = 'empty'
    provenance = null
  }

  return { tier, label, lead, hasMatch, chips, showNudge, shouldRender, isTake, provenance }
}
