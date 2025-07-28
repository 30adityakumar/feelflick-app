import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";
import Header from "@/app/header/Header";
import Sidebar from "@/app/header/sidebar/Sidebar";
import { Bookmark, Trash2 } from "lucide-react";

const TMDB_IMG = "https://image.tmdb.org/t/p/w342";

export default function Watchlist() {
  const [user, setUser] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    async function fetchWatchlist() {
      const { data: watchlist, error } = await supabase
        .from('user_watchlist')
        .select('movie_id')
        .eq('user_id', user.id);

      if (error) {
        setMovies([]);
        setLoading(false);
        return;
      }

      const movieIds = (watchlist || []).map(row => row.movie_id);

      if (movieIds.length === 0) {
        setMovies([]);
        setLoading(false);
        return;
      }

      const { data: movieRows, error: moviesError } = await supabase
        .from('movies')
        .select('id, title, poster_path, release_date')
        .in('id', movieIds);

      if (moviesError) {
        setMovies([]);
      } else {
        const idToMovie = Object.fromEntries((movieRows || []).map(m => [m.id, m]));
        const sorted = movieIds.map(id => idToMovie[id]).filter(Boolean);
        setMovies(sorted);
      }
      setLoading(false);
    }
    fetchWatchlist();
  }, [user, removingId]); // update when removing

  async function handleRemove(id) {
    if (!user) return;
    setRemovingId(id);
    await supabase
      .from('user_watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('movie_id', id);
    setRemovingId(null);
    setMovies(prev => prev.filter(m => m.id !== id));
  }

  return (
    <div className="flex bg-black min-h-screen">
      <Sidebar />
      <div className="flex-1 min-h-screen pl-0 md:pl-16 pt-[56px]">
        <Header />
        <main className="max-w-6xl mx-auto px-2 sm:px-4 pt-7 pb-16">
          {/* Section Header */}
          <div className="flex items-center gap-2 mb-8">
            <span className="bg-orange-500/20 text-orange-400 rounded-full p-2">
              <Bookmark size={28} />
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              Your Watchlist
            </h1>
          </div>
          {/* Content */}
          {(!user || loading) ? (
            <div className="text-center text-white mt-20">Loading your Watchlist...</div>
          ) : (
            <>
              {movies.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] mt-10">
                  <img
                    src="/movie-popcorn.svg"
                    alt=""
                    className="w-24 h-24 opacity-40 mb-4"
                    style={{ filter: 'grayscale(1)' }}
                  />
                  <div className="text-zinc-400 text-xl mb-2">
                    Your watchlist is empty.
                  </div>
                  <div className="text-zinc-500">
                    Add movies you want to see!
                  </div>
                </div>
              ) : (
                <div
                  className={`
                    grid gap-4
                    grid-cols-2 sm:grid-cols-3 md:grid-cols-5
                    ${movies.length < 5 ? "justify-center" : ""}
                  `}
                >
                  {movies.map((movie) => (
                    <div key={movie.id} className="relative group">
                      {/* Remove Button */}
                      <button
                        className={`
                          absolute top-2 right-2 z-30 bg-black/70 hover:bg-red-600/90
                          text-zinc-200 hover:text-white p-2 rounded-full shadow
                          transition opacity-0 group-hover:opacity-100 focus:opacity-100
                          sm:opacity-0 md:opacity-0 lg:opacity-0
                          ${removingId === movie.id ? "opacity-100 animate-pulse pointer-events-none" : ""}
                        `}
                        aria-label="Remove from watchlist"
                        tabIndex={0}
                        onClick={() => handleRemove(movie.id)}
                        disabled={removingId === movie.id}
                        style={{ pointerEvents: removingId === movie.id ? 'none' : 'auto' }}
                      >
                        <Trash2 size={20} />
                      </button>
                      <Link
                        to={`/movie/${movie.id}`}
                        className={`
                          group bg-[#18181c] rounded-xl shadow-md hover:shadow-lg
                          hover:ring-2 hover:ring-orange-500/30 focus:ring-2 focus:ring-orange-500/70
                          transition-all block overflow-hidden relative
                          hover:scale-[1.035]
                          border border-zinc-900
                        `}
                        tabIndex={0}
                      >
                        {/* Poster */}
                        <img
                          src={movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : "/placeholder-movie.png"}
                          alt={movie.title}
                          className="rounded-xl w-full h-[178px] sm:h-[220px] md:h-[188px] object-cover group-hover:opacity-95 transition"
                          loading="lazy"
                        />
                        {/* Overlay for title and year */}
                        <div className="absolute bottom-0 left-0 w-full z-10 px-3 pb-2 pt-6 bg-gradient-to-t from-black/85 via-black/0 to-transparent">
                          <div className="text-white font-bold text-sm truncate drop-shadow">
                            {movie.title}
                          </div>
                          <div className="text-xs text-zinc-300 mt-1">
                            {movie.release_date ? movie.release_date.slice(0, 4) : ""}
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
