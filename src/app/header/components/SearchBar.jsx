// src/app/header/components/SearchBar.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Search as SearchIcon, TrendingUp, Clock, Plus, Bookmark } from 'lucide-react'

export default function SearchBar({ open, onClose }) {
  const nav = useNavigate()
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY

  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [sel, setSel] = useState(-1)
  const [recentSearches, setRecentSearches] = useState([])
  const [trending, setTrending] = useState([])
  const inputRef = useRef(null)

  // Load recent searches and trending
  useEffect(() => {
    if (open) {
      const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
      setRecentSearches(recent.slice(0, 5))
      fetchTrending()
    }
  }, [open])

  // Fetch trending movies for empty state
  async function fetchTrending() {
    if (!TMDB_KEY) return
    try {
      const r = await fetch(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}`
      )
      const j = await r.json()
      const list = (j?.results || [])
        .filter((m) => m.poster_path)
        .slice(0, 6)
      setTrending(list)
    } catch {
      setTrending([])
    }
  }

  // Focus and lock scroll when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      document.body.style.overflow = 'hidden'
    } else {
      setQ('')
      setResults([])
      setSel(-1)
      setLoading(false)
      document.body.style.overflow = ''
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Debounced search
  const debouncedQ = useDebounce(q, 300)

  useEffect(() => {
    let abort = false
    async function run() {
      if (!open) return
      if (!TMDB_KEY || !debouncedQ || debouncedQ.trim().length < 2) {
        setResults([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const r = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(
            debouncedQ
          )}`
        )
        const j = await r.json()
        if (!abort) {
          const list = (j?.results || [])
            .filter((m) => m.poster_path)
            .slice(0, 10)
          setResults(list)
        }
      } catch {
        if (!abort) setResults([])
      } finally {
        if (!abort) setLoading(false)
      }
    }
    run()
    return () => {
      abort = true
    }
  }, [debouncedQ, TMDB_KEY, open])

  function saveRecentSearch(movie) {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
    const filtered = recent.filter((m) => m.id !== movie.id)
    const updated = [movie, ...filtered].slice(0, 5)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  function goToMovie(m) {
    saveRecentSearch(m)
    onClose?.()
    nav(`/movie/${m.id}`)
  }

  function clearRecentSearches() {
    localStorage.removeItem('recentSearches')
    setRecentSearches([])
  }

  // Keyboard navigation
  function onListKey(e) {
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSel((s) => (s + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSel((s) => (s - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const m = results[Math.max(0, sel)]
      if (m) goToMovie(m)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Search Modal */}
      <div
        className="fixed inset-0 z-[61] flex items-start justify-center pt-4 md:pt-20 px-4 pb-20 overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
      >
        <div
          className="w-full max-w-3xl bg-[#0d0d0d]/98 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-top-4 duration-300"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Search movies"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-4 md:px-6 md:py-5 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
            <SearchIcon className="h-5 w-5 md:h-6 md:w-6 text-white/60 flex-shrink-0" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onListKey}
              placeholder="Search for movies..."
              className="flex-1 bg-transparent text-base md:text-lg text-white placeholder-white/50 focus:outline-none"
              aria-label="Search movies"
              autoComplete="off"
              spellCheck="false"
            />
            {q && (
              <button
                onClick={() => setQ('')}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all active:scale-95"
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-white/60" />
              </button>
            )}
            <button
              onClick={onClose}
              className="h-9 w-9 md:h-10 md:w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all active:scale-95"
              aria-label="Close search"
            >
              <X className="h-5 w-5 text-white/80" />
            </button>
          </div>

          {/* Results Area */}
          <div className="max-h-[65vh] md:max-h-[500px] overflow-y-auto">
            {/* Empty State with Trending */}
            {!q && !loading && recentSearches.length === 0 && (
              <div className="py-4">
                {trending.length > 0 ? (
                  <>
                    <div className="px-4 md:px-6 py-2">
                      <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Trending This Week
                      </h3>
                    </div>
                    <div className="space-y-1 px-2 md:px-3">
                      {trending.map((m) => (
                        <MovieResultCard
                          key={m.id}
                          movie={m}
                          onClick={() => goToMovie(m)}
                          isSelected={false}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="px-6 py-12 text-center">
                    <SearchIcon className="h-12 w-12 mx-auto text-white/20 mb-4" />
                    <p className="text-white/60 text-sm md:text-base">
                      Search for your favorite movies
                    </p>
                    <p className="text-white/40 text-xs md:text-sm mt-2">
                      Start typing to find what you're looking for
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Recent Searches */}
            {!q && recentSearches.length > 0 && (
              <div className="py-3">
                <div className="flex items-center justify-between px-4 md:px-6 py-2">
                  <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Searches
                  </h3>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-white/50 hover:text-white/80 transition-colors px-2 py-1 rounded hover:bg-white/5"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-1 px-2 md:px-3">
                  {recentSearches.map((m) => (
                    <MovieResultCard
                      key={m.id}
                      movie={m}
                      onClick={() => goToMovie(m)}
                      isSelected={false}
                    />
                  ))}
                </div>

                {/* Show trending below recent */}
                {trending.length > 0 && (
                  <>
                    <div className="px-4 md:px-6 py-2 mt-4 border-t border-white/10">
                      <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Trending This Week
                      </h3>
                    </div>
                    <div className="space-y-1 px-2 md:px-3">
                      {trending.slice(0, 4).map((m) => (
                        <MovieResultCard
                          key={m.id}
                          movie={m}
                          onClick={() => goToMovie(m)}
                          isSelected={false}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Loading State */}
            {q && loading && (
              <div className="px-6 py-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white mb-4" />
                <p className="text-white/60 text-sm">Searching...</p>
              </div>
            )}

            {/* No Results */}
            {q && !loading && results.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-white/60 text-sm md:text-base">
                  No movies found for "{q}"
                </p>
                <p className="text-white/40 text-xs md:text-sm mt-2">
                  Try searching with different keywords
                </p>
              </div>
            )}

            {/* Search Results */}
            {q && !loading && results.length > 0 && (
              <div className="py-3">
                <div className="px-4 md:px-6 py-2">
                  <h3 className="text-sm font-semibold text-white/70">
                    {results.length} {results.length === 1 ? 'result' : 'results'} for "{q}"
                  </h3>
                </div>
                <div className="space-y-1 px-2 md:px-3">
                  {results.map((m, i) => (
                    <MovieResultCard
                      key={m.id}
                      movie={m}
                      onClick={() => goToMovie(m)}
                      onMouseEnter={() => setSel(i)}
                      isSelected={sel === i}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

/* ===== Movie Result Card Component ===== */
function MovieResultCard({ movie, onClick, onMouseEnter, isSelected }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`group flex w-full items-center gap-3 md:gap-4 rounded-xl px-2 md:px-3 py-2 md:py-3 text-left transition-all duration-200 ${
        isSelected
          ? 'bg-white/15 scale-[1.02] shadow-lg'
          : 'hover:bg-white/10 active:bg-white/15 active:scale-[0.99]'
      }`}
    >
      {/* Poster */}
      <div className="relative flex-shrink-0 overflow-hidden rounded-lg shadow-md">
        <img
          src={
            movie.poster_path
              ? `https://image.tmdb.org/t/p/w92${movie.poster_path}`
              : 'https://via.placeholder.com/92x138/1a1a1a/666?text=No+Image'
          }
          alt={movie.title}
          className="h-20 w-14 md:h-24 md:w-16 object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Movie Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-white text-sm md:text-base truncate group-hover:text-orange-400 transition-colors">
          {movie.title}
        </h4>
        <div className="flex items-center gap-2 mt-1 text-xs md:text-sm text-white/60">
          {movie.release_date && (
            <span>{new Date(movie.release_date).getFullYear()}</span>
          )}
          {movie.vote_average > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="text-yellow-400">★</span>
                {movie.vote_average.toFixed(1)}
              </span>
            </>
          )}
        </div>
        {movie.overview && (
          <p className="text-xs text-white/40 mt-1 line-clamp-1 hidden md:block">
            {movie.overview}
          </p>
        )}
      </div>

      {/* Arrow Indicator */}
      <div className="flex-shrink-0 text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all">
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}

/* ===== Debounce Hook ===== */
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
