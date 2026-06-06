// src/features/onboarding/suggestionPool.js
// Onboarding Step 3 suggestion-pool ENGINE — the Supabase candidate fetch +
// quality/mood/genre/discovery/recency/popularity scoring that seeds a new
// user's Cinematic DNA. Extracted verbatim from MoviesStep.jsx (F2.3) so the
// recommendation-adjacent logic lives apart from the step's presentation.
//
// OFF-LIMITS to retune in a UI pass: the scoring values, query filters, and the
// ONBOARDING_MOOD_TO_TAGS bridge here are byte-identical to the originals and are
// recommendation-engine territory (gated by the recommendation-engine skill +
// DB-first analysis). This is a behavior-preserving move only.
import { supabase } from '@/shared/lib/supabase/client'
import { GENRES } from './data'

export const MIN_MOVIES = 5
const POOL_SIZE = 30
// How many candidates to pull per query branch (genre + mood). Higher = more
// variety in the final scored pool. ~80 per branch lands in ~150 distinct
// candidates after dedup, then we score and trim to POOL_SIZE.
const CANDIDATE_LIMIT = 80

const GENRE_DB_NAME = Object.fromEntries(GENRES.map(g => [g.id, g.dbName]))

// Bridge from onboarding's 6-key mood vocabulary (cozy/wired/tender/fun/tense/
// mythic — see [data.js](../data.js)) to the `mood_tags` strings the catalog
// actually uses. Derived from observed tag frequencies in the live DB.
// Distinct from useHomeData's ONBOARDING_MOOD_TO_BRIEFING → MOOD_BRIDGE chain
// (which targets 6-key Briefing display categories); here we map directly to
// the catalog vocabulary because we're scoring films, not picking display rows.
// Bridge expansion (2026-05-21 audit): folded in unmapped high-frequency
// catalog tags so onboarding moods cover ~5,000 more films without changing
// the 6-mood UI:
//   tender ← melancholic, somber, devastating  ("sad in a good way" register)
//   tense  ← gritty                            (harsh realism)
//   fun    ← empowering                        (uplift through triumph)
//   wired  ← dreamy                            (mind-altering atmosphere)
const ONBOARDING_MOOD_TO_TAGS = {
  cozy:   ['cozy', 'heartwarming', 'lighthearted', 'whimsical'],
  wired:  ['mind-bending', 'contemplative', 'provocative', 'mysterious', 'dreamy'],
  tender: ['tender', 'romantic', 'bittersweet', 'melancholic', 'somber', 'devastating'],
  fun:    ['playful', 'lighthearted', 'whimsical', 'uplifting', 'exhilarating', 'empowering'],
  tense:  ['tense', 'suspenseful', 'intense', 'thrilling', 'unsettling', 'dark', 'gritty'],
  mythic: ['exhilarating', 'haunting', 'inspiring', 'nostalgic'],
}

// Columns pulled from the `movies` table. Includes scoring inputs (mood_tags,
// discovery_potential, collection_id, popularity) on top of the display fields.
const POOL_SELECT = 'id, tmdb_id, title, poster_path, release_date, release_year, primary_genre, mood_tags, ff_audience_rating, discovery_potential, collection_id, popularity'

// Recency: audience is millennial + Gen Z. Films before RECENCY_FLOOR_YEAR are
// hard-filtered from the candidate queries (they're cultural artifacts the
// audience is unlikely to have seen, and surfacing them as "what have you
// loved?" choices misleads the engine). Films from RECENCY_FLOOR_YEAR onward
// get a linear penalty that decays from RECENCY_MAX_PENALTY at the floor year
// down to 0 at the current year — so a 1990 film sits well below a 2024 film
// of equivalent rating, but quality still ultimately decides.
const RECENCY_FLOOR_YEAR = 1990
const RECENCY_MAX_PENALTY = 20

// Niche genres that require explicit user selection before surfacing. Mirrors
// recommendations.js GATED_GENRES (recommendations.js:1416). A film whose
// primary_genre falls in this set is excluded from the suggestion pool unless
// the user explicitly picked that genre in Step 2 — otherwise the pool would
// surface animation/documentaries to users who didn't signal interest, biasing
// their cold-start profile.
const GATED_PRIMARY_GENRES = new Set(['Animation', 'Family', 'Documentary', 'Horror'])

// Popularity boost — log-scale, capped. TMDB popularity is right-tailed
// (p50≈2, p99≈32, max≈690 in our catalog) so a raw multiplier would let
// spikes dominate. Log-scale gives a bounded, smooth lift that nudges
// recognisable films up without drowning out the audience-rating signal.
// pop=10 → +5.2, pop=100 → +10.0, pop=500+ → capped at 12.
const POPULARITY_MAX_BOOST = 12
const POPULARITY_COEFFICIENT = 5

// === DATA FETCHING ===

/**
 * Build the suggestion pool from the user's onboarding picks.
 *
 * Two parallel candidate fetches (by genre + by mood overlap), merged client-
 * side, then scored on quality + mood overlap + primary-genre match + a small
 * discovery lift, with a collection-dedup penalty so The Godfather Pt I and
 * Pt II don't sit back-to-back.
 *
 * @param {number[]} genreIds  — TMDB genre IDs selected in Step 2
 * @param {string[]} moods     — onboarding mood keys selected in Step 1
 * @returns {Promise<object[]>}  — POOL_SIZE shaped film objects
 */
