// src/app/pages/watchlist/Watchlist.jsx
import { useEffect, useState } from "react";
import { Bookmark, Loader2, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { supabase } from "@/shared/lib/supabase/client";
import { useNavigate } from "react-router-dom";

export default function Watchlist() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("added"); // 'added' | 'title' | 'rating'

  // Fetch user
  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (active) setUser(user || null);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Fetch watchlist
  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);

    (async () => {
      try {
        const { data: watchlist, error } = await supabase
          .from("user_watchlist")
          .select("movie_id,status,added_at")
          .eq("user_id", user.id)
          .order("added_at", { ascending: false });

        if (error) throw error;

        const ids = (watchlist || []).map((r) => r.movie_id);
        if (ids.length === 0) {
          if (active) {
            setMovies([]);
            setFilteredMovies([]);
            setLoading(false);
          }
          return;
        }

        const { data: rows, error: mErr } = await supabase
          .from("movies")
          .select("id,title,poster_path,release_date,vote_average")
          .in("id", ids);

        if (mErr) throw mErr;

        const map = new Map(rows.map((r) => [r.id, r]));
        const merged = (watchlist || [])
          .map((w) => ({
            ...map.get(w.movie_id),
            added_at: w.added_at,
            status: w.status,
          }))
          .filter(Boolean);

        if (active) {
          setMovies(merged);
          setFilteredMovies(merged);
        }
      } catch {
        if (active) {
          setMovies([]);
          setFilteredMovies([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [user, removingId]);

  // Filter and sort
  useEffect(() => {
    let result = [...movies];

    // Filter by search
    if (searchQuery) {
      result = result.filter((m) =>
        m.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "title") {
        return (a.title || "").localeCompare(b.title || "");
      } else if (sortBy === "rating") {
        return (b.vote_average || 0) - (a.vote_average || 0);
      } else {
        // Default: added_at (newest first)
        return new Date(b.added_at) - new Date(a.added_at);
      }
    });

    setFilteredMovies(result);
  }, [movies, searchQuery, sortBy]);

  async function remove(movieId) {
    if (!user) return;
    setRemovingId(movieId);
    try {
      await supabase
        .from("user_watchlist")
        .delete()
        .eq("user_id", user.id)
        .eq("movie_id", movieId);
      setMovies((prev) => prev.filter((m) => m.id !== movieId));
    } finally {
      setRemovingId(null);
    }
  }

  function goToMovie(id) {
    nav(`/movie/${id}`);
  }

  return (
    <main
      className="bg-black text-white w-full pb-20 md:pb-8"
      style={{
        paddingTop: "var(--hdr-h, 64px)",
        minHeight: "100vh",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Bookmark className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
                My Watchlist
              </h1>
              <p className="text-xs sm:text-sm text-white/60">
                {movies.length} {movies.length === 1 ? "movie" : "movies"}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Sort Bar */}
        {!loading && movies.length > 0 && (
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                placeholder="Search watchlist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 sm:py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all cursor-pointer"
              >
                <option value="added">Recently Added</option>
                <option value="title">Title (A-Z)</option>
                <option value="rating">Highest Rated</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-[50vh] text-white/80">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
              <p className="text-sm">Loading your watchlist...</p>
            </div>
          </div>
        ) : filteredMovies.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <Search className="h-12 w-12 text-white/20 mb-4" />
            <p className="text-white/70 mb-2">No movies found for "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
            >
              Clear search
            </button>
          </div>
        ) : movies.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filteredMovies.map((m) => (
              <MovieCard
                key={m.id}
                movie={m}
                onRemove={remove}
                onClick={() => goToMovie(m.id)}
                removing={removingId === m.id}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

/* ===== Movie Card Component ===== */
function MovieCard({ movie, onRemove, onClick, removing }) {
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className="relative block w-full aspect-[2/3] rounded-lg overflow-hidden bg-white/5 transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/50"
      >
        {movie.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/10">
            <span className="text-white/40 text-xs">No Image</span>
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-xs sm:text-sm font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">
              {movie.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-xs text-white/80">
              {movie.release_date && (
                <span>{new Date(movie.release_date).getFullYear()}</span>
              )}
              {movie.vote_average && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    {movie.vote_average.toFixed(1)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(movie.id);
        }}
        disabled={removing}
        className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80 hover:text-red-400 hover:bg-black/90 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 active:scale-90 disabled:opacity-50"
        title="Remove from watchlist"
      >
        {removing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

/* ===== Empty State ===== */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
      <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
        <Bookmark className="h-10 w-10 sm:h-12 sm:w-12 text-white/20" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
        Your watchlist is empty
      </h2>
      <p className="text-sm sm:text-base text-white/60 mb-6 max-w-md">
        Start adding movies you want to watch and build your personal collection
      </p>
      <a
        href="/browse"
        className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 rounded-xl text-sm font-bold text-white hover:scale-105 transition-transform"
      >
        Browse Movies
      </a>
    </div>
  );
}
