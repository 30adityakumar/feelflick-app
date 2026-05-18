// src/features/history-v2/useHistoryData.jsx
// FeelFlick — History v2 ("Diary") data layer. Fetches the signed-in user's
// user_history (joined with movies) + user_ratings, then derives every panel:
// entries[], heatmap (12w × 7d), timeline (12 months), moodShare (this year),
// stats (totalLogged, totalHours, avgRating, thisMonthCount, streakDays).

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { HP, MOOD_HEX, tmdbImg } from './data'

const HistoryDataContext = createContext(null)

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const INITIAL = {
  entries: [],
  heatmap: Array.from({ length: 12 }, () => Array(7).fill(0)),
  timeline: [],
  moodShare: [],
  stats: { totalLogged: 0, totalHours: 0, avgRating: 0, thisMonthCount: 0, streakDays: 0 },
  loading: true,
  error: null,
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
        date: d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }),
        month: d.toLocaleDateString('en-US', { month:'short', year:'numeric' }),
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
        // changes. The "♥ fav" heart maps to a 5★ exact rating.
        rewatch: false,
        fav: r.rating === 10,
      }
    })
}

function deriveHeatmap(history) {
  const grid = Array.from({ length: 12 }, () => Array(7).fill(0))
  const now = new Date()
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  for (const h of history) {
    if (!h.watched_at) continue
    const d = new Date(h.watched_at)
    const dMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const daysAgo = Math.round((todayMidnight - dMidnight) / 86400000)
    if (daysAgo < 0 || daysAgo >= 84) continue
    const weekIdx = 11 - Math.floor(daysAgo / 7)
    const dayIdx = d.getDay()
    if (weekIdx >= 0 && weekIdx < 12) grid[weekIdx][dayIdx] += 1
  }
  // Bucket the counts into 0-3 intensity tiers
  return grid.map(week => week.map(count => {
    if (count === 0) return 0
    if (count === 1) return 1
    if (count === 2) return 2
    return 3
  }))
}

function deriveTimeline(history) {
  const buckets = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, m: MONTH_SHORT[d.getMonth()], n: 0 })
  }
  const idxByKey = new Map(buckets.map((b, i) => [b.key, i]))
  for (const h of history) {
    if (!h.watched_at) continue
    const d = new Date(h.watched_at)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const idx = idxByKey.get(key)
    if (idx != null) buckets[idx].n += 1
  }
  return buckets
}

function deriveMoodShare(history) {
  const year = new Date().getFullYear()
  const counts = new Map()
  let total = 0
  for (const h of history) {
    if (!h.watched_at) continue
    if (new Date(h.watched_at).getFullYear() !== year) continue
    const tag = (h.movies?.mood_tags || [])[0]
    if (!tag) continue
    const cap = capitalize(tag)
    counts.set(cap, (counts.get(cap) || 0) + 1)
    total += 1
  }
  if (total === 0) return []
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  return sorted.map(([name, count]) => ({
    name,
    pct: Math.max(1, Math.round((count / total) * 100)),
    hex: moodHexFor(name),
  }))
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
        const heatmap = deriveHeatmap(history)
        const timeline = deriveTimeline(history)
        const moodShare = deriveMoodShare(history)
        const stats = deriveStats({ history, ratings })

        setState({ entries, heatmap, timeline, moodShare, stats, loading: false, error: null })
      } catch (e) {
        if (abort) return
        console.error('[useHistoryData]', e)
        setState(s => ({ ...s, loading: false, error: e?.message || 'Failed to load' }))
      }
    })()

    return () => { abort = true }
  }, [user])

  const value = useMemo(() => state, [state])
  return <HistoryDataContext.Provider value={value}>{children}</HistoryDataContext.Provider>
}

export function useHistoryData() {
  const ctx = useContext(HistoryDataContext)
  if (!ctx) throw new Error('useHistoryData must be inside HistoryDataProvider')
  return ctx
}
