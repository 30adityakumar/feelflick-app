// src/features/people/components/PeopleStatus.jsx
// Visual Hide/Undo toast (above the mobile BottomNav). The settled message is already spoken through
// the page's single relationship live region (announce), so this toast is NOT a second live region —
// its text is aria-hidden and only the Undo button is interactive. One-latest-Hide: the toast tracks
// the most recent Hide; a timeout clears only the Undo opportunity, never the hidden state.

import { useEffect, useRef, useState } from 'react'
import { usePeopleData } from '../usePeopleData'

const UNDO_MS = 6000

export default function PeopleStatus() {
  const { lastHidden, undo, clearUndo } = usePeopleData()
  const [shown, setShown] = useState(null)
  const timer = useRef(null)

  useEffect(() => {
    if (lastHidden) {
      setShown(lastHidden)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => { setShown(null); clearUndo() }, UNDO_MS)
    } else {
      setShown(null)
    }
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [lastHidden, clearUndo])

  if (!shown) return null
  return (
    <div className="ff-people-toast-wrap">
      <div className="ff-people-toast">
        <span aria-hidden="true">Hidden {shown.name} for this session.</span>
        <button type="button" className="ff-people-toast__undo" aria-label={`Undo hiding ${shown.name}`} onClick={() => { setShown(null); undo() }}>Undo</button>
      </div>
    </div>
  )
}
