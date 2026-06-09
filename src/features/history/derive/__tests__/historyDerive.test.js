import { describe, it, expect, afterEach, vi } from 'vitest'

import {
  WEEKDAY_NAMES, capitalize, dayPart, moodHexFor,
  deriveEntries, deriveStats, matchesQuery,
} from '../historyDerive'

// F6.5 — the Diary derivation is now data-truthful: the average is DIARY-SCOPED (only
// rated films actually in the watched Diary), streak is GONE, film mood + review are
// named for their real provenance. (The F6.2 all-ratings-average + streak + dayKey pins
// were removed deliberately — that behavior no longer exists.)

afterEach(() => vi.useRealTimers())

const hRow = (over = {}) => ({
  movie_id: 1, watched_at: '2026-03-09T20:30:00',
  movies: { id: 11, tmdb_id: 101, title: 'A', director_name: 'D', release_date: '2020-06-15', runtime: 120, mood_tags: ['tender'], poster_path: '/p.jpg', ...over.movies },
  ...over,
})

describe('helpers', () => {
  it('capitalize / dayPart / moodHexFor (no dayKey/streak helpers anymore)', () => {
    expect(capitalize('feel_good')).toBe('Feel good')
    expect(dayPart(8)).toBe('Morning'); expect(dayPart(13)).toBe('Afternoon')
    expect(dayPart(19)).toBe('Evening'); expect(dayPart(2)).toBe('Late')
    expect(typeof moodHexFor('Tender')).toBe('string')
    expect(WEEKDAY_NAMES).toHaveLength(7)
  })
})

describe('deriveEntries', () => {
  it('12/13. filters out null watched_at, sorts newest-first (chronological)', () => {
    const rows = [
      hRow({ movie_id: 1, watched_at: '2026-03-01T10:00:00' }),
      hRow({ movie_id: 2, watched_at: null }),
      hRow({ movie_id: 3, watched_at: '2026-03-05T10:00:00' }),
    ]
    expect(deriveEntries(rows, []).map(e => e.movieId)).toEqual([3, 1])
  })

  it('6/14/15. rating 1-10 → 1-5 stars; filmMood from movie mood_tags; review = review_text', () => {
    const [e] = deriveEntries([hRow()], [{ movie_id: 1, rating: 9, review_text: 'Stayed with me.' }])
    expect(e.rating).toBe(5)              // round(9/2)
    expect(e.filmMood).toBe('Tender')     // FILM mood (explicit field)
    expect(e.mood).toBe('Tender')         // retained alias
    expect(e.review).toBe('Stayed with me.')
    expect(e.note).toBe('Stayed with me.') // retained alias
    expect(e.fav).toBe(true)              // raw ≥ 9
    expect(e.context).toMatch(/Evening · (Sunday|Monday)/)
  })

  it('fav fires at raw 9 and 10, not 8; no rating → 0 stars; id fallback', () => {
    const mk = (rt) => deriveEntries([hRow()], rt == null ? [] : [{ movie_id: 1, rating: rt }])[0]
    expect(mk(8).fav).toBe(false)
    expect(mk(9).fav).toBe(true)
    expect(mk(10).fav).toBe(true)
    expect(mk(null).rating).toBe(0)
    expect(deriveEntries([hRow({ id: undefined, movie_id: 7, watched_at: '2026-03-09T20:30:00' })], [])[0].id).toBe('7-2026-03-09T20:30:00')
  })
})

describe('deriveStats — Diary-scoped average (F6.5)', () => {
  it('7/8/9. totalLogged + totalHours (missing runtime → 0) unchanged', () => {
    const history = [hRow({ movies: { runtime: 120 } }), hRow({ movie_id: 2, movies: { runtime: 90 } }), hRow({ movie_id: 3, movies: { runtime: undefined } })]
    const s = deriveStats({ history, ratings: [] })
    expect(s.totalLogged).toBe(3)
    expect(s.totalHours).toBe(4) // (120+90+0)/60 = 3.5 → 4
  })

  it('1/2/3. average uses ONLY ratings for films in the Diary — rated-but-unwatched & removed films excluded', () => {
    const history = [hRow({ movie_id: 1 })] // only movie 1 is watched/in the Diary
    const ratings = [
      { movie_id: 1, rating: 8 },    // in Diary → counts (display 4.0)
      { movie_id: 999, rating: 2 },  // rated but NOT in Diary → MUST be excluded
    ]
    // old (buggy) scope would average (8+2)/2/2 = 2.5; Diary-scoped = 8/2 = 4.0
    expect(deriveStats({ history, ratings }).avgRating).toBe(4)
  })

  it('3b. a rating whose film was REMOVED from the Diary (no history row) does not count', () => {
    const history = [hRow({ movie_id: 1, watched_at: '2026-03-09T20:00:00' })]
    const ratings = [{ movie_id: 1, rating: 6 }, { movie_id: 2, rating: 10 }] // 2 was removed from Diary
    expect(deriveStats({ history, ratings }).avgRating).toBe(3) // 6/2 only
  })

  it('4/5. unrated Diary films excluded from the denominator; zero rated Diary films → 0', () => {
    const history = [hRow({ movie_id: 1 }), hRow({ movie_id: 2 })]
    expect(deriveStats({ history, ratings: [{ movie_id: 1, rating: 10 }] }).avgRating).toBe(5) // only movie 1 rated → 10/2
    expect(deriveStats({ history, ratings: [] }).avgRating).toBe(0)
  })

  it('12. a rating for a film with null watched_at (not in the visible Diary) is excluded', () => {
    const history = [hRow({ movie_id: 1, watched_at: null })]
    expect(deriveStats({ history, ratings: [{ movie_id: 1, rating: 10 }] }).avgRating).toBe(0)
  })

  it('11. NO streak field is returned', () => {
    const s = deriveStats({ history: [hRow()], ratings: [] })
    expect(s).not.toHaveProperty('streakDays')
    expect(Object.keys(s).sort()).toEqual(['avgRating', 'thisMonthCount', 'totalHours', 'totalLogged'])
  })

  it('10. thisMonthCount counts only rows in the current local month', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 2, 10, 12, 0, 0)) // March
    const history = [hRow({ watched_at: '2026-03-02T10:00:00' }), hRow({ movie_id: 2, watched_at: '2026-02-27T10:00:00' })]
    expect(deriveStats({ history, ratings: [] }).thisMonthCount).toBe(1)
  })
})

describe('matchesQuery — Diary search (title / director / review, NOT film mood)', () => {
  const e = { title: 'Past Lives', dir: 'Celine Song', review: 'Quiet and aching.', filmMood: 'Tender' }
  it('22/23/24. matches title, director, and review; empty query matches all', () => {
    expect(matchesQuery(e, 'past')).toBe(true)
    expect(matchesQuery(e, 'celine')).toBe(true)
    expect(matchesQuery(e, 'aching')).toBe(true)
    expect(matchesQuery(e, '')).toBe(true)
  })
  it('25. does NOT match on the FILM mood (it is not a user note)', () => {
    expect(matchesQuery(e, 'tender')).toBe(false)
    expect(matchesQuery(e, 'zzz')).toBe(false)
  })
})
