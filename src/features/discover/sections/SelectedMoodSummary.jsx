// src/features/discover/sections/SelectedMoodSummary.jsx
// Accessible (screen-reader-only) summary of the chosen moods + the named
// constellation. The visible composition stays open and restrained (the prototype
// has no summary-card grid); every mood's DESCRIPTION still lives here as real text
// (works on desktop AND mobile, not title-only) so assistive tech announces the
// literal selection alongside the constellation orbs' accessible names. The visible
// constellation identity is rendered by DiscoverConstellationCenter. Renders a
// minimal prompt before any mood is chosen.

import { constellationName } from '../derive'

export default function SelectedMoodSummary({ selected, moods }) {
  if (!selected || selected.length === 0) {
    return <p className="ff-disc-mood-summary">Pick at least one mood to begin.</p>
  }
  const chosen = selected.map((id) => moods.find((m) => m.id === id)).filter(Boolean)
  const name = constellationName(selected)
  return (
    <div className="ff-disc-mood-summary">
      <p>Your constellation: {name}.</p>
      <dl>
        {chosen.map((m) => (
          <div key={m.id}>
            <dt>{m.label}</dt>
            <dd>{m.hint}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
