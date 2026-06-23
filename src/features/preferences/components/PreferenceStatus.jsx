// src/features/preferences/components/PreferenceStatus.jsx
// The single screen-reader status authority (one polite live region) plus the
// visual conflict banner. The banner is NOT aria-live (announce() already spoke
// it) so nothing is double-announced. On conflict, focus moves to the banner's
// primary action so keyboard users are taken to the required next step.

import { useEffect, useRef } from 'react'
import { usePreferencesData } from '../usePreferencesData'

export default function PreferenceStatus() {
  const { liveMessage, conflict, reloadLatest, keepEditing } = usePreferencesData()
  const reloadRef = useRef(null)
  useEffect(() => { if (conflict) requestAnimationFrame(() => reloadRef.current?.focus()) }, [conflict])
  return (
    <>
      <div className="ff-prefs-sr" role="status" aria-live="polite" aria-atomic="true">{liveMessage}</div>
      {conflict && (
        <div className="ff-prefs-conflict ff-prefs__inner" role="region" aria-label="Save conflict">
          <p>Your preferences changed in another tab or session. Reload the latest version before saving.</p>
          <div className="ff-prefs-conflict__actions">
            <button ref={reloadRef} type="button" className="ff-prefs-btn ff-prefs-btn--primary" onClick={reloadLatest}>Reload latest</button>
            <button type="button" className="ff-prefs-btn ff-prefs-btn--ghost" onClick={keepEditing}>Keep editing</button>
          </div>
        </div>
      )}
    </>
  )
}
