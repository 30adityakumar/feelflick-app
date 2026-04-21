import { describe, expect, it } from 'vitest'

import {
  diversifyRow,
  selectHeroCandidates,
  dayHashIndex,
  softDedupe,
} from '../diversity'

// === HELPERS ===

function makeCandidate(overrides = {}) {
  return {
    id: 1,
    _score: 80,
    director_name: 'Director A',
    primary_genre: 'Action',
    release_year: 2023,
    ...overrides,
  }
}

// ============================================================================
// diversifyRow
// ============================================================================

describe('diversifyRow', () => {
  it('returns empty for empty input', () => {
    expect(diversifyRow([])).toEqual([])
  })

  it('returns all if pool <= target', () => {
    const pool = [makeCandidate({ id: 1 }), makeCandidate({ id: 2 })]
    expect(diversifyRow(pool, 5)).toHaveLength(2)
  })

  it('penalises same director — 5 Nolan films picks 1 Nolan then others', () => {
    const candidates = [
      makeCandidate({ id: 1, _score: 90, director_name: 'Nolan', primary_genre: 'Sci-Fi', release_year: 2020 }),
      makeCandidate({ id: 2, _score: 88, director_name: 'Nolan', primary_genre: 'Thriller', release_year: 2017 }),
      makeCandidate({ id: 3, _score: 86, director_name: 'Nolan', primary_genre: 'Drama', release_year: 2014 }),
      makeCandidate({ id: 4, _score: 84, director_name: 'Nolan', primary_genre: 'War', release_year: 2010 }),
      makeCandidate({ id: 5, _score: 82, director_name: 'Nolan', primary_genre: 'Mystery', release_year: 2006 }),
      makeCandidate({ id: 6, _score: 78, director_name: 'Villeneuve', primary_genre: 'Sci-Fi', release_year: 2021 }),
      makeCandidate({ id: 7, _score: 76, director_name: 'Fincher', primary_genre: 'Thriller', release_year: 2020 }),
      makeCandidate({ id: 8, _score: 74, director_name: 'Scorsese', primary_genre: 'Crime', release_year: 2019 }),
      makeCandidate({ id: 9, _score: 72, director_name: 'Tarantino', primary_genre: 'Western', release_year: 2015 }),
    ]
    const result = diversifyRow(candidates, 5)
    const nolanCount = result.filter(c => c.director_name === 'Nolan').length
    // First pick is Nolan (highest score), but subsequent Nolans get -12 per picked Nolan
    // So non-Nolans should be preferred for remaining slots
    expect(nolanCount).toBeLessThanOrEqual(2)
    expect(result[0].director_name).toBe('Nolan') // highest score still wins #1
  })

  it('penalises same primary genre', () => {
    const candidates = [
      makeCandidate({ id: 1, _score: 90, director_name: 'A', primary_genre: 'Action', release_year: 2020 }),
      makeCandidate({ id: 2, _score: 88, director_name: 'B', primary_genre: 'Action', release_year: 2015 }),
      makeCandidate({ id: 3, _score: 85, director_name: 'C', primary_genre: 'Drama', release_year: 2020 }),
    ]
    const result = diversifyRow(candidates, 3)
    // #1 = Action (90), #2 should be Drama (85) because Action (88) gets -8 genre penalty
    expect(result[1].primary_genre).toBe('Drama')
  })

  it('penalises same release year band (±2)', () => {
    const candidates = [
      makeCandidate({ id: 1, _score: 90, director_name: 'A', primary_genre: 'A', release_year: 2023 }),
      makeCandidate({ id: 2, _score: 86, director_name: 'B', primary_genre: 'B', release_year: 2024 }),
      makeCandidate({ id: 3, _score: 84, director_name: 'C', primary_genre: 'C', release_year: 2018 }),
    ]
    const result = diversifyRow(candidates, 3)
    // #1 = 2023, #2: 2024 gets -4 year penalty (86-4=82), 2018 stays 84 → #2 = 2018
    expect(result[1].release_year).toBe(2018)
  })

  it('target 3, pool of 2 → returns 2', () => {
    const pool = [makeCandidate({ id: 1 }), makeCandidate({ id: 2 })]
    expect(diversifyRow(pool, 3)).toHaveLength(2)
  })
})

