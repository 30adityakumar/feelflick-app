// src/features/preferences/components/MoodEmphasis.jsx
// Three honest bands per mood (Less / Balanced / More). No percentages / bars.

import { usePreferencesData } from '../usePreferencesData'
import { moodBandOf } from '../data'
import Segmented from './Segmented'

const BANDS = [{ v: 'less', l: 'Less' }, { v: 'balanced', l: 'Balanced' }, { v: 'more', l: 'More' }]

export default function MoodEmphasis() {
  const { draft, setMoodBand, catalogs } = usePreferencesData()
  return (
    <fieldset className="ff-prefs-field" style={{ border: 'none', margin: 0, padding: 0 }}>
      <legend className="ff-prefs-subhead" style={{ padding: 0 }}>Mood emphasis</legend>
      <div className="ff-prefs-mood">
        {catalogs.MOODS.map((m) => {
          const band = moodBandOf(draft.moodWeights[m.id])
          return (
            <div key={m.id} className="ff-prefs-mood__row">
              <span className="ff-prefs-mood__label" id={`pf-mood-${m.id}`}>{m.label}</span>
              <Segmented value={band} onChange={(b) => setMoodBand(m.id, b)} options={BANDS} ariaLabelledBy={`pf-mood-${m.id}`} />
            </div>
          )
        })}
      </div>
      <p className="ff-prefs-note">This changes emphasis; it does not guarantee or exclude a mood.</p>
    </fieldset>
  )
}
