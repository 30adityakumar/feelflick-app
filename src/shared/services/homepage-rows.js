// src/shared/services/homepage-rows.js
/**
 * Homepage row service functions.
 * Each function returns scored, deduped film arrays for a specific homepage row.
 *
 * Kept separate from recommendations.js to avoid bloating the core engine.
 */

import { supabase } from '@/shared/lib/supabase/client'
import { recommendationCache } from '@/shared/lib/cache'
import { computeUserProfileV3 } from './recommendations'
import { FIT_ADJACENCY } from './fit-adjacency'
import { applyAllExclusions } from './exclusions'
import { applyQualityFloor, QUALITY_TIERS } from './quality-tiers'
import { scoreMovieV3, precomputeScoringContext } from './scoring-v3'

// === Shared field selection (mirrors TIERED_SELECT_FIELDS in recommendations.js) ===

const ROW_SELECT_FIELDS = `
  id, tmdb_id, title, overview, tagline,
  original_language, runtime, release_year, release_date,
  poster_path, backdrop_path, trailer_youtube_key,
  ff_rating, ff_final_rating, ff_confidence, quality_score, vote_average,
  ff_critic_rating, ff_critic_confidence, ff_audience_rating, ff_audience_confidence,
  ff_community_rating, ff_community_confidence, ff_community_votes,
  ff_rating_genre_normalized,
  pacing_score, intensity_score, emotional_depth_score,
  pacing_score_100, intensity_score_100, emotional_depth_score_100,
  dialogue_density, attention_demand, vfx_level_score,
  cult_status_score, popularity, vote_count, revenue,
  director_name, lead_actor_name,
  genres, keywords, primary_genre,
  discovery_potential, accessibility_score, polarization_score, starpower_score,
  fit_profile, mood_tags, tone_tags,
  user_satisfaction_score, user_satisfaction_confidence
`

// ============================================================================
// HELPERS
// ============================================================================

// Personal match floor — films below this combined score are cut.
// If fewer than MIN_ROW_FILMS survive, the row hides entirely.
const MIN_PERSONAL_SCORE = 60
const MIN_ROW_FILMS = 6

// Genre ID → DB name mapping (subset needed for query-level genre filters).
// The movies.genres column stores names like "Science Fiction", not IDs.
const GENRE_ID_TO_NAME = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
}

/**
 * Score + sort + slice candidates using the v3 7-dimension scoring engine.
 * Enforces personal match floor: films scoring < MIN_PERSONAL_SCORE are dropped.
 * Returns [] if fewer than MIN_ROW_FILMS pass.
 *
 * @param {Object[]} candidates
 * @param {Object|null} profile - v3 profile
 * @param {Object} scoringContext - from precomputeScoringContext
 * @param {string} rowName - for dev logging
 * @param {number} limit
 * @param {Object} [pickReason]
 * @param {string} [rowType] - key from ROW_WEIGHTS (e.g. 'TOP_OF_TASTE', 'MOOD_ROW')
 * @returns {Object[]}
 */
function scoreAndSlice(candidates, profile, scoringContext, rowName, limit, pickReason, rowType) {
  if (!profile || !scoringContext) {
    return candidates.slice(0, limit).map(movie => ({
      ...movie,
      _score: movie.ff_audience_rating || 0,
      _pickReason: pickReason,
    }))
  }

  // Row cooldown: exclude films shown in any row in last 3 days
  const rowCooldown = profile?.negative?.row_cooldown
  if (rowCooldown instanceof Set && rowCooldown.size > 0) {
    candidates = candidates.filter(m => !rowCooldown.has(m.id))
  }

  const scored = candidates.map(movie => {
    const { final, breakdown } = scoreMovieV3(movie, profile, scoringContext, rowType)
    return { ...movie, _score: final, _breakdown: breakdown, _pickReason: pickReason }
  })
  scored.sort((a, b) => b._score - a._score)

  // Personal match floor — cut low-scoring filler
  const qualified = scored.filter(m => m._score >= MIN_PERSONAL_SCORE)
  if (qualified.length < MIN_ROW_FILMS) return []

  const result = qualified.slice(0, limit)

  // Dev-only observability
  if (import.meta.env.DEV && result.length >= 3) {
    console.log(`[score] ${rowName} top3:`, JSON.stringify(result.slice(0, 3).map(m => ({
      title: m.title,
      final: m._score,
      ...m._breakdown,
    })), null, 0))
  }

  return result
}

