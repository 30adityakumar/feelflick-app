import { useState, useEffect, useRef } from "react";
import { supabase } from "@/shared/lib/supabase/client";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

export default function Preferences({ user }) {
  const [genres, setGenres] = useState([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [showAllResults, setShowAllResults] = useState(false);
  const [movies, setMovies] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef();

  // Fetch genres & movies
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("user_preferences")
      .select("genre_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setGenres(data ? data.map(g => g.genre_id) : []);
      });
    supabase
      .from("user_movies")
      .select("movie_id, title, poster_path")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setMovies(data || []);
      });
  }, [user]);

  function toggleGenre(id) {
    setGenres(g =>
      g.includes(id) ? g.filter(gid => gid !== id) : [...g, id]
    );
  }

  // TMDb search
  useEffect(() => {
    let active = true;
    if (!search) { setResults([]); setShowAllResults(false); return; }
    fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(search)}`)
      .then(r => r.json())
      .then(data => {
        if (!active) return;
        // Sort by popularity and rating
        const all = (data.results || []).sort(
          (a, b) => (b.popularity || 0) + (b.vote_average || 0) - ((a.popularity || 0) + (a.vote_average || 0))
        );
        setResults(all); setShowAllResults(false);
      });
    return () => { active = false; };
  }, [search]);

  // Add movie to preferences (and Supabase)
  async function handleAddMovie(m) {
    if (movies.some(movie => movie.movie_id === m.id)) return;
    const newMovie = {
      user_id: user.id,
      movie_id: m.id,
      title: m.title,
      poster_path: m.poster_path,
    };
    setMovies(curr => [...curr, newMovie]);
    await supabase.from("user_movies").insert([newMovie]);
  }

  // Remove movie
  async function handleRemoveMovie(movie_id) {
    setMovies(curr => curr.filter(m => m.movie_id !== movie_id));
    await supabase.from("user_movies")
      .delete()
      .eq("user_id", user.id)
      .eq("movie_id", movie_id);
  }

  // Save genres to Supabase
  async function handleSave() {
    setSaving(true);
    await supabase
      .from("user_preferences")
      .delete()
      .eq("user_id", user.id);
    await supabase
      .from("user_preferences")
      .insert(genres.map(gid => ({ user_id: user.id, genre_id: gid })));
    setSaving(false);
    alert("Preferences updated!");
  }

  return (
    <div style={{
      maxWidth: 700, margin: "54px auto 0 auto", padding: 28,
      background: "#191820", borderRadius: 18, boxShadow: "0 2px 24px #0004",
      position: "relative"
    }}>
      {/* X button */}
      <button
        onClick={() => navigate("/app")}
        style={{
          position: "absolute", top: 14, right: 18,
          background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", opacity: 0.6, zIndex: 2
        }}
        aria-label="Close Preferences"
        title="Go back to Home"
      >
        <X size={26} />
      </button>
      <h2 style={{ color: "#fff", fontSize: 23, fontWeight: 800, marginBottom: 20 }}>
        Preferences
      </h2>
      {/* Genres */}
      <div style={{ marginBottom: 34 }}>
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
      {/* Movie preferences */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: "#fdaf41", fontWeight: 700, marginBottom: 8 }}>Your favorite movies:</div>
        {/* Search bar for movies */}
        <div style={{ position: "relative", maxWidth: 400, marginBottom: 12 }}>
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search for movies to add…"
            style={{
              width: "100%", padding: "10px 38px 10px 16px", fontSize: 15,
              borderRadius: 24, border: "none", background: "#23212b", color: "#fff",
              fontFamily: "Inter, sans-serif", outline: "none"
            }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
          />
          {/* Suggestions */}
          {search && searchOpen && results.length > 0 && (
            <div
              style={{
                background: "#242134", borderRadius: 14,
                boxShadow: "0 1px 8px #0004",
                position: "absolute", left: 0, right: 0, top: 43,
                maxHeight: 180, overflowY: "auto", marginBottom: 8, zIndex: 2,
              }}
            >
              {(showAllResults ? results : results.slice(0, 4)).map(r => (
                <div
                  key={r.id}
                  style={{
                    display: "flex", alignItems: "center", padding: "7px 11px",
                    borderBottom: "1px solid #302c37", cursor: "pointer", gap: 9,
                    transition: "background 0.11s"
                  }}
                  onClick={() => {
                    handleAddMovie(r);
                    setSearch("");
                    inputRef.current.blur();
                  }}
                >
                  <img
                    src={r.poster_path
                      ? `https://image.tmdb.org/t/p/w185${r.poster_path}`
                      : "https://dummyimage.com/80x120/232330/fff&text=No+Image"}
                    alt={r.title}
                    style={{
                      width: 36, height: 54, objectFit: "cover", borderRadius: 5, marginRight: 2,
                      background: "#101012"
                    }}
                  />
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>
                    {r.title}
                    <span style={{ color: "#eee", fontWeight: 400, fontSize: 14, marginLeft: 7 }}>
                      {r.release_date ? `(${r.release_date.slice(0, 4)})` : ""}
                    </span>
                  </span>
                </div>
              ))}
              {!showAllResults && results.length > 4 && (
                <div
                  style={{
                    textAlign: "center", padding: "5px 0 4px", color: "#fdaf41",
                    fontWeight: 600, fontSize: 15, cursor: "pointer", userSelect: "none"
                  }}
                  onClick={() => setShowAllResults(true)}
                >
                  See more
                </div>
              )}
            </div>
          )}
        </div>
        {/* Watchlist chips */}
        {movies.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px", marginBottom: 10 }}>
            {movies.map(m => (
              <div key={m.movie_id} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                background: "#231d2d", borderRadius: 7, padding: "2px 2px 2px 2px"
              }}>
                <img src={m.poster_path
                  ? `https://image.tmdb.org/t/p/w92${m.poster_path}`
                  : "https://dummyimage.com/80x120/232330/fff&text=No+Image"}
                  alt={m.title}
                  style={{ width: 54, height: 80, objectFit: "cover", borderRadius: 4, background: "#101012" }}
                />
                <span style={{ fontWeight: 600, fontSize: 12, color: "#fff", marginTop: 5 }}>{m.title}</span>
                <button
                  style={{
                    background: "none", border: "none", color: "#fd7069",
                    fontSize: 16, marginTop: 1, marginLeft: 0, marginRight: 0, marginBottom: 1,
                    cursor: "pointer", fontWeight: 600, opacity: 0.78
                  }}
                  onClick={() => handleRemoveMovie(m.movie_id)}
                  tabIndex={-1}
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <button onClick={handleSave} disabled={saving} style={{
        background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
        color: "#fff", border: "none", padding: "11px 36px",
        borderRadius: 8, fontWeight: 700, fontSize: 17, cursor: "pointer", opacity: saving ? 0.7 : 1
      }}>{saving ? "Saving..." : "Save Preferences"}</button>
    </div>
  );
}
