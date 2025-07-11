import { useState, useEffect } from 'react'
import FilterBar from '@/features/preferences/components/FilterBar'
import WatchedHistory from '@/features/history/components/WatchedHistory'
import MovieModal from '@/features/movies/components/MovieModal'
import { supabase } from '@/shared/lib/supabase/client'

export default function WatchedTab({ session }) {
  const [watched, setWatched] = useState([])
  const [genreMap, setGenreMap] = useState({})
  const [sortBy, setSortBy] = useState('added-desc')
  const [yearFilter, setYearFilter] = useState('')
  const [genreFilter, setGenreFilter] = useState('')

  // Modal state
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

  // Fetch watched history
  useEffect(() => {
    if (!session?.user?.id) return
    supabase
      .from('movies_watched')
      .select('*')
      .eq('user_id', session.user.id)
      .order('id', { ascending: false })
      .then(({ data }) => setWatched(data || []))
  }, [session])

  // Filtering/sorting helpers (same as before)
  function sortMovies(movies, sortBy) {
    if (sortBy === 'added-desc') return [...movies].sort((a, b) => (b.id || 0) - (a.id || 0))
    if (sortBy === 'added-asc') return [...movies].sort((a, b) => (a.id || 0) - (b.id || 0))
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
  const allYears = Array.from(new Set(watched.map(m => m.release_date && new Date(m.release_date).getFullYear()).filter(Boolean))).sort((a, b) => b - a)
  const allGenres = (() => {
    const genreIdSet = new Set()
    watched.forEach(m =>
      Array.isArray(m.genre_ids) &&
      m.genre_ids.forEach(id => genreIdSet.add(id))
    )
    return Array.from(genreIdSet)
      .filter(id => genreMap[id])
      .map(id => ({ id, name: genreMap[id] }))
      .sort((a, b) => a.name.localeCompare(b.name))
  })()
  const clearFilters = () => {
    setSortBy('added-desc')
    setYearFilter('')
    setGenreFilter('')
  }

  // Remove from watched
  const removeFromWatched = async (movie_id) => {
    if (!session?.user?.id) return
    await supabase
      .from('movies_watched')
      .delete()
      .eq('user_id', session.user.id)
      .eq('movie_id', movie_id)
    // Refresh watched
    const { data } = await supabase
      .from('movies_watched')
      .select('*')
      .eq('user_id', session.user.id)
      .order('id', { ascending: false })
    setWatched(data)
  }

  // Sorted/filtered watched movies
  const filteredSortedWatched = sortMovies(
    filterMoviesByGenre(
      filterMoviesByYear(watched, yearFilter),
      genreFilter
    ),
    sortBy
  )

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
      <div style={{
        margin: "0 auto 16px auto",
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
            { value: 'added-desc', label: 'Order Added ↓' },
            { value: 'added-asc', label: 'Order Added ↑' },
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
        <span role="img" aria-label="watched">🎬</span> Watched History
      </div>
      <div style={{ minHeight: 200 }}>
        {filteredSortedWatched.length ? (
          <WatchedHistory
            watched={filteredSortedWatched}
            genreMap={genreMap}
            onRemove={removeFromWatched}
            gridClass="movie-grid"
            onMovieClick={setModalMovie} // <-- Pass handler!
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
