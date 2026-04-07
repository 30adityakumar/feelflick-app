// src/app/pages/browse/MoviesTab.jsx
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { discoverMovies, searchMovies } from '@/shared/api/tmdb'
import BrowseSearchBar, { DEFAULT_SORT } from './components/BrowseSearchBar'
import ResultsGrid from './components/ResultsGrid'
import Pagination from './components/Pagination'
import { useAuthSession } from '@/shared/hooks/useAuthSession'

function getPage(searchParams) {
  const value = Number(searchParams.get('page') || '1')
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1
}

/** Convert a decade string like "2010" → { gte, lte } date strings */
function decadeToDateRange(decade) {
  if (!decade) return {}
  if (decade === 'pre1970') return { releaseDateLte: '1969-12-31' }
  const start = Number(decade)
  if (!Number.isFinite(start)) return {}
  return {
    releaseDateGte: `${start}-01-01`,
    releaseDateLte: `${start + 9}-12-31`,
  }
}

export default function MoviesTab() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthSession()

  const page      = getPage(searchParams)
  const genre     = searchParams.get('genre')     || ''
  const query     = searchParams.get('q')         || ''
  const sortBy    = searchParams.get('sort')      || DEFAULT_SORT
  const decade    = searchParams.get('decade')    || ''
  const minRating = searchParams.get('rating')    || ''
  const language  = searchParams.get('lang')      || ''

  const updateSearchParams = (updates) => {
    const next = new URLSearchParams(searchParams)

    const set = (key, value, defaultValue = '') => {
      if (value === undefined) return
      const v = typeof value === 'string' ? value.trim() : value
      if (!v || v === defaultValue) next.delete(key)
      else next.set(key, String(v))
    }

    set('q',      updates.q)
    set('genre',  updates.genre)
    set('sort',   updates.sortBy,    DEFAULT_SORT)
    set('decade', updates.decade)
    set('rating', updates.minRating)
    set('lang',   updates.language)
    set('page',   updates.page, 1)

    setSearchParams(next, { replace: false })
  }

  useEffect(() => {
    let active = true
    async function fetchMovies() {
      setLoading(true)
      try {
        let data
        if (query.trim()) {
          data = await searchMovies(query, { page })
        } else {
          const { releaseDateGte, releaseDateLte } = decadeToDateRange(decade)
          data = await discoverMovies({
            page,
            sortBy,
            genreIds: genre || undefined,
            voteAverageGte: minRating ? Number(minRating) : undefined,
            language: language || undefined,
            releaseDateGte,
            releaseDateLte,
          })
        }
        if (!active) return
        setMovies(data.results || [])
        setTotalPages(Math.min(data.total_pages || 1, 500))
        setTotalResults(data.total_results || 0)
      } catch (err) {
        console.error('[Browse] fetch error:', err)
        if (active) { setMovies([]); setTotalResults(0) }
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchMovies()
    return () => { active = false }
  }, [page, genre, query, sortBy, decade, minRating, language])

  const handleSearch = (filters) => {
    updateSearchParams({ ...filters, page: 1 })
  }

  const handlePageChange = (newPage) => {
    updateSearchParams({ page: newPage })
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  }

  const isSearchMode = query.trim().length > 0

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sticky filter bar */}
      <div className="sticky top-0 z-40 border-b border-white/8 bg-black/95 pt-20 pb-3 backdrop-blur-xl md:pt-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
          <BrowseSearchBar
            query={query}
            genre={genre}
            sortBy={sortBy}
            decade={decade}
            minRating={minRating}
            language={language}
            onSearch={handleSearch}
          />
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:px-8 lg:px-12">
        {/* Result count */}
        {!loading && movies.length > 0 && (
          <p className="mb-5 text-[0.8rem] text-white/35">
            {isSearchMode
              ? `${totalResults.toLocaleString()} results for "${query}"`
              : `${totalResults.toLocaleString()} movies`}
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:gap-4">
            {[...Array(18)].map((_, i) => (
              <div
                key={i}
                className="skeleton aspect-[2/3] animate-pulse rounded-xl bg-white/5"
                style={{ animationDelay: `${i * 40}ms` }}
              />
            ))}
          </div>
        ) : movies.length > 0 ? (
          <>
            <ResultsGrid movies={movies} user={user} />
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-[1.1rem] font-medium text-white/50">No movies found</p>
            <p className="mt-2 text-[0.85rem] text-white/30">Try adjusting your filters or search term</p>
          </div>
        )}
      </div>
    </div>
  )
}
