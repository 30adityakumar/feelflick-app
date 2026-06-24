import { describe, expect, it } from 'vitest'

import { deriveMoodSignature } from '../components/AmbientGlow'
import { MOODS } from '../data'

describe('deriveMoodSignature', () => {
  it('returns the neutral graphite default when no moods are selected', () => {
    expect(deriveMoodSignature([])).toBe('122, 126, 133')
    expect(deriveMoodSignature()).toBe('122, 126, 133')
  })

  it('returns a single selected mood exactly', () => {
    const cozy = MOODS.find(mood => mood.key === 'cozy').rgb
    expect(deriveMoodSignature(['cozy'])).toBe(cozy.split(',').map(channel => channel.trim()).join(', '))
  })

  it('averages multiple moods deterministically and order-independently', () => {
    const first = deriveMoodSignature(['cozy', 'wired'])
    const second = deriveMoodSignature(['wired', 'cozy'])
    expect(first).toBe(second)
    expect(first).toBe('202, 79, 200')
  })

  it('averages three moods deterministically', () => {
    expect(deriveMoodSignature(['cozy', 'wired', 'tense'])).toBe('178, 99, 216')
  })

  it('ignores unknown mood keys and uses the neutral default when none are valid', () => {
    expect(deriveMoodSignature(['bogus'])).toBe('122, 126, 133')
    expect(deriveMoodSignature(['cozy', 'bogus'])).toBe('236, 72, 153')
  })

  it('always returns a well-formed rgb triplet', () => {
    for (const mood of MOODS) {
      expect(deriveMoodSignature([mood.key])).toMatch(/^\d{1,3}, \d{1,3}, \d{1,3}$/)
    }
    expect(deriveMoodSignature(MOODS.map(mood => mood.key))).toMatch(/^\d{1,3}, \d{1,3}, \d{1,3}$/)
  })
})
