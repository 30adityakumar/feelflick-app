// src/features/preferences/components/GenrePreferences.jsx
// Drawn-to / Avoid genre preferences. Overlap prevented by the draft setters.

import { usePreferencesData } from '../usePreferencesData'
import { genreLabelOf } from '../data'
import ChipMultiSelect from './ChipMultiSelect'

export default function GenrePreferences() {
  const { draft, addDrawnGenre, removeDrawnGenre, addAvoidGenre, removeAvoidGenre, catalogs } = usePreferencesData()
  const options = catalogs.GENRES.map((g) => ({ key: g.id, label: g.label }))
  const drawnItems = draft.drawnGenreIds.map((id) => ({ key: id, label: genreLabelOf(id) }))
  const avoidItems = draft.avoidGenreIds.map((id) => ({ key: id, label: genreLabelOf(id) }))
  return (
    <fieldset className="ff-prefs-field" style={{ border: 'none', margin: 0, padding: 0 }}>
      <legend className="ff-prefs-subhead" style={{ padding: 0 }}>Genres</legend>
      <p className="ff-prefs-field__hint">Preferred genres receive a positive signal. Avoided genres are excluded on the Discover surface.</p>
      <div className="ff-prefs-twocol">
        <div>
          <p className="ff-prefs-subhead">Drawn to</p>
          <ChipMultiSelect label="Add a preferred genre" items={drawnItems} options={options} onAdd={addDrawnGenre} onRemove={removeDrawnGenre} addLabel="+ Genre" tone="drawn" />
        </div>
        <div>
          <p className="ff-prefs-subhead">Avoid</p>
          <ChipMultiSelect label="Add an avoided genre" items={avoidItems} options={options} onAdd={addAvoidGenre} onRemove={removeAvoidGenre} addLabel="+ Genre" tone="avoid" />
        </div>
      </div>
    </fieldset>
  )
}
