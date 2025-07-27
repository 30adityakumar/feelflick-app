import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";
import Header from "@/app/header/Header"; // Adjust if needed
// import Sidebar from "@/components/Sidebar"; // Uncomment if needed

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
        .eq('user_id', user.id)
        .eq('status', 'want_to_watch');

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
    <div className="min-h-screen bg-[#161623] pb-14">
      <Header />
      {/* <Sidebar /> If your sidebar isn't global, uncomment this line */}
      <div className="max-w-5xl mx-auto px-3 pt-7">
        <h1 className="text-2xl md:text-3xl font-black mb-6 text-white tracking-tight">
          <span role="img" aria-label="bookmark">🔖</span> Your Watchlist
        </h1>
        {(!user || loading) ? (
          <div className="text-center text-white mt-16">Loading your Watchlist...</div>
        ) : (
          <div>
            {movies.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px]">
                <div className="text-zinc-400 text-xl mb-2">
                  Your watchlist is empty.
                </div>
                <div className="text-zinc-500">
                  Add movies you want to see!
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {movies.map(movie => (
                  <Link
                    key={movie.id}
                    to={`/movie/${movie.id}`}
                    className="bg-[#191923] rounded-xl hover:scale-[1.04] shadow-md transition p-1 group"
                  >
                    <img
                      src={movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : "/placeholder-movie.png"}
                      alt={movie.title}
                      className="rounded-lg w-full h-[220px] object-cover mb-2 group-hover:opacity-90"
                      loading="lazy"
                    />
                    <div className="text-base font-semibold text-white truncate px-2">
                      {movie.title}
                    </div>
                    <div className="text-xs text-zinc-400 px-2 pb-2">
                      {movie.release_date ? movie.release_date.slice(0, 4) : ""}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
