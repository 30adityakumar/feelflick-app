import { describe, it, expect } from 'vitest'
import { scoreMovieForUser } from '../recommendations'

/**
 * Minimal profile shape for testing — only fields scoreMovieForUser reads.
 */
function buildTestProfile(overrides = {}) {
  return {
    genres: { preferred: [], secondary: [] },
    meta: { confidence: 'medium' },
    qualityProfile: { totalMoviesWatched: 20, watchesHiddenGems: false },
    affinities: {
      directors: [],
      actors: [],
      pacing: { preferred: 50 },
      intensity: { preferred: 50 },
      depth: { preferred: 50 },
    },
    watchedGenreCounts: {},
    contentProfile: { pacing: {}, depth: {}, intensity: {} },
    keywordCounts: {},
    era: {},
    runtime: {},
    languageDistribution: {},
    moodSignature: { recentMoodTags: [], recentToneTags: [], recentFitProfiles: [] },
    fitProfileAffinity: { preferred: [], topShare: 0 },
    preferences: { preferredDecades: [], avgRuntime: 120, runtimeRange: [80, 180], toleratesClassics: false },
    watchedMovieIds: [],
    negativeSignals: { skippedGenres: [], skippedDirectors: [] },
    ...overrides,
  }
}

function buildTestMovie(overrides = {}) {
  return {
    id: 1,
    tmdb_id: 100,
    title: 'Test Movie',
    ff_rating: 7.5,
    ff_final_rating: 7.5,
    ff_rating_genre_normalized: 7.5,
    ff_audience_rating: null,
    ff_confidence: 80,
    vote_average: 7.0,
    vote_count: 5000,
    discovery_potential: 30,
    polarization_score: 20,
    accessibility_score: 50,
    starpower_score: 40,
    cult_status_score: 20,
    genres: [],
    keywords: [],
    director_name: null,
    lead_actor_name: null,
    release_year: 2023,
    runtime: 120,
    original_language: 'en',
    mood_tags: [],
    tone_tags: [],
    fit_profile: null,
    dialogue_density: null,
    attention_demand: null,
    emotional_depth_score: null,
    user_satisfaction_score: null,
    user_satisfaction_confidence: null,
    ...overrides,
  }
}

describe('moodCoherence scoring (dimension 19)', () => {
  it('returns 0 when profile has no mood signature', () => {
    const profile = buildTestProfile({ moodSignature: { recentMoodTags: [], recentToneTags: [], recentFitProfiles: [] } })
    const movie = buildTestMovie({ mood_tags: ['tense', 'dark'], tone_tags: ['raw'] })

    const result = scoreMovieForUser(movie, profile)
    expect(result.breakdown.moodCoherence).toBe(0)
  })

  it('scores mood tag matches and caps at 20', () => {
    const profile = buildTestProfile({
      moodSignature: {
        recentMoodTags: [
          { tag: 'tense', weight: 5.0 },
          { tag: 'dark', weight: 4.0 },
          { tag: 'haunting', weight: 3.0 },
          { tag: 'unsettling', weight: 2.0 },
          { tag: 'mysterious', weight: 1.5 },
        ],
        recentToneTags: [
          { tag: 'raw', weight: 3.0 },
          { tag: 'urgent', weight: 2.0 },
        ],
        recentFitProfiles: [],
      },
    })

    // Movie with heavy mood_tag overlap — should hit the +20 cap
    const movie = buildTestMovie({
      mood_tags: ['tense', 'dark', 'haunting', 'unsettling', 'mysterious'],
      tone_tags: ['raw', 'urgent'],
    })

    const result = scoreMovieForUser(movie, profile)
    // 5 mood matches × weight × 2 = (5*2 + 4*2 + 3*2 + 2*2 + 1.5*2) = 31
    // 2 tone matches × weight × 1 = (3*1 + 2*1) = 5
    // total = 36, capped at 20
    expect(result.breakdown.moodCoherence).toBe(20)
  })

  it('scores partial overlap correctly', () => {
    const profile = buildTestProfile({
      moodSignature: {
        recentMoodTags: [
          { tag: 'cozy', weight: 3.0 },
          { tag: 'heartwarming', weight: 2.0 },
        ],
        recentToneTags: [
          { tag: 'warm', weight: 2.0 },
        ],
        recentFitProfiles: [],
      },
    })

    // Only 1 mood tag match
    const movie = buildTestMovie({
      mood_tags: ['cozy', 'whimsical'],
      tone_tags: ['intimate'],
    })

    const result = scoreMovieForUser(movie, profile)
    // 1 mood match: cozy × 3.0 × 2 = 6
    // 0 tone matches
    // total = 6, under cap
    expect(result.breakdown.moodCoherence).toBe(6)
  })

  it('scores tone tag matches when mood tags are also present', () => {
    const profile = buildTestProfile({
      moodSignature: {
        recentMoodTags: [
          { tag: 'reflective', weight: 1.0 },
        ],
        recentToneTags: [
          { tag: 'poetic', weight: 4.0 },
          { tag: 'intimate', weight: 3.0 },
        ],
        recentFitProfiles: [],
      },
    })

    const movie = buildTestMovie({
      mood_tags: [],
      tone_tags: ['poetic', 'intimate'],
    })

    const result = scoreMovieForUser(movie, profile)
    // 0 mood matches, 2 tone matches: poetic × 4 × 1 + intimate × 3 × 1 = 7
    expect(result.breakdown.moodCoherence).toBe(7)
  })

  it('returns 0 when profile has only tone tags (no mood tags)', () => {
    // NOTE: current guard gates on recentMoodTags.length > 0 — tone-only profiles skip scoring
    const profile = buildTestProfile({
      moodSignature: {
        recentMoodTags: [],
        recentToneTags: [
          { tag: 'poetic', weight: 4.0 },
        ],
        recentFitProfiles: [],
      },
    })

    const movie = buildTestMovie({ mood_tags: [], tone_tags: ['poetic'] })

    const result = scoreMovieForUser(movie, profile)
    expect(result.breakdown.moodCoherence).toBe(0)
  })

  it('returns 0 when movie has no mood/tone tags', () => {
    const profile = buildTestProfile({
      moodSignature: {
        recentMoodTags: [{ tag: 'tense', weight: 5.0 }],
        recentToneTags: [{ tag: 'raw', weight: 3.0 }],
        recentFitProfiles: [],
      },
    })

    const movie = buildTestMovie({ mood_tags: [], tone_tags: [] })

    const result = scoreMovieForUser(movie, profile)
    expect(result.breakdown.moodCoherence).toBe(0)
  })
})
