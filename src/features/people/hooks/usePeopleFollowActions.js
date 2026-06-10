// usePeopleFollowActions.js — F8.4 settled, honest, duplicate-resistant follow/unfollow + the
// minimum private-beta safety affordance (session-local Hide suggestion). NO relationship state is
// confirmed until the database write succeeds (the same honesty standard as Film File / Home /
// Library). It owns per-target pending/error state, a duplicate-request guard, the settled writes
// (the EXACT existing user_follows INSERT/DELETE payloads + filters — unchanged), the live-region
// message, and the session-local hidden-suggestion set. It does NOT own ranking or candidate
// derivation (the provider keeps the data load); it only flips follow state via `applyFollowState`
// AFTER a write settles.
//
// 23505 (unique_violation) on a follow INSERT means the (follower_id, following_id) row already
// exists — the relationship the user wanted is present — so it is treated as idempotent SUCCESS,
// never a false failure.

import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

// ── pure focus-after-removal (People-local; neutral, kept out of Library to avoid coupling) ──────
// The id to focus after `removedId` leaves `orderedIds`: prefer the NEXT, else PREVIOUS, else null.
export function nextFocusId(orderedIds, removedId) {
  if (!Array.isArray(orderedIds)) return null
  const i = orderedIds.indexOf(removedId)
  if (i === -1) return null
  if (i + 1 < orderedIds.length) return orderedIds[i + 1]
  if (i - 1 >= 0) return orderedIds[i - 1]
  return null
}
// Schedule focus after the DOM settles (double rAF). `getEl` runs at fire time (post-removal DOM);
// never focuses <body> or a non-focusable node. Returns a cancel fn (call on unmount / before re-scheduling).
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

export function usePeopleFollowActions({ userId, followingIds, applyFollowState }) {
  const [pending, setPending] = useState(() => new Set()) // target ids with a write in flight
  const [errored, setErrored] = useState(() => new Set()) // target ids whose last action failed
  const [hidden, setHidden] = useState(() => new Set())   // session-hidden suggestion ids
  const [relStatus, setRelStatus] = useState('')          // live-region text (settlement-driven)

  const inFlight = useRef(new Set())                       // synchronous per-target duplicate guard
  const announceSeq = useRef(0)
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  // Re-announce even identical consecutive messages by toggling a trailing zero-width space, so a
  // repeated follow/failure is still spoken. Never includes raw backend text or percentages.
  const announce = useCallback((msg) => {
    if (!mounted.current) return
    announceSeq.current += 1
    setRelStatus(msg + '​'.repeat(announceSeq.current % 2))
  }, [])

  const mark = useCallback((setter, id, on) => {
    setter(prev => {
      if (on === prev.has(id)) return prev
      const next = new Set(prev)
      if (on) next.add(id); else next.delete(id)
      return next
    })
  }, [])

  const follow = useCallback(async (targetId, name) => {
    if (!userId || !targetId || targetId === userId) return   // self-follow guard (defence in depth)
    if (inFlight.current.has(targetId)) return                // duplicate / overlap guard
    if (followingIds.has(targetId)) return                    // already following — no-op
    inFlight.current.add(targetId)
    mark(setErrored, targetId, false)
    mark(setPending, targetId, true)
    try {
      const { error } = await supabase
        .from('user_follows')
        .insert({ follower_id: userId, following_id: targetId })
      if (error && error.code !== '23505') throw error        // 23505 = already following → success
      if (mounted.current) { applyFollowState(targetId, true); announce(`You're now following ${name || 'this person'}.`) }
    } catch (e) {
      if (import.meta.env?.DEV) console.error('[people.follow]', e)
      if (mounted.current) { mark(setErrored, targetId, true); announce(`Could not follow ${name || 'this person'}. Try again.`) }
    } finally {
      inFlight.current.delete(targetId)
      mark(setPending, targetId, false)
    }
  }, [userId, followingIds, applyFollowState, announce, mark])

  const unfollow = useCallback(async (targetId, name) => {
    if (!userId || !targetId) return
    if (inFlight.current.has(targetId)) return
    if (!followingIds.has(targetId)) return                   // not following — no-op
    inFlight.current.add(targetId)
    mark(setErrored, targetId, false)
    mark(setPending, targetId, true)
    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', targetId)
      if (error) throw error
      if (mounted.current) { applyFollowState(targetId, false); announce(`You stopped following ${name || 'this person'}.`) }
    } catch (e) {
      if (import.meta.env?.DEV) console.error('[people.unfollow]', e)
      if (mounted.current) { mark(setErrored, targetId, true); announce(`Could not unfollow ${name || 'this person'}. Try again.`) }
    } finally {
      inFlight.current.delete(targetId)
      mark(setPending, targetId, false)
    }
  }, [userId, followingIds, applyFollowState, announce, mark])

  // Session-local removal of an unwanted discovery suggestion. NOT a block: it touches no other
  // account, persists nothing, and changes no relationship or similarity value.
  const hideSuggestion = useCallback((targetId) => {
    if (!targetId) return
    mark(setHidden, targetId, true)
    announce('Hidden from your suggestions.')
  }, [announce, mark])

  const isPending = useCallback((id) => pending.has(id), [pending])
  const isErrored = useCallback((id) => errored.has(id), [errored])
  const isHidden = useCallback((id) => hidden.has(id), [hidden])

  return { follow, unfollow, hideSuggestion, isPending, isErrored, isHidden, relStatus, hidden }
}
