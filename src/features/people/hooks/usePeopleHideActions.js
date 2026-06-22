// src/features/people/hooks/usePeopleHideActions.js
// Session-local "Hide suggestion" + truthful Undo. Hide is NOT Block/Mute/Report/Unfollow: it
// touches no other account, persists nothing, performs no DB write, and resets on reload. Undo is
// data-truthful precisely because the action is local — it simply un-hides. One-latest-Hide model:
// a second Hide replaces the actionable Undo target while earlier hidden people stay hidden.
// Announcements go through the provider's single relationship live region (passed in as `announce`).

import { useCallback, useState } from 'react'
import { trackEvent, EVENTS } from '@/shared/services/betaEvents'

// ── pure focus-after-removal (People-local) ──────────────────────────────────────────────────────
// The id to focus after `removedId` leaves `orderedIds`: prefer NEXT, else PREVIOUS, else null.
export function nextFocusId(orderedIds, removedId) {
  if (!Array.isArray(orderedIds)) return null
  const i = orderedIds.indexOf(removedId)
  if (i === -1) return null
  if (i + 1 < orderedIds.length) return orderedIds[i + 1]
  if (i - 1 >= 0) return orderedIds[i - 1]
  return null
}
// Schedule focus after the DOM settles (double rAF). `getEl` runs at fire time; never focuses
// <body> or a non-focusable node. Returns a cancel fn.
export function scheduleFocus(getEl, { raf } = {}) {
  const schedule = raf || ((cb) => requestAnimationFrame(cb))
  let cancelled = false
  schedule(() => schedule(() => {
    if (cancelled) return
    const el = typeof getEl === 'function' ? getEl() : getEl
    const body = typeof document !== 'undefined' ? document.body : null
    if (el && el !== body && typeof el.focus === 'function') el.focus()
  }))
  return () => { cancelled = true }
}

export function usePeopleHideActions({ announce } = {}) {
  const [hidden, setHidden] = useState(() => new Set())
  const [lastHidden, setLastHidden] = useState(null) // { id, name } — the single actionable Undo target

  const hide = useCallback((id, name) => {
    if (!id) return
    setHidden((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
    setLastHidden({ id, name: name || 'this person' })
    announce?.(`Hidden ${name || 'this person'} for this session.`)
    trackEvent(EVENTS.people_hide_suggestion, { surface: 'people' }) // no id/name
  }, [announce])

  const undo = useCallback(() => {
    setLastHidden((cur) => {
      if (!cur) return null
      setHidden((prev) => {
        if (!prev.has(cur.id)) return prev
        const next = new Set(prev)
        next.delete(cur.id)
        return next
      })
      announce?.(`Restored ${cur.name}.`)
      return null
    })
  }, [announce])

  // Clears only the Undo opportunity (toast timeout) — the hidden state stays hidden.
  const clearUndo = useCallback(() => setLastHidden(null), [])

  const isHidden = useCallback((id) => hidden.has(id), [hidden])

  return { hide, undo, clearUndo, isHidden, hidden, lastHidden }
}
