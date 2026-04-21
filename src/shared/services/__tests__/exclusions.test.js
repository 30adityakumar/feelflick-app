import { describe, expect, it, vi } from 'vitest'

// Mock recommendations module — exclusions.js imports GENRE_ID_TO_NAME and extractGenreId from it
vi.mock('../recommendations', () => ({
  RECOMMENDATION_CONSTANTS: {
    GENRE_ID_TO_NAME: {
      16: 'Animation',
      27: 'Horror',
      28: 'Action',
      35: 'Comedy',
      99: 'Documentary',
      18: 'Drama',
      10751: 'Family',
      10402: 'Music',
      10752: 'War',
      37: 'Western',
    },
  },
  extractGenreId: (g) => {
    if (typeof g === 'object' && g?.id) return typeof g.id === 'number' ? g.id : parseInt(g.id, 10)
    if (typeof g === 'number') return g
    return null
  },
}))

import {
  applyGenreExclusions,
  applyLanguageFilter,
  applyContentGates,
  applyCommunitySkipExclusion,
  applyAllExclusions,
  filterExclusionsClientSide,
  ERA_FLOOR_COLD,
} from '../exclusions'

// === HELPERS ===

/** Minimal chainable mock that records calls for assertion */
function mockQuery() {
  const calls = []
  const chain = {
    not: vi.fn((...args) => { calls.push({ method: 'not', args }); return chain }),
    in: vi.fn((...args) => { calls.push({ method: 'in', args }); return chain }),
    gte: vi.fn((...args) => { calls.push({ method: 'gte', args }); return chain }),
    _calls: calls,
  }
  return chain
}

// Test user profile matching user 9457cad5 (15 watches, warming tier)
const TEST_PROFILE_V3 = {
  filters: {
    excluded_genre_ids: new Set([16]), // Animation
    language_primary: 'en',
    era_floor: 1990,
    runtime_band: [80, 180],
  },
  languages: {
    primary: 'en',
    distributionSorted: [{ lang: 'en' }, { lang: 'fr' }],
  },
  content_shape: {
    pacing: { p20: 3.5 },
    intensity: { p20: 2.8 },
  },
  community: {
    high_skip_rate_ids: new Set([999, 888]),
  },
  negative: {
    personal_skipped_ids: new Set([777]),
  },
  meta: {
    total_watches: 15,
  },
}

// v2 shape profile for backward-compat testing
const TEST_PROFILE_V2 = {
  exclusions: {
    genreIds: new Set([16]),
    genreNames: ['Animation'],
  },
  languages: {
    primary: 'en',
    distributionSorted: [{ lang: 'en' }],
  },
  qualityProfile: {
    totalMoviesWatched: 15,
  },
}

// === DB-LEVEL EXCLUSION TESTS ===

describe('applyGenreExclusions', () => {
  it('excludes Animation for v3 profile with excluded_genre_ids', () => {
    const query = mockQuery()
    const result = applyGenreExclusions(query, TEST_PROFILE_V3)
    expect(result).toBe(query)
    expect(query.not).toHaveBeenCalledWith('genres', 'cs', '["Animation"]')
  })

  it('excludes Animation for v2 profile with genreNames', () => {
    const query = mockQuery()
    applyGenreExclusions(query, TEST_PROFILE_V2)
    expect(query.not).toHaveBeenCalledWith('genres', 'cs', '["Animation"]')
  })

  it('returns query unchanged when no excluded genres', () => {
    const query = mockQuery()
    const result = applyGenreExclusions(query, { filters: {} })
    expect(result).toBe(query)
    expect(query.not).not.toHaveBeenCalled()
  })

  it('handles null profile gracefully', () => {
    const query = mockQuery()
    const result = applyGenreExclusions(query, null)
    expect(result).toBe(query)
    expect(query.not).not.toHaveBeenCalled()
  })

  it('handles excluded_genre_ids as plain array (deserialized from JSON)', () => {
    const query = mockQuery()
    applyGenreExclusions(query, { filters: { excluded_genre_ids: [27, 99] } })
    expect(query.not).toHaveBeenCalledTimes(2)
    expect(query.not).toHaveBeenCalledWith('genres', 'cs', '["Horror"]')
    expect(query.not).toHaveBeenCalledWith('genres', 'cs', '["Documentary"]')
  })
})

