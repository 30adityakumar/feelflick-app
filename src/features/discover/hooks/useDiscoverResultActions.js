// src/features/discover/hooks/useDiscoverResultActions.js
// Result-stage write/action handlers. Every action targets the currently FOCUSED
// film and carries its exact attribution context — direction + placement — so an
// outcome can never be mis-credited to another direction, session, or surface.
//
// Attribution (release-blocking): updateImpression is called WITH the focused
// film's placement, constraining the flag update to that exact impression row
// (see recommendations.js). trackInteraction additionally records direction +
// placement in user_interactions (session-aware, the per-session source of truth).
//
// Fallback honesty: when the result is example (fallback) data we perform NO
// recommendation-impression/outcome writes and NO watchlist/history writes (the
// example ids are not guaranteed real catalogue rows) — only the real-tmdbId
// Film File navigation + trailer remain. The result stage hides save/watched/skip
// in fallback; these guards are belt-and-braces.

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { updateImpression } from '@/shared/services/recommendations'
import { trackInteraction } from '@/shared/services/interactions'
import { trackEvent, EVENTS, errorKind } from '@/shared/services/betaEvents'

export function useDiscoverResultActions({ focused, user, selected, intention, energy, who, onRemove, navigate, isFallback = false }) {
  const [savedState, setSavedState] = useState('idle')   // idle | saving | saved | error
  const [watchedState, setWatchedState] = useState('idle') // idle | saving | watched | error
  const focusedId = focused?.id
  // Reset per-film confirmation state when focus/lead changes.
  useEffect(() => { setSavedState('idle'); setWatchedState('idle') }, [focusedId])

  // Shared interaction context — direction + placement + the Stage-2 context so the
  // engine learns from positive AND negative actions with full attribution.
  const interactionContext = (action) => ({
    movieId: focused?.id,
    source: 'discover',
    metadata: { action, direction: focused?._direction, placement: focused?._placement, moods: selected, intention, energy, who },
  })
  const placementMeta = { placement: focused?._placement }

  const handleSeeMore = () => {
    if (!focused?.tmdbId) return
    if (!isFallback && user?.id && focused?.id) {
      updateImpression(user.id, focused.id, 'clicked', placementMeta).catch(() => {})
      trackInteraction('click', interactionContext('see_more')).catch(() => {})
      trackEvent(EVENTS.recommendation_opened, { surface: 'discover', movie_id: focused.id, placement: focused._placement, direction: focused._direction })
    }
    navigate(`/movie/${focused.tmdbId}`)
  }

  const handleSaveForLater = async () => {
    if (isFallback || !user?.id || !focused?.id || savedState !== 'idle') return
    const filmId = focused.id
    setSavedState('saving')
    try {
      const { error } = await supabase.from('user_watchlist').insert({ user_id: user.id, movie_id: filmId })
      if (error && error.code !== '23505') throw error // 23505 = already in list
      setSavedState('saved')
      updateImpression(user.id, filmId, 'saved', placementMeta).catch(() => {})
      trackInteraction('save', interactionContext('save_for_later')).catch(() => {})
      trackEvent(EVENTS.recommendation_saved, { surface: 'discover', movie_id: filmId, placement: focused._placement, direction: focused._direction })
    } catch (e) {
      console.error('[Discover.saveForLater]', e)
      setSavedState('error')
      trackEvent(EVENTS.recommendation_error, { surface: 'discover', source: 'save', error_kind: errorKind(e) })
    }
  }

  // Not tonight — record the skip against the focused film + direction, then ask
  // the session to remove it (promote / refill happens in the session machine).
  const handleSkip = () => {
    if (!focused?.id) return
    if (!isFallback && user?.id) {
      trackInteraction('dismiss', interactionContext('not_tonight')).catch(() => {})
      updateImpression(user.id, focused.id, 'skipped', placementMeta).catch(() => {})
    }
    onRemove?.(focused.id)
  }

  const markWatchedTimeoutRef = useRef(null)
  useEffect(() => () => { if (markWatchedTimeoutRef.current) clearTimeout(markWatchedTimeoutRef.current) }, [])
  const handleMarkWatched = async () => {
    if (isFallback || !focused?.id || !user?.id || watchedState === 'saving' || watchedState === 'watched') return
    const filmId = focused.id
    setWatchedState('saving')
    try {
      const { error } = await supabase.from('user_history').insert({ user_id: user.id, movie_id: filmId, source: 'discover_marked', watched_at: new Date().toISOString() })
      if (error && error.code !== '23505') throw error
    } catch (e) {
      console.error('[Discover.markWatched]', e)
      setWatchedState('error')
      return
    }
    setWatchedState('watched')
    updateImpression(user.id, filmId, 'watched', placementMeta).catch(() => {})
    trackInteraction('watch', interactionContext('mark_watched')).catch(() => {})
    markWatchedTimeoutRef.current = setTimeout(() => {
      onRemove?.(filmId)
      markWatchedTimeoutRef.current = null
    }, 600)
  }

  return { savedState, watchedState, handleSeeMore, handleSaveForLater, handleMarkWatched, handleSkip }
}