// ============================================================================
// ROW 2: TOP OF YOUR TASTE
// ============================================================================

/**
 * High-quality films normalized against genre that match user taste.
 * Cold start: falls back to onboarding genres as soft-match bonus.
 *
 * @param {string|null} userId
 * @param {Object|null} profile - pre-resolved profile (or null for cold start)
 * @param {number} [limit=20]
 * @returns {Promise<Object[]>}
 */
export async function getTopOfYourTasteRow(userId, profile, limit = 20, opts = {}) {
  const cacheKey = recommendationCache.key('top_of_taste', userId || 'guest', { limit })

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      const resolvedProfile = profile || (userId ? await computeUserProfileV3(userId) : null)
      const watchedIds = new Set(resolvedProfile?._legacy?.watchedMovieIds || [])

      let query = supabase
        .from('movies')
        .select(ROW_SELECT_FIELDS)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
      query = applyQualityFloor(query, 'SIGNATURE')
      query = applyAllExclusions(query, resolvedProfile)

      const { data, error } = await query
        .order('ff_audience_rating', { ascending: false })
        .limit(limit * 4)

      if (error) throw error

      const candidates = (data || []).filter(m => m?.id && !watchedIds.has(m.id))

      if (import.meta.env.DEV) {
        console.log('[diag] TopOfTaste: candidates=%d, tier=SIGNATURE, no mood filter, ids=%s',
          candidates.length, candidates.slice(0, 10).map(m => m.id).join(','))
      }

      const scoringContext = opts.scoringContext || await precomputeScoringContext(resolvedProfile)

      return scoreAndSlice(candidates, resolvedProfile, scoringContext, 'TopOfTaste', limit, {
        label: 'Top of your taste',
        type: 'top_of_taste',
      }, 'TOP_OF_TASTE')
    } catch (err) {
      console.error('[getTopOfYourTasteRow] failed:', err)
      return []
    }
  })
}

// ============================================================================
// ROW 3A: CRITICS SWOONED. AUDIENCES SHRUGGED.
// ============================================================================

/**
 * Films where critics rated high but audiences rated low.
 * Cold start: no personal filter, just the split.
 *
 * @param {string|null} userId
 * @param {Object|null} profile
 * @param {number} [limit=20]
 * @returns {Promise<Object[]>}
 */
export async function getCriticsSwoonedRow(userId, profile, limit = 20, opts = {}) {
  const cacheKey = recommendationCache.key('critics_swooned', userId || 'guest', { limit })

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      const resolvedProfile = profile || (userId ? await computeUserProfileV3(userId) : null)
      const watchedIds = new Set(resolvedProfile?._legacy?.watchedMovieIds || [])

      let query = supabase
        .from('movies')
        .select(ROW_SELECT_FIELDS)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
      query = applyQualityFloor(query, 'NICHE_CRITICS')
      query = applyAllExclusions(query, resolvedProfile)

      const { data, error } = await query
        .order('ff_critic_rating', { ascending: false })
        .limit(limit * 4)

      if (error) throw error

      let candidates = (data || []).filter(m => m?.id && !watchedIds.has(m.id))

      // Fit-profile adjacency hard gate — only keep films whose fit_profile
      // matches or is adjacent to user's dominant profiles.
      if (resolvedProfile) {
        const topFit = resolvedProfile._legacy?.topFitProfiles || []
        if (topFit.length > 0) {
          const allowedFits = new Set(topFit)
          for (const fp of topFit) {
            for (const adj of (FIT_ADJACENCY[fp]?.close || [])) {
              allowedFits.add(adj)
            }
            for (const adj of (FIT_ADJACENCY[fp]?.far || [])) {
              allowedFits.add(adj)
            }
          }
          candidates = candidates.filter(m =>
            !m.fit_profile || allowedFits.has(m.fit_profile),
          )
        }
      }

      const scoringContext = opts.scoringContext || await precomputeScoringContext(resolvedProfile)
      return scoreAndSlice(candidates, resolvedProfile, scoringContext, 'CriticsSwooned', limit, {
        label: 'Critics swooned. Audiences shrugged.',
        type: 'critics_swooned',
      }, 'CRITICS')
    } catch (err) {
      console.error('[getCriticsSwoonedRow] failed:', err)
      return []
    }
  })
}

