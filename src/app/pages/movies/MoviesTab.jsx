import { useState, useEffect } from 'react'
import Search from '@/app/pages/movies/components/Search'
import FilterBar from '@/app/pages/shared/FilterBar'
import ResultsGrid from '@/app/pages/movies/components/ResultsGrid'
import MovieModal from '@/app/pages/shared/MovieModal'
import { supabase } from '@/shared/lib/supabase/client'

export default function MoviesTab({ session }) {
  // State for movies, genres, filters, etc.
  const [results, setResults] = useState([])
  const [genreMap, setGenreMap] = useState({})
  const [sortBy, setSortBy] = useState('popularity-desc')
  const [yearFilter, setYearFilter] = useState('')
  const [genreFilter, setGenreFilter] = useState('')
  const [watched, setWatched] = useState([])
  const [modalMovie, setModalMovie] = useState(null)
  const closeModal = () => setModalMovie(null)

  // Fetch genre map
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

  // Filtering/sorting helpers
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

  // Sorted/filtered results
  const filteredSortedResults = sortMovies(
    filterMoviesByGenre(
      filterMoviesByYear(results, yearFilter),
      genreFilter
    ),
    sortBy
  )

  // Mark as watched
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
    <div className="min-h-screen bg-[#101015] w-full pb-12 px-3 sm:px-6 md:px-10 lg:px-20 xl:px-32 box-border">

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto w-full mb-7">
        <Search onResults={setResults} />
      </div>

      {/* Filter Bar */}
      <div className="max-w-3xl mx-auto w-full mb-7">
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

      {/* Section Title */}
      <div className="max-w-6xl mx-auto font-bold text-lg md:text-xl text-white mt-2 mb-5 flex items-center gap-2">
        <span role="img" aria-label="search" className="text-2xl">🔍</span>
        Search Results
      </div>

      {/* Movie Results */}
      <div className="max-w-6xl mx-auto min-h-[200px]">
        {filteredSortedResults.length ? (
          <ResultsGrid
            results={filteredSortedResults}
            genreMap={genreMap}
            onMarkWatched={markWatched}
            watchedIds={watchedIds}
            gridClass="movie-grid"
            onMovieClick={setModalMovie}
          />
        ) : (
          <div className="text-zinc-400 text-center text-base md:text-lg font-medium my-16">
            <span role="img" aria-label="No results" className="block text-3xl mb-2">😕</span>
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
