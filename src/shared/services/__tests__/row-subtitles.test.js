import { describe, expect, it } from 'vitest'

import { topOfTasteSubtitle, moodRowTitle, moodRowSubtitle } from '../row-subtitles'

describe('topOfTasteSubtitle', () => {
  it('returns null for null/empty profile', () => {
    expect(topOfTasteSubtitle(null)).toBeNull()
    expect(topOfTasteSubtitle({})).toBeNull()
    expect(topOfTasteSubtitle({ affinity: {} })).toBeNull()
    expect(topOfTasteSubtitle({ affinity: { fit_profiles: [] } })).toBeNull()
  })

  it('returns single label when one fit profile', () => {
    const profile = {
      affinity: { fit_profiles: [{ profile: 'prestige_drama', weight: 1 }] },
    }
    expect(topOfTasteSubtitle(profile)).toBe('Leaning into prestige dramas')
  })

  it('joins two labels with "and"', () => {
    const profile = {
      affinity: {
        fit_profiles: [
          { profile: 'cult_classic', weight: 1 },
          { profile: 'arthouse', weight: 0.8 },
        ],
      },
    }
    expect(topOfTasteSubtitle(profile)).toBe('Leaning into cult classics and arthouse')
  })

  it('caps at two labels even with more fit profiles', () => {
    const profile = {
      affinity: {
        fit_profiles: [
          { profile: 'genre_popcorn', weight: 1 },
          { profile: 'comfort_watch', weight: 0.8 },
          { profile: 'prestige_drama', weight: 0.6 },
        ],
      },
    }
    const result = topOfTasteSubtitle(profile)
    expect(result).toBe('Leaning into genre cinema and comfort watches')
    expect(result).not.toContain('prestige')
  })
})

// ============================================================================
// moodRowTitle
// ============================================================================

describe('moodRowTitle', () => {
  it('returns tone title for strong allowlisted tone with count >= 8', () => {
    const profile = {
      affinity: {
        tone_tags: [{ tag: 'dark', count: 10 }],
        mood_tags: [{ tag: 'tense', count: 4 }],
      },
    }
    const result = moodRowTitle(profile)
    expect(result).toEqual({ title: 'Films with a dark edge', lead: 'dark', kind: 'tone' })
  })

  it('uses "an" article before vowel-sound tones', () => {
    const profile = {
      affinity: {
        tone_tags: [{ tag: 'uplifting', count: 9 }],
        mood_tags: [{ tag: 'warm', count: 3 }],
      },
    }
    expect(moodRowTitle(profile).title).toBe('Films with an uplifting edge')
  })

  it('falls back to mood when tone is not in allowlist', () => {
    const profile = {
      affinity: {
        tone_tags: [{ tag: 'earnest', count: 12 }],
        mood_tags: [{ tag: 'tense', count: 4 }],
      },
    }
    const result = moodRowTitle(profile)
    expect(result).toEqual({ title: 'Films that feel tense', lead: 'tense', kind: 'mood' })
  })

  it('falls back to mood when tone count < 8', () => {
    const profile = {
      affinity: {
        tone_tags: [{ tag: 'dark', count: 5 }],
        mood_tags: [{ tag: 'tense', count: 4 }],
      },
    }
    const result = moodRowTitle(profile)
    expect(result).toEqual({ title: 'Films that feel tense', lead: 'tense', kind: 'mood' })
  })

  it('returns generic fallback when no mood or tone data', () => {
    expect(moodRowTitle(null)).toEqual({ title: 'Films for your mood', lead: null, kind: 'mood' })
    expect(moodRowTitle({ affinity: {} })).toEqual({ title: 'Films for your mood', lead: null, kind: 'mood' })
  })
})

// ============================================================================
// moodRowSubtitle
// ============================================================================

describe('moodRowSubtitle', () => {
  it('returns null for empty/no mood tags', () => {
    expect(moodRowSubtitle(null)).toBeNull()
    expect(moodRowSubtitle({ affinity: { mood_tags: [] } })).toBeNull()
  })

  it('returns single tag subtitle', () => {
    const profile = { affinity: { mood_tags: [{ tag: 'melancholic' }] } }
    expect(moodRowSubtitle(profile)).toBe('Drawing from your taste for melancholic films')
  })

  it('joins 3 tags with comma and "and"', () => {
    const profile = {
      affinity: {
        mood_tags: [{ tag: 'tense' }, { tag: 'mysterious' }, { tag: 'thrilling' }],
      },
    }
    expect(moodRowSubtitle(profile)).toBe(
      'Drawing from your taste for tense, mysterious and thrilling films',
    )
  })

  it('caps at 3 tags', () => {
    const profile = {
      affinity: {
        mood_tags: [
          { tag: 'tense' }, { tag: 'dark' }, { tag: 'gritty' }, { tag: 'brooding' },
        ],
      },
    }
    const result = moodRowSubtitle(profile)
    expect(result).toBe('Drawing from your taste for tense, dark and gritty films')
    expect(result).not.toContain('brooding')
  })
})
