// src/app/pages/discover/components/AnchorSearch.jsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

import { searchMovies } from '@/shared/api/tmdb'

/**
 * Film autocomplete for the optional anchor step.
 * Debounced 250ms. Shows top 5 results with poster thumb + title + year.
 *
 * @param {{ onSelect: (film: { id: number, title: string, year: string }) => void,
 *           onSkip: () => void }} props
 */
export default function AnchorSearch({ onSelect, onSkip }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef(null)
  const abortRef = useRef(null)

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([])
      return
    }

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setSearching(true)
    try {
      const data = await searchMovies(q, { signal: controller.signal })
      if (!controller.signal.aborted) {
        setResults((data?.results ?? []).slice(0, 5))
      }
    } catch (err) {
      if (err.name !== 'AbortError') setResults([])
    } finally {
      if (!controller.signal.aborted) setSearching(false)
    }
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(() => doSearch(query), 250)
    return () => clearTimeout(debounceRef.current)
  }, [query, doSearch])

  // Clean up abort controller on unmount
  useEffect(() => () => abortRef.current?.abort(), [])

  function handleSelect(movie) {
    const year = movie.release_date ? String(movie.release_date).slice(0, 4) : ''
    onSelect({ id: movie.id, title: movie.title, year })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="py-12"
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-400/60 mb-4">
        ANCHOR
      </p>
      <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white mb-10">
        Name a film that matches your mood right now
      </h2>

      <div className="relative max-w-md">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a film..."
          aria-label="Search for an anchor film"
          className="w-full bg-white/[0.03] border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/40 focus:ring-2 focus:ring-purple-500/10 transition-all"
        />

        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
          </div>
        )}

        {/* Results dropdown */}
        {results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-white/10 bg-neutral-950/95 backdrop-blur-md overflow-hidden z-10">
            {results.map((movie) => (
              <button
                key={movie.id}
                type="button"
                onClick={() => handleSelect(movie)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.04] transition-colors border-b border-white/[0.05] last:border-b-0"
              >
                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                    alt=""
                    className="h-12 w-8 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-12 w-8 rounded bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-white/30">?</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm text-white/90 truncate">{movie.title}</p>
                  {movie.release_date && (
                    <p className="text-xs text-white/40">{String(movie.release_date).slice(0, 4)}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="mt-6 text-sm text-white/40 hover:text-white/60 transition-colors"
      >
        Skip this step
      </button>
    </motion.div>
  )
}
