// src/features/discover/sections/DiscoverReason.jsx
// Up to two layers of explanation. The MOMENT-FIT line is always visible (on
// every viewport, including mobile). A deeper PERSONAL line — only when a real
// user-specific signal exists — sits behind an accessible "Why this film?"
// disclosure. When no personal signal exists, the disclosure is omitted entirely
// (never a generic substitute).

import { useId, useState } from 'react'

export default function DiscoverReason({ momentFit, personal }) {
  const [open, setOpen] = useState(false)
  const regionId = useId()
  if (!momentFit && !personal) return null
  return (
    <div className="ff-disc-reason">
      <p className="ff-disc-reason__label">Why this film</p>
      {momentFit ? <p className="ff-disc-reason__moment">{momentFit}</p> : null}
      {personal ? (
        <div className="ff-disc-reason__personal">
          <button
            type="button"
            className="ff-disc-reason__toggle"
            aria-expanded={open}
            aria-controls={regionId}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Hide the personal read' : 'Why this film for you?'}
          </button>
          <p id={regionId} className="ff-disc-reason__line" hidden={!open}>{personal}</p>
        </div>
      ) : null}
    </div>
  )
}
