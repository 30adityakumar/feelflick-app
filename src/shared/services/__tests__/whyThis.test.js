import { describe, expect, it } from 'vitest'

import { buildWhyThis } from '../whyThis'

describe('buildWhyThis', () => {
  const baseBrief = { answers: {} }

  it('returns anchor copy when title matches anchor', () => {
    const movie = { title: 'Arrival' }
    const brief = { answers: {}, anchor: { id: 1, title: 'Arrival' } }

    expect(buildWhyThis(movie, brief)).toBe(
      'Your anchor film \u2014 the brief starts here.',
    )
  })

  it('returns strong mood+tone copy when 2+ mood and 1+ tone overlap', () => {
    const movie = {
      title: 'X',
      mood_tags: ['warm', 'comforting', 'gentle'],
      tone_tags: ['warm', 'hopeful'],
    }
    const brief = { answers: { feeling: 1, tone: 'warm' } }

    const result = buildWhyThis(movie, brief)
    expect(result).toContain('Captures the')
  })

  it('returns strong mood copy with energy variant', () => {
    const movie = {
      title: 'X',
      mood_tags: ['warm', 'comforting'],
      tone_tags: [],
    }
    const brief = { answers: { feeling: 1, energy: 5 } }

    expect(buildWhyThis(movie, brief)).toContain('momentum')
  })

  it('returns strong mood copy with low energy variant', () => {
    const movie = {
      title: 'X',
      mood_tags: ['warm', 'comforting'],
      tone_tags: [],
    }
    const brief = { answers: { feeling: 1, energy: 1 } }

    expect(buildWhyThis(movie, brief)).toContain('space to breathe')
  })

  it('returns tone + runtime copy when tone matches and runtime fits', () => {
    const movie = {
      title: 'X',
      mood_tags: [],
      tone_tags: ['sharp', 'cynical'],
      runtime: 85,
    }
    const brief = { answers: { tone: 'sharp', time: 'short' } }

    expect(buildWhyThis(movie, brief)).toContain('length you wanted')
  })

  it('returns fit profile copy when available', () => {
    const movie = {
      title: 'X',
      mood_tags: [],
      tone_tags: [],
      fit_profile: 'arthouse',
    }

    expect(buildWhyThis(movie, baseBrief)).toBe(
      'A director-driven film that rewards attention.',
    )
  })

  it('returns single mood overlap copy', () => {
    const movie = {
      title: 'X',
      mood_tags: ['warm'],
      tone_tags: [],
    }
    const brief = { answers: { feeling: 1 } }

    expect(buildWhyThis(movie, brief)).toBe('A warm pick for tonight.')
  })

  it('returns single tone overlap copy', () => {
    const movie = {
      title: 'X',
      mood_tags: [],
      tone_tags: ['bittersweet'],
    }
    const brief = { answers: { tone: 'bittersweet' } }

    expect(buildWhyThis(movie, brief)).toBe(
      'The bittersweet tone you asked for.',
    )
  })

  it('returns fallback with dimension count', () => {
    const movie = { title: 'X', mood_tags: [], tone_tags: [] }

    const result = buildWhyThis(movie, baseBrief)
    expect(result).toMatch(/Matches your brief across \d+ dimensions/)
  })

  it('never exceeds 12 words', () => {
    const cases = [
      { movie: { title: 'A', mood_tags: ['warm', 'comforting'], tone_tags: ['warm'] }, brief: { answers: { feeling: 1, tone: 'warm' } } },
      { movie: { title: 'B', mood_tags: [], tone_tags: [], fit_profile: 'blockbuster' }, brief: baseBrief },
      { movie: { title: 'C', mood_tags: [], tone_tags: [] }, brief: baseBrief },
    ]

    for (const { movie, brief } of cases) {
      const words = buildWhyThis(movie, brief).split(/\s+/)
      expect(words.length).toBeLessThanOrEqual(12)
    }
  })
})
