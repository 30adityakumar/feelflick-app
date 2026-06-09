import { describe, it, expect } from 'vitest'

import { deriveMatchBand } from '../matchBand'

// F5.3 — the qualitative fit band that replaces the visible match integer in the
// PrimaryCase. Conservative thresholds; never returns a percentage.

describe('deriveMatchBand — boundaries', () => {
  it('returns null for non-finite input', () => {
    for (const v of [null, undefined, NaN, Infinity, -Infinity, '80']) {
      expect(deriveMatchBand(v)).toBeNull()
    }
  })

  it('returns null below 60 (incl. negatives and 0)', () => {
    for (const v of [-100, -1, 0, 1, 30, 59, 59.9]) {
      expect(deriveMatchBand(v)).toBeNull()
    }
  })

  it('60 / 74 → Good fit', () => {
    expect(deriveMatchBand(60)).toBe('Good fit')
    expect(deriveMatchBand(74)).toBe('Good fit')
  })

  it('75 / 89 → Strong fit', () => {
    expect(deriveMatchBand(75)).toBe('Strong fit')
    expect(deriveMatchBand(89)).toBe('Strong fit')
  })

  it('90 / 99 / 100+ → Exceptional fit', () => {
    expect(deriveMatchBand(90)).toBe('Exceptional fit')
    expect(deriveMatchBand(99)).toBe('Exceptional fit')
    expect(deriveMatchBand(120)).toBe('Exceptional fit')
  })

  it('exact boundaries 60, 75, 90 follow the higher band', () => {
    expect(deriveMatchBand(60)).toBe('Good fit')
    expect(deriveMatchBand(75)).toBe('Strong fit')
    expect(deriveMatchBand(90)).toBe('Exceptional fit')
  })

  it('never returns a percentage character', () => {
    for (const v of [60, 75, 90, 99]) {
      expect(deriveMatchBand(v)).not.toMatch(/%|\d/)
    }
  })
})
