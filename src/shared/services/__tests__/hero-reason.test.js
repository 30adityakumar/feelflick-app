import { describe, expect, it } from 'vitest'

import {
  heroEraFloor,
  generateHeroReason,
  FIT_HUMAN_LABELS,
  tieBreakSort,
} from '../hero-reason'

// === HELPERS ===

function makeProfile(overrides = {}) {
  return {
    affinity: {
      fit_profiles: [{ profile: 'genre_popcorn', weight: 0.8 }],
      mood_tags: [{ tag: 'cerebral', weight: 0.7 }],
      ...overrides.affinity,
    },
    filters: {
      era_floor: 1990,
      ...overrides.filters,
    },
  }
}

function makeMovie(overrides = {}) {
  return {
    id: 100,
    title: 'Test Movie',
    director_name: 'Test Director',
    primary_genre: 'Drama',
    release_year: 2022,
    ...overrides,
  }
}

function makeBreakdown(overrides = {}) {
  return {
    embedding: 50,
    director_genre: 50,
    mood: 50,
    fit: 50,
    quality: 50,
    ...overrides,
  }
}

// ============================================================================
// heroEraFloor
// ============================================================================

describe('heroEraFloor', () => {
  it('returns max(userP5, 2010) for modern fit profiles', () => {
    const profile = makeProfile({ affinity: { fit_profiles: [{ profile: 'genre_popcorn' }] } })
    expect(heroEraFloor(profile)).toBe(2010)
  })

  it('respects userP5 when higher than 2010 for modern profiles', () => {
    const profile = makeProfile({
      affinity: { fit_profiles: [{ profile: 'crowd_pleaser' }] },
      filters: { era_floor: 2015 },
    })
    expect(heroEraFloor(profile)).toBe(2015)
  })

  it('returns userP5 for arthouse profile (no modern floor)', () => {
    const profile = makeProfile({
      affinity: { fit_profiles: [{ profile: 'arthouse' }] },
      filters: { era_floor: 1970 },
    })
    expect(heroEraFloor(profile)).toBe(1970)
  })

  it('returns userP5 for niche_world_cinema', () => {
    const profile = makeProfile({
      affinity: { fit_profiles: [{ profile: 'niche_world_cinema' }] },
      filters: { era_floor: 1985 },
    })
    expect(heroEraFloor(profile)).toBe(1985)
  })

  it('defaults era_floor to 1985 when missing', () => {
    const profile = { affinity: { fit_profiles: [{ profile: 'arthouse' }] } }
    expect(heroEraFloor(profile)).toBe(1985)
  })

  it('returns 2010 for null/undefined profile', () => {
    expect(heroEraFloor(null)).toBe(2010)
    expect(heroEraFloor(undefined)).toBe(2010)
  })
})

// ============================================================================
// generateHeroReason
// ============================================================================

