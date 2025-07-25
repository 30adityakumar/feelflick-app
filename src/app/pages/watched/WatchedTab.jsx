import { useState, useEffect } from 'react';
import FilterBar from '@/app/pages/shared/FilterBar';
import WatchedHistory from '@/app/pages/watched/components/WatchedHistory';
import MovieModal from '@/app/pages/shared/MovieModal';
import { supabase } from '@/shared/lib/supabase/client';

export default function WatchedTab({ session }) {
  const [watched, setWatched] = useState([]);
  const [genreMap, setGenreMap] = useState({});
  const [sortBy, setSortBy] = useState('added-desc');
  const [yearFilter, setYearFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [modalMovie, setModalMovie] = useState(null);
  const closeModal = () => setModalMovie(null);

  // Fetch genre map
  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US`)
      .then(res => res.json())
      .then(({ genres }) => setGenreMap(Object.fromEntries(genres.map(g => [g.id, g.name]))))
      .catch(console.error);
  }, []);

  // Fetch watched movies
  useEffect(() => {
    if (!session?.user?.id) return;
    supabase
      .from('movies_watched')
      .select('*')
      .eq('user_id', session.user.id)
      .order('id', { ascending: false })
      .then(({ data }) => setWatched(data || []));
  }, [session]);

  // Sorting/filtering helpers
  function sortMovies(movies, sortBy) {
    if (sortBy === 'added-desc') return [...movies].sort((a, b) => (b.id || 0) - (a.id || 0));
    if (sortBy === 'added-asc') return [...movies].sort((a, b) => (a.id || 0) - (b.id || 0));
    if (sortBy === 'year-desc') return [...movies].sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''));
    if (sortBy === 'year-asc') return [...movies].sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''));
    if (sortBy === 'rating-desc') return [...movies].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    if (sortBy === 'rating-asc') return [...movies].sort((a, b) => (a.vote_average || 0) - (b.vote_average || 0));
    return movies;
  }
  function filterMoviesByYear(movies, year) {
    if (!year) return movies;
    return movies.filter(m => m.release_date && new Date(m.release_date).getFullYear().toString() === year);
  }
  function filterMoviesByGenre(movies, genreId) {
    if (!genreId) return movies;
    return movies.filter(m => Array.isArray(m.genre_ids) && m.genre_ids.includes(String(genreId)));
  }
  const allYears = Array.from(new Set(watched.map(m => m.release_date && new Date(m.release_date).getFullYear()).filter(Boolean))).sort((a, b) => b - a);
  const allGenres = (() => {
    const genreIdSet = new Set();
    watched.forEach(m =>
      Array.isArray(m.genre_ids) &&
      m.genre_ids.forEach(id => genreIdSet.add(id))
    );
    return Array.from(genreIdSet)
      .filter(id => genreMap[id])
      .map(id => ({ id, name: genreMap[id] }))
      .sort((a, b) => a.name.localeCompare(b.name));
  })();
  const clearFilters = () => {
    setSortBy('added-desc');
    setYearFilter('');
    setGenreFilter('');
  };

  // Remove from watched
  const removeFromWatched = async (movie_id) => {
    if (!session?.user?.id) return;
    await supabase
      .from('movies_watched')
      .delete()
      .eq('user_id', session.user.id)
      .eq('movie_id', movie_id);
    // Refresh watched
    const { data } = await supabase
      .from('movies_watched')
      .select('*')
      .eq('user_id', session.user.id)
      .order('id', { ascending: false });
    setWatched(data);
  };

  const filteredSortedWatched = sortMovies(
    filterMoviesByGenre(
      filterMoviesByYear(watched, yearFilter),
      genreFilter
    ),
    sortBy
  );

  return (
    <div className="min-h-screen bg-[#101015] w-full pb-14 px-3 sm:px-6 md:px-10 lg:px-20 xl:px-32 box-border">
      {/* Filters */}
      <div className="max-w-3xl mx-auto w-full mt-7 mb-6">
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
      <div className="max-w-6xl mx-auto font-bold text-lg md:text-xl text-white mt-2 mb-5 flex items-center gap-2">
        <span role="img" aria-label="watched" className="text-2xl">🎬</span>
        Watched History
      </div>
      <div className="max-w-6xl mx-auto min-h-[200px]">
        {filteredSortedWatched.length ? (
          <WatchedHistory
            watched={filteredSortedWatched}
            genreMap={genreMap}
            onRemove={removeFromWatched}
            gridClass="movie-grid"
            onMovieClick={setModalMovie}
          />
        ) : (
          <div className="text-zinc-400 text-center text-base md:text-lg font-medium my-16">
            <span role="img" aria-label="Empty" className="block text-3xl mb-2">🍿</span>
            No watched movies yet. Mark some as watched to see them here!
          </div>
        )}
      </div>
      {modalMovie && (
        <MovieModal
          movie={modalMovie}
          open={!!modalMovie}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
