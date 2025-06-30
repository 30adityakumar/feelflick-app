import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

import AuthEmailPassword from './AuthEmailPassword'
import Account from './Account'
import Search from './components/Search'

import Header from './components/Header'
import ResultsGrid from './components/ResultsGrid'
import WatchedHistory from './components/WatchedHistory'

export default function App () {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const [results, setResults] = useState([])
  const [watched, setWatched] = useState([])
  const [genreMap, setGenreMap] = useState({})

  const [searchSortBy, setSearchSortBy] = useState('year-desc')
  const [watchedSortBy, setWatchedSortBy] = useState('year-desc')
  const [searchYearFilter, setSearchYearFilter] = useState('')
  const [watchedYearFilter, setWatchedYearFilter] = useState('')

  const watchedIds = new Set(watched.map(m => m.movie_id))

  useEffect(() => {
    fetch(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US`
    )
      .then(res => res.json())
      .then(({ genres }) => setGenreMap(
        Object.fromEntries(genres.map(g => [g.id, g.name]))
      ))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!session?.user?.id) return
    supabase
      .from('movies_watched')
      .select('*')
      .eq('user_id', session.user.id)
      .order('id', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error.message)
        else setWatched(data)
      })
  }, [session])

  const markWatched = async (movie) => {
    if (!session || watchedIds.has(movie.id)) return

    const { error } = await supabase.from('movies_watched').insert({
      user_id:      session.user.id,
      movie_id:     movie.id,
      title:        movie.title,
      poster:       movie.poster_path,
      release_date: movie.release_date ?? null,
      vote_average: movie.vote_average ?? null,
      genre_ids:    movie.genre_ids ?? []
    })

    if (error && error.code !== '23505') {
      return console.error('Insert failed:', error.message)
    }

    const { data } = await supabase
      .from('movies_watched')
      .select('*')
      .eq('user_id', session.user.id)
      .order('id', { ascending: false })
    setWatched(data)
  }

  // --- Sorting/Filtering helpers ---
  function sortMovies(movies, sortBy) {
    if (sortBy === 'year-desc') {
      return [...movies].sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''))
    }
    if (sortBy === 'year-asc') {
      return [...movies].sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''))
    }
    if (sortBy === 'rating-desc') {
      return [...movies].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
    }
    if (sortBy === 'rating-asc') {
      return [...movies].sort((a, b) => (a.vote_average || 0) - (b.vote_average || 0))
    }
    return movies
  }

  function filterMoviesByYear(movies, year) {
    if (!year) return movies
    return movies.filter(m =>
      m.release_date && new Date(m.release_date).getFullYear().toString() === year
    )
  }

  // --- Prepare sorted/filtered arrays ---
  const sortedFilteredResults = sortMovies(
    filterMoviesByYear(results, searchYearFilter),
    searchSortBy
  )
  const sortedFilteredWatched = sortMovies(
    filterMoviesByYear(watched, watchedYearFilter),
    watchedSortBy
  )

  // --- Collect all years present for filter dropdowns ---
  const allResultYears = Array.from(new Set(results
    .map(m => m.release_date && new Date(m.release_date).getFullYear())
    .filter(Boolean)
  )).sort((a, b) => b - a)

  const allWatchedYears = Array.from(new Set(watched
    .map(m => m.release_date && new Date(m.release_date).getFullYear())
    .filter(Boolean)
  )).sort((a, b) => b - a)

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white px-4">
        <AuthEmailPassword />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 pb-10">
      <Header />
      <Account session={session} />
      <div className="mt-8 mb-6 flex justify-center">
        <div className="w-full max-w-xl bg-white/10 p-4 rounded-lg shadow-md">
          <Search onResults={setResults} />
        </div>
      </div>
      {/* --- SEARCH RESULTS SORT/FILTER CONTROLS --- */}
      <div className="flex flex-wrap items-center gap-4 mb-3 justify-center">
        <label>
          <span className="text-gray-400 text-xs mr-1">Sort:</span>
          <select
            value={searchSortBy}
            onChange={e => setSearchSortBy(e.target.value)}
            className="bg-zinc-900 text-white border rounded p-1 text-xs"
          >
            <option value="year-desc">Year ↓</option>
            <option value="year-asc">Year ↑</option>
            <option value="rating-desc">Rating ↓</option>
            <option value="rating-asc">Rating ↑</option>
          </select>
        </label>
        <label>
          <span className="text-gray-400 text-xs mr-1">Year:</span>
          <select
            value={searchYearFilter}
            onChange={e => setSearchYearFilter(e.target.value)}
            className="bg-zinc-900 text-white border rounded p-1 text-xs"
          >
            <option value="">All</option>
            {allResultYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>
      <ResultsGrid
        results={sortedFilteredResults}
        genreMap={genreMap}
        onMarkWatched={markWatched}
        watchedIds={watchedIds}
      />
      {/* --- WATCHED HISTORY SORT/FILTER CONTROLS --- */}
      <div className="flex flex-wrap items-center gap-4 mt-10 mb-3 justify-center">
        <label>
          <span className="text-gray-400 text-xs mr-1">Sort:</span>
          <select
            value={watchedSortBy}
            onChange={e => setWatchedSortBy(e.target.value)}
            className="bg-zinc-900 text-white border rounded p-1 text-xs"
          >
            <option value="year-desc">Year ↓</option>
            <option value="year-asc">Year ↑</option>
            <option value="rating-desc">Rating ↓</option>
            <option value="rating-asc">Rating ↑</option>
          </select>
        </label>
        <label>
          <span className="text-gray-400 text-xs mr-1">Year:</span>
          <select
            value={watchedYearFilter}
            onChange={e => setWatchedYearFilter(e.target.value)}
            className="bg-zinc-900 text-white border rounded p-1 text-xs"
          >
            <option value="">All</option>
            {allWatchedYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>
      <WatchedHistory
        watched={sortedFilteredWatched}
        genreMap={genreMap}
      />
    </div>
  )
}
