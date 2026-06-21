// src/features/discover/sections/SelectedMoodSummary.jsx
// Accessible summary of the chosen moods + the named constellation. This is where
// every mood's DESCRIPTION lives accessibly on BOTH desktop and mobile (the orbs
// no longer depend on a `title` tooltip). Renders nothing until a mood is chosen.

import { constellationName } from '../derive'

export default function SelectedMoodSummary({ selected, moods }) {
  if (!selected || selected.length === 0) {
    return <p className="ff-disc-mood-summary__empty">Pick at least one mood to begin.</p>
  }
  const chosen = selected.map((id) => moods.find((m) => m.id === id)).filter(Boolean)
  const name = constellationName(selected)
  return (
    <div className="ff-disc-mood-summary">
      <div className="ff-disc-mood-summary__name">
        <span className="ff-disc-mood-summary__kicker">Your constellation</span>
        <span className="ff-disc-mood-summary__title">{name}</span>
      </div>
      <dl className="ff-disc-mood-summary__list">
        {chosen.map((m) => (
          <div key={m.id} className="ff-disc-mood-summary__item">
            <dt><span className="ff-disc-mood-summary__swatch" aria-hidden="true" style={{ background: m.hex }} /> {m.label}</dt>
            <dd>{m.hint}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
