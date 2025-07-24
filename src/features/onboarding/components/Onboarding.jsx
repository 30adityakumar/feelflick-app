import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";
import { GENRES } from "@/shared/constants";
const ACCENT = "#fe9245";
const ACCENT2 = "#eb423b";
const BTN_BG = "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)";
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [suggested, setSuggested] = useState([]);
  const [allSuggested, setAllSuggested] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [movieLoading, setMovieLoading] = useState(false);
  const searchDebounce = useRef();
  const navigate = useNavigate();

  // --- Initial profile check ---
  useEffect(() => {
    setTimeout(() => setChecking(false), 250);
  }, []);

  // --- Debounced TMDb search (as in your logic) ---
  useEffect(() => {
    if (!search) {
      setSuggested([]);
      setAllSuggested([]);
      setShowAll(false);
      setMovieLoading(false);
      return;
    }
    setMovieLoading(true);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(
          search
        )}&include_adult=false&page=1`
      )
        .then((res) => res.json())
        .then((data) => {
          // Sort by popularity and remove dups/empty titles
          let results = (data.results || [])
            .filter(
              (m) => !!m.title && m.original_language === "en" && m.poster_path
            )
            .sort((a, b) => b.popularity - a.popularity);
          setAllSuggested(results);
          setSuggested(results.slice(0, 6));
          setShowAll(false);
        })
        .finally(() => setMovieLoading(false));
    }, 250);
    return () => clearTimeout(searchDebounce.current);
  }, [search]);

  // --- Save profile logic ---
  async function handleSave({ skipGenres, skipMovies }) {
    setLoading(true);
    setError("");
    // Add Supabase profile logic here if needed
    setTimeout(() => {
      setLoading(false);
      navigate("/app");
    }, 800);
  }

  // --- Genre select ---
  function toggleGenre(id) {
    setSelectedGenres((g) =>
      g.includes(id) ? g.filter((gid) => gid !== id) : [...g, id]
    );
  }

  // --- Movie select ---
  function toggleMovie(movie) {
    setSelectedMovies((arr) =>
      arr.some((m) => m.id === movie.id)
        ? arr.filter((m) => m.id !== movie.id)
        : [...arr, movie]
    );
  }

  // --- Loader spinner for profile check ---
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white font-bold text-lg tracking-wide">
        Loading&nbsp;profile…
      </div>
    );
  }

  // --- Main UI ---
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

      <div className="w-full max-w-[510px] mx-auto min-h-[440px] mt-20 mb-4 bg-[rgba(22,19,28,0.93)] rounded-2xl shadow-2xl px-7 py-9 flex flex-col"
        style={{ zIndex: 10 }}>
        {/* Error */}
        {error && (
          <div className="bg-[#3d1113] text-[#f44336] text-center rounded mb-3 font-semibold text-sm py-2">
            {error}
          </div>
        )}

        {/* --- Step 1: Genres --- */}
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
                      ? "linear-gradient(88deg,#FF5B2E,#367cff 80%)"
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
                onClick={() => handleSave({ skipGenres: true, skipMovies: false })}
              >
                Skip
              </button>
            </div>
          </>
        )}

        {/* --- Step 2: Movies --- */}
        {step === 2 && (
          <>
            <h2 className="text-2xl font-black text-white text-center mb-1">
              Got some favorite movies?
            </h2>
            <div className="text-[13px] text-gray-100 font-normal text-center mb-2 mt-1 opacity-80">
              Pick a few to help us understand your taste and give you more personalized suggestions.
            </div>

            {/* Search Input */}
            <div className="relative w-full max-w-md mx-auto my-4">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Type a movie name…"
                className="
                  w-full bg-[#232330] rounded-xl px-5 py-3
                  text-base text-white font-medium outline-none border-none
                  placeholder:text-zinc-400 shadow
                  transition
                  focus:ring-2 focus:ring-orange-400
                "
                autoFocus
              />
              {/* Dropdown Suggestions or Spinner */}
              {search && (
                <div className="
                  absolute left-0 right-0 mt-1 bg-[#1a1820] rounded-xl shadow-xl z-20
                  py-2 ring-1 ring-zinc-700
                  max-h-[260px] overflow-y-auto animate-fadeIn
                ">
                  {movieLoading && (
                    <div className="flex items-center justify-center text-orange-400 py-6">
                      <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        ></path>
                      </svg>
                      Loading…
                    </div>
                  )}
                  {!movieLoading && (showAll ? allSuggested : suggested).map(movie => (
                    <button
                      key={movie.id}
                      type="button"
                      onClick={() => toggleMovie(movie)}
                      className={`
                        flex items-center gap-3 w-full text-left px-4 py-2 text-white text-[15px] hover:bg-orange-500 hover:text-white rounded-md
                        transition
                        ${selectedMovies.some(m => m.id === movie.id) ? "bg-orange-600 text-white" : ""}
                      `}
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/w154${movie.poster_path}`}
                        alt={movie.title}
                        className="w-8 h-12 rounded shadow border border-zinc-700 object-cover"
                        draggable={false}
                      />
                      <span className="flex-1 flex flex-col items-start">
                        <span className="truncate max-w-[145px]">{movie.title}</span>
                        {movie.release_date && (
                          <span className="text-zinc-400 text-xs mt-0.5">{movie.release_date.slice(0, 4)}</span>
                        )}
                      </span>
                    </button>
                  ))}
                  {!movieLoading && ((showAll ? allSuggested : suggested).length === 0) && (
                    <div className="text-zinc-400 text-center px-5 py-2">No results.</div>
                  )}
                  {!movieLoading && !showAll && allSuggested.length > 6 && (
                    <button
                      className="w-full text-center py-2 text-orange-400 font-semibold hover:underline"
                      onClick={() => setShowAll(true)}
                      type="button"
                    >
                      See more
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Selected Movies Chips */}
            {selectedMovies.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 px-1 justify-center">
                {selectedMovies.map(movie => (
                  <span key={movie.id}
                    className="
                      px-3 py-1 rounded bg-orange-600 text-white text-xs font-semibold
                      flex items-center gap-1
                    "
                  >
                    {movie.title}
                    <button
                      type="button"
                      aria-label="Remove"
                      onClick={() => toggleMovie(movie)}
                      className="ml-2 text-white/80 hover:text-white text-[17px] leading-none"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}

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
                onClick={() => handleSave({ skipGenres: false, skipMovies: false })}
              >
                Finish
              </button>
              <button
                className="bg-none text-orange-400 font-extrabold text-xs rounded px-3 py-2"
                style={{ color: ACCENT }}
                disabled={loading}
                onClick={() => handleSave({ skipGenres: false, skipMovies: true })}
              >
                Skip
              </button>
            </div>

            {/* Dropdown animation keyframes */}
            <style>
              {`
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(12px);}
                to { opacity: 1; transform: translateY(0);}
              }
              .animate-fadeIn {
                animation: fadeIn 0.25s cubic-bezier(.33,1,.68,1) both;
              }
              `}
            </style>
          </>
        )}
      </div>
    </div>
  );
}
