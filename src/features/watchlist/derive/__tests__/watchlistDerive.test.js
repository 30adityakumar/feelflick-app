import { describe, it, expect } from 'vitest'
import {
  capitalize, pickPrimaryMood, daysAgo, savedAgeLabel,
  deriveItems, deriveAvailableMoods, SORTS, sortItems,
} from '../watchlistDerive'

// F6.4 — the Watchlist derivation is now CALM SAVED-INTENT: no match %, no approx score,
// no "perfect", no "stale", and NO recommendation profile/fingerprint input. (The F6.2
// match/perfect/stale/approx pins were removed deliberately — that behavior no longer
// exists.) Only honest saved-film attributes + deterministic saved-date ordering remain.

const ago = (days) => new Date(Date.now() - days * 86400000).toISOString()
const row = (over = {}) => ({ movie_id: 1, added_at: ago(1), status: 'want_to_watch', movies: { id: 11, tmdb_id: 101, title: 'A', mood_tags: ['tender'], release_date: '2020-06-15', runtime: 120, director_name: 'D', poster_path: '/p.jpg' }, ...over })

describe('helpers', () => {
  it('capitalize / pickPrimaryMood', () => {
    expect(capitalize('comfort_watch')).toBe('Comfort watch')
    expect(pickPrimaryMood(['tender', 'cozy'])).toBe('Tender')
    expect(pickPrimaryMood([])).toBeNull()
  })
  it('daysAgo floors to whole days, never negative', () => {
    expect(daysAgo(ago(5))).toBe(5)
    expect(daysAgo(null)).toBe(0)
  })
  it('2. savedAgeLabel uses neutral, non-guilt phrasing (no stale/waiting/overdue)', () => {
    expect(savedAgeLabel(ago(0))).toBe('Saved today')
    expect(savedAgeLabel(ago(1))).toBe('Saved yesterday')
    expect(savedAgeLabel(ago(5))).toBe('Saved 5 days ago')
    expect(savedAgeLabel(ago(120))).toMatch(/^Saved on /)
    for (const l of [savedAgeLabel(ago(0)), savedAgeLabel(ago(5)), savedAgeLabel(ago(120))]) {
      expect(l).not.toMatch(/stale|waiting|overdue|cut|queue/i)
    }
  })
})

describe('deriveItems (saved-film presentation; no scoring)', () => {
  it('1/3/12. preserves identity + metadata + film mood; missing metadata degrades safely', () => {
    const [a] = deriveItems({ rows: [row()] })
    expect(a).toMatchObject({ id: 1, internalId: 11, tmdbId: 101, title: 'A', mood: 'Tender' })
    expect(a.poster).toContain('w500')
    const [b] = deriveItems({ rows: [{ movie_id: 2, added_at: null, movies: {} }] })
    expect(b).toMatchObject({ id: 2, title: 'Untitled', dir: '—', mood: 'Mixed', runtime: 0, poster: null })
  })

  it('2. derives saved age/date label', () => {
    const [a] = deriveItems({ rows: [row({ added_at: ago(3) })] })
    expect(a.addedDaysAgo).toBe(3)
    expect(a.savedLabel).toBe('Saved 3 days ago')
    expect(a.savedDate).toBeTruthy()
  })

  it('4. preserves backend saved-date order (map, no re-sort)', () => {
    const items = deriveItems({ rows: [row({ movie_id: 3, added_at: ago(1) }), row({ movie_id: 1, added_at: ago(5) })] })
    expect(items.map(i => i.id)).toEqual([3, 1])
  })

  it('10/11. NO rendered item property exposes match/perfect/stale/rank — and no profile input is needed', () => {
    const [a] = deriveItems({ rows: [row()] }) // note: called with { rows } only — no fingerprint/profile
    for (const k of ['match', 'matchPct', 'approximateMatch', 'perfect', 'stale', 'rank', 'why']) {
      expect(a).not.toHaveProperty(k)
    }
  })
})

describe('deriveAvailableMoods', () => {
  it('9. reflects only present film moods (excludes Mixed), ranked by count', () => {
    const items = [{ mood: 'Tender' }, { mood: 'Tender' }, { mood: 'Cozy' }, { mood: 'Mixed' }]
    expect(deriveAvailableMoods(items).map(m => [m.mood, m.count])).toEqual([['Tender', 2], ['Cozy', 1]])
  })
})

describe('sortItems (deterministic saved-intent ordering)', () => {
  const items = [
    { id: 1, addedAt: ago(2), runtime: 120, title: 'Banana' },
    { id: 2, addedAt: ago(5), runtime: 90, title: 'Apple' },
    { id: 3, addedAt: ago(1), runtime: 0, title: 'Cherry' },
  ]
  it('5. recent (default) = added_at descending', () => {
    expect(sortItems(items, 'recent').map(i => i.id)).toEqual([3, 1, 2])
    expect(sortItems(items, 'whatever').map(i => i.id)).toEqual([3, 1, 2]) // default
  })
  it('6. oldest = added_at ascending', () => {
    expect(sortItems(items, 'oldest').map(i => i.id)).toEqual([2, 1, 3])
  })
  it('7. runtime ascending, missing runtime (0) first', () => {
    expect(sortItems(items, 'runtime').map(i => i.id)).toEqual([3, 2, 1])
  })
  it('8. title alphabetical', () => {
    expect(sortItems(items, 'title').map(i => i.title)).toEqual(['Apple', 'Banana', 'Cherry'])
  })
  it('exposes the SORTS list, default included', () => {
    expect(SORTS).toContain('recent')
    expect(SORTS).not.toContain('match')
  })
})
