// src/features/discover/hooks/useDiscoverImpressions.js
// Logs each GENUINELY-EXPOSED (film, placement) exactly once per Discover session.
//
// Three stores, three jobs (documented source-of-truth split):
//   • recommendation_impressions (via logSurfaceImpressions) — DAILY impression
//     rows, deduped on (user, movie, placement, shown_date). Source of truth for
//     daily impressions; NOT per-session.
//   • user_interactions (via trackInteraction) — PER-SESSION exposure + outcomes,
//     carrying session_id + direction + placement in metadata. Source of truth
//     for per-session direction exposure and outcomes.
//   • PostHog funnel (via trackEvent) — privacy-safe surface/placement/direction.
//
// Exposure rules:
//   • a (film, placement) is logged once per session (loggedRef), so switching
//     FOCUS among already-exposed films logs nothing new;
//   • a promotion / reserve is a NEW (film, placement) → logged when it appears;
//   • dock cards are logged only when meaningfully visible (IntersectionObserver),
//     so an offscreen mobile Bolder card does not log until scrolled to;
//   • fallback (example) data logs nothing — never classify it as a fresh
//     personalized recommendation.

import { useCallback, useEffect, useRef } from 'react'
import { logSurfaceImpressions } from '@/shared/services/recommendations'
import { trackInteraction } from '@/shared/services/interactions'
import { trackEvent, EVENTS } from '@/shared/services/betaEvents'

export function useDiscoverImpressions({ userId, sessionKey, context }) {
  const ctxRef = useRef(context)
  ctxRef.current = context
  const loggedRef = useRef(new Set())

  // Reset the per-session logged set whenever the session changes.
  useEffect(() => { loggedRef.current = new Set() }, [sessionKey])

  const logExposure = useCallback((film) => {
    if (!film || !userId) return
    const { selected = [], intention, energy, who, isFallback, cName } = ctxRef.current || {}
    if (isFallback) return // example data is never logged as a fresh personalized rec
    const placement = film._placement
    const direction = film._direction
    if (!placement || !direction) return
    const key = `${film.id}:${placement}`
    if (loggedRef.current.has(key)) return
    loggedRef.current.add(key)

    logSurfaceImpressions({
      userId,
      films: [{ id: film.id, engineScore: film.match ?? film._rankScore ?? 0, _pickReasonLabel: `discover_${direction}` }],
      placement,
      pickReasonType: 'discover_reveal',
      pickReasonLabel: cName ? `Discover · ${cName}` : 'Discover',
    }).catch(() => {})

    trackInteraction('impression', {
      movieId: film.id,
      source: 'discover',
      metadata: { action: 'expose', direction, placement, moods: selected, intention, energy, who },
    }).catch(() => {})

    trackEvent(EVENTS.recommendation_shown, { surface: 'discover', placement, direction })
  }, [userId])

  // Ref-callback factory for dock cards: log when the card is meaningfully visible.
  // Where IntersectionObserver is unavailable (tests/SSR), log immediately.
  const observe = useCallback((film) => (el) => {
    if (!el || !film) return
    if (typeof IntersectionObserver === 'undefined') { logExposure(film); return }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && e.intersectionRatio >= 0.5) { logExposure(film); io.disconnect(); break }
      }
    }, { threshold: 0.5 })
    io.observe(el)
  }, [logExposure])

  return { logExposure, observe }
}
