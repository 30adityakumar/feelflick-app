import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

import AuthEmailPassword from './AuthEmailPassword'
import Account from './components/Account'
import Search from './components/Search'
import Header from './components/Header'
import ResultsGrid from './components/ResultsGrid'
import WatchedHistory from './components/WatchedHistory'
import FilterBar from './components/FilterBar'

export default function App () {
  // 1. Auth/session state
  const [session, setSession] = useState(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  // 2. App state
  const [results, setResults] = useState([])
  const [watched, setWatched] = useState([])
  const [genreMap, setGenreMap] = useState({})

  // 3. Filters and sorting
  const [searchSortBy, setSearchSortBy] = useState('popularity-desc')
  const [watchedSortBy, setWatchedSortBy] = useState('added-desc')
  const [searchYearFilter, setSearchYearFilter] = useState('')
  const [watchedYearFilter, setWatchedYearFilter] = useState('')
  const [searchGenreFilter, setSearchGenreFilter] = useState('')
  const [watchedGenreFilter, setWatchedGenreFilter] = useState('')
  const watchedIds = new Set(watched.map(m => m.movie_id))

  // 4. Fetch genres (for mapping genre ids to names)
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

  // 5. Fetch watched history for the user
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

  // 6. Mark movie as watched
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
    if (error && error.code !== '23505') return console.error('Insert failed:', error.message)
    // Refresh watched list
    const { data } = await supabase
      .from('movies_watched')
      .select('*')
      .eq('user_id', session.user.id)
      .order('id', { ascending: false })
    setWatched(data)
  }

  // 7. Remove a movie from watched history
  const removeFromWatched = async (movie_id) => {
    if (!session?.user?.id) return
    await supabase
      .from('movies_watched')
      .delete()
      .eq('user_id', session.user.id)
      .eq('movie_id', movie_id)
    // Refresh watched list
    const { data } = await supabase
      .from('movies_watched')
      .select('*')
      .eq('user_id', session.user.id)
      .order('id', { ascending: false })
    setWatched(data)
  }

  // 8. Helpers for sort and filtering logic
  function sortMovies(movies, sortBy) {
    if (sortBy === 'popularity-desc') return [...movies].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    if (sortBy === 'year-desc')       return [...movies].sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''))
    if (sortBy === 'year-asc')        return [...movies].sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''))
    if (sortBy === 'rating-desc')     return [...movies].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
    if (sortBy === 'rating-asc')      return [...movies].sort((a, b) => (a.vote_average || 0) - (b.vote_average || 0))
    if (sortBy === 'added-desc')      return [...movies].sort((a, b) => (b.id || 0) - (a.id || 0))
    if (sortBy === 'added-asc')       return [...movies].sort((a, b) => (a.id || 0) - (b.id || 0))
    return movies
  }
  function filterMoviesByYear(movies, year) {
    if (!year) return movies
    return movies.filter(m => m.release_date && new Date(m.release_date).getFullYear().toString() === year)
  }
  function filterMoviesByGenre(movies, genreId) {
    if (!genreId) return movies
    return movies.filter(m => Array.isArray(m.genre_ids) && m.genre_ids.includes(Number(genreId)))
  }

  // 9. Prepare filtered & sorted arrays for each grid
  const sortedFilteredResults = sortMovies(
    filterMoviesByGenre(
      filterMoviesByYear(results, searchYearFilter),
      searchGenreFilter
    ),
    searchSortBy
  )
  const sortedFilteredWatched = sortMovies(
    filterMoviesByGenre(
      filterMoviesByYear(watched, watchedYearFilter),
      watchedGenreFilter
    ),
    watchedSortBy
  )

  // 10. Collect filter options for year & genre dropdowns
  const allResultYears = Array.from(new Set(results.map(m => m.release_date && new Date(m.release_date).getFullYear()).filter(Boolean))).sort((a, b) => b - a)
  const allWatchedYears = Array.from(new Set(watched.map(m => m.release_date && new Date(m.release_date).getFullYear()).filter(Boolean))).sort((a, b) => b - a)
  function getAllGenresFromMovies(movies) {
    const genreIdSet = new Set()
    movies.forEach(m =>
      Array.isArray(m.genre_ids) &&
      m.genre_ids.forEach(id => genreIdSet.add(id))
    )
    return Array.from(genreIdSet)
      .filter(id => genreMap[id])
      .map(id => ({ id, name: genreMap[id] }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }
  const allResultGenres = getAllGenresFromMovies(results)
  const allWatchedGenres = getAllGenresFromMovies(watched)

  // 11. Filter clear helpers
  const clearSearchFilters = () => {
    setSearchSortBy('popularity-desc')
    setSearchYearFilter('')
    setSearchGenreFilter('')
  }
  const clearWatchedFilters = () => {
    setWatchedSortBy('added-desc')
    setWatchedYearFilter('')
    setWatchedGenreFilter('')
  }

  // 12. Unauthenticated view
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white px-4">
        <AuthEmailPassword />
      </div>
    )
  }

  // 13. Main authenticated app layout
  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-10">
      <Header />
      <div className="container">
        <Account session={session} userName={session?.user?.user_metadata?.name} />
        {/* Search Bar */}
        <div style={{ marginTop: 16, marginBottom: 32, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
          <Search onResults={setResults} />
        </div>
        {/* FilterBar: Search */}
        <FilterBar
          sortBy={searchSortBy} setSortBy={setSearchSortBy}
          yearFilter={searchYearFilter} setYearFilter={setSearchYearFilter}
          genreFilter={searchGenreFilter} setGenreFilter={setSearchGenreFilter}
          allYears={allResultYears}
          allGenres={allResultGenres}
          sortOptions={[
            { value: 'popularity-desc', label: 'Popularity ↓' },
            { value: 'year-desc', label: 'Year ↓' },
            { value: 'year-asc', label: 'Year ↑' },
            { value: 'rating-desc', label: 'Rating ↓' },
            { value: 'rating-asc', label: 'Rating ↑' }
          ]}
          clearFilters={clearSearchFilters}
        />
        {/* SEARCH RESULTS GRID + Empty State */}
        <div style={{ margin: '32px auto 40px auto', minHeight: 180 }}>
          {sortedFilteredResults.length ? (
            <ResultsGrid
              results={sortedFilteredResults}
              genreMap={genreMap}
              onMarkWatched={markWatched}
              watchedIds={watchedIds}
            />
          ) : (
            <div style={{
              color: '#aaa',
              textAlign: 'center',
              fontSize: 18,
              fontWeight: 500,
              margin: '2.5rem 0'
            }}>
              <span role="img" aria-label="No results" style={{ fontSize: 34, display: 'block', marginBottom: 6 }}>😕</span>
              No movies found. Try a different search!
            </div>
          )}
        </div>
        {/* FilterBar: Watched */}
        <FilterBar
          sortBy={watchedSortBy} setSortBy={setWatchedSortBy}
          yearFilter={watchedYearFilter} setYearFilter={setWatchedYearFilter}
          genreFilter={watchedGenreFilter} setGenreFilter={setWatchedGenreFilter}
          allYears={allWatchedYears}
          allGenres={allWatchedGenres}
          sortOptions={[
            { value: 'added-desc', label: 'Order Added ↓' },
            { value: 'added-asc', label: 'Order Added ↑' },
            { value: 'year-desc', label: 'Year ↓' },
            { value: 'year-asc', label: 'Year ↑' },
            { value: 'rating-desc', label: 'Rating ↓' },
            { value: 'rating-asc', label: 'Rating ↑' }
          ]}
          clearFilters={clearWatchedFilters}
        />
        {/* WATCHED HISTORY GRID + Empty State */}
        <div style={{ margin: '32px auto 0 auto', minHeight: 180 }}>
          {sortedFilteredWatched.length ? (
            <WatchedHistory
              watched={sortedFilteredWatched}
              genreMap={genreMap}
              onRemove={removeFromWatched}
            />
          ) : (
            <div style={{
              color: '#aaa',
              textAlign: 'center',
              fontSize: 18,
              fontWeight: 500,
              margin: '2.5rem 0'
            }}>
              <span role="img" aria-label="Empty" style={{ fontSize: 30, display: 'block', marginBottom: 6 }}>🍿</span>
              No watched movies yet. Mark some as watched to see them here!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
