import { describe, it, expect } from 'vitest'

import { deriveMoodAxes } from '../moodRadar'

// F5.2 — pins the CURRENT Mood Radar derivation (no behavior change). Mood Radar's
// llm_* inputs are GENERATED enrichment; the geometry is derived. These assertions
// fix today's axis names, order, scaling, clamping, and colours.

const FULL = {
  llm_intensity: 80, llm_pacing: 60, llm_emotional_depth: 90,
  llm_dialogue_density: 40, llm_attention_demand: 50,
  mood_tags: ['tense', 'dark', 'cerebral', 'slow'],
}

describe('deriveMoodAxes — current contract', () => {
  it('returns null for null input', () => {
    expect(deriveMoodAxes(null)).toBeNull()
    expect(deriveMoodAxes(undefined)).toBeNull()
  })

  it('returns null when no finite LLM numeric is present', () => {
    expect(deriveMoodAxes({ mood_tags: ['tense'] })).toBeNull()
    expect(deriveMoodAxes({ llm_intensity: null, llm_pacing: undefined })).toBeNull()
  })

  it('creates a correctly named axis for each finite LLM column', () => {
    const axes = deriveMoodAxes(FULL)
    const byName = Object.fromEntries(axes.map(a => [a.name, a]))
    expect(byName.Intensity).toBeTruthy()
    expect(byName.Pace).toBeTruthy()
    expect(byName.Depth).toBeTruthy()
    expect(byName.Dialogue).toBeTruthy()
    expect(byName.Focus).toBeTruthy()
  })

  it('divides values by 100', () => {
    const axes = deriveMoodAxes({ llm_intensity: 80 })
    expect(axes.find(a => a.name === 'Intensity').weight).toBeCloseTo(0.8, 6)
  })

  it('clamps values below 0 to 0', () => {
    const axes = deriveMoodAxes({ llm_intensity: -20 })
    expect(axes.find(a => a.name === 'Intensity').weight).toBe(0)
  })

  it('clamps values above 100 to 1', () => {
    const axes = deriveMoodAxes({ llm_intensity: 150 })
    expect(axes.find(a => a.name === 'Intensity').weight).toBe(1)
  })

  it('returns only the available numeric axes plus Range for partial data', () => {
    const axes = deriveMoodAxes({ llm_intensity: 70, llm_pacing: 30, mood_tags: ['tense'] })
    expect(axes.map(a => a.name)).toEqual(['Intensity', 'Pace', 'Range'])
  })

  it('Range uses mood_tags.length / 8', () => {
    const axes = deriveMoodAxes({ llm_intensity: 50, mood_tags: ['a', 'b', 'c', 'd'] })
    expect(axes.find(a => a.name === 'Range').weight).toBeCloseTo(4 / 8, 6)
  })

  it('Range saturates at 1', () => {
    const tags = Array.from({ length: 12 }, (_, i) => `t${i}`)
    const axes = deriveMoodAxes({ llm_intensity: 50, mood_tags: tags })
    expect(axes.find(a => a.name === 'Range').weight).toBe(1)
  })

  it('missing / non-array mood tags produce Range 0', () => {
    expect(deriveMoodAxes({ llm_intensity: 50 }).find(a => a.name === 'Range').weight).toBe(0)
    expect(deriveMoodAxes({ llm_intensity: 50, mood_tags: 'tense' }).find(a => a.name === 'Range').weight).toBe(0)
  })

  it('does not mutate the original film row', () => {
    const snap = JSON.stringify(FULL)
    deriveMoodAxes(FULL)
    expect(JSON.stringify(FULL)).toBe(snap)
  })

  it('keeps the axis order Intensity · Pace · Depth · Dialogue · Focus · Range', () => {
    expect(deriveMoodAxes(FULL).map(a => a.name)).toEqual(
      ['Intensity', 'Pace', 'Depth', 'Dialogue', 'Focus', 'Range'],
    )
  })

  it('keeps the current axis colours', () => {
    const byName = Object.fromEntries(deriveMoodAxes(FULL).map(a => [a.name, a.hex]))
    expect(byName).toEqual({
      Intensity: '#EF4444', Pace: '#A78BFA', Depth: '#34D399',
      Dialogue: '#7DD3FC', Focus: '#F472B6', Range: '#FBBF24',
    })
  })
})
