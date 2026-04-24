// src/shared/services/__tests__/contentStyleBoosts.test.js
//
// Unit tests for scoreContentStyleMatch (dimension 9b) and its integration
// into scoreMovieForUser. Follows the pattern in moodCoherence.test.js.

import { describe, it, expect } from 'vitest'
import { scoreMovieForUser } from '../recommendations'

// === HELPERS ===

function buildProfile(overrides = {}) {
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
    contentProfile: {
      avgPacing: 50, avgIntensity: 50, avgEmotionalDepth: 5,
      avgDialogueDensity: 50, avgAttentionDemand: 50, avgVFX: 50,
    },
    keywordCounts: {},
    era: {},
    runtime: {},
    languageDistribution: {},
    moodSignature: { recentMoodTags: [], recentToneTags: [], recentFitProfiles: [] },
    fitProfileAffinity: { preferred: [], topShare: 0 },
    preferences: { preferredDecades: [], avgRuntime: 120, runtimeRange: [80, 180], toleratesClassics: false },
    watchedMovieIds: [],
    negativeSignals: { skippedGenres: [], skippedDirectors: [], skippedActors: [] },
    feedbackSignals: null,
    ...overrides,
  }
}

function buildMovie(overrides = {}) {
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
    vfx_level_score: null,
    quality_score: null,
    visual_style_tags: [],
    user_satisfaction_score: null,
    user_satisfaction_confidence: null,
    ...overrides,
  }
}

// === TESTS ===

describe('contentStyleBoosts scoring (dimension 9b)', () => {
  it('returns 0 when profile has no feedbackSignals', () => {
    const profile = buildProfile({ feedbackSignals: null })
    const movie = buildMovie({ vfx_level_score: 85 })
    const result = scoreMovieForUser(movie, profile)
    expect(result.breakdown.contentStyle).toBe(0)
  })

  it('returns 0 when contentStyleBoosts is empty {}', () => {
    const profile = buildProfile({
      feedbackSignals: {
        genreBoosts: [], genreSuppressions: [],
        directorBoosts: [], directorSuppressions: [],
        actorBoosts: [], actorSuppressions: [],
        contentStyleBoosts: {},
      },
    })
    const movie = buildMovie({ vfx_level_score: 85 })
    const result = scoreMovieForUser(movie, profile)
    expect(result.breakdown.contentStyle).toBe(0)
  })

  it('returns 0 when total boost points < 3 (insufficient signal)', () => {
    const profile = buildProfile({
      feedbackSignals: {
        genreBoosts: [], genreSuppressions: [],
        directorBoosts: [], directorSuppressions: [],
        actorBoosts: [], actorSuppressions: [],
        // total = 1 + 1 = 2 — below the 3-point confidence threshold
        contentStyleBoosts: { cinematography: 1, acting: 1 },
      },
    })
    const movie = buildMovie({ vfx_level_score: 90 })
    const result = scoreMovieForUser(movie, profile)
    expect(result.breakdown.contentStyle).toBe(0)
  })

  it('returns bonus when cinematography boost present and vfx_level_score >= 70', () => {
    const profile = buildProfile({
      feedbackSignals: {
        genreBoosts: [], genreSuppressions: [],
        directorBoosts: [], directorSuppressions: [],
        actorBoosts: [], actorSuppressions: [],
        // total = 5 — above threshold
        contentStyleBoosts: { cinematography: 5 },
      },
    })
    // vfx_level_score 80 — triggers the cinematography heuristic
    const movie = buildMovie({ vfx_level_score: 80 })
    const result = scoreMovieForUser(movie, profile)
    // min(2, 5 * 0.4) = min(2, 2) = 2
    expect(result.breakdown.contentStyle).toBeGreaterThan(0)
    expect(result.breakdown.contentStyleDetail.cinematography).toBe(2)
  })

  it('returns 0 for cinematography boost when vfx_level_score < 70', () => {
    const profile = buildProfile({
      feedbackSignals: {
        genreBoosts: [], genreSuppressions: [],
        directorBoosts: [], directorSuppressions: [],
        actorBoosts: [], actorSuppressions: [],
        contentStyleBoosts: { cinematography: 5 },
      },
    })
    const movie = buildMovie({ vfx_level_score: 50 })
    const result = scoreMovieForUser(movie, profile)
    expect(result.breakdown.contentStyle).toBe(0)
    expect(result.breakdown.contentStyleDetail.cinematography).toBeUndefined()
  })

  it('caps total bonus at 8 even when many boost-matches fire', () => {
    const profile = buildProfile({
      feedbackSignals: {
        genreBoosts: [], genreSuppressions: [],
        directorBoosts: [{ name: 'denis villeneuve', score: 10 }],
        directorSuppressions: [],
        actorBoosts: [{ name: 'cate blanchett', score: 5 }],
        actorSuppressions: [],
        // All attributes boosted heavily
        contentStyleBoosts: {
          cinematography: 10,
          acting: 10,
          story: 10,
          direction: 10,
          dialogue: 10,
        },
      },
    })
    const movie = buildMovie({
      vfx_level_score: 90,
      quality_score: 80,
      emotional_depth_score: 8,
      dialogue_density: 70,
      director_name: 'Denis Villeneuve',
      lead_actor_name: 'Cate Blanchett',
    })
    const result = scoreMovieForUser(movie, profile)
    expect(result.breakdown.contentStyle).toBeLessThanOrEqual(8)
  })

  it('integration: breakdown includes contentStyle key', () => {
    const profile = buildProfile({ feedbackSignals: null })
    const movie = buildMovie()
    const result = scoreMovieForUser(movie, profile)
    expect(result.breakdown).toHaveProperty('contentStyle')
    expect(result.breakdown).toHaveProperty('contentStyleDetail')
  })
})
