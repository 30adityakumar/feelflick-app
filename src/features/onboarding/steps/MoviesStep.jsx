// src/features/onboarding/steps/MoviesStep.jsx
// Step 3 — Films picker. COMPOSITION LAYER: the suggestion-pool engine lives in
// suggestionPool.js, the pool fetch + live TMDB search in the useSuggestionPool /
// useMovieSearch hooks, the card / skeleton / dropdown in ./movies/*, and the
// shared step chrome in ../components/{StepShell,StepHeader,StepFooter}. This file
// just wires the search + suggestions + picks body between the header and footer.
// UI, copy, layout, styling, and behavior are unchanged.
import { useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

import { MIN_MOVIES } from '../suggestionPool'
import { useSuggestionPool } from '../hooks/useSuggestionPool'
import { useMovieSearch } from '../hooks/useMovieSearch'
import StepShell from '../components/StepShell'
import StepHeader from '../components/StepHeader'
import StepFooter from '../components/StepFooter'
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
    <StepShell
      header={
        <StepHeader
          className="flex-none px-5 pt-5 pb-4 sm:px-6 sm:pt-6"
          onBack={onBack}
          kicker="Films · 3 of 4"
          subcopy={<>Pick 5 films that shaped your taste. These anchor your first picks — so go
          honest, not impressive.</>}
          subcopyClassName="text-[13px] sm:text-sm md:text-[15px] text-white/60 mt-2 leading-relaxed"
        >
          What have you{' '}
          <em className="bg-linear-to-r from-purple-500 to-pink-500 bg-clip-text italic text-transparent">
            loved?
          </em>
        </StepHeader>
      }
      footer={
        <StepFooter
          statusClassName={`text-xs font-medium transition-colors duration-200 ${canFinish ? 'text-purple-400' : 'text-white/30'}`}
          status={
            count === 0
              ? `Select at least ${MIN_MOVIES} films to continue`
              : count < MIN_MOVIES
              ? `${count} selected — pick ${MIN_MOVIES - count} more`
              : `${count} selected ✓`
          }
          onContinue={onFinish}
          disabled={!canFinish || loading}
          label={loading ? 'Saving…' : 'Continue'}
          showChevron={false}
        />
      }
    >
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
    </StepShell>
  )
}
