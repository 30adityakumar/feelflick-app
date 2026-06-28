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
import { precomputeScoringContext } from '@/shared/services/scoringV3'
import {
  getTopOfYourTasteRow,
  getStillInOrbitRow,
  getMoodRow,
  getHiddenGemsRow,
  getTopGenreRow,
  getSignatureTonesRow,
} from '@/shared/services/homepageRows'

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
 *   topOfTaste: { data: { films: Object[], subtitle: string|null }|null, loading, error },
 *   hiddenGems: { data: { films: Object[] }|null, loading, error },
 *   orbit: { data: { films: Object[], seed: Object|null }|null, loading, error },
 *   mood: { data: { films: Object[], title, subtitle }|null, loading, error },
 *   topGenre: { data: { films: Object[], genre: { id, name }|null }|null, loading, error },
 *   signatureTones: { data: { films: Object[], tones: string[] }|null, loading, error },
 * }}
 */
export function useHomepageRows(userId, shuffleNonces = {}) {
  const { tier } = useUserTier({ userId })

  // Rotation: hash userId + day-of-year → A or B
  const rotationVariant = useMemo(() => {
    if (!userId) return 'A'
    return (simpleHash(userId) + dayOfYear()) % 2 === 0 ? 'A' : 'B'
  }, [userId])

  // Shared profile + scoring context — resolved once, passed to all service functions
  const [profile, setProfile] = useState(null)
  const [scoringContext, setScoringContext] = useState(null)
  // Surfaced so consumers can render an honest top-level error instead of a stuck
  // skeleton (or a misleading "no recommendations") when the profile/context that
  // every row depends on cannot be built.
  const [profileError, setProfileError] = useState(false)

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setScoringContext(null)
      setProfileError(false)
      return
    }

    let cancelled = false
    setProfileError(false)
    computeUserProfileV3(userId)
      .then(async (p) => {
        if (cancelled) return
        setProfile(p)
        const ctx = await precomputeScoringContext(p)
        if (!cancelled) setScoringContext(ctx)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('[useHomepageRows] profile/context build failed:', err)
        setProfileError(true)
      })
    return () => { cancelled = true }
  }, [userId])

  const hasProfile = profile !== null
  const hasContext = scoringContext !== null
  const profileKey = userId ? `${userId}-${hasProfile}-${hasContext}` : 'guest'

  // Per-surface nonces (default 0) — incrementing busts cache + rotates pool
  const nTopOfTaste = shuffleNonces.topOfTaste ?? 0
  const nMood = shuffleNonces.mood ?? 0
  const nOrbit = shuffleNonces.orbit ?? 0
  const nHiddenGems = shuffleNonces.hiddenGems ?? 0
  const nTopGenre = shuffleNonces.topGenre ?? 0
  const nSignatureTones = shuffleNonces.signatureTones ?? 0

  // === Row queries ===

  const topOfTaste = useRowQuery(
    `top-of-taste-${profileKey}-${nTopOfTaste}`,
    () => getTopOfYourTasteRow(userId, profile, 20, { ...(hasContext ? { scoringContext } : {}), nonce: nTopOfTaste }),
    (hasProfile && hasContext) || !userId,
  )


  const orbit = useRowQuery(
    `orbit-${profileKey}-${nOrbit}`,
    () => getStillInOrbitRow(userId, profile, 20, { ...(hasContext ? { scoringContext } : {}), nonce: nOrbit }),
    hasProfile && hasContext,
  )

  const mood = useRowQuery(
    `mood-${profileKey}-${nMood}`,
    () => getMoodRow(userId, profile, 20, { ...(hasContext ? { scoringContext } : {}), nonce: nMood }),
    hasProfile && hasContext,
  )

  const hiddenGems = useRowQuery(
    `hidden-gems-${profileKey}-${nHiddenGems}`,
    () => getHiddenGemsRow(userId, profile, 20, { ...(hasContext ? { scoringContext } : {}), nonce: nHiddenGems }),
    (hasProfile && hasContext) || !userId,
  )

  const topGenre = useRowQuery(
    `top-genre-${profileKey}-${nTopGenre}`,
    () => getTopGenreRow(userId, profile, 20, { ...(hasContext ? { scoringContext } : {}), nonce: nTopGenre }),
    (hasProfile && hasContext) || !userId,
  )

  const signatureTones = useRowQuery(
    `signature-tones-${profileKey}-${nSignatureTones}`,
    () => getSignatureTonesRow(userId, profile, 20, { ...(hasContext ? { scoringContext } : {}), nonce: nSignatureTones }),
    hasProfile && hasContext,
  )

  // === Cross-row soft dedup ===
  // Apply in render priority order so each row claims its films before the next.
  // Hero films are exempt from contributing (deduped against in Home). Hidden gems
  // is low-exposure and rarely collides, so it sits last.
  const deduped = useMemo(() => {
    const shownIds = new Set()

    // Cross-row distinctness: order each row's films uniques-first, and only let an
    // already-shown film fill the tail when there aren't enough unique films left
    // (true for users whose taste concentrates in one genre, so several rows draw
    // the same top films). Claim only the films that will actually display
    // (DISPLAY_COUNT — mirrors HomeRecommendationSection's MAX_FILMS) so later rows
    // keep the widest possible unique pool.
    const DISPLAY_COUNT = 5
    // top_of_taste also feeds up to HERO_RESERVE hero standouts (Home's HERO_MAX),
    // which Home lifts OUT of the row — so its on-screen window spans the hero + the
    // row. Reserve both, or those lifted/lower films leak into later rows.
    const HERO_RESERVE = 3
    function dedupFilms(films, claimCount = DISPLAY_COUNT) {
      if (!films || films.length === 0) return films
      const unique = films.filter(f => !shownIds.has(f.id))
      const repeats = films.filter(f => shownIds.has(f.id))
      const ordered = [...unique, ...repeats]
      ordered.slice(0, claimCount).forEach(f => { if (f?.id) shownIds.add(f.id) })
      return ordered
    }

    // Order: TopOfTaste → Orbit → Mood → TopGenre → SignatureTones → HiddenGems
    const dTopOfTaste = topOfTaste.data
      ? { ...topOfTaste.data, films: dedupFilms(topOfTaste.data.films, DISPLAY_COUNT + HERO_RESERVE) }
      : topOfTaste.data
    const dOrbit = orbit.data
      ? { ...orbit.data, films: dedupFilms(orbit.data.films) }
      : orbit.data
    const dMood = mood.data
      ? { ...mood.data, films: dedupFilms(mood.data.films) }
      : mood.data
    const dTopGenre = topGenre.data
      ? { ...topGenre.data, films: dedupFilms(topGenre.data.films) }
      : topGenre.data
    const dSignatureTones = signatureTones.data
      ? { ...signatureTones.data, films: dedupFilms(signatureTones.data.films) }
      : signatureTones.data
    const dHiddenGems = hiddenGems.data
      ? { ...hiddenGems.data, films: dedupFilms(hiddenGems.data.films) }
      : hiddenGems.data

    return { dTopOfTaste, dOrbit, dMood, dTopGenre, dSignatureTones, dHiddenGems }
  }, [topOfTaste.data, orbit.data, mood.data, topGenre.data, signatureTones.data, hiddenGems.data])

  return {
    tier,
    rotationVariant,
    // The resolved v3 profile — exposed so the render layer can build honest facet
    // labels (mood signature, signature tones) from the same taste data the rows used.
    profile,
    // Whether the shared profile + scoring context every row depends on are ready,
    // and whether building them failed (so Home can show loading vs. error vs.
    // content honestly rather than flashing an empty/"no recommendations" state).
    profileReady: (hasProfile && hasContext) || !userId,
    profileError,
    topOfTaste: { ...topOfTaste, data: deduped.dTopOfTaste },
    hiddenGems: { ...hiddenGems, data: deduped.dHiddenGems },
    orbit: { ...orbit, data: deduped.dOrbit },
    mood: { ...mood, data: deduped.dMood },
    topGenre: { ...topGenre, data: deduped.dTopGenre },
    signatureTones: { ...signatureTones, data: deduped.dSignatureTones },
  }
}
