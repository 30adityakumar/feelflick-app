import { describe, it, expect } from 'vitest'
import { computeMaterialSignature } from '../editorialSignature'

const fp = (mood = [], tone = [], fit = []) => ({
  topMoodTags: mood.map((key) => ({ key, count: 1, share: 0.1 })),
  topToneTags: tone.map((key) => ({ key, count: 1, share: 0.1 })),
  topFitProfiles: fit.map((key) => ({ key, count: 1, share: 0.1 })),
})

describe('computeMaterialSignature', () => {
  it('is deterministic and stable for the same top tags', () => {
    const a = computeMaterialSignature(fp(['tense', 'dark'], ['restrained'], ['prestige_drama']))
    const b = computeMaterialSignature(fp(['tense', 'dark'], ['restrained'], ['prestige_drama']))
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{8}$/)
  })

  it('ignores counts/shares — only tag IDENTITY and rank order matter', () => {
    const a = computeMaterialSignature({ topMoodTags: [{ key: 'tense', count: 2, share: 0.9 }], topToneTags: [], topFitProfiles: [] })
    const b = computeMaterialSignature({ topMoodTags: [{ key: 'tense', count: 40, share: 0.4 }], topToneTags: [], topFitProfiles: [] })
    expect(a).toBe(b)
  })

  it('changes when the top mood shifts', () => {
    const a = computeMaterialSignature(fp(['tense', 'dark']))
    const b = computeMaterialSignature(fp(['tender', 'warm']))
    expect(a).not.toBe(b)
  })

  it('is order-sensitive (rank matters)', () => {
    const a = computeMaterialSignature(fp(['tense', 'dark']))
    const b = computeMaterialSignature(fp(['dark', 'tense']))
    expect(a).not.toBe(b)
  })

  it('only considers the top N of each dimension (mood 6 / tone 4 / fit 3)', () => {
    const seven = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
    const a = computeMaterialSignature(fp(seven))
    const b = computeMaterialSignature(fp([...seven.slice(0, 6), 'DIFFERENT']))  // only the 7th differs
    expect(a).toBe(b)
  })

  it('returns null when there is no signal to compare', () => {
    expect(computeMaterialSignature(null)).toBeNull()
    expect(computeMaterialSignature(fp([], [], []))).toBeNull()
    expect(computeMaterialSignature({})).toBeNull()
  })
})
