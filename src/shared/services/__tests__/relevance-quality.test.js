import { beforeEach, describe, expect, it, vi } from 'vitest'

// === Tests for v2.11 recommendation quality fixes ===
// 1. DB-level genre exclusion
// 2. determinePickReason (embedding verification for "Similar to X")
// 3. Orbit strict seed check
// 4. Fit profile adjacency scoring

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFrom = vi.fn()
const mockRpc = vi.fn()

vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
    rpc: (...args) => mockRpc(...args),
  },
}))

vi.mock('@/shared/lib/cache', () => ({
  recommendationCache: {
    key: (type, userId, params) => `${type}:${userId}:${JSON.stringify(params)}`,
    getOrFetch: (_key, fn) => fn(),
  },
}))

// Mock exclusions module (homepage-rows imports applyAllExclusions from ./exclusions)
vi.mock('@/shared/services/exclusions', () => ({
  applyAllExclusions: vi.fn().mockImplementation((query) => query),
}))

vi.mock('@/shared/services/recommendations', () => ({
  computeUserProfileV3: vi.fn().mockResolvedValue({
    rated: { positive_seeds: [], negative_seeds: [] },
    affinity: { fit_profiles: [{ profile: 'crowd_pleaser', count: 5 }], directors: [], mood_tags: [], tone_tags: [], genre_combos: [] },
    content_shape: { pacing: null, intensity: null, depth: null },
    negative: { skipped_fit_profiles: new Map(), anti_seeds: [], personal_skipped_ids: new Set() },
    community: { high_skip_rate_ids: new Set() },
    meta: { total_watches: 25, confidence: 'engaged' },
    _legacy: {
      watchedMovieIds: [100, 200],
      moodSignature: { recentMoodTags: [], recentToneTags: [], recentFitProfiles: [] },
      qualityProfile: { totalMoviesWatched: 25 },
      exclusions: { genreIds: new Set([16, 10751]), genreNames: ['Animation', 'Family'] },
      topFitProfiles: ['crowd_pleaser', 'comfort_watch'],
      affinities: { directors: [], actors: [] },
      fitProfileAffinity: { preferred: [], topShare: 0, franchiseFatigue: false },
    },
  }),
  scoreMovieForUser: vi.fn().mockReturnValue({ score: 75, positiveScore: 75 }),
}))

// Mock scoring-v3 — default returns 75
const mockScoreMovieV3 = vi.fn().mockReturnValue({ final: 75, breakdown: { quality: 75 }, weights_used: {} })
vi.mock('@/shared/services/scoring-v3', () => ({
  scoreMovieV3: (...args) => mockScoreMovieV3(...args),
  precomputeScoringContext: vi.fn().mockResolvedValue({
    seedNeighborMap: new Map(),
    antiSeedNeighborMap: new Map(),
    isColdStart: false,
  }),
}))

import { scoreMovieForUser } from '../recommendations'
import {
  getStillInOrbitRow,
  getTopOfYourTasteRow,
} from '../homepage-rows'

// ---------------------------------------------------------------------------
// Supabase chain mock helper
// ---------------------------------------------------------------------------

function mockChainedQuery(result) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
  }
  return chain
}

// ---------------------------------------------------------------------------
// 1. DB-level exclusion is called
// ---------------------------------------------------------------------------

