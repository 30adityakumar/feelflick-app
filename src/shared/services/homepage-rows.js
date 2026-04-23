// src/shared/services/homepage-rows.js
/**
 * Homepage row service functions.
 * Each function returns scored, deduped film arrays for a specific homepage row.
 *
 * Kept separate from recommendations.js to avoid bloating the core engine.
 */

import { supabase } from '@/shared/lib/supabase/client'
import { recommendationCache } from '@/shared/lib/cache'
import { computeUserProfileV3, getNeighborLanguages } from './recommendations'
import { FIT_ADJACENCY } from './fit-adjacency'
import { applyAllExclusions, applyExclusionsNoLanguage } from './exclusions'
import { applyQualityFloor, QUALITY_TIERS } from './quality-tiers'
import { scoreMovieV3, precomputeScoringContext } from './scoring-v3'
import { diversifyRow, dayHashIndex } from './diversity'
import { generateHeroReason } from './hero-reason'
import { topOfTasteSubtitle, moodRowTitle, moodRowSubtitle } from './row-subtitles'

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
function scoreAndSlice(candidates, profile, scoringContext, rowName, limit, pickReason, rowType, { skipDiversity = false, minFilms = MIN_ROW_FILMS, nonce = 0 } = {}) {
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
  let qualified = scored.filter(m => m._score >= MIN_PERSONAL_SCORE)
  if (qualified.length < minFilms) return []

  // Nonce-based pool rotation for shuffle: shift the starting point in the scored
  // pool so diversifyRow picks a different set of films on each shuffle.
  // WHY: without rotation, cache-bust alone returns identical top-scored films.
  if (nonce > 0 && qualified.length > limit) {
    const skip = (nonce * Math.ceil(limit / 2)) % Math.max(1, Math.floor(qualified.length / 2))
    qualified = [...qualified.slice(skip), ...qualified.slice(0, skip)]
  }

  // Within-row diversity (exempted for director/watchlist rows)
  const result = skipDiversity
    ? qualified.slice(0, limit)
    : diversifyRow(qualified, limit)

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
  const { nonce = 0 } = opts
  const cacheKey = recommendationCache.key('top_of_taste', userId || 'guest', { limit, nonce })

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

      let candidates = (data || []).filter(m => m?.id && !watchedIds.has(m.id))

      // === LANGUAGE LADDER EXPANSION ===
      // If primary candidates are thin (exhausted catalog), expand to neighbour
      // languages. Uses applyExclusionsNoLanguage intentionally — applying the
      // user's language guard here would defeat the purpose.
      const primaryLang =
        resolvedProfile?.filters?.language_primary ||
        resolvedProfile?._legacy?.languages?.primary ||
        null
      if (candidates.length < 15 && primaryLang && primaryLang !== 'en') {
        const neighborLangs = getNeighborLanguages(primaryLang)
        if (neighborLangs.length > 0) {
          const existingIds = new Set(candidates.map(m => m.id))
          let expandQuery = supabase
            .from('movies')
            .select(ROW_SELECT_FIELDS)
            .eq('is_valid', true)
            .not('poster_path', 'is', null)
            .in('original_language', neighborLangs)
          expandQuery = applyQualityFloor(expandQuery, 'NEIGHBOR')
          expandQuery = applyExclusionsNoLanguage(expandQuery, resolvedProfile)
          const { data: neighborData } = await expandQuery
            .order('ff_audience_rating', { ascending: false })
            .limit(limit * 4)
          const neighborFresh = (neighborData || []).filter(m =>
            m?.id && !watchedIds.has(m.id) && !existingIds.has(m.id)
          )
          neighborFresh.forEach(m => { m._viaNeighborLadder = true })
          candidates.push(...neighborFresh)

          if (import.meta.env.DEV) {
            console.log('[top-of-taste-diag] neighbor expansion:', {
              primaryLang, neighborLangs,
              primaryCount: existingIds.size,
              neighborRaw: neighborData?.length ?? 0,
              neighborFresh: neighborFresh.length,
              totalAfter: candidates.length,
            })
          }
        }
      }

      // === GLOBAL FALLBACK TIER ===
      // If neighbor expansion still left us short (< 4 candidates), cast a wider
      // net: all languages, SIGNATURE quality, genre/community exclusions only.
      // This rescues users who have exhausted both primary AND neighbour catalogs.
      if (candidates.length < 4 && primaryLang) {
        const existingIds = new Set(candidates.map(m => m.id))
        let globalQuery = supabase
          .from('movies')
          .select(ROW_SELECT_FIELDS)
          .eq('is_valid', true)
          .not('poster_path', 'is', null)
        globalQuery = applyQualityFloor(globalQuery, 'SIGNATURE')
        globalQuery = applyExclusionsNoLanguage(globalQuery, resolvedProfile)
        const { data: globalData } = await globalQuery
          .order('ff_audience_rating', { ascending: false })
          .limit(limit * 4)
        const globalFresh = (globalData || []).filter(m =>
          m?.id && !watchedIds.has(m.id) && !existingIds.has(m.id)
        )
        globalFresh.forEach(m => { m._viaNeighborLadder = true; m._languageTier = 'global' })
        candidates.push(...globalFresh)
        if (import.meta.env.DEV) {
          console.log('[top-of-taste-diag] global fallback: +', globalFresh.length, 'total:', candidates.length)
        }
      }

      if (import.meta.env.DEV) {
        console.log('[diag] TopOfTaste: candidates=%d, tier=SIGNATURE, no mood filter, ids=%s',
          candidates.length, candidates.slice(0, 10).map(m => m.id).join(','))
      }

      const scoringContext = opts.scoringContext || await precomputeScoringContext(resolvedProfile)

      const films = scoreAndSlice(candidates, resolvedProfile, scoringContext, 'TopOfTaste', limit, {
        label: 'Top of your taste',
        type: 'top_of_taste',
      }, 'TOP_OF_TASTE', { minFilms: 4, nonce })

      // Attach per-film reason from dominant scoring dimension
      for (const film of films) {
        film._reason = generateHeroReason(
          film, film._breakdown, resolvedProfile, scoringContext.seedNeighborMap,
        )
      }

      const subtitle = topOfTasteSubtitle(resolvedProfile)
      return { films, subtitle }
    } catch (err) {
      console.error('[getTopOfYourTasteRow] failed:', err)
      return { films: [], subtitle: null }
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
  const { nonce = 0 } = opts
  const cacheKey = recommendationCache.key('critics_swooned', userId || 'guest', { limit, nonce })

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
      }, 'CRITICS', { nonce })
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
  const { nonce = 0 } = opts
  const cacheKey = recommendationCache.key('peoples_champions', userId || 'guest', { limit, nonce })

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
      }, 'CRITICS', { nonce })
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
  const { nonce = 0 } = opts
  const cacheKey = recommendationCache.key('under_90', userId || 'guest', { limit, nonce })

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
      }, 'UNDER90', { nonce })
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
  const { nonce = 0 } = opts
  const cacheKey = recommendationCache.key('still_in_orbit', userId || 'guest', { limit, nonce })

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

      // Nonce-based pool rotation: shift starting point so shuffle returns different films.
      const orbitPool = nonce > 0 && scored.length > limit
        ? (() => { const skip = (nonce * Math.ceil(limit / 2)) % Math.max(1, Math.floor(scored.length / 2)); return [...scored.slice(skip), ...scored.slice(0, skip)] })()
        : scored
      const result = orbitPool.slice(0, limit)
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
 * Films matching user's top mood/tone tags (top-3 overlap).
 * Returns { films, title, subtitle, lead, kind }.
 *
 * @param {string|null} userId
 * @param {Object|null} profile
 * @param {number} [limit=20]
 * @returns {Promise<{ films: Object[], title: string, subtitle: string|null, lead: string|null, kind: string }>}
 */
