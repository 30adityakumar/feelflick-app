// src/features/profile/dna/DirectorInfluence.jsx
// Directors you return to. Uses the real director derivation (≥2 films, ranked by return
// frequency then rating). Bars are NORMALIZED relative lengths only — no exact 0–100 influence
// score, no percentage, no false precision. Copy is factual (counts), never psychological prose.
// Named "directors" (not "creative voices") because only director data exists.

export default function DirectorInfluence({ directors = [] }) {
  if (!Array.isArray(directors) || directors.length === 0) return null
  const maxFilms = Math.max(...directors.map((d) => d.films || 0)) || 1
  const top = directors[0]
  const factual = (d) => `${d.films} film${d.films === 1 ? '' : 's'}${d.avg != null ? ` · avg ${d.avg.toFixed(1)}★` : ''}`
  return (
    <section className="ff-dna-section" id="dna-voices" aria-labelledby="ff-dna-voices-h2">
      <div className="ff-dna__shell">
        <div className="ff-dna-section__head">
          <div>
            <p className="ff-dna-eyebrow">Creative influence</p>
            <h2 id="ff-dna-voices-h2">The voices you trust.</h2>
          </div>
          <p>Shown through the directors you return to most, among filmmakers with at least two films of evidence.</p>
        </div>
        <div className="ff-dna-influence">
          <div className="ff-dna-influence__panel">
            <h3>Longer bars mean more returns.</h3>
            <div className="ff-dna-influence__list">
              {directors.map((d) => (
                <div className="ff-dna-influence__row" key={d.name}>
                  <div className="ff-dna-influence__name">{d.name}<small>{factual(d)}</small></div>
                  <div className="ff-dna-influence__track"><div className="ff-dna-influence__fill" style={{ '--v': `${Math.round((d.films / maxFilms) * 100)}%`, '--c': d.accent || 'var(--accent)' }} /></div>
                </div>
              ))}
            </div>
          </div>
          <aside className="ff-dna-influence__card">
            <p className="ff-dna-eyebrow">Most returned to</p>
            <h3>{top.name}</h3>
            <p>Your strongest repeat pattern among eligible directors — {factual(top)}{top.firstWatchedYear ? `, first logged in ${top.firstWatchedYear}` : ''}.</p>
            <div className="ff-dna-influence__stat"><span>Films watched</span><strong>{top.films}</strong></div>
          </aside>
        </div>
      </div>
    </section>
  )
}
