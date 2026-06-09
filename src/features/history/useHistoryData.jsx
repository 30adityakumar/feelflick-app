// src/features/history/useHistoryData.jsx
// FeelFlick — History v2 ("Diary") data layer. Fetches the signed-in user's
// user_history (joined with movies) + user_ratings, then derives:
//   - entries[]: diary rows grouped by month → day in the UI
//   - stats: totalLogged, totalHours, avgRating, thisMonthCount, streakDays
//
// F6.2: the pure derivations live in ./derive/historyDerive (behavior unchanged).
// F6.3: removeEntry is now SETTLED (the row leaves the list only after the DB delete
// succeeds — a resolved Supabase { error } is recognised, never silently treated as
// success), with explicit result objects, per-entry pending state, a duplicate guard,
// and a sanitized 'load_error' state. The (user_id, movie_id) delete filter and the
// rating/review-retention behavior are FROZEN here — F6.5 owns those semantics.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { deriveEntries, deriveStats } from './derive/historyDerive'

const HistoryDataContext = createContext(null)

const INITIAL = {
  entries: [],
  stats: { totalLogged: 0, totalHours: 0, avgRating: 0, thisMonthCount: 0, streakDays: 0 },
  loading: true,
  error: null,                  // F6.3: 'load_error' | null — never a raw backend message
  removingEntryIds: new Set(),  // F6.3: entry ids with a removal in flight
  isRemoving: () => false,
  removeEntry: async () => ({ ok: false, action: 'remove_failed' }),
  refresh: () => {},
}

export function HistoryDataProvider({ children }) {
  const { user } = useAuthSession()
  const [state, setState] = useState(INITIAL)
  const [nonce, setNonce] = useState(0)
  const [removingEntryIds, setRemovingEntryIds] = useState(() => new Set())

  // Mirror of state.entries kept current so the delete callback can read the
  // canonical list without piggybacking on setState callbacks (Strict-Mode safe).
  const entriesRef = useRef(state.entries)
  useEffect(() => { entriesRef.current = state.entries }, [state.entries])

  const inFlightRef = useRef(new Set())
  const mountedRef = useRef(true)
  const userIdRef = useRef(user?.id)
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])
  useEffect(() => { userIdRef.current = user?.id }, [user?.id])
  useEffect(() => { inFlightRef.current = new Set(); setRemovingEntryIds(new Set()) }, [user?.id])

  const refresh = useCallback(() => setNonce(n => n + 1), [])
  const isRemoving = useCallback((entryId) => removingEntryIds.has(entryId), [removingEntryIds])
  const alive = useCallback((uid) => mountedRef.current && userIdRef.current === uid, [])

  const removeEntry = useCallback(async (entryId) => {
    if (!user?.id || !entryId) return { ok: false, action: 'remove_failed', entryId, movieId: null }
    const uid = user.id
    const target = (entriesRef.current || []).find(e => e.id === entryId)
    if (!target) return { ok: false, action: 'remove_failed', entryId, movieId: null }
    const movieId = target.movieId
    const fail = { ok: false, action: 'remove_failed', entryId, movieId }
    if (inFlightRef.current.has(entryId)) return { ...fail, duplicate: true }
    inFlightRef.current.add(entryId)
    if (alive(uid)) setRemovingEntryIds(prev => { const n = new Set(prev); n.add(entryId); return n })
    let result = fail
    try {
      // FROZEN (F6.5 owns the semantics): delete keys off (user_id, movie_id); the app
      // dedupes by (user, movie) so there is only ever one row. Ratings/feedback are
      // intentionally NOT touched here. SETTLED: recognise a resolved { error }.
      const { error } = await supabase
        .from('user_history')
        .delete()
        .eq('user_id', uid)
        .eq('movie_id', movieId)
      if (error) {
        console.warn('[removeEntry]', error)
        refresh() // re-sync canonical; the entry was never removed locally
      } else {
        if (alive(uid)) {
          setState(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== entryId) }))
        }
        // Re-fetch to keep the aggregate stats in sync with the now-shorter list.
        refresh()
        result = { ok: true, action: 'removed', entryId, movieId }
      }
    } catch (e) {
      console.warn('[removeEntry]', e)
      refresh()
    } finally {
      inFlightRef.current.delete(entryId)
      if (alive(uid)) setRemovingEntryIds(prev => { const n = new Set(prev); n.delete(entryId); return n })
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
        const [historyRes, ratingsRes] = await Promise.all([
          supabase
            .from('user_history')
            .select(`
              movie_id, watched_at,
              movies!inner (
                id, tmdb_id, title, director_name, release_date, runtime, mood_tags, poster_path
              )
            `)
            .eq('user_id', user.id)
            .order('watched_at', { ascending: false }),
          supabase
            .from('user_ratings')
            .select('movie_id, rating, review_text, rated_at')
            .eq('user_id', user.id),
        ])
        if (abort) return
        if (historyRes.error) throw historyRes.error

        const history = historyRes.data || []
        const ratings = ratingsRes.data || []
        const entries = deriveEntries(history, ratings)
        const stats = deriveStats({ history, ratings })

        setState(s => ({ ...s, entries, stats, loading: false, error: null }))
      } catch (e) {
        if (abort) return
        console.error('[useHistoryData]', e)
        setState(s => ({ ...s, loading: false, error: 'load_error' }))
      }
    })()

    return () => { abort = true }
  }, [user, nonce])

  const value = useMemo(() => ({
    ...state,
    removingEntryIds,
    isRemoving,
    removeEntry,
    refresh,
  }), [state, removingEntryIds, isRemoving, removeEntry, refresh])

  return <HistoryDataContext.Provider value={value}>{children}</HistoryDataContext.Provider>
}

export function useHistoryData() {
  const ctx = useContext(HistoryDataContext)
  if (!ctx) throw new Error('useHistoryData must be inside HistoryDataProvider')
  return ctx
}
