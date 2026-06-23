// src/features/preferences/components/DirectorPreferences.jsx
// Trusted / down-ranked directors. Honest copy: down-ranked is a strong negative
// signal, NOT a guaranteed removal.

import { usePreferencesData } from '../usePreferencesData'
import DirectorChips from './DirectorChips'

export default function DirectorPreferences() {
  const { draft, addTrustedDirector, removeTrustedDirector, addMutedDirector, removeMutedDirector, directorSuggestions, suggestionsUnavailable } = usePreferencesData()
  return (
    <div>
      <p className="ff-prefs-field__hint">Trusted directors receive a positive signal. Down-ranked directors receive a strong negative signal but are not guaranteed to disappear.</p>
      <p className="ff-prefs-field__hint" id="pf-director-note">Names must match catalogue spelling to take effect.{suggestionsUnavailable ? ' Suggestions are temporarily unavailable.' : ''}</p>
      <div className="ff-prefs-twocol">
        <div>
          <p className="ff-prefs-subhead">Trusted directors</p>
          <DirectorChips label="Add a trusted director" items={draft.trustedDirectors} onAdd={addTrustedDirector} onRemove={removeTrustedDirector} suggestions={directorSuggestions} tone="trusted" noteId="pf-director-note" placeholder="Type a director name…" />
        </div>
        <div>
          <p className="ff-prefs-subhead">Down-ranked directors</p>
          <DirectorChips label="Add a down-ranked director" items={draft.mutedDirectors} onAdd={addMutedDirector} onRemove={removeMutedDirector} suggestions={directorSuggestions} tone="muted" noteId="pf-director-note" placeholder="Type a director name…" />
        </div>
      </div>
    </div>
  )
}
