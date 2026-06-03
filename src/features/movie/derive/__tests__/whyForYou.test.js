import { describe, it, expect } from 'vitest'

import { deriveWhyReasons, deriveWhyHeader } from '../whyForYou'

// F6A baseline: pin the EXISTING case-making contract so F6B's primary-case work
// can't regress it. These assert current behavior only (no behavior change).
describe('deriveWhyReasons — Film File case contract', () => {
  it('returns [] when there is no movie', () => {
    expect(deriveWhyReasons({ mv: null })).toEqual([])
  })

  it('surfaces a personalized mood-overlap card when the user fingerprint overlaps the film', () => {
    const reasons = deriveWhyReasons({
      mv: { director: '—', runtime: 0 },
      filmDbRow: { mood_tags: ['tense', 'dark'], tone_tags: [], fit_profile: null },
      fingerprint: { total: 20, topMoodTags: [{ key: 'tense' }], topFitProfiles: [] },
      directorCount: 0,
    })
    const mood = reasons.find(r => r.id === 'mood-overlap')
    expect(mood).toBeTruthy()
    expect(mood.detail).toMatch(/watched films/i) // grounded in real history, not fabricated
    // mood slot de-dupes: the personalized card wins over the descriptive 'mood-film'.
    expect(reasons.some(r => r.id === 'mood-film')).toBe(false)
  })

  it('falls back to descriptive film cards (no fabrication) when there is no fingerprint', () => {
    const reasons = deriveWhyReasons({
      mv: { director: 'Bong Joon-ho', runtime: 132 },
      filmDbRow: { mood_tags: ['tense'], tone_tags: ['gritty'], fit_profile: 'prestige_drama' },
      fingerprint: null,
      directorCount: 0,
    })
    expect(reasons.some(r => r.id === 'mood-film')).toBe(true)
    // A director with 0 films in the library is framed as discovery, not a personalized "fit".
    const dir = reasons.find(r => r.id === 'director')
    if (dir) expect(dir.detail).toMatch(/first time/i)
    expect(reasons.length).toBeLessThanOrEqual(4)
  })
})

describe('deriveWhyHeader — adapts honestly to user state', () => {
  it('invites sign-in when signed out', () => {
    expect(deriveWhyHeader({ fingerprint: null, signedIn: false }).rationale).toMatch(/sign in/i)
  })

  it('nudges cold-start users to rate more', () => {
    expect(deriveWhyHeader({ fingerprint: null, signedIn: true }).rationale).toMatch(/rate 5\+/i)
  })

  it('claims personalization only for a warm fingerprint', () => {
    expect(deriveWhyHeader({ fingerprint: { total: 20 }, signedIn: true }).eyebrow).toMatch(/why this fits you/i)
  })
})
