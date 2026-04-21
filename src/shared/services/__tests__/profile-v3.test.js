import { beforeEach, describe, expect, it, vi } from 'vitest'

// ============================================================================
// Mocks
// ============================================================================

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

// Mock computeUserProfile legacy (v2) — provide a minimal shape
const mockLegacyProfile = {
  userId: 'test-user',
  languages: { primary: 'en', distributionSorted: [{ lang: 'en', count: 100, percentage: 100 }] },
  genres: { preferred: [28, 878, 53], secondary: [12], avoided: [], fatigued: [], preferredPairs: [], explicitPreferences: [28, 12, 878, 14, 53, 9648] },
  exclusions: { genreIds: new Set([16, 27, 99, 10751]), genreNames: ['Animation', 'Horror', 'Documentary', 'Family'] },
  topFitProfiles: ['prestige_drama', 'genre_popcorn'],
  watchedMovieIds: [814, 836, 11571, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200],
  meta: { profileVersion: '2.15', confidence: 'medium', dataPoints: 15, onboardingWeight: 3.0 },
  contentProfile: { avgPacing: 5, avgIntensity: 6, avgEmotionalDepth: 7 },
  preferences: { avgRuntime: 130, runtimeRange: [87, 180] },
  affinities: { directors: [{ name: 'Christopher Nolan', count: 4 }], actors: [] },
  moodSignature: { recentMoodTags: [{ tag: 'tense', weight: 3.5 }], recentToneTags: [], recentFitProfiles: [] },
  qualityProfile: { totalMoviesWatched: 15 },
  negativeSignals: { skippedGenres: [], totalSkips: 0 },
  feedbackSignals: { genreBoosts: [], genreSuppressions: [] },
  fitProfileAffinity: { distribution: {}, preferred: [], topShare: 0, franchiseFatigue: false },
  themes: { preferred: [] },
}

// ============================================================================
// Test data: simulated user 9457cad5 (warming tier, 15 watches)
// ============================================================================

const TEST_USER_ID = '9457cad5-5ff2-46b4-9f1c-ef984824a650'

