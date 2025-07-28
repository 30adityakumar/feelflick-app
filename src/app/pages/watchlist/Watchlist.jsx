import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";
import Header from "@/app/header/Header";
import Sidebar from "@/app/header/sidebar/Sidebar";
import { Bookmark } from "lucide-react";

const TMDB_IMG = "https://image.tmdb.org/t/p/w342";

export default function Watchlist() {
  const [user, setUser] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

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
  }, [user]);

  return (
    <div className="flex bg-[#161623] min-h-screen">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <div className="flex-1 min-h-screen pl-0 md:pl-16">
        <Header />
        <main className="max-w-6xl mx-auto px-2 sm:px-4 pt-8 pb-16">
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
                    grid gap-6
                    grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5
                    ${movies.length < 4 ? "justify-center" : ""}
                  `}
                >
                  {movies.map((movie, idx) => (
                    <Link
                      key={movie.id}
                      to={`/movie/${movie.id}`}
                      className={`
                        group relative bg-[#191923] rounded-2xl overflow-hidden
                        hover:scale-[1.045] hover:z-10 focus:z-10 shadow-xl transition
                        border border-zinc-900
                      `}
                      style={{
                        boxShadow:
                          "0 2px 12px 0 rgba(0,0,0,.18), 0 0px 2px 0 rgba(0,0,0,.12)",
                      }}
                    >
                      {/* Glass overlay for poster */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#15151b]/90 z-10 rounded-2xl pointer-events-none" />
                      <img
                        src={movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : "/placeholder-movie.png"}
                        alt={movie.title}
                        className="rounded-2xl w-full h-[230px] sm:h-[260px] md:h-[285px] object-cover group-hover:opacity-90 transition"
                        loading="lazy"
                      />
                      <div className="absolute left-2 top-2 z-20">
                        <span className="bg-black/70 text-zinc-200 px-2 py-[2px] rounded-full text-xs font-bold backdrop-blur shadow">
                          {movie.release_date ? movie.release_date.slice(0, 4) : "—"}
                        </span>
                      </div>
                      {/* Title appears on hover */}
                      <div className={`
                        absolute bottom-0 left-0 w-full z-20 px-3 py-2 
                        bg-gradient-to-t from-[#161623]/80 via-transparent to-transparent
                        flex flex-col
                      `}>
                        <div className={`
                          text-white font-bold text-base truncate drop-shadow
                          transition duration-200 opacity-90 group-hover:opacity-100
                        `}>
                          {movie.title}
                        </div>
                      </div>
                      {/* Subtle outline on hover/focus */}
                      <div className={`
                        pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-orange-400/0 
                        group-hover:ring-2 group-hover:ring-orange-500/40
                        transition
                      `} />
                    </Link>
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
