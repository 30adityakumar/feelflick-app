import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFrom = vi.fn()

vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
  },
}))

vi.mock('@/shared/lib/cache', () => ({
  recommendationCache: {
    key: (type, userId, params) => `${type}:${userId}:${JSON.stringify(params)}`,
    getOrFetch: (_key, fn) => fn(),
  },
}))

vi.mock('@/shared/services/exclusions', () => ({
  applyAllExclusions: vi.fn().mockImplementation((query) => query),
}))

vi.mock('@/shared/services/quality-tiers', () => ({
  applyQualityFloor: vi.fn().mockImplementation((query) => query),
  QUALITY_TIERS: { HERO: { ff_audience_rating: 78 }, SIGNATURE: { ff_audience_rating: 75 }, CONTEXT: { ff_audience_rating: 68 } },
}))

vi.mock('@/shared/services/recommendations', () => ({
  computeUserProfileV3: vi.fn(),
}))

const mockScoreMovieV3 = vi.fn()
vi.mock('@/shared/services/scoring-v3', () => ({
  scoreMovieV3: (...args) => mockScoreMovieV3(...args),
  precomputeScoringContext: vi.fn().mockResolvedValue({
    seedNeighborMap: new Map(),
    antiSeedNeighborMap: new Map(),
    isColdStart: false,
  }),
}))

import { getSignatureDirectorRow } from '../homepage-rows'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProfile(overrides = {}) {
  return {
    affinity: {
      fit_profiles: [],
      directors: [
        { name: 'Christopher Nolan', count: 5, avg_rating: 8.4 },
        { name: 'Denis Villeneuve', count: 3, avg_rating: 7.8 },
      ],
      mood_tags: [],
      tone_tags: [],
      genre_combos: [],
      ...overrides.affinity,
    },
    watched_ids: new Set([100, 200, 300]),
    negative: {
      skipped_fit_profiles: new Map(),
      anti_seeds: [],
      personal_skipped_ids: new Set(),
      row_cooldown: new Set(),
    },
    community: { high_skip_rate_ids: new Set() },
    meta: { total_watches: 20, confidence: 'engaged' },
    _legacy: {
      watchedMovieIds: [100, 200, 300],
      exclusions: { genreIds: new Set(), genreNames: [] },
      topFitProfiles: [],
      qualityProfile: { totalMoviesWatched: 20 },
    },
    ...overrides,
  }
}

function makeFilm(id, title, opts = {}) {
  return {
    id,
    tmdb_id: id * 10,
    title,
    poster_path: '/p.jpg',
    genres: ['Sci-Fi'],
    director_name: opts.director || 'Christopher Nolan',
    ff_audience_rating: opts.rating || 82,
    ff_audience_confidence: 70,
    ...opts,
  }
}

function mockChainedQuery(result, personResult) {
  const movieChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  }
  const personChain = {
    select: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(personResult || { data: null, error: null }),
  }
  mockFrom.mockImplementation((table) => {
    if (table === 'people') return personChain
    return movieChain
  })
  return { movieChain, personChain }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getSignatureDirectorRow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockScoreMovieV3.mockReturnValue({ final: 75, breakdown: { quality: 75 }, weights_used: {} })
  })

  it('returns { films, director, subtitle } shape', async () => {
    const profile = makeProfile()
    const films = Array.from({ length: 8 }, (_, i) => makeFilm(i + 1, `Film ${i + 1}`))
    mockChainedQuery(
      { data: films, error: null },
      { data: { id: 999, name: 'Christopher Nolan', profile_path: '/nolan.jpg' }, error: null },
    )

    const result = await getSignatureDirectorRow('user-1', profile)

    expect(result).toHaveProperty('films')
    expect(result).toHaveProperty('director')
    expect(result).toHaveProperty('subtitle')
    expect(result.director).toEqual({
      name: expect.any(String),
      profile_path: expect.any(String),
      id: expect.any(Number),
    })
    expect(typeof result.subtitle).toBe('string')
  })

  it('excludes watched films from results', async () => {
    const profile = makeProfile({ watched_ids: new Set([1, 3]) })
    const films = [
      makeFilm(1, 'Watched A'),
      makeFilm(2, 'Unwatched B'),
      makeFilm(3, 'Watched C'),
      makeFilm(4, 'Unwatched D'),
      makeFilm(5, 'Unwatched E'),
      makeFilm(6, 'Unwatched F'),
      makeFilm(7, 'Unwatched G'),
      makeFilm(8, 'Unwatched H'),
    ]
    mockChainedQuery({ data: films, error: null })

    const result = await getSignatureDirectorRow('user-1', profile)

    expect(result.films.every(f => ![1, 3].includes(f.id))).toBe(true)
    expect(result.films.length).toBe(6)
  })

  it('hides row when fewer than 4 unwatched films', async () => {
    // 8 films total, 6 watched → only 2 unwatched → below threshold
    const profile = makeProfile({ watched_ids: new Set([1, 2, 3, 4, 5, 6]) })
    const films = Array.from({ length: 8 }, (_, i) => makeFilm(i + 1, `Film ${i + 1}`))
    mockChainedQuery({ data: films, error: null })

    const result = await getSignatureDirectorRow('user-1', profile)

    expect(result.films).toEqual([])
    expect(result.director).toBeNull()
  })

  it('builds subtitle with avg_rating when >= 8', async () => {
    const profile = makeProfile({
      affinity: {
        directors: [{ name: 'Christopher Nolan', count: 5, avg_rating: 8.4 }],
      },
    })
    const films = Array.from({ length: 8 }, (_, i) => makeFilm(i + 1, `Film ${i + 1}`))
    mockChainedQuery({ data: films, error: null })

    const result = await getSignatureDirectorRow('user-1', profile)

    expect(result.subtitle).toContain('5 of their films')
    expect(result.subtitle).toContain('8.4')
  })

  it('builds subtitle without rating when avg_rating < 8', async () => {
    const profile = makeProfile({
      affinity: {
        directors: [{ name: 'Denis Villeneuve', count: 3, avg_rating: 7.2 }],
      },
    })
    const films = Array.from({ length: 8 }, (_, i) =>
      makeFilm(i + 1, `Film ${i + 1}`, { director: 'Denis Villeneuve' }),
    )
    mockChainedQuery({ data: films, error: null })

    const result = await getSignatureDirectorRow('user-1', profile)

    expect(result.subtitle).toContain('3 of their films')
    expect(result.subtitle).not.toContain('averaging')
  })

  it('returns empty shape when no directors in profile', async () => {
    const profile = makeProfile({
      affinity: { directors: [] },
    })

    const result = await getSignatureDirectorRow('user-1', profile)

    expect(result).toEqual({ films: [], director: null, subtitle: null })
  })

  it('returns empty shape for guest user', async () => {
    const result = await getSignatureDirectorRow(null, null)
    expect(result).toEqual({ films: [], director: null, subtitle: null })
  })
})
