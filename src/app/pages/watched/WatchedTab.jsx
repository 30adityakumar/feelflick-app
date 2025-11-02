// src/app/pages/watched/WatchedTab.jsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/shared/lib/supabase/client';
import WatchedHistory from '@/app/pages/watched/components/WatchedHistory';

const SHELL = 'w-full px-4 sm:px-6 lg:px-8';
const CONTAINER = 'max-w-screen-2xl mx-auto';

export default function WatchedTab({ session: sessionProp }) {
  /* ---------------- 1. Session ---------------- */
  const [session, setSession] = useState(sessionProp ?? null);
  useEffect(() => {
    let unsub;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    unsub = data?.subscription?.unsubscribe;
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  /* ---------------- 2. State ------------------ */
  const [loading, setLoading] = useState(true);
  const [watched, setWatched] = useState([]);
  const [genreMap, setGenreMap] = useState({});
  const [sortBy, setSortBy] = useState('added-desc');
  const [yearFilter, setYearFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [search, setSearch] = useState('');

  /* ---------------- 3. Genres ----------------- */
  useEffect(() => {
    fetch(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US`
    )
      .then(r => r.json())
      .then(({ genres }) =>
        setGenreMap(Object.fromEntries(genres.map(g => [String(g.id), g.name])))
      )
      .catch(() => {});
  }, []);

  /* ---------------- 4. Fetch Watched ---------- */
  useEffect(() => {
    if (!session?.user?.id) return;
    setLoading(true);
    supabase
      .from('movies_watched')
      .select('*')
      .eq('user_id', session.user.id)
      .order('id', { ascending: false })
      .then(({ data }) => setWatched(data ?? []))
      .finally(() => setLoading(false));
  }, [session]);

  /* ---------------- 5. Normalize -------------- */
  const normalized = useMemo(
    () =>
      (watched || []).map(m => ({
        ...m,
        movie_id: m.movie_id ?? m.id,
        genre_ids: Array.isArray(m.genre_ids) ? m.genre_ids.map(String) : [],
      })),
    [watched]
  );

  /* ---------------- 6. Filtering -------------- */
  const years = useMemo(() => {
    const set = new Set(
      normalized
        .map(m => (m.release_date ? new Date(m.release_date).getFullYear() : null))
        .filter(Boolean)
    );
    return Array.from(set).sort((a, b) => b - a);
  }, [normalized]);

  const allGenres = useMemo(() => {
    const ids = new Set();
    normalized.forEach(m => m.genre_ids?.forEach(id => ids.add(id)));
    return Array.from(ids)
      .filter(id => genreMap[id])
      .map(id => ({ id, name: genreMap[id] }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [normalized, genreMap]);

  const sortMovies = (movies, key) => {
    switch (key) {
      case 'added-desc':  return [...movies].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
      case 'year-desc':   return [...movies].sort((a, b) => (b.release_date ?? '').localeCompare(a.release_date ?? ''));
      case 'rating-desc': return [...movies].sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
      default:            return movies;
    }
  };

  const view = useMemo(() => {
    let r = normalized;
    if (yearFilter)
      r = r.filter(m => m.release_date && new Date(m.release_date).getFullYear().toString() === yearFilter);
    if (genreFilter)
      r = r.filter(m => m.genre_ids?.includes(String(genreFilter)));
    if (search)
      r = r.filter(m =>
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        (m.release_date ?? '').includes(search)
      );
    return sortMovies(r, sortBy);
  }, [normalized, sortBy, yearFilter, genreFilter, search]);

  /* ---------------- 7. Remove ----------------- */
  const removeFromWatched = async (movie_id) => {
    if (!session?.user?.id) return;
    await supabase.from('movies_watched')
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

  /* ---------------- 8. Render ----------------- */
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#0b0f14] via-[#0c1118] to-[#0a0d11] text-white"
    >
      {/* Toolbar (same layout as Watchlist top row) */}
      <main className={`${SHELL}`}>
        <div className={`${CONTAINER} pt-8 pb-2`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-[clamp(1.1rem,2.1vw,1.6rem)] font-extrabold tracking-tight flex items-center gap-2">
                <span role="img" aria-label="clapperboard">🎬</span>
                Watched History
              </h1>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/80">
                {loading ? 'Loading…' : `${view.length} movies`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title or year…"
                className="h-9 w-[56vw] max-w-xs rounded-lg border border-white/10 bg-white/5 px-3 text-[13px] placeholder-white/40 focus:outline-none"
              />
              <select
                className="h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-[13px] focus:outline-none"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="added-desc">Order Added ↓</option>
                <option value="year-desc">Year ↓</option>
                <option value="rating-desc">Rating ↓</option>
              </select>
              <select
                className="h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-[13px] focus:outline-none"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="">All years</option>
                {years.map(y => <option key={y}>{y}</option>)}
              </select>
              <select
                className="h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-[13px] focus:outline-none"
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
              >
                <option value="">All genres</option>
                {allGenres.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  setSortBy('added-desc');
                  setYearFilter('');
                  setGenreFilter('');
                  setSearch('');
                }}
                className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-[13px] font-semibold hover:bg-white/10"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Movie grid (same layout as Watchlist) */}
        <div className={`${CONTAINER} pt-6 pb-20`}>
          {loading ? (
            <SkeletonGrid />
          ) : (
            <WatchedHistory
              watched={view}
              genreMap={genreMap}
              onRemove={removeFromWatched}
              gridClass="movie-grid"
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* -------------- Skeleton Loader -------------- */
function SkeletonGrid() {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[2/3] w-full rounded-xl bg-white/[.06] animate-pulse"
        />
      ))}
    </div>
  );
}