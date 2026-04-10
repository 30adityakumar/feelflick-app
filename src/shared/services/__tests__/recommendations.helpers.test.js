// Unit tests for pure helper functions in the recommendation engine.
// These tests run entirely offline — no Supabase, no network required.

import { beforeAll, afterAll, afterEach, describe, it, expect, vi } from 'vitest'

let normalizeNumericIdArray
let clamp
let safeLower
let RECOMMENDATION_CONSTANTS
let RECOMMENDATION_TEST_HELPERS

beforeAll(async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
  vi.stubEnv('VITE_TMDB_API_KEY', 'test-tmdb-key')

  const recommendationsModule = await import('../recommendations')

  ;({
    normalizeNumericIdArray,
    clamp,
    safeLower,
    RECOMMENDATION_CONSTANTS,
    RECOMMENDATION_TEST_HELPERS,
  } = recommendationsModule)
})

afterEach(() => {
  vi.useRealTimers()
})

afterAll(() => {
  vi.unstubAllEnvs()
})

// ---------------------------------------------------------------------------
// normalizeNumericIdArray
// ---------------------------------------------------------------------------
describe('normalizeNumericIdArray', () => {
  it('returns sorted unique numbers', () => {
    expect(normalizeNumericIdArray([3, 1, 2, 1])).toEqual([1, 2, 3])
  })

  it('coerces string numbers', () => {
    expect(normalizeNumericIdArray(['10', '5', '10'])).toEqual([5, 10])
  })

  it('drops nulls, undefineds, and empty strings', () => {
    expect(normalizeNumericIdArray([null, undefined, '', 7])).toEqual([7])
  })

  it('drops NaN values', () => {
    expect(normalizeNumericIdArray(['abc', NaN, 4])).toEqual([4])
  })

  it('returns empty array for empty input', () => {
    expect(normalizeNumericIdArray([])).toEqual([])
  })

  it('returns empty array when called with no argument', () => {
    expect(normalizeNumericIdArray()).toEqual([])
  })

  it('returns empty array for all-invalid input', () => {
    expect(normalizeNumericIdArray([null, undefined, ''])).toEqual([])
  })

  it('handles large numbers without precision loss', () => {
    const big = 999999999
    expect(normalizeNumericIdArray([big])).toEqual([big])
  })

  it('deduplicates mixed numeric types', () => {
    expect(normalizeNumericIdArray([1, '1', 1.0])).toEqual([1])
  })
})

