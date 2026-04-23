// src/shared/services/exclusions.js
/**
 * Unified exclusion pipeline for all recommendation candidate fetches.
 *
 * Works with both v2 profile (profile.exclusions) and v3 profile (profile.filters).
 * Detects shape automatically so this can ship before full v3 migration.
 */

import { RECOMMENDATION_CONSTANTS, extractGenreId } from './recommendations'

// WHY: lazy access — RECOMMENDATION_CONSTANTS may be undefined at import time
// due to circular dependency (recommendations.js → exclusions.js → recommendations.js).
// By the time any function runs, the module is fully initialized.
function getGenreIdToName() {
  return RECOMMENDATION_CONSTANTS.GENRE_ID_TO_NAME
}

/** Default era floor for cold-start users (< 10 watches) */
export const ERA_FLOOR_COLD = 2000

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Resolve excluded genre IDs from either v2 or v3 profile shape.
 * @param {Object} profile
 * @returns {Set<number>}
 */
function resolveExcludedGenreIds(profile) {
  const ids = profile?.filters?.excluded_genre_ids
    ?? profile?.exclusions?.genreIds
    ?? new Set()
  return ids instanceof Set ? ids : new Set(ids || [])
}

/**
 * Resolve excluded genre names from either v2 or v3 profile shape.
 * @param {Object} profile
 * @returns {string[]}
 */
function resolveExcludedGenreNames(profile) {
  // v3 derives names from IDs; v2 stores names directly
  const names = profile?.exclusions?.genreNames
  if (names && names.length > 0) return names

  // Derive from IDs using GENRE_ID_TO_NAME
  const ids = resolveExcludedGenreIds(profile)
  if (ids.size === 0) return []
  const genreMap = getGenreIdToName()
  return [...ids].map(id => genreMap[id]).filter(Boolean)
}

/**
 * Resolve allowed languages. Primary + any language user has watched.
 * @param {Object} profile
 * @returns {string[]|null} null = no restriction
 */
function resolveAllowedLanguages(profile) {
  const primary = profile?.filters?.language_primary
    ?? profile?.languages?.primary
  if (!primary) return null

  // v3: filters.language_primary is set only when >= 80% dominance
  // v2: languages.distributionSorted has all languages
  const sorted = profile?.languages?.distributionSorted || []
  const allLangs = sorted.map(s => s.lang).filter(Boolean)

  // Include primary + any language with >= 1 watch
  const allowed = new Set([primary, ...allLangs])
  return [...allowed]
}

// ============================================================================
// DB-LEVEL EXCLUSION FUNCTIONS
// ============================================================================

/**
 * Apply genre exclusion filters on a Supabase query builder.
 * Uses `.not('genres', 'cs', '["GenreName"]')` for each excluded genre.
 *
 * @param {Object} query - Supabase query builder (chainable)
 * @param {Object|null} profile - user profile (v2 or v3)
 * @returns {Object} the (possibly modified) query builder
 */
export function applyGenreExclusions(query, profile) {
  const names = resolveExcludedGenreNames(profile)
  if (names.length === 0) return query
  for (const name of names) {
    query = query.not('genres', 'cs', JSON.stringify([name]))
  }
  return query
}

/**
 * Apply language filter on a Supabase query builder.
 * Restricts to languages the user has watched.
 *
 * @param {Object} query - Supabase query builder (chainable)
 * @param {Object|null} profile - user profile (v2 or v3)
 * @returns {Object} the (possibly modified) query builder
 */
export function applyLanguageFilter(query, profile) {
  const allowed = resolveAllowedLanguages(profile)
  if (!allowed || allowed.length === 0) return query
  query = query.in('original_language', allowed)
  return query
}

/**
 * Apply content gates (era floor, runtime min, pacing/intensity floor).
 * Only applies when user has >= 10 watches.
 *
 * @param {Object} query - Supabase query builder (chainable)
 * @param {Object|null} profile - user profile (v2 or v3)
 * @returns {Object} the (possibly modified) query builder
 */
export function applyContentGates(query, profile) {
  const totalWatches = profile?.meta?.total_watches
    ?? profile?.qualityProfile?.totalMoviesWatched
    ?? 0
  if (totalWatches < 10) return query

  const eraFloor = profile?.filters?.era_floor
  if (eraFloor != null) {
    query = query.gte('release_year', eraFloor)
  }

  const runtimeBand = profile?.filters?.runtime_band
  if (runtimeBand != null && runtimeBand[0] != null) {
    query = query.gte('runtime', runtimeBand[0])
  }

  // WHY: p20 not p10 — we use the 20th percentile to gate, leaving room for
  // films slightly outside the user's core range.
  const pacing = profile?.content_shape?.pacing
  if (pacing?.p20 != null) {
    // pacing_score_100 is 0-100 scale; p20 is from pacing_score (1-10 scale)
    // Convert: p20 * 10 for 100-scale comparison
    query = query.gte('pacing_score_100', Math.round(pacing.p20 * 10))
  }

  const intensity = profile?.content_shape?.intensity
  if (intensity?.p20 != null) {
    query = query.gte('intensity_score_100', Math.round(intensity.p20 * 10))
  }

  return query
}

