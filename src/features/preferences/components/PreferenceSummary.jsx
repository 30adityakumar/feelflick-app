// src/features/preferences/components/PreferenceSummary.jsx
// At-a-glance summary, derived from real draft state. The first three cells are
// direct settings; the fourth is a read-only statement of learning sources.

import { usePreferencesData } from '../usePreferencesData'
import { deriveSummary } from '../derive/preferenceSummary'

export default function PreferenceSummary() {
  const { draft } = usePreferencesData()
  const s = deriveSummary(draft)
  return (
    <section className="ff-prefs-card ff-prefs-card--tint">
      <div className="ff-prefs__inner">
        <div className="ff-prefs-h"><p className="ff-prefs-eyebrow"><span className="ff-prefs-h__rule" aria-hidden="true" />At a glance</p><h2>Your recommendation profile.</h2></div>
        <div className="ff-prefs-summary">
          <div className="ff-prefs-summary__cell"><span className="ff-prefs-summary__k">Mood emphasis</span><span className="ff-prefs-summary__v">{s.mood}</span><span className="ff-prefs-summary__note">You told us</span></div>
          <div className="ff-prefs-summary__cell"><span className="ff-prefs-summary__k">Genres</span><span className="ff-prefs-summary__v">{s.genres}</span><span className="ff-prefs-summary__note">You told us</span></div>
          <div className="ff-prefs-summary__cell"><span className="ff-prefs-summary__k">Runtime</span><span className="ff-prefs-summary__v">{s.runtime}</span><span className="ff-prefs-summary__note">You told us</span></div>
          <div className="ff-prefs-summary__cell ff-prefs-summary__cell--learn"><span className="ff-prefs-summary__k">FeelFlick learns from</span><span className="ff-prefs-summary__v">{s.learning}</span><span className="ff-prefs-summary__note">Behaviour, not a direct setting</span></div>
        </div>
      </div>
    </section>
  )
}
