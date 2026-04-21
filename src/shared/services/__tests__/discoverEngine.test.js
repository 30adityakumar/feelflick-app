import { describe, it, expect } from 'vitest'
import { scoreMoodAffinity } from '../recommendations'

// === HELPERS ===

function buildMoodData(overrides = {}) {
  return {
    weights: [],
    preferred_tags: [],
    avoided_tags: [],
    preferred_tones: [],
    ...overrides,
  }
}

function buildMoodParams(overrides = {}) {
  return {
    intensity: 3,
    pacing: 3,
    viewingContext: 0,       // no modifier
    experienceType: 0,       // no modifier
    timeOfDay: 'evening',
    parsedTags: null,
    ...overrides,
  }
}

function buildMovie(overrides = {}) {
  return {
    id: 1,
    tmdb_id: 100,
    title: 'Test Movie',
    genres: [],
    mood_tags: [],
    tone_tags: [],
    ...overrides,
  }
}

// === scoreMoodAffinity ===

describe('scoreMoodAffinity', () => {
  it('scores mood tag intersection (max +45)', () => {
    const movie = buildMovie({ mood_tags: ['tense', 'dark', 'haunting'] })
    const moodData = buildMoodData({ preferred_tags: ['tense', 'dark', 'haunting', 'unsettling'] })
    const params = buildMoodParams()

    const score = scoreMoodAffinity(movie, 1, moodData, params)
    // 3 mood matches × 15 = 45 (capped at 45)
    expect(score).toBe(45)
  })

  it('scores tone tag intersection (max +10)', () => {
    const movie = buildMovie({ tone_tags: ['raw', 'urgent', 'intimate'] })
    const moodData = buildMoodData({ preferred_tones: ['raw', 'urgent', 'intimate'] })
    const params = buildMoodParams()

    const score = scoreMoodAffinity(movie, 1, moodData, params)
    // 3 tone matches × 5 = 15, capped at 10
    expect(score).toBe(10)
  })

  it('applies avoided tag penalty (-20 each)', () => {
    const movie = buildMovie({ mood_tags: ['gritty', 'dark'] })
    const moodData = buildMoodData({ avoided_tags: ['gritty', 'dark'] })
    const params = buildMoodParams()

    const score = scoreMoodAffinity(movie, 1, moodData, params)
    // 0 preferred matches, 2 avoided × -20 = -40, clamped to 0
    expect(score).toBe(0)
  })

  it('merges NL-parsed tags with mood-defined tags', () => {
    const movie = buildMovie({ mood_tags: ['cozy', 'dreamy'] })
    const moodData = buildMoodData({ preferred_tags: ['cozy'] })
    const params = buildMoodParams({
      parsedTags: { preferredMoodTags: ['dreamy'] },
    })

    const score = scoreMoodAffinity(movie, 1, moodData, params)
    // merged preferred = ['cozy', 'dreamy'], movie has both → 2 × 15 = 30
    expect(score).toBe(30)
  })

  it('NL-parsed avoidedMoodTags apply -20 penalty', () => {
    const movie = buildMovie({ mood_tags: ['tense', 'cozy'] })
    const moodData = buildMoodData({ preferred_tags: ['cozy'] })
    const params = buildMoodParams({
      parsedTags: { avoidedMoodTags: ['tense'] },
    })

    const score = scoreMoodAffinity(movie, 1, moodData, params)
    // 1 preferred match (cozy) = +15, 1 avoided match (tense) = -20, net = 0 (clamped)
    expect(score).toBe(0)
  })

  it('returns 0 when movie has no tags and no genre affinity', () => {
    const movie = buildMovie()
    const moodData = buildMoodData({ preferred_tags: ['tense'] })
    const params = buildMoodParams()

    const score = scoreMoodAffinity(movie, 1, moodData, params)
    expect(score).toBe(0)
  })
})

// === Percentile match_percentage math ===

describe('percentile match_percentage', () => {
  // This mirrors the inline math in getMoodRecommendations (R7)
  function computeMatchPercentage(rank, totalScored) {
    const percentile = 1 - (rank / totalScored)
    return Math.round(40 + percentile * 59)
  }

  it('top film (rank 0) maps to 99', () => {
    expect(computeMatchPercentage(0, 200)).toBe(99)
  })

  it('median film maps to ~70', () => {
    const pct = computeMatchPercentage(100, 200)
    expect(pct).toBeGreaterThanOrEqual(68)
    expect(pct).toBeLessThanOrEqual(72)
  })

  it('bottom film maps to ~40', () => {
    // Last rank = totalScored - 1 (0-indexed from .map)
    const pct = computeMatchPercentage(199, 200)
    expect(pct).toBeGreaterThanOrEqual(40)
    expect(pct).toBeLessThanOrEqual(41)
  })

  it('single-film pool → 99', () => {
    expect(computeMatchPercentage(0, 1)).toBe(99)
  })
})

// === Embedding union dedup ===

describe('embedding union dedup', () => {
  // This mirrors the dedup logic in fetchMoodCandidates
  function unionPools(basePool, embeddingPool) {
    const existingIds = new Set(basePool.map(m => m.id))
    const combined = [...basePool]
    for (const row of embeddingPool) {
      if (row?.id && !existingIds.has(row.id)) {
        combined.push(row)
        existingIds.add(row.id)
      }
    }
    return combined
  }

  it('dedupes overlapping IDs', () => {
    const base = Array.from({ length: 300 }, (_, i) => ({ id: i + 1 }))
    const embedding = Array.from({ length: 100 }, (_, i) => ({ id: i + 251 })) // IDs 251-350, 50 overlap with base
    const result = unionPools(base, embedding)
    expect(result.length).toBe(350) // 300 + 50 new
  })

  it('handles zero overlap', () => {
    const base = [{ id: 1 }, { id: 2 }]
    const embedding = [{ id: 3 }, { id: 4 }]
    const result = unionPools(base, embedding)
    expect(result.length).toBe(4)
  })

  it('handles complete overlap', () => {
    const base = [{ id: 1 }, { id: 2 }, { id: 3 }]
    const embedding = [{ id: 1 }, { id: 2 }, { id: 3 }]
    const result = unionPools(base, embedding)
    expect(result.length).toBe(3)
  })

  it('skips null/undefined IDs', () => {
    const base = [{ id: 1 }]
    const embedding = [{ id: null }, { id: undefined }, { id: 2 }]
    const result = unionPools(base, embedding)
    expect(result.length).toBe(2)
  })
})
