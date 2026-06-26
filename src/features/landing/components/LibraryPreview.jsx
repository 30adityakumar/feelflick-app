// src/features/landing/components/LibraryPreview.jsx
// "Your film life": one private-library specimen with two tabs that express two different
// jobs. Watchlist is a calm visual retrieval grid; Diary is a truthful chronological
// record grouped by month, each entry keeping a private reaction + note. No live data,
// no recommendation feed, no public/social activity, no fake controls.
import { useState } from 'react'
import { WATCHLIST_EXAMPLE, DIARY_EXAMPLE } from '../data'
import { Poster, LandingTabs } from '../primitives'

const TABS = [
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'diary', label: 'Diary' },
]

const monthId = (label) => `ff-l-diary-${label.replace(/\s+/g, '-').toLowerCase()}`

function Panel({ id, active, labelledby, children }) {
  // Both panels stay in the DOM with stable ids so every tab's aria-controls resolves;
  // the inactive panel is `hidden` (removed from focus order + a11y tree). tabIndex={0}
  // matches the Film File pattern: a panel with no focusable children is tab-reachable.
  return (
    <div
      role="tabpanel"
      id={`ff-l-library-panel-${id}`}
      aria-labelledby={labelledby}
      className="ff-l-library-panel"
      tabIndex={0}
      hidden={id !== active}
    >
      {children}
    </div>
  )
}

export default function LibraryPreview() {
  const [active, setActive] = useState('watchlist')
  return (
    <section className="ff-l-section ff-l-library" id="library" aria-labelledby="ff-l-library-h">
      <div className="ff-l-shell">
        <header className="ff-l-section-head">
          <div>
            <p className="ff-l-eyebrow">Your film life</p>
            <h2 id="ff-l-library-h" className="ff-l-section-h2">Save the future. <em>Remember the past.</em></h2>
          </div>
          <p>
            Watchlist keeps saved films easy to retrieve. Diary keeps a truthful
            chronological record of what you watched and how it landed. Neither becomes
            another feed.
          </p>
        </header>

        <article className="ff-l-card ff-l-example ff-l-library-card">
          <p className="ff-l-example-tag">Illustrative private library</p>
          <LandingTabs label="Library view" tabs={TABS} active={active} onChange={setActive} idBase="ff-l-library" />

          {/* Watchlist — visual retrieval grid */}
          <Panel id="watchlist" active={active} labelledby="ff-l-library-tab-watchlist">
            <h3 className="ff-l-library-h3">{WATCHLIST_EXAMPLE.heading}</h3>
            <p className="ff-l-library-copy">{WATCHLIST_EXAMPLE.copy}</p>

            {/* Static, explanatory retrieval capabilities — NOT interactive controls. */}
            <div className="ff-l-tools">
              <p className="ff-l-tools__label" id="ff-l-library-tools">Retrieval tools</p>
              <ul className="ff-l-tools__list" aria-labelledby="ff-l-library-tools">
                {WATCHLIST_EXAMPLE.tools.map((t) => (
                  <li key={t} className="ff-l-tools__item">{t}</li>
                ))}
              </ul>
            </div>

            <ul className="ff-l-watch-grid">
              {WATCHLIST_EXAMPLE.films.map((f) => (
                <li key={f.title} className="ff-l-watch-item">
                  <Poster path={f.path} title={f.title} size="w185" className="ff-l-watch-poster" />
                  <strong className="ff-l-watch-title">{f.title}</strong>
                  <span className="ff-l-watch-meta">{f.meta}</span>
                </li>
              ))}
            </ul>
          </Panel>

          {/* Diary — chronological record grouped by month */}
          <Panel id="diary" active={active} labelledby="ff-l-library-tab-diary">
            <h3 className="ff-l-library-h3">{DIARY_EXAMPLE.heading}</h3>
            <p className="ff-l-library-copy">{DIARY_EXAMPLE.copy}</p>

            <div className="ff-l-diary">
              {DIARY_EXAMPLE.months.map((m) => (
                <div key={m.label} className="ff-l-diary-month">
                  <h4 id={monthId(m.label)} className="ff-l-diary-month__label">{m.label}</h4>
                  <ol className="ff-l-diary-list" aria-labelledby={monthId(m.label)}>
                    {m.entries.map((e) => (
                      <li key={`${e.title}-${e.datetime}`} className="ff-l-diary-entry">
                        <time className="ff-l-diary-entry__day" dateTime={e.datetime} aria-label={e.dateLabel}>{e.day}</time>
                        <Poster path={e.path} title={e.title} size="w185" className="ff-l-diary-poster" />
                        <div className="ff-l-diary-entry__id">
                          <strong className="ff-l-diary-entry__title">{e.title}</strong>
                          <span className="ff-l-diary-entry__reaction">{e.reaction}</span>
                        </div>
                        <p className="ff-l-diary-entry__note">{e.note}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </Panel>
        </article>
      </div>
    </section>
  )
}
