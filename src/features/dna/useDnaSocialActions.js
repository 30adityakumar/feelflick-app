// src/features/dna/useDnaSocialActions.js
// Real, optimistic social-proof actions for /DNA: endorse a taste trait, like a review, save a
// list. Counts are REAL (from get_dna_social_counts / the base tables) — never fabricated. Writes
// are RLS-guarded (endorser/liker/saver = auth.uid()); self-actions are blocked by RLS + here.
// Optimistic with rollback on failure. Until the social migrations are deployed the writes fail
// gracefully (caught) and counts stay at 0.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { trackEvent, EVENTS } from '@/shared/services/betaEvents'

const toMap = (arr, key) => new Map((arr || []).map((r) => [r[key], { count: r.count || 0, mine: !!r.mine }]))

export function useDnaSocialActions({ targetId, viewerId, isOwner, initial }) {
  const [endorse, setEndorse] = useState(() => toMap(initial?.endorsements, 'trait'))
  const [likes, setLikes] = useState(() => toMap(initial?.reviewLikes, 'movie_id'))
  const [saves, setSaves] = useState(() => toMap(initial?.listSaves, 'list_id'))
  const pendingRef = useRef(new Set())

  // Re-sync when the loaded model changes identity/counts.
  useEffect(() => { setEndorse(toMap(initial?.endorsements, 'trait')) }, [initial?.endorsements])
  useEffect(() => { setLikes(toMap(initial?.reviewLikes, 'movie_id')) }, [initial?.reviewLikes])
  useEffect(() => { setSaves(toMap(initial?.listSaves, 'list_id')) }, [initial?.listSaves])

  // Generic optimistic toggle. `write(add)` performs the DB insert/delete; on failure we roll back.
  const toggle = useCallback(async (map, setMap, key, guard, write, onEvent) => {
    if (isOwner || !viewerId || !targetId) return // owner can't self-act
    if (pendingRef.current.has(guard)) return
    pendingRef.current.add(guard)
    const prev = map.get(key) || { count: 0, mine: false }
    const add = !prev.mine
    const next = new Map(map)
    next.set(key, { count: Math.max(0, prev.count + (add ? 1 : -1)), mine: add })
    setMap(next)
    try {
      const { error } = await write(add)
      if (error && error.code !== '23505') throw error // 23505 = already exists → idempotent add
      if (add) onEvent?.()
    } catch {
      const rollback = new Map(next)
      rollback.set(key, prev)
      setMap(rollback)
    } finally {
      pendingRef.current.delete(guard)
    }
  }, [isOwner, viewerId, targetId])

  const toggleEndorse = useCallback((trait) => toggle(
    endorse, setEndorse, trait, `e:${trait}`,
    (add) => add
      ? supabase.from('dna_endorsements').insert({ endorser_id: viewerId, target_id: targetId, trait })
      : supabase.from('dna_endorsements').delete().eq('endorser_id', viewerId).eq('target_id', targetId).eq('trait', trait),
    () => trackEvent(EVENTS.dna_profile_endorsed),
  ), [toggle, endorse, viewerId, targetId])

  const toggleReviewLike = useCallback((movieId) => toggle(
    likes, setLikes, movieId, `l:${movieId}`,
    (add) => add
      ? supabase.from('review_likes').insert({ user_id: viewerId, review_owner_id: targetId, movie_id: movieId })
      : supabase.from('review_likes').delete().eq('user_id', viewerId).eq('review_owner_id', targetId).eq('movie_id', movieId),
    () => trackEvent(EVENTS.dna_profile_review_liked),
  ), [toggle, likes, viewerId, targetId])

  const toggleListSave = useCallback((listId) => toggle(
    saves, setSaves, listId, `s:${listId}`,
    (add) => add
      ? supabase.from('user_list_follows').insert({ user_id: viewerId, list_id: listId })
      : supabase.from('user_list_follows').delete().eq('user_id', viewerId).eq('list_id', listId),
    () => trackEvent(EVENTS.dna_profile_list_saved),
  ), [toggle, saves, viewerId])

  const totals = useMemo(() => {
    const sum = (m) => [...m.values()].reduce((s, v) => s + (v.count || 0), 0)
    return { endorsementsReceived: sum(endorse), reviewLikesReceived: sum(likes), listSavesReceived: sum(saves) }
  }, [endorse, likes, saves])

  return {
    endorseFor: (trait) => endorse.get(trait) || { count: 0, mine: false },
    likeFor: (movieId) => likes.get(movieId) || { count: 0, mine: false },
    saveFor: (listId) => saves.get(listId) || { count: 0, mine: false },
    toggleEndorse, toggleReviewLike, toggleListSave, totals, canAct: !isOwner && !!viewerId,
  }
}
