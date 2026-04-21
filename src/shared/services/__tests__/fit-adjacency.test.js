import { describe, expect, it } from 'vitest'

import {
  FIT_ADJACENCY,
  FIT_PROFILES,
  scoreFitAgainstProfiles,
  promoteRatedFitProfiles,
} from '../fit-adjacency'

// ============================================================================
// scoreFitAgainstProfiles
// ============================================================================

describe('scoreFitAgainstProfiles', () => {
  it('returns 100 for exact top-1 match', () => {
    expect(scoreFitAgainstProfiles('genre_popcorn', ['genre_popcorn', 'prestige_drama'])).toBe(100)
  })

  it('returns 80 for top-2 match', () => {
    expect(scoreFitAgainstProfiles('prestige_drama', ['genre_popcorn', 'prestige_drama'])).toBe(80)
  })

  it('returns 70 for top-3 match', () => {
    expect(scoreFitAgainstProfiles('cult_classic', ['genre_popcorn', 'prestige_drama', 'cult_classic'])).toBe(70)
  })

  it('returns 70 for close adjacency from top-1', () => {
    // crowd_pleaser is close adjacent to genre_popcorn
    expect(scoreFitAgainstProfiles('crowd_pleaser', ['genre_popcorn'])).toBe(70)
  })

  it('returns 70 for close adjacency to prestige_drama', () => {
    // challenging_art is close adjacent to prestige_drama
    expect(scoreFitAgainstProfiles('challenging_art', ['prestige_drama'])).toBe(70)
  })

  it('returns 40 for far adjacency from top-1', () => {
    // cult_classic is far adjacent to genre_popcorn
    expect(scoreFitAgainstProfiles('cult_classic', ['genre_popcorn'])).toBe(40)
  })

  it('returns 60 for close adjacency from top-2', () => {
    // arthouse is close adj to prestige_drama (top-2), not adj to genre_popcorn (top-1)
    expect(scoreFitAgainstProfiles('arthouse', ['genre_popcorn', 'prestige_drama'])).toBe(60)
  })

  it('returns 30 for far adjacency from top-2', () => {
    // festival_discovery is far adj to prestige_drama (top-2), not adj to genre_popcorn (top-1)
    expect(scoreFitAgainstProfiles('festival_discovery', ['genre_popcorn', 'prestige_drama'])).toBe(30)
  })

  it('returns 0 for clash (not adjacent to any top profile)', () => {
    // arthouse is not adjacent to genre_popcorn (only top profile)
    expect(scoreFitAgainstProfiles('arthouse', ['genre_popcorn'])).toBe(0)
  })

  it('returns 40 for unknown/null candidate fit_profile', () => {
    expect(scoreFitAgainstProfiles(null, ['genre_popcorn'])).toBe(40)
    expect(scoreFitAgainstProfiles(undefined, ['genre_popcorn'])).toBe(40)
  })

  it('returns 50 for cold start (no user profiles)', () => {
    expect(scoreFitAgainstProfiles('genre_popcorn', [])).toBe(50)
    expect(scoreFitAgainstProfiles('genre_popcorn', null)).toBe(50)
  })
})

// ============================================================================
// promoteRatedFitProfiles
// ============================================================================

describe('promoteRatedFitProfiles', () => {
  it('promotes fit_profile with rated >= 8 even if share < 15%', () => {
    const fpCounts = new Map([
      ['genre_popcorn', 10],
      ['prestige_drama', 5],
      ['challenging_art', 1], // share = 1/16 = 6%, below 15%
    ])
    const seeds = [
      { id: 100, rating: 9 }, // rated high
    ]
    const fitById = new Map([
      [100, 'challenging_art'],
    ])

    const result = promoteRatedFitProfiles(fpCounts, seeds, fitById)

    // challenging_art should be promoted despite low share
    const ca = result.find(e => e.profile === 'challenging_art')
    expect(ca).toBeDefined()
    expect(ca.promoted).toBe(true)
  })

  it('does not promote unrated fit_profile with low share', () => {
    const fpCounts = new Map([
      ['genre_popcorn', 10],
      ['prestige_drama', 5],
      ['challenging_art', 1], // share < 15%, no rating >= 8
    ])
    const seeds = [
      { id: 100, rating: 6 }, // too low to promote
    ]
    const fitById = new Map([
      [100, 'challenging_art'],
    ])

    const result = promoteRatedFitProfiles(fpCounts, seeds, fitById)

    const ca = result.find(e => e.profile === 'challenging_art')
    expect(ca).toBeUndefined()
  })

  it('keeps profiles with share >= 15% regardless of rating', () => {
    const fpCounts = new Map([
      ['genre_popcorn', 10],
      ['prestige_drama', 5], // share = 5/15 = 33%
    ])
    const seeds = []
    const fitById = new Map()

    const result = promoteRatedFitProfiles(fpCounts, seeds, fitById)

    expect(result.length).toBe(2)
    expect(result[0].profile).toBe('genre_popcorn')
    expect(result[1].profile).toBe('prestige_drama')
  })

  it('promoted entries float to top', () => {
    const fpCounts = new Map([
      ['genre_popcorn', 10],
      ['prestige_drama', 5],
      ['challenging_art', 1],
    ])
    const seeds = [{ id: 100, rating: 9 }]
    const fitById = new Map([[100, 'challenging_art']])

    const result = promoteRatedFitProfiles(fpCounts, seeds, fitById)

    // challenging_art promoted, should be first
    expect(result[0].profile).toBe('challenging_art')
    expect(result[0].promoted).toBe(true)
  })

  it('returns empty for empty counts', () => {
    expect(promoteRatedFitProfiles(new Map(), [], new Map())).toEqual([])
  })
})

// ============================================================================
// FIT_ADJACENCY structure
// ============================================================================

describe('FIT_ADJACENCY', () => {
  it('every FIT_PROFILES entry has an adjacency entry', () => {
    for (const fp of FIT_PROFILES) {
      expect(FIT_ADJACENCY[fp], `missing adjacency for ${fp}`).toBeDefined()
      expect(FIT_ADJACENCY[fp].close).toBeInstanceOf(Array)
      expect(FIT_ADJACENCY[fp].far).toBeInstanceOf(Array)
    }
  })

  it('close and far arrays only contain valid FIT_PROFILES', () => {
    for (const [source, { close, far }] of Object.entries(FIT_ADJACENCY)) {
      for (const target of [...close, ...far]) {
        expect(FIT_PROFILES, `${source} references unknown profile: ${target}`).toContain(target)
      }
    }
  })
})
