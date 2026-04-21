import { describe, expect, it } from 'vitest'

import {
  scoreEmbeddingSeeds,
  scoreFitProfileAlignment,
  scoreMoodCoherence,
  scoreDirectorGenre,
  scoreContentShape,
  scoreFilmQuality,
  scoreNegativeSignals,
  scoreMovieV3,
  ROW_WEIGHTS,
} from '../scoring-v3'

// === HELPERS ===

function makeMovie(overrides = {}) {
  return {
    id: 1,
    title: 'Test Movie',
    fit_profile: 'crowd_pleaser',
    mood_tags: ['thrilling', 'suspenseful'],
    tone_tags: ['dark', 'gritty'],
    genres: [28, 878], // Action, Sci-Fi
    primary_genre: 'Action',
    director_name: 'Denis Villeneuve',
    pacing_score_100: 60,
    intensity_score_100: 70,
    emotional_depth_score_100: 50,
    ff_audience_rating: 82,
    ff_audience_confidence: 80,
    ff_rating_genre_normalized: 8.2,
    vote_count: 5000,
    ...overrides,
  }
}

function makeProfile(overrides = {}) {
  return {
    rated: {
      positive_seeds: [
        { id: 100, rating: 9, weight: 4 },
        { id: 101, rating: 8, weight: 3 },
      ],
      negative_seeds: [],
      avg_rating_given: 7.5,
    },
    affinity: {
      fit_profiles: [
        { profile: 'crowd_pleaser', count: 5, share: 0.4 },
        { profile: 'genre_popcorn', count: 3, share: 0.25 },
        { profile: 'comfort_watch', count: 2, share: 0.15 },
      ],
      directors: [{ name: 'Denis Villeneuve', count: 4 }],
      mood_tags: [
        { tag: 'thrilling', count: 5 },
        { tag: 'suspenseful', count: 4 },
        { tag: 'epic', count: 3 },
      ],
      tone_tags: [
        { tag: 'dark', count: 4 },
        { tag: 'gritty', count: 3 },
      ],
      genre_combos: [{ combo: [28, 878], count: 3 }],
    },
    content_shape: {
      pacing: { p20: 4.5, p80: 7.5 },
      intensity: { p20: 5.0, p80: 8.0 },
      depth: { p20: 3.0, p80: 6.0 },
    },
    negative: {
      skipped_fit_profiles: new Map([['challenging_art', 3]]),
      skipped_mood_tags: new Map(),
      anti_seeds: [{ id: 200, rating: 2, sentiment: null, severity: 1.0 }],
      personal_skipped_ids: new Set([999]),
      skip_weight_map: new Map([[999, 1.5]]), // fresh hero skip
      hero_cooldown: new Set(),
      row_cooldown: new Set(),
    },
    community: {
      high_skip_rate_ids: new Set([888]),
    },
    meta: {
      total_watches: 25,
      confidence: 'engaged',
    },
    _legacy: {
      genres: { preferred: [28, 878, 18] },
    },
    ...overrides,
  }
}

function makeScoringContext(overrides = {}) {
  return {
    seedNeighborMap: new Map(),
    antiSeedNeighborMap: new Map(),
    isColdStart: false,
    ...overrides,
  }
}

// === TESTS ===

