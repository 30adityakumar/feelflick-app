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
  const [searchGenreFilter, setSearchGenreFilter] = useState('')
  const [watchedGenreFilter, setWatchedGenreFilter] = useState('')

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
  
  const removeFromWatched = async (movie_id) => {
  if (!session?.user?.id) return;
  await supabase
    .from('movies_watched')
    .delete()
    .eq('user_id', session.user.id)
    .eq('movie_id', movie_id);
  // refresh watched
  const { data } = await supabase
    .from('movies_watched')
    .select('*')
    .eq('user_id', session.user.id)
    .order('id', { ascending: false });
  setWatched(data);
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

  function filterMoviesByGenre(movies, genreId) {
    if (!genreId) return movies
    return movies.filter(m =>
      Array.isArray(m.genre_ids) && m.genre_ids.includes(Number(genreId))
    )
  }

  // --- Prepare sorted/filtered arrays ---
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

  // --- Collect all years present for filter dropdowns ---
  const allResultYears = Array.from(new Set(results
    .map(m => m.release_date && new Date(m.release_date).getFullYear())
    .filter(Boolean)
  )).sort((a, b) => b - a)

  const allWatchedYears = Array.from(new Set(watched
    .map(m => m.release_date && new Date(m.release_date).getFullYear())
    .filter(Boolean)
  )).sort((a, b) => b - a)

  // --- Collect all genres present in results/watched ---
  function getAllGenresFromMovies(movies) {
    const genreIdSet = new Set();
    movies.forEach(m =>
      Array.isArray(m.genre_ids) &&
      m.genre_ids.forEach(id => genreIdSet.add(id))
    );
    return Array.from(genreIdSet)
      .filter(id => genreMap[id])
      .map(id => ({ id, name: genreMap[id] }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  const allResultGenres = getAllGenresFromMovies(results);
  const allWatchedGenres = getAllGenresFromMovies(watched);

  // --- Clear filters helpers ---
  const clearSearchFilters = () => {
    setSearchSortBy('year-desc');
    setSearchYearFilter('');
    setSearchGenreFilter('');
  }
  const clearWatchedFilters = () => {
    setWatchedSortBy('year-desc');
    setWatchedYearFilter('');
    setWatchedGenreFilter('');
  }

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
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '1.2rem',
          marginBottom: '1.5rem',
          justifyContent: 'center',
          background: 'rgba(36,36,36,0.88)',
          borderRadius: '8px',
          padding: '0.7rem 1rem'
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="text-gray-400 text-xs mr-1">Sort:</span>
          <select
            value={searchSortBy}
            onChange={e => setSearchSortBy(e.target.value)}
            style={{
              background: '#18181b',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: 4,
              padding: '0.22rem 0.8rem',
              fontSize: 13
            }}
          >
            <option value="year-desc">Year ↓</option>
            <option value="year-asc">Year ↑</option>
            <option value="rating-desc">Rating ↓</option>
            <option value="rating-asc">Rating ↑</option>
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="text-gray-400 text-xs mr-1">Year:</span>
          <select
            value={searchYearFilter}
            onChange={e => setSearchYearFilter(e.target.value)}
            style={{
              background: '#18181b',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: 4,
              padding: '0.22rem 0.8rem',
              fontSize: 13
            }}
          >
            <option value="">All</option>
            {allResultYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="text-gray-400 text-xs mr-1">Genre:</span>
          <select
            value={searchGenreFilter}
            onChange={e => setSearchGenreFilter(e.target.value)}
            style={{
              background: '#18181b',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: 4,
              padding: '0.22rem 0.8rem',
              fontSize: 13
            }}
          >
            <option value="">All</option>
            {allResultGenres.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </label>
        <button
          onClick={clearSearchFilters}
          style={{
            background: '#3b3b3b',
            color: '#fff',
            border: 'none',
            borderRadius: 5,
            padding: '0.25rem 0.95rem',
            fontSize: 13,
            marginLeft: 8,
            cursor: 'pointer',
            fontWeight: 500,
            opacity: 0.95,
            transition: 'background 0.18s'
          }}
          onMouseOver={e => e.currentTarget.style.background='#444'}
          onMouseOut={e => e.currentTarget.style.background='#3b3b3b'}
        >
          Clear All
        </button>
      </div>
      <ResultsGrid
        results={sortedFilteredResults}
        genreMap={genreMap}
        onMarkWatched={markWatched}
        watchedIds={watchedIds}
      />
      {/* --- WATCHED HISTORY SORT/FILTER CONTROLS --- */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '1.2rem',
          marginTop: '2.8rem',
          marginBottom: '1.5rem',
          justifyContent: 'center',
          background: 'rgba(36,36,36,0.88)',
          borderRadius: '8px',
          padding: '0.7rem 1rem'
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="text-gray-400 text-xs mr-1">Sort:</span>
          <select
            value={watchedSortBy}
            onChange={e => setWatchedSortBy(e.target.value)}
            style={{
              background: '#18181b',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: 4,
              padding: '0.22rem 0.8rem',
              fontSize: 13
            }}
          >
            <option value="year-desc">Year ↓</option>
            <option value="year-asc">Year ↑</option>
            <option value="rating-desc">Rating ↓</option>
            <option value="rating-asc">Rating ↑</option>
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="text-gray-400 text-xs mr-1">Year:</span>
          <select
            value={watchedYearFilter}
            onChange={e => setWatchedYearFilter(e.target.value)}
            style={{
              background: '#18181b',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: 4,
              padding: '0.22rem 0.8rem',
              fontSize: 13
            }}
          >
            <option value="">All</option>
            {allWatchedYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="text-gray-400 text-xs mr-1">Genre:</span>
          <select
            value={watchedGenreFilter}
            onChange={e => setWatchedGenreFilter(e.target.value)}
            style={{
              background: '#18181b',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: 4,
              padding: '0.22rem 0.8rem',
              fontSize: 13
            }}
          >
            <option value="">All</option>
            {allWatchedGenres.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </label>
        <button
          onClick={clearWatchedFilters}
          style={{
            background: '#3b3b3b',
            color: '#fff',
            border: 'none',
            borderRadius: 5,
            padding: '0.25rem 0.95rem',
            fontSize: 13,
            marginLeft: 8,
            cursor: 'pointer',
            fontWeight: 500,
            opacity: 0.95,
            transition: 'background 0.18s'
          }}
          onMouseOver={e => e.currentTarget.style.background='#444'}
          onMouseOut={e => e.currentTarget.style.background='#3b3b3b'}
        >
          Clear All
        </button>
      </div>
      <WatchedHistory
        watched={sortedFilteredWatched}
        genreMap={genreMap}
      />
    </div>
  )
}
