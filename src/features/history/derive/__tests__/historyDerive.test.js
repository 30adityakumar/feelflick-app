import { describe, it, expect, afterEach, vi } from 'vitest'

import {
  WEEKDAY_NAMES, capitalize, dayKey, dayPart, moodHexFor,
  deriveEntries, deriveStats,
} from '../historyDerive'

// F6.2 — pins CURRENT History/Diary derivation behavior. The `avgRating` scope
// (averaged over ALL user_ratings, not just diary films) is pinned ON PURPOSE so the
// F6.5 scope fix is a deliberate, reviewable test change. Same for the film-mood pill.

afterEach(() => vi.useRealTimers())

const hRow = (over = {}) => ({
  movie_id: 1, watched_at: '2026-03-09T20:30:00',
  movies: { id: 11, tmdb_id: 101, title: 'A', director_name: 'D', release_date: '2020-01-01', runtime: 120, mood_tags: ['tender'], poster_path: '/p.jpg', ...over.movies },
  ...over,
})

describe('helpers', () => {
  it('capitalize / dayPart / dayKey (local) / moodHexFor', () => {
    expect(capitalize('feel_good')).toBe('Feel good')
    expect(dayPart(8)).toBe('Morning'); expect(dayPart(13)).toBe('Afternoon')
    expect(dayPart(19)).toBe('Evening'); expect(dayPart(2)).toBe('Late')
    expect(dayKey(new Date(2026, 2, 9))).toBe('2026-03-09') // local Y-M-D
    expect(typeof moodHexFor('Tender')).toBe('string')
    expect(WEEKDAY_NAMES).toHaveLength(7)
  })
})

describe('deriveEntries', () => {
  it('filters out null watched_at, sorts newest-first', () => {
    const rows = [
      hRow({ movie_id: 1, watched_at: '2026-03-01T10:00:00' }),
      hRow({ movie_id: 2, watched_at: null }),
      hRow({ movie_id: 3, watched_at: '2026-03-05T10:00:00' }),
    ]
    const out = deriveEntries(rows, [])
    expect(out.map(e => e.movieId)).toEqual([3, 1]) // movie 2 (null watched_at) dropped
  })

  it('maps rating 1-10 → 1-5 stars, mood = FILM mood_tags[0], note = review_text', () => {
    const rows = [hRow()]
    const ratings = [{ movie_id: 1, rating: 9, review_text: 'Stayed with me.' }]
    const [e] = deriveEntries(rows, ratings)
    expect(e.rating).toBe(5)          // round(9/2) = 5
    expect(e.mood).toBe('Tender')     // the FILM's generated mood tag (pinned — F6.5 clarifies)
    expect(e.note).toBe('Stayed with me.')
    expect(e.fav).toBe(true)          // raw rating ≥ 9
    expect(e.rewatch).toBe(false)
    expect(e.poster).toContain('w342')
    expect(e.context).toMatch(/Evening · (Sunday|Monday)/) // 20:30 local
  })

  it('fav fires at raw 9 and 10, not at 8; no rating → 0 stars', () => {
    const mk = (rt) => deriveEntries([hRow()], rt == null ? [] : [{ movie_id: 1, rating: rt }])[0]
    expect(mk(8).fav).toBe(false)
    expect(mk(9).fav).toBe(true)
    expect(mk(10).fav).toBe(true)
    expect(mk(null).rating).toBe(0)
  })

  it('id falls back to `${movie_id}-${watched_at}` when no row id', () => {
    const [e] = deriveEntries([hRow({ id: undefined, movie_id: 7, watched_at: '2026-03-09T20:30:00' })], [])
    expect(e.id).toBe('7-2026-03-09T20:30:00')
  })
})

describe('deriveStats', () => {
  it('totalLogged = rows; totalHours = summed runtime/60 rounded', () => {
    const history = [hRow({ movies: { runtime: 120 } }), hRow({ movie_id: 2, movies: { runtime: 90 } })]
    const s = deriveStats({ history, ratings: [] })
    expect(s.totalLogged).toBe(2)
    expect(s.totalHours).toBe(4) // (120+90)/60 = 3.5 → round 4
  })

  it('PINNED (F6.5 target): avgRating averages ALL user_ratings, even films NOT in history', () => {
    const history = [hRow({ movie_id: 1 })] // only movie 1 is in the diary
    const ratings = [
      { movie_id: 1, rating: 8 },   // in history
      { movie_id: 999, rating: 4 }, // NOT in history — but still counted today
    ]
    const s = deriveStats({ history, ratings })
    // ((8 + 4) / 2) / 2 = 3.0  → includes movie 999 which is not a diary entry.
    expect(s.avgRating).toBe(3)
  })

  it('avgRating is 0 with no ratings', () => {
    expect(deriveStats({ history: [hRow()], ratings: [] }).avgRating).toBe(0)
  })

  it('streak counts consecutive local days back from today (today-or-yesterday alive)', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 2, 10, 12, 0, 0)) // Mar 10 local
    const day = (d) => `2026-03-${String(d).padStart(2, '0')}T18:00:00`
    const history = [hRow({ watched_at: day(10) }), hRow({ movie_id: 2, watched_at: day(9) }), hRow({ movie_id: 3, watched_at: day(8) })]
    expect(deriveStats({ history, ratings: [] }).streakDays).toBe(3) // 10,9,8 consecutive
  })

  it('streak breaks on a gap and is 0 when neither today nor yesterday has a watch', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 2, 10, 12, 0, 0))
    const day = (d) => `2026-03-${String(d).padStart(2, '0')}T18:00:00`
    // today (10) + a gap at 9 then 8 → streak is just today
    expect(deriveStats({ history: [hRow({ watched_at: day(10) }), hRow({ movie_id: 2, watched_at: day(8) })], ratings: [] }).streakDays).toBe(1)
    // last watch was Mar 5 → neither today nor yesterday alive → 0
    expect(deriveStats({ history: [hRow({ watched_at: day(5) })], ratings: [] }).streakDays).toBe(0)
  })

  it('thisMonthCount counts only rows in the current local month', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 2, 10, 12, 0, 0)) // March
    const history = [hRow({ watched_at: '2026-03-02T10:00:00' }), hRow({ movie_id: 2, watched_at: '2026-02-27T10:00:00' })]
    expect(deriveStats({ history, ratings: [] }).thisMonthCount).toBe(1)
  })
})
