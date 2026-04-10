// src/app/pages/movies/MoviesTab.jsx
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { discoverMovies } from '@/shared/api/tmdb'
import { browseMovies, PAGE_SIZE, TMDB_GENRE_IDS } from '@/shared/api/browse'
import BrowseSearchBar, { DEFAULT_SORT } from './components/BrowseSearchBar'
import ResultsGrid from './components/ResultsGrid'
import Pagination from './components/Pagination'
import { useAuthSession } from '@/shared/hooks/useAuthSession'

function getPage(searchParams) {
  const value = Number(searchParams.get('page') || '1')
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1
}

export default function MoviesTab() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthSession()

  // ── Read all URL params ────────────────────────────────────────────────────
  const page      = getPage(searchParams)
  const query     = searchParams.get('q')         || ''
  const genre     = searchParams.get('genre')     || ''
  const sortBy    = searchParams.get('sort')      || DEFAULT_SORT
  const decade    = searchParams.get('decade')    || ''
  const minRating = searchParams.get('rating')    || ''
  const language  = searchParams.get('lang')      || ''
  // Advanced filters
  const runtime   = searchParams.get('runtime')   || ''
  const pacing    = searchParams.get('pacing')    || ''
  const intensity = searchParams.get('intensity') || ''
  const depth     = searchParams.get('depth')     || ''
  const vibeRaw   = searchParams.get('vibe')      || ''
  const vibe      = vibeRaw ? vibeRaw.split(',').filter(Boolean) : []

  const isSearchMode = query.trim().length > 0

  // ── Write URL params ───────────────────────────────────────────────────────
  const updateSearchParams = (updates) => {
    const next = new URLSearchParams(searchParams)

    const set = (key, value, defaultValue = '') => {
      if (value === undefined) return
      const v = typeof value === 'string' ? value.trim() : value
      if (!v || v === defaultValue) next.delete(key)
      else next.set(key, String(v))
    }

    set('q',         updates.q)
    set('genre',     updates.genre)
    set('sort',      updates.sortBy,    DEFAULT_SORT)
    set('decade',    updates.decade)
    set('rating',    updates.minRating)
    set('lang',      updates.language)
    set('runtime',   updates.runtime)
    set('pacing',    updates.pacing)
    set('intensity', updates.intensity)
    set('depth',     updates.depth)
    set('page',      updates.page, 1)

    // vibe is a comma-joined list
    if (updates.vibe !== undefined) {
      const arr = Array.isArray(updates.vibe) ? updates.vibe : []
      if (arr.length === 0) next.delete('vibe')
      else next.set('vibe', arr.join(','))
    }

    setSearchParams(next, { replace: false })
  }

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true
    async function fetchMovies() {
      setLoading(true)
      try {
        if (isSearchMode) {
          // Text search → TMDB discover with text query + TMDB-compatible filters
          const SUPABASE_ONLY_SORTS = new Set([
            'ff_rating.desc', 'discovery_potential.desc',
            'cult_status_score.desc', 'accessibility_score.desc',
          ])
          const tmdbSortBy = SUPABASE_ONLY_SORTS.has(sortBy) ? 'popularity.desc' : sortBy

          // Decade → TMDB date range
          let releaseDateGte, releaseDateLte
          if (decade === 'pre1970') {
            releaseDateLte = '1969-12-31'
          } else if (decade) {
            const start = Number(decade)
            releaseDateGte = `${start}-01-01`
            releaseDateLte = `${start + 9}-12-31`
          }

          // Runtime bucket → minute ranges
          const RUNTIME_RANGES = {
            short:  { runtimeLte: 89 },
            medium: { runtimeGte: 90, runtimeLte: 130 },
            long:   { runtimeGte: 131, runtimeLte: 180 },
            epic:   { runtimeGte: 181 },
          }
          const tmdbRuntime = RUNTIME_RANGES[runtime] || {}

          const data = await discoverMovies({
            withTextQuery: query,
            page,
            sortBy: tmdbSortBy,
            genreIds: genre && TMDB_GENRE_IDS[genre] ? [TMDB_GENRE_IDS[genre]] : undefined,
            language: language || undefined,
            voteAverageGte: minRating ? Number(minRating) : undefined,
            releaseDateGte,
            releaseDateLte,
            ...tmdbRuntime,
          })
          if (!active) return
          setMovies(data.results || [])
          setTotalPages(Math.min(data.total_pages || 1, 500))
          setTotalResults(data.total_results || 0)
        } else {
          // Filter browse → Supabase (exposes our computed fields)
          const data = await browseMovies({
            page, genre, sortBy, decade, lang: language,
            rating: minRating, runtime, pacing, intensity, depth, vibe,
          })
          if (!active) return
          setMovies(data.movies)
          setTotalPages(data.totalPages)
          setTotalResults(data.totalCount)
        }
      } catch (err) {
        console.error('[Browse] fetch error:', err)
        if (active) { setMovies([]); setTotalResults(0) }
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchMovies()
    return () => { active = false }
  }, [page, query, genre, sortBy, decade, minRating, language, runtime, pacing, intensity, depth, vibeRaw]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (filters) => updateSearchParams({ ...filters, page: 1 })

  const handlePageChange = (newPage) => {
    updateSearchParams({ page: newPage })
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  }

  const skeletonCount = PAGE_SIZE

  return (
    <div className="min-h-screen text-white" style={{ background: 'var(--color-bg)' }}>
      {/* Sticky filter bar */}
      <div
        className="sticky top-0 z-40 border-b border-white/[0.06] pt-20 pb-0 backdrop-blur-xl md:pt-24"
        style={{ background: 'rgba(8, 6, 13, 0.92)' }}
      >
        <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
          <BrowseSearchBar
            query={query}
            genre={genre}
            sortBy={sortBy}
            decade={decade}
            minRating={minRating}
            language={language}
            runtime={runtime}
            pacing={pacing}
            intensity={intensity}
            depth={depth}
            vibe={vibe}
            onSearch={handleSearch}
          />
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:px-8 lg:px-12">
        {/* Result count */}
        {!loading && totalResults > 0 && (
          <p className="mb-5 text-[0.8rem]" style={{ color: 'rgba(248,250,252,0.35)' }}>
            {isSearchMode
              ? `${totalResults.toLocaleString()} results for "${query}"`
              : `${totalResults.toLocaleString()} movies`}
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:gap-4">
            {[...Array(skeletonCount)].map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] animate-pulse rounded-xl"
                style={{
                  background: 'rgba(88,28,135,0.08)',
                  animationDelay: `${i * 30}ms`,
                }}
              />
            ))}
          </div>
        ) : movies.length > 0 ? (
          <>
            <ResultsGrid movies={movies} user={user} isSearchMode={isSearchMode} />
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: 'rgba(88,28,135,0.15)', border: '1px solid rgba(168,85,247,0.2)' }}
            >
              <span className="text-2xl">🎬</span>
            </div>
            <p className="text-[1.05rem] font-semibold" style={{ color: 'rgba(248,250,252,0.6)' }}>
              No movies found
            </p>
            <p className="mt-2 text-[0.85rem]" style={{ color: 'rgba(248,250,252,0.3)' }}>
              Try adjusting your filters or search term
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
