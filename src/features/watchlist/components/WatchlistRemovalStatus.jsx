// src/features/watchlist/components/WatchlistRemovalStatus.jsx
// The single removal-feedback authority: one persistent polite/atomic live region that is ALSO the
// visible toast (so there is never a duplicate announcement). It carries no Undo, never steals
// focus (status role, no focusable children), and sits above the BottomNav (see watchlist.css).
// Visible for a few seconds, then fades; the text remains for assistive tech.

import { useEffect, useState } from 'react'

export default function WatchlistRemovalStatus({ message }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (!message) { setShown(false); return undefined }
    setShown(true)
    const id = setTimeout(() => setShown(false), 5000)
    return () => clearTimeout(id)
  }, [message])
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className={`ff-wl-toast${shown ? ' ff-wl-toast--show' : ''}`}>
      {message ? <span className="ff-wl-toast__text">{message}</span> : null}
    </div>
  )
}
