// src/app/pages/watched/WatchedHistory.jsx
import { useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase/client";
import MovieCard from "@/app/pages/components/MovieCard";
import MovieGrid from "@/app/pages/components/MovieGrid";
import { Loader2 } from "lucide-react";

export default function WatchedHistory() {
  const [user, setUser] = useState(null);
  const [movies, setMovies] = useState([]);
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

  // Get watched movies for this user (from movies_watched, all display fields present)
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
          .order("id", { ascending: false });
        if (error) throw error;
        if (active) setMovies(data ?? []);
      } catch (err) {
        if (active) setMovies([]);
      } finally {
        if (active) setLoading(false);
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
              // MovieCard expects { id, title, poster_path, release_date, vote_average}
              movie={{
                id: m.movie_id,
                title: m.title,
                poster_path: m.poster,
                release_date: m.release_date,
                vote_average: m.vote_average,
                status: m.source // show onboarding badge if wanted
              }}
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
