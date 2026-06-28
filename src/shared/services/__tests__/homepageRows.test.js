import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock supabase
const mockFrom = vi.fn()
const mockRpc = vi.fn()

vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
    rpc: (...args) => mockRpc(...args),
  },
}))

// Mock cache — passthrough
vi.mock('@/shared/lib/cache', () => ({
  recommendationCache: {
    key: (type, userId, params) => `${type}:${userId}:${JSON.stringify(params)}`,
    getOrFetch: (_key, fn) => fn(),
  },
}))

// Mock exclusions module (homepageRows imports applyAllExclusions from ./exclusions)
vi.mock('@/shared/services/exclusions', () => ({
  applyAllExclusions: vi.fn().mockImplementation((query) => query),
}))

// Mock recommendations
vi.mock('@/shared/services/recommendations', () => ({
  computeUserProfileV3: vi.fn().mockResolvedValue({
    rated: { positive_seeds: [], negative_seeds: [] },
    affinity: { fit_profiles: [], directors: [], mood_tags: [], tone_tags: [], genre_combos: [] },
    content_shape: { pacing: null, intensity: null, depth: null },
    negative: { skipped_fit_profiles: new Map(), anti_seeds: [], personal_skipped_ids: new Set() },
    community: { high_skip_rate_ids: new Set() },
    meta: { total_watches: 25, confidence: 'engaged' },
    _legacy: {
      watchedMovieIds: [100, 200],
      moodSignature: {
        recentMoodTags: [{ tag: 'contemplative', weight: 3.5 }, { tag: 'warm', weight: 2.0 }],
        recentToneTags: [],
        recentFitProfiles: [],
      },
      qualityProfile: { totalMoviesWatched: 25 },
      exclusions: { genreIds: new Set(), genreNames: [] },
      topFitProfiles: [],
    },
  }),
}))

// Mock scoringV3
vi.mock('@/shared/services/scoringV3', () => ({
  scoreMovieV3: vi.fn().mockReturnValue({ final: 75, breakdown: { quality: 75 }, weights_used: {} }),
  precomputeScoringContext: vi.fn().mockResolvedValue({
    seedNeighborMap: new Map(),
    antiSeedNeighborMap: new Map(),
    isColdStart: false,
  }),
}))

import {
  getStillInOrbitRow,
  getMoodRow,
  getWatchlistRow,
  getCriticsSwoonedRow,
} from '../homepageRows'
import { scoreMovieV3 } from '@/shared/services/scoringV3'

// Helper: mock supabase chained query builder
function mockChainedQuery(result) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  }
  return chain
}