export async function getMoodRow(userId, profile, limit = 20, opts = {}) {
  const { nonce = 0 } = opts
  const empty = { films: [], title: 'Films for your mood', subtitle: null, lead: null, kind: 'mood' }
  const cacheKey = recommendationCache.key('mood_row', userId || 'guest', { limit, nonce })

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      if (!userId) return empty

      const resolvedProfile = profile || await computeUserProfileV3(userId)

      // V3 mood_tags are rating-weighted; legacy recentMoodTags are recency-weighted.
      const v3MoodTags = resolvedProfile?.affinity?.mood_tags || []
      const legacyMoodTags = resolvedProfile?._legacy?.moodSignature?.recentMoodTags || []
      const recentTags = v3MoodTags.length > 0 ? v3MoodTags : legacyMoodTags

      if (recentTags.length === 0) return empty

      const topMoodTags = recentTags.slice(0, 3).map(m => m.tag)
      const watchedIds = new Set(resolvedProfile?._legacy?.watchedMovieIds || [])

      if (import.meta.env.DEV) {
        console.log('[diag] MoodRow: topMoodTags=%s, source=%s',
          topMoodTags.join(','), v3MoodTags.length > 0 ? 'v3' : 'legacy')
      }

      // Fetch films with mood_tags overlapping any of top-3 tags
      let query = supabase
        .from('movies')
        .select(ROW_SELECT_FIELDS)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
        .overlaps('mood_tags', topMoodTags)
      query = applyQualityFloor(query, 'CONTEXT')
      query = applyAllExclusions(query, resolvedProfile)

      const { data, error } = await query
        .order('ff_audience_rating', { ascending: false })
        .limit(limit * 4)

      if (error) throw error

      const candidates = (data || []).filter(m => m?.id && !watchedIds.has(m.id))

      const scoringContext = opts.scoringContext || await precomputeScoringContext(resolvedProfile)
      const films = scoreAndSlice(candidates, resolvedProfile, scoringContext, 'MoodRow', limit, {
        label: topMoodTags[0] ? `Films that feel ${topMoodTags[0]}` : 'Films for your mood',
        type: 'mood_row',
      }, 'MOOD_ROW', { nonce })

      // Boost multi-tag matches
      for (const f of films) {
        const overlap = (f.mood_tags || []).filter(t => topMoodTags.includes(t)).length
        if (overlap >= 2) f._score = Math.min(100, f._score + 5)
      }
      films.sort((a, b) => b._score - a._score)

      // Attach per-film reasons
      for (const f of films) {
        f._reason = generateHeroReason(f, f._breakdown, resolvedProfile, scoringContext.seedNeighborMap)
      }

      const { title, lead, kind } = moodRowTitle(resolvedProfile)
      return {
        films,
        title,
        subtitle: moodRowSubtitle(resolvedProfile),
        lead,
        kind,
      }
    } catch (err) {
      console.error('[getMoodRow] failed:', err)
      return empty
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
  const { nonce = 0 } = opts
  const cacheKey = recommendationCache.key('watchlist_row', userId || 'guest', { limit, nonce })

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
      }, 'TOP_OF_TASTE', { skipDiversity: true })

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
 * Signature director row — shown when user has qualified directors
 * (count >= 3 OR count >= 2 with a rating >= 8).
 *
 * Day-hash rotates across qualified directors so different days surface
 * different filmographies.
 *
 * Returns { films, director: { name, profile_path, id }, subtitle }.
 *
 * @param {string|null} userId
 * @param {Object|null} profile
 * @param {number} [limit=20]
 * @returns {Promise<{ films: Object[], director: { name: string, profile_path: string|null, id: number|null }|null, subtitle: string|null }>}
 */
