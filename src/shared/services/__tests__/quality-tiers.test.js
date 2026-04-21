import { describe, expect, it, vi } from 'vitest'

import { applyQualityFloor, QUALITY_TIERS } from '../quality-tiers'

// === HELPERS ===

/** Chainable mock that records calls for assertion */
function mockQuery() {
  const calls = []
  const chain = {
    gte: vi.fn((...args) => { calls.push({ method: 'gte', args }); return chain }),
    lte: vi.fn((...args) => { calls.push({ method: 'lte', args }); return chain }),
    _calls: calls,
  }
  return chain
}

// === TESTS ===

describe('applyQualityFloor', () => {
  it('HERO tier adds correct .gte() calls', () => {
    const query = mockQuery()
    applyQualityFloor(query, 'HERO')
    expect(query.gte).toHaveBeenCalledWith('ff_audience_rating', 78)
    expect(query.gte).toHaveBeenCalledWith('ff_audience_confidence', 65)
    expect(query.gte).toHaveBeenCalledWith('vote_count', 200)
    expect(query.lte).not.toHaveBeenCalled()
  })

  it('SIGNATURE tier adds correct .gte() calls', () => {
    const query = mockQuery()
    applyQualityFloor(query, 'SIGNATURE')
    expect(query.gte).toHaveBeenCalledWith('ff_audience_rating', 75)
    expect(query.gte).toHaveBeenCalledWith('ff_audience_confidence', 60)
    expect(query.gte).toHaveBeenCalledWith('vote_count', 200)
    expect(query.lte).not.toHaveBeenCalled()
  })

  it('CONTEXT tier adds audience rating + confidence but no vote_count', () => {
    const query = mockQuery()
    applyQualityFloor(query, 'CONTEXT')
    expect(query.gte).toHaveBeenCalledWith('ff_audience_rating', 68)
    expect(query.gte).toHaveBeenCalledWith('ff_audience_confidence', 50)
    // vote_count_min is null → no .gte('vote_count', ...) call
    expect(query.gte).toHaveBeenCalledTimes(2)
    expect(query.lte).not.toHaveBeenCalled()
  })

  it('NICHE_CRITICS tier adds both critic_min and audience_max', () => {
    const query = mockQuery()
    applyQualityFloor(query, 'NICHE_CRITICS')
    expect(query.gte).toHaveBeenCalledWith('ff_critic_rating', 72)
    expect(query.lte).toHaveBeenCalledWith('ff_audience_rating', 65)
    expect(query.gte).toHaveBeenCalledWith('ff_audience_confidence', 50)
    // No audience_rating_min, no vote_count
    expect(query.gte).not.toHaveBeenCalledWith('ff_audience_rating', expect.anything())
    expect(query.gte).not.toHaveBeenCalledWith('vote_count', expect.anything())
  })

  it('NICHE_UNDER90 tier adds runtime band + audience floor', () => {
    const query = mockQuery()
    applyQualityFloor(query, 'NICHE_UNDER90')
    expect(query.gte).toHaveBeenCalledWith('ff_audience_rating', 70)
    expect(query.gte).toHaveBeenCalledWith('ff_audience_confidence', 50)
    expect(query.gte).toHaveBeenCalledWith('runtime', 60)
    expect(query.lte).toHaveBeenCalledWith('runtime', 90)
  })

  it('throws for invalid tier', () => {
    const query = mockQuery()
    expect(() => applyQualityFloor(query, 'INVALID')).toThrow('Unknown quality tier: INVALID')
  })

  it('returns the query for chaining', () => {
    const query = mockQuery()
    const result = applyQualityFloor(query, 'HERO')
    expect(result).toBe(query)
  })
})

describe('QUALITY_TIERS', () => {
  it('has all expected tiers', () => {
    expect(Object.keys(QUALITY_TIERS)).toEqual(
      expect.arrayContaining(['HERO', 'SIGNATURE', 'CONTEXT', 'NICHE_CRITICS', 'NICHE_UNDER90'])
    )
  })

  it('HERO tier has higher floor than SIGNATURE', () => {
    expect(QUALITY_TIERS.HERO.ff_audience_rating_min).toBeGreaterThan(
      QUALITY_TIERS.SIGNATURE.ff_audience_rating_min
    )
  })

  it('SIGNATURE tier has higher floor than CONTEXT', () => {
    expect(QUALITY_TIERS.SIGNATURE.ff_audience_rating_min).toBeGreaterThan(
      QUALITY_TIERS.CONTEXT.ff_audience_rating_min
    )
  })
})
