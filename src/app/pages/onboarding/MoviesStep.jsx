// src/app/pages/onboarding/MoviesStep.jsx
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, X, ChevronLeft, RefreshCw, Check } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import { tmdbImg, searchMovies } from '@/shared/api/tmdb'
import Button from '@/shared/ui/Button'
import { GENRES } from './GenresStep'

const MIN_MOVIES = 5
const POOL_SIZE = 30

// Map genre ID → DB name
const GENRE_DB_NAME = Object.fromEntries(GENRES.map(g => [g.id, g.dbName]))

/**
 * Fetch top POOL_SIZE films filtered by the user's selected genres.
 * Falls back to a global pool if no results found.
 * @param {number[]} genreIds
 * @returns {Promise<object[]>} TMDB-shaped movie objects
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

  // Shape to match what TMDB search returns (id = tmdb_id for selection)
  return (data || []).map(m => ({
    id: m.tmdb_id,
    internalId: m.id,
    title: m.title,
    poster_path: m.poster_path,
    release_date: m.release_date,
    primary_genre: m.primary_genre,
  }))
}

async function fetchGlobalPool() {
  const { data } = await supabase
    .from('movies')
    .select('id, tmdb_id, title, poster_path, release_date, primary_genre')
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
    primary_genre: m.primary_genre,
  }))
}

function PosterTile({ movie, isSelected, onClick }) {
  const [loaded, setLoaded] = useState(false)
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? 'Remove' : 'Select'} ${movie.title}`}
      className={`relative group rounded-xl overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-purple-400 scale-[1.03] shadow-lg shadow-purple-500/25'
          : 'ring-1 ring-white/10 hover:ring-white/25'
      }`}
    >
      <div className="aspect-[2/3] bg-neutral-900">
        {!loaded && <div className="absolute inset-0 animate-pulse bg-white/[0.04]" />}
        <img
          src={tmdbImg(movie.poster_path, 'w342')}
          alt={movie.title}
          loading="lazy"
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
        />
        {/* Hover / selected overlay */}
        <div className={`absolute inset-0 transition-opacity duration-200 ${
          isSelected
            ? 'bg-purple-600/25 opacity-100'
            : 'bg-black/40 opacity-0 group-hover:opacity-100'
        }`} />
        {/* Title fade at bottom */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-2 pt-6 pb-2">
          <p className="text-[11px] font-semibold text-white leading-tight line-clamp-2">{movie.title}</p>
          {year && <p className="text-[10px] text-white/40 mt-0.5">{year}</p>}
        </div>
        {/* Checkmark */}
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center">
            <Check className="h-3 w-3 text-white stroke-[3]" />
          </div>
        )}
      </div>
    </motion.button>
  )
}

/**
 * Onboarding step 2: movie selection.
 * Shows top-rated films from user's selected genres. Minimum 5 films required.
 *
 * @param {{
 *   selectedGenreIds: number[],
 *   favoriteMovies: object[],
 *   addMovie: (movie: object) => void,
 *   removeMovie: (tmdbId: number) => void,
 *   isMovieSelected: (tmdbId: number) => boolean,
 *   onBack: () => void,
 *   onFinish: () => void,
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
  const [isGlobalPool, setIsGlobalPool] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const searchInputRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  // Load initial genre-filtered pool
  useEffect(() => {
    setPoolLoading(true)
    fetchGenrePool(selectedGenreIds)
      .then(films => { setPool(films); setPoolLoading(false) })
      .catch(() => setPoolLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus search
  useEffect(() => {
    const timer = setTimeout(() => searchInputRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [])

  // Debounced TMDB search
  useEffect(() => {
    clearTimeout(searchTimeoutRef.current)
    if (!query.trim()) { setResults([]); setSearching(false); return }

    setSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await searchMovies(query)
        setResults(
          (data?.results || [])
            .filter(m => m.poster_path)
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 12)
        )
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeoutRef.current)
  }, [query])

  async function handleSwapPool() {
    setPoolLoading(true)
    setIsGlobalPool(true)
    const films = await fetchGlobalPool().catch(() => [])
    setPool(films)
    setPoolLoading(false)
  }

  const count = favoriteMovies.length
  const canFinish = count >= MIN_MOVIES
  const showPool = !query
  const displayPool = showPool ? pool : results

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
        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
          Pick 5 films you&apos;ve loved.
        </h2>
        <p className="text-sm text-white/40 mt-1">
          {isGlobalPool
            ? 'Showing all-time greats — scroll or search'
            : 'From your chosen genres — or search for anything'}
        </p>
      </div>

      {/* Search bar */}
      <div className="flex-none px-6 pb-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search any film…"
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white/[0.07] border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-purple-400/50 focus:border-purple-400/30 transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Selected strip */}
      {favoriteMovies.length > 0 && (
        <div className="flex-none px-6 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {favoriteMovies.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => removeMovie(m.id)}
                title={`Remove ${m.title}`}
                aria-label={`Remove ${m.title}`}
                className="relative flex-none group"
              >
                <img
                  src={tmdbImg(m.poster_path, 'w92')}
                  alt={m.title}
                  className="h-14 w-10 rounded-lg object-cover ring-1 ring-purple-400/50"
                />
                <div className="absolute inset-0 rounded-lg bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <X className="h-3.5 w-3.5 text-white" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Film grid */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6">
        {error && (
          <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {poolLoading || searching ? (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl bg-white/[0.04] animate-pulse" style={{ animationDelay: `${i * 40}ms` }} />
            ))}
          </div>
        ) : displayPool.length === 0 ? (
          <p className="text-sm text-white/30 text-center pt-12">
            {query ? 'No results — try a different title' : 'No films found'}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2.5 pb-4">
              {displayPool.map(m => (
                <PosterTile
                  key={m.id}
                  movie={m}
                  isSelected={isMovieSelected(m.id)}
                  onClick={() => isMovieSelected(m.id) ? removeMovie(m.id) : addMovie(m)}
                />
              ))}
            </div>
            {/* Swap pool — only shown for genre pool */}
            {showPool && !isGlobalPool && (
              <div className="py-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleSwapPool}
                  className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  I haven&apos;t seen these — show all-time greats
                </button>
              </div>
            )}
          </>
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
          <Button
            variant="primary"
            size="lg"
            onClick={onFinish}
            disabled={!canFinish || loading}
            fullWidth
          >
            {loading ? 'Saving…' : 'See my recommendations'}
          </Button>
        </div>
      </div>
    </div>
  )
}
