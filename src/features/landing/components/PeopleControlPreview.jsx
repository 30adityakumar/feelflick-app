// src/features/landing/components/PeopleControlPreview.jsx
// "People and control" — one product philosophy expressed through two complementary halves
// on a single shared surface: the voices you choose to follow can add watched-gated context,
// and your own taste, preferences and private film life stay yours to inspect. No named
// users, no profiles, no Follow, no avatars, no percentages, no public activity feed, no
// fake switches/fields/toasts/synthetic writes.
import { PEOPLE_EXAMPLE, PREFERENCES_EXAMPLE } from '../data'

export default function PeopleControlPreview() {
  return (
    <section className="ff-l-section ff-l-control" id="people-control" aria-labelledby="ff-l-control-h">
      <div className="ff-l-shell">
        <header className="ff-l-section-head">
          <div>
            <p className="ff-l-eyebrow">People and control</p>
            <h2 id="ff-l-control-h" className="ff-l-section-h2">The voices you trust. <em>The choices you keep.</em></h2>
          </div>
          <p>
            Follow people whose public film notes add useful context, while your taste
            portrait, library and direct preferences remain private and yours to inspect.
          </p>
        </header>

        {/* One shared editorial surface holding two complementary halves (not two cards). */}
        <div className="ff-l-control-specimen">
          <p className="ff-l-example-tag">Illustrative people and preferences</p>
          <div className="ff-l-control-split">
            {/* Left half — followed voices */}
            <article className="ff-l-control-half" aria-labelledby="ff-l-people-h">
              <h3 id="ff-l-people-h" className="ff-l-control-h3">{PEOPLE_EXAMPLE.heading}</h3>
              <p className="ff-l-control-copy">{PEOPLE_EXAMPLE.copy}</p>
              <ul className="ff-l-voices">
                {PEOPLE_EXAMPLE.voices.map((v) => (
                  <li key={v.label} className="ff-l-voice">
                    <p className="ff-l-voice__label">{v.label}</p>
                    <p className="ff-l-voice__context">{v.context}</p>
                    <p className="ff-l-voice__film">{v.film}</p>
                    <p className="ff-l-voice__note">{v.note}</p>
                  </li>
                ))}
              </ul>
            </article>

            {/* Right half — control */}
            <article className="ff-l-control-half" aria-labelledby="ff-l-prefs-h">
              <h3 id="ff-l-prefs-h" className="ff-l-control-h3">{PREFERENCES_EXAMPLE.heading}</h3>
              <p className="ff-l-control-copy">{PREFERENCES_EXAMPLE.copy}</p>
              <dl className="ff-l-pref-list">
                {PREFERENCES_EXAMPLE.preferences.map((p) => (
                  <div key={p.label} className="ff-l-pref-row">
                    <dt className="ff-l-pref-row__term">
                      <span className="ff-l-pref-row__name">{p.label}</span>
                      <span className="ff-l-pref-row__status">{p.status}</span>
                    </dt>
                    <dd className="ff-l-pref-row__desc">{p.description}</dd>
                  </div>
                ))}
              </dl>
              <p className="ff-l-pref-soon">{PREFERENCES_EXAMPLE.comingSoon}</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
