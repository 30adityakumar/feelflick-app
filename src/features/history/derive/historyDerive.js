// src/features/history/derive/historyDerive.js
// FeelFlick — pure History/Diary derivations. The Diary is a chronological record of
// what the user WATCHED and what they thought — not a streak tracker or a rating
// database detached from watched history.
//
// F6.5 data-truth corrections:
//   • avgRating is now DIARY-SCOPED — averaged only over ratings whose film is actually
//     in the watched Diary (rated-but-unwatched and removed films no longer count).
//   • streak derivation is removed entirely (no gamification).
//   • mood is explicitly the FILM's mood (from movie mood_tags), not the user's viewing
//     mood; review_text is film-level review, not a watch-event note. (Labelling lives in
//     the page; the data is named honestly here.)
// Frozen: the 1-10 → 1-5 display mapping, watched_at filtering, chronological ordering,
// loved/fav (raw ≥9), total-hours, and thisMonthCount are unchanged.

import { formatShortDate, formatShortMonthYear } from '@/shared/lib/format/date'
import { HP, MOOD_HEX, tmdbImg } from '../data'

export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : ''
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

// F6.10: collapse user_history to ONE canonical row per film. The DB allows multiple
// rows per (user, movie) (its only uniqueness is (user_id, movie_id, watched_at)), and
// different watch paths stamp fresh watched_at values, so the same film can have 2–3 rows.
// The CURRENT Diary contract is one entry per film — multiple rows are collapsed to the
// LATEST watch (this is NOT a rewatch; first-class rewatches + any DB cleanup are future
// architecture). Pure: the input is never mutated, no DB row is touched, and the selected
// canonical row's fields are preserved verbatim (older rows are never merged/synthesized).
export function dedupeHistoryByMovie(history = []) {
  const byMovie = new Map()
  for (let i = 0; i < history.length; i++) {
    const row = history[i]
    if (!row || row.movie_id == null) continue                 // rule 1: need a movie_id
    const t = row.watched_at ? new Date(row.watched_at).getTime() : NaN
    if (!Number.isFinite(t)) continue                          // rule 2: need a valid watched_at (Diary rule)
    const existing = byMovie.get(row.movie_id)
    // rule 4/5: keep the most-recent watched_at; on a tie keep the EARLIER original-array
    // row (replace only when STRICTLY newer → stable, deterministic).
    if (!existing || t > existing.t) byMovie.set(row.movie_id, { row, t })
  }
  return [...byMovie.values()].map(v => v.row)                 // rules 6/7: new array, original row refs
}

export function deriveEntries(history, ratings) {
  const ratingByMovieId = new Map(ratings.map(r => [r.movie_id, r]))
  // One visible entry per film, from the canonical (deduplicated) history set.
  return dedupeHistoryByMovie(history)
    .sort((a, b) => new Date(b.watched_at) - new Date(a.watched_at))
    .map(h => {
      const m = h.movies || {}
      const r = ratingByMovieId.get(h.movie_id) || {}
      const d = new Date(h.watched_at)
      const moodTag = (m.mood_tags || [])[0]
      // `filmMood` makes provenance explicit: this is the FILM's tone, NOT the user's
      // mood while watching. `mood` is retained as an alias for existing consumers.
      const filmMood = capitalize(moodTag) || 'Mixed'
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
        filmMood,
        mood: filmMood,
        moodHex: moodHexFor(filmMood),
        context: `${dayPart(d.getHours())} · ${WEEKDAY_NAMES[d.getDay()]}`,
        // review_text is the user's film-level review (not a per-watch note).
        review: r.review_text || null,
        note: r.review_text || null,
        poster: m.poster_path ? tmdbImg(m.poster_path, 'w342') : null,
        // Rewatches aren't tracked in user_history yet (the app dedupes by
        // (user, movie)). Rewatch support is future work (it also needs the
        // removal to key off the history row id — see provider note). ♥ fav
        // fires for raw 9 or 10 (5★ display).
        rewatch: false,
        fav: typeof r.rating === 'number' && r.rating >= 9,
      }
    })
}

export function deriveStats({ history, ratings }) {
  // F6.10: every Diary fact is computed from the SAME canonical (one-per-film) history
  // set, so duplicate rows never inflate Logged / Hours / This-month.
  const canonical = dedupeHistoryByMovie(history)
  const totalLogged = canonical.length                                   // unique films
  const totalHours = Math.round(canonical.reduce((s, h) => s + (h.movies?.runtime || 0), 0) / 60) // runtime once/film

  // F6.5: DIARY-SCOPED average — average only ratings whose movie is in the canonical
  // watched Diary. Rated-but-unwatched films and removed Diary films do not count;
  // unrated Diary films are excluded from the denominator. No rating scale changes.
  // (Ratings are keyed per movie, so a duplicate history row affects neither numerator
  // nor denominator — the canonical set makes this explicit.)
  const historyMovieIds = new Set(canonical.map(h => h.movie_id))
  const diaryRatings = ratings.filter(
    r => r.rating != null && historyMovieIds.has(r.movie_id)
  )
  const avgRating = diaryRatings.length > 0
    ? Math.round((diaryRatings.reduce((s, r) => s + r.rating, 0) / diaryRatings.length / 2) * 10) / 10
    : 0

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  // Count each film once, by its selected latest watched_at.
  const thisMonthCount = canonical.filter(h => new Date(h.watched_at) >= startOfMonth).length

  return { totalLogged, totalHours, avgRating, thisMonthCount }
}

// Pure Diary search: matches a derived entry against a free-text query over the
// user's own content — title, director, and review. The FILM's generated mood is
// intentionally NOT searched (it isn't a user note).
export function matchesQuery(entry, query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return true
  return (
    String(entry.title || '').toLowerCase().includes(q) ||
    String(entry.dir || '').toLowerCase().includes(q) ||
    String(entry.review || '').toLowerCase().includes(q)
  )
}
