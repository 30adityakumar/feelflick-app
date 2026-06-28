import { describe, expect, it } from 'vitest'

import {
  topOfTasteSubtitle,
  moodRowTitle,
  moodRowSubtitle,
  moodSignatureLabel,
  signatureTonesLabel,
  dnaSignalsFromProfile,
} from '../rowSubtitles'

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

// ============================================================================
// moodSignatureLabel
// ============================================================================

describe('moodSignatureLabel', () => {
  it('returns null for null/empty mood data', () => {
    expect(moodSignatureLabel(null)).toBeNull()
    expect(moodSignatureLabel({ affinity: {} })).toBeNull()
    expect(moodSignatureLabel({ affinity: { mood_tags: [] } })).toBeNull()
  })

  it('sentence-cases a single mood tag', () => {
    expect(moodSignatureLabel({ affinity: { mood_tags: [{ tag: 'tense' }] } })).toBe('Tense')
  })

  it('joins the top two mood tags with an ampersand (only the first is capped)', () => {
    const profile = { affinity: { mood_tags: [{ tag: 'tense' }, { tag: 'melancholic' }] } }
    expect(moodSignatureLabel(profile)).toBe('Tense & melancholic')
  })

  it('caps at two tags even with more', () => {
    const profile = {
      affinity: { mood_tags: [{ tag: 'tense' }, { tag: 'melancholic' }, { tag: 'gritty' }] },
    }
    const result = moodSignatureLabel(profile)
    expect(result).toBe('Tense & melancholic')
    expect(result).not.toContain('gritty')
  })
})

// ============================================================================
// signatureTonesLabel
// ============================================================================

describe('signatureTonesLabel', () => {
  it('returns null for null/empty tone data', () => {
    expect(signatureTonesLabel(null)).toBeNull()
    expect(signatureTonesLabel({ affinity: {} })).toBeNull()
    expect(signatureTonesLabel({ affinity: { tone_tags: [] } })).toBeNull()
  })

  it('sentence-cases a single tone tag', () => {
    expect(signatureTonesLabel({ affinity: { tone_tags: [{ tag: 'cerebral' }] } })).toBe('Cerebral')
  })

  it('joins two tones with an ampersand', () => {
    const profile = { affinity: { tone_tags: [{ tag: 'cerebral' }, { tag: 'noir' }] } }
    expect(signatureTonesLabel(profile)).toBe('Cerebral & noir')
  })

  it('joins three tones with a comma and ampersand', () => {
    const profile = {
      affinity: { tone_tags: [{ tag: 'cerebral' }, { tag: 'atmospheric' }, { tag: 'noir' }] },
    }
    expect(signatureTonesLabel(profile)).toBe('Cerebral, atmospheric & noir')
  })

  it('caps at three tones even with more', () => {
    const profile = {
      affinity: {
        tone_tags: [{ tag: 'cerebral' }, { tag: 'atmospheric' }, { tag: 'noir' }, { tag: 'gritty' }],
      },
    }
    const result = signatureTonesLabel(profile)
    expect(result).toBe('Cerebral, atmospheric & noir')
    expect(result).not.toContain('gritty')
  })
})

// ============================================================================
// dnaSignalsFromProfile (keeps the DNA strip consistent with the facet rows)
// ============================================================================
describe('dnaSignalsFromProfile', () => {
  it('returns null when there is no affinity signal (so the strip keeps the honest fingerprint state)', () => {
    expect(dnaSignalsFromProfile(null)).toBeNull()
    expect(dnaSignalsFromProfile({})).toBeNull()
    expect(dnaSignalsFromProfile({ affinity: {} })).toBeNull()
    expect(dnaSignalsFromProfile({ affinity: { mood_tags: [], tone_tags: [] } })).toBeNull()
  })

  it('derives motifs (tones), moods, and fit from the same v3 affinity the rows use', () => {
    const profile = {
      affinity: {
        tone_tags: [{ tag: 'cerebral' }, { tag: 'atmospheric' }, { tag: 'noir' }, { tag: 'gritty' }],
        mood_tags: [{ tag: 'tense', weight: 3 }, { tag: 'melancholic', weight: 2 }],
        fit_profiles: [{ profile: 'arthouse' }, { profile: 'crowd-pleaser' }],
      },
    }
    const sig = dnaSignalsFromProfile(profile)
    expect(sig.motifs).toEqual(['Cerebral', 'Atmospheric', 'Noir']) // capped at 3, sentence-cased
    expect(sig.topMoods).toEqual([
      { label: 'Tense', weight: 3 },
      { label: 'Melancholic', weight: 2 },
    ])
    expect(sig.topFit).toBe('arthouse')
  })

  it('populates from a single facet (a thin profile with moods but no tones)', () => {
    const sig = dnaSignalsFromProfile({ affinity: { mood_tags: [{ tag: 'tender' }] } })
    expect(sig.motifs).toBeNull()
    expect(sig.topMoods).toEqual([{ label: 'Tender', weight: 0 }])
    expect(sig.topFit).toBeNull()
  })
})
