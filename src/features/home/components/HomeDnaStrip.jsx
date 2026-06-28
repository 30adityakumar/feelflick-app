// src/features/home/components/HomeDnaStrip.jsx
// Compact Cinematic DNA strip that closes the Home recommendation experience.
//
// Deliberately NOT the former full-page DNA dashboard (that lives on /profile) —
// it is the *teaser/bridge* into it: an honest, evolving one-liner whose wording
// is proportional to how much evidence exists, a few real taste signals (recurring
// tones + moods), an emerging lean set apart as developing, and a descriptive door
// to the full portrait where the evidence lives.
//
// Honesty rules (doctrine): Cinematic DNA is living / evolving / never fixed,
// complete, or certain. Only show signals backed by real evidence; never fabricate
// chips; the headline must not claim a compounding "sharpening" trajectory for a
// profile that is still just its onboarding seed (see dnaMaturity).

import { Link } from 'react-router-dom'

function pretty(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ').replace(/-/g, ' ') : ''
}

export default function HomeDnaStrip({ dna }) {
  if (!dna) return null

  const realMotifs = (dna.motifs || []).filter(m => m && m !== 'Patterns forming…')
  const moodLabels = (dna.topMoods || []).map(m => m.label)
  const hasSignal = realMotifs.length > 0 || moodLabels.length > 0

  // Solid chips = the strongest established signals (tones first, then a mood the
  // user returns to). Bounded to keep the strip compact.
  const established = [...realMotifs, ...moodLabels].slice(0, 4)
  // Emerging = the engine's current fit lean, set apart as "developing". Only present
  // when it's a clear leader (tie-suppressed upstream in dnaSignalsFromProfile).
  const emerging = dna.topFit ? pretty(dna.topFit) : null

  // Depth-aware headline. With real signal the wording tracks evidence maturity
  // (dnaMaturity) so an onboarding-only profile reads "taking shape", not the
  // earned "keeps sharpening". With no signal yet it stays honestly forming.
  const state = hasSignal
    ? (dna.maturity?.line || 'Your taste is coming into focus.')
    : 'Your taste is still taking shape.'

  return (
    <section className="ff-dna" aria-labelledby="ff-dna-label">
      <div className="ff-dna__copy">
        <div className="ff-dna__label" id="ff-dna-label">Cinematic DNA</div>
        <strong className="ff-dna__state">{state}</strong>
      </div>

      {hasSignal ? (
        <ul className="ff-dna__tags" aria-label="Recurring taste signals">
          {established.map(tag => (
            <li className="ff-dna__tag" key={tag}>{tag}</li>
          ))}
          {emerging ? (
            <li className="ff-dna__tag is-emerging" key={`emerging-${emerging}`}>
              {emerging}<span className="ff-dna__tag-kind"> · still forming</span>
            </li>
          ) : null}
        </ul>
      ) : (
        <p className="ff-dna__forming">
          {dna.filmsToNext > 0
            ? `Log a few films and your taste signals begin to surface.`
            : `Your taste signals are beginning to surface.`}
        </p>
      )}

      <div className="ff-dna__door">
        <Link to="/profile" className="ff-dna__cta">Open your Cinematic DNA</Link>
        <span className="ff-dna__hint">See the evidence behind it.</span>
      </div>
    </section>
  )
}
