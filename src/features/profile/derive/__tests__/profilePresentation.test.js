import { describe, it, expect } from 'vitest'
import {
  classifyProfileMaturity, deriveConfidenceBand, formatEvidenceSummary, presentSampleShare, MATURITY,
} from '../profilePresentation'

// F7.4 — pure presentation helpers. Thresholds are product judgements (forming < 5 watched OR
// < 2 rated; established ≥ 15 watched AND ≥ 5 rated; emerging between).
describe('classifyProfileMaturity', () => {
  const cases = [
    [{ watchedCount: 0,  ratedCount: 0 }, MATURITY.FORMING],
    [{ watchedCount: 1,  ratedCount: 0 }, MATURITY.FORMING],
    [{ watchedCount: 4,  ratedCount: 2 }, MATURITY.FORMING],   // < 5 watched
    [{ watchedCount: 5,  ratedCount: 1 }, MATURITY.FORMING],   // < 2 rated
    [{ watchedCount: 5,  ratedCount: 2 }, MATURITY.EMERGING],  // floor met
    [{ watchedCount: 14, ratedCount: 5 }, MATURITY.EMERGING],  // < 15 watched
    [{ watchedCount: 15, ratedCount: 4 }, MATURITY.EMERGING],  // < 5 rated
    [{ watchedCount: 15, ratedCount: 5 }, MATURITY.ESTABLISHED],
    [{ watchedCount: 200, ratedCount: 90 }, MATURITY.ESTABLISHED],
  ]
  it.each(cases)('%o → %s', (input, expected) => {
    expect(classifyProfileMaturity(input)).toBe(expected)
  })
  it('invalid / null inputs degrade to forming, never throw', () => {
    expect(classifyProfileMaturity()).toBe(MATURITY.FORMING)
    expect(classifyProfileMaturity({})).toBe(MATURITY.FORMING)
    expect(classifyProfileMaturity({ watchedCount: null, ratedCount: undefined })).toBe(MATURITY.FORMING)
    expect(classifyProfileMaturity({ watchedCount: NaN, ratedCount: NaN })).toBe(MATURITY.FORMING)
  })
})

describe('deriveConfidenceBand (no percentage; internal number unchanged upstream)', () => {
  it('maps below 40 → Still forming, 40–69 → Taking shape, 70+ → Well established', () => {
    expect(deriveConfidenceBand(0).label).toBe('Still forming')
    expect(deriveConfidenceBand(39).label).toBe('Still forming')
    expect(deriveConfidenceBand(40).label).toBe('Taking shape')
    expect(deriveConfidenceBand(69).label).toBe('Taking shape')
    expect(deriveConfidenceBand(70).label).toBe('Well established')
    expect(deriveConfidenceBand(100).label).toBe('Well established')
  })
  it('the band label never contains a percentage; invalid → forming band', () => {
    for (const c of [0, 40, 70, 100]) expect(deriveConfidenceBand(c).label).not.toMatch(/%|\d/)
    expect(deriveConfidenceBand(undefined).key).toBe('forming')
    expect(deriveConfidenceBand(NaN).key).toBe('forming')
  })
})

describe('formatEvidenceSummary', () => {
  it('uses canonical counts, correct grammar, omits empty segments', () => {
    expect(formatEvidenceSummary({ watchedCount: 18, ratedCount: 11 })).toBe('Based on 18 watched films and 11 ratings')
    expect(formatEvidenceSummary({ watchedCount: 1, ratedCount: 1 })).toBe('Based on 1 watched film and 1 rating')
    expect(formatEvidenceSummary({ watchedCount: 7, ratedCount: 0 })).toBe('Based on 7 watched films')
    expect(formatEvidenceSummary({ watchedCount: 0, ratedCount: 0 })).toBeNull()
    expect(formatEvidenceSummary()).toBeNull()
  })
})

describe('presentSampleShare (small-sample percentage presentation)', () => {
  it('under 5 applicable films → no exact %, count-led', () => {
    expect(presentSampleShare({ pct: 67, count: 2, total: 3 })).toMatchObject({ showPercent: false, text: '2 films' })
    expect(presentSampleShare({ pct: 100, count: 1, total: 1 })).toMatchObject({ showPercent: false, text: '1 film' })
    expect(presentSampleShare({ pct: 50, total: 0 })).toMatchObject({ showPercent: false, text: 'Early signal' })
    expect(presentSampleShare({ pct: 50, total: 4 }).showPercent).toBe(false)
  })
  it('5–9 applicable films → provisional, still no bare exact %', () => {
    expect(presentSampleShare({ pct: 42, count: 3, total: 7 })).toMatchObject({ showPercent: false, mode: 'provisional' })
    expect(presentSampleShare({ pct: 42, count: 3, total: 9 }).showPercent).toBe(false)
  })
  it('10+ applicable films → exact % with sample context', () => {
    expect(presentSampleShare({ pct: 42, count: 8, total: 19 })).toMatchObject({ showPercent: true, text: '42% · 8 of 19 films' })
    expect(presentSampleShare({ pct: 30, count: 6, total: 20 }).showPercent).toBe(true)
  })
})
