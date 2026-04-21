import { describe, expect, it } from 'vitest'

import {
  SEED_RATING_MULTIPLIER,
  recencyDecay,
  curveSimilarity,
  aggregateSeedMatches,
  antiSeedPenalty,
  selectSeeds,
} from '../embedding-scoring'

// ============================================================================
// curveSimilarity
// ============================================================================

describe('curveSimilarity', () => {
  it('returns 0 below 0.55 threshold', () => {
    expect(curveSimilarity(0)).toBe(0)
    expect(curveSimilarity(0.3)).toBe(0)
    expect(curveSimilarity(0.54)).toBe(0)
  })

  it('returns 100 at 0.75+', () => {
    expect(curveSimilarity(0.75)).toBe(100)
    expect(curveSimilarity(0.85)).toBe(100)
    expect(curveSimilarity(1.0)).toBe(100)
  })

  it('maps 0.65 to 65-70', () => {
    const score = curveSimilarity(0.65)
    expect(score).toBeGreaterThanOrEqual(65)
    expect(score).toBeLessThanOrEqual(70)
  })

  it('maps 0.70 to 80-85', () => {
    const score = curveSimilarity(0.70)
    expect(score).toBeGreaterThanOrEqual(80)
    expect(score).toBeLessThanOrEqual(85)
  })

  it('is monotonically increasing across the active range', () => {
    const values = [0.55, 0.58, 0.60, 0.63, 0.65, 0.68, 0.70, 0.73, 0.74]
    for (let i = 1; i < values.length; i++) {
      expect(curveSimilarity(values[i])).toBeGreaterThanOrEqual(curveSimilarity(values[i - 1]))
    }
  })
})

// ============================================================================
// aggregateSeedMatches
// ============================================================================

describe('aggregateSeedMatches', () => {
  it('returns 0 for empty array', () => {
    expect(aggregateSeedMatches([])).toBe(0)
  })

  it('single match at cosine=0.70 → ~83 (full weight)', () => {
    const result = aggregateSeedMatches([{ seedId: 1, cosine: 0.70, seedWeight: 1.0 }])
    // curved(0.70) ≈ 83, 83 × 1.0 = ~83
    expect(result).toBeGreaterThanOrEqual(80)
    expect(result).toBeLessThanOrEqual(86)
  })

  it('2 matches (0.70, 0.65) → ~78', () => {
    const result = aggregateSeedMatches([
      { seedId: 1, cosine: 0.70, seedWeight: 1.0 },
      { seedId: 2, cosine: 0.65, seedWeight: 0.8 },
    ])
    // curved(0.70)≈83×0.7 + curved(0.65)≈67×0.3 = 58.1+20.1 = ~78
    expect(result).toBeGreaterThanOrEqual(74)
    expect(result).toBeLessThanOrEqual(82)
  })

  it('3 strong matches (0.73, 0.68, 0.65) → ~84', () => {
    const result = aggregateSeedMatches([
      { seedId: 1, cosine: 0.73, seedWeight: 1.0 },
      { seedId: 2, cosine: 0.68, seedWeight: 0.8 },
      { seedId: 3, cosine: 0.65, seedWeight: 0.7 },
    ])
    // curved(0.73)≈93×0.55 + curved(0.68)≈76×0.30 + curved(0.65)≈67×0.15 ≈ 84
    expect(result).toBeGreaterThanOrEqual(80)
    expect(result).toBeLessThanOrEqual(88)
  })

  it('single perfect match reaches 100 (no ceiling cap)', () => {
    const result = aggregateSeedMatches([
      { seedId: 1, cosine: 0.75, seedWeight: 1.0 },
    ])
    // curved(0.75) = 100, 100 × 1.0 = 100
    expect(result).toBe(100)
  })

  it('caps at 100', () => {
    const result = aggregateSeedMatches([
      { seedId: 1, cosine: 0.95, seedWeight: 1.0 },
      { seedId: 2, cosine: 0.95, seedWeight: 1.0 },
      { seedId: 3, cosine: 0.95, seedWeight: 1.0 },
    ])
    expect(result).toBe(100)
  })

  it('uses top-3 only even with more matches', () => {
    const three = aggregateSeedMatches([
      { seedId: 1, cosine: 0.75, seedWeight: 1.0 },
      { seedId: 2, cosine: 0.70, seedWeight: 0.8 },
      { seedId: 3, cosine: 0.65, seedWeight: 0.7 },
    ])
    const five = aggregateSeedMatches([
      { seedId: 1, cosine: 0.75, seedWeight: 1.0 },
      { seedId: 2, cosine: 0.70, seedWeight: 0.8 },
      { seedId: 3, cosine: 0.65, seedWeight: 0.7 },
      { seedId: 4, cosine: 0.60, seedWeight: 0.6 },
      { seedId: 5, cosine: 0.55, seedWeight: 0.5 },
    ])
    expect(five).toBe(three)
  })

  it('seedWeight affects ordering, not score magnitude', () => {
    // Same cosine values, different seedWeights — score is identical
    // because seedWeight only determines which match is "top-1"
    const high = aggregateSeedMatches([{ seedId: 1, cosine: 0.85, seedWeight: 1.0 }])
    const low = aggregateSeedMatches([{ seedId: 1, cosine: 0.85, seedWeight: 0.2 }])
    expect(low).toBe(high)
  })
})

