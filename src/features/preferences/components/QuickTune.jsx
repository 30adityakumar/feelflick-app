// src/features/preferences/components/QuickTune.jsx
// The three direct, supported controls. NOT labelled "biggest impact" (unmeasured).

import MoodEmphasis from './MoodEmphasis'
import GenrePreferences from './GenrePreferences'
import RuntimePreference from './RuntimePreference'

export default function QuickTune() {
  return (
    <section className="ff-prefs-card">
      <div className="ff-prefs__inner">
        <div className="ff-prefs-h"><p className="ff-prefs-eyebrow"><span className="ff-prefs-h__rule" aria-hidden="true" />Quick tune</p><h2>Three direct controls.</h2></div>
        <div style={{ display: 'grid', gap: 40 }}>
          <MoodEmphasis />
          <GenrePreferences />
          <RuntimePreference />
        </div>
      </div>
    </section>
  )
}
