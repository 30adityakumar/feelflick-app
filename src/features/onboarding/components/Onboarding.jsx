import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";

// Replace with your genre list
const GENRES = [
  { id: 28, label: "Action" },
  { id: 12, label: "Adventure" },
  { id: 16, label: "Animation" },
  { id: 35, label: "Comedy" },
  { id: 80, label: "Crime" },
  { id: 18, label: "Drama" },
  { id: 10751, label: "Family" },
  { id: 14, label: "Fantasy" },
];

export default function Onboarding() {
  const navigate = useNavigate();

  // Step: 1 = genres, 2 = favorite movies
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showAllResults, setShowAllResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  // Add your API key here or use env
  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "";

  useEffect(() => {
    setChecking(true);
    // Example: check if user profile exists (fake logic for now)
    setTimeout(() => setChecking(false), 400);
  }, []);

  // Fetch movies from TMDb API as user types
  useEffect(() => {
    if (!query) return setResults([]);
    fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => setResults(data.results || []));
  }, [query]);

  // Genre toggle
  function toggleGenre(id) {
    setSelectedGenres(g =>
      g.includes(id) ? g.filter(x => x !== id) : [...g, id]
    );
  }

  // Add/remove movies to user's list
  function handleAddMovie(movie) {
    if (!watchlist.find(m => m.id === movie.id)) {
      setWatchlist(list => [...list, movie]);
    }
    setQuery("");
    setResults([]);
    setShowAllResults(false);
  }
  function handleRemoveMovie(id) {
    setWatchlist(list => list.filter(m => m.id !== id));
  }

  // Save/skip logic: normally would call Supabase, here just simulate
  function saveAndGo(skip, skipMovies) {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/app");
    }, 600);
  }

  // --- Loader while checking profile ---
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white font-bold text-lg tracking-wide">
        Loading&nbsp;profile…
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[url('/background-poster.jpg')] bg-cover bg-center bg-[#18141c] flex flex-col items-stretch justify-stretch relative font-sans">
      {/* Logo top left */}
      <div className="absolute left-4 top-6 z-10 flex items-center gap-2.5">
        <img src="/logo.png" alt="FeelFlick" className="w-10 h-10 rounded-xl shadow" />
        <span className="text-xl font-black text-white tracking-tight drop-shadow">FeelFlick</span>
      </div>
      <div
        className={`
          w-full max-w-[440px] mx-auto min-h-[500px]
          mt-20 mb-4
          rounded-2xl bg-[rgba(22,19,28,0.9)] shadow-2xl
          px-4 py-7
          flex flex-col
          sm:max-w-[99vw] sm:rounded-[16px] sm:px-1 sm:py-3
        `}
      >
        {/* Error Message */}
        {error && (
          <div className="text-[#f44336] bg-[#3d1113] rounded-md text-center mb-4 font-semibold text-[15px] py-2 px-1">
            {error}
          </div>
        )}

        {/* Step 1: Genres */}
        {step === 1 && (
          <>
            <h2 className="text-2xl font-black text-white text-center mb-1 tracking-tight">
              Let’s get to know your taste.
            </h2>
            <div className="text-[13px] font-normal text-[#e9e9ef] text-center mb-2 mt-1">
              Pick a few genres you love — it helps us recommend movies that truly match your energy.
            </div>
            {/* Genre Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 w-full mx-auto mb-3">
              {GENRES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`
                    w-full sm:w-[108px] h-[34px] rounded-lg border transition
                    text-white text-[12px] font-medium
                    ${selectedGenres.includes(g.id)
                      ? "bg-gradient-to-r from-[#FF5B2E] to-[#367cff] border-orange-400 shadow"
                      : "bg-transparent border-orange-400"}
                    outline-none focus:ring-2 ring-orange-300
                    overflow-hidden text-ellipsis whitespace-nowrap
                  `}
                  onClick={() => toggleGenre(g.id)}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-5 mt-5">
              <button
                className={`
                  px-5 py-2 rounded-lg font-black text-[15px] bg-gradient-to-r from-[#fe9245] to-[#eb423b] text-white shadow transition
                  min-w-[80px] disabled:opacity-60
                `}
                disabled={loading}
                onClick={() => setStep(2)}
              >
                Next
              </button>
              <button
                className="bg-none text-[#fe9245] font-black text-[13.5px] min-w-[44px] hover:underline"
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
            <div className="text-[13px] text-white font-normal text-center mb-2 mt-1 opacity-85">
              Pick a few to help us understand your taste and give you more personalized suggestions.
            </div>
            <input
              type="text"
              placeholder="Search a movie…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-[#232330] rounded-md px-3 py-2 text-[13px] font-medium text-white outline-none border-none mb-2 shadow"
            />
            {/* Suggestions */}
            {query && results.length > 0 && (
              <div className="bg-[#242134] rounded-xl max-h-[180px] overflow-y-auto mb-2 shadow">
                {(showAllResults ? results : results.slice(0, 3)).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center px-3 py-2 border-b border-zinc-700 cursor-pointer gap-2 transition hover:bg-[#222137]"
                    onClick={() => handleAddMovie(r)}
                  >
                    <img
                      src={r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : "https://dummyimage.com/80x120/232330/fff&text=No+Image"}
                      alt={r.title}
                      className="w-7 h-10 object-cover rounded bg-[#101012] mr-1"
                    />
                    <span className="text-white font-semibold text-[13px] flex flex-col">
                      {r.title}
                      <span className="text-zinc-300 text-[12px] ml-2 font-normal">{r.release_date ? `(${r.release_date.slice(0, 4)})` : ""}</span>
                    </span>
                  </div>
                ))}
                {!showAllResults && results.length > 3 && (
                  <div className="text-center py-2 text-[#fe9245] font-semibold text-[14px] cursor-pointer" onClick={() => setShowAllResults(true)}>
                    See more
                  </div>
                )}
              </div>
            )}

            {/* Watchlist chips */}
            {watchlist.length > 0 && (
              <div>
                <div className="text-white font-bold text-[14px] mt-3 mb-2">Your picks:</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {watchlist.map(m => (
                    <div key={m.id} className="flex flex-col items-center gap-1 bg-[#231d2d] rounded px-1 py-1">
                      <img
                        src={m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : "https://dummyimage.com/80x120/232330/fff&text=No+Image"}
                        alt={m.title}
                        className="w-[54px] h-[78px] object-cover rounded bg-[#101012]"
                      />
                      <span className="text-white font-medium text-[12px] mt-1 text-center">{m.title}</span>
                      <button
                        className="bg-none border-none text-[#fd7069] text-xl mt-0 cursor-pointer font-normal opacity-80"
                        onClick={() => handleRemoveMovie(m.id)}
                        tabIndex={-1}
                      >×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center gap-4 mt-2">
              <button
                className="px-4 py-2 rounded font-black text-[12px] bg-none text-[#fe9245] min-w-[44px] hover:underline"
                disabled={loading}
                onClick={() => setStep(1)}
              >
                &lt; Back
              </button>
              <button
                className="px-5 py-2 rounded-lg font-black text-[15px] bg-gradient-to-r from-[#fe9245] to-[#eb423b] text-white shadow min-w-[65px] disabled:opacity-60"
                disabled={loading}
                onClick={() => saveAndGo(false, false)}
              >
                Finish
              </button>
              <button
                className="bg-none text-[#fe9245] font-black text-[12px] min-w-[44px] hover:underline"
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
