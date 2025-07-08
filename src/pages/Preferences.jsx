import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const GENRES = [
    { id: 28,  label:"Action" }, { id: 12, label:"Adventure" },
    { id: 16,  label:"Animation"}, { id: 35, label:"Comedy" },
    { id: 80,  label:"Crime" },   { id: 99, label:"Documentary" },
    { id: 18,  label:"Drama" },   { id: 10751, label:"Family" },
    { id: 14,  label:"Fantasy" }, { id: 36, label:"History" },
    { id: 27,  label:"Horror" },  { id: 10402,label:"Music" },
    { id: 9648,label:"Mystery"},  { id: 10749,label:"Romance" },
    { id: 878, label:"Sci-fi" },  { id: 53, label:"Thriller"}

];

export default function Preferences({ user }) {
  const [genres, setGenres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [genreInput, setGenreInput] = useState("");
  const [movieInput, setMovieInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch current user preferences on mount
  useEffect(() => {
    if (!user?.id) return;
    // Fetch genres
    supabase
      .from("user_preferences")
      .select("genre_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setGenres(data ? data.map(g => g.genre_id) : []);
      });
    // Fetch favorite movies (assuming you store titles in a table user_movies)
    supabase
      .from("user_movies")
      .select("title")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setMovies(data ? data.map(m => m.title) : []);
      });
  }, [user]);

  function toggleGenre(id) {
    setGenres(g =>
      g.includes(id) ? g.filter(gid => gid !== id) : [...g, id]
    );
  }
  function addMovie() {
    if (movieInput && !movies.includes(movieInput)) setMovies(m => [...m, movieInput]);
    setMovieInput("");
  }
  function removeMovie(title) {
    setMovies(m => m.filter(t => t !== title));
  }

  // Save changes to Supabase
  async function handleSave() {
    setSaving(true);
    // Genres: Delete all, then insert all (simplest for demo)
    await supabase
      .from("user_preferences")
      .delete()
      .eq("user_id", user.id);
    await supabase
      .from("user_preferences")
      .insert(genres.map(gid => ({ user_id: user.id, genre_id: gid })));
    // Movies: same idea (delete all, re-insert)
    await supabase
      .from("user_movies")
      .delete()
      .eq("user_id", user.id);
    await supabase
      .from("user_movies")
      .insert(movies.map(title => ({ user_id: user.id, title })));
    setSaving(false);
    alert("Preferences updated!");
  }

  return (
    <div style={{
      maxWidth: 620, margin: "54px auto 0 auto", padding: 28,
      background: "#191820", borderRadius: 18, boxShadow: "0 2px 24px #0004"
    }}>
      <h2 style={{ color: "#fff", fontSize: 23, fontWeight: 800, marginBottom: 20 }}>
        Preferences
      </h2>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: "#fdaf41", fontWeight: 700, marginBottom: 8 }}>Genres you like:</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {GENRES.map(g => (
            <button key={g.id}
              onClick={() => toggleGenre(g.id)}
              style={{
                background: genres.includes(g.id)
                  ? "linear-gradient(90deg,#367cff 0%,#fdaf41 90%)"
                  : "#242134",
                color: "#fff", border: "none", borderRadius: 16,
                padding: "8px 20px", fontWeight: 600, fontSize: 15,
                cursor: "pointer", outline: "none",
              }}>
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div style={{ color: "#fdaf41", fontWeight: 700, marginBottom: 8 }}>Your favorite movies:</div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 10 }}>
          {movies.map(m => (
            <div key={m} style={{
              background: "#23212b", color: "#fff", borderRadius: 10,
              padding: "7px 14px", display: "flex", alignItems: "center", fontWeight: 600, fontSize: 15
            }}>
              {m}
              <button
                style={{
                  background: "none", border: "none", color: "#fd7069",
                  fontSize: 17, fontWeight: 700, marginLeft: 8, cursor: "pointer"
                }}
                onClick={() => removeMovie(m)}
              >×</button>
            </div>
          ))}
        </div>
        <input
          value={movieInput}
          onChange={e => setMovieInput(e.target.value)}
          placeholder="Add a movie title…"
          style={{
            width: 250, padding: "7px 14px", borderRadius: 7, border: "1px solid #2d2a38",
            background: "#242134", color: "#fff", fontSize: 15, marginRight: 8,
            fontFamily: "Inter, sans-serif"
          }}
          onKeyDown={e => e.key === "Enter" && addMovie()}
        />
        <button onClick={addMovie} style={{
          background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
          color: "#fff", border: "none", padding: "7px 22px",
          borderRadius: 7, fontWeight: 700, fontSize: 15, cursor: "pointer"
        }}>Add</button>
      </div>

      <button onClick={handleSave} disabled={saving} style={{
        background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
        color: "#fff", border: "none", padding: "11px 36px",
        borderRadius: 8, fontWeight: 700, fontSize: 17, cursor: "pointer", opacity: saving ? 0.7 : 1
      }}>{saving ? "Saving..." : "Save Preferences"}</button>
    </div>
  );
}
