import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

import AuthPage from './AuthPage'
import Account from './components/Account'
import Search from './components/Search'
import Header from './components/Header'
import ResultsGrid from './components/ResultsGrid'
import WatchedHistory from './components/WatchedHistory'
import FilterBar from './components/FilterBar'

export default function App() {
  // --- Authentication session ---
  const [session, setSession] = useState(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  // --- App state ---
  const [results, setResults] = useState([])
  const [watched, setWatched] = useState([])
  const [genreMap, setGenreMap] = useState({})

  // Filters and sorting
  const [searchSortBy, setSearchSortBy] = useState('popularity-desc')
  const [watchedSortBy, setWatchedSortBy] = useState('added-desc')
  const [searchYearFilter, setSearchYearFilter] = useState('')
  const [watchedYearFilter, setWatchedYearFilter] = useState('')
  const [searchGenreFilter, setSearchGenreFilter] = useState('')
  const [watchedGenreFilter, setWatchedGenreFilter] = useState('')
  const watchedIds = new Set(watched.map(m => m.movie_id))

  // --- NAVIGATION TAB STATE ---
  const [activeTab, setActiveTab] = useState('movies') // movies | recommendations | watched

  // Fetch genres
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

  // Fetch watched history
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

  // Mark movie as watched
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

  // Remove a movie from watched history
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

  // Helpers for sort/filtering
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

  // Prepare filtered & sorted arrays
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

  // Collect filter options for dropdowns
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

  // Filter clear helpers
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

  // Handle sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  // Handle search from header (optional: tie into your movie search API)
  const handleHeaderSearch = (query) => {
    // You could set a search state and trigger Search component logic here
    // For now, just focus the Search bar or pass down if needed
  }

  // --- UNAUTHENTICATED VIEW ---
  if (!session) {
    return <AuthPage />
  }

  // --- AUTHENTICATED VIEW: HEADER NAVIGATION ---
  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-10">
      <Header
        userName={session?.user?.user_metadata?.name || "Account"}
        onTabChange={setActiveTab}
        activeTab={activeTab}
        onSignOut={handleSignOut}
        onSearch={handleHeaderSearch}
      />
      <div className="container">

        {/* --- MOVIES TAB --- */}
        {activeTab === 'movies' && (
          <>
            <Account session={session} userName={session?.user?.user_metadata?.name} />
            <div style={{ margin: "0 auto 38px auto", maxWidth: 700 }}>
              <Search onResults={setResults} />
            </div>
            <div className="floating-bar">
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
            </div>
            <div className="section-bar">
              <span role="img" aria-label="search">🔍</span> Search Results
            </div>
            <div style={{ minHeight: 200 }}>
              {sortedFilteredResults.length ? (
                <ResultsGrid
                  results={sortedFilteredResults}
                  genreMap={genreMap}
                  onMarkWatched={markWatched}
                  watchedIds={watchedIds}
                  gridClass="movie-grid"
                />
              ) : (
                <div style={{
                  color: '#aaa', textAlign: 'center', fontSize: 18,
                  fontWeight: 500, margin: '2.5rem 0'
                }}>
                  <span role="img" aria-label="No results" style={{ fontSize: 34, display: 'block', marginBottom: 6 }}>😕</span>
                  No movies found. Try a different search!
                </div>
              )}
            </div>
          </>
        )}

        {/* --- RECOMMENDATIONS TAB (Placeholder for now) --- */}
        {activeTab === 'recommendations' && (
          <div style={{ margin: "48px auto", maxWidth: 700, textAlign: "center" }}>
            <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 18 }}>🎯 Personalized Recommendations</h2>
            <p style={{ color: "#ccc", fontSize: 18 }}>
              This will show you movies based on your watch history and mood (coming soon!)<br />
              For now, check your watched history or search for movies you love.
            </p>
          </div>
        )}

        {/* --- WATCHED TAB --- */}
        {activeTab === 'watched' && (
          <>
            <div className="floating-bar" style={{ margin: "40px auto 0 auto" }}>
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
            </div>
            <div className="section-bar">
              <span role="img" aria-label="watched">🎬</span> Watched History
            </div>
            <div style={{ minHeight: 200 }}>
              {sortedFilteredWatched.length ? (
                <WatchedHistory
                  watched={sortedFilteredWatched}
                  genreMap={genreMap}
                  onRemove={removeFromWatched}
                  gridClass="movie-grid"
                />
              ) : (
                <div style={{
                  color: '#aaa', textAlign: 'center', fontSize: 18,
                  fontWeight: 500, margin: '2.5rem 0'
                }}>
                  <span role="img" aria-label="Empty" style={{ fontSize: 30, display: 'block', marginBottom: 6 }}>🍿</span>
                  No watched movies yet. Mark some as watched to see them here!
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
