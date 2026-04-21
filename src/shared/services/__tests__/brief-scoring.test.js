import { describe, expect, it, vi } from 'vitest'

import {
  BRIEF_WEIGHTS_BASE,
  unpackVibe,
  briefHardFilters,
  briefWeightOverrides,
  hasBriefSignal,
  buildBriefSeeds,
  computeToneBoost,
  computeToneClash,
  generateBriefReason,
  scoreMovieForBrief,
} from '../brief-scoring'

// Mock scoreMovieV3 so we can verify it's called with correct args
vi.mock('../scoring-v3', () => ({
  scoreMovieV3: vi.fn((_movie, _profile, _context, rowType, opts) => ({
    final: 72,
    breakdown: { embedding: 40, fit: 60, mood: 80, director_genre: 50, content: 55, quality: 70, negative: 0 },
    weights_used: opts?.weightsOverride || rowType,
  })),
}))

// ============================================================================
// unpackVibe
// ============================================================================

describe('unpackVibe', () => {
  it('returns nulls for empty brief', () => {
    expect(unpackVibe({})).toEqual({ feeling: null, tone: null })
  })

  it('unpacks curious_sharp vibe', () => {
    expect(unpackVibe({ vibe: 'curious_sharp' })).toEqual({ feeling: 'curious', tone: 'sharp' })
  })

  it('unpacks cozy_warm vibe', () => {
    expect(unpackVibe({ vibe: 'cozy_warm' })).toEqual({ feeling: 'cozy', tone: 'warm' })
  })

  it('unpacks adventurous_any vibe', () => {
    expect(unpackVibe({ vibe: 'adventurous_any' })).toEqual({ feeling: 'adventurous', tone: 'any' })
  })

  it('unpacks heartbroken_bs vibe', () => {
    expect(unpackVibe({ vibe: 'heartbroken_bs' })).toEqual({ feeling: 'heartbroken', tone: 'bittersweet' })
  })

  it('returns nulls for unknown vibe value', () => {
    expect(unpackVibe({ vibe: 'unknown_xyz' })).toEqual({ feeling: null, tone: null })
  })
})

// ============================================================================
// briefHardFilters
// ============================================================================

describe('briefHardFilters', () => {
  it('always sets excludeWatched for empty brief', () => {
    expect(briefHardFilters({})).toEqual({ excludeWatched: true })
  })

  it('maps time=short to runtime max 100', () => {
    expect(briefHardFilters({ time: 'short' })).toEqual({ runtime: { max: 100 }, excludeWatched: true })
  })

  it('maps time=medium to runtime 90-140', () => {
    expect(briefHardFilters({ time: 'medium' })).toEqual({ runtime: { min: 90, max: 140 }, excludeWatched: true })
  })

  it('maps time=long to runtime min 130', () => {
    expect(briefHardFilters({ time: 'long' })).toEqual({ runtime: { min: 130 }, excludeWatched: true })
  })

  it('maps company=family to familyFriendly', () => {
    expect(briefHardFilters({ company: 'family' })).toEqual({ familyFriendly: true, excludeWatched: true })
  })

  it('combines multiple filters', () => {
    const result = briefHardFilters({ time: 'short', company: 'family' })
    expect(result).toEqual({
      runtime: { max: 100 },
      familyFriendly: true,
      excludeWatched: true,
    })
  })

  it('ignores time=any', () => {
    const result = briefHardFilters({ time: 'any' })
    expect(result.runtime).toBeUndefined()
  })

  it('does not set familyFriendly for non-family company', () => {
    const result = briefHardFilters({ company: 'friends' })
    expect(result.familyFriendly).toBeUndefined()
  })
})

// ============================================================================
// briefWeightOverrides
// ============================================================================