// ============================================================================
// selectHeroCandidates
// ============================================================================

describe('selectHeroCandidates', () => {
  it('filters to score >= 65 then diversifies', () => {
    const candidates = [
      makeCandidate({ id: 1, _score: 85, director_name: 'A' }),
      makeCandidate({ id: 2, _score: 80, director_name: 'A' }),
      makeCandidate({ id: 3, _score: 67, director_name: 'B' }),
      makeCandidate({ id: 4, _score: 60, director_name: 'C' }), // below 65, excluded from filtered
    ]
    const result = selectHeroCandidates(candidates, 3)
    expect(result).toHaveLength(3)
    // All 3 from filtered (>=65), id 4 not needed
    expect(result.map(c => c.id)).toEqual(expect.arrayContaining([1, 2, 3]))
  })

  it('backfills from full pool when filtered pool is too small', () => {
    const candidates = [
      makeCandidate({ id: 1, _score: 80, director_name: 'A' }),
      makeCandidate({ id: 2, _score: 60, director_name: 'B' }), // below 65
      makeCandidate({ id: 3, _score: 55, director_name: 'C' }), // below 65
    ]
    const result = selectHeroCandidates(candidates, 3)
    expect(result).toHaveLength(3)
    expect(result[0].id).toBe(1) // from filtered
    // ids 2+3 backfilled from full pool
    expect(result.map(c => c.id)).toContain(2)
    expect(result.map(c => c.id)).toContain(3)
  })

  it('falls back to top N when no candidates >= 65', () => {
    const candidates = [
      makeCandidate({ id: 1, _score: 60 }),
      makeCandidate({ id: 2, _score: 55 }),
    ]
    const result = selectHeroCandidates(candidates, 3)
    expect(result).toHaveLength(2)
    expect(result[0]._score).toBe(60)
  })
})

// ============================================================================
// dayHashIndex
// ============================================================================

describe('dayHashIndex', () => {
  it('returns valid index within range', () => {
    const idx = dayHashIndex('user-123', 3)
    expect(idx).toBeGreaterThanOrEqual(0)
    expect(idx).toBeLessThan(3)
  })

  it('is stable within same call (deterministic)', () => {
    const a = dayHashIndex('user-123', 5)
    const b = dayHashIndex('user-123', 5)
    expect(a).toBe(b)
  })

  it('differs for different users on same day', () => {
    // Not guaranteed by design for ALL pairs, but very likely for distinct inputs
    const results = new Set()
    for (let i = 0; i < 20; i++) {
      results.add(dayHashIndex(`user-${i}`, 10))
    }
    // At least 3 distinct indices among 20 users → not all the same
    expect(results.size).toBeGreaterThanOrEqual(3)
  })

  it('returns 0 for count <= 0', () => {
    expect(dayHashIndex('user', 0)).toBe(0)
    expect(dayHashIndex('user', -1)).toBe(0)
  })

  it('returns 0 for count = 1', () => {
    expect(dayHashIndex('user', 1)).toBe(0)
  })
})

// ============================================================================
// softDedupe
// ============================================================================

describe('softDedupe', () => {
  it('removes films in shownIds when pool stays >= threshold', () => {
    const candidates = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }))
    const shownIds = new Set([1, 2, 3])
    const result = softDedupe(candidates, shownIds, 6)
    expect(result).toHaveLength(7)
    expect(result.every(c => !shownIds.has(c.id))).toBe(true)
  })

  it('keeps dupes when dedup would drop below threshold', () => {
    const candidates = Array.from({ length: 8 }, (_, i) => ({ id: i + 1 }))
    const shownIds = new Set([1, 2, 3, 4, 5]) // would leave only 3
    const result = softDedupe(candidates, shownIds, 6)
    expect(result).toHaveLength(8) // original kept
  })

  it('dedupes with empty shownIds (no-op)', () => {
    const candidates = [{ id: 1 }, { id: 2 }]
    const result = softDedupe(candidates, new Set(), 1)
    expect(result).toHaveLength(2)
  })

  it('handles empty candidates', () => {
    expect(softDedupe([], new Set([1]), 1)).toEqual([])
  })
})