// ---------------------------------------------------------------------------
// clamp
// ---------------------------------------------------------------------------
describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('returns lo when value is below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })

  it('returns hi when value is above range', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('returns lo when value equals lo', () => {
    expect(clamp(0, 0, 10)).toBe(0)
  })

  it('returns hi when value equals hi', () => {
    expect(clamp(10, 0, 10)).toBe(10)
  })

  it('works with floats', () => {
    expect(clamp(1.5, 0, 1)).toBe(1)
    expect(clamp(0.5, 0, 1)).toBe(0.5)
  })

  it('works with negative ranges', () => {
    expect(clamp(-3, -10, -1)).toBe(-3)
    expect(clamp(0, -10, -1)).toBe(-1)
    expect(clamp(-20, -10, -1)).toBe(-10)
  })

  it('works when lo equals hi (degenerate range)', () => {
    expect(clamp(99, 5, 5)).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// safeLower
// ---------------------------------------------------------------------------
describe('safeLower', () => {
  it('lowercases a normal string', () => {
    expect(safeLower('Hello World')).toBe('hello world')
  })

  it('returns empty string for null', () => {
    expect(safeLower(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(safeLower(undefined)).toBe('')
  })

  it('returns empty string for a number', () => {
    expect(safeLower(42)).toBe('')
  })

  it('returns empty string for an object', () => {
    expect(safeLower({})).toBe('')
  })

  it('handles already-lowercase strings', () => {
    expect(safeLower('korean')).toBe('korean')
  })

  it('handles mixed case with special characters', () => {
    expect(safeLower('Sci-Fi & DRAMA')).toBe('sci-fi & drama')
  })

  it('handles empty string', () => {
    expect(safeLower('')).toBe('')
  })
})

// ---------------------------------------------------------------------------
// recommendation constants + helper scoring internals
// ---------------------------------------------------------------------------
describe('recommendation internals', () => {
  it('keeps THRESHOLDS constants stable', () => {
    expect(RECOMMENDATION_CONSTANTS.THRESHOLDS.MIN_FF_RATING).toBe(6.5)
    expect(RECOMMENDATION_CONSTANTS.THRESHOLDS.MIN_FF_CONFIDENCE).toBe(50)
    expect(RECOMMENDATION_CONSTANTS.THRESHOLDS.MIN_FILMS_FOR_LANGUAGE_PREF).toBe(3)
    expect(RECOMMENDATION_CONSTANTS.THRESHOLDS.MIN_FILMS_FOR_AFFINITY).toBe(2)
    expect(RECOMMENDATION_CONSTANTS.THRESHOLDS.MIN_VOTE_COUNT).toBe(150)
  })

  it('applies recency decay buckets in computeNegativeSignals', () => {
    vi.setSystemTime(new Date('2026-04-10T00:00:00.000Z'))

    const skipFeedback = [
      { movie_id: 1, shown_at: '2026-04-05T00:00:00.000Z' }, // <30d => 1.0
      { movie_id: 1, shown_at: '2026-01-20T00:00:00.000Z' }, // >30d => 0.75
      { movie_id: 1, shown_at: '2025-12-10T00:00:00.000Z' }, // >90d => 0.5
      { movie_id: 1, shown_at: '2025-09-01T00:00:00.000Z' }, // >180d => 0.2
      { movie_id: 2, shown_at: '2026-04-08T00:00:00.000Z' }, // <30d => 1.0
    ]

    const watchHistory = [
      {
        movie_id: 1,
        movies: {
          genres: [18],
          director_name: 'Dir A',
          original_language: 'en',
          lead_actor_name: 'Actor A',
        },
      },
      {
        movie_id: 2,
        movies: {
          genres: [18],
          director_name: 'Dir A',
          original_language: 'en',
          lead_actor_name: 'Actor A',
        },
      },
    ]

    const negativeSignals = RECOMMENDATION_TEST_HELPERS.computeNegativeSignals(skipFeedback, watchHistory)

    expect(negativeSignals.totalSkips).toBe(5)
    expect(negativeSignals.skippedGenres).toEqual([{ id: 18, skipCount: 3.45 }])
    expect(negativeSignals.skippedDirectors).toEqual([{ name: 'dir a', skipCount: 3.45 }])
    expect(negativeSignals.skippedLanguages).toEqual([{ language: 'en', skipCount: 3.45 }])
    expect(negativeSignals.skippedActors).toEqual([{ name: 'actor a', skipCount: 3.45 }])
  })

  it('keeps anti-recency bias helpers bounded', () => {
    vi.setSystemTime(new Date('2026-04-10T00:00:00.000Z'))

    const profile = {
      preferences: {
        preferredDecades: ['1990s', '2000s'],
        toleratesClassics: true,
      },
    }
    const classicsProfile = {
      preferences: {
        preferredDecades: ['2000s'],
        toleratesClassics: true,
      },
    }

    expect(RECOMMENDATION_TEST_HELPERS.scoreEraMatch({ release_year: 1997 }, profile)).toBe(8)
    expect(RECOMMENDATION_TEST_HELPERS.scoreEraMatch({ release_year: 2012 }, profile)).toBe(4)
    expect(RECOMMENDATION_TEST_HELPERS.scoreEraMatch({ release_year: 1988 }, classicsProfile)).toBe(2)
    expect(RECOMMENDATION_TEST_HELPERS.scoreEraMatch({ release_year: 2024 }, profile)).toBe(0)

    expect(RECOMMENDATION_TEST_HELPERS.scoreRecency({ release_year: 2026 })).toBe(15)
    expect(RECOMMENDATION_TEST_HELPERS.scoreRecency({ release_year: 2025 })).toBe(10)
    expect(RECOMMENDATION_TEST_HELPERS.scoreRecency({ release_year: 2023 })).toBe(5)
    expect(RECOMMENDATION_TEST_HELPERS.scoreRecency({ release_year: 2010 })).toBe(0)
  })
})
