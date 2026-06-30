// src/features/profile/dna/CinematicDnaHero.jsx
// Portrait hero for an established / taking-shape Cinematic DNA. Owns the single page <h1>
// (the deterministic archetype identity). Forming profiles render DnaFormingState instead.

import CinematicArtworkSlices from './CinematicArtworkSlices'
import CinematicPassport from './CinematicPassport'

export default function CinematicDnaHero({ identity, mixtape, evidenceVersion, onEvidence, onScrollTo, subjectName = null }) {
  const { title, line, provenance, updated, facts, takingShape } = identity
  // subjectName set → another user's read-only view: hide the owner-only "Private" status pill,
  // the evidence sheet trigger ("Why this read?") and the owner export ("Share portrait").
  const readOnly = Boolean(subjectName)
  const takingShapeLine = subjectName
    ? `${subjectName}'s taste is taking shape — a portrait is beginning to emerge.`
    : 'Your taste is taking shape — a portrait is beginning to emerge.'
  return (
    <section className="ff-dna-hero" id="dna-portrait" aria-labelledby="ff-dna-h1">
      <CinematicArtworkSlices mixtape={mixtape} />
      <div className="ff-dna-hero__scrim" aria-hidden="true" />
      <div className="ff-dna-grain" aria-hidden="true" />
      <div className="ff-dna__shell ff-dna-hero__inner">
        <div className="ff-dna-hero__copy">
          <div className="ff-dna-hero__status">
            <p className="ff-dna-eyebrow">Cinematic DNA</p>
            {readOnly ? null : <span className="ff-dna-pill"><i className="ff-dna-private-dot" aria-hidden="true" />Private</span>}
            {updated ? <span className="ff-dna-pill ff-dna-pill--updated">{updated}</span> : null}
          </div>
          <h1 id="ff-dna-h1" className="ff-dna-hero__title">
            {title.lead}{title.em ? <em>{title.em}</em> : null}
          </h1>
          <p className="ff-dna-hero__line">{line}</p>
          {takingShape ? <p className="ff-dna-hero__prov">{takingShapeLine}</p> : null}
          {provenance ? <p className="ff-dna-hero__prov"><b>FeelFlick reflection</b> · {provenance}</p> : null}
          {facts.length > 0 ? (
            <div className="ff-dna-hero__facts">
              {facts.map((f) => (
                <span key={f.kind} className={`ff-dna-pill ff-dna-fact ff-dna-fact--${f.kind}`} aria-label={f.aria}>{f.text}</span>
              ))}
            </div>
          ) : null}
          <div className="ff-dna-hero__actions">
            <button type="button" className="ff-dna-btn ff-dna-btn--primary" onClick={() => onScrollTo('dna-response')}>{readOnly ? 'Explore DNA' : 'Explore your DNA'}</button>
            {readOnly ? null : (
              <>
                <button type="button" className="ff-dna-btn ff-dna-btn--secondary" onClick={onEvidence}>Why this read?</button>
                <button type="button" className="ff-dna-btn ff-dna-btn--ghost" onClick={() => onScrollTo('dna-passport')}>Share portrait</button>
              </>
            )}
          </div>
        </div>
        <CinematicPassport identity={identity} evidenceVersion={evidenceVersion} />
      </div>
    </section>
  )
}