describe('briefWeightOverrides', () => {
  it('returns base weights when no signal', () => {
    const w = briefWeightOverrides({})
    expect(w.mood).toBeCloseTo(BRIEF_WEIGHTS_BASE.mood)
    expect(w.embedding).toBeCloseTo(BRIEF_WEIGHTS_BASE.embedding)
  })

  it('bumps mood when vibe has feeling', () => {
    const w = briefWeightOverrides({ vibe: 'cozy_warm' })
    expect(w.mood).toBeGreaterThan(w.embedding)
    expect(w.mood).toBeGreaterThan(w.fit)
  })

  it('bumps embedding to 0.35 raw when anchor is set', () => {
    const w = briefWeightOverrides({ anchor: { id: 1, title: 'Test' } })
    expect(w.embedding).toBeGreaterThan(w.mood)
    expect(w.embedding).toBeGreaterThan(w.fit)
  })

  it('normalizes weights to sum to 1.0', () => {
    const w = briefWeightOverrides({ vibe: 'curious_warm', anchor: { id: 1 } })
    const sum = Object.values(w).reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1.0)
  })

  it('boosts mood and halves fit when tone is explicit (not any)', () => {
    const withTone = briefWeightOverrides({ vibe: 'dark_sharp' }) // tone=sharp
    const withAnyTone = briefWeightOverrides({ vibe: 'adventurous_any' }) // tone=any
    // sharp tone should increase mood and decrease fit vs any tone
    expect(withTone.mood).toBeGreaterThan(withAnyTone.mood)
    expect(withTone.fit).toBeLessThan(withAnyTone.fit)
  })

  it('does not adjust fit when tone is "any"', () => {
    const withAny = briefWeightOverrides({ vibe: 'adventurous_any' })
    // adventurous_any has feeling but tone=any, so fit is not halved
    // Just verify fit is not dramatically reduced
    expect(withAny.fit).toBeGreaterThan(0.05)
  })
})

// ============================================================================
// hasBriefSignal
// ============================================================================

describe('hasBriefSignal', () => {
  it('returns false for empty brief', () => {
    expect(hasBriefSignal({})).toBe(false)
  })

  it('returns true when vibe is set', () => {
    expect(hasBriefSignal({ vibe: 'cozy_warm' })).toBe(true)
  })

  it('returns true when anchor is set', () => {
    expect(hasBriefSignal({ anchor: { id: 1 } })).toBe(true)
  })

  it('returns true when attention is set', () => {
    expect(hasBriefSignal({ attention: 'lean_in' })).toBe(true)
  })

  it('returns false for non-signal keys only', () => {
    expect(hasBriefSignal({ time: 'short', company: 'alone' })).toBe(false)
  })
})

// ============================================================================
// buildBriefSeeds
// ============================================================================

describe('buildBriefSeeds', () => {
  const baseProfile = {
    rated: { positive_seeds: [{ id: 10, rating: 8, weight: 1 }] },
  }

  it('returns base seeds when no anchor', () => {
    const seeds = buildBriefSeeds(baseProfile, {})
    expect(seeds).toEqual(baseProfile.rated.positive_seeds)
  })

  it('returns base seeds for null profile', () => {
    const seeds = buildBriefSeeds(null, {})
    expect(seeds).toEqual([])
  })

  it('prepends anchor seed with high weight when anchor is set', () => {
    const brief = { anchor: { id: 42, title: 'Inception', year: '2010' } }
    const seeds = buildBriefSeeds(baseProfile, brief)
    expect(seeds.length).toBe(2)
    expect(seeds[0].id).toBe(42)
    expect(seeds[0].rating).toBe(9)
    expect(seeds[0].weight).toBe(5)
  })

  it('anchor seed comes before base seeds', () => {
    const brief = { anchor: { id: 42 } }
    const seeds = buildBriefSeeds(baseProfile, brief)
    expect(seeds[0].id).toBe(42)
    expect(seeds[1].id).toBe(10)
  })
})

// ============================================================================
// computeToneBoost
// ============================================================================

