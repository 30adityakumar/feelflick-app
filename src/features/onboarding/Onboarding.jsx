import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";

const GENRES = [
  { id: "28", name: "Action" },
  { id: "12", name: "Adventure" },
  { id: "16", name: "Animation" },
  { id: "35", name: "Comedy" },
  { id: "18", name: "Drama" },
  { id: "27", name: "Horror" },
  { id: "53", name: "Thriller" },
  // ... add your favorites or pull from TMDB
];

export default function Onboarding({ session }) {
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [movieTitle, setMovieTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const user_id = session.user.id;

  // Simulate movie add by typing title + hitting Add
  function addMovie() {
    if (!movieTitle.trim()) return;
    setWatchlist((prev) => [
      ...prev,
      {
        id: String(Math.random()).slice(2), // random ID for MVP
        title: movieTitle.trim(),
        poster_path: "", // Leave empty for MVP
        release_date: "",
        vote_average: null,
        genre_ids: selectedGenres,
      },
    ]);
    setMovieTitle("");
  }

  async function saveAndGo(skipGenres = false, skipMovies = false) {
    setError("");
    setLoading(true);
    try {
      // Save user basic info
      await supabase.from("users").upsert(
        [{ id: user_id, email: session.user.email, name: session.user.user_metadata?.name || "" }],
        { onConflict: ["id"] }
      );

      // Save genres
      if (!skipGenres) {
        await supabase.from("user_preferences").delete().eq("user_id", user_id);
        if (selectedGenres.length) {
          await supabase.from("user_preferences").upsert(
            selectedGenres.map((genre_id) => ({ user_id, genre_id })),
            { onConflict: ["user_id", "genre_id"] }
          );
        }
      }

      // Save movies to movies, user_watchlist, movies_watched
      if (!skipMovies) {
        for (const m of watchlist) {
          await supabase.from("movies").upsert(
            {
              tmdb_id: m.id,
              title: m.title,
              poster_path: m.poster_path,
              release_date: m.release_date,
            },
            { onConflict: ["tmdb_id"] }
          );
        }
        await supabase.from("user_watchlist")
          .delete()
          .eq("user_id", user_id)
          .eq("status", "onboarding");

        if (watchlist.length) {
          await supabase.from("user_watchlist").upsert(
            watchlist.map((m) => ({
              user_id,
              movie_id: m.id,
              status: "onboarding",
            })),
            { onConflict: ["user_id", "movie_id"] }
          );

          await supabase.from("movies_watched").upsert(
            watchlist.map((m) => ({
              user_id,
              movie_id: m.id,
              title: m.title,
              poster_path: m.poster_path,
              release_date: m.release_date,
              vote_average: m.vote_average ?? null,
              genre_ids: Array.isArray(m.genre_ids) ? m.genre_ids : [],
              added_at: new Date().toISOString(),
            })),
            { onConflict: ["user_id", "movie_id"] }
          );
        }
      }

      await supabase.from("users").update({ onboarding_complete: true }).eq("id", user_id);
      await supabase.auth.updateUser({ data: { onboarding_complete: true } });

      navigate("/app", { replace: true });
    } catch (e) {
      console.error("Onboarding save failed:", e);
      setError("Could not save your preferences — please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-6">
        Personalize your FeelFlick
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveAndGo();
        }}
        className="space-y-8"
      >
        {/* --- Genres selection --- */}
        <div>
          <h3 className="text-lg font-bold mb-3 text-zinc-200">Pick a few genres you like:</h3>
          <div className="flex flex-wrap gap-3">
            {GENRES.map((g) => (
              <label key={g.id} className="flex items-center gap-2 bg-zinc-800 rounded-full px-4 py-1 cursor-pointer text-zinc-100">
                <input
                  type="checkbox"
                  className="accent-orange-400"
                  value={g.id}
                  checked={selectedGenres.includes(g.id)}
                  onChange={(e) =>
                    setSelectedGenres((old) =>
                      e.target.checked ? [...old, g.id] : old.filter((id) => id !== g.id)
                    )
                  }
                />
                {g.name}
              </label>
            ))}
          </div>
        </div>
        {/* --- Favorite Movies input --- */}
        <div>
          <h3 className="text-lg font-bold mb-3 text-zinc-200">Add a few favorite movies:</h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={movieTitle}
              onChange={(e) => setMovieTitle(e.target.value)}
              className="flex-1 px-3 py-2 rounded bg-zinc-800 text-white"
              placeholder="Type a movie name and hit Add"
            />
            <button
              type="button"
              onClick={addMovie}
              className="px-4 py-2 bg-orange-500 text-white rounded font-bold hover:bg-orange-600"
              disabled={!movieTitle.trim()}
            >
              Add
            </button>
          </div>
          <ul className="space-y-2">
            {watchlist.map((m, idx) => (
              <li key={m.id} className="flex items-center gap-2 text-zinc-100">
                <span>{idx + 1}.</span>
                <span>{m.title}</span>
                <button
                  type="button"
                  onClick={() => setWatchlist(watchlist.filter((wm) => wm.id !== m.id))}
                  className="ml-2 text-red-400 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
        {error && <div className="text-red-400 font-bold py-2">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold rounded-lg shadow hover:scale-105 transition"
        >
          {loading ? "Saving..." : "Finish Onboarding"}
        </button>
      </form>
    </div>
  );
}
