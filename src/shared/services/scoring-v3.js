// src/shared/services/scoring-v3.js
/**
 * 7-dimension normalized scoring engine (v3).
 *
 * Every dimension returns 0-100. Final score is a weighted blend minus
 * negative signals, clamped to 0-100. Pure functions — no side effects,
 * no DB calls (except precomputeScoringContext which runs once per batch).
 *
 * Profile shape: v3 profile from computeUserProfileV3.
 * Movie shape: row from `movies` table (same fields as ROW_SELECT_FIELDS).
 */

import { supabase } from '@/shared/lib/supabase/client'
import { aggregateSeedMatches, antiSeedPenalty, selectSeeds } from './embedding-scoring'
import { scoreFitAgainstProfiles } from './fit-adjacency'
import { QUALITY_TIERS } from './quality-tiers'

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Row-specific weight presets. Each surface emphasises different dimensions
 * so rows surface genuinely different top-N films.
 *
 * Every preset must sum to ~1.0 (negative is subtracted, not added).
 */
export const ROW_WEIGHTS = {
  HERO:         { embedding: 0.30, fit: 0.20, mood: 0.15, director_genre: 0.10, content: 0.10, quality: 0.15, negative: 0.00 },
  TOP_OF_TASTE: { embedding: 0.30, fit: 0.25, mood: 0.05, director_genre: 0.15, content: 0.05, quality: 0.15, negative: 0.05 },
  MOOD_ROW:     { embedding: 0.10, fit: 0.10, mood: 0.40, director_genre: 0.10, content: 0.15, quality: 0.10, negative: 0.05 },
  DIRECTOR:     { embedding: 0.10, fit: 0.10, mood: 0.10, director_genre: 0.45, content: 0.05, quality: 0.15, negative: 0.05 },
  ORBIT:        { embedding: 0.45, fit: 0.10, mood: 0.15, director_genre: 0.05, content: 0.05, quality: 0.15, negative: 0.05 },
  CRITICS:      { embedding: 0.15, fit: 0.15, mood: 0.10, director_genre: 0.10, content: 0.05, quality: 0.40, negative: 0.05 },
  UNDER90:      { embedding: 0.20, fit: 0.20, mood: 0.15, director_genre: 0.15, content: 0.10, quality: 0.15, negative: 0.05 },
  COLD:         { embedding: 0.00, fit: 0.20, mood: 0.10, director_genre: 0.25, content: 0.15, quality: 0.30, negative: 0.00 },
}

/** Default engaged weights (used when rowType is unknown) */
const WEIGHTS_ENGAGED = ROW_WEIGHTS.HERO

/** Cold-start weights */
const WEIGHTS_COLD = ROW_WEIGHTS.COLD

// ============================================================================
// 1. EMBEDDING SEEDS (0-100)
// ============================================================================

/**
 * Score based on cosine similarity to user's positively-rated seed films.
 * Uses non-linear curve + multi-seed aggregation from embedding-scoring.js.
 *
 * @param {Object} movie
 * @param {Object} _profile - v3 profile (unused, kept for call-site compat)
 * @param {Map<number, Map<number, { cosine: number, seedWeight: number }>>} seedNeighborMap
 * @returns {number} 0-100
 */
export function scoreEmbeddingSeeds(movie, _profile, seedNeighborMap) {
  const matches = seedNeighborMap?.get?.(movie.id)
  if (!matches || matches.size === 0) return 0
  const similarities = Array.from(matches.values())
  return aggregateSeedMatches(similarities)
}

// ============================================================================
// 2. FIT PROFILE ALIGNMENT (0-100)
// ============================================================================

/**
 * Score based on how well the movie's fit_profile aligns with the user's
 * preferred fit profiles. Delegates to fit-adjacency.js for directional
 * 3-tier adjacency scoring.
 *
 * @param {Object} movie
 * @param {Object} profile - v3 profile
 * @returns {number} 0-100
 */
export function scoreFitProfileAlignment(movie, profile) {
  const topProfiles = (profile?.affinity?.fit_profiles || []).map(fp => fp.profile || fp)
  return scoreFitAgainstProfiles(movie.fit_profile, topProfiles)
}

// ============================================================================
// 3. MOOD COHERENCE (0-100)
// ============================================================================

/**
 * Score based on overlap between movie mood/tone tags and user's recent
 * mood signature.
 *
 * @param {Object} movie
 * @param {Object} profile - v3 profile
 * @returns {number} 0-100
 */