describe('homepageRows service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Stable default score (clearAllMocks keeps the impl, but be explicit so a
    // per-test override can't leak across tests).
    scoreMovieV3.mockReturnValue({ final: 75, breakdown: { quality: 75 }, weights_used: {} })
  })

  describe('getStillInOrbitRow', () => {
    it('returns empty when no userId', async () => {
      const result = await getStillInOrbitRow(null, null)
      expect(result).toEqual({ films: [], seed: null })
    })

    it('returns empty when no qualifying seeds exist', async () => {
      const ratingsChain = mockChainedQuery({ data: [], error: null })

      mockFrom.mockImplementation((table) => {
        if (table === 'user_ratings') return ratingsChain
        return mockChainedQuery({ data: [], error: null })
      })

      const result = await getStillInOrbitRow('user-1', null)
      expect(result.seed).toBeNull()
      expect(result.films).toEqual([])
    })

    it('enriches seed-neighbour films with full movie rows (poster/title/tmdb_id) + keeps similarity', async () => {
      // get_seed_neighbors returns ONLY { id, similarity, matched_seed_id } — no
      // display fields — so the row MUST hydrate from a full movies fetch or the
      // cards render empty. This guards that hydration.
      const profile = {
        affinity: {},
        _legacy: { watchedMovieIds: [], exclusions: { genreNames: [] } },
      }
      const ratingsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ movie_id: 500, rating: 9, rated_at: '2026-01-01', movies: { id: 500, title: 'Seed Movie' } }],
          error: null,
        }),
      }
      // Enrichment query: .in('id', …) is terminal (awaited directly).
      const moviesChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [
            { id: 11, tmdb_id: 1111, title: 'Neighbor One', poster_path: '/n1.jpg', release_year: 2020, director_name: 'Dir', mood_tags: [], tone_tags: [], fit_profile: 'arthouse' },
          ],
          error: null,
        }),
      }
      mockFrom.mockImplementation((table) => (table === 'user_ratings' ? ratingsChain : moviesChain))
      mockRpc.mockResolvedValue({ data: [{ id: 11, similarity: 0.9, matched_seed_id: 500 }], error: null })

      const result = await getStillInOrbitRow('user-1', profile)
      expect(result.seed).toEqual({ id: 500, title: 'Seed Movie' })
      expect(result.films).toHaveLength(1)
      // The card-critical display fields are present (the bug was their absence).
      expect(result.films[0]).toMatchObject({ id: 11, tmdb_id: 1111, title: 'Neighbor One', poster_path: '/n1.jpg' })
      // The RPC's similarity survives the merge (drives the orbit hybrid score).
      expect(result.films[0].similarity).toBe(0.9)
    })
  })

  describe('getMoodRow', () => {
    it('returns empty when mood signature is empty', async () => {
      const emptyProfile = {
        _legacy: {
          watchedMovieIds: [],
          moodSignature: { recentMoodTags: [], recentToneTags: [] },
        },
      }
      const result = await getMoodRow('user-1', emptyProfile)
      expect(result.films).toEqual([])
      expect(result.title).toBe('Films for your mood')
    })

    it('returns title and films from profile mood tags', async () => {
      const profile = {
        affinity: {
          mood_tags: [{ tag: 'melancholic', count: 4 }],
          tone_tags: [],
        },
        _legacy: {
          watchedMovieIds: [100],
          moodSignature: {
            recentMoodTags: [{ tag: 'melancholic', weight: 4.0 }],
            recentToneTags: [],
          },
        },
      }

      // Need >= 6 films to pass MIN_ROW_FILMS threshold
      const chain = mockChainedQuery({
        data: Array.from({ length: 8 }, (_, i) => ({
          id: i + 1, tmdb_id: (i + 1) * 10, title: `Sad Film ${i + 1}`,
          poster_path: '/p.jpg', mood_tags: ['melancholic'], ff_audience_rating: 80,
        })),
        error: null,
      })
      mockFrom.mockReturnValue(chain)

      const result = await getMoodRow('user-1', profile)
      expect(result.title).toBe('Films that feel melancholic')
      expect(result.films.length).toBeGreaterThanOrEqual(6)
      expect(result).toHaveProperty('subtitle')
      expect(result).toHaveProperty('lead')
      expect(result).toHaveProperty('kind')
    })

    it('guarantees population: fills to the display target even when NO film clears the personal floor', async () => {
      // Every film scores below the 60 floor — previously the row hid; now it tops
      // up from the same on-title pool to the display count (5).
      scoreMovieV3.mockReturnValue({ final: 50, breakdown: { quality: 50 }, weights_used: {} })
      const profile = {
        affinity: { mood_tags: [{ tag: 'tense', count: 5 }, { tag: 'dark', count: 4 }], tone_tags: [] },
        _legacy: { watchedMovieIds: [], moodSignature: { recentMoodTags: [{ tag: 'tense', weight: 5 }], recentToneTags: [] } },
      }
      mockFrom.mockReturnValue(mockChainedQuery({
        data: Array.from({ length: 8 }, (_, i) => ({
          id: i + 1, tmdb_id: (i + 1) * 10, title: `Film ${i + 1}`,
          poster_path: '/p.jpg', primary_genre: 'Drama', mood_tags: ['tense'], ff_audience_rating: 80,
        })),
        error: null,
      }))

      const result = await getMoodRow('user-1', profile)
      expect(result.films).toHaveLength(5)
    })

    it('still hides only when the candidate pool is smaller than the minimum', async () => {
      scoreMovieV3.mockReturnValue({ final: 50, breakdown: {}, weights_used: {} })
      const profile = {
        affinity: { mood_tags: [{ tag: 'tense', count: 5 }], tone_tags: [] },
        _legacy: { watchedMovieIds: [], moodSignature: { recentMoodTags: [{ tag: 'tense', weight: 5 }], recentToneTags: [] } },
      }
      // Only 2 candidates — below the minFilms floor (4) → row genuinely hides.
      mockFrom.mockReturnValue(mockChainedQuery({
        data: [
          { id: 1, tmdb_id: 10, title: 'A', poster_path: '/p.jpg', primary_genre: 'Drama', mood_tags: ['tense'], ff_audience_rating: 80 },
          { id: 2, tmdb_id: 20, title: 'B', poster_path: '/p.jpg', primary_genre: 'Drama', mood_tags: ['tense'], ff_audience_rating: 80 },
        ],
        error: null,
      }))

      const result = await getMoodRow('user-1', profile)
      expect(result.films).toEqual([])
    })
  })

  describe('getWatchlistRow', () => {
    it('returns empty when no userId', async () => {
      const result = await getWatchlistRow(null, null)
      expect(result).toEqual({ films: [] })
    })

    it('returns empty when fewer than 3 items qualify', async () => {
      const chain = mockChainedQuery({ data: [{ movie_id: 1 }, { movie_id: 2 }], error: null })
      mockFrom.mockReturnValue(chain)

      const result = await getWatchlistRow('user-1', null)
      expect(result).toEqual({ films: [] })
    })
  })

  describe('getCriticsSwoonedRow', () => {
    it('returns films matching the critic/audience split', async () => {
      const chain = mockChainedQuery({
        data: [
          { id: 3, tmdb_id: 30, title: 'Critic Fave', poster_path: '/c.jpg', ff_critic_rating: 85, ff_audience_rating: 55, ff_audience_confidence: 70 },
          { id: 4, tmdb_id: 40, title: 'Another Critic Fave', poster_path: '/d.jpg', ff_critic_rating: 80, ff_audience_rating: 60, ff_audience_confidence: 65 },
        ],
        error: null,
      })
      mockFrom.mockReturnValue(chain)

      const result = await getCriticsSwoonedRow(null, null)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]._pickReason.type).toBe('critics_swooned')
    })
  })
})