const WATCHED_MOVIES = [
  { id: 814, tmdb_id: 157336, title: 'Interstellar', original_language: 'en', runtime: 169, release_year: 2014, pacing_score: 4, intensity_score: 7, emotional_depth_score: 9, director_name: 'Christopher Nolan', genres: ['Science Fiction', 'Adventure', 'Drama'], fit_profile: 'prestige_drama', mood_tags: ['awe-inspiring', 'emotional', 'intense'], tone_tags: ['epic', 'philosophical'] },
  { id: 836, tmdb_id: 27205, title: 'Inception', original_language: 'en', runtime: 148, release_year: 2010, pacing_score: 7, intensity_score: 8, emotional_depth_score: 6, director_name: 'Christopher Nolan', genres: ['Action', 'Science Fiction', 'Adventure'], fit_profile: 'genre_popcorn', mood_tags: ['thrilling', 'mysterious', 'intense'], tone_tags: ['suspenseful', 'cerebral'] },
  { id: 11571, tmdb_id: 694, title: 'A.I. Artificial Intelligence', original_language: 'en', runtime: 146, release_year: 2001, pacing_score: 3, intensity_score: 4, emotional_depth_score: 9, director_name: 'Steven Spielberg', genres: ['Science Fiction', 'Drama'], fit_profile: 'prestige_drama', mood_tags: ['melancholic', 'thought-provoking'], tone_tags: ['philosophical', 'bittersweet'] },
  { id: 100, tmdb_id: 100, title: 'The Dark Knight', original_language: 'en', runtime: 152, release_year: 2008, pacing_score: 7, intensity_score: 9, emotional_depth_score: 7, director_name: 'Christopher Nolan', genres: ['Action', 'Crime', 'Drama'], fit_profile: 'genre_popcorn', mood_tags: ['tense', 'thrilling', 'dark'], tone_tags: ['gritty', 'intense'] },
  { id: 200, tmdb_id: 200, title: 'Arrival', original_language: 'en', runtime: 116, release_year: 2016, pacing_score: 3, intensity_score: 5, emotional_depth_score: 9, director_name: 'Denis Villeneuve', genres: ['Science Fiction', 'Drama'], fit_profile: 'prestige_drama', mood_tags: ['mysterious', 'contemplative', 'emotional'], tone_tags: ['atmospheric', 'cerebral'] },
  { id: 300, tmdb_id: 300, title: 'Dune', original_language: 'en', runtime: 155, release_year: 2021, pacing_score: 4, intensity_score: 6, emotional_depth_score: 7, director_name: 'Denis Villeneuve', genres: ['Science Fiction', 'Adventure'], fit_profile: 'event_spectacle', mood_tags: ['awe-inspiring', 'suspenseful', 'intense'], tone_tags: ['epic', 'atmospheric'] },
  { id: 400, tmdb_id: 400, title: 'Blade Runner 2049', original_language: 'en', runtime: 164, release_year: 2017, pacing_score: 2, intensity_score: 5, emotional_depth_score: 8, director_name: 'Denis Villeneuve', genres: ['Science Fiction', 'Drama'], fit_profile: 'prestige_drama', mood_tags: ['contemplative', 'melancholic', 'mysterious'], tone_tags: ['atmospheric', 'neo-noir'] },
  { id: 500, tmdb_id: 500, title: 'Parasite', original_language: 'ko', runtime: 132, release_year: 2019, pacing_score: 6, intensity_score: 8, emotional_depth_score: 8, director_name: 'Bong Joon-ho', genres: ['Thriller', 'Drama', 'Comedy'], fit_profile: 'prestige_drama', mood_tags: ['tense', 'suspenseful', 'darkly comic'], tone_tags: ['satirical', 'intense'] },
  { id: 600, tmdb_id: 600, title: 'Se7en', original_language: 'en', runtime: 127, release_year: 1995, pacing_score: 5, intensity_score: 9, emotional_depth_score: 6, director_name: 'David Fincher', genres: ['Crime', 'Mystery', 'Thriller'], fit_profile: 'genre_popcorn', mood_tags: ['tense', 'dark', 'mysterious'], tone_tags: ['gritty', 'unsettling'] },
  { id: 700, tmdb_id: 700, title: 'The Prestige', original_language: 'en', runtime: 130, release_year: 2006, pacing_score: 6, intensity_score: 7, emotional_depth_score: 7, director_name: 'Christopher Nolan', genres: ['Drama', 'Mystery', 'Thriller'], fit_profile: 'genre_popcorn', mood_tags: ['mysterious', 'thrilling', 'intense'], tone_tags: ['cerebral', 'suspenseful'] },
  { id: 800, tmdb_id: 800, title: 'Gone Girl', original_language: 'en', runtime: 149, release_year: 2014, pacing_score: 5, intensity_score: 8, emotional_depth_score: 7, director_name: 'David Fincher', genres: ['Mystery', 'Thriller', 'Drama'], fit_profile: 'genre_popcorn', mood_tags: ['tense', 'suspenseful', 'dark'], tone_tags: ['sharp', 'unsettling'] },
  { id: 900, tmdb_id: 900, title: 'Whiplash', original_language: 'en', runtime: 107, release_year: 2014, pacing_score: 8, intensity_score: 9, emotional_depth_score: 8, director_name: 'Damien Chazelle', genres: ['Drama', 'Music'], fit_profile: 'prestige_drama', mood_tags: ['intense', 'driven', 'tense'], tone_tags: ['electric', 'visceral'] },
  { id: 1000, tmdb_id: 1000, title: 'Zodiac', original_language: 'en', runtime: 157, release_year: 2007, pacing_score: 4, intensity_score: 6, emotional_depth_score: 6, director_name: 'David Fincher', genres: ['Crime', 'Mystery', 'Thriller'], fit_profile: 'prestige_drama', mood_tags: ['mysterious', 'obsessive', 'tense'], tone_tags: ['methodical', 'atmospheric'] },
  { id: 1100, tmdb_id: 1100, title: 'Memento', original_language: 'en', runtime: 113, release_year: 2000, pacing_score: 7, intensity_score: 7, emotional_depth_score: 6, director_name: 'Christopher Nolan', genres: ['Mystery', 'Thriller'], fit_profile: 'genre_popcorn', mood_tags: ['mysterious', 'disorienting', 'tense'], tone_tags: ['cerebral', 'noir'] },
  { id: 1200, tmdb_id: 1200, title: 'The Quick One', original_language: 'en', runtime: 87, release_year: 2022, pacing_score: 8, intensity_score: 6, emotional_depth_score: 4, director_name: 'Some Director', genres: ['Thriller', 'Action'], fit_profile: 'genre_popcorn', mood_tags: ['thrilling', 'fast-paced'], tone_tags: ['punchy'] },
]

