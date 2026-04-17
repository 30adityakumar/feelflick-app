// src/app/pages/movies/MoviesTab.jsx
import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { discoverMovies } from '@/shared/api/tmdb'
import { browseMovies, PAGE_SIZE, TMDB_GENRE_IDS } from '@/shared/api/browse'
import { supabase } from '@/shared/lib/supabase/client'
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
  const [watchedIds, setWatchedIds] = useState([])
  const [surpriseLoading, setSurpriseLoading] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthSession()
  const navigate = useNavigate()

  // ── Read all URL params ────────────────────────────────────────────────────
  const page        = getPage(searchParams)
  const query       = searchParams.get('q')            || ''
  const genre       = searchParams.get('genre')        || ''
  const sortBy      = searchParams.get('sort')         || DEFAULT_SORT
  const decade      = searchParams.get('decade')       || ''
  const minRating   = searchParams.get('rating')       || ''
  const language    = searchParams.get('lang')         || ''
  // Advanced filters
  const runtime     = searchParams.get('runtime')      || ''
  const pacing      = searchParams.get('pacing')       || ''
  const intensity   = searchParams.get('intensity')    || ''
  const depth       = searchParams.get('depth')        || ''
  const vibeRaw     = searchParams.get('vibe')         || ''
  const vibe        = vibeRaw ? vibeRaw.split(',').filter(Boolean) : []
  const director    = searchParams.get('director')     || ''
  const hideWatched = searchParams.get('hideWatched')  || ''
  const dialogue    = searchParams.get('dialogue')     || ''
  const attention   = searchParams.get('attention')    || ''

  const isSearchMode = query.trim().length > 0

  // ── Fetch watched IDs for hide-watched filter ──────────────────────────────
  useEffect(() => {
    if (!user) return
    supabase
      .from('user_history')
      .select('movie_id')
      .eq('user_id', user.id)
      .then(({ data }) => setWatchedIds(data?.map(d => d.movie_id) ?? []))
  }, [user])

  // ── Write URL params ───────────────────────────────────────────────────────
  const updateSearchParams = (updates) => {
    const next = new URLSearchParams(searchParams)

    const set = (key, value, defaultValue = '') => {
      if (value === undefined) return
      const v = typeof value === 'string' ? value.trim() : value
      if (!v || v === defaultValue) next.delete(key)
      else next.set(key, String(v))
    }

    set('q',           updates.q)
    set('genre',       updates.genre)
    set('sort',        updates.sortBy,    DEFAULT_SORT)
    set('decade',      updates.decade)
    set('rating',      updates.minRating)
    set('lang',        updates.language)
    set('runtime',     updates.runtime)
    set('pacing',      updates.pacing)
    set('intensity',   updates.intensity)
    set('depth',       updates.depth)
    set('page',        updates.page, 1)
    set('director',    updates.director)
    set('hideWatched', updates.hideWatched)
    set('dialogue',    updates.dialogue)
    set('attention',   updates.attention)

    // vibe is a comma-joined list
    if (updates.vibe !== undefined) {
      const arr = Array.isArray(updates.vibe) ? updates.vibe : []
      if (arr.length === 0) next.delete('vibe')
      else next.set('vibe', arr.join(','))
    }

    setSearchParams(next, { replace: false })
  }

  const handleSearch = (filters) => updateSearchParams({ ...filters, page: 1 })

  async function handleSurpriseMe() {
    setSurpriseLoading(true)
    try {
      const maxPage = Math.min(totalPages, 10)
      const randomPage = Math.floor(Math.random() * maxPage) + 1
      const data = await browseMovies({
        page: randomPage,
        genre, sortBy, decade, lang: language,
        rating: minRating, runtime, pacing,
        intensity, depth, vibe, director,
        hideWatched: hideWatched === '1', watchedIds,
        dialogue, attention,
      })
      const candidates = data.movies
      if (!candidates.length) return
      const pick = candidates[Math.floor(Math.random() * candidates.length)]
      if (pick?.tmdb_id) navigate(`/movie/${pick.tmdb_id}`)
    } catch (err) {
      console.error('[SurpriseMe] error:', err)
    } finally {
      setSurpriseLoading(false)
    }
  }

  const handleClearAll = () => {
    updateSearchParams({
      q: '', genre: '', sortBy: DEFAULT_SORT, decade: '', minRating: '', language: '',
      runtime: '', pacing: '', intensity: '', depth: '', vibe: [],
      director: '', hideWatched: '', dialogue: '', attention: '', page: 1,
    })
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
            director, hideWatched: hideWatched === '1', watchedIds, dialogue, attention,
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
  }, [page, query, genre, sortBy, decade, minRating, language, runtime, pacing, intensity, depth, vibeRaw, director, hideWatched, dialogue, attention, watchedIds]) // eslint-disable-line react-hooks/exhaustive-deps

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
        className="sticky top-0 z-40 border-b border-white/[0.06] backdrop-blur-xl"
        style={{ background: 'rgba(8, 6, 13, 0.92)', paddingTop: 'var(--hdr-h, 64px)' }}
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
            director={director}
            hideWatched={hideWatched}
            dialogue={dialogue}
            attention={attention}
            user={user}
            onSearch={handleSearch}
          />
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:px-8 lg:px-12">
        {/* Result count + Surprise me */}
        {!loading && totalResults > 0 && (
          <div className="mb-5 flex items-center justify-between">
            <p className="text-[0.8rem]" style={{ color: 'rgba(248,250,252,0.35)' }}>
              {isSearchMode
                ? `${totalResults.toLocaleString()} results for "${query}"`
                : `${totalResults.toLocaleString()} movies`}
            </p>
            {!isSearchMode && (
              <button
                onClick={handleSurpriseMe}
                disabled={surpriseLoading || totalResults === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white/80 hover:border-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
              >
                {surpriseLoading ? <span className="animate-spin inline-block">⟳</span> : '🎲'}
                Surprise me
              </button>
            )}
          </div>
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
          <div className="py-20 text-center">
            <p className="text-white/40 text-base mb-2">
              No films match these filters
            </p>
            <p className="text-white/25 text-sm mb-6">
              Try loosening some criteria
            </p>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-sm text-purple-400 border border-purple-500/30 px-4 py-2 rounded-full hover:border-purple-400/50 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
