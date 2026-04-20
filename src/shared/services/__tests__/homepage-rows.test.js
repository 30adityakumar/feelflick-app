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

// Mock recommendations
vi.mock('@/shared/services/recommendations', () => ({
  computeUserProfile: vi.fn().mockResolvedValue({
    watchedMovieIds: [100, 200],
    moodSignature: {
      recentMoodTags: [{ tag: 'contemplative', weight: 3.5 }, { tag: 'warm', weight: 2.0 }],
      recentToneTags: [],
      recentFitProfiles: [],
    },
    qualityProfile: { totalMoviesWatched: 25 },
    exclusions: { genreIds: new Set(), genreNames: [] },
    topFitProfiles: [],
  }),
  scoreMovieForUser: vi.fn().mockReturnValue({ score: 75, positiveScore: 75 }),
  applyDbGenreExclusions: vi.fn().mockImplementation((query) => query),
  FIT_ADJACENCY: {
    crowd_pleaser: { adjacent: ['comfort_rewatch', 'date_night', 'franchise_entry'], clashing: ['challenging_art', 'arthouse'] },
  },
}))

import {
  getStillInOrbitRow,
  getMoodRow,
  getWatchlistRow,
  getCriticsSwoonedRow,
} from '../homepage-rows'

// Helper: mock supabase chained query builder
function mockChainedQuery(result) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  }
  return chain
}

describe('homepage-rows service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
  })

  describe('getMoodRow', () => {
    it('returns empty when mood signature is empty', async () => {
      const emptyProfile = {
        watchedMovieIds: [],
        moodSignature: { recentMoodTags: [], recentToneTags: [] },
      }
      const result = await getMoodRow('user-1', emptyProfile)
      expect(result).toEqual({ films: [], dominantMood: null })
    })

    it('returns dominantMood from profile signature', async () => {
      const profile = {
        watchedMovieIds: [100],
        moodSignature: {
          recentMoodTags: [{ tag: 'melancholic', weight: 4.0 }],
          recentToneTags: [],
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
      expect(result.dominantMood).toBe('melancholic')
      expect(result.films.length).toBeGreaterThanOrEqual(6)
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
