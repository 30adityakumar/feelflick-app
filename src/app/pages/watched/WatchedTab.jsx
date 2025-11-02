// src/app/pages/watched/WatchedTab.jsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/shared/lib/supabase/client';
import FilterBar from '@/app/pages/shared/FilterBar';
import WatchedHistory from '@/app/pages/watched/components/WatchedHistory';

const SHELL = 'w-full px-4 sm:px-6 lg:px-8';            // matches header
const CONTAINER = 'max-w-screen-2xl mx-auto';           // full-bleed center

export default function WatchedTab({ session: sessionProp }) {
  /* --------------------------- 1) Session --------------------------- */
  const [session, setSession] = useState(sessionProp ?? null);
  useEffect(() => {
    let unsub;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    unsub = data?.subscription?.unsubscribe;
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  /* -------------------- 2) State: data & UI state ------------------- */
  const [loading, setLoading] = useState(true);
  const [watched, setWatched] = useState([]);
  const [genreMap, setGenreMap] = useState({});
  const [sortBy, setSortBy] = useState('added-desc');
  const [yearFilter, setYearFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [search, setSearch] = useState('');
  const [optimisticRemoving, setOptimisticRemoving] = useState(null);

  /* --------------- 3) Fetch TMDb genres (id -> name) ---------------- */
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const r = await fetch(
          `https://api.themoviedb.org/3/genre/movie/list?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US`,
          { signal: ctrl.signal }
        );
        const j = await r.json();
        const map = Object.fromEntries((j?.genres || []).map(g => [String(g.id), g.name]));
        setGenreMap(map);
      } catch { /* ignore */ }
    })();
    return () => ctrl.abort();
  }, []);

  /* --------------- 4) Fetch watched for current user ---------------- */
  useEffect(() => {
    if (!session?.user?.id) return;
    setLoading(true);
    supabase
      .from('movies_watched')
      .select('*')
      .eq('user_id', session.user.id)
      .order('id', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('movies_watched fetch error:', error);
        setWatched(data ?? []);
      })
      .finally(() => setLoading(false));
  }, [session]);

  /* ----------------- 5) Normalize & derived helpers ----------------- */
  const normalized = useMemo(() => {
    return (watched || []).map((m) => ({
      ...m,
      movie_id: m.movie_id ?? m.id,                           // be forgiving
      title: m.title ?? '',
      release_date: m.release_date ?? null,
      vote_average: typeof m.vote_average === 'number' ? m.vote_average : null,
      genre_ids: Array.isArray(m.genre_ids)
        ? m.genre_ids.map(String)
        : [],
    }));
  }, [watched]);

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

  /* ------------------- 6) Filter / sort / search -------------------- */
  function sortMovies(movies, key) {
    switch (key) {
      case 'added-desc':   return [...movies].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
      case 'added-asc':    return [...movies].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
      case 'year-desc':    return [...movies].sort((a, b) => (b.release_date ?? '').localeCompare(a.release_date ?? ''));
      case 'year-asc':     return [...movies].sort((a, b) => (a.release_date ?? '').localeCompare(b.release_date ?? ''));
      case 'rating-desc':  return [...movies].sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
      case 'rating-asc':   return [...movies].sort((a, b) => (a.vote_average ?? 0) - (b.vote_average ?? 0));
      default: return movies;
    }
  }
  function byYear(movies, y) {
    if (!y) return movies;
    return movies.filter(m =>
      m.release_date && new Date(m.release_date).getFullYear().toString() === y
    );
  }
  function byGenre(movies, gid) {
    if (!gid) return movies;
    return movies.filter(m => m.genre_ids?.includes(String(gid)));
  }
  function bySearch(movies, q) {
    if (!q) return movies;
    const needle = q.trim().toLowerCase();
    return movies.filter(m => {
      const year = m.release_date ? String(new Date(m.release_date).getFullYear()) : '';
      return (m.title || '').toLowerCase().includes(needle) || year.includes(needle);
    });
  }

  const view = useMemo(() => {
    const base = normalized.filter(m => m.movie_id !== optimisticRemoving); // optimistic remove
    const filtered = bySearch(byGenre(byYear(base, yearFilter), genreFilter), search);
    return sortMovies(filtered, sortBy);
  }, [normalized, yearFilter, genreFilter, search, sortBy, optimisticRemoving]);

  /* ------------------------ 7) Actions ------------------------------- */
  const clearFilters = () => {
    setSortBy('added-desc');
    setYearFilter('');
    setGenreFilter('');
    setSearch('');
  };

  const removeFromWatched = async (movie_id) => {
    if (!session?.user?.id || !movie_id) return;
    setOptimisticRemoving(movie_id);
    try {
      await supabase.from('movies_watched')
        .delete()
        .eq('user_id', session.user.id)
        .eq('movie_id', movie_id);
    } finally {
      // refresh canonical data to stay correct
      const { data } = await supabase
        .from('movies_watched')
        .select('*')
        .eq('user_id', session.user.id)
        .order('id', { ascending: false });
      setWatched(data ?? []);
      setOptimisticRemoving(null);
    }
  };

  /* ------------------------ 8) Render ------------------------------- */
  return (
    <div className="min-h-screen bg-[#0b0f14] text-white">
      {/* sticky tools bar, sits under app header */}
      <div className={`sticky top-[56px] md:top-[64px] z-30 ${SHELL} bg-[#0b0f14]/85 backdrop-blur-md ring-1 ring-white/5`}>
        <div className={`${CONTAINER} py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between`}>
          <div className="flex items-center gap-3">
            <h1 className="text-[clamp(1.05rem,2vw,1.35rem)] font-extrabold tracking-tight">Watched History</h1>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/80">
              {loading ? 'Loading…' : `${view.length} ${view.length === 1 ? 'movie' : 'movies'}`}
            </span>
          </div>

          {/* quick controls */}
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
              <option value="added-asc">Order Added ↑</option>
              <option value="year-desc">Year ↓</option>
              <option value="year-asc">Year ↑</option>
              <option value="rating-desc">Rating ↓</option>
              <option value="rating-asc">Rating ↑</option>
            </select>
            <select
              className="h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-[13px] focus:outline-none"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="">All years</option>
              {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
            </select>
            <select
              className="h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-[13px] focus:outline-none"
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
            >
              <option value="">All genres</option>
              {allGenres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <button
              onClick={clearFilters}
              className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-[13px] font-semibold hover:bg-white/10"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* content */}
      <main className={`${SHELL}`}>
        <div className={`${CONTAINER} pt-6 pb-16`}>
          {loading ? (
            <SkeletonGrid />
          ) : (
            <WatchedHistory
              watched={view}
              genreMap={genreMap}
              onRemove={removeFromWatched}
              gridClass="movie-grid"
              onMovieClick={() => {}}
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* ----------------------- Small skeleton grid ----------------------- */
function SkeletonGrid() {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[2/3] w-full rounded-xl bg-white/[.06] animate-pulse"
        />
      ))}
    </div>
  );
}