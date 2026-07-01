// src/features/profile/dna/identity.js
// Pure resolver: turns the profile data object into the honest Cinematic DNA hero/passport
// identity, respecting forming / taking-shape / established states and the editorial status.
// No fabrication: a specific archetype only appears off a real fingerprint (non-forming); the
// generated reflection line only appears when the cached editorial is CURRENT; otherwise a
// deterministic, non-fabricated line is used and the editorial refresh lives in the evidence sheet.

import { classifyProfileMaturity, MATURITY, deriveConfidenceBand } from '../derive/profilePresentation'

// Presentation-only map from the shared confidence-band labels (deriveConfidenceBand, UNCHANGED)
// to evidence-maturity vocabulary for the hero. Qualifies the band as evidence richness, never the
// identity. Thresholds/values are untouched; Account keeps the same number via deriveConfidenceBand.
const EVIDENCE_LABEL = {
  'Well established': { display: 'Evidence well established', aria: 'well established' },
  'Taking shape': { display: 'Evidence taking shape', aria: 'taking shape' },
  'Still forming': { display: 'Evidence still growing', aria: 'still growing' },
}

// Deterministic relative-date label off a timestamp (uses the fixed clock under tests).
function relativeUpdated(iso) {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  const days = Math.floor((Date.now() - t) / 86400000)
  if (days <= 0) return 'Updated today'
  if (days === 1) return 'Updated yesterday'
  if (days < 7) return `Updated ${days} days ago`
  if (days < 30) { const w = Math.round(days / 7); return `Updated ${w} week${w === 1 ? '' : 's'} ago` }
  const m = Math.round(days / 30); return `Updated ${m} month${m === 1 ? '' : 's'} ago`
}

// `subjectName` switches the copy voice. Default null → first-person ("Your", "you") for the
// owner's own page (byte-identical to the original copy). When a name is passed (another user's
// read-only page) the copy becomes third-person possessive ("A, B's", "they/their").
export function resolveDnaIdentity(data, subjectName = null) {
  const stats = data?.stats || {}
  const ed = data?.editorial || {}
  const status = data?.editorialStatus || 'none'
  const maturity = classifyProfileMaturity({ watchedCount: stats.filmsLogged, ratedCount: stats.filmsRated })
  const band = deriveConfidenceBand(stats.dnaConfidence)
  const forming = maturity === MATURITY.FORMING
  const takingShape = maturity === MATURITY.EMERGING
  const established = maturity === MATURITY.ESTABLISHED
  const archetype = Array.isArray(ed.archetype) ? ed.archetype : []
  const hasArchetype = !forming && archetype.length >= 1
  const reflectionCurrent = status === 'current' && Boolean(ed.summary || ed.signature)

  // Voice helpers — possessive + the films-they/you-watch fragments.
  const Poss = subjectName ? `${subjectName}'s` : 'Your'
  const theyWatch = subjectName ? 'the films they actually watch and rate' : 'the films you actually watch and rate'
  const theirFilms = subjectName ? 'their films' : 'your films'
  const theirTaste = subjectName ? 'their film taste' : 'your film taste'

  // Hero title — established/taking-shape use the deterministic archetype (primary + secondary
  // muted line); forming uses honest "still forming" framing (never a fabricated archetype).
  const title = forming
    ? { lead: `${Poss} Cinematic DNA`, em: 'is still forming.' }
    : { lead: archetype[0] || `${Poss} Cinematic DNA`, em: archetype[1] || '' }

  // The line under the title.
  let line
  if (forming) line = subjectName
    ? `${Poss} Cinematic DNA is still forming — not enough films logged yet.`
    : 'Your Cinematic DNA is still forming. Log and rate a few films, and FeelFlick starts reading your taste.'
  else if (reflectionCurrent) line = ed.summary || ed.signature
  else line = `A portrait built from ${theyWatch}.` // deterministic, non-fabricated

  const provenance = reflectionCurrent ? 'generated from verified taste patterns' : null

  let updated = null
  if (reflectionCurrent && ed.generatedAt) updated = relativeUpdated(ed.generatedAt)
  else if (status === 'stale') updated = 'Reflection needs refreshing'

  // Hero facts as structured pills. The confidence band is shown with an EVIDENCE-MATURITY
  // vocabulary so a specific archetype is never juxtaposed with the unqualified phrase
  // "Still forming" (which reads as if the identity itself is unformed). This is presentation
  // only — deriveConfidenceBand / computeDnaConfidence and Account's shared number are unchanged.
  const ev = EVIDENCE_LABEL[band?.label] || null
  const facts = [
    Number.isFinite(stats.filmsLogged) && stats.filmsLogged > 0 ? { text: `${stats.filmsLogged} watched`, kind: 'watched' } : null,
    Number.isFinite(stats.filmsRated) && stats.filmsRated > 0 ? { text: `${stats.filmsRated} rated`, kind: 'rated' } : null,
    ev ? { text: ev.display, kind: 'band', aria: `Taste evidence maturity: ${ev.aria}` } : null,
  ].filter(Boolean)

  // Passport tags — top moods (grounded, non-sensitive), ≤4.
  const tags = (data?.moods || []).slice(0, 4).map((m) => m.name).filter(Boolean)
  const passportLine = forming
    ? `A portrait of ${theirTaste}.`
    : (reflectionCurrent ? (ed.signature || ed.summary) : `A portrait built from ${theirFilms}.`)

  const displayName = (data?.user?.name || '').trim().split(/\s+/)[0] || 'Your'

  return { maturity, band, status, forming, takingShape, established, archetype, hasArchetype, reflectionCurrent, title, line, provenance, updated, facts, tags, passportLine, displayName }
}
