// src/features/discover/hooks/useDiscoverSession.js
// Thin React wrapper over the pure discoverSession state machine. Owns the live
// session state, re-initialises a fresh session when the inputs change
// (`sessionKey`), and exposes role/focus/remove handlers. All semantics live in
// discoverSession.js (pure + unit-tested); this hook only bridges to React.

import { useCallback, useEffect, useRef, useState } from 'react'
import { initSession, dismiss, setFocus, focusedFilm, roleOf, visibleFilms } from '../discoverSession'

export function useDiscoverSession({ ranked, selected, profile, allowAlternates = true, sessionKey }) {
  // Latest context for the handlers (dismiss needs the current ranked pool).
  const ctxRef = useRef(null)
  ctxRef.current = { ranked, selected, profile, allowAlternates }

  const [state, setState] = useState(() => initSession(ctxRef.current))

  // A changed sessionKey (new moods/context → new ranked pool) starts a fresh
  // bounded session: dismissed/exposed sets reset, roles recompute.
  const firstKey = useRef(sessionKey)
  useEffect(() => {
    if (firstKey.current === sessionKey) { firstKey.current = Symbol('seen'); return }
    setState(initSession(ctxRef.current))
  }, [sessionKey])

  const remove = useCallback((filmId) => setState((s) => dismiss(s, filmId, ctxRef.current)), [])
  const focus = useCallback((filmId) => setState((s) => setFocus(s, filmId)), [])

  return {
    roles: state.roles,
    focusId: state.focusId,
    focused: focusedFilm(state),
    exhaustion: state.exhaustion,
    visible: visibleFilms(state.roles),
    exposedCount: state.exposedIds.size,
    roleOf: (id) => roleOf(state, id),
    remove,
    focus,
  }
}
