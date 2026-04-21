// src/shared/hooks/useHomepageRows.js
/**
 * Single hook that fetches all homepage row data based on user tier.
 * Handles day-hash rotation for the critics/peoples-champions row.
 *
 * @module useHomepageRows
 */

import { useEffect, useMemo, useState } from 'react'

import { useUserTier } from '@/shared/hooks/useRecommendations'
import { computeUserProfileV3 } from '@/shared/services/recommendations'
import { precomputeScoringContext } from '@/shared/services/scoring-v3'
import { softDedupe } from '@/shared/services/diversity'
import {
  getTopOfYourTasteRow,
  getCriticsSwoonedRow,
  getPeoplesChampionsRow,
  getUnder90MinutesRow,
  getStillInOrbitRow,
  getMoodRow,
  getWatchlistRow,
  getSignatureDirectorRow,
} from '@/shared/services/homepage-rows'

// ── Rotation helpers ─────────────────────────────────────────────────────────

/**
 * Simple numeric hash of a string.
 * @param {string} str
 * @returns {number}
 */
function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/**
 * Day-of-year (0-365).
 * @returns {number}
 */
function dayOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now - start) / 86_400_000)
}

// ── Generic async row hook ───────────────────────────────────────────────────

/**
 * Minimal useEffect-based fetch for a single row.
 * @param {string} key - unique query key (for dedup/cancel)
 * @param {() => Promise<any>} fetchFn
 * @param {boolean} enabled
 * @returns {{ data: any, loading: boolean, error: Error|null }}
 */
function useRowQuery(key, fetchFn, enabled) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled) {
      setData(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchFn()
      .then(result => {
        if (!cancelled) setData(result)
      })
      .catch(err => {
        if (!cancelled) {
          console.error(`[useHomepageRows:${key}]`, err)
          setError(err)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled])

  return { data, loading, error }
}

// ── Main hook ────────────────────────────────────────────────────────────────

/**
 * Returns all homepage row data, tiered by user maturity.
 *
 * @param {string|null} userId
 * @returns {{
 *   tier: 'cold'|'warming'|'engaged'|null,
 *   rotationVariant: 'A'|'B',
 *   topOfTaste: { data: Object[]|null, loading: boolean, error: Error|null },
 *   criticSplit: { data: Object[]|null, loading: boolean, error: Error|null },
 *   under90: { data: Object[]|null, loading: boolean, error: Error|null },
 *   orbit: { data: { films: Object[], seed: Object|null }|null, loading: boolean, error: Error|null },
 *   mood: { data: { films: Object[], dominantMood: string|null }|null, loading: boolean, error: Error|null },
 *   watchlist: { data: { films: Object[] }|null, loading: boolean, error: Error|null },
 *   director: { data: { films: Object[], director: string|null }|null, loading: boolean, error: Error|null },
 * }}
 */
export function useHomepageRows(userId) {
  const { tier } = useUserTier({ userId })

  // Rotation: hash userId + day-of-year → A or B
  const rotationVariant = useMemo(() => {
    if (!userId) return 'A'
    return (simpleHash(userId) + dayOfYear()) % 2 === 0 ? 'A' : 'B'
  }, [userId])

  // Shared profile + scoring context — resolved once, passed to all service functions
  const [profile, setProfile] = useState(null)
  const [scoringContext, setScoringContext] = useState(null)

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setScoringContext(null)
      return
    }

    let cancelled = false
    computeUserProfileV3(userId).then(async (p) => {
      if (cancelled) return
      setProfile(p)
      const ctx = await precomputeScoringContext(p)
      if (!cancelled) setScoringContext(ctx)
    })
    return () => { cancelled = true }
  }, [userId])

  const hasProfile = profile !== null
  const hasContext = scoringContext !== null
  const profileKey = userId ? `${userId}-${hasProfile}-${hasContext}` : 'guest'
  const rowOpts = hasContext ? { scoringContext } : {}

  // === Row queries ===

  const topOfTaste = useRowQuery(
    `top-of-taste-${profileKey}`,
    () => getTopOfYourTasteRow(userId, profile, 20, rowOpts),
    (hasProfile && hasContext) || !userId,
  )

  const criticSplit = useRowQuery(
    `critic-split-${profileKey}-${rotationVariant}-${tier}`,
    () => {
      if (tier === 'engaged' && rotationVariant === 'B') {
        return getPeoplesChampionsRow(userId, profile, 20, rowOpts)
      }
      return getCriticsSwoonedRow(userId, profile, 20, rowOpts)
    },
    (hasProfile && hasContext || !userId) && tier !== null,
  )

  const under90 = useRowQuery(
    `under-90-${profileKey}`,
    () => getUnder90MinutesRow(userId, profile, 20, rowOpts),
    (hasProfile && hasContext) || !userId,
  )

  const orbit = useRowQuery(
    `orbit-${profileKey}`,
    () => getStillInOrbitRow(userId, profile, 20, rowOpts),
    hasProfile && hasContext && tier !== 'cold',
  )

  const mood = useRowQuery(
    `mood-${profileKey}`,
    () => getMoodRow(userId, profile, 20, rowOpts),
    hasProfile && hasContext && tier !== 'cold',
  )

  const watchlist = useRowQuery(
    `watchlist-${profileKey}`,
    () => getWatchlistRow(userId, profile, 20, rowOpts),
    hasProfile && hasContext && tier === 'engaged',
  )

  const director = useRowQuery(
    `director-${profileKey}`,
    () => getSignatureDirectorRow(userId, profile, 20, rowOpts),
    hasProfile && hasContext && tier !== 'cold',
  )

  // === Cross-row soft dedup ===
  // Apply in row priority order. Hero films are exempt from contributing.
  // Watchlist is exempt from dedup (user-chosen).
  const deduped = useMemo(() => {
    const shownIds = new Set()

    function dedupFilms(films) {
      if (!films || films.length === 0) return films
      const result = softDedupe(films, shownIds)
      result.forEach(f => { if (f?.id) shownIds.add(f.id) })
      return result
    }

    // Row order: TopOfTaste → Director → CriticSplit → Mood → Orbit → Under90 → Watchlist
    const dTopOfTaste = topOfTaste.data
      ? { ...topOfTaste.data, films: dedupFilms(topOfTaste.data.films) }
      : topOfTaste.data
    const dDirector = director.data
      ? { ...director.data, films: dedupFilms(director.data.films) }
      : director.data
    const dCriticSplit = dedupFilms(criticSplit.data)
    const dMood = mood.data
      ? { ...mood.data, films: dedupFilms(mood.data.films) }
      : mood.data
    const dOrbit = orbit.data
      ? { ...orbit.data, films: dedupFilms(orbit.data.films) }
      : orbit.data
    const dUnder90 = dedupFilms(under90.data)
    // Watchlist exempt — no dedup
    const dWatchlist = watchlist.data

    return { dTopOfTaste, dDirector, dCriticSplit, dMood, dOrbit, dUnder90, dWatchlist }
  }, [topOfTaste.data, director.data, criticSplit.data, mood.data, orbit.data, under90.data, watchlist.data])

  return {
    tier,
    rotationVariant,
    topOfTaste: { ...topOfTaste, data: deduped.dTopOfTaste },
    criticSplit: { ...criticSplit, data: deduped.dCriticSplit },
    under90: { ...under90, data: deduped.dUnder90 },
    orbit: { ...orbit, data: deduped.dOrbit },
    mood: { ...mood, data: deduped.dMood },
    watchlist: { ...watchlist, data: deduped.dWatchlist },
    director: { ...director, data: deduped.dDirector },
  }
}
