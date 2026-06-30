// src/features/home/components/HomeSectionInfo.jsx
// The small "info" toggle in a recommendation-row heading that reveals a grounded
// "how was this determined" note. Controlled by the owning section so the note
// can render as a full-width block beneath the heading (not inline in the title
// row). Keyboard + SR accessible: exposes aria-expanded + aria-controls.

import { Info } from 'lucide-react'

export default function HomeSectionInfo({ open, onToggle, controlsId, label }) {
  return (
    <button
      type="button"
      className="ff-hsection__info"
      aria-expanded={open}
      aria-controls={controlsId}
      aria-label={label || 'How these picks were determined'}
      title={label || 'How these picks were determined'}
      onClick={onToggle}
    >
      <Info className="h-[11px] w-[11px]" aria-hidden="true" />
    </button>
  )
}
