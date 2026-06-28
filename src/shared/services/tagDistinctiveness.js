// src/shared/services/tagDistinctiveness.js
//
// De-genericize a user's taste signals. A user's strongest tags BY RAW COUNT are
// dominated by catalog-common tags (tone "earnest" is on 53.7% of films, mood "tense"
// on 44.7%) — true, but uninformative: they describe most of the catalog, so two very
// different users surface the same chips. Re-ranking the user's already-strong tags by
// count × IDF (a TF-IDF lift) keeps the same SET but orders the most DISTINCTIVE first,
// so labels/chips/rows read as a personal signature ("grandiose, cold & earnest") rather
// than a generic one ("earnest, …").
//
// Crucially this is a RE-ORDERING of tags the user already has in their top-N — never an
// injection of rare tags they lack — so it only chooses the most characterful among
// genuinely-supported signals (no 1-film noise promoted from nowhere), and because
// downstream scoring consumes the full top-N as a SET, re-ordering within it is
// scoring-neutral (see scoringV3 userMoodSet/userToneSet).

import { TAG_BASE_RATE, DEFAULT_BASE_RATE_PCT } from './data/tagBaseRates'

// Below this prevalence, tags are treated as equally "very distinctive" (IDF saturates),
// so an ultra-rare tag (euphoric 0.3%, operatic 0.9%) can't earn a runaway IDF that lets a
// SINGLE loved film headline the signature over genuinely dominant, many-film taste. Clamps
// max IDF to ln(100/5) ≈ 3.0; below ~5% prevalence, SUPPORT differentiates, not rarity.
const PREVALENCE_FLOOR_PCT = 5

/**
 * Inverse document frequency for a tag: ln(100 / prevalence%), clamped at PREVALENCE_FLOOR_PCT.
 * Common tags → low IDF (earnest 53.7% → 0.62); distinctive tags → high IDF (grandiose 6.9% →
 * 2.67); ultra-rare tags saturate (euphoric 0.3% → ~3.0, same as a 5% tag) so rarity can't run away.
 * @param {'mood'|'tone'|'fit'} kind
 * @param {string} tag
 * @returns {number}
 */
export function tagIdf(kind, tag) {
  const pct = TAG_BASE_RATE[kind]?.[tag] ?? DEFAULT_BASE_RATE_PCT
  return Math.log(100 / Math.max(pct, PREVALENCE_FLOOR_PCT))
}

/**
 * Distinctiveness score = √support × clamped-IDF. Support is the tag's rating-weighted count
 * (affinity `count`/`weight`; one loved film ≈ 5). The √ damps support so a single film can't
 * crown the signature, while the IDF clamp stops a lone ultra-rare tag from dominating — together
 * they let a well-supported, moderately-distinctive tag (melancholic across 8 films) outrank a
 * one-film rarity (euphoric), yet still demote near-universal tags (earnest, tense).
 * @param {'mood'|'tone'|'fit'} kind
 * @param {{tag?: string, profile?: string, count?: number, weight?: number}} entry
 * @returns {number}
 */
export function distinctivenessScore(kind, entry) {
  const tag = entry?.tag ?? entry?.profile
  const support = Math.max(0, entry?.count ?? entry?.weight ?? 1)
  return Math.sqrt(support) * tagIdf(kind, tag)
}

/**
 * Re-order a user's tag array so the most DISTINCTIVE come first, preserving membership.
 * Stable: equal scores keep their original (count-desc) order. Returns a new array.
 * @param {Array<{tag?: string, profile?: string, count?: number, weight?: number}>} tags
 * @param {'mood'|'tone'|'fit'} kind
 * @returns {Array}
 */
export function rankByDistinctiveness(tags, kind) {
  if (!Array.isArray(tags) || tags.length < 2) return Array.isArray(tags) ? [...tags] : []
  return tags
    .map((t, i) => ({ t, i, score: distinctivenessScore(kind, t) }))
    .sort((a, b) => (b.score - a.score) || (a.i - b.i))
    .map((x) => x.t)
}
