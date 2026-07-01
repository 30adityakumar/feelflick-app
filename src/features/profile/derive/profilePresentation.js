// src/features/profile/derive/profilePresentation.js
// F7.4 — pure PRESENTATION helpers for Cinematic DNA trust framing. These never recompute or
// change any metric/formula/canonical evidence (F7.3); they decide how a corrected claim is
// QUALIFIED and whether generated identity prose is eligible to render at all.
//
// One source of truth for "how much evidence does the Profile have" — masthead eligibility,
// editorial GENERATION gating, and confidence presentation all consume this. Thresholds are
// product judgements about when a claim is worth making, not statistical guarantees.

export const MATURITY = { FORMING: 'forming', EMERGING: 'emerging', ESTABLISHED: 'established' }

// Evidence maturity from canonical counts. forming → too little evidence for generated
// identity prose; emerging → cautious generated interpretation; established → full presentation.
//
// A Cinematic DNA (taste_fingerprint) is computed from 5 watched films and needs NO ratings —
// ratings don't feed the archetype. So "forming" is gated on watched films ALONE: anyone who
// has a DNA (≥5 films, e.g. a completed onboarding) gets a portrait, even with 0–1 ratings.
// Ratings still distinguish EMERGING from ESTABLISHED (full confidence needs both).
export function classifyProfileMaturity({ watchedCount = 0, ratedCount = 0 } = {}) {
  const w = Number.isFinite(watchedCount) ? watchedCount : 0
  const r = Number.isFinite(ratedCount) ? ratedCount : 0
  if (w < 5) return MATURITY.FORMING
  if (w >= 15 && r >= 5) return MATURITY.ESTABLISHED
  return MATURITY.EMERGING
}

export const isForming = (maturity) => maturity === MATURITY.FORMING

// Qualitative band for the DNA-confidence number — the exact integer % is never shown to the
// user. The numeric value is preserved upstream (computeDnaConfidence) for internal consumers
// and regression tests; this only labels it as evidence maturity.
//   below 40 → Still forming · 40–69 → Taking shape · 70+ → Well established
export function deriveConfidenceBand(confidence) {
  const n = Number.isFinite(confidence) ? confidence : 0
  if (n >= 70) return { key: 'established', label: 'Well established', copy: 'FeelFlick has a strong read on your taste.' }
  if (n >= 40) return { key: 'taking-shape', label: 'Taking shape', copy: 'Keep logging and rating — your profile keeps sharpening.' }
  return { key: 'forming', label: 'Still forming', copy: 'A light read so far — the more you watch and rate, the more personal it gets.' }
}

// "Based on 18 watched films and 11 ratings" — canonical counts only; a segment is omitted when
// its value is unavailable; correct singular/plural; never implies every film was rated.
export function formatEvidenceSummary({ watchedCount = 0, ratedCount = 0 } = {}) {
  const w = Number.isFinite(watchedCount) ? watchedCount : 0
  const r = Number.isFinite(ratedCount) ? ratedCount : 0
  const parts = []
  if (w > 0) parts.push(`${w} watched film${w === 1 ? '' : 's'}`)
  if (r > 0) parts.push(`${r} rating${r === 1 ? '' : 's'}`)
  if (parts.length === 0) return null
  return `Based on ${parts.join(' and ')}`
}

// F7.5: a Profile-local AA-contrast colour for LOAD-BEARING muted labels (denominator/sample
// context, provenance, evidence, chart labels, confidence copy). The design-system HP.textMuted
// (rgba .45 ≈ 4.36:1) and HP.textFaint (rgba .40 ≈ 3.71:1) on #06060a fall below WCAG AA for
// normal text; this raises informational labels to ~7:1 (rgba .62 over #06060a) without globally
// altering the system or losing the editorial hierarchy (still below HP.textSoft ≈ 10.5:1).
export const INK_LABEL = 'rgba(250,250,250,0.62)'

// F7.5: one reusable count/denominator formatter for every Profile distribution, so each section
// states its denominator the same way. Reuses the F7.4 small-sample rule and adds an accessible
// sentence. Pure: never recomputes a metric, never mutates source data, safe on bad input.
export function formatDistributionContext({ count = null, total = 0, percentage = null, maturity } = {}) {
  const t = Number.isFinite(total) && total > 0 ? total : 0
  const c = Number.isFinite(count) ? count : null
  const p = Number.isFinite(percentage) ? Math.round(percentage) : null
  const filmsWord = (n) => `${n} film${n === 1 ? '' : 's'}`

  // Under 5 applicable films (or an explicitly forming profile) → no exact %, count-led.
  if (t < 5 || maturity === MATURITY.FORMING) {
    const hasCount = c != null && c > 0
    const primary = hasCount ? filmsWord(c) : 'Early signal'
    return { showPercent: false, primary, context: '', accessibleText: hasCount ? `${filmsWord(c)} so far` : 'Early signal — not enough films yet' }
  }
  // 5–9 → provisional, explicit count, no bare exact %.
  if (t < 10) {
    const context = c != null ? `${c} of ${t} films` : ''
    return { showPercent: false, primary: 'A growing signal', context, accessibleText: c != null ? `a growing signal, ${c} of ${t} films` : `a growing signal across ${filmsWord(t)}` }
  }
  // 10+ → percentage with denominator context.
  const primary = p != null ? `${p}%` : ''
  const context = c != null ? `${c} of ${t} films` : `of ${t} films`
  const accessibleText = p != null && c != null
    ? `${p} percent, representing ${c} of ${t} films`
    : (p != null ? `${p} percent of ${t} films` : `${t} films`)
  return { showPercent: true, primary, context, accessibleText }
}

// Small-sample presentation for a per-user proportional claim. `total` is the applicable film
// count (the real denominator). Under 5 → no exact %, count-led; 5–9 → provisional; 10+ → % with
// sample context. The underlying pct is never recomputed — this only decides how it's shown.
export function presentSampleShare({ pct = null, count = null, total = 0 } = {}) {
  const t = Number.isFinite(total) ? total : 0
  const p = Number.isFinite(pct) ? Math.round(pct) : null
  if (t < 5) {
    return { mode: 'forming', showPercent: false, text: count != null ? `${count} film${count === 1 ? '' : 's'}` : 'Early signal' }
  }
  if (t < 10) {
    return { mode: 'provisional', showPercent: false, text: count != null && p != null ? `~${p}% · ${count} of ${t}` : 'A growing signal' }
  }
  return { mode: 'established', showPercent: true, text: p != null && count != null ? `${p}% · ${count} of ${t} films` : (p != null ? `${p}%` : '') }
}
