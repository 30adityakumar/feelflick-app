import { useState, useEffect } from 'react'
import Account from "@/app/header/components/Account";
import Search from '@/app/pages/movies/components/Search'
import FilterBar from '@/app/pages/shared/FilterBar'
import ResultsGrid from '@/app/pages/movies/components/ResultsGrid'
import MovieModal from '@/app/pages/shared/MovieModal'
import { supabase } from '@/shared/lib/supabase/client'

export default function MoviesTab({ session }) {
  // --- State for movies, genres, filters, etc. ---
  const [results, setResults] = useState([])
  const [genreMap, setGenreMap] = useState({})
  const [sortBy, setSortBy] = useState('popularity-desc')
  const [yearFilter, setYearFilter] = useState('')
  const [genreFilter, setGenreFilter] = useState('')
  const [watched, setWatched] = useState([])

  // Movie modal state
  const [modalMovie, setModalMovie] = useState(null)
  const closeModal = () => setModalMovie(null)

  // Fetch genre map once
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

  // Fetch watched (for disabling "watched" button)
  useEffect(() => {
    if (!session?.user?.id) return
    supabase
      .from('movies_watched')
      .select('*')
      .eq('user_id', session.user.id)
      .order('id', { ascending: false })
      .then(({ data }) => setWatched(data || []))
  }, [session])

  // --- Filtering/sorting helpers ---
  function sortMovies(movies, sortBy) {
    if (sortBy === 'popularity-desc') return [...movies].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    if (sortBy === 'year-desc') return [...movies].sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''))
    if (sortBy === 'year-asc') return [...movies].sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''))
    if (sortBy === 'rating-desc') return [...movies].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
    if (sortBy === 'rating-asc') return [...movies].sort((a, b) => (a.vote_average || 0) - (b.vote_average || 0))
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
  const watchedIds = new Set(watched.map(m => m.movie_id))
  const allYears = Array.from(new Set(results.map(m => m.release_date && new Date(m.release_date).getFullYear()).filter(Boolean))).sort((a, b) => b - a)
  const allGenres = (() => {
    const genreIdSet = new Set()
    results.forEach(m =>
      Array.isArray(m.genre_ids) &&
      m.genre_ids.forEach(id => genreIdSet.add(id))
    )
    return Array.from(genreIdSet)
      .filter(id => genreMap[id])
      .map(id => ({ id, name: genreMap[id] }))
      .sort((a, b) => a.name.localeCompare(b.name))
  })()
  const clearFilters = () => {
    setSortBy('popularity-desc')
    setYearFilter('')
    setGenreFilter('')
  }

  // --- Sorted/filtered results ---
  const filteredSortedResults = sortMovies(
    filterMoviesByGenre(
      filterMoviesByYear(results, yearFilter),
      genreFilter
    ),
    sortBy
  )

  // --- Mark as watched ---
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
    if (error && error.code !== '23505') return
    // Refresh watched
    const { data } = await supabase
      .from('movies_watched')
      .select('*')
      .eq('user_id', session.user.id)
      .order('id', { ascending: false })
    setWatched(data)
  }

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        background: "#101015",
        padding: "0 3vw 40px 3vw", // Responsive side padding, bottom space
        boxSizing: "border-box"
      }}
    >
      <Account session={session} userName={session?.user?.user_metadata?.name} />
      <div style={{
        margin: "0 auto 38px auto",
        maxWidth: 800, // prevent search bar from stretching too much
        width: "100%",
      }}>
        <Search onResults={setResults} />
      </div>
      <div style={{
        margin: "0 auto 12px auto",
        maxWidth: 950,
        width: "100%"
      }}>
        <FilterBar
          sortBy={sortBy} setSortBy={setSortBy}
          yearFilter={yearFilter} setYearFilter={setYearFilter}
          genreFilter={genreFilter} setGenreFilter={setGenreFilter}
          allYears={allYears}
          allGenres={allGenres}
          sortOptions={[
            { value: 'popularity-desc', label: 'Popularity ↓' },
            { value: 'year-desc', label: 'Year ↓' },
            { value: 'year-asc', label: 'Year ↑' },
            { value: 'rating-desc', label: 'Rating ↓' },
            { value: 'rating-asc', label: 'Rating ↑' }
          ]}
          clearFilters={clearFilters}
        />
      </div>
      <div className="section-bar" style={{
        fontSize: "clamp(1.05rem,1.8vw,1.32rem)",
        margin: "36px 0 18px 0"
      }}>
        <span role="img" aria-label="search">🔍</span> Search Results
      </div>
      <div style={{ minHeight: 200 }}>
        {filteredSortedResults.length ? (
          <ResultsGrid
            results={filteredSortedResults}
            genreMap={genreMap}
            onMarkWatched={markWatched}
            watchedIds={watchedIds}
            gridClass="movie-grid"
            onMovieClick={setModalMovie} // <<--- Pass this
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
      {/* Movie Details Modal */}
      {modalMovie && (
        <MovieModal
          movie={modalMovie}
          open={!!modalMovie}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
