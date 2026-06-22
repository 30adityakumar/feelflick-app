// usePeopleFollowActions.js — settled, honest, duplicate-resistant follow/unfollow. NO relationship
// state is confirmed until the database write succeeds. Owns per-target pending/error state, a
// duplicate-request guard, and the settled writes (the EXACT existing user_follows INSERT/DELETE
// payloads + filters — unchanged). It does NOT own ranking, candidate derivation, the live region
// (the provider owns the single announce), or Hide (usePeopleHideActions). It flips follow state via
// `applyFollowState` AFTER a write settles.
//
// 23505 (unique_violation) on a follow INSERT means the (follower_id, following_id) row already
// exists — so it is treated as idempotent SUCCESS, never a false failure.

import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { trackEvent, EVENTS, errorKind } from '@/shared/services/betaEvents'

export function usePeopleFollowActions({ userId, followingIds, applyFollowState, announce }) {
  const [pending, setPending] = useState(() => new Set()) // target ids with a write in flight
  const [errored, setErrored] = useState(() => new Set()) // target ids whose last action failed

  const inFlight = useRef(new Set())                       // synchronous per-target duplicate guard
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  const say = useCallback((msg) => { if (mounted.current) announce?.(msg) }, [announce])

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
      if (mounted.current) { applyFollowState(targetId, true); say(`You're now following ${name || 'this person'}.`) }
      trackEvent(EVENTS.people_follow_succeeded, { surface: 'people' }) // no target id/name
    } catch (e) {
      if (import.meta.env?.DEV) console.error('[people.follow]', e)
      if (mounted.current) { mark(setErrored, targetId, true); say(`Could not follow ${name || 'this person'}. Try again.`) }
      trackEvent(EVENTS.people_follow_failed, { surface: 'people', error_kind: errorKind(e) })
    } finally {
      inFlight.current.delete(targetId)
      mark(setPending, targetId, false)
    }
  }, [userId, followingIds, applyFollowState, say, mark])

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
      if (mounted.current) { applyFollowState(targetId, false); say(`You stopped following ${name || 'this person'}.`) }
      trackEvent(EVENTS.people_unfollow_succeeded, { surface: 'people' })
    } catch (e) {
      if (import.meta.env?.DEV) console.error('[people.unfollow]', e)
      if (mounted.current) { mark(setErrored, targetId, true); say(`Could not unfollow ${name || 'this person'}. Try again.`) }
    } finally {
      inFlight.current.delete(targetId)
      mark(setPending, targetId, false)
    }
  }, [userId, followingIds, applyFollowState, say, mark])

  const isPending = useCallback((id) => pending.has(id), [pending])
  const isErrored = useCallback((id) => errored.has(id), [errored])

  return { follow, unfollow, isPending, isErrored }
}