export function scoreMoodCoherence(movie, profile) {
  const userMoodTags = profile?.affinity?.mood_tags
  if (!userMoodTags || userMoodTags.length === 0) return 0

  const movieMoodTags = Array.isArray(movie.mood_tags) ? movie.mood_tags : []
  const movieToneTags = Array.isArray(movie.tone_tags) ? movie.tone_tags : []

  // Build lookup from user's top 10 mood tags
  const userMoodSet = new Set(userMoodTags.slice(0, 10).map(t => t.tag || t))

  // Build lookup from user's top 6 tone tags
  const userToneTags = profile?.affinity?.tone_tags || []
  const userToneSet = new Set(userToneTags.slice(0, 6).map(t => t.tag || t))

  const moodOverlap = movieMoodTags.filter(t => userMoodSet.has(t)).length
  const toneOverlap = movieToneTags.filter(t => userToneSet.has(t)).length

  const moodScore = Math.min(100, moodOverlap * 20)
  const toneScore = Math.min(100, toneOverlap * 20)

  return Math.round(0.7 * moodScore + 0.3 * toneScore)
}

// ============================================================================
// 4. DIRECTOR + GENRE (0-100)
// ============================================================================

/**
 * Score based on director match and genre alignment.
 *
 * @param {Object} movie
 * @param {Object} profile - v3 profile
 * @returns {number} 0-100
 */
export function scoreDirectorGenre(movie, profile) {
  // Director match (highest signal)
  const directors = profile?.affinity?.directors || []
  if (movie.director_name && directors.length > 0) {
    const dirMatch = directors.find(d => d.name === movie.director_name)
    if (dirMatch) return 100
  }

  // Genre combo match
  const movieGenres = Array.isArray(movie.genres)
    ? movie.genres.map(g => typeof g === 'number' ? g : (g?.id || g))
    : []
  const movieGenreSet = new Set(movieGenres)

  const combos = profile?.affinity?.genre_combos || []
  if (combos.length > 0) {
    const hasComboMatch = combos.some(c => {
      const combo = c.combo || c
      return Array.isArray(combo) && combo.every(gid => movieGenreSet.has(gid))
    })
    if (hasComboMatch) return 70
  }

  // Primary genre match (top 3 from legacy profile)
  const preferredGenres = profile?._legacy?.genres?.preferred || []
  const top3Genres = preferredGenres.slice(0, 3)
  if (top3Genres.length > 0 && movie.primary_genre) {
    // primary_genre is a string name; preferred is genre IDs — compare via movieGenres
    if (movieGenres.some(gid => top3Genres.includes(gid))) return 50
  }

  return 20
}

// ============================================================================
// 5. CONTENT SHAPE (0-100)
// ============================================================================

/**
 * Score based on how well the movie's pacing/intensity/depth fits the
 * user's content shape bands.
 *
 * @param {Object} movie
 * @param {Object} profile - v3 profile
 * @returns {number} 0-100
 */
export function scoreContentShape(movie, profile) {
  const shape = profile?.content_shape
  if (!shape || !shape.pacing) return 50 // neutral for users with < 10 watches

  const dimensions = [
    { value: movie.pacing_score_100, band: shape.pacing },
    { value: movie.intensity_score_100, band: shape.intensity },
    { value: movie.emotional_depth_score_100, band: shape.depth },
  ]

  let total = 0
  let count = 0

  for (const { value, band } of dimensions) {
    if (value == null || !band) continue
    count++

    // p20-p80 is the user's core range (1-10 scale in band, 0-100 in movie)
    // Convert band values from 1-10 to 0-100
    const lo20 = band.p20 * 10
    const hi80 = band.p80 * 10

    if (value >= lo20 && value <= hi80) {
      total += 100
    } else {
      // Wider tolerance: approximate p10/p90 as ±10% beyond p20/p80
      const margin = (hi80 - lo20) * 0.3
      const lo10 = lo20 - margin
      const hi90 = hi80 + margin
      if (value >= lo10 && value <= hi90) {
        total += 70
      } else {
        total += 30
      }
    }
  }

  return count > 0 ? Math.round(total / count) : 50
}

// ============================================================================
// 6. FILM QUALITY (0-100)
// ============================================================================

/**
 * Quality score dampened by confidence. Low-confidence films regress toward 60.
 *
 * @param {Object} movie
 * @returns {number} 0-100
 */
