// src/features/movie/components/ParasitePostWatchPortrait.jsx
// Parasite-ONLY curated post-watch Film Portrait (§16). Lazy-loaded — this file and
// the spoiler text it imports are NOT in the pre-watch bundle. Rendered only when:
// signed in + persisted Watched + mv.id === 496243 (gate enforced by the parent).
//
// Contains: narrative movements, ONE labelled FeelFlick reading, non-interactive
// motif cards, and an ending reflection. NO awards metrics, NO critic/audience %,
// NO DNA before/after, NO recommendation-impact claims.

import { PARASITE_PORTRAIT } from '../curated/parasiteFilmPortrait'

const P = PARASITE_PORTRAIT

export default function ParasitePostWatchPortrait() {
  return (
    <div className="ff-movie-portrait">
      <header className="ff-movie-portrait__head">
        <p className="ff-movie-eyebrow ff-movie-portrait__shield">
          <span aria-hidden="true">●</span> {P.shieldLabel} · {P.unlockedLabel}
        </p>
        <h3 className="ff-movie-portrait__title">{P.heading}</h3>
        <p className="ff-movie-portrait__intro">{P.intro}</p>
      </header>

      {/* Narrative shape */}
      <section className="ff-movie-portrait__block" aria-label="Narrative shape">
        <p className="ff-movie-eyebrow">{P.narrative.eyebrow}</p>
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

      {/* One FeelFlick reading */}
      <section className="ff-movie-portrait__block ff-movie-portrait__reading" aria-label="A FeelFlick reading">
        <p className="ff-movie-eyebrow">{P.interpretation.eyebrow}</p>
        <h4 className="ff-movie-portrait__h4">{P.interpretation.heading}</h4>
        <p className="ff-movie-portrait__reading-body">{P.interpretation.body}</p>
      </section>

      {/* Non-interactive motif cards (NOT saved preferences) */}
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

      {/* Ending reflection */}
      <section className="ff-movie-portrait__block ff-movie-portrait__ending" aria-label="Ending reflection">
        <p className="ff-movie-eyebrow">{P.ending.eyebrow}</p>
        <h4 className="ff-movie-portrait__h4">{P.ending.heading}</h4>
        <p className="ff-movie-portrait__reading-body">{P.ending.body}</p>
      </section>
    </div>
  )
}
