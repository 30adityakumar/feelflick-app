// src/app/pages/watchlist/Watchlist.jsx
import { useEffect, useState, useMemo } from "react";
import { 
  Bookmark, 
  Loader2, 
  Search, 
  SlidersHorizontal, 
  Trash2, 
  X,
  Check,
  Clock,
  ChevronDown,
  Filter
} from "lucide-react";
import { supabase } from "@/shared/lib/supabase/client";
import { useNavigate } from "react-router-dom";

export default function Watchlist() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [markingWatched, setMarkingWatched] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("added");
  const [genreFilter, setGenreFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");

  // Fetch user
  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (active) setUser(user || null);
    })();
    return () => { active = false; };
  }, []);

  // Fetch watchlist with runtime
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
          .select("id,title,poster_path,release_date,vote_average,runtime,genres")
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

    return () => { active = false; };
  }, [user, removingId, markingWatched]);

  // Calculate total watch time
  const totalWatchTime = useMemo(() => {
    const totalMinutes = filteredMovies.reduce((sum, m) => sum + (m.runtime || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes, total: totalMinutes };
  }, [filteredMovies]);

  // Get unique genres
  const availableGenres = useMemo(() => {
    const genreSet = new Set();
    movies.forEach(m => {
      if (m.genres && Array.isArray(m.genres)) {
        m.genres.forEach(g => genreSet.add(g));
      }
    });
    return Array.from(genreSet).sort();
  }, [movies]);

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
    if (genreFilter !== "all") {
      result = result.filter(m => 
        m.genres && m.genres.includes(genreFilter)
      );
    }

    // Filter by duration
    if (durationFilter !== "all") {
      result = result.filter(m => {
        const runtime = m.runtime || 0;
        if (durationFilter === "short") return runtime > 0 && runtime < 90;
        if (durationFilter === "medium") return runtime >= 90 && runtime <= 150;
        if (durationFilter === "long") return runtime > 150;
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "title") {
        return (a.title || "").localeCompare(b.title || "");
      } else if (sortBy === "rating") {
        return (b.vote_average || 0) - (a.vote_average || 0);
      } else {
        return new Date(b.added_at) - new Date(a.added_at);
      }
    });

    setFilteredMovies(result);
  }, [movies, searchQuery, sortBy, genreFilter, durationFilter]);

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

  async function markAsWatched(movie) {
    if (!user) return;
    setMarkingWatched(movie.id);
    
    try {
      // Add to history
      await supabase.from("user_history").upsert({
        user_id: user.id,
        movie_id: movie.id,
        watched_at: new Date().toISOString(),
      }, { onConflict: 'user_id,movie_id' });

      // Remove from watchlist
      await supabase
        .from("user_watchlist")
        .delete()
        .eq("user_id", user.id)
        .eq("movie_id", movie.id);

      setMovies((prev) => prev.filter((m) => m.id !== movie.id));
    } finally {
      setMarkingWatched(null);
    }
  }

  function goToMovie(id) {
    nav(`/movie/${id}`);
  }

  const hasFilters = genreFilter !== "all" || durationFilter !== "all";

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
          <div className="flex items-center justify-between mb-2">
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

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
              <div className="text-[10px] text-white/60 mb-0.5">Movies</div>
              <div className="text-lg font-bold text-white">
                {filteredMovies.length}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
              <div className="text-[10px] text-white/60 mb-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Watch Time
              </div>
              <div className="text-lg font-bold text-white">
                {totalWatchTime.hours > 0 && `${totalWatchTime.hours}h `}
                {totalWatchTime.minutes}m
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2.5 col-span-2 sm:col-span-1">
              <div className="text-[10px] text-white/60 mb-0.5">Avg Rating</div>
              <div className="text-lg font-bold text-white flex items-center gap-1">
                <span className="text-yellow-400 text-sm">★</span>
                {filteredMovies.length > 0
                  ? (filteredMovies.reduce((sum, m) => sum + (m.vote_average || 0), 0) / filteredMovies.length).toFixed(1)
                  : '0.0'}
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        {!loading && movies.length > 0 && (
          <div className="mb-4 space-y-2">
            {/* Search & Sort Row */}
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
                  className="appearance-none w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-8 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all cursor-pointer"
                >
                  <option value="added">Recent</option>
                  <option value="title">A-Z</option>
                  <option value="rating">Rating</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
              </div>
            </div>

            {/* Filter Pills Row */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {/* Genre Filter */}
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className={`appearance-none bg-white/5 border rounded-lg px-3 py-1.5 pr-8 text-xs font-medium transition-all cursor-pointer ${
                  genreFilter !== "all"
                    ? "border-orange-500/50 text-white bg-orange-500/10"
                    : "border-white/10 text-white/70 hover:border-white/20"
                }`}
              >
                <option value="all">All Genres</option>
                {availableGenres.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              {/* Duration Filter */}
              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className={`appearance-none bg-white/5 border rounded-lg px-3 py-1.5 pr-8 text-xs font-medium transition-all cursor-pointer ${
                  durationFilter !== "all"
                    ? "border-orange-500/50 text-white bg-orange-500/10"
                    : "border-white/10 text-white/70 hover:border-white/20"
                }`}
              >
                <option value="all">Any Length</option>
                <option value="short">&lt; 90 min</option>
                <option value="medium">90-150 min</option>
                <option value="long">&gt; 150 min</option>
              </select>

              {/* Clear Filters */}
              {hasFilters && (
                <button
                  onClick={() => {
                    setGenreFilter("all");
                    setDurationFilter("all");
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors whitespace-nowrap"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results Info */}
        {!loading && movies.length > 0 && (searchQuery || hasFilters) && (
          <div className="mb-3 text-xs text-white/60">
            Showing {filteredMovies.length} of {movies.length} movies
            {totalWatchTime.total > 0 && ` • ${totalWatchTime.hours}h ${totalWatchTime.minutes}m total`}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-[50vh]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-orange-500" />
              <p className="text-sm text-white/80">Loading your watchlist...</p>
            </div>
          </div>
        ) : filteredMovies.length === 0 && (searchQuery || hasFilters) ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <Filter className="h-10 w-10 text-white/20 mb-3" />
            <p className="text-sm text-white/70 mb-2">No movies match your filters</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setGenreFilter("all");
                setDurationFilter("all");
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
                markingWatched={markingWatched === m.id}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

/* ===== Movie Card Component ===== */
function MovieCard({ movie, onRemove, onMarkWatched, onClick, removing, markingWatched }) {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [swipeDirection, setSwipeDirection] = useState(null);

  // Swipe threshold
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
    
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setSwipeDirection("left");
    } else if (isRightSwipe) {
      setSwipeDirection("right");
    } else {
      setSwipeDirection(null);
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      onRemove(movie.id);
    } else if (isRightSwipe) {
      onMarkWatched(movie);
    }
    
    setSwipeDirection(null);
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div 
      className="group relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Swipe Indicators (Mobile) */}
      <div className={`md:hidden absolute inset-0 z-0 rounded-lg overflow-hidden transition-opacity ${swipeDirection ? 'opacity-100' : 'opacity-0'}`}>
        {swipeDirection === "left" && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-end pr-4">
            <Trash2 className="h-6 w-6 text-red-400" />
          </div>
        )}
        {swipeDirection === "right" && (
          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-start pl-4">
            <Check className="h-6 w-6 text-green-400" />
          </div>
        )}
      </div>

      <button
        onClick={onClick}
        className="relative block w-full aspect-[2/3] rounded-lg overflow-hidden bg-white/5 transition-all duration-200 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 active:scale-[1.02] z-10"
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
              {movie.runtime > 0 && (
                <>
                  <span>•</span>
                  <span>{movie.runtime}m</span>
                </>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Desktop Action Buttons */}
      <div className="hidden md:block">
        {/* Mark as Watched Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkWatched(movie);
          }}
          disabled={markingWatched}
          className="absolute top-2 left-2 z-10 h-7 w-7 rounded-full bg-black/80 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80 hover:text-green-400 hover:bg-black/95 hover:border-green-500/30 transition-all opacity-0 group-hover:opacity-100 active:scale-90 disabled:opacity-50"
          title="Mark as watched"
        >
          {markingWatched ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Remove Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(movie.id);
          }}
          disabled={removing}
          className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-black/80 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80 hover:text-red-400 hover:bg-black/95 hover:border-red-500/30 transition-all opacity-0 group-hover:opacity-100 active:scale-90 disabled:opacity-50"
          title="Remove from watchlist"
        >
          {removing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Mobile Action Buttons (Always Visible) */}
      <div className="md:hidden flex gap-1 absolute bottom-2 left-2 right-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkWatched(movie);
          }}
          disabled={markingWatched}
          className="flex-1 h-7 rounded-md bg-black/80 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80 hover:text-green-400 hover:border-green-500/30 transition-all active:scale-95 disabled:opacity-50"
        >
          {markingWatched ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(movie.id);
          }}
          disabled={removing}
          className="flex-1 h-7 rounded-md bg-black/80 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80 hover:text-red-400 hover:border-red-500/30 transition-all active:scale-95 disabled:opacity-50"
        >
          {removing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Mobile Swipe Hint (First few movies) */}
      {movie.id && (
        <div className="md:hidden absolute -bottom-6 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <p className="text-[9px] text-white/40">Swipe ← to delete, → to watch</p>
        </div>
      )}
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
