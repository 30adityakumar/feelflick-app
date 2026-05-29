// src/features/history/useHistoryData.jsx
// FeelFlick — History v2 ("Diary") data layer. Fetches the signed-in user's
// user_history (joined with movies) + user_ratings, then derives:
//   - entries[]: diary rows grouped by month → day in the UI
//   - stats: totalLogged, totalHours, avgRating, thisMonthCount, streakDays
// Trend/signature visuals (heatmap, monthly timeline, mood share) live on
// /profile (DNA) — they're patterns, not diary content.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { formatShortDate, formatShortMonthYear } from '@/shared/lib/format/date'
import { HP, MOOD_HEX, tmdbImg } from './data'

const HistoryDataContext = createContext(null)

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const INITIAL = {
  entries: [],
  stats: { totalLogged: 0, totalHours: 0, avgRating: 0, thisMonthCount: 0, streakDays: 0 },
  loading: true,
  error: null,
  removeEntry: async () => {},
  refresh: () => {},
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : ''
}

function dayKey(date) {
  // YYYY-MM-DD in local time — matches how a user thinks about "a day".
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function dayPart(hour) {
  if (hour >= 5 && hour < 12) return 'Morning'
  if (hour >= 12 && hour < 17) return 'Afternoon'
  if (hour >= 17 && hour < 21) return 'Evening'
  return 'Late'
}

function moodHexFor(name) {
  if (!name) return HP.purple
  return MOOD_HEX[name] || MOOD_HEX[capitalize(name)] || HP.purple
}

// === Derivers ============================================================

function deriveEntries(history, ratings) {
  const ratingByMovieId = new Map(ratings.map(r => [r.movie_id, r]))
  return history
    .filter(h => h.watched_at)
    .sort((a, b) => new Date(b.watched_at) - new Date(a.watched_at))
    .map(h => {
      const m = h.movies || {}
      const r = ratingByMovieId.get(h.movie_id) || {}
      const d = new Date(h.watched_at)
      const moodTag = (m.mood_tags || [])[0]
      const mood = capitalize(moodTag) || 'Mixed'
      return {
        id: h.id || `${h.movie_id}-${h.watched_at}`,
        movieId: h.movie_id,
        tmdbId: m.tmdb_id,
        title: m.title || 'Untitled',
        year: m.release_date ? new Date(m.release_date).getFullYear() : '',
        runtime: m.runtime || 0,
        dir: m.director_name || '—',
        date: formatShortDate(d),
        month: formatShortMonthYear(d),
        day: d.getDate(),
        // user_ratings.rating is on the 1-10 scale; map to 1-5 for star display.
        rating: r.rating ? Math.round(r.rating / 2) : 0,
        mood,
        moodHex: moodHexFor(mood),
        context: `${dayPart(d.getHours())} · ${WEEKDAY_NAMES[d.getDay()]}`,
        note: r.review_text || null,
        poster: m.poster_path ? tmdbImg(m.poster_path, 'w342') : null,
        // Rewatches aren't currently tracked in user_history (the app
        // dedupes by (user, movie)). Leaving rewatch=false until that
        // changes. ♥ fav fires for any 5★-display rating (raw 9 or 10 on
        // the 1-10 scale) — matches what the star row shows. Previously
        // gated on rating===10, which left favorites permanently dead for
        // users who rate at 9.
        rewatch: false,
        fav: typeof r.rating === 'number' && r.rating >= 9,
      }
    })
}

function deriveStats({ history, ratings }) {
  const totalLogged = history.length
  const totalHours = Math.round(history.reduce((s, h) => s + (h.movies?.runtime || 0), 0) / 60)
  const rated = ratings.filter(r => r.rating != null)
  const avgRating = rated.length > 0
    ? Math.round((rated.reduce((s, r) => s + r.rating, 0) / rated.length / 2) * 10) / 10
    : 0
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonthCount = history.filter(h => h.watched_at && new Date(h.watched_at) >= startOfMonth).length

  // Streak: consecutive days back from today (or yesterday if today has no
  // entries yet) with at least one watched entry.
  const days = new Set()
  for (const h of history) {
    if (!h.watched_at) continue
    days.add(dayKey(new Date(h.watched_at)))
  }
  let streakDays = 0
  if (days.size > 0) {
    const today = new Date()
    const todayK = dayKey(today)
    const yesterdayK = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d) })()
    const alive = days.has(todayK) || days.has(yesterdayK)
    if (alive) {
      const cursor = new Date(today)
      // If today is empty but yesterday has a watch, start counting from yesterday.
      if (!days.has(todayK)) cursor.setDate(cursor.getDate() - 1)
      for (let i = 0; i < 365; i++) {
        if (days.has(dayKey(cursor))) {
          streakDays += 1
          cursor.setDate(cursor.getDate() - 1)
        } else {
          break
        }
      }
    }
  }
  return { totalLogged, totalHours, avgRating, thisMonthCount, streakDays }
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