describe('scoreEmbeddingSeeds', () => {
  it('returns 0 when seedNeighborMap is empty', () => {
    const movie = makeMovie({ id: 50 })
    expect(scoreEmbeddingSeeds(movie, makeProfile(), new Map())).toBe(0)
  })

  it('returns 0 when movie not in map', () => {
    const movie = makeMovie({ id: 999 })
    const seedMap = new Map([[50, new Map([[100, { cosine: 0.85, seedWeight: 1.0 }]])]])
    expect(scoreEmbeddingSeeds(movie, makeProfile(), seedMap)).toBe(0)
  })

  it('scores single seed match at full weight (no position dampening)', () => {
    const movie = makeMovie({ id: 50 })
    // Nested Map: candidate 50 → seed 100 with cosine 0.70, weight 1.0
    const innerMap = new Map([[100, { cosine: 0.70, seedWeight: 1.0 }]])
    const seedMap = new Map([[50, innerMap]])
    const score = scoreEmbeddingSeeds(movie, makeProfile(), seedMap)
    // curveSimilarity(0.70) ≈ 83, single match: 83 × 1.0 = 83
    expect(score).toBeGreaterThanOrEqual(80)
    expect(score).toBeLessThanOrEqual(86)
  })

  it('3 strong seed matches score higher than 1 moderate match', () => {
    // Single match at 0.65 → curved ≈ 67 × 1.0 = 67
    const singleMap = new Map([[50, new Map([
      [100, { cosine: 0.65, seedWeight: 1.0 }],
    ])]])
    // Triple: 0.73 + 0.70 + 0.68 → all strong, weighted blend > single moderate
    const tripleMap = new Map([[50, new Map([
      [100, { cosine: 0.73, seedWeight: 1.0 }],
      [101, { cosine: 0.70, seedWeight: 0.8 }],
      [102, { cosine: 0.68, seedWeight: 0.7 }],
    ])]])
    const movie = makeMovie({ id: 50 })
    const single = scoreEmbeddingSeeds(movie, makeProfile(), singleMap)
    const triple = scoreEmbeddingSeeds(movie, makeProfile(), tripleMap)
    expect(triple).toBeGreaterThan(single)
  })

  it('returns 0 when map has empty inner Map', () => {
    const movie = makeMovie({ id: 50 })
    const seedMap = new Map([[50, new Map()]])
    expect(scoreEmbeddingSeeds(movie, makeProfile(), seedMap)).toBe(0)
  })
})

describe('scoreFitProfileAlignment', () => {
  // Default profile: ['crowd_pleaser', 'genre_popcorn', 'comfort_watch']

  it('returns 100 for top-1 match', () => {
    const movie = makeMovie({ fit_profile: 'crowd_pleaser' })
    expect(scoreFitProfileAlignment(movie, makeProfile())).toBe(100)
  })

  it('returns 80 for top-2 match', () => {
    const movie = makeMovie({ fit_profile: 'genre_popcorn' })
    expect(scoreFitProfileAlignment(movie, makeProfile())).toBe(80)
  })

  it('returns 70 for top-3 match', () => {
    const movie = makeMovie({ fit_profile: 'comfort_watch' })
    expect(scoreFitProfileAlignment(movie, makeProfile())).toBe(70)
  })

  it('returns 70 for close adjacency to top-1', () => {
    // franchise_entry is close adjacent to crowd_pleaser
    const movie = makeMovie({ fit_profile: 'franchise_entry' })
    expect(scoreFitProfileAlignment(movie, makeProfile())).toBe(70)
  })

  it('returns 40 for far adjacency to top-1', () => {
    // cult_classic is far adjacent to crowd_pleaser
    const movie = makeMovie({ fit_profile: 'cult_classic' })
    expect(scoreFitProfileAlignment(movie, makeProfile())).toBe(40)
  })

  it('returns 0 for clash (not adjacent to any top profile)', () => {
    // arthouse is not adjacent to crowd_pleaser, genre_popcorn, or comfort_watch
    const movie = makeMovie({ fit_profile: 'arthouse' })
    // Check: crowd_pleaser close=[genre_popcorn, comfort_watch, franchise_entry], far=[cult_classic]
    // genre_popcorn close=[crowd_pleaser, franchise_entry], far=[cult_classic, comfort_watch]
    // arthouse is not in any of these → clash = 0
    expect(scoreFitProfileAlignment(movie, makeProfile())).toBe(0)
  })

  it('returns 40 for unknown/null fit profile', () => {
    const movie = makeMovie({ fit_profile: null })
    expect(scoreFitProfileAlignment(movie, makeProfile())).toBe(40)
  })

  it('returns 50 neutral when profile has no fit profiles (cold)', () => {
    const movie = makeMovie({ fit_profile: 'crowd_pleaser' })
    const coldProfile = makeProfile({ affinity: { ...makeProfile().affinity, fit_profiles: [] } })
    expect(scoreFitProfileAlignment(movie, coldProfile)).toBe(50)
  })
})

