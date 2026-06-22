// src/features/people/components/useRailHide.js
// Wires a discovery rail's session-local Hide to deterministic focus recovery: after hiding a card,
// focus the next visible Follow control (else previous, else the rail container). `hide` comes from
// the provider (usePeopleHideActions); visibleIds is the rail's current id order.

import { useCallback, useEffect, useRef } from 'react'
import { nextFocusId, scheduleFocus } from '../hooks/usePeopleHideActions'

export function useRailHide(hide, visibleIds) {
  const containerRef = useRef(null)
  const cancel = useRef(null)
  useEffect(() => () => { cancel.current?.() }, [])
  const onHide = useCallback((id, name) => {
    const nextId = nextFocusId(visibleIds, id)
    hide(id, name)
    cancel.current?.()
    cancel.current = scheduleFocus(() => {
      const c = containerRef.current
      if (!c) return null
      return (nextId && c.querySelector(`[data-follow-target="${nextId}"]`)) || c
    })
  }, [hide, visibleIds])
  return { containerRef, onHide }
}
