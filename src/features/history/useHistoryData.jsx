// src/features/history/useHistoryData.jsx
// FeelFlick — History v2 ("Diary") data layer. Fetches the signed-in user's
// user_history (joined with movies) + user_ratings, then derives:
//   - entries[]: diary rows grouped by month → day in the UI
//   - stats: totalLogged, totalHours, avgRating, thisMonthCount, streakDays
// Trend/signature visuals (heatmap, monthly timeline, mood share) live on
// /profile (DNA) — they're patterns, not diary content.
//
// F6.2: the pure derivations now live in ./derive/historyDerive (behavior
// unchanged); this provider is a thin caller over them.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { deriveEntries, deriveStats } from './derive/historyDerive'

const HistoryDataContext = createContext(null)

const INITIAL = {
  entries: [],
  stats: { totalLogged: 0, totalHours: 0, avgRating: 0, thisMonthCount: 0, streakDays: 0 },
  loading: true,
  error: null,
  removeEntry: async () => {},
  refresh: () => {},
}

// === Provider ============================================================

export function HistoryDataProvider({ children }) {
  const { user } = useAuthSession()
  const [state, setState] = useState(INITIAL)
  const [nonce, setNonce] = useState(0)
  // Mirror of state.entries kept current so side-effecting callbacks (delete)
  // can read the canonical list without piggybacking on setState callbacks —
  // those get double-invoked in Strict Mode and the 2nd run sees already-
  // filtered state, zeroing out the work. Same pattern as /watchlist.
  const entriesRef = useRef(state.entries)
  useEffect(() => { entriesRef.current = state.entries }, [state.entries])

  const refresh = useCallback(() => setNonce(n => n + 1), [])

  const removeEntry = useCallback(async (entryId) => {
    if (!user?.id || !entryId) return
    const current = entriesRef.current || []
    const target = current.find(e => e.id === entryId)
    if (!target) return
    // Optimistic: drop from the visible entries list immediately so the row
    // disappears under the user's cursor. The aggregates (heatmap / timeline
    // / mood share / stats) will catch up after the post-delete refresh —
    // re-deriving them from already-derived entries is lossy (we'd lose the
    // raw watched_at timestamp, mood_tags etc.), so it's cleaner to just
    // re-fetch the canonical rows.
    setState(prev => ({
      ...prev,
      entries: prev.entries.filter(e => e.id !== entryId),
    }))
    try {
      // The row's surfaced id is either user_history.id (uuid) or our fallback
      // composite `${movie_id}-${watched_at}`. The delete keys off
      // (user_id, movie_id): the app dedupes by (user, movie) so there's
      // only ever one row to remove.
      await supabase
        .from('user_history')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', target.movieId)
    } catch (e) {
      console.warn('[removeEntry]', e)
    }
    // Refresh re-fetches and re-derives all aggregates — cheap on the small
    // user_history table and avoids drift between visible entries and stats.
    refresh()
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

        setState({ entries, stats, loading: false, error: null, removeEntry, refresh })
      } catch (e) {
        if (abort) return
        console.error('[useHistoryData]', e)
        setState(s => ({ ...s, loading: false, error: e?.message || 'Failed to load' }))
      }
    })()

    return () => { abort = true }
  }, [user, nonce, removeEntry, refresh])

  const value = useMemo(() => state, [state])
  return <HistoryDataContext.Provider value={value}>{children}</HistoryDataContext.Provider>
}

export function useHistoryData() {
  const ctx = useContext(HistoryDataContext)
  if (!ctx) throw new Error('useHistoryData must be inside HistoryDataProvider')
  return ctx
}