// ============================================================================
// ROW 3B: THE PEOPLE'S CHAMPIONS
// ============================================================================

/**
 * Films where audiences rated high but critics rated low (or critics absent).
 * Engaged-only row.
 *
 * @param {string|null} userId
 * @param {Object|null} profile
 * @param {number} [limit=20]
 * @returns {Promise<Object[]>}
 */
export async function getPeoplesChampionsRow(userId, profile, limit = 20, opts = {}) {
  const cacheKey = recommendationCache.key('peoples_champions', userId || 'guest', { limit })

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      const resolvedProfile = profile || (userId ? await computeUserProfileV3(userId) : null)
      const watchedIds = new Set(resolvedProfile?._legacy?.watchedMovieIds || [])

      // Audience loves it (>= 80 with high confidence)
      // Critics missed it (<= 70 where critic data exists, OR critic data is null)
      let query = supabase
        .from('movies')
        .select(ROW_SELECT_FIELDS)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
        .gte('ff_audience_rating', 80)
        .gte('ff_audience_confidence', 70)
        .order('ff_audience_rating', { ascending: false })
        .limit(limit * 5)
      query = applyAllExclusions(query, resolvedProfile)

      const { data, error } = await query

      if (error) throw error

      // Client-side filter: critic <= 70 OR critic is null
      const candidates = (data || []).filter(m => {
        if (!m?.id || watchedIds.has(m.id)) return false
        return m.ff_critic_rating == null || m.ff_critic_rating <= 70
      })

      const scoringContext = opts.scoringContext || await precomputeScoringContext(resolvedProfile)
      return scoreAndSlice(candidates, resolvedProfile, scoringContext, 'PeoplesChampions', limit, {
        label: "The people's champions",
        type: 'peoples_champions',
      }, 'CRITICS')
    } catch (err) {
      console.error('[getPeoplesChampionsRow] failed:', err)
      return []
    }
  })
}

// ============================================================================
// ROW 4: UNDER 90 MINUTES
// ============================================================================

/**
 * Quality films 60-90 minutes. Works for all tiers.
 * Re-implements getQuickWatchesRow with consistent signature.
 *
 * @param {string|null} userId
 * @param {Object|null} profile
 * @param {number} [limit=20]
 * @returns {Promise<Object[]>}
 */
export async function getUnder90MinutesRow(userId, profile, limit = 20, opts = {}) {
  const cacheKey = recommendationCache.key('under_90', userId || 'guest', { limit })

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      const resolvedProfile = profile || (userId ? await computeUserProfileV3(userId) : null)

      // Skip if user has too few watches for meaningful genre signal
      const totalWatched = resolvedProfile?._legacy?.qualityProfile?.totalMoviesWatched || 0
      if (resolvedProfile && totalWatched < 5) return []

      const watchedIds = new Set(resolvedProfile?._legacy?.watchedMovieIds || [])

      let query = supabase
        .from('movies')
        .select(ROW_SELECT_FIELDS)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
      query = applyQualityFloor(query, 'NICHE_UNDER90')
      query = applyAllExclusions(query, resolvedProfile)

      // Genre intersection — only fetch films overlapping user's top genres
      const topGenreNames = (resolvedProfile?._legacy?.genres?.preferred || [])
        .slice(0, 5)
        .map(id => GENRE_ID_TO_NAME[id])
        .filter(Boolean)
      if (topGenreNames.length > 0) {
        const orClauses = topGenreNames.map(name => `genres.cs.${JSON.stringify([name])}`).join(',')
        query = query.or(orClauses)
      }

      const { data, error } = await query
        .order('ff_audience_rating', { ascending: false })
        .limit(limit * 4)

      if (error) throw error

      const candidates = (data || []).filter(m => m?.id && !watchedIds.has(m.id))

      const scoringContext = opts.scoringContext || await precomputeScoringContext(resolvedProfile)
      return scoreAndSlice(candidates, resolvedProfile, scoringContext, 'Under90', limit, {
        label: 'Under 90 minutes',
        type: 'under_90',
      }, 'UNDER90')
    } catch (err) {
      console.error('[getUnder90MinutesRow] failed:', err)
      return []
    }
  })
}

