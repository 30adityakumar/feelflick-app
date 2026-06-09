// src/features/watchlist/useWatchlistData.jsx
// FeelFlick — Watchlist data layer (calm saved-intent role, F6.4).
//
// The Watchlist preserves saved INTENT, not a recommendation ranking, so this provider
// no longer fetches the taste fingerprint or computes the user profile — which means
// simply VIEWING /watchlist no longer triggers a profile-cache write. It reads only the
// user_watchlist × movies rows needed to present saved films. The recommendation engine,
// computeUserProfile, scoreMovieForUser and the fingerprint services are UNCHANGED — this
// is a consumer removal, not an engine change.
//
// F6.3 reliability is preserved verbatim: settled removal that recognises a resolved
// Supabase { error } (never a false success), explicit result objects, per-id pending
// state, duplicate-click guards, logout/unmount safety, and a sanitized 'load_error'.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { deriveItems, deriveAvailableMoods } from './derive/watchlistDerive'

const WatchlistDataContext = createContext(null)

// Presentation-only movie columns — no engine/scoring columns needed any more.
const MOVIE_COLS = 'id, tmdb_id, title, director_name, release_date, runtime, mood_tags, poster_path'

const INITIAL = {
  items: [],
  total: 0,
  availableMoods: [],
  loading: true,
  error: null,                // 'load_error' | null — never a raw backend message
  removingIds: new Set(),
  isRemoving: () => false,
  removeFromWatchlist: async () => ({ ok: false, action: 'remove_failed' }),
  refresh: () => {},
}

export function WatchlistDataProvider({ children }) {
  const { user } = useAuthSession()
  const [state, setState] = useState(INITIAL)
  const [nonce, setNonce] = useState(0)
  const [removingIds, setRemovingIds] = useState(() => new Set())

  const inFlightRef = useRef(new Set())
  const mountedRef = useRef(true)
  const userIdRef = useRef(user?.id)
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])
  useEffect(() => { userIdRef.current = user?.id }, [user?.id])
  useEffect(() => { inFlightRef.current = new Set(); setRemovingIds(new Set()) }, [user?.id])

  const refresh = useCallback(() => setNonce(n => n + 1), [])
  const isRemoving = useCallback((movieId) => removingIds.has(movieId), [removingIds])
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
      // remove from the local list once the DB delete has actually succeeded. Delete
      // filter (user_id + movie_id) is unchanged.
      const { error } = await supabase
        .from('user_watchlist')
        .delete()
        .eq('user_id', uid)
        .eq('movie_id', movieId)
      if (error) {
        console.warn('[removeFromWatchlist]', error)
        refresh()
      } else {
        if (alive(uid)) {
          setState(prev => {
            const items = prev.items.filter(it => it.id !== movieId)
            return { ...prev, items, total: items.length, availableMoods: deriveAvailableMoods(items) }
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

  useEffect(() => {
    if (!user?.id) {
      setState({ ...INITIAL, loading: false })
      return
    }
    let abort = false
    setState(s => ({ ...s, loading: true, error: null }))

    ;(async () => {
      try {
        // Only the saved-film rows — no fingerprint, no profile compute, no cache write.
        const watchRes = await supabase
          .from('user_watchlist')
          .select(`movie_id, added_at, status, movies!inner (${MOVIE_COLS})`)
          .eq('user_id', user.id)
          .order('added_at', { ascending: false })
        if (abort) return
        if (watchRes.error) throw watchRes.error

        const items = deriveItems({ rows: watchRes.data || [] })
        setState(s => ({
          ...s,
          items,
          total: items.length,
          availableMoods: deriveAvailableMoods(items),
          loading: false,
          error: null,
        }))
      } catch (e) {
        if (abort) return
        console.error('[useWatchlistData]', e)
        setState(s => ({ ...s, loading: false, error: 'load_error' }))
      }
    })()

    return () => { abort = true }
  }, [user, nonce])

  const value = useMemo(() => ({
    ...state,
    removingIds,
    isRemoving,
    removeFromWatchlist,
    refresh,
  }), [state, removingIds, isRemoving, removeFromWatchlist, refresh])

  return <WatchlistDataContext.Provider value={value}>{children}</WatchlistDataContext.Provider>
}

export function useWatchlistData() {
  const ctx = useContext(WatchlistDataContext)
  if (!ctx) throw new Error('useWatchlistData must be inside WatchlistDataProvider')
  return ctx
}
