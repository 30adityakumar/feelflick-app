// Unit tests for pure helper functions in the recommendation engine.
// These tests run entirely offline — no Supabase, no network required.

import { describe, it, expect } from 'vitest'
import { normalizeNumericIdArray, clamp, safeLower } from '../recommendations'

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