// ============================================================================
// ROW 5: STILL IN {SEED}'S ORBIT
// ============================================================================

/**
 * Embedding-similarity row seeded by user's highest-rated film.
 * Returns { films, seed } — seed is null if no qualifying seed found.
 *
 * @param {string|null} userId
 * @param {Object|null} profile
 * @param {number} [limit=20]
 * @returns {Promise<{ films: Object[], seed: { id: number, title: string }|null }>}
 */
export async function getStillInOrbitRow(userId, profile, limit = 20, opts = {}) {
  const cacheKey = recommendationCache.key('still_in_orbit', userId || 'guest', { limit })

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      if (!userId) return { films: [], seed: null }

      const resolvedProfile = profile || await computeUserProfileV3(userId)
      const watchedIds = resolvedProfile?._legacy?.watchedMovieIds || []

      // 1. Find best seed: highest user rating (>= 8/10)
      const { data: ratings, error: ratingsError } = await supabase
        .from('user_ratings')
        .select('movie_id, rating, rated_at, movies!inner(id, title)')
        .eq('user_id', userId)
        .gte('rating', 8)
        .order('rating', { ascending: false })
        .order('rated_at', { ascending: false })
        .limit(5)

      if (ratingsError) {
        console.warn('[getStillInOrbitRow] ratings query error:', ratingsError)
      }

      let seed = null
      if (ratings?.length > 0) {
        const r = ratings[0]
        seed = { id: r.movies.id, title: r.movies.title }
      }

      if (!seed) return { films: [], seed: null }

      // 2. Embedding similarity via RPC
      const { data: matches, error: rpcErr } = await supabase
        .rpc('get_seed_neighbors', {
          seed_ids: [seed.id],
          exclude_ids: watchedIds,
          top_n: limit + 10,
          min_ff_rating: QUALITY_TIERS.CONTEXT.ff_audience_rating_min,
        })

      if (rpcErr) throw rpcErr
      // Strict: no embedding matches → don't show the row at all (never fall back to generic)
      if (!matches || matches.length === 0) return { films: [], seed: null }

      // 3. Client-side genre exclusion for RPC results (can't use DB-level for RPCs)
      const excludedNames = new Set(resolvedProfile?._legacy?.exclusions?.genreNames || [])
      const filtered = excludedNames.size > 0
        ? matches.filter(m => {
          const genres = Array.isArray(m.genres) ? m.genres : []
          if (genres.length === 0) return true
          return !genres.some(g => excludedNames.has(typeof g === 'string' ? g : g?.name || ''))
        })
        : matches
      if (filtered.length === 0) return { films: [], seed: null }

      // 4. RPC doesn't return mood_tags, tone_tags, fit_profile, *_score_100.
      //    Fetch these scoring fields in a secondary query and merge.
      const orbitIds = filtered.map(m => m.id)
      const { data: scoringMeta } = await supabase
        .from('movies')
        .select('id, mood_tags, tone_tags, fit_profile, pacing_score_100, intensity_score_100, emotional_depth_score_100')
        .in('id', orbitIds)
      const metaById = new Map((scoringMeta || []).map(m => [m.id, m]))
      const enriched = filtered.map(m => {
        const meta = metaById.get(m.id)
        return meta ? { ...m, ...meta } : m
      })

      const scoringContext = opts.scoringContext || await precomputeScoringContext(resolvedProfile)
      const scored = enriched.map(movie => {
        const similarity = movie.similarity || 0
        const { final, breakdown } = scoreMovieV3(movie, resolvedProfile, scoringContext, 'ORBIT')
        const combinedScore = 0.6 * final + 0.4 * (similarity * 100)
        return {
          ...movie,
          _score: combinedScore,
          _breakdown: breakdown,
          _embeddingSimilarity: similarity,
          _pickReason: { label: `Still in ${seed.title}'s orbit`, type: 'still_in_orbit', seedTitle: seed.title },
        }
      })

      scored.sort((a, b) => b._score - a._score)

      const result = scored.slice(0, limit)
      if (import.meta.env.DEV && result.length >= 3) {
        console.log('[score] Orbit top3:', JSON.stringify(result.slice(0, 3).map(m => ({
          title: m.title,
          final: m._score,
          ...m._breakdown,
        })), null, 0))
      }

      return { films: result, seed }
    } catch (err) {
      console.error('[getStillInOrbitRow] failed:', err)
      return { films: [], seed: null }
    }
  })
}

