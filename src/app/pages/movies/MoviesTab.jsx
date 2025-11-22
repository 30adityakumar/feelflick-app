// src/app/pages/movies/MoviesTab.jsx
import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import BrowseSearchBar from './components/BrowseSearchBar'
import ResultsGrid from './components/ResultsGrid'
import Pagination from './components/Pagination'

import Spinner from '@/shared/ui/Spinner'
import ErrorState from '@/shared/ui/ErrorState'
import { discoverMovies } from '@/shared/api/tmdb'
import { useAsync } from '@/shared/hooks/useAsync'

/**
 * MoviesTab
 * - Controller for the browse/list page
 * - Uses TMDB Discover API
 * - Syncs `page` to URL (?page=)
 */
export default function MoviesTab() {
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page') || 1))

  // You can later expose these as filters/sorts
  const sortBy = 'popularity.desc'
  const genreIds = undefined
  const year = undefined

  const { data, error, loading, run } = useAsync()

  const totalPages = useMemo(() => {
    const raw = data?.total_pages ?? 1
    return Math.min(500, Math.max(1, raw))
  }, [data])

  useEffect(() => {
    run((signal) =>
      discoverMovies({
        page,
        sortBy,
        genreIds,
        year,
        signal,
      })
    )
  }, [page, sortBy, genreIds, year, run])

  function handlePageChange(nextPage) {
    const np = Math.min(totalPages, Math.max(1, nextPage))
    params.set('page', String(np))
    setParams(params, { replace: false })
  }

  const results = data?.results ?? []

  return (
    <div className="min-h-screen bg-black text-white pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
        {/* Page header */}
        <header className="pt-24 pb-6 flex flex-col gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Browse Movies
            </h1>
            <p className="mt-1 text-sm sm:text-base text-white/70 max-w-2xl">
              Discover popular hits, hidden gems, and everything in between powered by TMDB.
            </p>
          </div>
          <div className="mt-2 max-w-xl">
            <BrowseSearchBar />
          </div>
        </header>

        {/* Content */}
        {loading && !results.length && (
          <div className="py-16 flex justify-center">
            <Spinner />
          </div>
        )}

        {error && !loading && (
          <div className="py-10">
            <ErrorState
              title="Unable to load movies"
              description="Please try again in a moment."
            />
          </div>
        )}

        {!loading && !error && (
          <>
            <ResultsGrid results={results} />

            <div className="mt-8 flex justify-center">
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