describe('scoreMoodCoherence', () => {
  it('scores based on mood + tone overlap', () => {
    const movie = makeMovie({
      mood_tags: ['thrilling', 'suspenseful', 'epic'],
      tone_tags: ['dark'],
    })
    const score = scoreMoodCoherence(movie, makeProfile())
    // moodOverlap = 3 (thrilling, suspenseful, epic) → moodScore = min(100, 60) = 60
    // toneOverlap = 1 (dark) → toneScore = min(100, 20) = 20
    // 0.7 * 60 + 0.3 * 20 = 42 + 6 = 48
    expect(score).toBe(48)
  })

  it('caps at 100 with full overlap', () => {
    const movie = makeMovie({
      mood_tags: ['thrilling', 'suspenseful', 'epic', 'a', 'b'],
      tone_tags: ['dark', 'gritty', 'c', 'd', 'e'],
    })
    const profile = makeProfile({
      affinity: {
        ...makeProfile().affinity,
        mood_tags: ['thrilling', 'suspenseful', 'epic', 'a', 'b'].map(t => ({ tag: t, count: 5 })),
        tone_tags: ['dark', 'gritty', 'c', 'd', 'e'].map(t => ({ tag: t, count: 4 })),
      },
    })
    const score = scoreMoodCoherence(movie, profile)
    // 5 mood matches → 100, 5 tone matches → 100
    // 0.7 * 100 + 0.3 * 100 = 100
    expect(score).toBe(100)
  })

  it('returns 0 when profile has no mood tags', () => {
    const profile = makeProfile({ affinity: { ...makeProfile().affinity, mood_tags: [] } })
    expect(scoreMoodCoherence(makeMovie(), profile)).toBe(0)
  })
})

describe('scoreDirectorGenre', () => {
  it('returns 100 for director match', () => {
    const movie = makeMovie({ director_name: 'Denis Villeneuve' })
    expect(scoreDirectorGenre(movie, makeProfile())).toBe(100)
  })

  it('returns 70 for genre combo match', () => {
    const movie = makeMovie({ director_name: 'Unknown', genres: [28, 878] })
    expect(scoreDirectorGenre(movie, makeProfile())).toBe(70)
  })

  it('returns 50 for primary genre in top 3', () => {
    // Genre 18 (Drama) is 3rd in preferred
    const movie = makeMovie({ director_name: 'Unknown', genres: [18], primary_genre: 'Drama' })
    expect(scoreDirectorGenre(movie, makeProfile())).toBe(50)
  })

  it('returns 20 for no match', () => {
    const movie = makeMovie({ director_name: 'Unknown', genres: [9999], primary_genre: 'Unknown' })
    expect(scoreDirectorGenre(movie, makeProfile())).toBe(20)
  })
})

describe('scoreContentShape', () => {
  it('returns 100 when all dimensions are within p20-p80 band', () => {
    // pacing band: p20=4.5 → 45, p80=7.5 → 75; movie=60 → in range
    // intensity band: p20=5.0 → 50, p80=8.0 → 80; movie=70 → in range
    // depth band: p20=3.0 → 30, p80=6.0 → 60; movie=50 → in range
    const movie = makeMovie({
      pacing_score_100: 60,
      intensity_score_100: 70,
      emotional_depth_score_100: 50,
    })
    expect(scoreContentShape(movie, makeProfile())).toBe(100)
  })

  it('returns 50 neutral when profile has no content shape (cold)', () => {
    const coldProfile = makeProfile({ content_shape: { pacing: null, intensity: null, depth: null } })
    expect(scoreContentShape(makeMovie(), coldProfile)).toBe(50)
  })

  it('returns lower score when outside p20-p80 band', () => {
    const movie = makeMovie({
      pacing_score_100: 10, // way outside [45-75]
      intensity_score_100: 10, // way outside [50-80]
      emotional_depth_score_100: 10, // way outside [30-60]
    })
    const score = scoreContentShape(movie, makeProfile())
    expect(score).toBe(30) // all 3 dimensions at 30
  })
})

