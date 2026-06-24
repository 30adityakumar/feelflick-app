// src/features/landing/components/PeopleControlPreview.jsx
// People + Preferences as product explanations — no fake switches, no Follow,
// no toasts, no synthetic writes, no named users, no percentages.
import { PEOPLE_EXAMPLE, PREFERENCES_EXAMPLE } from '../data'

export default function PeopleControlPreview() {
  return (
    <section className="ff-l-section ff-l-control" id="people-control" aria-labelledby="ff-l-control-h">
      <div className="ff-l-shell">
        <header className="ff-l-section-head">
          <div>
            <p className="ff-l-eyebrow">People and control</p>
            <h2 id="ff-l-control-h" className="ff-l-section-h2">Social when useful. <em>Private by default.</em></h2>
          </div>
          <p>Follow trusted taste without a fake compatibility percentage, and keep direct control over the inputs FeelFlick supports today.</p>
        </header>
        <div className="ff-l-control-grid">
          <article className="ff-l-card ff-l-example">
            <p className="ff-l-example-tag">Illustrative social context</p>
            <h3 className="ff-l-control-h3">People who get it.</h3>
            <p className="ff-l-control-copy">{PEOPLE_EXAMPLE.copy}</p>
            <ul className="ff-l-voices">
              {PEOPLE_EXAMPLE.voices.map((v, i) => (
                <li key={v} className="ff-l-voice">
                  <span className="ff-l-voice__glyph" aria-hidden="true" />
                  <div>
                    <strong>{i === 0 ? 'A followed voice' : 'Another followed voice'}</strong>
                    <span>{v}</span>
                  </div>
                </li>
              ))}
            </ul>
          </article>
          <article className="ff-l-card ff-l-example">
            <p className="ff-l-example-tag">Illustrative preferences</p>
            <h3 className="ff-l-control-h3">Direct control over the inputs we support.</h3>
            <p className="ff-l-control-copy">{PREFERENCES_EXAMPLE.copy}</p>
            <ul className="ff-l-pref-list">
              {PREFERENCES_EXAMPLE.controls.map((c) => (
                <li key={c} className="ff-l-pref-row">{c}</li>
              ))}
            </ul>
            <p className="ff-l-pref-soon">{PREFERENCES_EXAMPLE.comingSoon}</p>
          </article>
        </div>
      </div>
    </section>
  )
}
