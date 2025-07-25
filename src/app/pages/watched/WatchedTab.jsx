// src/app/pages/watched/WatchedTab.jsx
import { useState, useEffect } from 'react';
import FilterBar from '@/app/pages/shared/FilterBar';
import WatchedHistory from '@/app/pages/watched/components/WatchedHistory';
import MovieModal from '@/app/pages/shared/MovieModal';
import { supabase } from '@/shared/lib/supabase/client';

export default function WatchedTab({ session: sessionProp }) {
  /* ------------------------------------------------------------------
     1. Session handling
     ------------------------------------------------------------------ */
  const [session, setSession] = useState(sessionProp ?? null);

  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    // Listen for future auth state changes
    const { data: listener } =
      supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
      });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  /* ------------------------------------------------------------------
     2. State for watched list, filters, modal, etc.
     ------------------------------------------------------------------ */
  const [watched,    setWatched]    = useState([]);
  const [genreMap,   setGenreMap]   = useState({});
  const [sortBy,     setSortBy]     = useState('added-desc');
  const [yearFilter, setYearFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [modalMovie, setModalMovie] = useState(null);
  const closeModal = () => setModalMovie(null);

  /* ------------------------------------------------------------------
     3. Fetch TMDb genre list (for mapping ids → names)
     ------------------------------------------------------------------ */
  useEffect(() => {
    fetch(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US`
    )
      .then(res => res.json())
      .then(({ genres }) =>
        setGenreMap(Object.fromEntries(genres.map(g => [g.id, g.name])))
      )
      .catch(console.error);
  }, []);

  /* ------------------------------------------------------------------
     4. Fetch watched movies once we have a valid session
     ------------------------------------------------------------------ */
  useEffect(() => {
    if (!session?.user?.id) return;            // no session yet → skip

    supabase
      .from('movies_watched')
      .select('*')
      .eq('user_id', session.user.id)
      .order('id', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('Fetch movies_watched error:', error);
        setWatched(data ?? []);
      });
  }, [session]);

  /* ------------------------------------------------------------------
     5. Normalise genre_ids so filter / grid never breaks
     ------------------------------------------------------------------ */
  const safeWatched = watched.map(m => ({
    ...m,
    genre_ids: Array.isArray(m.genre_ids)
      ? m.genre_ids.map(String)   // ensure strings
      : []
  }));

  /* ------------------------------------------------------------------
     6. Sorting / filtering helpers
     ------------------------------------------------------------------ */
  function sortMovies(movies, sortKey) {
    switch (sortKey) {
      case 'added-desc':   return [...movies].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
      case 'added-asc':    return [...movies].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
      case 'year-desc':    return [...movies].sort((a, b) => (b.release_date ?? '').localeCompare(a.release_date ?? ''));
      case 'year-asc':     return [...movies].sort((a, b) => (a.release_date ?? '').localeCompare(b.release_date ?? ''));
      case 'rating-desc':  return [...movies].sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
      case 'rating-asc':   return [...movies].sort((a, b) => (a.vote_average ?? 0) - (b.vote_average ?? 0));
      default:             return movies;
    }
  }
  function filterByYear(movies, year) {
    return year
      ? movies.filter(m => m.release_date && new Date(m.release_date).getFullYear().toString() === year)
      : movies;
  }
  function filterByGenre(movies, genreId) {
    return genreId
      ? movies.filter(m => Array.isArray(m.genre_ids) && m.genre_ids.includes(String(genreId)))
      : movies;
  }

  /* ------------------------------------------------------------------
     7. Lists for filter dropdowns
     ------------------------------------------------------------------ */
  const allYears = Array.from(
    new Set(
      safeWatched
        .map(m => (m.release_date ? new Date(m.release_date).getFullYear() : null))
        .filter(Boolean)
    )
  ).sort((a, b) => b - a);

  const allGenres = (() => {
    const ids = new Set();
    safeWatched.forEach(m => m.genre_ids?.forEach(id => ids.add(id)));
    return Array.from(ids)
      .filter(id => genreMap[id])
      .map(id => ({ id, name: genreMap[id] }))
      .sort((a, b) => a.name.localeCompare(b.name));
  })();

  const clearFilters = () => {
    setSortBy('added-desc');
    setYearFilter('');
    setGenreFilter('');
  };

  /* ------------------------------------------------------------------
     8. Remove movie from watched history
     ------------------------------------------------------------------ */
  const removeFromWatched = async (movie_id) => {
    if (!session?.user?.id) return;

    await supabase
      .from('movies_watched')
      .delete()
      .eq('user_id', session.user.id)
      .eq('movie_id', movie_id);

    const { data } = await supabase
      .from('movies_watched')
      .select('*')
      .eq('user_id', session.user.id)
      .order('id', { ascending: false });

    setWatched(data ?? []);
  };

  /* ------------------------------------------------------------------
     9. Apply filters + sort
     ------------------------------------------------------------------ */
  const filteredSorted = sortMovies(
    filterByGenre(filterByYear(safeWatched, yearFilter), genreFilter),
    sortBy
  );

  /* ------------------------------------------------------------------
     10. Debug logs – can remove later
     ------------------------------------------------------------------ */
  console.log('Current session.user.id:', session?.user?.id);
  console.log('Watched (raw):', watched);
  console.log('Watched (safe):', safeWatched);

  /* ------------------------------------------------------------------
     11. Render
     ------------------------------------------------------------------ */
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
            { value: 'added-asc',  label: 'Order Added ↑' },
            { value: 'year-desc',  label: 'Year ↓' },
            { value: 'year-asc',   label: 'Year ↑' },
            { value: 'rating-desc', label: 'Rating ↓' },
            { value: 'rating-asc',  label: 'Rating ↑' },
          ]}
          clearFilters={clearFilters}
        />
      </div>

      {/* Heading */}
      <div className="max-w-6xl mx-auto font-bold text-lg md:text-xl text-white mt-2 mb-5 flex items-center gap-2">
        <span role="img" aria-label="watched" className="text-2xl">🎬</span>
        Watched History
      </div>

      {/* Grid / Empty state */}
      <div className="max-w-6xl mx-auto min-h-[200px]">
        {filteredSorted.length ? (
          <WatchedHistory
            watched={filteredSorted}
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

      {/* Modal */}
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