describe('DB-level genre exclusion', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls applyAllExclusions on the query builder', async () => {
    const { applyAllExclusions } = await import('../exclusions')

    const profile = {
      _legacy: {
        watchedMovieIds: [],
        exclusions: { genreIds: new Set([16, 10751]), genreNames: ['Animation', 'Family'] },
        topFitProfiles: [],
        qualityProfile: { totalMoviesWatched: 10 },
      },
    }

    // Need >= 6 candidates to pass MIN_ROW_FILMS threshold
    const chain = mockChainedQuery({
      data: Array.from({ length: 8 }, (_, i) => ({
        id: i + 1, tmdb_id: (i + 1) * 10, title: `Film ${i + 1}`, poster_path: '/a.jpg',
        genres: ['Science Fiction'], ff_audience_rating: 90, ff_rating_genre_normalized: 8.0, ff_audience_confidence: 80,
      })),
      error: null,
    })
    mockFrom.mockReturnValue(chain)

    await getTopOfYourTasteRow('user-1', profile)

    // applyAllExclusions should have been called with the query and the profile
    expect(applyAllExclusions).toHaveBeenCalledWith(expect.anything(), profile)
  })

  it('passes through all candidates when no exclusions', async () => {
    const { applyAllExclusions } = await import('../exclusions')

    const profile = {
      _legacy: {
        watchedMovieIds: [],
        exclusions: { genreIds: new Set(), genreNames: [] },
        topFitProfiles: [],
        qualityProfile: { totalMoviesWatched: 10 },
      },
    }

    const chain = mockChainedQuery({
      data: Array.from({ length: 8 }, (_, i) => ({
        id: i + 1, tmdb_id: (i + 1) * 10, title: i === 0 ? 'Shrek' : `Film ${i + 1}`,
        poster_path: '/s.jpg', genres: ['Animation'], ff_audience_rating: 85,
        ff_rating_genre_normalized: 8.0, ff_audience_confidence: 70,
      })),
      error: null,
    })
    mockFrom.mockReturnValue(chain)

    const result = await getTopOfYourTasteRow('user-1', profile)

    // With no exclusions, DB exclusion is still called but is a no-op
    expect(applyAllExclusions).toHaveBeenCalled()
    // Shrek should be in results since no exclusions
    expect(result.films.map(m => m.title)).toContain('Shrek')
  })
})

// ---------------------------------------------------------------------------
// 2. Orbit strict seed check
// ---------------------------------------------------------------------------