describe('generateHeroReason', () => {
  it('returns generic for null breakdown', () => {
    const result = generateHeroReason(makeMovie(), null, makeProfile(), new Map())
    expect(result).toEqual({ type: 'generic', text: 'Picked for you' })
  })

  it('returns seed reason when embedding dominates and seed match exists', () => {
    const movie = makeMovie({ id: 100, matched_seed_title: 'Inception' })
    const breakdown = makeBreakdown({ embedding: 80 })
    const seedMap = new Map([[100, new Map([[5, { cosine: 0.9, seedTitle: 'Inception' }]])]])

    const result = generateHeroReason(movie, breakdown, makeProfile(), seedMap)
    expect(result.type).toBe('seed')
    expect(result.text).toBe('Because you loved Inception')
    expect(result.seedId).toBe(5)
  })

  it('returns director reason when director_genre dominates', () => {
    const movie = makeMovie({ director_name: 'Denis Villeneuve' })
    const breakdown = makeBreakdown({ director_genre: 95, embedding: 30 })

    const result = generateHeroReason(movie, breakdown, makeProfile(), new Map())
    expect(result.type).toBe('director')
    expect(result.text).toBe('More from Denis Villeneuve')
  })

  it('returns mood reason when mood dominates', () => {
    const breakdown = makeBreakdown({ mood: 90, embedding: 30, director_genre: 30 })
    const profile = makeProfile({ affinity: { mood_tags: [{ tag: 'cerebral' }] } })

    const result = generateHeroReason(makeMovie(), breakdown, profile, new Map())
    expect(result.type).toBe('mood')
    expect(result.text).toBe('Matches your taste for cerebral films')
  })

  it('returns fit reason when fit is 100', () => {
    const breakdown = makeBreakdown({ fit: 100, embedding: 30, mood: 30 })
    const profile = makeProfile({ affinity: { fit_profiles: [{ profile: 'prestige_drama' }] } })

    const result = generateHeroReason(makeMovie(), breakdown, profile, new Map())
    expect(result.type).toBe('fit')
    expect(result.text).toBe('A prestige drama for you')
  })

  it('returns quality reason when quality dominates', () => {
    const movie = makeMovie({ primary_genre: 'Sci-Fi' })
    const breakdown = makeBreakdown({ quality: 90, embedding: 30, mood: 30, fit: 30 })

    const result = generateHeroReason(movie, breakdown, makeProfile(), new Map())
    expect(result.type).toBe('quality')
    expect(result.text).toBe('Sci-Fi at its best')
  })

  it('falls back to generic when no dimension qualifies', () => {
    const breakdown = makeBreakdown({ embedding: 40, director_genre: 40, mood: 40, fit: 40, quality: 40 })

    const result = generateHeroReason(makeMovie(), breakdown, makeProfile(), new Map())
    expect(result).toEqual({ type: 'generic', text: 'Picked for you' })
  })

  it('uses matched_seed_title as fallback when seedMap entry has no seedTitle', () => {
    const movie = makeMovie({ id: 100, matched_seed_title: 'Blade Runner' })
    const breakdown = makeBreakdown({ embedding: 80 })
    const seedMap = new Map([[100, new Map([[7, { cosine: 0.85 }]])]])

    const result = generateHeroReason(movie, breakdown, makeProfile(), seedMap)
    expect(result.type).toBe('seed')
    expect(result.text).toBe('Because you loved Blade Runner')
  })
})

// ============================================================================
// FIT_HUMAN_LABELS
// ============================================================================

describe('FIT_HUMAN_LABELS', () => {
  it('has labels for all expected fit profiles', () => {
    const expected = [
      'prestige_drama', 'genre_popcorn', 'crowd_pleaser', 'challenging_art',
      'arthouse', 'festival_discovery', 'cult_classic', 'comfort_watch',
      'franchise_entry', 'niche_world_cinema',
    ]
    for (const key of expected) {
      expect(FIT_HUMAN_LABELS[key]).toBeDefined()
    }
  })
})

// ============================================================================
// tieBreakSort
// ============================================================================

describe('tieBreakSort', () => {
  it('sorts by score descending', () => {
    const a = { id: 1, _score: 80 }
    const b = { id: 2, _score: 90 }
    expect(tieBreakSort(a, b)).toBeGreaterThan(0)
  })

  it('breaks score ties with confidence', () => {
    const a = { id: 1, _score: 80, ff_audience_confidence: 90 }
    const b = { id: 2, _score: 80, ff_audience_confidence: 70 }
    expect(tieBreakSort(a, b)).toBeLessThan(0)
  })

  it('breaks confidence ties with embedding', () => {
    const a = { id: 1, _score: 80, ff_audience_confidence: 90, _breakdown: { embedding: 70 } }
    const b = { id: 2, _score: 80, ff_audience_confidence: 90, _breakdown: { embedding: 50 } }
    expect(tieBreakSort(a, b)).toBeLessThan(0)
  })

  it('breaks embedding ties with year (newer wins)', () => {
    const a = { id: 1, _score: 80, ff_audience_confidence: 90, _breakdown: { embedding: 70 }, release_year: 2024 }
    const b = { id: 2, _score: 80, ff_audience_confidence: 90, _breakdown: { embedding: 70 }, release_year: 2020 }
    expect(tieBreakSort(a, b)).toBeLessThan(0)
  })

  it('breaks year ties with anti-popularity (lower pop wins)', () => {
    const a = { id: 1, _score: 80, ff_audience_confidence: 0, release_year: 2024, popularity: 10 }
    const b = { id: 2, _score: 80, ff_audience_confidence: 0, release_year: 2024, popularity: 100 }
    expect(tieBreakSort(a, b)).toBeLessThan(0)
  })

  it('final fallback sorts by id ascending', () => {
    const a = { id: 5, _score: 80 }
    const b = { id: 3, _score: 80 }
    expect(tieBreakSort(a, b)).toBeGreaterThan(0)
  })
})