describe('scoreFilmQuality', () => {
  it('returns high score for high-quality high-confidence film', () => {
    const movie = makeMovie({ ff_audience_rating: 90, ff_audience_confidence: 95 })
    const score = scoreFilmQuality(movie)
    // 90 * 0.95 + 0.05 * 60 = 85.5 + 3 = 88.5 → 89
    expect(score).toBe(89)
  })

  it('dampens low-confidence score toward 60', () => {
    const movie = makeMovie({ ff_audience_rating: 90, ff_audience_confidence: 20 })
    const score = scoreFilmQuality(movie)
    // 90 * 0.2 + 0.8 * 60 = 18 + 48 = 66
    expect(score).toBe(66)
  })

  it('returns 60 at zero confidence', () => {
    const movie = makeMovie({ ff_audience_rating: 90, ff_audience_confidence: 0 })
    expect(scoreFilmQuality(movie)).toBe(60)
  })

  it('returns near raw score at full confidence', () => {
    const movie = makeMovie({ ff_audience_rating: 80, ff_audience_confidence: 100 })
    expect(scoreFilmQuality(movie)).toBe(80)
  })
})

describe('scoreNegativeSignals', () => {
  it('applies strong anti-seed penalty for cosine >= 0.85', () => {
    const movie = makeMovie({ id: 50 })
    const profile = makeProfile()
    const antiMap = new Map([[50, 0.88]])
    const score = scoreNegativeSignals(movie, profile, antiMap)
    // antiSeedPenalty(0.88) = 80
    expect(score).toBe(80)
  })

  it('applies moderate anti-seed penalty for cosine 0.75-0.84', () => {
    const movie = makeMovie({ id: 50 })
    const profile = makeProfile()
    const antiMap = new Map([[50, 0.78]])
    const score = scoreNegativeSignals(movie, profile, antiMap)
    // antiSeedPenalty(0.78) = 50
    expect(score).toBe(50)
  })

  it('applies mild anti-seed penalty for cosine 0.65-0.74', () => {
    const movie = makeMovie({ id: 50 })
    const profile = makeProfile()
    const antiMap = new Map([[50, 0.70]])
    const score = scoreNegativeSignals(movie, profile, antiMap)
    // antiSeedPenalty(0.70) = 25
    expect(score).toBe(25)
  })

  it('adds skipped fit profile penalty', () => {
    // challenging_art has 3 skips in profile
    const movie = makeMovie({ fit_profile: 'challenging_art' })
    const score = scoreNegativeSignals(movie, makeProfile(), new Map())
    expect(score).toBe(20)
  })

  it('adds community high-skip penalty', () => {
    const movie = makeMovie({ id: 888 })
    const score = scoreNegativeSignals(movie, makeProfile(), new Map())
    expect(score).toBe(40)
  })

  it('adds weighted skip penalty from skip_weight_map', () => {
    const movie = makeMovie({ id: 999 })
    const score = scoreNegativeSignals(movie, makeProfile(), new Map())
    // skip_weight_map has 999→1.5, penalty = min(60, 1.5×40) = 60
    expect(score).toBe(60)
  })

  it('stacks multiple penalties and caps at 100', () => {
    // weighted skip (60) + community skip (40) + skipped fit (20) = 120 → capped at 100
    const movie = makeMovie({ id: 999, fit_profile: 'challenging_art' })
    const profile = makeProfile({
      community: { high_skip_rate_ids: new Set([999]) },
    })
    const score = scoreNegativeSignals(movie, profile, new Map())
    expect(score).toBe(100)
  })
})