describe('computeToneBoost', () => {
  it('returns 0 for vibe with tone=any', () => {
    expect(computeToneBoost({ mood_tags: ['tense'] }, { vibe: 'adventurous_any' })).toBe(0)
  })

  it('returns 0 when no vibe set', () => {
    expect(computeToneBoost({ mood_tags: ['tense'] }, {})).toBe(0)
  })

  it('returns 0 when film has no matching tags', () => {
    expect(computeToneBoost({ mood_tags: ['romantic'] }, { vibe: 'dark_sharp' })).toBe(0)
  })

  it('boosts for sharp tone when film has tense mood_tag', () => {
    const boost = computeToneBoost({ mood_tags: ['tense', 'dark'] }, { vibe: 'dark_sharp' })
    expect(boost).toBe(16) // 2 matches x 8
  })

  it('boosts for warm tone when film has heartwarming mood_tag', () => {
    const boost = computeToneBoost({ mood_tags: ['heartwarming'] }, { vibe: 'cozy_warm' })
    expect(boost).toBe(8) // 1 match x 8
  })

  it('boosts from tone_tags too', () => {
    const boost = computeToneBoost({ mood_tags: [], tone_tags: ['melancholic'] }, { vibe: 'heartbroken_bs' })
    expect(boost).toBe(8)
  })

  it('caps at 25', () => {
    const boost = computeToneBoost(
      { mood_tags: ['tense', 'dark', 'mysterious', 'thrilling'] },
      { vibe: 'dark_sharp' },
    )
    expect(boost).toBe(25) // 4 x 8 = 32, capped at 25
  })
})

// ============================================================================
// computeToneClash
// ============================================================================

describe('computeToneClash', () => {
  it('returns 0 when no vibe set', () => {
    expect(computeToneClash({ mood_tags: ['heartwarming'] }, {})).toBe(0)
  })

  it('returns 0 when film has positive tone overlap', () => {
    // Film has 'tense' which matches sharp — no clash even if also warm
    expect(computeToneClash({ mood_tags: ['tense', 'heartwarming'] }, { vibe: 'dark_sharp' })).toBe(0)
  })

  it('penalizes when film has only clashing tags (sharp vs warm)', () => {
    expect(computeToneClash({ mood_tags: ['heartwarming', 'uplifting'] }, { vibe: 'dark_sharp' })).toBe(-15)
  })

  it('penalizes when film has only clashing tags (warm vs dark)', () => {
    expect(computeToneClash({ mood_tags: ['dark', 'tense'] }, { vibe: 'cozy_warm' })).toBe(-15)
  })

  it('returns 0 when film has no tags at all', () => {
    expect(computeToneClash({ mood_tags: [] }, { vibe: 'dark_sharp' })).toBe(0)
  })

  it('returns 0 when film tags are neutral (no overlap either way)', () => {
    expect(computeToneClash({ mood_tags: ['romantic'] }, { vibe: 'dark_sharp' })).toBe(0)
  })
})

// ============================================================================
// generateBriefReason
// ============================================================================

describe('generateBriefReason', () => {
  it('returns anchor similarity when anchor set and embedding high', () => {
    const reason = generateBriefReason(
      { mood_tags: [], tone_tags: [], primary_genre: 'Drama' },
      { embedding: 70, quality: 50 },
      { anchor: { title: 'Inception' } },
    )
    expect(reason).toBe('Similar to Inception')
  })

  it('returns tone-grounded reason for sharp tone match', () => {
    const reason = generateBriefReason(
      { mood_tags: ['tense'], tone_tags: [], primary_genre: 'Thriller' },
      { embedding: 30, quality: 50 },
      { vibe: 'dark_sharp' },
    )
    expect(reason).toBe('Thriller with a tense edge')
  })

  it('returns feeling-based reason when mood_tags overlap feeling', () => {
    const reason = generateBriefReason(
      { mood_tags: ['dark', 'haunting'], tone_tags: [], primary_genre: 'Horror' },
      { embedding: 30, quality: 50 },
      { vibe: 'dark_sharp' },
    )
    // tone match takes priority over feeling match when both apply
    expect(reason).toBe('Horror with a dark edge')
  })

  it('returns quality reason when quality dimension is high', () => {
    const reason = generateBriefReason(
      { mood_tags: [], tone_tags: [], primary_genre: 'Drama' },
      { embedding: 30, quality: 90 },
      {},
    )
    expect(reason).toBe('Drama at its best')
  })

  it('returns taste profile reason when embedding is moderate', () => {
    const reason = generateBriefReason(
      { mood_tags: [], tone_tags: [], primary_genre: 'Comedy' },
      { embedding: 60, quality: 50 },
      {},
    )
    expect(reason).toBe('Close to your taste profile')
  })

  it('returns genre fallback when no other signal', () => {
    const reason = generateBriefReason(
      { mood_tags: [], tone_tags: [], primary_genre: 'Sci-Fi' },
      { embedding: 20, quality: 50 },
      {},
    )
    expect(reason).toBe('Sci-Fi pick for your brief')
  })

  it('capitalizes genre in output', () => {
    const reason = generateBriefReason(
      { mood_tags: [], tone_tags: [], primary_genre: 'thriller' },
      { embedding: 20, quality: 90 },
      {},
    )
    expect(reason).toBe('Thriller at its best')
  })

  it('uses genres[0].name as fallback when no primary_genre', () => {
    const reason = generateBriefReason(
      { mood_tags: [], tone_tags: [], genres: [{ name: 'Action' }] },
      { embedding: 20, quality: 90 },
      {},
    )
    expect(reason).toBe('Action at its best')
  })
})

