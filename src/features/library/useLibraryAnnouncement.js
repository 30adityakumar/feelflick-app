// src/features/library/useLibraryAnnouncement.js
// F6.3 — one persistent, polite, atomic live region per Library page. The page
// renders a single visually-hidden <div role="status" aria-live="polite"
// aria-atomic="true">{announcement}</div>; `announce(msg)` sets it. Unrelated
// re-renders never change the string (so they never re-announce). No raw errors,
// no counts/match-score noise — callers pass only the settled outcome sentence.

import { useCallback, useState } from 'react'

export function useLibraryAnnouncement() {
  const [announcement, setAnnouncement] = useState('')
  const announce = useCallback((msg) => setAnnouncement(msg || ''), [])
  return { announcement, announce }
}
