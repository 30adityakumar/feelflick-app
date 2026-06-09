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

// F5.2 — expand the pins WITHOUT changing wording, thresholds, ranking, or count.
// (F5.1 flagged the missing signal-strength + exact-match-only fit as F5.4 work;
// these tests document the CURRENT behavior, they do not "fix" it.)
describe('deriveWhyReasons — current ordering, caps, and null-safety (pre-F5.4)', () => {
  it('returns at most 4 cards', () => {
    const reasons = deriveWhyReasons({
      mv: { director: 'Bong Joon-ho', runtime: 132 },
      filmDbRow: { mood_tags: ['tense', 'dark'], tone_tags: ['gritty'], fit_profile: 'prestige_drama' },
      fingerprint: { total: 30, topMoodTags: [{ key: 'tense' }], topFitProfiles: [{ key: 'prestige_drama', share: 0.4 }] },
      directorCount: 2,
    })
    expect(reasons.length).toBeLessThanOrEqual(4)
  })

  it('personalized cards win their slot and sort ahead of descriptive ones', () => {
    const reasons = deriveWhyReasons({
      mv: { director: 'Bong Joon-ho', runtime: 132 },
      filmDbRow: { mood_tags: ['tense'], tone_tags: [], fit_profile: 'prestige_drama' },
      fingerprint: { total: 30, topMoodTags: [{ key: 'tense' }], topFitProfiles: [{ key: 'prestige_drama', share: 0.4 }] },
      directorCount: 2,
    })
    // personalized mood-overlap + fit-match win their slots (descriptive variants drop)
    expect(reasons.some(r => r.id === 'mood-overlap')).toBe(true)
    expect(reasons.some(r => r.id === 'mood-film')).toBe(false)
    expect(reasons.some(r => r.id === 'fit-match')).toBe(true)
    expect(reasons.some(r => r.id === 'fit-film')).toBe(false)
    // mood-overlap (priority 1) sorts ahead of fit-match (priority 2)
    expect(reasons.findIndex(r => r.id === 'mood-overlap')).toBeLessThan(reasons.findIndex(r => r.id === 'fit-match'))
  })

  it('fit-profile match needs an EXACT match against the user top fit profile', () => {
    const base = {
      mv: { director: '—', runtime: 0 },
      filmDbRow: { mood_tags: [], tone_tags: [], fit_profile: 'arthouse' },
      fingerprint: { total: 30, topMoodTags: [], topFitProfiles: [{ key: 'prestige_drama', share: 0.5 }] },
      directorCount: 0,
    }
    expect(deriveWhyReasons(base).some(r => r.id === 'fit-match')).toBe(false) // arthouse ≠ prestige_drama
    const exact = { ...base, filmDbRow: { ...base.filmDbRow, fit_profile: 'prestige_drama' } }
    expect(deriveWhyReasons(exact).some(r => r.id === 'fit-match')).toBe(true)
  })

  it('frames a director with library history as a personalized count', () => {
    const reasons = deriveWhyReasons({
      mv: { director: 'Bong Joon-ho', runtime: 0 },
      filmDbRow: { mood_tags: [], tone_tags: [], fit_profile: null },
      fingerprint: null, directorCount: 3,
    })
    const dir = reasons.find(r => r.id === 'director')
    expect(dir.detail).toMatch(/3 films/i)
    expect(dir.detail).not.toMatch(/first time/i)
  })

  it('produces a runtime band card when runtime > 0 and none when runtime is 0', () => {
    const withTime = deriveWhyReasons({ mv: { director: '—', runtime: 132 }, filmDbRow: { mood_tags: [] }, fingerprint: null, directorCount: 0 })
    expect(withTime.some(r => r.id === 'time')).toBe(true)
    const noTime = deriveWhyReasons({ mv: { director: '—', runtime: 0 }, filmDbRow: { mood_tags: [] }, fingerprint: null, directorCount: 0 })
    expect(noTime.some(r => r.id === 'time')).toBe(false)
  })

  it('is null-safe with sparse inputs and does not mutate them', () => {
    const args = { mv: { director: '—', runtime: 0 }, filmDbRow: { mood_tags: ['tense'] }, fingerprint: null, directorCount: 0 }
    const snap = JSON.stringify(args)
    expect(Array.isArray(deriveWhyReasons(args))).toBe(true)
    expect(JSON.stringify(args)).toBe(snap)
  })
})
