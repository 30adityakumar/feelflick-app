// src/features/profile/dna/TasteJourney.jsx
// Journey — chapters of how your taste moved. Renders only when the deterministic segmentation
// produced ≥2 evidenced chapters (the section hides otherwise). The headline adapts to the real
// chapter count — never claims "three" when only two exist; never fabricates dates or prose.

const COUNT_WORD = { 2: 'Two', 3: 'Three' }

export default function TasteJourney({ journey = [] }) {
  if (!Array.isArray(journey) || journey.length < 2) return null
  const word = COUNT_WORD[journey.length] || `${journey.length}`
  return (
    <section className="ff-dna-section" id="dna-journey" aria-labelledby="ff-dna-journey-h2">
      <div className="ff-dna__shell">
        <div className="ff-dna-section__head">
          <div>
            <p className="ff-dna-eyebrow">Your taste journey</p>
            <h2 id="ff-dna-journey-h2">{word} chapters, not a tangled graph.</h2>
          </div>
          <p>Each chapter shows the one signal that mattered most.</p>
        </div>
        <div className="ff-dna-journey" data-n={journey.length}>
          {journey.map((era) => (
            <article className="ff-dna-era" key={era.index} style={{ '--c': era.color }}>
              <div className="ff-dna-era__dot" aria-hidden="true" />
              <div className="ff-dna-era__year">{era.range}</div>
              <h3>{era.title}</h3>
              <p>{era.change}</p>
              {era.tags.length > 0 ? (
                <div className="ff-dna-era__tags">
                  {era.tags.map((t) => <span key={t} className="ff-dna-pill">{t}</span>)}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
