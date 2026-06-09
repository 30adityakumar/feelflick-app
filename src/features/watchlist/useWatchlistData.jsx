// src/features/watchlist/useWatchlistData.jsx
// FeelFlick — Watchlist v2 data layer. Fetches the signed-in user's
// user_watchlist (joined with movies) + their taste_fingerprint, then
// derives the shape the page expects: items[] with match/mood/perfect/
// stale/addedDaysAgo/hex/tmdbId/internalId, plus aggregate stats.
//
// F6.2: the pure derivations now live in ./derive/watchlistDerive (behavior
// unchanged); this provider is a thin caller over them.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { getTasteFingerprint } from '@/shared/services/tasteCache'
import { computeUserProfile } from '@/shared/services/recommendations'
import { MOVIE_ENGINE_COLS } from '@/shared/services/movieFields'
import { deriveItems, deriveAvailableMoods, recomputeStats } from './derive/watchlistDerive'

const WatchlistDataContext = createContext(null)

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

export function useWatchlistData() {
  const ctx = useContext(WatchlistDataContext)
  if (!ctx) throw new Error('useWatchlistData must be inside WatchlistDataProvider')
  return ctx
}
