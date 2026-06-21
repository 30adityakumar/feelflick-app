// src/features/profile/dna/CinematicPassport.jsx
// The privacy-safe Cinematic Passport card (used both as the hero preview and the share artifact).
// Whitelisted content ONLY: display label, archetype (when eligible), current signature, ≤4
// grounded tags, decorative barcode, FeelFlick branding. NEVER renders email, UUID, exact
// counts, history, reviews, friends, or timestamps. No remote artwork (CORS-safe by construction).

import DnaBarcode from './DnaBarcode'

export default function CinematicPassport({ identity, evidenceVersion, innerRef }) {
  const { displayName, archetype, hasArchetype, passportLine, tags, forming } = identity
  const title = hasArchetype ? archetype.slice(0, 2).join(' · ') : 'Cinematic DNA'
  return (
    <div className="ff-dna-passport" aria-label="Cinematic Passport" ref={innerRef}>
      <div className="ff-dna-passport__top">
        <div className="ff-dna-passport__brand">FEELFLICK</div>
        <div className="ff-dna-passport__meta">Cinematic Passport</div>
      </div>
      <DnaBarcode evidenceVersion={evidenceVersion} archetype={archetype} tags={tags} />
      <div className="ff-dna-passport__kicker">{displayName}{displayName.endsWith('s') ? "'" : "'s"} Cinematic DNA</div>
      <div className="ff-dna-passport__title">{title}</div>
      {!forming && passportLine ? <div className="ff-dna-passport__line">{passportLine}</div> : null}
      {tags.length > 0 ? (
        <div className="ff-dna-passport__tags">
          {tags.map((t) => <span key={t} className="ff-dna-pill">{t}</span>)}
        </div>
      ) : null}
    </div>
  )
}