describe('applyLanguageFilter', () => {
  it('restricts to en and fr for user with those languages', () => {
    const query = mockQuery()
    applyLanguageFilter(query, TEST_PROFILE_V3)
    expect(query.in).toHaveBeenCalledTimes(1)
    const [col, langs] = query.in.mock.calls[0]
    expect(col).toBe('original_language')
    expect(langs).toContain('en')
    expect(langs).toContain('fr')
  })

  it('returns query unchanged when no language_primary', () => {
    const query = mockQuery()
    const result = applyLanguageFilter(query, { filters: {} })
    expect(result).toBe(query)
    expect(query.in).not.toHaveBeenCalled()
  })

  it('uses v2 languages.primary fallback', () => {
    const query = mockQuery()
    applyLanguageFilter(query, TEST_PROFILE_V2)
    expect(query.in).toHaveBeenCalledTimes(1)
    const [, langs] = query.in.mock.calls[0]
    expect(langs).toContain('en')
  })
})

describe('applyContentGates', () => {
  it('skipped when total_watches < 10', () => {
    const query = mockQuery()
    const coldProfile = {
      ...TEST_PROFILE_V3,
      meta: { total_watches: 5 },
    }
    const result = applyContentGates(query, coldProfile)
    expect(result).toBe(query)
    expect(query.gte).not.toHaveBeenCalled()
  })

  it('applies era floor and runtime min when total_watches >= 10', () => {
    const query = mockQuery()
    applyContentGates(query, TEST_PROFILE_V3)
    expect(query.gte).toHaveBeenCalledWith('release_year', 1990)
    expect(query.gte).toHaveBeenCalledWith('runtime', 80)
  })

  it('applies pacing and intensity floors from content_shape', () => {
    const query = mockQuery()
    applyContentGates(query, TEST_PROFILE_V3)
    // p20=3.5 → 35 on 100-scale
    expect(query.gte).toHaveBeenCalledWith('pacing_score_100', 35)
    // p20=2.8 → 28 on 100-scale
    expect(query.gte).toHaveBeenCalledWith('intensity_score_100', 28)
  })

  it('uses v2 qualityProfile.totalMoviesWatched fallback', () => {
    const query = mockQuery()
    // v2 profile has no filters.era_floor, so only total_watches check matters
    const result = applyContentGates(query, TEST_PROFILE_V2)
    // totalMoviesWatched=15 >= 10 but no era_floor/runtime_band in v2 profile
    expect(result).toBe(query)
  })
})

describe('applyCommunitySkipExclusion', () => {
  it('excludes community high-skip IDs', () => {
    const query = mockQuery()
    applyCommunitySkipExclusion(query, TEST_PROFILE_V3)
    expect(query.not).toHaveBeenCalledTimes(1)
    const [col, op, val] = query.not.mock.calls[0]
    expect(col).toBe('id')
    expect(op).toBe('in')
    // Should contain both IDs
    expect(val).toContain('999')
    expect(val).toContain('888')
  })

  it('returns query unchanged when no skip IDs', () => {
    const query = mockQuery()
    const result = applyCommunitySkipExclusion(query, { community: {} })
    expect(result).toBe(query)
    expect(query.not).not.toHaveBeenCalled()
  })
})

describe('applyAllExclusions', () => {
  it('chains all 4 exclusion layers', () => {
    const query = mockQuery()
    applyAllExclusions(query, TEST_PROFILE_V3)
    // Genre: 1 not call (Animation)
    // Community: 1 not call (id exclusion)
    // Language: 1 in call
    // Content gates: 4 gte calls (era, runtime, pacing, intensity)
    expect(query.not).toHaveBeenCalledTimes(2)
    expect(query.in).toHaveBeenCalledTimes(1)
    expect(query.gte).toHaveBeenCalledTimes(4)
  })

  it('returns query unchanged for null profile', () => {
    const query = mockQuery()
    const result = applyAllExclusions(query, null)
    expect(result).toBe(query)
    expect(query._calls).toHaveLength(0)
  })
})