// ============================================================================
// ROW 6: YOU'VE BEEN IN A {MOOD} MOOD
// ============================================================================

/**
 * Films matching user's dominant recent mood tag.
 * Returns { films, dominantMood } — null mood if signature is empty.
 *
 * @param {string|null} userId
 * @param {Object|null} profile
 * @param {number} [limit=20]
 * @returns {Promise<{ films: Object[], dominantMood: string|null }>}
 */
export async function getMoodRow(userId, profile, limit = 20, opts = {}) {
  const cacheKey = recommendationCache.key('mood_row', userId || 'guest', { limit })

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      if (!userId) return { films: [], dominantMood: null }

      const resolvedProfile = profile || await computeUserProfileV3(userId)

      // V3 mood_tags are rating-weighted; legacy recentMoodTags are recency-weighted.
      // Prefer v3 as primary source, fall back to legacy.
      const v3MoodTags = resolvedProfile?.affinity?.mood_tags || []
      const legacyMoodTags = resolvedProfile?._legacy?.moodSignature?.recentMoodTags || []
      const recentTags = v3MoodTags.length > 0 ? v3MoodTags : legacyMoodTags

      if (recentTags.length === 0) return { films: [], dominantMood: null }

      const dominantMood = recentTags[0].tag
      const watchedIds = new Set(resolvedProfile?._legacy?.watchedMovieIds || [])

      if (import.meta.env.DEV) {
        console.log('[diag] MoodRow: v3MoodTags=%d, legacyMoodTags=%d, dominantMood=%s, source=%s',
          v3MoodTags.length, legacyMoodTags.length, dominantMood,
          v3MoodTags.length > 0 ? 'v3' : 'legacy')
        console.log('[diag] MoodRow: all v3 tags=%s', v3MoodTags.map(t => `${t.tag}(${t.count})`).join(', '))
      }

      // Fetch films with mood_tags overlapping dominantMood
      let query = supabase
        .from('movies')
        .select(ROW_SELECT_FIELDS)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
        .contains('mood_tags', [dominantMood])
      query = applyQualityFloor(query, 'CONTEXT')
      query = applyAllExclusions(query, resolvedProfile)

      const { data, error } = await query
        .order('ff_audience_rating', { ascending: false })
        .limit(limit * 4)

      if (error) throw error

      const candidates = (data || []).filter(m => m?.id && !watchedIds.has(m.id))

      if (import.meta.env.DEV) {
        console.log('[diag] MoodRow: candidates=%d, tier=CONTEXT, filter=contains(mood_tags,[%s]), ids=%s',
          candidates.length, dominantMood, candidates.slice(0, 10).map(m => m.id).join(','))
      }

      const scoringContext = opts.scoringContext || await precomputeScoringContext(resolvedProfile)
      const films = scoreAndSlice(candidates, resolvedProfile, scoringContext, 'MoodRow', limit, {
        label: `You've been in a ${dominantMood} mood`,
        type: 'mood_row',
      }, 'MOOD_ROW')

      return { films, dominantMood }
    } catch (err) {
      console.error('[getMoodRow] failed:', err)
      return { films: [], dominantMood: null }
    }
  })
}

