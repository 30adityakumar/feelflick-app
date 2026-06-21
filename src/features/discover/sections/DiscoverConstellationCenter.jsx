// src/features/discover/sections/DiscoverConstellationCenter.jsx
// The centred constellation identity inside the open mood field (prototype-faithful):
// a small "Your constellation" kicker above the expressive blended name. Visible
// flavour only — the LITERAL selected moods remain the source of truth and are
// exposed accessibly via the screen-reader summary + each orb's accessible name.
// Renders nothing until at least one mood is chosen. aria-hidden so it never
// duplicates the real selection state for assistive tech.

import { constellationName } from '../derive'

export default function DiscoverConstellationCenter({ selected = [] }) {
  if (!selected || selected.length === 0) return null
  return (
    <div className="ff-disc-constellation" aria-hidden="true">
      <span className="ff-disc-constellation__kicker">Your constellation</span>
      <span className="ff-disc-constellation__name">{constellationName(selected)}</span>
    </div>
  )
}