export function scoreFilmQuality(movie) {
  const q = movie.ff_audience_rating ?? 60
  const confidence = (movie.ff_audience_confidence ?? 50) / 100
  return Math.round(q * confidence + (1 - confidence) * 60)
}

// ============================================================================
// 7. NEGATIVE SIGNALS (0-100, higher = more penalty)
// ============================================================================

/**
 * Penalty score from anti-seeds, skipped profiles, community skips, personal skips.
 *
 * @param {Object} movie
 * @param {Object} profile - v3 profile
 * @param {Map<number, number>} antiSeedNeighborMap - Map<candidate_id, maxCosine>
 * @returns {number} 0-100 (100 = maximum penalty)
 */
export function scoreNegativeSignals(movie, profile, antiSeedNeighborMap) {
  let penalty = 0

  // Anti-seed proximity — graded by severity of the closest anti-seed
  if (antiSeedNeighborMap?.has(movie.id)) {
    const entry = antiSeedNeighborMap.get(movie.id)
    // entry is { cosine, severity } when graded, or plain number (legacy)
    const maxCosine = typeof entry === 'number' ? entry : entry.cosine
    const severity = typeof entry === 'number' ? 1.0 : (entry.severity ?? 1.0)
    penalty += Math.round(antiSeedPenalty(maxCosine) * severity)
  }

  // Skipped fit profile (Map: fit_profile → skip count)
  const skippedFp = profile?.negative?.skipped_fit_profiles
  if (skippedFp && movie.fit_profile) {
    const count = skippedFp instanceof Map
      ? (skippedFp.get(movie.fit_profile) || 0)
      : (skippedFp[movie.fit_profile] || 0)
    if (count >= 2) penalty += 20
  }

  // Community high-skip-rate
  const communitySkips = profile?.community?.high_skip_rate_ids
  if (communitySkips) {
    const has = communitySkips instanceof Set
      ? communitySkips.has(movie.id)
      : Array.isArray(communitySkips) && communitySkips.includes(movie.id)
    if (has) penalty += 40
  }

  // Weighted skip penalty (replaces binary personal_skipped_ids)
  const skipWeightMap = profile?.negative?.skip_weight_map
  if (skipWeightMap instanceof Map) {
    const skipW = skipWeightMap.get(movie.id) || 0
    if (skipW > 0) penalty += Math.min(60, Math.round(skipW * 40))
  } else {
    // Fallback: legacy binary personal_skipped_ids
    const personalSkips = profile?.negative?.personal_skipped_ids
    if (personalSkips) {
      const has = personalSkips instanceof Set
        ? personalSkips.has(movie.id)
        : Array.isArray(personalSkips) && personalSkips.includes(movie.id)
      if (has) penalty += 50
    }
  }

  return Math.min(100, penalty)
}

// ============================================================================
// COMPOSITE SCORER
// ============================================================================

/**
 * Score a movie across all 7 dimensions. Returns 0-100 final + breakdown.
 *
 * @param {Object} movie
 * @param {Object} profile - v3 profile
 * @param {Object} context - from precomputeScoringContext
 * @param {string} [rowType] - key from ROW_WEIGHTS (e.g. 'HERO', 'MOOD_ROW')
 * @returns {{ final: number, breakdown: Object, weights_used: Object }}
 */
export function scoreMovieV3(movie, profile, context, rowType) {
  const { seedNeighborMap, antiSeedNeighborMap, isColdStart } = context

  const scores = {
    embedding: scoreEmbeddingSeeds(movie, profile, seedNeighborMap),
    fit: scoreFitProfileAlignment(movie, profile),
    mood: scoreMoodCoherence(movie, profile),
    director_genre: scoreDirectorGenre(movie, profile),
    content: scoreContentShape(movie, profile),
    quality: scoreFilmQuality(movie),
    negative: scoreNegativeSignals(movie, profile, antiSeedNeighborMap),
  }

  const weights = isColdStart
    ? WEIGHTS_COLD
    : (ROW_WEIGHTS[rowType] || WEIGHTS_ENGAGED)

  const raw =
    scores.embedding * weights.embedding +
    scores.fit * weights.fit +
    scores.mood * weights.mood +
    scores.director_genre * weights.director_genre +
    scores.content * weights.content +
    scores.quality * weights.quality -
    scores.negative * weights.negative // negative SUBTRACTS

  return {
    final: Math.max(0, Math.min(100, Math.round(raw))),
    breakdown: scores,
    weights_used: weights,
  }
}