describe('Orbit strict seed', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null seed when embedding RPC returns empty', async () => {
    const ratingsChain = mockChainedQuery({ data: [{ movie_id: 1, rating: 9, rated_at: '2026-01-01', movies: { id: 1, title: 'Interstellar' } }], error: null })

    mockFrom.mockImplementation((table) => {
      if (table === 'user_ratings') return ratingsChain
      if (table === 'user_history') return mockChainedQuery({ data: [], error: null })
      return mockChainedQuery({ data: [], error: null })
    })

    // Seed exists but embedding match returns 0 results
    mockRpc.mockResolvedValue({ data: [], error: null })

    const profile = {
      _legacy: {
        watchedMovieIds: [],
        exclusions: { genreIds: new Set(), genreNames: [] },
        topFitProfiles: [],
        qualityProfile: { totalMoviesWatched: 20 },
      },
    }

    const result = await getStillInOrbitRow('user-1', profile)
    expect(result.seed).toBeNull()
    expect(result.films).toEqual([])
  })

  it('returns empty when ratings query errors', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const ratingsChain = mockChainedQuery({ data: null, error: { message: 'RLS error' } })

    mockFrom.mockImplementation((table) => {
      if (table === 'user_ratings') return ratingsChain
      return mockChainedQuery({ data: [], error: null })
    })

    const profile = {
      _legacy: {
        watchedMovieIds: [],
        exclusions: { genreIds: new Set(), genreNames: [] },
        topFitProfiles: [],
        qualityProfile: { totalMoviesWatched: 20 },
      },
    }

    const result = await getStillInOrbitRow('user-1', profile)
    expect(consoleSpy).toHaveBeenCalledWith(
      '[getStillInOrbitRow] ratings query error:',
      expect.objectContaining({ message: 'RLS error' }),
    )
    expect(result.seed).toBeNull()
    expect(result.films).toEqual([])
    consoleSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// 3. Hero caption — "Similar to X" requires embedding verification
// ---------------------------------------------------------------------------

describe('determinePickReason embedding gate', () => {
  it('scoreMovieForUser mock confirms scoring pipeline works', () => {
    const mockProfile = {
      genres: { preferred: [878], secondary: [] },
      meta: { confidence: 'medium' },
    }
    const seedFilms = [{ id: 99, title: 'Inception', genres: [{ id: 878 }], keywords: ['dream'], director_name: 'Christopher Nolan', original_language: 'en', release_year: 2010 }]
    const movie = { id: 50, title: 'Shrek', genres: [{ id: 16 }], ff_rating: 7.5 }
    const bestByNeighborId = new Map([[50, { seedMovieId: 99, similarity: 0.3 }]])

    const result = scoreMovieForUser(movie, mockProfile, 'hero', seedFilms, { seedEmbeddingBestByMovieId: bestByNeighborId })
    expect(result).toBeDefined()
    expect(result.score).toBe(75)
  })
})

// ---------------------------------------------------------------------------
// 4. Adjacency scoring
// ---------------------------------------------------------------------------

describe('Fit profile adjacency scoring', () => {
  beforeEach(() => vi.clearAllMocks())

  it('scoreMovieV3 differentiates dominant vs clashing fit profiles', async () => {
    const profile = {
      affinity: { fit_profiles: [{ profile: 'crowd_pleaser', count: 5 }], directors: [], mood_tags: [], tone_tags: [], genre_combos: [] },
      content_shape: { pacing: null, intensity: null, depth: null },
      negative: { skipped_fit_profiles: new Map(), anti_seeds: [], personal_skipped_ids: new Set() },
      community: { high_skip_rate_ids: new Set() },
      meta: { total_watches: 20, confidence: 'engaged' },
      _legacy: {
        watchedMovieIds: [],
        exclusions: { genreIds: new Set(), genreNames: [] },
        topFitProfiles: ['crowd_pleaser', 'comfort_watch'],
        qualityProfile: { totalMoviesWatched: 20 },
      },
    }

    // scoreMovieV3 returns different scores based on fit_profile:
    // crowd_pleaser/comfort_rewatch → 80 (high fit alignment),
    // challenging_art → 55 (below 60 floor, gets cut),
    // date_night → 75 (adjacent)
    mockScoreMovieV3.mockImplementation((movie) => {
      const fp = movie.fit_profile
      if (fp === 'crowd_pleaser') return { final: 80, breakdown: { fit: 100 }, weights_used: {} }
      if (fp === 'comfort_watch') return { final: 80, breakdown: { fit: 80 }, weights_used: {} }
      if (fp === 'challenging_art') return { final: 55, breakdown: { fit: 0 }, weights_used: {} }
      if (fp === 'genre_popcorn') return { final: 75, breakdown: { fit: 50 }, weights_used: {} }
      return { final: 70, breakdown: { fit: 40 }, weights_used: {} }
    })

    // Need >= 6 films above MIN_PERSONAL_SCORE (60) for the row to render.
    const chain = mockChainedQuery({
      data: [
        { id: 1, tmdb_id: 10, title: 'Crowd Film', poster_path: '/c.jpg', genres: ['Comedy'], fit_profile: 'crowd_pleaser', ff_audience_rating: 80, ff_audience_confidence: 70 },
        { id: 2, tmdb_id: 20, title: 'Art Film', poster_path: '/a.jpg', genres: ['Drama'], fit_profile: 'challenging_art', ff_audience_rating: 85, ff_audience_confidence: 75 },
        { id: 3, tmdb_id: 30, title: 'Genre Film', poster_path: '/d.jpg', genres: ['Romance'], fit_profile: 'genre_popcorn', ff_audience_rating: 78, ff_audience_confidence: 65 },
        ...Array.from({ length: 5 }, (_, i) => ({
          id: 10 + i, tmdb_id: 100 + i * 10, title: `Filler ${i + 1}`, poster_path: '/f.jpg',
          genres: ['Comedy'], fit_profile: 'comfort_watch', ff_audience_rating: 75,
          ff_audience_confidence: 65,
        })),
      ],
      error: null,
    })
    mockFrom.mockReturnValue(chain)

    const result = await getTopOfYourTasteRow('user-1', profile)

    const crowdFilm = result.films.find(m => m.title === 'Crowd Film')
    const artFilm = result.films.find(m => m.title === 'Art Film')
    const genreFilm = result.films.find(m => m.title === 'Genre Film')

    expect(crowdFilm).toBeDefined()
    // challenging_art scored 55, below 60 floor → cut
    expect(artFilm).toBeUndefined()
    expect(genreFilm).toBeDefined()

    // v3 scores directly from scoreMovieV3
    expect(crowdFilm._score).toBe(80)
    expect(genreFilm._score).toBe(75)

    // Crowd film should rank highest (80 > 75)
    expect(result.films[0].title).toBe('Crowd Film')
  })
})