function buildWatchHistory(movies) {
  const now = new Date()
  return movies.map((m, i) => ({
    movie_id: m.id,
    source: i < 5 ? 'onboarding' : 'homepage',
    watched_at: new Date(now - (i + 1) * 3 * 24 * 60 * 60 * 1000).toISOString(),
    watch_duration_minutes: m.runtime,
    movies: m,
  }))
}

const RATINGS = [
  { movie_id: 814, rating: 10, rated_at: '2026-03-01', movies: { id: 814, title: 'Interstellar' } },
  { movie_id: 836, rating: 9, rated_at: '2026-03-02', movies: { id: 836, title: 'Inception' } },
  { movie_id: 11571, rating: 8, rated_at: '2026-03-03', movies: { id: 11571, title: 'A.I. Artificial Intelligence' } },
  { movie_id: 100, rating: 9, rated_at: '2026-03-04', movies: { id: 100, title: 'The Dark Knight' } },
  { movie_id: 200, rating: 9, rated_at: '2026-03-05', movies: { id: 200, title: 'Arrival' } },
  { movie_id: 500, rating: 8, rated_at: '2026-03-06', movies: { id: 500, title: 'Parasite' } },
  { movie_id: 900, rating: 8, rated_at: '2026-03-07', movies: { id: 900, title: 'Whiplash' } },
  { movie_id: 1200, rating: 3, rated_at: '2026-03-08', movies: { id: 1200, title: 'The Quick One' } },
]

const WATCHLIST = [
  { movie_id: 2001 },
  { movie_id: 2002 },
]

const ONBOARDING_PREFS = [
  { genre_id: 28 },  // Action
  { genre_id: 12 },  // Adventure
  { genre_id: 878 }, // Science Fiction
  { genre_id: 14 },  // Fantasy
  { genre_id: 53 },  // Thriller
  { genre_id: 9648 }, // Mystery
]

const CLICKED_IMPRESSIONS = [
  { movie_id: 3001 },
  { movie_id: 3002 },
  { movie_id: 814 }, // already watched — should be filtered out
]

const SKIPPED_IMPRESSIONS = [
  { movie_id: 4001 },
  { movie_id: 4002 },
  { movie_id: 4003 },
]

// ============================================================================
// Mock supabase chain builder
// ============================================================================

function mockChainedQuery(result) {
  // Supabase query builders are thenable — when awaited without a terminal
  // method like .limit() or .maybeSingle(), they resolve to the result.
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  return chain
}

// ============================================================================
// Tests
// ============================================================================

// Import after mocks
import { computeUserProfileV3, getCommunityHighSkipSet, RECOMMENDATION_TEST_HELPERS } from '../recommendations'