// ============================================================================
// ROW 7: STILL ON YOUR WATCHLIST
// ============================================================================

/**
 * Watchlist items added >= 14 days ago that haven't been watched.
 * Returns { films } — empty if <3 qualifying items (not worth showing).
 *
 * @param {string|null} userId
 * @param {Object|null} profile
 * @param {number} [limit=20]
 * @returns {Promise<{ films: Object[] }>}
 */
export async function getWatchlistRow(userId, profile, limit = 20, opts = {}) {
  const cacheKey = recommendationCache.key('watchlist_row', userId || 'guest', { limit })

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      if (!userId) return { films: [] }

      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

      const { data, error } = await supabase
        .from('user_watchlist')
        .select(`
          movie_id, added_at, status,
          movies!inner (${ROW_SELECT_FIELDS})
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .lte('added_at', fourteenDaysAgo)
        .order('added_at', { ascending: false })
        .limit(limit * 2)

      if (error) throw error
      if (!data || data.length < 3) return { films: [] }

      const resolvedProfile = profile || await computeUserProfileV3(userId)

      // Flatten and score
      const candidates = data
        .filter(w => w.movies?.id)
        .map(w => w.movies)

      const scoringContext = opts.scoringContext || await precomputeScoringContext(resolvedProfile)
      const films = scoreAndSlice(candidates, resolvedProfile, scoringContext, 'Watchlist', limit, {
        label: 'Still on your watchlist',
        type: 'watchlist_row',
      }, 'TOP_OF_TASTE')

      return { films }
    } catch (err) {
      console.error('[getWatchlistRow] failed:', err)
      return { films: [] }
    }
  })
}

// ============================================================================
// ROW 8: MORE FROM {DIRECTOR} (warming+)
// ============================================================================

/**
 * Signature director row — shown when a director accounts for >= 15% of watch
 * history AND the user has watched >= 3 of their films.
 *
 * Returns { films, director } — null director if threshold not met.
 *
 * @param {string|null} userId
 * @param {Object|null} profile
 * @param {number} [limit=20]
 * @returns {Promise<{ films: Object[], director: string|null }>}
 */
export async function getSignatureDirectorRow(userId, profile, limit = 20, opts = {}) {
  const cacheKey = recommendationCache.key('signature_director', userId || 'guest', { limit })

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      if (!userId) return { films: [], director: null }

      const resolvedProfile = profile || await computeUserProfileV3(userId)
      const directors = resolvedProfile?._legacy?.affinities?.directors || []
      const totalWatched = resolvedProfile?._legacy?.qualityProfile?.totalMoviesWatched || 0

      if (directors.length === 0 || totalWatched === 0) return { films: [], director: null }

      // Find director with >= 3 watches AND >= 15% of history
      const topDirector = directors.find(d => {
        const rawCount = d.rawCount || d.count || 0
        return rawCount >= 3 && (rawCount / totalWatched) >= 0.15
      })

      if (!topDirector) return { films: [], director: null }

      const watchedIds = new Set(resolvedProfile?._legacy?.watchedMovieIds || [])

      let query = supabase
        .from('movies')
        .select(ROW_SELECT_FIELDS)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
        .ilike('director_name', topDirector.name)
      query = applyQualityFloor(query, 'CONTEXT')
      query = applyAllExclusions(query, resolvedProfile)

      const { data, error } = await query
        .order('ff_audience_rating', { ascending: false })
        .limit(limit * 2)

      if (error) throw error

      const candidates = (data || []).filter(m => m?.id && !watchedIds.has(m.id))

      if (candidates.length === 0) return { films: [], director: null }

      const scoringContext = opts.scoringContext || await precomputeScoringContext(resolvedProfile)
      const films = scoreAndSlice(candidates, resolvedProfile, scoringContext, 'Director', limit, {
        label: `More from ${topDirector.name}`,
        type: 'signature_director',
        directorName: topDirector.name,
      }, 'DIRECTOR')

      return { films, director: topDirector.name }
    } catch (err) {
      console.error('[getSignatureDirectorRow] failed:', err)
      return { films: [], director: null }
    }
  })
}
