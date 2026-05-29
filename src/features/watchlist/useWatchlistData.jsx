// src/features/watchlist/useWatchlistData.jsx
// FeelFlick — Watchlist v2 data layer. Fetches the signed-in user's
// user_watchlist (joined with movies) + their taste_fingerprint, then
// derives the shape the page expects: items[] with match/mood/perfect/
// stale/addedDaysAgo/hex/tmdbId/internalId, plus aggregate stats.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { getTasteFingerprint } from '@/shared/services/tasteCache'
import { computeUserProfile, scoreMovieForUser } from '@/shared/services/recommendations'
import { computeMatchPercent } from '@/shared/services/matchScore'
import { MOVIE_ENGINE_COLS } from '@/shared/services/movieFields'
import { HP, MOOD_HEX, tmdbImg } from './data'

const WatchlistDataContext = createContext(null)

// Stale threshold matches the README: items added >60 days ago.
const STALE_DAYS = 60

const INITIAL = {
  items: [],
  stats: {
    watchlistTotal: 0,
    perfectForTonightCount: 0,
    gettingStaleCount: 0,
    topMatchPct: 0,
    avgMatchPct: 0,
  },
  availableMoods: [],         // distinct moods present in the queue (sorted by count desc)
  hasFingerprint: false,      // false until taste_fingerprint exists; gates "Perfect for tonight"
  loading: true,
  error: null,
  removeFromWatchlist: async () => {},
  removeStale: async () => {},
  refresh: () => {},
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : ''
}

function pickPrimaryMood(moodTags) {
  if (!Array.isArray(moodTags) || moodTags.length === 0) return null
  // Pick the first non-empty tag; tags are populated in order of strength
  // by the LLM enrichment pipeline.
  return capitalize(moodTags[0])
}

function hexFor(mood) {
  if (!mood) return HP.textSoft
  return MOOD_HEX[mood] || MOOD_HEX[mood.toLowerCase()] || HP.purple
}

