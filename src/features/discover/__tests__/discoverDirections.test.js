import { describe, it, expect } from 'vitest'
import {
  buildDiscoverDirections,
  pressureIndex, noveltyIndex, familiarLanguagesOf,
  PRIMARY_MOOD_PRESERVE, MIN_MOMENT_FIT, MAX_FIT_DROP,
  MIN_GENTLER_DELTA, MIN_BOLDER_DELTA,
} from '../discoverDirections'

// Film factory — pressure axes + novelty axes in 0..100, fit per mood in 0..1.
let _id = 0
function film(over = {}) {
  const {
    id = ++_id, moodFitRaw = 0.8, rank = 100, fit = { slow: moodFitRaw },
    intensity = 50, attention = 50, depth = 50, pacing = 50,
    discovery = 30, polarization = 20, lang = 'en', ...rest
  } = over
  return {
    id, title: `Film ${id}`, moodFitRaw, _rankScore: rank, fit,
    _raw: {
      llm_intensity: intensity, llm_attention_demand: attention, llm_emotional_depth: depth, llm_pacing: pacing,
      discovery_potential: discovery, polarization_score: polarization, original_language: lang,
    },
    ...rest,
  }
}
const ctx = { selected: ['slow'], profile: { filters: { language_primary: 'en' } } }

describe('buildDiscoverDirections — lead selection', () => {
  it('Closest = highest _rankScore above the mood floor', () => {
    const ranked = [
      film({ id: 1, rank: 120, moodFitRaw: 0.20, fit: { slow: 0.20 } }), // high rank but below TOP floor 0.35
      film({ id: 2, rank: 100, moodFitRaw: 0.80, fit: { slow: 0.80 } }), // qualifies
    ]
    const { closest } = buildDiscoverDirections(ranked, ctx)
    expect(closest.id).toBe(2)
    expect(closest._direction).toBe('closest')
  })
})

describe('Gentler — pressure-reduction boundary', () => {
  const lead = film({ id: 10, moodFitRaw: 0.9, rank: 200, fit: { slow: 0.9 }, intensity: 80, attention: 80, depth: 80, pacing: 80 })
  const leadP = pressureIndex(lead) // = 0.80

  it('included when pressure drop is exactly at the threshold', () => {
    const target = leadP - MIN_GENTLER_DELTA // 0.68
    const g = film({ id: 11, moodFitRaw: 0.8, fit: { slow: 0.8 }, intensity: target * 100, attention: target * 100, depth: target * 100, pacing: target * 100 })
    const { gentler } = buildDiscoverDirections([lead, g], ctx)
    expect(gentler?.id).toBe(11)
  })
  it('excluded when pressure drop is just below the threshold', () => {
    const target = leadP - MIN_GENTLER_DELTA + 0.02 // not enough drop
    const g = film({ id: 12, moodFitRaw: 0.8, fit: { slow: 0.8 }, intensity: target * 100, attention: target * 100, depth: target * 100, pacing: target * 100 })
    const { gentler } = buildDiscoverDirections([lead, g], ctx)
    expect(gentler).toBeNull()
  })
})

describe('Bolder — novelty-increase boundary', () => {
  const lead = film({ id: 20, moodFitRaw: 0.9, rank: 200, fit: { slow: 0.9 }, discovery: 20, polarization: 20, lang: 'en' })
  const familiar = familiarLanguagesOf(ctx.profile)
  const leadN = noveltyIndex(lead, familiar)

  // novelty = mean(discovery, polar, unfamiliar). With a familiar language
  // (unfamiliar=0), to land novelty at target T set discovery=polar=1.5·T.
  it('included when novelty rise is at/above the threshold', () => {
    const p = 1.5 * (leadN + MIN_BOLDER_DELTA) * 100
    const b = film({ id: 21, moodFitRaw: 0.8, fit: { slow: 0.8 }, discovery: p, polarization: p, lang: 'en' })
    const { bolder } = buildDiscoverDirections([lead, b], ctx)
    expect(bolder?.id).toBe(21)
  })
  it('excluded when novelty rise is below the threshold', () => {
    const p = 1.5 * (leadN + MIN_BOLDER_DELTA - 0.03) * 100
    const b = film({ id: 22, moodFitRaw: 0.8, fit: { slow: 0.8 }, discovery: p, polarization: p, lang: 'en' })
    const { bolder } = buildDiscoverDirections([lead, b], ctx)
    expect(bolder).toBeNull()
  })
  it('a less-familiar language is a valid bolder signal', () => {
    const b = film({ id: 23, moodFitRaw: 0.8, fit: { slow: 0.8 }, discovery: 20, polarization: 20, lang: 'ko' })
    const { bolder } = buildDiscoverDirections([lead, b], ctx)
    expect(bolder?.id).toBe(23)
  })
})

