// src/features/landing/components/DnaPreview.jsx
// Illustrative Cinematic DNA. No percentages, no confidence number, no fake counts,
// no correction control. Source categories replace numeric evidence counts.
import { DNA_EXAMPLE } from '../data'

export default function DnaPreview() {
  return (
    <section className="ff-l-section ff-l-dna" id="cinematic-dna" aria-labelledby="ff-l-dna-h">
      <div className="ff-l-shell ff-l-dna-layout">
        <div className="ff-l-dna-copy">
          <p className="ff-l-eyebrow">Cinematic DNA</p>
          <h2 id="ff-l-dna-h" className="ff-l-section-h2">Your taste, written in <em>human language.</em></h2>
          <p className="ff-l-section-lede">
            A private, evidence-led portrait of recurring patterns in how films land for
            you. Direct preferences remain editable; learned patterns remain inspectable.
          </p>
        </div>
        <article className="ff-l-card ff-l-example ff-l-dna-card">
          <p className="ff-l-example-tag">Illustrative Cinematic DNA</p>
          <h3 className="ff-l-dna-archetype">{DNA_EXAMPLE.archetype}</h3>
          <p className="ff-l-dna-statement">{DNA_EXAMPLE.statement}</p>
          <ul className="ff-l-dna-traits">
            {DNA_EXAMPLE.traits.map((t) => (
              <li key={t.label} className="ff-l-dna-trait">
                <span className="ff-l-dna-trait__label">{t.label}</span>
                <span className="ff-l-dna-trait__segments" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= t.level ? 'on' : ''} />)}
                </span>
                <span className="ff-l-dna-trait__band">{t.band}</span>
              </li>
            ))}
          </ul>
          <p className="ff-l-dna-sources-label">Built from</p>
          <ul className="ff-l-dna-sources">
            {DNA_EXAMPLE.sources.map((s) => <li key={s} className="ff-l-chip">{s}</li>)}
          </ul>
        </article>
      </div>
    </section>
  )
}
