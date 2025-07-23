import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";

const ACCENT = "#fe9245";
const ACCENT2 = "#eb423b";
const BTN_BG = "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)";
const GENRE_SELECTED_BG = "linear-gradient(88deg, var(--theme-color,#FF5B2E), var(--theme-color-secondary,#367cff) 80%)";

const GENRES = [
  { id: 28, label: "Action" },
  { id: 12, label: "Adventure" },
  { id: 16, label: "Animation" },
  { id: 35, label: "Comedy" },
  { id: 80, label: "Crime" },
  { id: 99, label: "Documentary" },
  { id: 18, label: "Drama" },
  { id: 10751, label: "Family" },
  { id: 14, label: "Fantasy" },
  { id: 36, label: "History" },
  { id: 27, label: "Horror" },
  { id: 10402, label: "Music" },
  { id: 9648, label: "Mystery" },
  { id: 10749, label: "Romance" },
  { id: 878, label: "Sci-Fi" },
  { id: 53, label: "Thriller" },
];


export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [query, setQuery] = useState("");
  const [suggestedMovies, setSuggestedMovies] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    // Simulate profile check
    setTimeout(() => setChecking(false), 400);
  }, []);

  function toggleGenre(id) {
    setSelectedGenres((g) =>
      g.includes(id) ? g.filter((gid) => gid !== id) : [...g, id]
    );
  }

  function toggleMovie(movie) {
    setSelectedMovies((arr) =>
      arr.some((m) => m.id === movie.id)
        ? arr.filter((m) => m.id !== movie.id)
        : [...arr, movie]
    );
  }

  function saveAndGo(skipGenres = false, skipMovies = false) {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/app");
    }, 700); // Simulate save
  }

  // Simulate movie search
  useEffect(() => {
    if (!query) {
      setSuggestedMovies([]);
      return;
    }
    // Simulate fetch
    setTimeout(() => {
      setSuggestedMovies([
        { id: 1, title: "Inception" },
        { id: 2, title: "The Dark Knight" },
        { id: 3, title: "Interstellar" },
      ].filter((m) => m.title.toLowerCase().includes(query.toLowerCase())));
    }, 250);
  }, [query]);

  // Loader
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white font-bold text-lg tracking-wide">
        Loading&nbsp;profile…
      </div>
    );
  }

  // Main UI
  return (
    <div
      className="min-h-screen w-full bg-cover bg-center flex flex-col justify-center items-stretch relative font-sans"
      style={{ background: `url(/background-poster.jpg) center/cover, #18141c` }}
    >
      {/* Logo top left */}
      <div className="absolute left-8 top-6 z-10 flex items-center gap-3">
        <img src="/logo.png" alt="FeelFlick" className="w-11 h-11 rounded-xl shadow" />
        <span className="text-2xl font-black text-white tracking-tight" style={{ textShadow: "0 1px 7px #19194044" }}>
          FeelFlick
        </span>
      </div>

      {/* Card container */}
      <div className="w-full max-w-[500px] mx-auto min-h-[420px] mt-20 mb-4 bg-[rgba(22,19,28,0.93)] rounded-2xl shadow-2xl px-7 py-9 flex flex-col"
        style={{ zIndex: 10 }}>
        {/* Error */}
        {error && (
          <div className="bg-[#3d1113] text-[#f44336] text-center rounded mb-3 font-semibold text-sm py-2">
            {error}
          </div>
        )}

        {/* Step 1: Genres */}
        {step === 1 && (
          <>
            <h2 className="text-2xl font-black text-white text-center mb-1">Let’s get to know your taste.</h2>
            <div className="text-[13px] text-gray-200 font-normal text-center mb-2 mt-1">
              Pick a few genres you love — it helps us recommend movies that truly match your energy.
            </div>
            {/* Genre grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 mb-4">
              {GENRES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`
                    w-[104px] h-[34px] rounded-lg border
                    text-white text-xs font-medium text-center
                    transition-all duration-150 ease-in
                    ${selectedGenres.includes(g.id)
                      ? "shadow-lg"
                      : "border-orange-400 border-opacity-25"}
                  `}
                  style={{
                    background: selectedGenres.includes(g.id)
                      ? GENRE_SELECTED_BG
                      : "transparent",
                    border: selectedGenres.includes(g.id)
                      ? "1.1px solid #fe9245"
                      : "1.1px solid #2c2c3a"
                  }}
                  onClick={() => toggleGenre(g.id)}
                >
                  <span className="truncate">{g.label}</span>
                </button>
              ))}
            </div>
            {/* Controls */}
            <div className="flex justify-center gap-6 mt-3">
              <button
                className="px-6 py-2 rounded-md font-extrabold text-white shadow"
                style={{
                  background: BTN_BG,
                  opacity: loading ? 0.7 : 1,
                  letterSpacing: 0.01
                }}
                disabled={loading}
                onClick={() => setStep(2)}
              >
                Next
              </button>
              <button
                className="bg-none text-orange-400 font-extrabold text-sm rounded px-4 py-2"
                style={{ color: ACCENT }}
                disabled={loading}
                onClick={() => saveAndGo(true, false)}
              >
                Skip
              </button>
            </div>
          </>
        )}

        {/* Step 2: Movies */}
        {step === 2 && (
          <>
            <h2 className="text-2xl font-black text-white text-center mb-1">Got some favorite movies?</h2>
            <div className="text-[13px] text-gray-100 font-normal text-center mb-2 mt-1 opacity-80">
              Pick a few to help us understand your taste and give you more personalized suggestions.
            </div>
            <input
              type="text"
              placeholder="Search a movie…"
              className="w-full bg-[#232330] rounded px-3 py-2 text-[13px] font-medium text-white outline-none border-none mb-2 mt-1 placeholder:text-zinc-400"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestedMovies.map((movie) => (
                <button
                  key={movie.id}
                  type="button"
                  className={`
                    px-3 py-1 rounded bg-zinc-800 text-white text-xs font-semibold
                    transition-all duration-100 hover:bg-orange-600
                    ${selectedMovies.some((m) => m.id === movie.id) ? "bg-orange-500" : ""}
                  `}
                  onClick={() => toggleMovie(movie)}
                >
                  {movie.title}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedMovies.map((movie) => (
                <span
                  key={movie.id}
                  className="px-3 py-1 rounded bg-orange-600 text-white text-xs font-semibold"
                >
                  {movie.title}
                </span>
              ))}
            </div>
            {/* Control buttons */}
            <div className="flex justify-center gap-4 mt-4">
              <button
                className="bg-none text-orange-400 font-extrabold text-xs rounded px-3 py-2"
                style={{ color: ACCENT }}
                disabled={loading}
                onClick={() => setStep(1)}
              >&lt; Back</button>
              <button
                className="px-7 py-2 rounded-md font-extrabold text-white shadow"
                style={{
                  background: BTN_BG,
                  opacity: loading ? 0.7 : 1
                }}
                disabled={loading}
                onClick={() => saveAndGo(false, false)}
              >
                Finish
              </button>
              <button
                className="bg-none text-orange-400 font-extrabold text-xs rounded px-3 py-2"
                style={{ color: ACCENT }}
                disabled={loading}
                onClick={() => saveAndGo(false, true)}
              >
                Skip
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
