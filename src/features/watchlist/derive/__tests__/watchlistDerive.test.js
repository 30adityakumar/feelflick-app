import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Control the engine-vs-approx selection in deriveItems deterministically.
vi.mock('@/shared/services/recommendations', () => ({ scoreMovieForUser: vi.fn(() => null) }))
vi.mock('@/shared/services/matchScore', () => ({ computeMatchPercent: vi.fn(() => null) }))

import { scoreMovieForUser } from '@/shared/services/recommendations'
import { computeMatchPercent } from '@/shared/services/matchScore'
import {
  STALE_DAYS, capitalize, pickPrimaryMood, daysAgo, approxMatch, deriveWhy,
  deriveItems, deriveAvailableMoods, recomputeStats,
} from '../watchlistDerive'

// F6.2 — pins CURRENT Watchlist derivation behavior (incl. the match-% / approxMatch
// presentation that F6.4 will deliberately change). These assertions are the contract
// the trust redesign must consciously edit.

const fp = { topMoodTags: [{ key: 'tender' }, { key: 'cozy' }, { key: 'tense' }], topFitProfiles: [{ key: 'comfort_watch' }] }

beforeEach(() => { vi.clearAllMocks(); scoreMovieForUser.mockReturnValue(null); computeMatchPercent.mockReturnValue(null) })
afterEach(() => vi.useRealTimers())

describe('STALE_DAYS', () => {
  it('is 60', () => { expect(STALE_DAYS).toBe(60) })
})

describe('capitalize / pickPrimaryMood', () => {
  it('capitalizes + de-underscores', () => {
    expect(capitalize('comfort_watch')).toBe('Comfort watch')
    expect(capitalize('')).toBe('')
  })
  it('pickPrimaryMood returns the capitalized first tag or null', () => {
    expect(pickPrimaryMood(['tender', 'cozy'])).toBe('Tender')
    expect(pickPrimaryMood([])).toBeNull()
    expect(pickPrimaryMood(null)).toBeNull()
  })
})

describe('daysAgo', () => {
  it('floors to whole local days, never negative', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    expect(daysAgo('2026-03-10T00:00:00Z')).toBe(0)
    expect(daysAgo('2026-03-05T12:00:00Z')).toBe(5)
    expect(daysAgo('2026-04-01T00:00:00Z')).toBe(0) // future → clamped to 0
    expect(daysAgo(null)).toBe(0)
  })
})

describe('approxMatch (the F6.4 false-precision target — pinned)', () => {
  const q = (r) => ({ mood_tags: [], fit_profile: null, ff_final_rating: r })
  it('base floor is 50 with no signals', () => {
    expect(approxMatch({ movie: { mood_tags: [] }, fingerprint: fp })).toBe(50)
  })
  it('+25 for a top-3 mood overlap', () => {
    expect(approxMatch({ movie: { mood_tags: ['tender'] }, fingerprint: fp })).toBe(75)
  })
  it('+10 more for a top-5 fit overlap', () => {
    expect(approxMatch({ movie: { mood_tags: ['tender'], fit_profile: 'comfort_watch' }, fingerprint: fp })).toBe(85)
  })
  it('+ up to 15 from quality (7.0→0, 8.0→7.5/8, 9.0→15)', () => {
    expect(approxMatch({ movie: q(7.0), fingerprint: fp })).toBe(50)
    expect(approxMatch({ movie: q(8.0), fingerprint: fp })).toBe(58) // 50 + 7.5 → round 58
    expect(approxMatch({ movie: q(9.0), fingerprint: fp })).toBe(65)
  })
  it('caps at 96 (all signals = 100 → 96) and floors at 50', () => {
    expect(approxMatch({ movie: { mood_tags: ['tender'], fit_profile: 'comfort_watch', ff_final_rating: 9.5 }, fingerprint: fp })).toBe(96)
    expect(approxMatch({ movie: { mood_tags: ['nope'] }, fingerprint: { topMoodTags: [], topFitProfiles: [] } })).toBe(50)
  })
})