// ============================================================================
// recencyDecay
// ============================================================================

describe('recencyDecay', () => {
  it('returns 1.0 for watch < 30 days ago', () => {
    const recent = new Date(Date.now() - 10 * 86400000).toISOString()
    expect(recencyDecay(recent)).toBe(1.0)
  })

  it('returns 0.7 for watch 31-89 days ago', () => {
    const midRecent = new Date(Date.now() - 60 * 86400000).toISOString()
    expect(recencyDecay(midRecent)).toBe(0.7)
  })

  it('returns 0.4 for watch 91-179 days ago', () => {
    const older = new Date(Date.now() - 120 * 86400000).toISOString()
    expect(recencyDecay(older)).toBe(0.4)
  })

  it('returns 0.2 for watch 180+ days ago', () => {
    const old = new Date(Date.now() - 365 * 86400000).toISOString()
    expect(recencyDecay(old)).toBe(0.2)
  })
})

// ============================================================================
// antiSeedPenalty
// ============================================================================

describe('antiSeedPenalty', () => {
  it('returns 80 for cosine >= 0.85', () => {
    expect(antiSeedPenalty(0.85)).toBe(80)
    expect(antiSeedPenalty(0.95)).toBe(80)
  })

  it('returns 50 for cosine 0.75-0.84', () => {
    expect(antiSeedPenalty(0.75)).toBe(50)
    expect(antiSeedPenalty(0.80)).toBe(50)
  })

  it('returns 25 for cosine 0.65-0.74', () => {
    expect(antiSeedPenalty(0.65)).toBe(25)
    expect(antiSeedPenalty(0.70)).toBe(25)
  })

  it('returns 0 for cosine < 0.65', () => {
    expect(antiSeedPenalty(0.5)).toBe(0)
    expect(antiSeedPenalty(0.3)).toBe(0)
    expect(antiSeedPenalty(0)).toBe(0)
  })
})

// ============================================================================
// selectSeeds
// ============================================================================

describe('selectSeeds', () => {
  const recentDate = new Date(Date.now() - 10 * 86400000).toISOString()
  const oldDate = new Date(Date.now() - 365 * 86400000).toISOString()

  it('filters out seeds with rating < 7', () => {
    const seeds = [
      { id: 1, rating: 9, watched_at: recentDate },
      { id: 2, rating: 6, watched_at: recentDate },
      { id: 3, rating: 5, watched_at: recentDate },
    ]
    const result = selectSeeds(seeds)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it('computes seedWeight from rating × recency', () => {
    const seeds = [
      { id: 1, rating: 10, watched_at: recentDate }, // 1.0 * 1.0 = 1.0
      { id: 2, rating: 8, watched_at: oldDate },      // 0.8 * 0.2 = 0.16
    ]
    const result = selectSeeds(seeds)
    expect(result[0].id).toBe(1)
    expect(result[0].seedWeight).toBe(1.0)
    expect(result[1].seedWeight).toBeCloseTo(0.16, 2)
  })

  it('sorts by seedWeight descending', () => {
    const seeds = [
      { id: 1, rating: 7, watched_at: recentDate },   // 0.6 * 1.0 = 0.6
      { id: 2, rating: 10, watched_at: recentDate },   // 1.0 * 1.0 = 1.0
      { id: 3, rating: 8, watched_at: recentDate },    // 0.8 * 1.0 = 0.8
    ]
    const result = selectSeeds(seeds)
    expect(result.map(s => s.id)).toEqual([2, 3, 1])
  })

  it('caps at 10 seeds', () => {
    const seeds = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1, rating: 9, watched_at: recentDate,
    }))
    expect(selectSeeds(seeds)).toHaveLength(10)
  })

  it('returns empty for empty input', () => {
    expect(selectSeeds([])).toEqual([])
  })
})

// ============================================================================
// SEED_RATING_MULTIPLIER
// ============================================================================

describe('SEED_RATING_MULTIPLIER', () => {
  it('has entries for ratings 7-10 only', () => {
    expect(SEED_RATING_MULTIPLIER[10]).toBe(1.0)
    expect(SEED_RATING_MULTIPLIER[9]).toBe(1.0)
    expect(SEED_RATING_MULTIPLIER[8]).toBe(0.8)
    expect(SEED_RATING_MULTIPLIER[7]).toBe(0.6)
    expect(SEED_RATING_MULTIPLIER[6]).toBeUndefined()
  })
})