describe('computeUserProfileV3', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    RECOMMENDATION_TEST_HELPERS.resetCommunityCache()
  })

  it('returns empty v3 profile for null userId', async () => {
    const result = await computeUserProfileV3(null)
    expect(result.meta.confidence).toBe('cold')
    expect(result.meta.engine_version).toBe('3.0')
    expect(result.rated.positive_seeds).toEqual([])
    expect(result._legacy).toBeDefined()
  })

  it('computes full v3 profile for test user', async () => {
    const watchHistory = buildWatchHistory(WATCHED_MOVIES)

    // WHY: recommendation_impressions is queried 2-3 times in parallel (clicked,
    // skipped, community fallback). We can't rely on call order. Instead, use a
    // chain mock that tracks .eq() args to distinguish calls.
    function mockImpressionChain() {
      const eqArgs = []
      function resolveData() {
        const hasClicked = eqArgs.some(([col, val]) => col === 'clicked' && val === true)
        const hasSkipped = eqArgs.some(([col, val]) => col === 'skipped' && val === true)
        if (hasClicked) return { data: CLICKED_IMPRESSIONS, error: null }
        if (hasSkipped) return { data: SKIPPED_IMPRESSIONS, error: null }
        return { data: [], error: null }
      }
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn((...args) => { eqArgs.push(args); return chain }),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn(() => Promise.resolve(resolveData())),
        then: (resolve, reject) => Promise.resolve(resolveData()).then(resolve, reject),
      }
      return chain
    }

    mockFrom.mockImplementation((table) => {
      if (table === 'user_profiles_computed') {
        return mockChainedQuery({
          data: {
            profile: mockLegacyProfile,
            seed_films: [],
            computed_at: new Date().toISOString(),
            data_points: 15,
            confidence: 'medium',
          },
          error: null,
        })
      }
      if (table === 'user_ratings') {
        return mockChainedQuery({ data: RATINGS, error: null })
      }
      if (table === 'user_watchlist') {
        return mockChainedQuery({ data: WATCHLIST, error: null })
      }
      if (table === 'recommendation_impressions') {
        return mockImpressionChain()
      }
      if (table === 'user_history') {
        return mockChainedQuery({ data: watchHistory, error: null })
      }
      if (table === 'user_preferences') {
        return mockChainedQuery({ data: ONBOARDING_PREFS, error: null })
      }
      return mockChainedQuery({ data: [], error: null })
    })

    // Community skip RPC — return success with empty result (no high-skip movies)
    mockRpc.mockResolvedValue({ data: [], error: null })

    const profile = await computeUserProfileV3(TEST_USER_ID)

    // ── rated section ──
    expect(profile.rated.positive_seeds.map(s => s.id)).toContain(814)  // Interstellar
    expect(profile.rated.positive_seeds.map(s => s.id)).toContain(836)  // Inception
    expect(profile.rated.positive_seeds.map(s => s.id)).toContain(11571) // A.I.
    expect(profile.rated.negative_seeds.map(s => s.id)).toContain(1200)  // The Quick One (rated 3)

    // Interstellar rated 10 → weight 5
    const interstellar = profile.rated.positive_seeds.find(s => s.id === 814)
    expect(interstellar.weight).toBe(5)

    // avg rating
    expect(profile.rated.avg_rating_given).toBeGreaterThan(0)

    // ── active_intent ──
    expect(profile.active_intent.watchlist_ids).toContain(2001)
    expect(profile.active_intent.watchlist_ids).toContain(2002)
    // 814 is watched, should be filtered from clicked_unwatched
    expect(profile.active_intent.clicked_unwatched_ids).toContain(3001)
    expect(profile.active_intent.clicked_unwatched_ids).toContain(3002)
    expect(profile.active_intent.clicked_unwatched_ids).not.toContain(814)

    // ── filters ──
    // Animation(16), Horror(27), Documentary(99), Family(10751), War(10752), Western(37)
    // should all be excluded (0 watches, not in onboarding prefs)
    expect(profile.filters.excluded_genre_ids.has(16)).toBe(true)   // Animation
    expect(profile.filters.excluded_genre_ids.has(27)).toBe(true)   // Horror
    expect(profile.filters.excluded_genre_ids.has(99)).toBe(true)   // Documentary
    expect(profile.filters.excluded_genre_ids.has(10751)).toBe(true) // Family
    expect(profile.filters.excluded_genre_ids.has(10752)).toBe(true) // War
    expect(profile.filters.excluded_genre_ids.has(37)).toBe(true)   // Western
    // Music(10402) — user watched Whiplash which has Music genre → NOT excluded
    expect(profile.filters.excluded_genre_ids.has(10402)).toBe(false)

    // language_primary: 14/15 are English = 93% >= 80%
    expect(profile.filters.language_primary).toBe('en')

    // runtime_band: runtimes range 87-169; p10≈~100, p90≈~160
    expect(profile.filters.runtime_band).not.toBeNull()
    expect(profile.filters.runtime_band[0]).toBeGreaterThanOrEqual(80)
    expect(profile.filters.runtime_band[0]).toBeLessThanOrEqual(120)
    expect(profile.filters.runtime_band[1]).toBeGreaterThanOrEqual(150)
    expect(profile.filters.runtime_band[1]).toBeLessThanOrEqual(180)

    // ── affinity ──
    // Christopher Nolan: 5 films (Interstellar, Inception, Dark Knight, Prestige, Memento)
    // But 5 are onboarding → only non-onboarding count for directors (all history counted)
    const nolanDir = profile.affinity.directors.find(d => d.name === 'Christopher Nolan')
    expect(nolanDir).toBeDefined()
    expect(nolanDir.count).toBeGreaterThanOrEqual(3)

    // Denis Villeneuve: 3 films (Arrival, Dune, Blade Runner 2049)
    const villeneuve = profile.affinity.directors.find(d => d.name === 'Denis Villeneuve')
    expect(villeneuve).toBeDefined()
    expect(villeneuve.count).toBeGreaterThanOrEqual(3)

    // fit_profiles: prestige_drama should be top
    expect(profile.affinity.fit_profiles.length).toBeGreaterThan(0)
    const topFp = profile.affinity.fit_profiles[0].profile
    expect(['prestige_drama', 'genre_popcorn']).toContain(topFp)

    // mood_tags: top tags should include tense, mysterious, thrilling, intense
    const topMoodTagNames = profile.affinity.mood_tags.slice(0, 5).map(t => t.tag)
    const expectedMoods = ['tense', 'mysterious', 'thrilling', 'intense', 'suspenseful']
    const overlap = topMoodTagNames.filter(t => expectedMoods.includes(t))
    expect(overlap.length).toBeGreaterThanOrEqual(2)

    // sentiment_loved_ids — empty since user_movie_sentiment table was dropped
    expect(profile.affinity.sentiment_loved_ids).toEqual([])

    // ── content_shape ──
    // With 10 non-onboarding watches, shape bands should be computed
    expect(profile.content_shape.pacing).not.toBeNull()
    expect(profile.content_shape.intensity).not.toBeNull()
    expect(profile.content_shape.depth).not.toBeNull()

    // ── negative ──
    expect(profile.negative.anti_seeds.some(s => s.id === 1200)).toBe(true) // rated 3, enriched with severity
    expect(profile.negative.personal_skipped_ids.size).toBe(3)

    // ── community ──
    expect(profile.community.high_skip_rate_ids).toBeInstanceOf(Set)

    // ── meta ──
    // 15 total watches, 5 onboarding → 10 non-onboarding → 'warming'
    expect(profile.meta.confidence).toBe('warming')
    expect(profile.meta.engine_version).toBe('3.0')
    // 10 watches → onboarding_weight in 15-29 range → linear 3→2
    expect(profile.meta.onboarding_weight).toBeGreaterThanOrEqual(2.0)
    expect(profile.meta.onboarding_weight).toBeLessThanOrEqual(3.0)

    // ── _legacy preserved ──
    expect(profile._legacy).toBeDefined()
    expect(profile._legacy.genres).toBeDefined()
  })
})

describe('getCommunityHighSkipSet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    RECOMMENDATION_TEST_HELPERS.resetCommunityCache()
  })

  it('returns a Set', async () => {
    mockRpc.mockResolvedValue({ data: [{ movie_id: 999 }, { movie_id: 888 }], error: null })
    const result = await getCommunityHighSkipSet()
    expect(result).toBeInstanceOf(Set)
  })
})