export async function fetchSuggestionPool(genreIds, moods) {
  const dbNames = (genreIds || []).map(id => GENRE_DB_NAME[id]).filter(Boolean)
  const tagSet = (moods || []).flatMap(k => ONBOARDING_MOOD_TO_TAGS[k] || [])

  // Defensive fallbacks — Step 1 enforces ≥1 mood and Step 2 enforces ≥1
  // genre, but if either array is empty we still want a sane pool.
  if (!dbNames.length && !tagSet.length) return fetchGlobalPool()

  const queries = []
  if (dbNames.length > 0) {
    queries.push(
      supabase
        .from('movies')
        .select(POOL_SELECT)
        .in('primary_genre', dbNames)
        .gte('release_year', RECENCY_FLOOR_YEAR)
        .not('poster_path', 'is', null)
        .eq('is_valid', true)
        .gte('ff_audience_confidence', 50)
        .order('ff_audience_rating', { ascending: false, nullsFirst: false })
        .limit(CANDIDATE_LIMIT),
    )
  }
  if (tagSet.length > 0) {
    queries.push(
      supabase
        .from('movies')
        .select(POOL_SELECT)
        .overlaps('mood_tags', tagSet)
        .gte('release_year', RECENCY_FLOOR_YEAR)
        .not('poster_path', 'is', null)
        .eq('is_valid', true)
        .gte('ff_audience_confidence', 50)
        .order('ff_audience_rating', { ascending: false, nullsFirst: false })
        .limit(CANDIDATE_LIMIT),
    )
  }

  const results = await Promise.all(queries)
  const merged = mergeUnique(results.map(r => r.data || []))

  // Apply gated-genre filter: drop films whose primary_genre is in the
  // niche-genre set unless the user explicitly picked that genre. This is
  // applied client-side because the by-genre branch is already naturally
  // gated (`.in('primary_genre', dbNames)`), and we only need to scrub the
  // by-mood branch's leaks here.
  const userDbNameSet = new Set(dbNames)
  const blockedGenres = new Set(
    [...GATED_PRIMARY_GENRES].filter(g => !userDbNameSet.has(g))
  )
  const candidates = blockedGenres.size > 0
    ? merged.filter(m => !m.primary_genre || !blockedGenres.has(m.primary_genre))
    : merged

  const scored = scoreCandidates(candidates, { dbNames, tagSet })
  return dedupByCollection(scored).slice(0, POOL_SIZE).map(shapeFilm)
}

/**
 * Fallback when neither moods nor genres are present (shouldn't happen via
 * the UI, defensive).
 */
async function fetchGlobalPool() {
  const { data } = await supabase
    .from('movies')
    .select(POOL_SELECT)
    .gte('release_year', RECENCY_FLOOR_YEAR)
    .not('ff_audience_rating', 'is', null)
    .not('poster_path', 'is', null)
    .eq('is_valid', true)
    .order('ff_audience_rating', { ascending: false })
    .limit(POOL_SIZE)

  return (data || []).map(shapeFilm)
}

/** Shape a DB row into the {id, internalId, ...} format the picker UI expects. */
export function shapeFilm(m) {
  return {
    id: m.tmdb_id,
    internalId: m.id,
    title: m.title,
    poster_path: m.poster_path,
    release_date: m.release_date,
  }
}

/** Merge multiple candidate arrays, deduping by tmdb_id, preserving first occurrence. */
export function mergeUnique(arrays) {
  const seen = new Set()
  const out = []
  for (const arr of arrays) {
    for (const m of arr) {
      if (!m?.tmdb_id || seen.has(m.tmdb_id)) continue
      seen.add(m.tmdb_id)
      out.push(m)
    }
  }
  return out
}

/**
 * Score each candidate film. Higher is better. See the suggestion-engine plan
 * for the formula rationale.
 */
export function scoreCandidates(candidates, { dbNames, tagSet }) {
  const dbNameSet = new Set(dbNames)
  const tagSetLower = new Set(tagSet)
  // Linear recency ramp: max penalty at RECENCY_FLOOR_YEAR, decays to 0 by the
  // current year. Films older than the floor are already hard-filtered out of
  // the candidate queries; this only differentiates 1990s/2000s/2010s/2020s
  // films within the surviving pool.
  const currentYear = new Date().getFullYear()
  const yearSpan = Math.max(1, currentYear - RECENCY_FLOOR_YEAR)
  return candidates
    .map(m => {
      const base = m.ff_audience_rating ?? 50
      const moodOverlap = Array.isArray(m.mood_tags)
        ? m.mood_tags.reduce((n, t) => n + (tagSetLower.has(t) ? 1 : 0), 0)
        : 0
      const genreBonus = dbNameSet.has(m.primary_genre) ? 6 : 0
      const discoveryBonus = (m.discovery_potential || 0) * 0.05
      const recencyPenalty = m.release_year
        ? -RECENCY_MAX_PENALTY * Math.max(0, Math.min(1, (currentYear - m.release_year) / yearSpan))
        : 0
      // Popularity boost — log-scale, capped. Surfaces recognisable films so
      // users can decide early without scanning unfamiliar titles.
      const popularityBoost = m.popularity
        ? Math.min(POPULARITY_MAX_BOOST, Math.log10(m.popularity + 1) * POPULARITY_COEFFICIENT)
        : 0
      return {
        ...m,
        _score: base + moodOverlap * 4 + genreBonus + discoveryBonus + recencyPenalty + popularityBoost,
      }
    })
    .sort((a, b) => b._score - a._score)
}

/**
 * Apply a -20 score penalty to the second+ film from the same collection
 * (e.g. The Godfather franchise) so they don't sit back-to-back. We just
 * re-sort once after the penalty; films with no collection are unaffected.
 */
export function dedupByCollection(scored) {
  const seenCollection = new Set()
  const adjusted = scored.map(m => {
    if (!m.collection_id) return m
    if (seenCollection.has(m.collection_id)) return { ...m, _score: m._score - 20 }
    seenCollection.add(m.collection_id)
    return m
  })
  return adjusted.sort((a, b) => b._score - a._score)
}
