// src/features/preferences/components/StreamingComingSoon.jsx
// Disabled "coming soon" panel — no active selections. Previously stored
// subscription data is preserved untouched server-side (we never write it here).

import { usePreferencesData } from '../usePreferencesData'

export default function StreamingComingSoon() {
  const { catalogs } = usePreferencesData()
  return (
    <div>
      <p className="ff-prefs-saved-note">
        Streaming preferences are coming later. FeelFlick does not yet have reliable regional provider data for recommendation filtering.
      </p>
      <div className="ff-prefs-streamers" aria-hidden="true">
        {catalogs.STREAMERS.map((s) => (
          <div key={s.id} className="ff-prefs-streamer"><span className="ff-prefs-streamer__dot" /><span className="ff-prefs-streamer__name">{s.name}</span></div>
        ))}
      </div>
    </div>
  )
}
