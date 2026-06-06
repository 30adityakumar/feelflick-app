// src/features/onboarding/steps/MoviesStep.jsx
// Step 3 — Films picker. COMPOSITION LAYER: the suggestion-pool engine lives in
// suggestionPool.js, the pool fetch + live TMDB search in the useSuggestionPool /
// useMovieSearch hooks, and the card / skeleton / dropdown in ./movies/*. This
// file just wires them into the header / search / suggestions / picks / footer
// layout. Logic extracted in F2.3 — UI, copy, layout, styling, and behavior are
// unchanged.
import { useEffect, useRef } from 'react'
import { Search, X, ChevronLeft } from 'lucide-react'

import Button from '@/shared/ui/Button'
import { MIN_MOVIES } from '../suggestionPool'
import { useSuggestionPool } from '../hooks/useSuggestionPool'
import { useMovieSearch } from '../hooks/useMovieSearch'
import MovieCard from './movies/MovieCard'
import CardSkeletonRow from './movies/CardSkeletonRow'
import SearchDropdown from './movies/SearchDropdown'

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
  const searchInputRef = useRef(null)
  const { pool, poolLoading } = useSuggestionPool(selectedGenreIds, moods)
  const { query, setQuery, results, searching, showDropdown, setShowDropdown, clearSearch } = useMovieSearch()

  useEffect(() => {
    const timer = setTimeout(() => searchInputRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [])

  function handleSelectFromSearch(movie) {
    addMovie(movie)
    clearSearch()
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
          Pick 5 films that shaped your taste. These anchor your first picks — so go
          honest, not impressive.
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
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search dropdown */}
        {showDropdown && (
          <SearchDropdown
            searching={searching}
            results={results}
            isMovieSelected={isMovieSelected}
            onSelect={handleSelectFromSearch}
          />
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
