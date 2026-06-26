// src/features/landing/components/DnaPreview.jsx
// Illustrative Cinematic DNA — a thoughtful, evolving portrait of taste written in human
// language. No percentages, no confidence number, no numeric meters, no fake counts, no
// correction control. Verbal strength bands + short explanations replace the old segment
// meters; source categories are a quiet editorial list, not selectable chips. Closing
// disclosure makes clear it is a living portrait, not a permanent label.
import { DNA_EXAMPLE } from '../data'

export default function DnaPreview() {
  return (
    <section className="ff-l-section ff-l-dna" id="cinematic-dna" aria-labelledby="ff-l-dna-h">
      <div className="ff-l-shell ff-l-dna-layout">
        <div className="ff-l-dna-copy">
          <p className="ff-l-eyebrow">Cinematic DNA</p>
          <h2 id="ff-l-dna-h" className="ff-l-section-h2">Your taste, written in <em>human language.</em></h2>
          <p className="ff-l-section-lede">
            An evolving portrait of what moves you, what challenges you and what depends on
            the moment—built from your choices and open to inspection.
          </p>
        </div>

        <article className="ff-l-dna-card">
          <p className="ff-l-example-tag">Illustrative Cinematic DNA</p>
          <h3 className="ff-l-dna-archetype">{DNA_EXAMPLE.archetype}</h3>
          <p className="ff-l-dna-statement">{DNA_EXAMPLE.statement}</p>

          <h4 className="ff-l-dna-subhead">How strongly you respond</h4>
          <ul className="ff-l-dna-traits">
            {DNA_EXAMPLE.traits.map((t) => (
              <li key={t.label} className="ff-l-dna-trait">
                <div className="ff-l-dna-trait__head">
                  <span className="ff-l-dna-trait__label">{t.label}</span>
                  <span className="ff-l-dna-trait__band">{t.band}</span>
                </div>
                <p className="ff-l-dna-trait__desc">{t.description}</p>
              </li>
            ))}
          </ul>

          <h4 className="ff-l-dna-subhead">What shapes this portrait</h4>
          <ul className="ff-l-dna-sources">
            {DNA_EXAMPLE.sources.map((s) => (
              <li key={s} className="ff-l-dna-source">{s}</li>
            ))}
          </ul>

          <p className="ff-l-dna-disclosure">A living portrait, not a permanent label.</p>
        </article>
      </div>
    </section>
  )
}
