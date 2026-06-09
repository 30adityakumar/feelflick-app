// src/features/watchlist/useWatchlistData.jsx
// FeelFlick — Watchlist v2 data layer. Fetches the signed-in user's
// user_watchlist (joined with movies) + their taste_fingerprint, then
// derives the shape the page expects: items[] with match/mood/perfect/
// stale/addedDaysAgo/hex/tmdbId/internalId, plus aggregate stats.
//
// F6.2: the pure derivations live in ./derive/watchlistDerive (behavior unchanged).
// F6.3: removals are now SETTLED (the local list changes only after the DB delete
// succeeds — a resolved Supabase { error } is recognised, never silently treated as
// success), with explicit result objects, per-id pending state, duplicate-click guards,
// and a sanitized 'load_error' state (no raw backend text reaches the UI).

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
  error: null,                // F6.3: 'load_error' | null — never a raw backend message
  removingIds: new Set(),     // F6.3: movie ids with a removal in flight
  removingStale: false,       // F6.3: bulk stale removal in flight
  isRemoving: () => false,
  removeFromWatchlist: async () => ({ ok: false, action: 'remove_failed' }),
  removeStale: async () => ({ ok: false, removedCount: 0 }),
  refresh: () => {},
}

export function WatchlistDataProvider({ children }) {
  const { user } = useAuthSession()
  const [state, setState] = useState(INITIAL)
  const [nonce, setNonce] = useState(0)
  const [removingIds, setRemovingIds] = useState(() => new Set())
  const [removingStale, setRemovingStale] = useState(false)

  // Mirror of state.items, kept current via effect so side-effecting callbacks
  // (e.g. bulk delete) can read the canonical list without piggybacking on
  // setState callbacks — those are double-invoked in Strict Mode.
  const itemsRef = useRef(state.items)
  useEffect(() => { itemsRef.current = state.items }, [state.items])

  // Synchronous in-flight guards (dedupe rapid clicks) + a mounted/user guard so a
  // stale async completion never updates an unmounted provider or a new user's state.
  const inFlightRef = useRef(new Set())
  const staleInFlightRef = useRef(false)
  const mountedRef = useRef(true)
  const userIdRef = useRef(user?.id)
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])
  useEffect(() => { userIdRef.current = user?.id }, [user?.id])
  // Reset pending state on user change (logout / switch).
  useEffect(() => {
    inFlightRef.current = new Set()
    staleInFlightRef.current = false
    setRemovingIds(new Set())
    setRemovingStale(false)
  }, [user?.id])

  const refresh = useCallback(() => setNonce(n => n + 1), [])
  const isRemoving = useCallback((movieId) => removingIds.has(movieId), [removingIds])
  // Only touch state if still mounted AND the action's user is still the active user.
  const alive = useCallback((uid) => mountedRef.current && userIdRef.current === uid, [])

  const removeFromWatchlist = useCallback(async (movieId) => {
    const fail = { ok: false, action: 'remove_failed', movieId }
    if (!user?.id || !movieId) return fail
    const uid = user.id
    if (inFlightRef.current.has(movieId)) return { ...fail, duplicate: true }
    inFlightRef.current.add(movieId)
    if (alive(uid)) setRemovingIds(prev => { const n = new Set(prev); n.add(movieId); return n })
    let result = fail
    try {
      // SETTLED: recognise a resolved PostgREST { error } (it does NOT throw) — only
      // remove from the local list once the DB delete has actually succeeded.
      const { error } = await supabase
        .from('user_watchlist')
        .delete()
        .eq('user_id', uid)
        .eq('movie_id', movieId)
      if (error) {
        console.warn('[removeFromWatchlist]', error)
        refresh() // re-sync canonical; item was never removed locally → no false success
      } else {
        if (alive(uid)) {
          setState(prev => {
            const items = prev.items.filter(it => it.id !== movieId)
            return { ...prev, items, stats: recomputeStats(items), availableMoods: deriveAvailableMoods(items) }
          })
        }
        result = { ok: true, action: 'removed', movieId }
      }
    } catch (e) {
      console.warn('[removeFromWatchlist]', e)
      refresh()
    } finally {
      inFlightRef.current.delete(movieId)
      if (alive(uid)) setRemovingIds(prev => { const n = new Set(prev); n.delete(movieId); return n })
    }
    return result
  }, [user, refresh, alive])

  // Bulk-delete every stale item in one DB round-trip. Returns the count ACTUALLY
  // removed (0 on failure — never the attempted count).
  const removeStale = useCallback(async () => {
    if (!user?.id) return { ok: false, removedCount: 0 }
    const uid = user.id
    if (staleInFlightRef.current) return { ok: false, removedCount: 0, duplicate: true }
    const staleIds = (itemsRef.current || []).filter(it => it.stale).map(it => it.id)
    if (staleIds.length === 0) return { ok: true, removedCount: 0 }
    staleInFlightRef.current = true
    if (alive(uid)) setRemovingStale(true)
    let result = { ok: false, removedCount: 0 }
    try {
      const { error } = await supabase
        .from('user_watchlist')
        .delete()
        .eq('user_id', uid)
        .in('movie_id', staleIds)
      if (error) {
        console.warn('[removeStale]', error)
        refresh() // restore canonical stale rows
      } else {
        if (alive(uid)) {
          setState(prev => {
            const items = prev.items.filter(it => !it.stale)
            return { ...prev, items, stats: recomputeStats(items), availableMoods: deriveAvailableMoods(items) }
          })
        }
        result = { ok: true, removedCount: staleIds.length }
      }
    } catch (e) {
      console.warn('[removeStale]', e)
      refresh()
    } finally {
      staleInFlightRef.current = false
      if (alive(uid)) setRemovingStale(false)
    }
    return result
  }, [user, refresh, alive])

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
        setState(s => ({
          ...s,
          items,
          stats: recomputeStats(items),
          availableMoods,
          hasFingerprint: Boolean(fingerprint?.topMoodTags?.length),
          loading: false,
          error: null,
        }))
      } catch (e) {
        if (abort) return
        // F6.3: keep raw diagnostics in console only; expose a safe classification.
        console.error('[useWatchlistData]', e)
        setState(s => ({ ...s, loading: false, error: 'load_error' }))
      }
    })()

    return () => { abort = true }
  }, [user, nonce])

  const value = useMemo(() => ({
    ...state,
    removingIds,
    removingStale,
    isRemoving,
    removeFromWatchlist,
    removeStale,
    refresh,
  }), [state, removingIds, removingStale, isRemoving, removeFromWatchlist, removeStale, refresh])

  return <WatchlistDataContext.Provider value={value}>{children}</WatchlistDataContext.Provider>
}

export function useWatchlistData() {
  const ctx = useContext(WatchlistDataContext)
  if (!ctx) throw new Error('useWatchlistData must be inside WatchlistDataProvider')
  return ctx
}
