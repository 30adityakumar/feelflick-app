// src/features/home/components/HomeDnaStrip.jsx
// Compact Cinematic DNA strip that closes the Home recommendation experience.
//
// Deliberately NOT the former full-page DNA dashboard (that lives on /profile).
// A label, an honest *evolving* one-liner, a few real taste signals (recurring
// motifs + moods the user returns to), an emerging pattern visually set apart,
// and a quiet "Open DNA" door to the full portrait.
//
// Honesty rules (doctrine): never describe DNA as fixed / complete / certain;
// only show signals backed by real evidence. With no evidence yet (cold-start)
// it shows an honest "still taking shape" state and no fabricated chips.

import { Link } from 'react-router-dom'

function pretty(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ').replace(/-/g, ' ') : ''
}

export default function HomeDnaStrip({ dna }) {
  if (!dna) return null

  const realMotifs = (dna.motifs || []).filter(m => m && m !== 'Patterns forming…')
  const moodLabels = (dna.topMoods || []).map(m => m.label)
  const hasSignal = realMotifs.length > 0 || moodLabels.length > 0

  // Solid chips = the strongest established signals (motifs first, then a mood
  // the user returns to). Bounded to keep the strip compact.
  const established = [...realMotifs, ...moodLabels].slice(0, 4)
  // Emerging = the engine's current fit lean, set apart (dashed) as "developing".
  const emerging = dna.topFit ? pretty(dna.topFit) : null

  const state = hasSignal ? 'Your taste keeps sharpening.' : 'Your taste is still taking shape.'

  return (
    <section className="ff-dna" aria-labelledby="ff-dna-label">
      <div className="ff-dna__copy">
        <div className="ff-dna__label" id="ff-dna-label">Cinematic DNA</div>
        <strong className="ff-dna__state">{state}</strong>
      </div>

      <div className="ff-dna__tags">
        {hasSignal ? (
          <>
            {established.map(tag => (
              <span className="ff-dna__tag" key={tag}>{tag}</span>
            ))}
            {emerging ? <span className="ff-dna__tag is-emerging">{emerging} emerging</span> : null}
          </>
        ) : (
          <span className="ff-dna__forming">
            {dna.filmsToNext > 0
              ? `Log a few films and your taste signals begin to surface.`
              : `Your taste signals are beginning to surface.`}
          </span>
        )}
      </div>

      <Link to="/profile" className="ff-dna__cta">Open DNA</Link>
    </section>
  )
}
