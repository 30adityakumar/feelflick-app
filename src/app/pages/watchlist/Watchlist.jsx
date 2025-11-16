// src/app/pages/watchlist/Watchlist.jsx
import { useEffect, useState, useCallback } from "react";
import { 
  Bookmark, 
  Loader2, 
  Search, 
  SlidersHorizontal, 
  Trash2, 
  X, 
  Check,
  Clock,
  Filter,
  ChevronDown
} from "lucide-react";
import { supabase } from "@/shared/lib/supabase/client";
import { useNavigate } from "react-router-dom";

// Mock streaming platforms (you'll need to integrate with JustWatch API or similar)
const MOCK_PLATFORMS = {
  netflix: { name: "Netflix", color: "#E50914" },
  prime: { name: "Prime Video", color: "#00A8E1" },
  disney: { name: "Disney+", color: "#113CCF" },
  hulu: { name: "Hulu", color: "#1CE783" },
};

export default function Watchlist() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [watchingId, setWatchingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("added");
  const [filterGenre, setFilterGenre] = useState("all");
  const [filterDuration, setFilterDuration] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);

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

  // Fetch watchlist with runtime data
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
          .select("id,title,poster_path,release_date,vote_average,runtime,genre_ids")
          .in("id", ids);

        if (mErr) throw mErr;

        const map = new Map(rows.map((r) => [r.id, r]));
        const merged = (watchlist || [])
          .map((w) => ({
            ...map.get(w.movie_id),
            added_at: w.added_at,
            status: w.status,
            // Mock platform data - replace with real API
            platforms: mockPlatforms(),
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
  }, [user, removingId, watchingId]);

  // Mock platform assignment (replace with real API)
  function mockPlatforms() {
    const available = ["netflix", "prime", "disney", "hulu"];
    const count = Math.floor(Math.random() * 3) + 1;
    return available.slice(0, count);
  }

  // Calculate total watch time
  const totalWatchTime = useCallback(() => {
    const total = filteredMovies.reduce((acc, m) => acc + (m.runtime || 0), 0);
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return `${hours}h ${mins}m`;
  }, [filteredMovies]);

  // Filter and sort
  useEffect(() => {
    let result = [...movies];

    // Filter by search
    if (searchQuery) {
      result = result.filter((m) =>
        m.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by genre
    if (filterGenre !== "all") {
      result = result.filter((m) => 
        m.genre_ids?.includes(parseInt(filterGenre))
      );
    }

    // Filter by duration
    if (filterDuration !== "all") {
      result = result.filter((m) => {
        const runtime = m.runtime || 0;
        if (filterDuration === "short") return runtime < 90;
        if (filterDuration === "medium") return runtime >= 90 && runtime <= 150;
        if (filterDuration === "long") return runtime > 150;
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "title") {
        return (a.title || "").localeCompare(b.title || "");
      } else if (sortBy === "rating") {
        return (b.vote_average || 0) - (a.vote_average || 0);
      } else if (sortBy === "runtime") {
        return (a.runtime || 0) - (b.runtime || 0);
      } else {
        return new Date(b.added_at) - new Date(a.added_at);
      }
    });

    setFilteredMovies(result);
  }, [movies, searchQuery, sortBy, filterGenre, filterDuration]);

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

  async function markAsWatched(movieId) {
    if (!user) return;
    setWatchingId(movieId);
    try {
      // Move to history
      await supabase.from("user_history").upsert({
        user_id: user.id,
        movie_id: movieId,
        watched_at: new Date().toISOString(),
      });
      
      // Remove from watchlist
      await supabase
        .from("user_watchlist")
        .delete()
        .eq("user_id", user.id)
        .eq("movie_id", movieId);
      
      setMovies((prev) => prev.filter((m) => m.id !== movieId));
    } finally {
      setWatchingId(null);
    }
  }

  function goToMovie(id) {
    nav(`/movie/${id}`);
  }

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (movieId) => {
    const swipeDistance = touchStartX - touchEndX;
    const minSwipeDistance = 50;

    if (swipeDistance > minSwipeDistance) {
      // Swipe left - delete
      remove(movieId);
    } else if (swipeDistance < -minSwipeDistance) {
      // Swipe right - mark as watched
      markAsWatched(movieId);
    }
  };

  return (
    <main
      className="bg-black text-white w-full pb-20 md:pb-6"
      style={{
        paddingTop: "var(--hdr-h, 64px)",
        minHeight: "100vh",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
        {/* Header with Stats */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                <Bookmark className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-black tracking-tight">
                  My Watchlist
                </h1>
              </div>
            </div>
          </div>
          
          {/* Stats Bar */}
          {!loading && movies.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
              <div className="flex items-center gap-1.5">
                <Bookmark className="h-3.5 w-3.5" />
                <span>{movies.length} {movies.length === 1 ? "movie" : "movies"}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{totalWatchTime()}</span>
              </div>
              {searchQuery && (
                <>
                  <span>•</span>
                  <span>Showing {filteredMovies.length}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Search, Sort & Filter Bar */}
        {!loading && movies.length > 0 && (
          <div className="mb-4 space-y-2">
            <div className="flex gap-2">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search watchlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-9 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
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
              <div className="relative sm:w-40">
                <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-8 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all cursor-pointer"
                >
                  <option value="added">Recent</option>
                  <option value="title">A-Z</option>
                  <option value="rating">Rating</option>
                  <option value="runtime">Duration</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 rounded-lg border transition-all ${
                  showFilters || filterGenre !== "all" || filterDuration !== "all"
                    ? "bg-orange-500/20 border-orange-500/50 text-white"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                }`}
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                <select
                  value={filterGenre}
                  onChange={(e) => setFilterGenre(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  <option value="all">All Genres</option>
                  <option value="28">Action</option>
                  <option value="35">Comedy</option>
                  <option value="18">Drama</option>
                  <option value="27">Horror</option>
                  <option value="878">Sci-Fi</option>
                </select>

                <select
                  value={filterDuration}
                  onChange={(e) => setFilterDuration(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  <option value="all">Any Length</option>
                  <option value="short">&lt; 90 min</option>
                  <option value="medium">90-150 min</option>
                  <option value="long">&gt; 150 min</option>
                </select>

                {(filterGenre !== "all" || filterDuration !== "all") && (
                  <button
                    onClick={() => {
                      setFilterGenre("all");
                      setFilterDuration("all");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-[50vh] text-white/80">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-orange-500" />
              <p className="text-sm">Loading your watchlist...</p>
            </div>
          </div>
        ) : filteredMovies.length === 0 && (searchQuery || filterGenre !== "all" || filterDuration !== "all") ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <Search className="h-10 w-10 text-white/20 mb-3" />
            <p className="text-sm text-white/70 mb-2">No movies match your filters</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterGenre("all");
                setFilterDuration("all");
              }}
              className="text-xs text-orange-400 hover:text-orange-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              Clear all filters
            </button>
          </div>
        ) : movies.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredMovies.map((m) => (
              <MovieCard
                key={m.id}
                movie={m}
                onRemove={remove}
                onMarkWatched={markAsWatched}
                onClick={() => goToMovie(m.id)}
                removing={removingId === m.id}
                watching={watchingId === m.id}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => handleTouchEnd(m.id)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

/* ===== Movie Card Component ===== */
function MovieCard({ 
  movie, 
  onRemove, 
  onMarkWatched, 
  onClick, 
  removing, 
  watching,
  onTouchStart,
  onTouchMove,
  onTouchEnd
}) {
  return (
    <div 
      className="group relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <button
        onClick={onClick}
        className="relative block w-full aspect-[2/3] rounded-lg overflow-hidden bg-white/5 transition-all duration-200 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 active:scale-[1.02]"
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
        
        {/* Streaming Platforms */}
        {movie.platforms && movie.platforms.length > 0 && (
          <div className="absolute top-2 left-2 flex gap-1">
            {movie.platforms.slice(0, 2).map((platform) => (
              <div
                key={platform}
                className="h-6 w-6 rounded bg-black/80 backdrop-blur-sm border border-white/20 flex items-center justify-center text-[10px] font-bold"
                style={{ color: MOCK_PLATFORMS[platform]?.color }}
                title={MOCK_PLATFORMS[platform]?.name}
              >
                {platform === "netflix" && "N"}
                {platform === "prime" && "P"}
                {platform === "disney" && "D"}
                {platform === "hulu" && "H"}
              </div>
            ))}
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <h3 className="text-xs font-bold text-white leading-tight line-clamp-2 mb-1">
              {movie.title}
            </h3>
            <div className="flex items-center flex-wrap gap-1.5 text-[10px] text-white/80">
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
              {movie.runtime && (
                <>
                  <span>•</span>
                  <span>{movie.runtime}m</span>
                </>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Action Buttons */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        {/* Mark as Watched */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkWatched(movie.id);
          }}
          disabled={watching}
          className="h-7 w-7 rounded-full bg-green-600/90 backdrop-blur-sm border border-green-500/30 flex items-center justify-center text-white hover:bg-green-600 transition-all active:scale-90 disabled:opacity-50"
          title="Mark as watched"
        >
          {watching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Remove */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(movie.id);
          }}
          disabled={removing}
          className="h-7 w-7 rounded-full bg-black/80 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80 hover:text-red-400 hover:bg-black/95 hover:border-red-500/30 transition-all active:scale-90 disabled:opacity-50"
          title="Remove from watchlist"
        >
          {removing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Swipe Hint (Mobile) */}
      <div className="md:hidden absolute bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white/60">
          Swipe ← → to act
        </div>
      </div>
    </div>
  );
}

/* ===== Empty State ===== */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
      <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <Bookmark className="h-8 w-8 text-white/20" />
      </div>
      <h2 className="text-lg font-bold text-white mb-2">
        Your watchlist is empty
      </h2>
      <p className="text-xs text-white/60 mb-4 max-w-sm">
        Start adding movies you want to watch and build your personal collection
      </p>
      <a
        href="/browse"
        className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 rounded-lg text-xs font-bold text-white hover:scale-105 active:scale-95 transition-transform"
      >
        Browse Movies
      </a>
    </div>
  );
}
