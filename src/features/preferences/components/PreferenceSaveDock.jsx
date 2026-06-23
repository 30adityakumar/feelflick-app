// src/features/preferences/components/PreferenceSaveDock.jsx
// Fixed dock shown while dirty (or saving / save-error). Save error is shown
// here persistently — not only as a transient toast.

import { usePreferencesData } from '../usePreferencesData'

export default function PreferenceSaveDock() {
  const { dirty, saving, saveStatus, saveError, save, discard } = usePreferencesData()
  if (!dirty && !saving) return null
  const errored = saveStatus === 'save_error' && !!saveError
  return (
    <div className="ff-prefs-dock" role="region" aria-label="Unsaved preference changes">
      <div className="ff-prefs-dock__copy">
        <strong>{errored ? 'Could not save' : 'Unsaved changes'}</strong>
        <span className={errored ? 'ff-prefs-dock__err' : ''}>{errored ? saveError : 'Save to apply these preferences.'}</span>
      </div>
      <div className="ff-prefs-dock__actions">
        <button type="button" className="ff-prefs-btn ff-prefs-btn--ghost" onClick={discard} disabled={saving}>Discard</button>
        <button type="button" className="ff-prefs-btn ff-prefs-btn--primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  )
}