describe('Eligibility gates', () => {
  const lead = film({ id: 30, moodFitRaw: 0.9, rank: 200, fit: { slow: 0.9 }, intensity: 80, attention: 80, depth: 80, pacing: 80 })

  it('excludes a candidate that does not preserve any selected mood', () => {
    const g = film({ id: 31, moodFitRaw: 0.5, fit: { slow: PRIMARY_MOOD_PRESERVE - 0.05 }, intensity: 30, attention: 30, depth: 30, pacing: 30 })
    const { gentler } = buildDiscoverDirections([lead, g], ctx)
    expect(gentler).toBeNull()
  })
  it('excludes a candidate whose moment fit dropped too far below the lead', () => {
    const g = film({ id: 32, moodFitRaw: lead.moodFitRaw - MAX_FIT_DROP - 0.05, fit: { slow: lead.moodFitRaw - MAX_FIT_DROP - 0.05 }, intensity: 20, attention: 20, depth: 20, pacing: 20 })
    const { gentler } = buildDiscoverDirections([lead, g], ctx)
    expect(gentler).toBeNull()
  })
  it('excludes a candidate below the minimum moment fit', () => {
    const g = film({ id: 33, moodFitRaw: MIN_MOMENT_FIT - 0.05, fit: { slow: 0.9 }, intensity: 20, attention: 20, depth: 20, pacing: 20 })
    // lead moodFitRaw high → also fails MAX_FIT_DROP, but min-fit alone must reject
    const { gentler } = buildDiscoverDirections([film({ id: 34, moodFitRaw: 0.4, rank: 200, fit: { slow: 0.4 }, intensity: 80, attention: 80, depth: 80, pacing: 80 }), g], ctx)
    expect(gentler).toBeNull()
  })
})

describe('Uniqueness, fewer-than-three, determinism', () => {
  it('gentler, bolder and lead are distinct films', () => {
    const lead = film({ id: 40, moodFitRaw: 0.9, rank: 200, fit: { slow: 0.9 }, intensity: 80, attention: 80, depth: 80, discovery: 20, polarization: 20 })
    const g = film({ id: 41, moodFitRaw: 0.85, fit: { slow: 0.85 }, intensity: 30, attention: 30, depth: 30, discovery: 20, polarization: 20 })
    const b = film({ id: 42, moodFitRaw: 0.85, fit: { slow: 0.85 }, intensity: 80, attention: 80, depth: 80, discovery: 90, polarization: 90 })
    const { closest, gentler, bolder } = buildDiscoverDirections([lead, g, b], ctx)
    const ids = [closest.id, gentler?.id, bolder?.id]
    expect(new Set(ids).size).toBe(3)
  })
  it('renders fewer (nulls) rather than fabricate when nothing qualifies', () => {
    const lead = film({ id: 50, moodFitRaw: 0.9, rank: 200, fit: { slow: 0.9 }, intensity: 50, attention: 50, depth: 50, discovery: 30, polarization: 20 })
    const sibling = film({ id: 51, moodFitRaw: 0.88, fit: { slow: 0.88 }, intensity: 50, attention: 50, depth: 50, discovery: 30, polarization: 20 }) // identical pressure+novelty
    const { gentler, bolder } = buildDiscoverDirections([lead, sibling], ctx)
    expect(gentler).toBeNull()
    expect(bolder).toBeNull()
  })
  it('lead-only when allowAlternates is false (fallback data)', () => {
    const lead = film({ id: 60, moodFitRaw: 0.9, rank: 200, fit: { slow: 0.9 } })
    const r = buildDiscoverDirections([lead, film({ id: 61 })], { ...ctx, allowAlternates: false })
    expect(r.closest.id).toBe(60)
    expect(r.gentler).toBeNull()
    expect(r.bolder).toBeNull()
  })
  it('is deterministic for a fixed pool', () => {
    const pool = [
      film({ id: 70, moodFitRaw: 0.9, rank: 200, fit: { slow: 0.9 }, intensity: 80, attention: 80, depth: 80, discovery: 20, polarization: 20 }),
      film({ id: 71, moodFitRaw: 0.85, fit: { slow: 0.85 }, intensity: 30, attention: 30, depth: 30 }),
      film({ id: 72, moodFitRaw: 0.85, fit: { slow: 0.85 }, discovery: 95, polarization: 95 }),
    ]
    const a = buildDiscoverDirections(pool, ctx)
    const b = buildDiscoverDirections(pool, ctx)
    expect([a.closest.id, a.gentler?.id, a.bolder?.id]).toEqual([b.closest.id, b.gentler?.id, b.bolder?.id])
  })
})