describe('deriveWhy (restated-metadata line — pinned)', () => {
  it('top-mood + age variants', () => {
    expect(deriveWhy({ mood: 'Tender', match: 84, addedDaysAgo: 5, matchesTopMood: true })).toBe('Your tender pick · 84% match · waiting 5d')
    expect(deriveWhy({ mood: 'Cozy', match: 70, addedDaysAgo: 0, matchesTopMood: false })).toBe('Cozy pick · 70% match · saved today')
    expect(deriveWhy({ mood: 'Cozy', match: 70, addedDaysAgo: 1, matchesTopMood: false })).toBe('Cozy pick · 70% match · saved yesterday')
  })
})

describe('deriveItems (engine-vs-approx selection, perfect, stale)', () => {
  const row = (over = {}) => ({ movie_id: 1, added_at: '2026-03-09T00:00:00Z', movies: { id: 11, tmdb_id: 101, title: 'A', release_date: '2020-01-01', runtime: 100, director_name: 'D', mood_tags: ['tender'], poster_path: '/p.jpg', ...over.movies }, ...over })

  it('uses the engine match when computeMatchPercent returns non-null', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    computeMatchPercent.mockReturnValue(88)
    const [it] = deriveItems({ rows: [row()], fingerprint: fp, profile: { x: 1 } })
    expect(it.match).toBe(88)
  })

  it('falls back to approxMatch when the engine returns null (cold-start path)', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    computeMatchPercent.mockReturnValue(null) // engine has no signal
    const [it] = deriveItems({ rows: [row()], fingerprint: fp, profile: null })
    expect(it.match).toBe(75) // approxMatch: base 50 + 25 (tender is top mood)
  })

  it('perfect = top-mood match AND match≥80 AND not stale; stale = added >60d', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    computeMatchPercent.mockReturnValue(82)
    const fresh = deriveItems({ rows: [row({ added_at: '2026-03-09T00:00:00Z' })], fingerprint: fp, profile: { x: 1 } })[0]
    expect(fresh.stale).toBe(false)
    expect(fresh.perfect).toBe(true) // tender == top mood, 82≥80, fresh
    // 61 days old → stale → not perfect even with the same high match
    const old = deriveItems({ rows: [row({ added_at: '2026-01-07T00:00:00Z' })], fingerprint: fp, profile: { x: 1 } })[0]
    expect(old.addedDaysAgo).toBeGreaterThan(60)
    expect(old.stale).toBe(true)
    expect(old.perfect).toBe(false)
  })

  it('maps the row to the page shape (id, internalId, mood, poster size w500)', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-03-10T12:00:00Z'))
    computeMatchPercent.mockReturnValue(70)
    const [it] = deriveItems({ rows: [row()], fingerprint: fp, profile: { x: 1 } })
    expect(it).toMatchObject({ id: 1, internalId: 11, tmdbId: 101, title: 'A', mood: 'Tender' })
    expect(it.poster).toContain('w500')
  })
})

describe('deriveAvailableMoods', () => {
  it('counts distinct moods desc, excluding Mixed', () => {
    const items = [{ mood: 'Tender' }, { mood: 'Tender' }, { mood: 'Cozy' }, { mood: 'Mixed' }]
    expect(deriveAvailableMoods(items).map(m => [m.mood, m.count])).toEqual([['Tender', 2], ['Cozy', 1]])
  })
})

describe('recomputeStats', () => {
  it('top/avg match + perfect/stale counts', () => {
    const items = [
      { match: 90, perfect: true, stale: false },
      { match: 70, perfect: false, stale: true },
      { match: 50, perfect: false, stale: false },
    ]
    expect(recomputeStats(items)).toEqual({ watchlistTotal: 3, perfectForTonightCount: 1, gettingStaleCount: 1, topMatchPct: 90, avgMatchPct: 70 })
  })
})
