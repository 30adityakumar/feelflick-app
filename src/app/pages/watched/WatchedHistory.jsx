// src/app/pages/watched/WatchedHistory.jsx
import { useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Clock,
  Search,
  SlidersHorizontal,
  Trash2,
  Calendar,
  TrendingUp,
  X,
  ChevronDown,
} from "lucide-react";

export default function WatchedHistory() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  // Get current user
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

  // Get watched movies
  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);

    (async () => {
      try {
        const { data, error } = await supabase
          .from("movies_watched")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (active) {
          setMovies(data ?? []);
          setFilteredMovies(data ?? []);
        }
      } catch (err) {
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
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
    });

    setFilteredMovies(result);
  }, [movies, searchQuery, sortBy]);

  // Remove a movie from history
  async function remove(movie_id) {
    if (!user) return;
    setRemovingId(movie_id);
    try {
      await supabase
        .from("movies_watched")
        .delete()
        .eq("user_id", user.id)
        .eq("movie_id", movie_id);
      setMovies((prev) => prev.filter((m) => m.movie_id !== movie_id));
    } finally {
      setRemovingId(null);
    }
  }

  function goToMovie(id) {
    nav(`/movie/${id}`);
  }

  // Calculate stats
  const totalMovies = movies.length;
  const avgRating =
    movies.length > 0
      ? (
          movies.reduce((sum, m) => sum + (m.vote_average || 0), 0) /
          movies.length
        ).toFixed(1)
      : "0.0";

  return (
    <main
      className="bg-black text-white w-full pb-20 md:pb-6"
      style={{
        paddingTop: "var(--hdr-h, 64px)",
        minHeight: "100vh",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-black tracking-tight">
                Watch History
              </h1>
            </div>
          </div>

          {/* Simple Stats */}
          <div className="flex items-center gap-3 text-xs text-white/60">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white">{totalMovies}</span>
              <span>{totalMovies === 1 ? 'movie' : 'movies'} watched</span>
            </div>
            {totalMovies > 0 && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">★</span>
                  <span>{avgRating} avg</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search & Sort Bar */}
        {!loading && movies.length > 0 && (
          <div className="mb-4 flex gap-2">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-9 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5 text-white/60" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative w-40">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-8 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all cursor-pointer"
              >
                <option value="recent">Recent</option>
                <option value="title">A-Z</option>
                <option value="rating">Rating</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Results Info */}
        {!loading && movies.length > 0 && searchQuery && (
          <div className="mb-3 text-xs text-white/60">
            Showing {filteredMovies.length} of {movies.length} movies
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-[50vh]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-purple-500" />
              <p className="text-sm text-white/80">Loading your history...</p>
            </div>
          </div>
        ) : filteredMovies.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <Search className="h-10 w-10 text-white/20 mb-3" />
            <p className="text-sm text-white/70 mb-2">
              No movies found for "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              Clear search
            </button>
          </div>
        ) : movies.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredMovies.map((m) => (
              <MovieCard
                key={m.movie_id}
                movie={{
                  id: m.movie_id,
                  title: m.title,
                  poster_path: m.poster,
                  release_date: m.release_date,
                  vote_average: m.vote_average,
                  created_at: m.created_at,
                }}
                onRemove={() => remove(m.movie_id)}
                onClick={() => goToMovie(m.movie_id)}
                removing={removingId === m.movie_id}
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
        className="relative block w-full aspect-[2/3] rounded-lg overflow-hidden bg-white/5 transition-all duration-200 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 active:scale-[1.02]"
      >
        {movie.poster_path ? (
          <img
            src={
              movie.poster_path.startsWith("http")
                ? movie.poster_path
                : `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            }
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <h3 className="text-xs font-bold text-white leading-tight line-clamp-2 mb-1">
              {movie.title}
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] text-white/80">
              {movie.release_date && (
                <span>{new Date(movie.release_date).getFullYear()}</span>
              )}
              {movie.vote_average > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
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
          onRemove();
        }}
        disabled={removing}
        className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-black/80 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80 hover:text-red-400 hover:bg-black/95 hover:border-red-500/30 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 active:scale-90 disabled:opacity-50"
        title="Remove from history"
      >
        {removing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

/* ===== Empty State ===== */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
      <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <Clock className="h-8 w-8 text-white/20" />
      </div>
      <h2 className="text-lg font-bold text-white mb-2">
        No watch history yet
      </h2>
      <p className="text-xs text-white/60 mb-4 max-w-sm">
        Start watching movies to build your viewing history and get personalized
        recommendations
      </p>
      <a
        href="/browse"
        className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2.5 rounded-lg text-xs font-bold text-white hover:scale-105 active:scale-95 transition-transform"
      >
        Browse Movies
      </a>
    </div>
  );
}
