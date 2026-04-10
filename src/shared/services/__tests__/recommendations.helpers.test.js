import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  clamp,
  normalizeNumericIdArray,
  RECOMMENDATION_CONSTANTS,
  RECOMMENDATION_TEST_HELPERS,
  safeLower,
} from '../recommendations'

const { THRESHOLDS } = RECOMMENDATION_CONSTANTS
const { computeNegativeSignals, scoreEraMatch, scoreRecency } = RECOMMENDATION_TEST_HELPERS

afterEach(() => {
  vi.useRealTimers()
})

describe('normalizeNumericIdArray', () => {
  it('returns sorted unique numbers', () => {
    expect(normalizeNumericIdArray([3, 1, 2, 1])).toEqual([1, 2, 3])
  })

  it('coerces string numbers', () => {
    expect(normalizeNumericIdArray(['10', '5', '10'])).toEqual([5, 10])
  })

  it('drops nullish and invalid values', () => {
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
    vi.setSystemTime(new Date('2026-04-10T00:00:00.000Z'))

    const skipFeedback = [
      { movie_id: 1, shown_at: '2026-03-15T00:00:00.000Z' },
      { movie_id: 1, shown_at: '2025-12-10T00:00:00.000Z' },
      { movie_id: 2, shown_at: '2025-09-01T00:00:00.000Z' },
      { movie_id: 2, shown_at: '2026-01-20T00:00:00.000Z' },
      { movie_id: 3, shown_at: '2026-04-01T00:00:00.000Z' },
      { movie_id: 1, shown_at: '2026-04-05T00:00:00.000Z' },
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
          lead_actor_name: 'Actor B',
        },
      },
      {
        movie_id: 3,
        movies: {
          genres: [35],
          director_name: 'Dir C',
          original_language: 'es',
          lead_actor_name: 'Actor C',
        },
      },
    ]

    const negativeSignals = computeNegativeSignals(skipFeedback, watchHistory)
    const drama = negativeSignals.skippedGenres.find((genre) => genre.id === 18)

    expect(drama?.skipCount).toBeCloseTo(3.45, 2)
    expect(negativeSignals.skippedDirectors.find((director) => director.name === 'dir a')).toBeDefined()
    expect(negativeSignals.skippedLanguages.find((language) => language.language === 'en')).toBeDefined()
    expect(negativeSignals.totalSkips).toBe(6)
  })

  it('rewards preferred and adjacent decades in scoreEraMatch', () => {
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

    expect(scoreEraMatch({ release_year: 1997 }, profile)).toBe(8)
    expect(scoreEraMatch({ release_year: 2012 }, profile)).toBe(4)
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
