import { describe, it, expect } from 'vitest'

import { computeMatchPercent } from '@/shared/services/matchScore'

// F5.2 — pins the Film File's MATCH-AVAILABILITY contract (the rule the hero ring +
// PrimaryCaseCard depend on to decide whether to show a % at all). It does NOT
// duplicate the full scoring/calibration suite and does NOT edit computeMatchPercent.
// F5.4 will change how an available % is PRESENTED (band vs integer); this phase only
// pins WHEN it is available + that it is an integer today.

describe('computeMatchPercent — Film File availability contract (current)', () => {
  it('returns null for a missing / non-finite engine score (badge hides)', () => {
    expect(computeMatchPercent({ engineScore: null })).toBeNull()
    expect(computeMatchPercent({ engineScore: undefined })).toBeNull()
    expect(computeMatchPercent({ engineScore: NaN })).toBeNull()
    expect(computeMatchPercent({})).toBeNull()
  })

  it('returns null below the confidence floor (engine says poor fit → no % shown)', () => {
    expect(computeMatchPercent({ engineScore: 49 })).toBeNull()
    expect(computeMatchPercent({ engineScore: 0 })).toBeNull()
    expect(computeMatchPercent({ engineScore: -10 })).toBeNull()
  })

  it('returns a finite integer in 0–99 for an available score', () => {
    const pct = computeMatchPercent({ engineScore: 120, profile: { meta: { confidence: 'high' } } })
    expect(Number.isInteger(pct)).toBe(true)
    expect(pct).toBeGreaterThanOrEqual(0)
    expect(pct).toBeLessThanOrEqual(99)
  })

  it('is an integer (no band/label transformation in F5.2)', () => {
    const pct = computeMatchPercent({ engineScore: 100, profile: { meta: { confidence: 'medium' } } })
    expect(typeof pct).toBe('number')
    expect(Number.isInteger(pct)).toBe(true)
  })
})
