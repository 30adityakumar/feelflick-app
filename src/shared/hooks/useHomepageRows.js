// src/shared/hooks/useHomepageRows.js
/**
 * Single hook that fetches all homepage row data based on user tier.
 * Handles day-hash rotation for the critics/peoples-champions row.
 *
 * @module useHomepageRows
 */

import { useEffect, useMemo, useState } from 'react'

import { useUserTier } from '@/shared/hooks/useRecommendations'
import { computeUserProfile } from '@/shared/services/recommendations'
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

  // Shared profile — resolved once, passed to all service functions
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      return
    }

    let cancelled = false
    computeUserProfile(userId).then(p => {
      if (!cancelled) setProfile(p)
    })
    return () => { cancelled = true }
  }, [userId])

  const hasProfile = profile !== null
  const profileKey = userId ? `${userId}-${hasProfile}` : 'guest'

  // === Row queries ===

  const topOfTaste = useRowQuery(
    `top-of-taste-${profileKey}`,
    () => getTopOfYourTasteRow(userId, profile),
    hasProfile || !userId,
  )

  const criticSplit = useRowQuery(
    `critic-split-${profileKey}-${rotationVariant}-${tier}`,
    () => {
      if (tier === 'engaged' && rotationVariant === 'B') {
        return getPeoplesChampionsRow(userId, profile)
      }
      return getCriticsSwoonedRow(userId, profile)
    },
    (hasProfile || !userId) && tier !== null,
  )

  const under90 = useRowQuery(
    `under-90-${profileKey}`,
    () => getUnder90MinutesRow(userId, profile),
    hasProfile || !userId,
  )

  const orbit = useRowQuery(
    `orbit-${profileKey}`,
    () => getStillInOrbitRow(userId, profile),
    hasProfile && tier !== 'cold',
  )

  const mood = useRowQuery(
    `mood-${profileKey}`,
    () => getMoodRow(userId, profile),
    hasProfile && tier !== 'cold',
  )

  const watchlist = useRowQuery(
    `watchlist-${profileKey}`,
    () => getWatchlistRow(userId, profile),
    hasProfile && tier === 'engaged',
  )

  const director = useRowQuery(
    `director-${profileKey}`,
    () => getSignatureDirectorRow(userId, profile),
    hasProfile && tier !== 'cold',
  )

  return {
    tier,
    rotationVariant,
    topOfTaste,
    criticSplit,
    under90,
    orbit,
    mood,
    watchlist,
    director,
  }
}