// === CLIENT-SIDE EXCLUSION TESTS ===

describe('filterExclusionsClientSide', () => {
  const baseCandidates = [
    { id: 1, genres: [{ id: 28 }], original_language: 'en', release_year: 2020, runtime: 120 },
    { id: 2, genres: [{ id: 16 }], original_language: 'en', release_year: 2021, runtime: 95 },  // Animation → excluded
    { id: 3, genres: [{ id: 35 }], original_language: 'ja', release_year: 2019, runtime: 110 },  // Japanese → excluded (not in allowed)
    { id: 4, genres: [{ id: 18 }], original_language: 'en', release_year: 1985, runtime: 100 },  // Before era floor
    { id: 5, genres: [{ id: 18 }], original_language: 'fr', release_year: 2022, runtime: 60 },   // Below runtime min
    { id: 999, genres: [{ id: 28 }], original_language: 'en', release_year: 2023, runtime: 130 }, // Community skip
    { id: 777, genres: [{ id: 28 }], original_language: 'en', release_year: 2023, runtime: 130 }, // Personal skip
    { id: 10, genres: [{ id: 28 }], original_language: 'en', release_year: 2023, runtime: 130 },  // Clean — should pass
  ]

  it('filters embedding results correctly (all layers)', () => {
    const result = filterExclusionsClientSide(baseCandidates, TEST_PROFILE_V3)
    const ids = result.map(m => m.id)
    // Only id=1 and id=10 should pass all filters
    expect(ids).toContain(1)
    expect(ids).toContain(10)
    expect(ids).not.toContain(2)   // Animation
    expect(ids).not.toContain(3)   // Japanese
    expect(ids).not.toContain(4)   // Era floor
    expect(ids).not.toContain(5)   // Runtime
    expect(ids).not.toContain(999) // Community skip
    expect(ids).not.toContain(777) // Personal skip
  })

  it('uses .some() not .every() for genre exclusion', () => {
    // Movie with multiple genres, one of which is excluded
    const mixedGenreMovie = [
      { id: 50, genres: [{ id: 28 }, { id: 16 }], original_language: 'en', release_year: 2023, runtime: 120 },
    ]
    const result = filterExclusionsClientSide(mixedGenreMovie, TEST_PROFILE_V3)
    // Should be excluded because it has Animation (16), even though it also has Action (28)
    expect(result).toHaveLength(0)
  })

  it('skips content gates when total_watches < 10', () => {
    const coldProfile = {
      ...TEST_PROFILE_V3,
      meta: { total_watches: 5 },
    }
    const oldMovie = [
      { id: 60, genres: [{ id: 28 }], original_language: 'en', release_year: 1985, runtime: 60 },
    ]
    const result = filterExclusionsClientSide(oldMovie, coldProfile)
    // Era floor and runtime min should NOT apply for cold user
    expect(result).toHaveLength(1)
  })

  it('returns empty array for null candidates', () => {
    const result = filterExclusionsClientSide(null, TEST_PROFILE_V3)
    expect(result).toEqual([])
  })

  it('returns candidates unchanged for null profile', () => {
    const candidates = [{ id: 1, genres: [] }]
    const result = filterExclusionsClientSide(candidates, null)
    expect(result).toEqual(candidates)
  })

  it('handles deserialized Set (plain array) for excluded_genre_ids', () => {
    const deserializedProfile = {
      filters: { excluded_genre_ids: [16] }, // Array, not Set
      meta: { total_watches: 5 },
    }
    const candidates = [
      { id: 1, genres: [{ id: 16 }], original_language: 'en' },
      { id: 2, genres: [{ id: 28 }], original_language: 'en' },
    ]
    const result = filterExclusionsClientSide(candidates, deserializedProfile)
    expect(result.map(m => m.id)).toEqual([2])
  })
})

// === CONSTANT TESTS ===

describe('ERA_FLOOR_COLD', () => {
  it('equals 2000', () => {
    expect(ERA_FLOOR_COLD).toBe(2000)
  })
})