// ============================================================================
// CONTEXT PRECOMPUTATION
// ============================================================================

/**
 * Run once per recommendation batch. Single batched RPC per pool (positive +
 * anti-seed), builds nested Map for multi-seed aggregation.
 *
 * WHY single batch: pgvector on this instance can't index 3072-dim embeddings
 * (HNSW/IVFFlat both cap at 2000 dims). Every RPC is a sequential scan, so
 * batching all seeds into one call avoids N × sequential scans.
 *
 * @param {Object} profile - v3 profile
 * @returns {Promise<{ seedNeighborMap: Map<number, Map<number, {cosine,seedWeight}>>, antiSeedNeighborMap: Map<number, number>, isColdStart: boolean }>}
 */
export async function precomputeScoringContext(profile) {
  const positiveSeeds = profile?.rated?.positive_seeds || []
  const antiSeedRaw = profile?.negative?.anti_seeds || []
  const isColdStart = profile?.meta?.confidence === 'cold' || positiveSeeds.length === 0

  // Select top-10 weighted seeds (rating ≥ 7, sorted by seedWeight)
  const seeds = selectSeeds(positiveSeeds)
  const seedWeightById = new Map(seeds.map(s => [s.id, s.seedWeight]))

  const allSeedIds = seeds.map(s => s.id)
  // Build severity lookup from enriched anti_seeds
  const antiSeedSeverityById = new Map()
  const antiSeedIds = antiSeedRaw
    .map(s => {
      const id = Number(s.id || s)
      if (s.severity != null) antiSeedSeverityById.set(id, s.severity)
      return id
    })
    .filter(id => Number.isFinite(id) && id > 0)

  const [seedData, antiSeedData] = await Promise.all([
    fetchSeedNeighbors(allSeedIds, allSeedIds, 500),
    fetchSeedNeighbors(antiSeedIds, antiSeedIds, 200),
  ])

  // Build nested Map: candidate_id → Map<seed_id, { cosine, seedWeight }>
  const seedNeighborMap = new Map()
  for (const r of seedData) {
    const rid = Number(r.id)
    const seedId = Number(r.matched_seed_id)
    const cosine = Number(r.similarity || 0)
    if (!Number.isFinite(rid) || rid <= 0) continue
    if (!Number.isFinite(seedId)) continue

    if (!seedNeighborMap.has(rid)) {
      seedNeighborMap.set(rid, new Map())
    }
    seedNeighborMap.get(rid).set(seedId, {
      cosine,
      seedWeight: seedWeightById.get(seedId) || 0.2,
    })
  }

  // Anti-seed: flatten to Map<candidate_id, { cosine, severity }>
  // Keeps the highest-cosine match per candidate, with the matching anti-seed's severity.
  const antiSeedNeighborMap = new Map()
  for (const r of antiSeedData) {
    const rid = Number(r.id)
    const cosine = Number(r.similarity || 0)
    const seedId = Number(r.matched_seed_id)
    if (!Number.isFinite(rid) || rid <= 0) continue
    const cur = antiSeedNeighborMap.get(rid)
    if (!cur || cosine > cur.cosine) {
      antiSeedNeighborMap.set(rid, {
        cosine,
        severity: antiSeedSeverityById.get(seedId) ?? 1.0,
      })
    }
  }

  return { seedNeighborMap, antiSeedNeighborMap, isColdStart }
}

/**
 * Fetch pre-computed neighbors from movie_similarity via get_seed_neighbors RPC.
 * Index scan on pre-built table — sub-10ms, no pgvector scan at runtime.
 *
 * @param {number[]} seedIds
 * @param {number[]} excludeIds - IDs to exclude (typically the seeds themselves)
 * @param {number} topN - max neighbors to return
 * @returns {Promise<Array<{ id: number, similarity: number, matched_seed_id: number }>>}
 */
async function fetchSeedNeighbors(seedIds, excludeIds = [], topN = 500) {
  const validIds = (seedIds || []).filter(id => Number.isFinite(id) && id > 0)
  if (validIds.length === 0) return []

  const { data, error } = await supabase.rpc('get_seed_neighbors', {
    seed_ids: validIds,
    exclude_ids: excludeIds,
    top_n: topN,
    min_ff_rating: QUALITY_TIERS.CONTEXT.ff_audience_rating_min,
  })

  if (error || !data) {
    if (error) console.warn('[scoring-v3:fetchSeedNeighbors] RPC error:', error.message)
    return []
  }

  return data
}
