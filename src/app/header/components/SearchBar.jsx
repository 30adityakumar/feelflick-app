import { useDeferredValue, useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Search as SearchIcon, X } from 'lucide-react'
import { searchMovies } from '@/shared/api/tmdb'

const RECENT_SEARCHES_KEY = 'recentSearches'
const MAX_RECENT_SEARCHES = 5

function readRecentSearches() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_SEARCHES) : []
  } catch {
    return []
  }
}

function writeRecentSearches(recentSearches) {
  try {
    localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(recentSearches.slice(0, MAX_RECENT_SEARCHES)),
    )
  } catch {
    // Ignore storage errors and keep the modal usable.
  }
}

export default function SearchBar({ open, onClose }) {
  const nav = useNavigate()
  const dialogTitleId = useId()
  const resultsSummaryId = useId()
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY

  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [sel, setSel] = useState(-1)
  const [recentSearches, setRecentSearches] = useState([])

  const inputRef = useRef(null)
  const previousFocusRef = useRef(null)
  const bodyOverflowRef = useRef('')

  const deferredQuery = useDeferredValue(q)
  const debouncedQ = useDebounce(deferredQuery, 300)

  useEffect(() => {
    if (!open) {
      setQ('')
      setResults([])
      setSel(-1)
      setLoading(false)
      return
    }

    setRecentSearches(readRecentSearches())
  }, [open])

  useEffect(() => {
    if (!open) return

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    bodyOverflowRef.current = document.body.style.overflow

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
    })

    document.body.style.overflow = 'hidden'

    return () => {
      window.cancelAnimationFrame(frame)
      document.body.style.overflow = bodyOverflowRef.current
      previousFocusRef.current?.focus?.()
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    let cancelled = false

    async function run() {
      const normalizedQuery = debouncedQ.trim()

      if (!open || !TMDB_KEY || normalizedQuery.length < 2) {
        setResults([])
        setSel(-1)
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const data = await searchMovies(normalizedQuery)
        if (cancelled) return

        const nextResults = (data?.results || [])
          .filter((movie) => movie.poster_path)
          .slice(0, 10)

        setResults(nextResults)
        setSel(nextResults.length > 0 ? 0 : -1)
      } catch {
        if (!cancelled) {
          setResults([])
          setSel(-1)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [debouncedQ, TMDB_KEY, open])

  function saveRecentSearch(movie) {
    const updated = [movie, ...readRecentSearches().filter((item) => item.id !== movie.id)]
    writeRecentSearches(updated)
    setRecentSearches(updated.slice(0, MAX_RECENT_SEARCHES))
  }

  function goToMovie(movie) {
    saveRecentSearch(movie)
    onClose?.()
    nav(`/movie/${movie.id}`)
  }

  function clearRecentSearches() {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY)
    } catch {
      // Ignore storage errors and keep the modal usable.
    }
    setRecentSearches([])
  }

  function onListKey(e) {
    if (!results.length) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSel((current) => (current + 1) % results.length)
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSel((current) => (current - 1 + results.length) % results.length)
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      const movie = results[Math.max(0, sel)]
      if (movie) {
        goToMovie(movie)
      }
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[61] flex items-start justify-center px-4 pt-4 pb-20 md:pt-20 overflow-y-auto overscroll-contain">
      <button
        type="button"
        className="fixed inset-0 z-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-label="Close search modal"
      />

      <div
        className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d]/98 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-top-4 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        aria-describedby={resultsSummaryId}
      >
        <div className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent px-4 py-4 md:px-6 md:py-5">
          <SearchIcon className="h-5 w-5 flex-shrink-0 text-white/60 md:h-6 md:w-6" aria-hidden="true" />

          <div className="min-w-0 flex-1">
            <h2 id={dialogTitleId} className="sr-only">
              Search movies
            </h2>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onListKey}
              placeholder="Search for movies…"
              className="w-full bg-transparent text-base text-white placeholder-white/60 focus:outline-none md:text-lg"
              aria-label="Search movies"
              aria-controls="global-search-results"
              aria-activedescendant={sel >= 0 ? `global-search-result-${results[sel]?.id}` : undefined}
              autoComplete="off"
              spellCheck={false}
              name="movie-search"
              type="search"
              inputMode="search"
            />
            <p id={resultsSummaryId} className="sr-only" aria-live="polite">
              {loading
                ? 'Searching movies'
                : `${results.length} ${results.length === 1 ? 'result' : 'results'} available`}
            </p>
          </div>

          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors active:scale-95"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-white/60" aria-hidden="true" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors active:scale-95 md:h-10 md:w-10"
            aria-label="Close search"
          >
            <X className="h-5 w-5 text-white/80" aria-hidden="true" />
          </button>
        </div>

        <div
          id="global-search-results"
          className="max-h-[65vh] overflow-y-auto overscroll-contain md:max-h-[500px]"
          role="listbox"
          aria-label="Movie search results"
        >
          {!q && !loading && recentSearches.length === 0 && (
            <div className="px-6 py-12 text-center">
              <SearchIcon className="mx-auto mb-4 h-12 w-12 text-white/20" aria-hidden="true" />
              <p className="text-sm text-white/60 md:text-base">Search for a favorite movie</p>
              <p className="mt-2 text-xs text-white/40 md:text-sm">
                Start typing to jump straight to a title.
              </p>
            </div>
          )}

          {!q && recentSearches.length > 0 && (
            <div className="py-3">
              <div className="flex items-center justify-between px-4 py-2 md:px-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white/70">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  Recent Searches
                </h3>
                <button
                  type="button"
                  onClick={clearRecentSearches}
                  className="rounded px-2 py-1 text-xs text-white/60 transition-colors hover:bg-white/5 hover:text-white/80"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-1 px-2 md:px-3">
                {recentSearches.map((movie) => (
                  <MovieResultCard
                    key={movie.id}
                    id={`global-search-result-${movie.id}`}
                    movie={movie}
                    onClick={() => goToMovie(movie)}
                    isSelected={false}
                  />
                ))}
              </div>
            </div>
          )}

          {q && loading && (
            <div className="px-6 py-12 text-center" aria-live="polite">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
              <p className="text-sm text-white/60">Searching…</p>
            </div>
          )}

          {q && !loading && results.length === 0 && (
            <div className="px-6 py-12 text-center" aria-live="polite">
              <p className="text-sm text-white/60 md:text-base">
                No movies found for &quot;{q}&quot;.
              </p>
              <p className="mt-2 text-xs text-white/40 md:text-sm">
                Try a broader title, actor, or keyword.
              </p>
            </div>
          )}

          {q && !loading && results.length > 0 && (
            <div className="py-3">
              <div className="px-4 py-2 md:px-6">
                <h3 className="text-sm font-semibold text-white/70">
                  {results.length} {results.length === 1 ? 'result' : 'results'} for &quot;{q}&quot;
                </h3>
              </div>
              <div className="space-y-1 px-2 md:px-3">
                {results.map((movie, index) => (
                  <MovieResultCard
                    key={movie.id}
                    id={`global-search-result-${movie.id}`}
                    movie={movie}
                    onClick={() => goToMovie(movie)}
                    onMouseEnter={() => setSel(index)}
                    isSelected={sel === index}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MovieResultCard({ id, movie, onClick, onMouseEnter, isSelected }) {
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null

  return (
    <button
      id={id}
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors md:gap-4 md:px-3 md:py-3 ${
        isSelected
          ? 'bg-white/20 shadow-lg'
          : 'hover:bg-white/10 active:bg-white/20'
      }`}
    >
      <div className="relative flex-shrink-0 overflow-hidden rounded-lg shadow-md">
        {movie.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
            alt={movie.title}
            width="64"
            height="96"
            className="h-20 w-14 object-cover transition-transform duration-300 group-hover:scale-105 md:h-24 md:w-16"
            loading="lazy"
          />
        ) : (
          <div className="flex h-20 w-14 items-center justify-center bg-white/5 text-xl text-white/40 md:h-24 md:w-16">
            <span aria-hidden="true">🎬</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-semibold text-white transition-colors group-hover:text-orange-400 md:text-base">
          {movie.title}
        </h4>
        <div className="mt-1 flex items-center gap-2 text-xs text-white/60 md:text-sm">
          {releaseYear && <span>{releaseYear}</span>}
          {movie.vote_average > 0 && (
            <>
              <span aria-hidden="true">•</span>
              <span className="text-white/60">{movie.vote_average.toFixed(1)}</span>
            </>
          )}
        </div>
        {movie.overview && (
          <p className="mt-1 hidden line-clamp-1 text-xs text-white/40 md:block">
            {movie.overview}
          </p>
        )}
      </div>

      <div className="flex-shrink-0 text-white/40 transition-transform transition-colors group-hover:translate-x-1 group-hover:text-white/80">
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
