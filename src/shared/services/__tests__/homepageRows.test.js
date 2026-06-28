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
  getHiddenGemsRow,
} from '../homepageRows'
import { scoreMovieV3 } from '@/shared/services/scoringV3'

// Helper: mock supabase chained query builder
function mockChainedQuery(result) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
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

    // Shared mock builders for the orbit row (seed lookup → RPC neighbours → hydrate).
    const orbitProfile = () => ({
      affinity: {},
      _legacy: { watchedMovieIds: [], exclusions: { genreNames: [] } },
    })
    const orbitRatingsChain = () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [{ movie_id: 500, rating: 9, rated_at: '2026-01-01', movies: { id: 500, title: 'Seed Movie' } }],
        error: null,
      }),
    })
    // Enrichment query: .in('id', ids) is terminal — returns a row per requested id.
    const orbitMoviesChain = () => ({
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockImplementation((_col, ids) => Promise.resolve({
        data: ids.map(id => ({
          id, tmdb_id: id * 100, title: `Neighbor ${id}`, poster_path: `/n${id}.jpg`,
          release_year: 2020, director_name: 'Dir', primary_genre: 'Drama', mood_tags: [], tone_tags: [], fit_profile: 'arthouse',
        })),
        error: null,
      })),
    })

    it('enriches seed-neighbour films with full movie rows (poster/title/tmdb_id) + keeps similarity', async () => {
      // get_seed_neighbors returns ONLY { id, similarity, matched_seed_id } — no
      // display fields — so the row MUST hydrate from a full movies fetch or the
      // cards render empty. This guards that hydration.
      mockFrom.mockImplementation((table) => (table === 'user_ratings' ? orbitRatingsChain() : orbitMoviesChain()))
      mockRpc.mockResolvedValue({ data: [
        { id: 11, similarity: 0.9, matched_seed_id: 500 },
        { id: 12, similarity: 0.8, matched_seed_id: 500 },
        { id: 13, similarity: 0.7, matched_seed_id: 500 },
      ], error: null })

      const result = await getStillInOrbitRow('user-1', orbitProfile())
      expect(result.seed).toEqual({ id: 500, title: 'Seed Movie' })
      expect(result.films).toHaveLength(3)
      // The card-critical display fields are present (the bug was their absence).
      expect(result.films[0]).toMatchObject({ tmdb_id: expect.any(Number), title: expect.stringMatching(/^Neighbor/), poster_path: expect.any(String) })
      // The RPC's similarity survives the merge (drives the orbit hybrid score).
      expect(result.films.map(f => f.similarity).sort()).toEqual([0.7, 0.8, 0.9])
    })

    it('hides the row when fewer than the minimum neighbours clear the cosine floor', async () => {
      // Niche seed: only 2 neighbours are genuinely similar (>= 0.55); the rest are
      // noise. The "Because you loved X" promise can't stand on 2 weak matches, so
      // the row hides entirely rather than pad with sub-floor films.
      mockFrom.mockImplementation((table) => (table === 'user_ratings' ? orbitRatingsChain() : orbitMoviesChain()))
      mockRpc.mockResolvedValue({ data: [
        { id: 11, similarity: 0.62, matched_seed_id: 500 },
        { id: 12, similarity: 0.57, matched_seed_id: 500 },
        { id: 13, similarity: 0.49, matched_seed_id: 500 },
        { id: 14, similarity: 0.31, matched_seed_id: 500 },
      ], error: null })

      const result = await getStillInOrbitRow('user-1', orbitProfile())
      expect(result.films).toEqual([])
    })

    it('drops sub-floor neighbours but still shows the row when >= the minimum clear it', async () => {
      // 3 neighbours clear 0.55, one is below — the row shows the 3 real matches and
      // never the padding film.
      mockFrom.mockImplementation((table) => (table === 'user_ratings' ? orbitRatingsChain() : orbitMoviesChain()))
      mockRpc.mockResolvedValue({ data: [
        { id: 11, similarity: 0.90, matched_seed_id: 500 },
        { id: 12, similarity: 0.70, matched_seed_id: 500 },
        { id: 13, similarity: 0.56, matched_seed_id: 500 },
        { id: 14, similarity: 0.40, matched_seed_id: 500 }, // below floor → padding
      ], error: null })

      const result = await getStillInOrbitRow('user-1', orbitProfile())
      expect(result.films).toHaveLength(3)
      expect(result.films.map(f => f.id)).not.toContain(14)
      expect(result.films.every(f => f.similarity >= 0.55)).toBe(true)
    })

    it('skips a niche top seed and seeds on the next loved film with a real neighbourhood', async () => {
      // Two loved films: the most-loved (id 500) is niche — too few neighbours clear
      // the floor — so the row should seed on the next loved film (id 600) that does.
      const ratingsTwoSeeds = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            { movie_id: 500, rating: 10, rated_at: '2026-02-01', movies: { id: 500, title: 'Niche Favorite' } },
            { movie_id: 600, rating: 9, rated_at: '2026-01-01', movies: { id: 600, title: 'Well Connected' } },
          ],
          error: null,
        }),
      }
      mockFrom.mockImplementation((table) => (table === 'user_ratings' ? ratingsTwoSeeds : orbitMoviesChain()))
      // First RPC call (seed 500) → sparse; second (seed 600) → a real neighbourhood.
      mockRpc
        .mockResolvedValueOnce({ data: [{ id: 11, similarity: 0.61, matched_seed_id: 500 }], error: null })
        .mockResolvedValueOnce({ data: [
          { id: 21, similarity: 0.88, matched_seed_id: 600 },
          { id: 22, similarity: 0.74, matched_seed_id: 600 },
          { id: 23, similarity: 0.58, matched_seed_id: 600 },
        ], error: null })

      const result = await getStillInOrbitRow('user-1', orbitProfile())
      expect(result.seed).toEqual({ id: 600, title: 'Well Connected' })
      expect(result.films).toHaveLength(3)
      expect(result.films.map(f => f.id).sort()).toEqual([21, 22, 23])
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

    it('guarantees population: tops up from the on-title pool even when NO film clears the personal floor', async () => {
      // Every film scores below the 60 floor — previously the row hid; now it tops
      // up from the same on-title pool (to the fetch limit, for dedup headroom), so
      // the row populates instead of disappearing.
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
      // Populated (≥ the display count) rather than hidden.
      expect(result.films.length).toBeGreaterThanOrEqual(5)
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

  describe('getHiddenGemsRow', () => {
    it('gates on a real low-exposure vote_count ceiling (not the old popularity no-op)', async () => {
      const profile = {
        affinity: { fit_profiles: [{ profile: 'arthouse' }], mood_tags: [], tone_tags: [], directors: [], genre_combos: [] },
        _legacy: { watchedMovieIds: [], exclusions: { genreNames: [] } },
      }
      const chain = mockChainedQuery({
        data: Array.from({ length: 8 }, (_, i) => ({
          id: i + 1, tmdb_id: (i + 1) * 10, title: `Gem ${i + 1}`,
          poster_path: '/g.jpg', primary_genre: 'Drama', vote_count: 300, ff_audience_rating: 80,
        })),
        error: null,
      })
      mockFrom.mockReturnValue(chain)

      const result = await getHiddenGemsRow('user-1', profile)
      // Row populates from the low-exposure pool...
      expect(result.films.length).toBeGreaterThanOrEqual(5)
      // ...and the exposure ceiling was applied in SQL (vote_count < ceiling),
      // replacing the old popularity gate that passed ~the whole catalog.
      const ltCalls = chain.lt.mock.calls
      expect(ltCalls.some(([col]) => col === 'vote_count')).toBe(true)
      const ceiling = ltCalls.find(([col]) => col === 'vote_count')[1]
      expect(ceiling).toBeGreaterThan(0)
      expect(ceiling).toBeLessThanOrEqual(3000)
    })
  })
})
