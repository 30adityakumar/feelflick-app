// src/features/preferences/components/PreferencesError.jsx
// Critical load failure. One h1, safe copy, Retry + Home. NO editable controls —
// so a failed load can never overwrite real saved preferences.

import { Link } from 'react-router-dom'
import { usePreferencesData } from '../usePreferencesData'

export default function PreferencesError() {
  const { retry } = usePreferencesData()
  return (
    <div className="ff-prefs">
      <div className="ff-prefs__inner">
        <div className="ff-prefs-state">
          <h1>We could not load your preferences.</h1>
          <p>Your existing settings have not been changed. Try again in a moment.</p>
          <div className="ff-prefs-state__actions">
            <button type="button" className="ff-prefs-btn ff-prefs-btn--primary" onClick={retry}>Retry</button>
            <Link to="/home" className="ff-prefs-btn ff-prefs-btn--ghost">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
