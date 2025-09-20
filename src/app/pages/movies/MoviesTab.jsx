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
 * - Sources data from TMDb discover endpoint
 * - Syncs `page` in the URL (?page=) so refresh/deeplink works
 * - Ready to extend with sort/genre/year later
 */
export default function MoviesTab() {
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page') || 1))

  // future hooks (if you wire FilterBar): sortBy, genreIds, year
  const sortBy = 'popularity.desc'
  const genreIds = undefined
  const year = undefined

  const { data, error, loading, run } = useAsync()

  const totalPages = useMemo(() => {
    // TMDb caps at 500 pages; stay inside bounds
    const raw = data?.total_pages ?? 1
    return Math.min(500, Math.max(1, raw))
  }, [data])

  useEffect(() => {
    run((signal) =>
      discoverMovies({ page, sortBy, genreIds, year, signal })
    )
  }, [page, sortBy, genreIds, year, run])

  function handlePageChange(nextPage) {
    const np = Math.min(totalPages, Math.max(1, nextPage))
    params.set('page', String(np))
    setParams(params, { replace: false })
    // `useEffect` will re-run and fetch the new page
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4">
        <BrowseSearchBar />
      </div>

      <h1 className="mb-3 text-xl font-semibold text-white">Popular Movies</h1>

      {loading && !data ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner className="text-white/70" />
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load movies"
          detail={error?.message}
          onRetry={() => run((s) => discoverMovies({ page, sortBy, genreIds, year, signal: s }))}
        />
      ) : (
        <>
          <ResultsGrid results={data?.results ?? []} />
          <Pagination
            className="mt-6"
            page={page}
            totalPages={totalPages}
            onChange={handlePageChange}
          />
        </>
      )}
    </div>
  )
}