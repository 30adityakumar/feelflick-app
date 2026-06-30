// Generalized post-watch film portrait renderer.
// Used by ParasitePostWatchPortrait (static curated data) and the DB path (LLM-generated).
// Accepts a `portrait` prop matching the shape stored in film_portraits.portrait.

export default function FilmPortrait({ portrait: P }) {
  return (
    <div className="ff-movie-portrait">
      <header className="ff-movie-portrait__head">
        <p className="ff-movie-eyebrow ff-movie-portrait__shield">
          <span aria-hidden="true">●</span>{' '}
          {P.shieldLabel ?? 'Spoilers ahead'} · {P.unlockedLabel ?? 'FeelFlick Reading'}
        </p>
        <h3 className="ff-movie-portrait__title">{P.heading}</h3>
        <p className="ff-movie-portrait__intro">{P.intro}</p>
      </header>

      <section className="ff-movie-portrait__block" aria-label="Narrative shape">
        <p className="ff-movie-eyebrow">{P.narrative.eyebrow ?? 'Narrative shape'}</p>
        <h4 className="ff-movie-portrait__h4">{P.narrative.heading}</h4>
        <ol className="ff-movie-portrait__movements">
          {P.narrative.movements.map((m) => (
            <li key={m.label} className="ff-movie-portrait__movement">
              <span className="ff-movie-portrait__movement-label">{m.label}</span>
              <span className="ff-movie-portrait__movement-title">{m.title}</span>
              <span className="ff-movie-portrait__movement-body">{m.body}</span>
            </li>
          ))}
        </ol>
        <p className="ff-movie-portrait__note">{P.narrative.note}</p>
      </section>

      <section className="ff-movie-portrait__block ff-movie-portrait__reading" aria-label="A FeelFlick reading">
        <p className="ff-movie-eyebrow">{P.interpretation.eyebrow ?? 'A FeelFlick reading'}</p>
        <h4 className="ff-movie-portrait__h4">{P.interpretation.heading}</h4>
        <p className="ff-movie-portrait__reading-body">{P.interpretation.body}</p>
      </section>

      <section className="ff-movie-portrait__block" aria-label="Motifs">
        <p className="ff-movie-eyebrow">Motifs</p>
        <ul className="ff-movie-portrait__motifs">
          {P.motifs.map((m) => (
            <li key={m.n} className="ff-movie-portrait__motif">
              <span className="ff-movie-portrait__motif-n" aria-hidden="true">{m.n}</span>
              <span className="ff-movie-portrait__motif-title">{m.title}</span>
              <span className="ff-movie-portrait__motif-note">{m.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="ff-movie-portrait__block" aria-label="Ending reflection">
        <p className="ff-movie-eyebrow">{P.ending.eyebrow ?? 'Ending reflection'}</p>
        <h4 className="ff-movie-portrait__h4">{P.ending.heading}</h4>
        <p className="ff-movie-portrait__reading-body">{P.ending.body}</p>
      </section>
    </div>
  )
}
