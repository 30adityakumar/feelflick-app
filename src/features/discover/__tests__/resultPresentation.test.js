import { describe, it, expect } from 'vitest'
import { buildMomentFitLine, buildPersonalSignal, buildRuntimeFitLine } from '../resultPresentation'

const closest = { id: 1, title: 'Lead', dir: 'Bong Joon-ho', runtime: 120, moodFitRaw: 0.9, fit: { slow: 0.9 }, _raw: { llm_intensity: 80, llm_attention_demand: 80, llm_emotional_depth: 80, llm_pacing: 80, discovery_potential: 20, polarization_score: 20, original_language: 'en' } }
const gentler = { id: 2, title: 'Alt', dir: 'X', runtime: 100, moodFitRaw: 0.8, fit: { slow: 0.8 }, _direction: 'gentler', _raw: { llm_intensity: 20, llm_attention_demand: 20, llm_emotional_depth: 20, llm_pacing: 20, discovery_potential: 20, polarization_score: 20, original_language: 'en' } }

describe('buildMomentFitLine — always present', () => {
  it('names a mood/runtime fit for the closest (never empty)', () => {
    const line = buildMomentFitLine({ film: closest, role: 'closest', lead: closest, selected: ['slow'], time: 'std' })
    expect(typeof line).toBe('string')
    expect(line.length).toBeGreaterThan(0)
    expect(line.toLowerCase()).toContain('night')
  })
  it('names the honest delta for an alternate', () => {
    const line = buildMomentFitLine({ film: gentler, role: 'gentler', lead: closest, selected: ['slow'], time: 'std', profile: { filters: { language_primary: 'en' } } })
    expect(line).toMatch(/holds the mood/i)
  })
})

describe('buildPersonalSignal — honest, fallback-safe', () => {
  it('returns a filmmaker-affinity line only when the director genuinely matches', () => {
    const profile = { affinities: { directors: [{ name: 'Bong Joon-ho' }] } }
    expect(buildPersonalSignal({ film: closest, profile })).toMatch(/Bong Joon-ho/)
  })
  it('returns null when there is no real personal signal', () => {
    expect(buildPersonalSignal({ film: closest, profile: { affinities: { directors: [{ name: 'Someone Else' }] } } })).toBeNull()
    expect(buildPersonalSignal({ film: closest, profile: null })).toBeNull()
  })
  it('NEVER returns a personal line in fallback mode (even if a director would match)', () => {
    const profile = { affinities: { directors: [{ name: 'Bong Joon-ho' }] } }
    expect(buildPersonalSignal({ film: closest, profile, isFallback: true })).toBeNull()
  })
})

describe('buildRuntimeFitLine — honest only', () => {
  it('claims a fit only when runtime is inside the chosen band', () => {
    expect(buildRuntimeFitLine({ time: 'std', runtime: 120 })).toMatch(/within your/i) // 100-130
    expect(buildRuntimeFitLine({ time: 'short', runtime: 120 })).toBeNull() // outside 60-99
  })
})