/**
 * Exclude community-level high-skip-rate films from a Supabase query.
 *
 * @param {Object} query - Supabase query builder (chainable)
 * @param {Object|null} profile - user profile (v2 or v3)
 * @returns {Object} the (possibly modified) query builder
 */
export function applyCommunitySkipExclusion(query, profile) {
  const skipIds = Array.from(profile?.community?.high_skip_rate_ids || [])
  if (skipIds.length === 0) return query
  query = query.not('id', 'in', `(${skipIds.join(',')})`)
  return query
}

/**
 * Apply all DB-level exclusion layers EXCEPT language.
 * Use for neighbor-language expansion queries where the language filter
 * would defeat the purpose (we're intentionally fetching non-primary languages).
 *
 * @param {Object} query - Supabase query builder (chainable)
 * @param {Object|null} profile - user profile (v2 or v3)
 * @returns {Object} the (possibly modified) query builder
 */
export function applyExclusionsNoLanguage(query, profile) {
  if (!profile) return query
  query = applyGenreExclusions(query, profile)
  query = applyContentGates(query, profile)
  query = applyCommunitySkipExclusion(query, profile)
  return query
}

/**
 * Apply all DB-level exclusion layers in order.
 * Single entry point for most Supabase `.from('movies')` queries.
 *
 * @param {Object} query - Supabase query builder (chainable)
 * @param {Object|null} profile - user profile (v2 or v3)
 * @returns {Object} the (possibly modified) query builder
 */
export function applyAllExclusions(query, profile) {
  if (!profile) return query
  query = applyGenreExclusions(query, profile)
  query = applyLanguageFilter(query, profile)
  query = applyContentGates(query, profile)
  query = applyCommunitySkipExclusion(query, profile)
  return query
}

// ============================================================================
// CLIENT-SIDE EXCLUSION (for RPC results, TMDB fallbacks, etc.)
// ============================================================================

/**
 * Filter candidate array using the same exclusion rules as DB-level,
 * for results that bypass Supabase query builders (embedding RPC, TMDB, etc.).
 *
 * @param {Object[]} candidates - array of movie objects
 * @param {Object|null} profile - user profile (v2 or v3)
 * @returns {Object[]} filtered array
 */
export function filterExclusionsClientSide(candidates, profile) {
  if (!profile || !candidates || candidates.length === 0) return candidates || []

  const excludedGenreIds = resolveExcludedGenreIds(profile)
  const allowedLanguages = resolveAllowedLanguages(profile)
  const allowedLangSet = allowedLanguages ? new Set(allowedLanguages) : null
  const communitySkipIds = profile?.community?.high_skip_rate_ids instanceof Set
    ? profile.community.high_skip_rate_ids
    : new Set(profile?.community?.high_skip_rate_ids || [])
  const personalSkipIds = profile?.negative?.personal_skipped_ids instanceof Set
    ? profile.negative.personal_skipped_ids
    : new Set(profile?.negative?.personal_skipped_ids || [])

  const totalWatches = profile?.meta?.total_watches
    ?? profile?.qualityProfile?.totalMoviesWatched
    ?? 0
  const eraFloor = totalWatches >= 10 ? profile?.filters?.era_floor : null
  const runtimeMin = totalWatches >= 10 ? profile?.filters?.runtime_band?.[0] : null

  return candidates.filter(m => {
    if (!m) return false

    // Genre exclusion — exclude if ANY genre matches (not ALL)
    if (excludedGenreIds.size > 0) {
      const genres = (m.genres || []).map(extractGenreId).filter(Boolean)
      if (genres.length > 0 && genres.some(gid => excludedGenreIds.has(gid))) return false
    }

    // Language filter
    if (allowedLangSet && m.original_language && !allowedLangSet.has(m.original_language)) return false

    // Era floor
    if (eraFloor != null && m.release_year != null && m.release_year < eraFloor) return false

    // Runtime minimum
    if (runtimeMin != null && m.runtime != null && m.runtime < runtimeMin) return false

    // Community high-skip exclusion
    if (communitySkipIds.size > 0 && communitySkipIds.has(m.id)) return false

    // Personal skipped exclusion
    if (personalSkipIds.size > 0 && personalSkipIds.has(m.id)) return false

    return true
  })
}
