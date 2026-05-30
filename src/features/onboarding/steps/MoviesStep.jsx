// src/features/onboarding/steps/MoviesStep.jsx
// Step 3 — Films picker. Live TMDB search + Supabase suggestion pool filtered
// by the user's selected genres. Visual chrome stays consistent with v2 (purple/
// pink palette, Outfit display font via .ob-display).
import { useEffect, useRef, useState } from 'react'
import { Search, X, ChevronLeft, Check } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import { tmdbImg, searchMovies } from '@/shared/api/tmdb'
import Button from '@/shared/ui/Button'
import { GENRES } from '@/features/onboarding/data'

const MIN_MOVIES = 5
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
async function fetchSuggestionPool(genreIds, moods) {
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
function shapeFilm(m) {
  return {
    id: m.tmdb_id,
    internalId: m.id,
    title: m.title,
    poster_path: m.poster_path,
    release_date: m.release_date,
  }
}

/** Merge multiple candidate arrays, deduping by tmdb_id, preserving first occurrence. */
function mergeUnique(arrays) {
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
function scoreCandidates(candidates, { dbNames, tagSet }) {
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
function dedupByCollection(scored) {
  const seenCollection = new Set()
  const adjusted = scored.map(m => {
    if (!m.collection_id) return m
    if (seenCollection.has(m.collection_id)) return { ...m, _score: m._score - 20 }
    seenCollection.add(m.collection_id)
    return m
  })
  return adjusted.sort((a, b) => b._score - a._score)
}

// === MOVIE CARD ===
// Fixed-width card: poster + title + year below (not overlaid).

function MovieCard({ movie, isSelected, onClick }) {
  const [loaded, setLoaded] = useState(false)
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? 'Remove' : 'Select'} ${movie.title}`}
      className="shrink-0 w-28 sm:w-32 md:w-36 flex flex-col gap-1.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg group"
    >
      <div className={`relative aspect-2/3 w-full rounded-lg overflow-hidden transition-shadow duration-200 ${
        isSelected
          ? 'ring-2 ring-purple-400 shadow-[0_0_16px_rgba(168,85,247,0.4)]'
          : 'ring-1 ring-white/6 group-hover:ring-white/20'
      }`}>
        {!loaded && <div className="absolute inset-0 animate-pulse bg-white/4" />}
        <img
          src={tmdbImg(movie.poster_path, 'w342')}
          alt={movie.title}
          loading="lazy"
          className={`w-full h-full object-cover transition-all duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          } ${isSelected ? 'brightness-75' : 'group-hover:brightness-110'}`}
          onLoad={() => setLoaded(true)}
        />
        {isSelected && <div className="absolute inset-0 bg-purple-600/15" />}
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center shadow">
            <Check className="h-3 w-3 text-white stroke-3" />
          </div>
        )}
      </div>
      <div className="px-0.5">
        <p className={`text-[11px] font-medium leading-tight line-clamp-2 transition-colors ${
          isSelected ? 'text-purple-300' : 'text-white/80'
        }`}>
          {movie.title}
        </p>
        {year && <p className="text-[10px] text-white/35 mt-0.5">{year}</p>}
      </div>
    </button>
  )
}

// === CARD SKELETON ROW ===

function CardSkeletonRow() {
  return (
    <div className="flex gap-3 sm:gap-4 overflow-x-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="shrink-0 w-28 sm:w-32 md:w-36 flex flex-col gap-1.5">
          <div
            className="aspect-2/3 rounded-lg bg-white/4 animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          />
          <div className="h-2.5 w-3/4 bg-white/4 rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}

// === MAIN COMPONENT ===

/**
 * Onboarding step 3: movie selection.
 * Layout: search bar with dropdown → Suggestions row → Your picks row.
 *
 * @param {{
 *   selectedGenreIds: number[],
 *   moods: string[],
 *   favoriteMovies: object[],
 *   addMovie: function,
 *   removeMovie: function,
 *   isMovieSelected: function,
 *   onBack: function,
 *   onFinish: function,
 *   loading: boolean,
 *   error: string,
 * }} props
 */
export default function MoviesStep({
  selectedGenreIds,
  moods,
  favoriteMovies,
  addMovie,
  removeMovie,
  isMovieSelected,
  onBack,
  onFinish,
  loading,
  error,
}) {
  const [pool, setPool] = useState([])
  const [poolLoading, setPoolLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchInputRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    setPoolLoading(true)
    fetchSuggestionPool(selectedGenreIds, moods)
      .then(films => { setPool(films); setPoolLoading(false) })
      .catch(() => setPoolLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setTimeout(() => searchInputRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [])

  // Live search with debounce
  useEffect(() => {
    clearTimeout(searchTimeoutRef.current)
    if (!query.trim()) {
      setResults([])
      setSearching(false)
      setShowDropdown(false)
      return
    }
    setSearching(true)
    setShowDropdown(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await searchMovies(query)
        setResults(
          (data?.results || [])
            .filter(m => m.poster_path)
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 8)
        )
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(searchTimeoutRef.current)
  }, [query])

  function handleSelectFromSearch(movie) {
    addMovie(movie)
    setQuery('')
    setShowDropdown(false)
  }

  const count = favoriteMovies.length
  const canFinish = count >= MIN_MOVIES
  // Suggestions: pool excluding already-selected films
  const suggestions = pool.filter(m => !isMovieSelected(m.id))

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-3 sm:mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-purple-400/85 mb-2.5 sm:mb-3">
          Films · 3 of 4
        </p>
        <h2
          className="ob-display text-[32px] sm:text-4xl md:text-5xl font-normal leading-[1.05] text-white"
          style={{ textWrap: 'balance' }}
        >
          What have you{' '}
          <em className="bg-linear-to-r from-purple-500 to-pink-500 bg-clip-text italic text-transparent">
            loved?
          </em>
        </h2>
        <p className="text-[13px] sm:text-sm md:text-[15px] text-white/60 mt-2 leading-relaxed">
          Pick 5 films that shaped your taste.
        </p>
      </div>

      {/* Search bar + dropdown */}
      <div className="flex-none px-5 pb-4 sm:px-6 sm:pb-5 relative">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => { if (query.trim()) setShowDropdown(true) }}
            placeholder="Search any film…"
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white/[0.07] border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-purple-400/50 focus:border-purple-400/30 transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setShowDropdown(false) }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search dropdown */}
        {showDropdown && (
          <div className="absolute left-5 right-5 sm:left-6 sm:right-6 top-full mt-1 z-50 bg-black/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl">
            {searching ? (
              <p className="px-4 py-3 text-sm text-white/40">Searching…</p>
            ) : results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-white/30">No results — try a different title</p>
            ) : (
              <div className="max-h-60 overflow-y-auto divide-y divide-white/5">
                {results.map(m => {
                  const yr = m.release_date ? new Date(m.release_date).getFullYear() : null
                  const selected = isMovieSelected(m.id)
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectFromSearch(m)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/6 text-left transition-colors"
                    >
                      <img
                        src={tmdbImg(m.poster_path, 'w92')}
                        alt=""
                        className="w-8 h-12 rounded object-cover shrink-0 bg-white/4"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{m.title}</p>
                        {yr && <p className="text-xs text-white/40">{yr}</p>}
                      </div>
                      {selected && (
                        <Check className="shrink-0 h-4 w-4 text-purple-400" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Carousel rows */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 space-y-6 pb-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {/* Suggestions row */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400/60 mb-3">
            Suggestions
          </p>
          {poolLoading ? (
            <CardSkeletonRow />
          ) : suggestions.length === 0 ? (
            <p className="text-sm text-white/30 py-2">
              All suggestions added — search for more above
            </p>
          ) : (
            <div className="flex gap-3 sm:gap-4 overflow-x-auto py-2 px-1 -mx-1 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
              {suggestions.map(m => (
                <MovieCard
                  key={m.id}
                  movie={m}
                  isSelected={false}
                  onClick={() => addMovie(m)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Your picks row */}
        {favoriteMovies.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-400/60 mb-3">
              Your picks ({count}/{MIN_MOVIES})
            </p>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto py-2 px-1 -mx-1 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
              {favoriteMovies.map(m => (
                <MovieCard
                  key={m.id}
                  movie={m}
                  isSelected={true}
                  onClick={() => removeMovie(m.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-none px-5 pb-6 pt-3 sm:px-6 sm:pb-8 sm:pt-4 border-t border-white/6">
        <div className="max-w-sm mx-auto flex flex-col items-center gap-3">
          <p className={`text-xs font-medium transition-colors duration-200 ${
            canFinish ? 'text-purple-400' : 'text-white/30'
          }`}>
            {count === 0
              ? `Select at least ${MIN_MOVIES} films to continue`
              : count < MIN_MOVIES
              ? `${count} selected — pick ${MIN_MOVIES - count} more`
              : `${count} selected ✓`}
          </p>
          <Button variant="primary" size="lg" onClick={onFinish} disabled={!canFinish || loading} fullWidth>
            {loading ? 'Saving…' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  )
}
