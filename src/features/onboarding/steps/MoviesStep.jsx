// src/features/onboarding/steps/MoviesStep.jsx
import { useEffect, useRef, useState } from 'react'
import { Search, X, ChevronLeft, Check } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import { tmdbImg, searchMovies } from '@/shared/api/tmdb'
import Button from '@/shared/ui/Button'
import { GENRES } from './GenresStep'

const MIN_MOVIES = 5
const POOL_SIZE = 30

const GENRE_DB_NAME = Object.fromEntries(GENRES.map(g => [g.id, g.dbName]))

// === DATA FETCHING ===

/**
 * Fetch top-rated films filtered by the user's selected genres.
 * @param {number[]} genreIds
 * @returns {Promise<object[]>}
 */
async function fetchGenrePool(genreIds) {
  const dbNames = genreIds.map(id => GENRE_DB_NAME[id]).filter(Boolean)
  if (!dbNames.length) return fetchGlobalPool()

  const { data } = await supabase
    .from('movies')
    .select('id, tmdb_id, title, poster_path, release_date, primary_genre')
    .in('primary_genre', dbNames)
    .not('ff_audience_rating', 'is', null)
    .not('poster_path', 'is', null)
    .order('ff_audience_rating', { ascending: false })
    .limit(POOL_SIZE)

  return (data || []).map(m => ({
    id: m.tmdb_id,
    internalId: m.id,
    title: m.title,
    poster_path: m.poster_path,
    release_date: m.release_date,
  }))
}

async function fetchGlobalPool() {
  const { data } = await supabase
    .from('movies')
    .select('id, tmdb_id, title, poster_path, release_date')
    .not('ff_audience_rating', 'is', null)
    .not('poster_path', 'is', null)
    .order('ff_audience_rating', { ascending: false })
    .limit(POOL_SIZE)

  return (data || []).map(m => ({
    id: m.tmdb_id,
    internalId: m.id,
    title: m.title,
    poster_path: m.poster_path,
    release_date: m.release_date,
  }))
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
      className="flex-shrink-0 w-40 flex flex-col gap-1.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg group"
    >
      <div className={`relative aspect-[2/3] w-full rounded-lg overflow-hidden transition-shadow duration-200 ${
        isSelected
          ? 'ring-2 ring-purple-400 shadow-[0_0_16px_rgba(168,85,247,0.4)]'
          : 'ring-1 ring-white/[0.06] group-hover:ring-white/20'
      }`}>
        {!loaded && <div className="absolute inset-0 animate-pulse bg-white/[0.04]" />}
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
            <Check className="h-3 w-3 text-white stroke-[3]" />
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
    <div className="flex gap-4 overflow-x-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-40 flex flex-col gap-1.5">
          <div
            className="aspect-[2/3] rounded-lg bg-white/[0.04] animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          />
          <div className="h-2.5 w-3/4 bg-white/[0.04] rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}

// === MAIN COMPONENT ===

/**
 * Onboarding step 2: movie selection.
 * Layout: search bar with dropdown → Suggestions row → Your picks row.
 *
 * @param {{
 *   selectedGenreIds: number[],
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
    fetchGenrePool(selectedGenreIds)
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
      <div className="flex-none px-6 pt-6 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <h2 className="text-5xl font-black tracking-tight text-white leading-[1.05]">
          What have you loved?
        </h2>
        <p className="text-base text-white/60 mt-2 leading-relaxed">
          Pick five films that shaped your taste.
        </p>
      </div>

      {/* Search bar + dropdown */}
      <div className="flex-none px-6 pb-5 relative">
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
          <div className="absolute left-6 right-6 top-full mt-1 z-50 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            {searching ? (
              <p className="px-4 py-3 text-sm text-white/40">Searching…</p>
            ) : results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-white/30">No results — try a different title</p>
            ) : (
              <div className="max-h-60 overflow-y-auto divide-y divide-white/[0.05]">
                {results.map(m => {
                  const yr = m.release_date ? new Date(m.release_date).getFullYear() : null
                  const selected = isMovieSelected(m.id)
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectFromSearch(m)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] text-left transition-colors"
                    >
                      <img
                        src={tmdbImg(m.poster_path, 'w92')}
                        alt=""
                        className="w-8 h-12 rounded object-cover flex-shrink-0 bg-white/[0.04]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{m.title}</p>
                        {yr && <p className="text-xs text-white/40">{yr}</p>}
                      </div>
                      {selected && (
                        <Check className="flex-shrink-0 h-4 w-4 text-purple-400" />
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
            <div className="flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
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
            <div className="flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
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
      <div className="flex-none px-6 pb-8 pt-4 border-t border-white/[0.06]">
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
