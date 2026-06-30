import { describe, it, expect } from 'vitest'
import {
  classifyProfileMaturity, deriveConfidenceBand, formatEvidenceSummary, presentSampleShare,
  formatDistributionContext, INK_LABEL, MATURITY,
} from '../profilePresentation'

// WCAG relative-luminance contrast between a translucent foreground composited on an opaque bg.
function contrast(fgRgba, bgHex) {
  const m = fgRgba.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/)
  const [fr, fg, fb, fa = 1] = [Number(m[1]), Number(m[2]), Number(m[3]), m[4] != null ? Number(m[4]) : 1]
  const br = parseInt(bgHex.slice(1, 3), 16), bg = parseInt(bgHex.slice(3, 5), 16), bb = parseInt(bgHex.slice(5, 7), 16)
  const comp = (f, b) => f * fa + b * (1 - fa)
  const lum = (r, g, b) => {
    const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  }
  const L1 = lum(comp(fr, br), comp(fg, bg), comp(fb, bb)) + 0.05
  const L2 = lum(br, bg, bb) + 0.05
  return Math.max(L1, L2) / Math.min(L1, L2)
}

// F7.4 — pure presentation helpers. Thresholds are product judgements (forming < 5 watched —
// ratings do NOT gate forming, since a DNA is computed from 5 watched films alone; established
// ≥ 15 watched AND ≥ 5 rated; emerging between).
describe('classifyProfileMaturity', () => {
  const cases = [
    [{ watchedCount: 0,  ratedCount: 0 }, MATURITY.FORMING],
    [{ watchedCount: 1,  ratedCount: 0 }, MATURITY.FORMING],
    [{ watchedCount: 4,  ratedCount: 2 }, MATURITY.FORMING],   // < 5 watched
    [{ watchedCount: 5,  ratedCount: 0 }, MATURITY.EMERGING],  // 5 films, no ratings → DNA exists
    [{ watchedCount: 5,  ratedCount: 1 }, MATURITY.EMERGING],  // ratings no longer gate forming
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

describe('formatDistributionContext (F7.5 evidence/denominator)', () => {
  it('under 5 applicable films → no exact %, count-led + accessible sentence', () => {
    expect(formatDistributionContext({ count: 0, total: 0 })).toMatchObject({ showPercent: false, primary: 'Early signal' })
    expect(formatDistributionContext({ count: 1, total: 1 })).toMatchObject({ showPercent: false, primary: '1 film' })
    expect(formatDistributionContext({ count: 3, total: 4, percentage: 75 }).showPercent).toBe(false)
    expect(formatDistributionContext({ count: 2, total: 3 }).accessibleText).toMatch(/2 films/)
  })
  it('5–9 applicable films → provisional with explicit count, no bare %', () => {
    const r = formatDistributionContext({ count: 4, total: 7, percentage: 57 })
    expect(r.showPercent).toBe(false)
    expect(r.context).toBe('4 of 7 films')
    expect(r.accessibleText).toMatch(/growing signal, 4 of 7 films/)
  })
  it('10+ applicable films → % with denominator + an accessible "X percent, representing N of M films"', () => {
    const r = formatDistributionContext({ count: 8, total: 19, percentage: 42 })
    expect(r).toMatchObject({ showPercent: true, primary: '42%', context: '8 of 19 films' })
    expect(r.accessibleText).toBe('42 percent, representing 8 of 19 films')
  })
  it('forming maturity forces count-led even with a large total; invalid input is safe', () => {
    expect(formatDistributionContext({ count: 5, total: 30, percentage: 50, maturity: MATURITY.FORMING }).showPercent).toBe(false)
    expect(() => formatDistributionContext({ count: NaN, total: NaN, percentage: NaN })).not.toThrow()
    expect(formatDistributionContext()).toMatchObject({ showPercent: false })
  })
})

describe('INK_LABEL contrast (F7.5 — load-bearing labels meet WCAG AA on #06060a)', () => {
  it('is ≥ 4.5:1 (normal-text AA), unlike the design-system faint tokens', () => {
    expect(contrast(INK_LABEL, '#06060a')).toBeGreaterThanOrEqual(4.5)
    // sanity: the tokens it replaces were below AA
    expect(contrast('rgba(250,250,250,0.45)', '#06060a')).toBeLessThan(4.5) // HP.textMuted ≈ 4.36
    expect(contrast('rgba(250,250,250,0.40)', '#06060a')).toBeLessThan(4.5) // HP.textFaint ≈ 3.71
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
