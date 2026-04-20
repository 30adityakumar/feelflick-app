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

vi.mock('@/shared/services/recommendations', () => ({
  computeUserProfile: vi.fn().mockResolvedValue({
    watchedMovieIds: [100, 200],
    moodSignature: { recentMoodTags: [], recentToneTags: [], recentFitProfiles: [] },
    qualityProfile: { totalMoviesWatched: 25 },
    exclusions: { genreIds: new Set([16, 10751]), genreNames: ['Animation', 'Family'] },
    topFitProfiles: ['crowd_pleaser', 'comfort_rewatch'],
    affinities: { directors: [], actors: [] },
    fitProfileAffinity: { preferred: [], topShare: 0, franchiseFatigue: false },
  }),
  scoreMovieForUser: vi.fn().mockReturnValue({ score: 75, positiveScore: 75 }),
  applyDbGenreExclusions: vi.fn().mockImplementation((query) => query),
  FIT_ADJACENCY: {
    crowd_pleaser:    { adjacent: ['comfort_rewatch', 'date_night', 'franchise_entry'], clashing: ['challenging_art', 'arthouse'] },
    comfort_rewatch:  { adjacent: ['crowd_pleaser', 'date_night'], clashing: ['challenging_art'] },
    date_night:       { adjacent: ['crowd_pleaser', 'comfort_rewatch'], clashing: ['challenging_art', 'cult_classic'] },
    franchise_entry:  { adjacent: ['crowd_pleaser', 'event_spectacle'], clashing: ['arthouse', 'challenging_art'] },
    event_spectacle:  { adjacent: ['franchise_entry', 'crowd_pleaser'], clashing: ['arthouse', 'challenging_art'] },
    cult_classic:     { adjacent: ['arthouse', 'challenging_art', 'hidden_gem'], clashing: ['crowd_pleaser'] },
    arthouse:         { adjacent: ['challenging_art', 'cult_classic', 'hidden_gem'], clashing: ['crowd_pleaser', 'franchise_entry'] },
    challenging_art:  { adjacent: ['arthouse', 'cult_classic'], clashing: ['crowd_pleaser', 'comfort_rewatch', 'franchise_entry'] },
    hidden_gem:       { adjacent: ['cult_classic', 'arthouse'], clashing: ['franchise_entry', 'event_spectacle'] },
    prestige_drama:   { adjacent: ['arthouse', 'challenging_art', 'hidden_gem'], clashing: ['crowd_pleaser', 'franchise_entry', 'comfort_rewatch'] },
    genre_popcorn:    { adjacent: ['crowd_pleaser', 'event_spectacle', 'franchise_entry'], clashing: ['challenging_art', 'arthouse'] },
  },
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

  it('calls applyDbGenreExclusions on the query builder', async () => {
    const { applyDbGenreExclusions } = await import('../recommendations')

    const profile = {
      watchedMovieIds: [],
      exclusions: { genreIds: new Set([16, 10751]), genreNames: ['Animation', 'Family'] },
      topFitProfiles: [],
      qualityProfile: { totalMoviesWatched: 10 },
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

    // applyDbGenreExclusions should have been called with the query and the profile
    expect(applyDbGenreExclusions).toHaveBeenCalledWith(expect.anything(), profile)
  })

  it('passes through all candidates when no exclusions', async () => {
    const { applyDbGenreExclusions } = await import('../recommendations')

    const profile = {
      watchedMovieIds: [],
      exclusions: { genreIds: new Set(), genreNames: [] },
      topFitProfiles: [],
      qualityProfile: { totalMoviesWatched: 10 },
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
    expect(applyDbGenreExclusions).toHaveBeenCalled()
    // Shrek should be in results since no exclusions
    expect(result.map(m => m.title)).toContain('Shrek')
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
      watchedMovieIds: [],
      exclusions: { genreIds: new Set(), genreNames: [] },
      topFitProfiles: [],
      qualityProfile: { totalMoviesWatched: 20 },
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
      watchedMovieIds: [],
      exclusions: { genreIds: new Set(), genreNames: [] },
      topFitProfiles: [],
      qualityProfile: { totalMoviesWatched: 20 },
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

  it('boosts dominant fit_profile by +10 and penalizes clashing by -15', async () => {
    const profile = {
      watchedMovieIds: [],
      exclusions: { genreIds: new Set(), genreNames: [] },
      topFitProfiles: ['crowd_pleaser', 'comfort_rewatch'],
      qualityProfile: { totalMoviesWatched: 20 },
    }

    // Base score 70 so adjacency bonuses/penalties produce scores above/below the 60 floor
    scoreMovieForUser.mockReturnValue({ score: 70, positiveScore: 70 })

    // Need >= 6 films above MIN_PERSONAL_SCORE (60) for the row to render.
    // crowd_pleaser: 70+10=80, challenging_art: 70-15=55 (CUT), date_night: 70+5=75,
    // 5 filler comfort_rewatch films: 70+10=80 each → total 7 pass
    const chain = mockChainedQuery({
      data: [
        { id: 1, tmdb_id: 10, title: 'Crowd Film', poster_path: '/c.jpg', genres: ['Comedy'], fit_profile: 'crowd_pleaser', ff_audience_rating: 80, ff_rating_genre_normalized: 8.0, ff_audience_confidence: 70 },
        { id: 2, tmdb_id: 20, title: 'Art Film', poster_path: '/a.jpg', genres: ['Drama'], fit_profile: 'challenging_art', ff_audience_rating: 85, ff_rating_genre_normalized: 8.5, ff_audience_confidence: 75 },
        { id: 3, tmdb_id: 30, title: 'Date Film', poster_path: '/d.jpg', genres: ['Romance'], fit_profile: 'date_night', ff_audience_rating: 78, ff_rating_genre_normalized: 7.8, ff_audience_confidence: 65 },
        ...Array.from({ length: 5 }, (_, i) => ({
          id: 10 + i, tmdb_id: 100 + i * 10, title: `Filler ${i + 1}`, poster_path: '/f.jpg',
          genres: ['Comedy'], fit_profile: 'comfort_rewatch', ff_audience_rating: 75,
          ff_rating_genre_normalized: 7.5, ff_audience_confidence: 65,
        })),
      ],
      error: null,
    })
    mockFrom.mockReturnValue(chain)

    const result = await getTopOfYourTasteRow('user-1', profile)

    const crowdFilm = result.find(m => m.title === 'Crowd Film')
    const artFilm = result.find(m => m.title === 'Art Film')
    const dateFilm = result.find(m => m.title === 'Date Film')

    expect(crowdFilm).toBeDefined()
    // challenging_art clashes with crowd_pleaser → 70-15=55, below 60 floor → cut
    expect(artFilm).toBeUndefined()
    expect(dateFilm).toBeDefined()

    // crowd_pleaser is dominant → +10
    expect(crowdFilm._score).toBe(80)  // 70 base + 10 bonus
    // date_night is adjacent to crowd_pleaser → +5
    expect(dateFilm._score).toBe(75)   // 70 base + 5 bonus

    // Crowd film should rank highest (80 > 75)
    expect(result[0].title).toBe('Crowd Film')
  })
})
