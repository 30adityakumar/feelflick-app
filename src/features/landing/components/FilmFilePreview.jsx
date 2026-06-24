// src/features/landing/components/FilmFilePreview.jsx
import { useState } from 'react'
import { FILM_FILE_EXAMPLE } from '../data'
import { Poster, LandingTabs } from '../primitives'

const TABS = [
  { id: 'before', label: 'Before watching' },
  { id: 'after', label: 'After watching' },
]

export default function FilmFilePreview() {
  const [active, setActive] = useState('before')
  const data = FILM_FILE_EXAMPLE[active]
  return (
    <section className="ff-l-section ff-l-filmfile" id="film-file" aria-labelledby="ff-l-filmfile-h">
      <div className="ff-l-shell ff-l-filmfile-layout">
        <div className="ff-l-filmfile-copy">
          <p className="ff-l-eyebrow">The Film File</p>
          <h2 id="ff-l-filmfile-h" className="ff-l-section-h2">Decide before. <em>Reflect after.</em></h2>
          <p className="ff-l-section-lede">
            Before watching, every page is spoiler-safe and practical. After a settled
            Watched action, it opens your reflection and deeper post-watch context.
          </p>
        </div>
        <article className="ff-l-card ff-l-example">
          <p className="ff-l-example-tag">Illustrative example</p>
          <LandingTabs label="Film File state" tabs={TABS} active={active} onChange={setActive} idBase="ff-l-filmfile" />
          <div
            className="ff-l-filmfile-panel"
            role="tabpanel"
            id={`ff-l-filmfile-panel-${active}`}
            aria-labelledby={`ff-l-filmfile-tab-${active}`}
            tabIndex={0}
          >
            <div className="ff-l-filmfile-top">
              <Poster path={FILM_FILE_EXAMPLE.poster.path} title={FILM_FILE_EXAMPLE.poster.title} className="ff-l-filmfile-poster" />
              <div>
                <small className="ff-l-filmfile-status">{data.status}</small>
                <h3 className="ff-l-filmfile-title">{FILM_FILE_EXAMPLE.title}</h3>
                <p className="ff-l-filmfile-summary">{data.summary}</p>
              </div>
            </div>
            <dl className="ff-l-filmfile-rows">
              {data.rows.map(([k, v]) => (
                <div key={k} className="ff-l-filmfile-row">
                  <dt>{k}</dt><dd>{v}</dd>
                </div>
              ))}
            </dl>
            {data.note && <p className="ff-l-filmfile-note">{data.note}</p>}
          </div>
        </article>
      </div>
    </section>
  )
}