export async function getSignatureDirectorRow(userId, profile, limit = 20, opts = {}) {
  const { nonce = 0 } = opts
  const cacheKey = recommendationCache.key('signature_director', userId || 'guest', { limit, nonce })

  return recommendationCache.getOrFetch(cacheKey, async () => {
    try {
      if (!userId) return { films: [], director: null, subtitle: null }

      const resolvedProfile = profile || await computeUserProfileV3(userId)
      const directors = resolvedProfile?.affinity?.directors || []

      if (directors.length === 0) return { films: [], director: null, subtitle: null }

      // Day-hash rotation across all qualified directors; perturbed by nonce for shuffle.
      const _dirRawIdx = dayHashIndex(userId + 'director', directors.length)
      const idx = nonce > 0 && directors.length > 1
        ? (_dirRawIdx + nonce * 7901) % directors.length
        : _dirRawIdx
      const chosenDirector = directors[idx]
      const directorName = chosenDirector.name

      // Fetch person record for photo
      const { data: person } = await supabase
        .from('people')
        .select('id, name, profile_path')
        .ilike('name', directorName)
        .limit(1)
        .single()

      // Fetch director's films — tag watched, filter after scoring
      const watchedIds = resolvedProfile?.watched_ids
        || new Set(resolvedProfile?._legacy?.watchedMovieIds || [])

      let query = supabase
        .from('movies')
        .select(ROW_SELECT_FIELDS)
        .eq('is_valid', true)
        .not('poster_path', 'is', null)
        .ilike('director_name', directorName)
      query = applyQualityFloor(query, 'CONTEXT')
      query = applyAllExclusions(query, resolvedProfile)

      const { data, error } = await query
        .order('ff_audience_rating', { ascending: false })
        .limit(limit * 2)

      if (error) throw error

      const candidates = (data || []).filter(m => m?.id)

      if (candidates.length === 0) return { films: [], director: null, subtitle: null }

      // Tag watched films with _seen
      candidates.forEach(c => {
        c._seen = watchedIds.has(c.id)
      })

      const scoringContext = opts.scoringContext || await precomputeScoringContext(resolvedProfile)
      const scored = scoreAndSlice(candidates, resolvedProfile, scoringContext, 'Director', limit, {
        label: `More from ${directorName}`,
        type: 'signature_director',
        directorName,
      }, 'DIRECTOR', { skipDiversity: true, nonce })

      // Filter out seen films — a director row with <4 unwatched looks broken
      const films = scored.filter(f => !f._seen)
      if (films.length < 4) return { films: [], director: null, subtitle: null }

      // Build "why this director" subtitle
      let subtitle = `You've watched ${chosenDirector.count} of their films`
      if (chosenDirector.avg_rating != null && chosenDirector.avg_rating >= 8) {
        subtitle = `${subtitle} — averaging ${chosenDirector.avg_rating.toFixed(1)}/10`
      }

      return {
        films,
        director: {
          name: directorName,
          profile_path: person?.profile_path || null,
          id: person?.id || null,
        },
        subtitle,
      }
    } catch (err) {
      console.error('[getSignatureDirectorRow] failed:', err)
      return { films: [], director: null, subtitle: null }
    }
  })
}

// ============================================================================
// DAILY SLOT ROTATION
// ============================================================================

/**
 * Get homepage row order with daily slot rotation.
 * Slot 3 rotates between critics_swooned / peoples_champions.
 * Slot 7 rotates between under_90 / signature_director.
 *
 * @param {string} userId
 * @returns {string[]}
 */
export function getHomepageRowOrder(userId) {
  const slot3 = dayHashIndex(userId, 2) === 0 ? 'critics_swooned' : 'peoples_champions'
  const slot7 = dayHashIndex(userId + 'slot7', 2) === 0 ? 'under_90' : 'signature_director'
  return ['top_of_taste', 'signature_director', slot3, 'mood_row', 'orbit', slot7, 'watchlist']
}