describe('scoreMovieV3', () => {
  it('returns 0-100 final score with breakdown', () => {
    const result = scoreMovieV3(makeMovie(), makeProfile(), makeScoringContext())
    expect(result.final).toBeGreaterThanOrEqual(0)
    expect(result.final).toBeLessThanOrEqual(100)
    expect(result.breakdown).toBeDefined()
    expect(result.weights_used).toBeDefined()
  })

  it('cold-start uses cold weights (zero embedding)', () => {
    const ctx = makeScoringContext({ isColdStart: true })
    const result = scoreMovieV3(makeMovie(), makeProfile(), ctx)
    expect(result.weights_used.embedding).toBe(0)
    expect(result.weights_used.negative).toBe(0)
    expect(result.weights_used.quality).toBe(0.30)
  })

  it('engaged uses full weights', () => {
    const ctx = makeScoringContext({ isColdStart: false })
    const result = scoreMovieV3(makeMovie(), makeProfile(), ctx)
    expect(result.weights_used.embedding).toBe(0.30)
    expect(result.weights_used.quality).toBe(0.15)
  })

  it('engaged weights sum to 1.0', () => {
    const ctx = makeScoringContext({ isColdStart: false })
    const result = scoreMovieV3(makeMovie(), makeProfile(), ctx)
    const w = result.weights_used
    const sum = w.embedding + w.fit + w.mood + w.director_genre + w.content + w.quality + w.negative
    expect(sum).toBeCloseTo(1.0, 5)
  })

  it('cold weights sum to 1.0', () => {
    const ctx = makeScoringContext({ isColdStart: true })
    const result = scoreMovieV3(makeMovie(), makeProfile(), ctx)
    const w = result.weights_used
    const sum = w.embedding + w.fit + w.mood + w.director_genre + w.content + w.quality + w.negative
    expect(sum).toBeCloseTo(1.0, 5)
  })

  it('negative signals subtract from score', () => {
    const movie = makeMovie({ id: 999 }) // personal skipped
    const profile = makeProfile()
    const ctx = makeScoringContext()
    // Use TOP_OF_TASTE which has negative weight > 0 (HERO has negative: 0.00)
    const withPenalty = scoreMovieV3(movie, profile, ctx, 'TOP_OF_TASTE')

    const cleanMovie = makeMovie({ id: 1 }) // not in any negative list
    const withoutPenalty = scoreMovieV3(cleanMovie, profile, ctx, 'TOP_OF_TASTE')

    expect(withPenalty.final).toBeLessThan(withoutPenalty.final)
  })

  it('uses row-specific weights when rowType is provided', () => {
    const movie = makeMovie()
    const profile = makeProfile()
    const ctx = makeScoringContext({ isColdStart: false })

    const heroResult = scoreMovieV3(movie, profile, ctx, 'HERO')
    const moodResult = scoreMovieV3(movie, profile, ctx, 'MOOD_ROW')

    // MOOD_ROW weights mood at 0.40 vs HERO at 0.15 → different scores
    expect(heroResult.weights_used.mood).toBe(0.15)
    expect(moodResult.weights_used.mood).toBe(0.40)
    expect(heroResult.final).not.toBe(moodResult.final)
  })

  it('falls back to HERO weights for unknown rowType', () => {
    const ctx = makeScoringContext({ isColdStart: false })
    const result = scoreMovieV3(makeMovie(), makeProfile(), ctx, 'UNKNOWN_ROW')
    expect(result.weights_used).toEqual(ROW_WEIGHTS.HERO)
  })
})

describe('ROW_WEIGHTS', () => {
  it('all presets sum to ~1.0', () => {
    for (const [name, w] of Object.entries(ROW_WEIGHTS)) {
      const sum = w.embedding + w.fit + w.mood + w.director_genre + w.content + w.quality + w.negative
      expect(sum, `${name} weights should sum to 1.0`).toBeCloseTo(1.0, 5)
    }
  })
})

// ============================================================================
// scoreNegativeSignals — weighted skip + graded anti-seed
// ============================================================================

