// src/features/preferences/components/BoundaryPreferences.jsx
// Boolean content boundaries, grouped by their ACTUAL engine behaviour. Real
// switch semantics + 44×44 targets. No "never show" guarantee.

import { usePreferencesData } from '../usePreferencesData'

function BoundaryRow({ b, on, onToggle }) {
  const descId = `pf-boundary-${b.id}-desc`
  return (
    <div className="ff-prefs-boundary">
      <div>
        <div className="ff-prefs-boundary__name">{b.label}</div>
        <div className="ff-prefs-boundary__desc" id={descId}>{b.desc}</div>
      </div>
      <button
        type="button" role="switch" aria-checked={on} aria-label={b.label} aria-describedby={descId}
        className="ff-prefs-switch" onClick={() => onToggle(b.id)}
      >
        <span className="ff-prefs-switch__track" aria-hidden="true"><span className="ff-prefs-switch__knob" /></span>
      </button>
    </div>
  )
}

export default function BoundaryPreferences() {
  const { draft, toggleBoundary, catalogs } = usePreferencesData()
  const exclude = catalogs.BOUNDARIES.filter((b) => b.effect === 'exclude')
  const caution = catalogs.BOUNDARIES.filter((b) => b.effect === 'caution')
  return (
    <div>
      <p className="ff-prefs-subhead">Exclude on supported surfaces when identified</p>
      {exclude.map((b) => <BoundaryRow key={b.id} b={b} on={!!draft.boundaries[b.id]} onToggle={toggleBoundary} />)}
      <p className="ff-prefs-subhead">Use as caution signals where supported</p>
      {caution.map((b) => <BoundaryRow key={b.id} b={b} on={!!draft.boundaries[b.id]} onToggle={toggleBoundary} />)}
      <p className="ff-prefs-note">We exclude or flag titles only when our data identifies them; coverage is not complete.</p>
    </div>
  )
}
