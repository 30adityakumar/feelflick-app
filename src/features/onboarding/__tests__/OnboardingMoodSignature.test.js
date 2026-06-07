// src/features/onboarding/__tests__/OnboardingMoodSignature.test.js
// F2.8 — the wrapper mood-signature helper that drives the onboarding ambient
// tint (CSS vars). Pure function; no rendering / no live data.

import { describe, it, expect } from 'vitest'
import { deriveMoodSignature } from '../components/AmbientGlow'
import { MOODS } from '../data'

describe('deriveMoodSignature', () => {
  it('returns the restrained brand-purple default when no moods are selected', () => {
    expect(deriveMoodSignature([])).toBe('168, 85, 247')
    expect(deriveMoodSignature()).toBe('168, 85, 247')
  })

  it('returns the single mood rgb exactly (no blend)', () => {
    const cozy = MOODS.find(m => m.key === 'cozy').rgb // '236, 72, 153'
    expect(deriveMoodSignature(['cozy'])).toBe('236, 72, 153')
    expect(deriveMoodSignature(['cozy'])).toBe(cozy.split(',').map(n => n.trim()).join(', '))
  })

  it('averages multiple moods deterministically and order-independently', () => {
    // cozy 236,72,153 + wired 168,85,247 → ((236+168)/2, (72+85)/2, (153+247)/2)
    //                                    → (202, 78.5→79, 200)
    const a = deriveMoodSignature(['cozy', 'wired'])
    const b = deriveMoodSignature(['wired', 'cozy'])
    expect(a).toBe(b)              // order-independent
    expect(a).toBe('202, 79, 200')
  })

  it('averages three moods deterministically', () => {
    // cozy 236,72,153 + wired 168,85,247 + tense 129,140,248
    // → ((236+168+129)/3, (72+85+140)/3, (153+247+248)/3) → (177.67→178, 99, 216)
    expect(deriveMoodSignature(['cozy', 'wired', 'tense'])).toBe('178, 99, 216')
  })

  it('ignores unknown mood keys, falling back to the default when none are valid', () => {
    expect(deriveMoodSignature(['bogus'])).toBe('168, 85, 247')
    // a valid + invalid key resolves to just the valid mood
    expect(deriveMoodSignature(['cozy', 'bogus'])).toBe('236, 72, 153')
  })

  it('always returns a well-formed "r, g, b" triplet', () => {
    for (const m of MOODS) {
      expect(deriveMoodSignature([m.key])).toMatch(/^\d{1,3}, \d{1,3}, \d{1,3}$/)
    }
    expect(deriveMoodSignature(MOODS.map(m => m.key))).toMatch(/^\d{1,3}, \d{1,3}, \d{1,3}$/)
  })
})