function daysAgo(iso) {
  if (!iso) return 0
  const ms = Date.now() - new Date(iso).getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

// Per-(user, film) match score. We don't run the full 7-dimension
// scoring engine here — that's expensive and tied to the recommendation
// pipeline. Instead we approximate from the signals we already have:
//   - 50 base
//   - +25 if the film's primary mood is one of the user's top 3
//   - +10 if it's also one of the user's top 5 fits
//   - +up to 15 from objective quality (ff_final_rating)
// Capped at 96, floored at 50. Deterministic given same inputs.
function approxMatch({ movie, fingerprint }) {
  const moodTags = movie.mood_tags || []
  const fitProfile = movie.fit_profile
  const userTopMoods = (fingerprint?.topMoodTags || []).slice(0, 3).map(t => t.key)
  const userTopFits = (fingerprint?.topFitProfiles || []).slice(0, 5).map(t => t.key)
  let score = 50
  if (moodTags.some(t => userTopMoods.includes(t))) score += 25
  if (fitProfile && userTopFits.includes(fitProfile)) score += 10
  const quality = Number(movie.ff_final_rating) || Number(movie.ff_rating) || 0
  if (quality > 0) {
    // ff_final_rating is 0–10; map 7.0–9.0 → 0–15 bonus
    const q = Math.max(0, Math.min(15, ((quality - 7) / 2) * 15))
    score += q
  }
  return Math.max(50, Math.min(96, Math.round(score)))
}

// Build a contextual "why" line for FeaturedCard from real per-item signals.
// FeaturedCard only renders for perfect/top items, so this always has
// something concrete to say (mood + match + age). Deterministic given inputs.
function deriveWhy({ mood, match, addedDaysAgo, matchesTopMood }) {
  const parts = []
  if (matchesTopMood) parts.push(`Your ${mood.toLowerCase()} pick`)
  else parts.push(`${mood} pick`)
  parts.push(`${match}% match`)
  if (addedDaysAgo === 0) parts.push('saved today')
  else if (addedDaysAgo === 1) parts.push('saved yesterday')
  else parts.push(`waiting ${addedDaysAgo}d`)
  return parts.join(' · ')
}

// A film is "perfect for tonight" when its primary mood matches the
// user's #1 mood AND it scored ≥ 80. Cold-start (no fingerprint) → no
// perfect items; the page falls back to "top of your queue" in that case.
function deriveItems({ rows, fingerprint, profile }) {
  const userTopMood = fingerprint?.topMoodTags?.[0]?.key || null
  const items = rows.map(r => {
    const m = r.movies || {}
    const mood = pickPrimaryMood(m.mood_tags)
    // Engine when we have a profile; cold-start fallback otherwise.
    // computeMatchPercent is the system-wide match%: confidence-tiered
    // mapping of engineScore → 0-99. Same definition + curve as /home,
    // /movie/:id, /history. Returns null when the engine has no signal;
    // we coerce to approxMatch fallback in that case.
    // scoreMovieForUser returns null when a content-boundary hard filter
    // hits (graphic/sexual + matching keywords/cert). Coerce to null so
    // we fall back to approxMatch below — the film still shows on the
    // watchlist; we just can't compute a real match %.
    const engineScore = profile
      ? (scoreMovieForUser(m, profile, 'default')?.score ?? null)
      : null
    const engineMatch = computeMatchPercent({ engineScore, profile })
    const match = engineMatch != null
      ? engineMatch
      : approxMatch({ movie: m, fingerprint })
    const addedDaysAgo = daysAgo(r.added_at)
    const stale = addedDaysAgo > STALE_DAYS
    const moodKey = (m.mood_tags || [])[0] || null
    const matchesTopMood = Boolean(userTopMood && moodKey && moodKey === userTopMood)
    const perfect = Boolean(matchesTopMood && match >= 80 && !stale)
    const why = deriveWhy({ mood: mood || 'Mixed', match, addedDaysAgo, matchesTopMood })
    return {
      id: r.movie_id,
      internalId: m.id,
      tmdbId: m.tmdb_id,
      title: m.title || 'Untitled',
      year: m.release_date ? new Date(m.release_date).getFullYear() : '',
      runtime: m.runtime || 0,
      dir: m.director_name || '—',
      mood: mood || 'Mixed',
      hex: hexFor(mood),
      match,
      perfect,
      stale,
      addedDaysAgo,
      poster: m.poster_path ? tmdbImg(m.poster_path, 'w500') : null,
      why,
    }
  })
  return items
}

// Distinct moods present in the queue, ranked by count (descending). Used to
// generate dynamic filter pills so a user only ever sees moods that match
// something in their actual list.
function deriveAvailableMoods(items) {
  const counts = new Map()
  for (const it of items) {
    if (!it.mood || it.mood === 'Mixed') continue
    counts.set(it.mood, (counts.get(it.mood) || 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([mood, count]) => ({ mood, count, hex: hexFor(mood) }))
}

export function WatchlistDataProvider({ children }) {
  const { user } = useAuthSession()
  const [state, setState] = useState(INITIAL)
  const [nonce, setNonce] = useState(0)
  // Mirror of state.items, kept current via effect so side-effecting callbacks
  // (e.g. bulk delete) can read the canonical list without piggybacking on
  // setState callbacks — those are double-invoked in Strict Mode.
  const itemsRef = useRef(state.items)
  useEffect(() => { itemsRef.current = state.items }, [state.items])

  const refresh = useCallback(() => setNonce(n => n + 1), [])

  const removeFromWatchlist = useCallback(async (movieId) => {
    if (!user?.id || !movieId) return
    // Optimistic: drop locally first; refresh re-syncs.
    setState(prev => {
      const items = prev.items.filter(it => it.id !== movieId)
      return {
        ...prev,
        items,
        stats: recomputeStats(items),
        availableMoods: deriveAvailableMoods(items),
      }
    })
    try {
      await supabase
        .from('user_watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId)
    } catch (e) {
      console.warn('[removeFromWatchlist]', e)
      // Re-fetch to fix optimistic mismatch on error.
      refresh()
    }
  }, [user, refresh])

  // Bulk-delete every stale item in one DB round-trip. Used by the footer
  // "Clear all stale" button. Returns the count actually removed.
  // WHY itemsRef: React 18 Strict Mode double-invokes setState callbacks
  // during dev — the 2nd invocation sees the 1st invocation's result as
  // `prev`, so any side effect computed from `prev.items` runs against an
  // already-filtered list and reports zero work. We snapshot the latest
  // items via a ref written on every state set, then read it before the
  // (still optimistic) setState that mutates UI.
  const removeStale = useCallback(async () => {
    if (!user?.id) return 0
    const staleIds = (itemsRef.current || []).filter(it => it.stale).map(it => it.id)
    if (staleIds.length === 0) return 0
    // Optimistic UI: drop stale rows from local state.
    setState(prev => {
      const items = prev.items.filter(it => !it.stale)
      return {
        ...prev,
        items,
        stats: recomputeStats(items),
        availableMoods: deriveAvailableMoods(items),
      }
    })
    const { error } = await supabase
      .from('user_watchlist')
      .delete()
      .eq('user_id', user.id)
      .in('movie_id', staleIds)
    if (error) {
      console.warn('[removeStale]', error)
      refresh()
    }
    return staleIds.length
  }, [user, refresh])

  useEffect(() => {
    if (!user?.id) {
      setState({ ...INITIAL, loading: false })
      return
    }
    let abort = false
    setState(s => ({ ...s, loading: true, error: null }))

    ;(async () => {
      try {
        const [watchRes, fingerprint, profile] = await Promise.all([
          supabase
            .from('user_watchlist')
            .select(`
              movie_id,
              added_at,
              status,
              movies!inner (${MOVIE_ENGINE_COLS})
            `)
            .eq('user_id', user.id)
            .order('added_at', { ascending: false }),
          getTasteFingerprint(user.id).catch(() => null),
          computeUserProfile(user.id).catch(() => null),
        ])
        if (abort) return
        if (watchRes.error) throw watchRes.error

        const items = deriveItems({ rows: watchRes.data || [], fingerprint, profile })
        const availableMoods = deriveAvailableMoods(items)
        setState({
          items,
          stats: recomputeStats(items),
          availableMoods,
          hasFingerprint: Boolean(fingerprint?.topMoodTags?.length),
          loading: false,
          error: null,
          removeFromWatchlist,
          removeStale,
          refresh,
        })
      } catch (e) {
        if (abort) return
        console.error('[useWatchlistData]', e)
        setState(s => ({ ...s, loading: false, error: e?.message || 'Failed to load' }))
      }
    })()

    return () => { abort = true }
  }, [user, nonce, removeFromWatchlist, removeStale, refresh])

  const value = useMemo(() => state, [state])
  return <WatchlistDataContext.Provider value={value}>{children}</WatchlistDataContext.Provider>
}

function recomputeStats(items) {
  const matches = items.map(it => it.match).filter(Number.isFinite)
  const topMatchPct = matches.length ? Math.max(...matches) : 0
  const avgMatchPct = matches.length ? Math.round(matches.reduce((s, n) => s + n, 0) / matches.length) : 0
  return {
    watchlistTotal: items.length,
    perfectForTonightCount: items.filter(it => it.perfect).length,
    gettingStaleCount: items.filter(it => it.stale).length,
    topMatchPct,
    avgMatchPct,
  }
}

export function useWatchlistData() {
  const ctx = useContext(WatchlistDataContext)
  if (!ctx) throw new Error('useWatchlistData must be inside WatchlistDataProvider')
  return ctx
}
