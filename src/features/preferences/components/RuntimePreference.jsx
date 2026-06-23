// src/features/preferences/components/RuntimePreference.jsx
// Soft runtime range. Honest copy ("may rank lower on supported surfaces").

import { usePreferencesData } from '../usePreferencesData'
import { RUNTIME_MIN, RUNTIME_MAX } from '../data'

export default function RuntimePreference() {
  const { draft, setRuntimeFloor, setRuntimeCap } = usePreferencesData()
  return (
    <fieldset className="ff-prefs-field" style={{ border: 'none', margin: 0, padding: 0 }}>
      <legend className="ff-prefs-subhead" style={{ padding: 0 }}>Runtime range</legend>
      <div className="ff-prefs-runtime">
        <div>
          <div className="ff-prefs-runtime__value">{draft.runtimeFloor}–{draft.runtimeCap}<span>minutes</span></div>
          <div className="ff-prefs-runtime__sliders">
            <label className="ff-prefs-runtime__lab" htmlFor="pf-rt-floor">Shortest</label>
            <input
              id="pf-rt-floor" type="range" min={RUNTIME_MIN} max={RUNTIME_MAX} value={draft.runtimeFloor}
              onChange={(e) => setRuntimeFloor(+e.target.value)}
              aria-valuetext={`Shortest ${draft.runtimeFloor} minutes`}
            />
            <label className="ff-prefs-runtime__lab" htmlFor="pf-rt-cap" style={{ marginTop: 4 }}>Longest</label>
            <input
              id="pf-rt-cap" type="range" min={RUNTIME_MIN} max={RUNTIME_MAX} value={draft.runtimeCap}
              onChange={(e) => setRuntimeCap(+e.target.value)}
              aria-valuetext={`Longest ${draft.runtimeCap} minutes`}
            />
          </div>
        </div>
        <div>
          <p className="ff-prefs-subhead">What this does</p>
          <p className="ff-prefs-runtime__band">Films outside this range remain eligible but may rank lower on supported recommendation surfaces.</p>
        </div>
      </div>
    </fieldset>
  )
}
