// src/app/pages/watched/WatchedHistory.jsx
import { useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase/client";
import MovieCard from "@/app/pages/components/MovieCard";
import MovieGrid from "@/app/pages/components/MovieGrid";
import { Loader2 } from "lucide-react";

export default function WatchedHistory() {
  const [user, setUser] = useState(null);
  const [watched, setWatched] = useState([]);    // user_watched table entries
  const [movies, setMovies] = useState([]);      // merged movie data with poster/title/etc
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  // Get current user
  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (active) setUser(user || null);
    })();
    return () => { active = false; };
  }, []);

  // Get watched movie IDs for this user
  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);

    (async () => {
      try {
        const { data: watchedRows, error } = await supabase
          .from("movies_watched")
          .select("movie_id,added_at")   // add ,status if you use for highlighting
          .eq("user_id", user.id)
          .order("id", { ascending: false });
        if (error) throw error;

        if (!watchedRows?.length) {
          if (active) {
            setWatched([]);
            setMovies([]);
            setLoading(false);
          }
          return;
        }
        // Get unique movie IDs
        const ids = watchedRows.map(row => row.movie_id).filter(Boolean);

        // Fetch movie details for those IDs from your "movies" table (local TMDB mirror)
        const { data: movieRows, error: moviesErr } = await supabase
          .from("movies")
          .select("id,title,poster_path,release_date,vote_average")
          .in("id", ids);

        if (moviesErr) throw moviesErr;

        // Merge: only show valid/matching movies, keep added_at for sorting if wanted
        const moviesById = Object.fromEntries((movieRows || []).map(m => [m.id, m]));
        const merged = watchedRows
          .map(row => ({
            ...(moviesById[row.movie_id] || {}),
            movie_id: row.movie_id,
            added_at: row.added_at
          }))
          .filter(m => m.id); // only movies found in the movies table

        if (active) {
          setWatched(watchedRows);
          setMovies(merged);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setWatched([]);
          setMovies([]);
          setLoading(false);
        }
      }
    })();

    return () => { active = false; };
  }, [user, removingId]);

  // Remove a movie from watched history
  async function remove(movie_id) {
    if (!user) return;
    setRemovingId(movie_id);
    try {
      await supabase.from("movies_watched")
        .delete()
        .eq("user_id", user.id)
        .eq("movie_id", movie_id);
      setMovies(prev => prev.filter(m => m.movie_id !== movie_id));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8 min-h-screen">
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          Watched History
        </h1>
        <span className="text-white/70 font-semibold">
          {loading ? "Loading…" : movies.length + " movies"}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[40vh] text-white/80">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading your watched history…
        </div>
      ) : movies.length === 0 ? (
        <EmptyState />
      ) : (
        <MovieGrid>
          {movies.map(m => (
            <MovieCard
              key={m.movie_id}
              movie={m}
              onRemove={() => remove(m.movie_id)}
              removing={removingId === m.movie_id}
            />
          ))}
        </MovieGrid>
      )}
    </main>
  );
}

function EmptyState() {
  return (
    <div className="mt-14 flex flex-col items-center justify-center text-center text-white/90">
      <span role="img" aria-label="Empty" className="block text-3xl mb-2">🍿</span>
      <div className="text-xl font-semibold">No watched movies yet.</div>
      <div className="mt-1 text-white/60">Mark some as watched to see them here!</div>
    </div>
  );
}