describe('scoreNegativeSignals — weighted skips', () => {
  it('fresh hero skip → penalty ~60 (capped)', () => {
    // skip_weight = 1.0 (fresh) × 1.5 (hero) = 1.5 → penalty = min(60, 1.5×40) = 60
    const movie = makeMovie({ id: 42 })
    const profile = makeProfile({
      negative: {
        skipped_fit_profiles: new Map(),
        skipped_mood_tags: new Map(),
        anti_seeds: [],
        personal_skipped_ids: new Set(),
        skip_weight_map: new Map([[42, 1.5]]),
        hero_cooldown: new Set(),
        row_cooldown: new Set(),
      },
      community: { high_skip_rate_ids: new Set() },
    })
    const penalty = scoreNegativeSignals(movie, profile, new Map())
    expect(penalty).toBe(60)
  })

  it('30-day-old row skip → penalty ~24', () => {
    // skip_weight = 0.6 (30d) × 1.0 (row) = 0.6 → penalty = min(60, 0.6×40) = 24
    const movie = makeMovie({ id: 42 })
    const profile = makeProfile({
      negative: {
        skipped_fit_profiles: new Map(),
        skipped_mood_tags: new Map(),
        anti_seeds: [],
        personal_skipped_ids: new Set(),
        skip_weight_map: new Map([[42, 0.6]]),
        hero_cooldown: new Set(),
        row_cooldown: new Set(),
      },
      community: { high_skip_rate_ids: new Set() },
    })
    const penalty = scoreNegativeSignals(movie, profile, new Map())
    expect(penalty).toBe(24)
  })

  it('no skip → zero penalty from skip map', () => {
    const movie = makeMovie({ id: 42 })
    const profile = makeProfile({
      negative: {
        skipped_fit_profiles: new Map(),
        skipped_mood_tags: new Map(),
        anti_seeds: [],
        personal_skipped_ids: new Set(),
        skip_weight_map: new Map(),
        hero_cooldown: new Set(),
        row_cooldown: new Set(),
      },
      community: { high_skip_rate_ids: new Set() },
    })
    const penalty = scoreNegativeSignals(movie, profile, new Map())
    expect(penalty).toBe(0)
  })

  it('falls back to legacy personal_skipped_ids when no skip_weight_map', () => {
    const movie = makeMovie({ id: 999 })
    const profile = makeProfile({
      negative: {
        skipped_fit_profiles: new Map(),
        skipped_mood_tags: new Map(),
        anti_seeds: [],
        personal_skipped_ids: new Set([999]),
        // no skip_weight_map
      },
      community: { high_skip_rate_ids: new Set() },
    })
    const penalty = scoreNegativeSignals(movie, profile, new Map())
    expect(penalty).toBe(50)
  })
})

describe('scoreNegativeSignals — graded anti-seed', () => {
  it('severity 0.5 halves the anti-seed penalty', () => {
    const movie = makeMovie({ id: 42 })
    const profile = makeProfile({
      negative: {
        skipped_fit_profiles: new Map(),
        skipped_mood_tags: new Map(),
        anti_seeds: [],
        personal_skipped_ids: new Set(),
        skip_weight_map: new Map(),
        hero_cooldown: new Set(),
        row_cooldown: new Set(),
      },
      community: { high_skip_rate_ids: new Set() },
    })

    // Full severity (1.0): cosine 0.85 → base 80 × 1.0 = 80
    const fullMap = new Map([[42, { cosine: 0.85, severity: 1.0 }]])
    const fullPenalty = scoreNegativeSignals(movie, profile, fullMap)

    // Half severity (0.5): cosine 0.85 → base 80 × 0.5 = 40
    const halfMap = new Map([[42, { cosine: 0.85, severity: 0.5 }]])
    const halfPenalty = scoreNegativeSignals(movie, profile, halfMap)

    expect(fullPenalty).toBe(80)
    expect(halfPenalty).toBe(40)
  })

  it('legacy number format still works', () => {
    const movie = makeMovie({ id: 42 })
    const profile = makeProfile({
      negative: {
        skipped_fit_profiles: new Map(),
        skipped_mood_tags: new Map(),
        anti_seeds: [],
        personal_skipped_ids: new Set(),
        skip_weight_map: new Map(),
        hero_cooldown: new Set(),
        row_cooldown: new Set(),
      },
      community: { high_skip_rate_ids: new Set() },
    })
    // Legacy: plain number (no severity object)
    const legacyMap = new Map([[42, 0.85]])
    const penalty = scoreNegativeSignals(movie, profile, legacyMap)
    expect(penalty).toBe(80)
  })
})