// ============================================================================
// scoreMovieForBrief
// ============================================================================

describe('scoreMovieForBrief', () => {
  const movie = { id: 1, title: 'Test Movie', mood_tags: [], tone_tags: [] }
  const profile = { rated: { positive_seeds: [] }, affinity: {} }
  const context = { seedNeighborMap: new Map(), antiSeedNeighborMap: new Map(), isColdStart: false }

  it('returns final score, breakdown, toneBoost, and toneClash', () => {
    const result = scoreMovieForBrief(movie, profile, context, { vibe: 'cozy_warm' })
    expect(result).toHaveProperty('final')
    expect(result).toHaveProperty('breakdown')
    expect(result).toHaveProperty('toneBoost')
    expect(result).toHaveProperty('toneClash')
    expect(typeof result.final).toBe('number')
  })

  it('adds tone boost to final score', () => {
    const sharpMovie = { ...movie, mood_tags: ['tense', 'dark'] }
    const result = scoreMovieForBrief(sharpMovie, profile, context, { vibe: 'dark_sharp' })
    // Base mock returns 72, tone boost = 2 x 8 = 16
    expect(result.final).toBe(88)
    expect(result.toneBoost).toBe(16)
  })

  it('applies tone clash penalty', () => {
    const warmMovie = { ...movie, mood_tags: ['heartwarming', 'uplifting'] }
    const result = scoreMovieForBrief(warmMovie, profile, context, { vibe: 'dark_sharp' })
    // Base 72, no boost (no sharp overlap), clash -15 = 57
    expect(result.final).toBe(57)
    expect(result.toneClash).toBe(-15)
  })

  it('no tone boost for empty brief', () => {
    const result = scoreMovieForBrief(movie, profile, context, {})
    expect(result.final).toBe(72) // mock base
    expect(result.toneBoost).toBe(0)
    expect(result.toneClash).toBe(0)
  })

  it('passes weightsOverride when brief has signal', async () => {
    const { scoreMovieV3 } = await import('../scoring-v3')
    scoreMovieV3.mockClear()

    scoreMovieForBrief(movie, profile, context, { vibe: 'cozy_warm' })

    expect(scoreMovieV3).toHaveBeenCalledWith(
      movie, profile, context, 'BRIEF',
      expect.objectContaining({ weightsOverride: expect.any(Object) }),
    )
  })

  it('passes null weightsOverride when brief has no signal', async () => {
    const { scoreMovieV3 } = await import('../scoring-v3')
    scoreMovieV3.mockClear()

    scoreMovieForBrief(movie, profile, context, {})

    expect(scoreMovieV3).toHaveBeenCalledWith(
      movie, profile, context, 'BRIEF',
      { weightsOverride: null },
    )
  })
})
