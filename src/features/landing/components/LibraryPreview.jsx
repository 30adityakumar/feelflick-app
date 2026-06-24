// src/features/landing/components/LibraryPreview.jsx
import { useState } from 'react'
import { WATCHLIST_EXAMPLE, DIARY_EXAMPLE } from '../data'
import { Poster, LandingTabs } from '../primitives'

const TABS = [
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'diary', label: 'Diary' },
]
const DATA = { watchlist: WATCHLIST_EXAMPLE, diary: DIARY_EXAMPLE }

export default function LibraryPreview() {
  const [active, setActive] = useState('watchlist')
  const data = DATA[active]
  return (
    <section className="ff-l-section ff-l-library" id="library" aria-labelledby="ff-l-library-h">
      <div className="ff-l-shell">
        <header className="ff-l-section-head">
          <div>
            <p className="ff-l-eyebrow">Your film life</p>
            <h2 id="ff-l-library-h" className="ff-l-section-h2">Save the future. <em>Remember the past.</em></h2>
          </div>
          <p>Watchlist is for retrieval. Diary is a chronological record of what you watched and how it landed. Neither becomes another recommendation feed.</p>
        </header>
        <article className="ff-l-card ff-l-example">
          <p className="ff-l-example-tag">Illustrative private library</p>
          <LandingTabs label="Library view" tabs={TABS} active={active} onChange={setActive} idBase="ff-l-library" />
          <div
            className="ff-l-library-panel"
            role="tabpanel"
            id={`ff-l-library-panel-${active}`}
            aria-labelledby={`ff-l-library-tab-${active}`}
            tabIndex={0}
          >
            <p className="ff-l-library-copy">{data.copy}</p>
            <ul className="ff-l-library-chips" aria-label="Example controls">
              {data.chips.map((c) => <li key={c} className="ff-l-chip ff-l-chip--muted">{c}</li>)}
            </ul>
            <ul className="ff-l-poster-row">
              {data.films.map((f) => (
                <li key={f.title} className="ff-l-poster-item">
                  <Poster path={f.path} title={f.title} size="w185" className="ff-l-poster-img" />
                  <strong>{f.title}</strong>
                  <span>{f.meta}</span>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>
    </section>
  )
}
