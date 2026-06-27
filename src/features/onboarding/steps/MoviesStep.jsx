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

const SEARCH_LISTBOX_ID = 'ob-search-listbox'

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
  const searchAreaRef = useRef(null)
  const { pool, poolLoading, poolError, retry } = useSuggestionPool(selectedGenreIds, moods)
  const {
    query, setQuery, results, searching, showDropdown, setShowDropdown,
    clearSearch, searchError, retrySearch, activeIndex, setActiveIndex,
  } = useMovieSearch()

  // Desktop convenience only — gate the autofocus behind a fine pointer so a
  // mobile soft keyboard doesn't pop over the curation on step entry.
  useEffect(() => {
    if (!window.matchMedia?.('(pointer: fine)')?.matches) return
    const timer = setTimeout(() => searchInputRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [])

  // Close the dropdown on an outside pointerdown. Clicks on the input/options are
  // inside searchAreaRef, so selecting an option still works (pointerdown there
  // doesn't close before the option's click fires).
  useEffect(() => {
    if (!showDropdown) return
    function handlePointerDown(e) {
      if (searchAreaRef.current && !searchAreaRef.current.contains(e.target)) {
        setShowDropdown(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [showDropdown, setShowDropdown, setActiveIndex])

  function handleSelectFromSearch(movie) {
    addMovie(movie)
    clearSearch()
    // Keep focus in the search field so the user can keep adding anchors.
    searchInputRef.current?.focus()
  }

  // Combobox keyboard model — focus stays on the input; aria-activedescendant
  // points at the active option. Search execution (debounce/sort/filter/slice)
  // is untouched; this only moves the active option + selects/closes.
  function handleSearchKeyDown(e) {
    if (!showDropdown) return
    if (e.key === 'Escape') {
      e.preventDefault()
      setShowDropdown(false)
      setActiveIndex(-1)
      return
    }
    const n = results.length
    if (n === 0) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(i => (i + 1) % n)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(i => (i <= 0 ? n - 1 : i - 1))
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        e.preventDefault()
        setActiveIndex(n - 1)
        break
      case 'Enter':
        if (activeIndex >= 0 && activeIndex < n) {
          e.preventDefault()
          handleSelectFromSearch(results[activeIndex])
        }
        break
      default:
        break
    }
  }

  const activeDescId =
    showDropdown && activeIndex >= 0 && results[activeIndex]
      ? `${SEARCH_LISTBOX_ID}-opt-${results[activeIndex].id}`
      : undefined

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
          kicker="The anchors · 3 of 4"
          subcopy={<>Pick 5 films that shaped your taste. These anchor your first picks — so go
          honest, not impressive.</>}
          subcopyClassName="text-[13px] sm:text-sm md:text-[15px] text-white/60 mt-2 leading-relaxed"
        >
          What have you{' '}
          <em className="italic font-light text-[var(--color-brand-accent-text,#ed7a87)]">
            loved?
          </em>
        </StepHeader>
      }
      footer={
        <StepFooter
          statusClassName={`text-xs font-medium transition-colors duration-200 ${canFinish ? 'text-[var(--color-text-secondary,#c9c5bc)]' : 'text-white/30'}`}
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
      <div ref={searchAreaRef} className="flex-none px-5 pb-4 sm:px-6 sm:pb-5 relative">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            role="combobox"
            aria-expanded={Boolean(showDropdown && results.length > 0)}
            aria-controls={showDropdown && results.length > 0 ? SEARCH_LISTBOX_ID : undefined}
            aria-autocomplete="list"
            aria-activedescendant={activeDescId}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => { if (query.trim()) setShowDropdown(true) }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search any film…"
            aria-label="Search for a film to add"
            className="ob-focus w-full pl-10 pr-9 py-2.5 rounded-xl bg-white/[0.07] border border-white/10 text-sm text-white placeholder-white/30 focus:border-white/25 transition-all"
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
            searchError={searchError}
            onRetry={retrySearch}
            activeIndex={activeIndex}
            listboxId={SEARCH_LISTBOX_ID}
          />
        )}
      </div>

      {/* Body — one vertical scroll (no horizontal shelves): the curated
         Suggestions grid + the editorial "Your anchors" zone. */}
      <div className="ob-scroll flex-1 min-h-0 overflow-y-auto px-6 space-y-6 pb-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {/* Suggestions — system curation */}
        <section aria-labelledby="ob-suggestions-h">
          <h3 id="ob-suggestions-h" className="text-xs font-semibold uppercase tracking-widest text-white/45 mb-3">
            Suggestions
          </h3>
          {poolLoading ? (
            <CardSkeletonRow />
          ) : poolError ? (
            <div role="alert" className="flex items-center justify-between gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              <span>Couldn&apos;t load your suggestions.</span>
              <button
                type="button"
                onClick={retry}
                aria-label="Retry loading suggestions"
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/15 text-white transition-colors"
              >
                Retry
              </button>
            </div>
          ) : suggestions.length === 0 ? (
            <p className="text-sm text-white/30 py-2">
              All suggestions added — search for more above
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
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
        </section>

        {/* Your anchors — the user's earned collection, a distinct editorial zone */}
        {favoriteMovies.length > 0 && (
          <section
            aria-labelledby="ob-anchors-h"
            className="rounded-2xl border border-white/12 bg-white/[0.04] p-4"
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 id="ob-anchors-h" className="text-xs font-semibold uppercase tracking-widest text-white/70">
                Your anchors
              </h3>
              {/* Visual progress toward the 5-film minimum (footer carries the exact count). */}
              <div className="flex items-center gap-1.5" aria-hidden="true" data-testid="anchor-pips">
                {Array.from({ length: MIN_MOVIES }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                      i < Math.min(count, MIN_MOVIES) ? 'bg-[var(--color-brand-accent,#e5636f)]' : 'bg-white/15'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
              {favoriteMovies.map(m => (
                <MovieCard
                  key={m.id}
                  movie={m}
                  isSelected={true}
                  onClick={() => removeMovie(m.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </StepShell>
  )
}
