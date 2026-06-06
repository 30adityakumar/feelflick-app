// src/features/onboarding/__tests__/suggestionPool.test.js
// Focused tests for the extracted suggestion-pool PURE functions (no live
// Supabase / TMDB). Pins the scoring + collection-dedup + merge + shape
// contracts so a future MoviesStep redesign cannot silently drift the engine.
import { describe, it, expect } from 'vitest'
import {
  mergeUnique,
  shapeFilm,
  scoreCandidates,
  dedupByCollection,
} from '../suggestionPool'

describe('suggestionPool.shapeFilm', () => {
  it('maps a DB row to the picker shape (tmdb_id→id, id→internalId)', () => {
    const row = {
      id: 'uuid-1',
      tmdb_id: 603,
      title: 'The Matrix',
      poster_path: '/m.jpg',
      release_date: '1999-03-31',
      primary_genre: 'Science Fiction',
      extra: 'ignored',
    }
    expect(shapeFilm(row)).toEqual({
      id: 603,
      internalId: 'uuid-1',
      title: 'The Matrix',
      poster_path: '/m.jpg',
      release_date: '1999-03-31',
    })
  })
})

describe('suggestionPool.mergeUnique', () => {
  it('dedupes by tmdb_id, preserving the first occurrence and order', () => {
    const a = [{ tmdb_id: 1, title: 'A1' }, { tmdb_id: 2, title: 'A2' }]
    const b = [{ tmdb_id: 2, title: 'B2-dupe' }, { tmdb_id: 3, title: 'B3' }]
    const out = mergeUnique([a, b])
    expect(out.map(m => m.tmdb_id)).toEqual([1, 2, 3])
    expect(out.find(m => m.tmdb_id === 2).title).toBe('A2') // first occurrence wins
  })

  it('skips rows without a tmdb_id', () => {
    const out = mergeUnique([[{ title: 'no-id' }, { tmdb_id: 5 }]])
    expect(out.map(m => m.tmdb_id)).toEqual([5])
  })
})

describe('suggestionPool.scoreCandidates', () => {
  // Use the current year so the recency ramp contributes 0 — keeps the
  // arithmetic assertions deterministic regardless of when the suite runs.
  const year = new Date().getFullYear()

  it('sorts descending by score; quality (ff_audience_rating) drives the base', () => {
    const films = [
      { tmdb_id: 1, ff_audience_rating: 70, release_year: year },
      { tmdb_id: 2, ff_audience_rating: 90, release_year: year },
    ]
    const out = scoreCandidates(films, { dbNames: [], tagSet: [] })
    expect(out.map(m => m.tmdb_id)).toEqual([2, 1])
    expect(out.find(m => m.tmdb_id === 2)._score).toBe(90)
  })

  it('adds +4 per overlapping mood tag and +6 for a primary-genre match', () => {
    const out = scoreCandidates(
      [{ tmdb_id: 1, ff_audience_rating: 50, release_year: year, mood_tags: ['cozy', 'tender'], primary_genre: 'Drama' }],
      { dbNames: ['Drama'], tagSet: ['cozy', 'tender'] },
    )
    // base 50 + 2 overlaps × 4 (8) + genre 6 = 64
    expect(out[0]._score).toBe(64)
  })

  it('defaults a missing rating to base 50', () => {
    const out = scoreCandidates([{ tmdb_id: 1, release_year: year }], { dbNames: [], tagSet: [] })
    expect(out[0]._score).toBe(50)
  })
})

describe('suggestionPool.dedupByCollection', () => {
  it('penalizes the 2nd+ film from the same collection by 20 and re-sorts', () => {
    const scored = [
      { tmdb_id: 1, collection_id: 'godfather', _score: 100 },
      { tmdb_id: 2, collection_id: 'godfather', _score: 98 },
      { tmdb_id: 3, collection_id: null, _score: 85 },
    ]
    const out = dedupByCollection(scored)
    // film 2 drops 98 → 78, sinking below film 3 (85)
    expect(out.map(m => m.tmdb_id)).toEqual([1, 3, 2])
    expect(out.find(m => m.tmdb_id === 2)._score).toBe(78)
  })

  it('leaves films without a collection untouched', () => {
    const scored = [{ tmdb_id: 1, _score: 50 }, { tmdb_id: 2, _score: 40 }]
    const out = dedupByCollection(scored)
    expect(out.map(m => m._score)).toEqual([50, 40])
  })
})
