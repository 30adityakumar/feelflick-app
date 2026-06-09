// src/features/movie/derive/primaryCase.js
// Pure tier-selection decision for the Film File's PrimaryCaseCard.
//
// F5.3 trust hierarchy (display-only; engine/match calc untouched):
//   A. A genuine warm PERSONALIZED rationale (whyHeader "Why this fits you") leads —
//      and WINS over the generated ff_take. provenance: real-origin / derived.
//   B. The honest cold / signed-out STANDALONE rationale leads when that's all we
//      have. provenance: static / direct. It must not claim personalized fit.
//   C. The generated ff_take is a SEPARATE, secondary `editorialImpression` —
//      explicitly FeelFlick-generated. It never replaces a real rationale and is
//      never represented as user-derived evidence. If it is the only content, the
//      card may render but is framed only as a generated impression (NOT "Why this
//      fits you"). provenance: generated / direct.
//   D. At most one qualitative `fitBand` (deriveMatchBand) — NEVER a visible %.
//
// Provenance aligns with sourceClassification.js: ff_take = generated/direct,
// match fit band = real/derived. This module holds no UI copy beyond the small
// neutral labels needed to pick a tier; the card owns presentation.
//
// Pure: no React, no browser APIs, no side effects, non-mutating.

import { deriveMatchBand } from './matchBand'

// Identical to the capitalize previously inline in PrimaryCaseCard.jsx.
const capitalize = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : ''

/**
 * @param {object} args
 * @param {object|null} args.ffTake     overlay.ff_take ({ body, byline, meta }) or null
 * @param {object|null} args.whyHeader  { eyebrow, headline, rationale } (tier-adaptive)
 * @param {number|null} args.matchPct   engine match % (0–99) or null
 * @param {string[]} [args.moodTags]    film mood_tags
 * @param {string|null} [args.fitProfile] film fit_profile
 * @param {boolean} [args.signedIn]
 * @returns {{
 *   tier: 'adaptive_reason'|'standalone'|'generated_impression'|'signals_only'|'empty',
 *   primaryLabel: string, primaryLead: string,
 *   primaryProvenance: 'derived'|'static'|null,
 *   editorialImpression: string|null, editorialLabel: string|null,
 *   fitBand: string|null, chips: string[],
 *   showNudge: boolean, shouldRender: boolean,
 * }}
 */
export function derivePrimaryCase({
  ffTake, whyHeader, matchPct, moodTags = [], fitProfile, signedIn = false,
}) {
  const take = (ffTake?.body || '').trim()
  const isTake = Boolean(take)
  const rationale = (whyHeader?.rationale || '').trim()
  const eyebrow = whyHeader?.eyebrow
  // deriveWhyHeader emits "Why this fits you" ONLY for a genuine warm fingerprint;
  // the cold / signed-out branches emit "Editorial fingerprint".
  const isWarm = eyebrow === 'Why this fits you'

  // --- (A/B) primary lead = the REAL/STATIC rationale, never the generated take ---
  let tier
  let primaryLead = ''
  let primaryLabel = ''
  let primaryProvenance = null
  if (rationale && isWarm) {
    tier = 'adaptive_reason'
    primaryLead = rationale
    primaryLabel = eyebrow                 // "Why this fits you"
    primaryProvenance = 'derived'          // real-origin / derived
  } else if (rationale) {
    tier = 'standalone'
    primaryLead = rationale
    primaryLabel = eyebrow || 'How this reads'
    primaryProvenance = 'static'           // honest cold / signed-out copy
  }

  // --- (C) generated ff_take → secondary, clearly-FeelFlick impression ---
  const editorialImpression = isTake ? take : null
  const editorialLabel = isTake ? 'FeelFlick impression' : null

  // --- (D) qualitative fit band (NO percentage) ---
  const fitBand = deriveMatchBand(matchPct)

  const chips = []
  if (Array.isArray(moodTags) && moodTags[0]) chips.push(capitalize(moodTags[0]))
  if (fitProfile) chips.push(capitalize(fitProfile))

  // Resolve the no-rationale tiers + their neutral labels.
  if (!primaryLead) {
    if (isTake) {
      tier = 'generated_impression'        // only a generated FeelFlick impression
      primaryLabel = 'FeelFlick impression'
    } else if (fitBand || chips.length > 0) {
      tier = 'signals_only'                // only a band and/or descriptive chips
      primaryLabel = 'How it may fit'
      primaryProvenance = 'derived'
    } else {
      tier = 'empty'
    }
  }

  // Nudge anon users toward making the fit personal — only when all we have for them
  // is a generated impression (the rationale branches already invite sign-in).
  const showNudge = !signedIn && isTake

  // Self-hide only when there's truly nothing useful (a bare sub-60 match no longer
  // counts — it produces no visible fit claim).
  const shouldRender = Boolean(primaryLead) || Boolean(editorialImpression) || Boolean(fitBand) || chips.length > 0

  return {
    tier, primaryLabel, primaryLead, primaryProvenance,
    editorialImpression, editorialLabel, fitBand, chips, showNudge, shouldRender,
  }
}
