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
        const all = (data.results || []).sort(
          (a, b) => (b.popularity || 0) + (b.vote_average || 0) - ((a.popularity || 0) + (a.vote_average || 0))
        );
        setResults(all); setShowAllResults(false);
      });
    return () => { active = false; };
  }, [search]);

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

  async function handleRemoveMovie(movie_id) {
    setMovies(curr => curr.filter(m => m.movie_id !== movie_id));
    await supabase.from("user_movies")
      .delete()
      .eq("user_id", user.id)
      .eq("movie_id", movie_id);
  }

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
    <div className="
      max-w-[700px] mx-auto mt-14 p-7 bg-[#191820] rounded-2xl shadow-2xl
      relative flex flex-col
    ">
      {/* X button */}
      <button
        onClick={() => navigate("/app")}
        className="
          absolute top-4 right-5 text-white opacity-60 hover:opacity-100
          bg-transparent border-none text-xl cursor-pointer z-20
        "
        aria-label="Close Preferences"
        title="Go back to Home"
        type="button"
      >
        <X size={26} />
      </button>

      <h2 className="text-white text-[23px] font-extrabold mb-6 tracking-tight">
        Preferences
      </h2>

      {/* Genres */}
      <div className="mb-9">
        <div className="text-[#fdaf41] font-bold mb-2">
          Genres you like:
        </div>
        <div className="flex flex-wrap gap-2">
          {GENRES.map(g => (
            <button
              key={g.id}
              onClick={() => toggleGenre(g.id)}
              className={`
                px-5 py-2 font-semibold text-[15px] rounded-xl outline-none
                border-none cursor-pointer transition
                ${genres.includes(g.id)
                  ? "bg-gradient-to-r from-blue-500 to-orange-300 shadow"
                  : "bg-[#242134]"}
                text-white
              `}
              type="button"
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Movie preferences */}
      <div className="mb-6">
        <div className="text-[#fdaf41] font-bold mb-2">Your favorite movies:</div>
        {/* Search bar for movies */}
        <div className="relative max-w-[400px] mb-3">
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search for movies to add…"
            className="
              w-full py-2.5 px-4 pr-10 text-[15px] rounded-full bg-[#23212b] text-white
              border-none outline-none font-sans focus:ring-2 focus:ring-orange-400
              placeholder:text-zinc-400
              transition
            "
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
          />
          {/* Suggestions */}
          {search && searchOpen && results.length > 0 && (
            <div
              className="
                bg-[#242134] rounded-xl shadow-lg absolute left-0 right-0 top-12
                max-h-[180px] overflow-y-auto z-20
                animate-fadeIn
              "
            >
              {(showAllResults ? results : results.slice(0, 4)).map(r => (
                <div
                  key={r.id}
                  className="
                    flex items-center px-3 py-2 gap-2 cursor-pointer
                    border-b border-[#302c37] last:border-b-0
                    transition hover:bg-[#232330]
                  "
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
                    className="w-9 h-14 rounded bg-[#101012] object-cover mr-1"
                  />
                  <span className="font-semibold text-[15px] text-white">
                    {r.title}
                    <span className="ml-2 text-[#eee] font-normal text-[14px]">
                      {r.release_date ? `(${r.release_date.slice(0, 4)})` : ""}
                    </span>
                  </span>
                </div>
              ))}
              {!showAllResults && results.length > 4 && (
                <div
                  className="text-center py-1 text-[#fdaf41] font-semibold text-[15px] cursor-pointer select-none"
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
          <div className="flex flex-wrap gap-3 mb-2">
            {movies.map(m => (
              <div key={m.movie_id}
                className="
                  flex flex-col items-center gap-1 bg-[#231d2d]
                  rounded-md px-2 py-2
                "
              >
                <img
                  src={m.poster_path
                    ? `https://image.tmdb.org/t/p/w92${m.poster_path}`
                    : "https://dummyimage.com/80x120/232330/fff&text=No+Image"}
                  alt={m.title}
                  className="w-12 h-20 rounded bg-[#101012] object-cover"
                />
                <span className="font-semibold text-[12px] text-white mt-1 text-center">
                  {m.title}
                </span>
                <button
                  className="text-[#fd7069] text-lg font-bold opacity-80 hover:opacity-100 mt-0.5"
                  onClick={() => handleRemoveMovie(m.movie_id)}
                  tabIndex={-1}
                  type="button"
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="
          bg-gradient-to-r from-orange-400 to-red-500
          text-white font-bold py-3 px-9 rounded-lg text-[17px]
          cursor-pointer shadow-md transition disabled:opacity-70
        "
      >
        {saving ? "Saving..." : "Save Preferences"}
      </button>
      {/* Animation for dropdown */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(12px);}
            to { opacity: 1; transform: translateY(0);}
          }
          .animate-fadeIn {
            animation: fadeIn 0.22s cubic-bezier(.33,1,.68,1) both;
          }
        `}
      </style>
    </div>
  );
}
