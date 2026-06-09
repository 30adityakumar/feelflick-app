// src/features/history/derive/historyDerive.js
// F6.2 — pure History/Diary derivations, extracted verbatim from useHistoryData.jsx
// (the provider is now a thin caller). NO behavior change: every function body is
// byte-for-byte identical to the inlined originals, so the rendered Diary output is
// unchanged. The current `avgRating` scope (averaged over ALL user_ratings, not just
// diary films) is preserved AS-IS and pinned by tests on purpose — the F6.5 scope fix
// will then show up as a deliberate, reviewable test change.

import { formatShortDate, formatShortMonthYear } from '@/shared/lib/format/date'
import { HP, MOOD_HEX, tmdbImg } from '../data'

export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : ''
}

export function dayKey(date) {
  // YYYY-MM-DD in local time — matches how a user thinks about "a day".
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function dayPart(hour) {
  if (hour >= 5 && hour < 12) return 'Morning'
  if (hour >= 12 && hour < 17) return 'Afternoon'
  if (hour >= 17 && hour < 21) return 'Evening'
  return 'Late'
}

export function moodHexFor(name) {
  if (!name) return HP.purple
  return MOOD_HEX[name] || MOOD_HEX[capitalize(name)] || HP.purple
}

// === Derivers ============================================================

export function deriveEntries(history, ratings) {
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

export function deriveStats({ history, ratings }) {
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
