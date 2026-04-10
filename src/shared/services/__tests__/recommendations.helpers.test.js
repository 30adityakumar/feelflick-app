import { vi, describe, it, expect, afterEach } from 'vitest'

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
vi.hoisted(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
  vi.stubEnv('VITE_TMDB_API_KEY', 'test-tmdb-key')
})

import {
  normalizeNumericIdArray,
  clamp,
  safeLower,
  RECOMMENDATION_CONSTANTS,
  RECOMMENDATION_TEST_HELPERS,
} from '../recommendations'

const { THRESHOLDS } = RECOMMENDATION_CONSTANTS
const { computeNegativeSignals, scoreEraMatch, scoreRecency } = RECOMMENDATION_TEST_HELPERS

afterEach(() => {
  vi.useRealTimers()
})

afterAll(() => {
  vi.unstubAllEnvs()
})

describe('normalizeNumericIdArray', () => {
  it('returns sorted unique numbers', () => {
    expect(normalizeNumericIdArray([3, 1, 2, 1])).toEqual([1, 2, 3])
  })

  it('coerces string numbers', () => {
    expect(normalizeNumericIdArray(['10', '5', '10'])).toEqual([5, 10])
  })

  it('drops nulls, undefined, empty strings, and NaN values', () => {
    expect(normalizeNumericIdArray([null, undefined, '', 'abc', NaN, 4])).toEqual([4])
  })

  it('returns empty array for empty or missing input', () => {
    expect(normalizeNumericIdArray([])).toEqual([])
    expect(normalizeNumericIdArray()).toEqual([])
  })
})

describe('scalar helpers', () => {
  it('clamp bounds numbers as expected', () => {
    expect(clamp(10, 0, 5)).toBe(5)
    expect(clamp(-2, 0, 5)).toBe(0)
    expect(clamp(3, 0, 5)).toBe(3)
  })

  it('safeLower lowercases strings and handles non-strings safely', () => {
    expect(safeLower('HELLO')).toBe('hello')
    expect(safeLower(null)).toBe('')
    expect(safeLower(42)).toBe('')
  })
})

describe('recommendation helpers', () => {
  it('keeps THRESHOLDS constants at expected values', () => {
    expect(THRESHOLDS.MIN_FF_RATING).toBe(6.5)
    expect(THRESHOLDS.MIN_FF_CONFIDENCE).toBe(50)
    expect(THRESHOLDS.MIN_FILMS_FOR_LANGUAGE_PREF).toBe(3)
    expect(THRESHOLDS.MIN_FILMS_FOR_AFFINITY).toBe(2)
    expect(THRESHOLDS.MIN_VOTE_COUNT).toBe(150)
  })

  it('applies time-decay buckets to negative skip signals', () => {
    const now = new Date('2026-04-10T00:00:00.000Z')
    vi.setSystemTime(now)

    const skipFeedback = [
      { movie_id: 1, shown_at: '2026-03-15T00:00:00.000Z' }, // <30d => 1.0
      { movie_id: 1, shown_at: '2025-12-10T00:00:00.000Z' }, // >90d => 0.5
      { movie_id: 2, shown_at: '2025-09-01T00:00:00.000Z' }, // >180d => 0.2
      { movie_id: 2, shown_at: '2026-01-20T00:00:00.000Z' }, // >30d => 0.75
      { movie_id: 3, shown_at: '2026-04-01T00:00:00.000Z' }, // <30d => 1.0
      { movie_id: 1, shown_at: '2026-04-05T00:00:00.000Z' }, // <30d => 1.0
    ]

    const watchHistory = [
      {
        movie_id: 1,
        movies: { genres: [18], director_name: 'Dir A', original_language: 'en', lead_actor_name: 'Actor A' },
      },
      {
        movie_id: 2,
        movies: { genres: [18], director_name: 'Dir A', original_language: 'en', lead_actor_name: 'Actor B' },
      },
      {
        movie_id: 3,
        movies: { genres: [35], director_name: 'Dir C', original_language: 'es', lead_actor_name: 'Actor C' },
      },
    ]

    const negative = computeNegativeSignals(skipFeedback, watchHistory)
    const drama = negative.skippedGenres.find((genre) => genre.id === 18)

    expect(drama?.skipCount).toBeCloseTo(3.45, 2)
    expect(negative.skippedDirectors.find((director) => director.name === 'dir a')).toBeDefined()
    expect(negative.skippedLanguages.find((language) => language.language === 'en')).toBeDefined()
    expect(negative.totalSkips).toBe(6)
  })

  it('rewards preferred and adjacent decades in scoreEraMatch', () => {
    const profile = {
      preferences: {
        preferredDecades: ['1990s', '2000s'],
        toleratesClassics: true,
      },
    }

    expect(scoreEraMatch({ release_year: 1997 }, profile)).toBe(8)
    expect(scoreEraMatch({ release_year: 2012 }, profile)).toBe(4)

    const classicsProfile = {
      preferences: {
        preferredDecades: ['2000s'],
        toleratesClassics: true,
      },
    }

    expect(scoreEraMatch({ release_year: 1988 }, classicsProfile)).toBe(2)
    expect(scoreEraMatch({ release_year: 2024 }, profile)).toBe(0)
  })

  it('keeps anti-recency bias bounded for older releases in scoreRecency', () => {
    vi.setSystemTime(new Date('2026-04-10T00:00:00.000Z'))

    expect(scoreRecency({ release_year: 2026 })).toBe(15)
    expect(scoreRecency({ release_year: 2025 })).toBe(10)
    expect(scoreRecency({ release_year: 2023 })).toBe(5)
    expect(scoreRecency({ release_year: 2010 })).toBe(0)
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
