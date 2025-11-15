// src/features/onboarding/Onboarding.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";
import { ChevronRight, Search, X, Check } from "lucide-react";

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

export default function Onboarding() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  const [selectedGenres, setSelectedGenres] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [popular, setPopular] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const searchTimeout = useRef(null);

  /* Session check */
  useEffect(() => {
    let unsub;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    unsub = data?.subscription?.unsubscribe;
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  /* Check if already onboarded */
  useEffect(() => {
    if (!session?.user) return;
    (async () => {
      try {
        const meta = session.user.user_metadata || {};
        if (meta.onboarding_complete === true || meta.has_onboarded === true) {
          navigate("/home", { replace: true });
          return;
        }
        const { data } = await supabase
          .from("users")
          .select("onboarding_complete,onboarding_completed_at")
          .eq("id", session.user.id)
          .maybeSingle();

        if (data?.onboarding_complete === true || data?.onboarding_completed_at) {
          navigate("/home", { replace: true });
        } else {
          setChecking(false);
        }
      } catch (e) {
        console.warn("onboarding check failed:", e);
        setChecking(false);
      }
    })();
  }, [session, navigate]);

  /* Fetch popular movies */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(
          `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&page=1`
        );
        const j = await r.json();
        const picks = (j?.results || [])
          .filter((m) => m.poster_path)
          .slice(0, 12);
        setPopular(picks);
      } catch {
        setPopular([]);
      }
    })();
  }, []);

  /* Search with debounce */
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(
            query
          )}`
        );
        const data = await r.json();
        setResults((data.results || []).slice(0, 10));
      } catch {
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(searchTimeout.current);
  }, [query]);

  const GENRES = [
    { id: 28, label: "Action", emoji: "💥" },
    { id: 12, label: "Adventure", emoji: "🗺️" },
    { id: 16, label: "Animation", emoji: "🎨" },
    { id: 35, label: "Comedy", emoji: "😂" },
    { id: 80, label: "Crime", emoji: "🔫" },
    { id: 99, label: "Documentary", emoji: "🎥" },
    { id: 18, label: "Drama", emoji: "🎭" },
    { id: 10751, label: "Family", emoji: "👨‍👩‍👧‍👦" },
    { id: 14, label: "Fantasy", emoji: "🧙" },
    { id: 36, label: "History", emoji: "📜" },
    { id: 27, label: "Horror", emoji: "👻" },
    { id: 10402, label: "Music", emoji: "🎵" },
    { id: 9648, label: "Mystery", emoji: "🔍" },
    { id: 10749, label: "Romance", emoji: "💕" },
    { id: 878, label: "Sci-Fi", emoji: "🚀" },
    { id: 53, label: "Thriller", emoji: "😱" },
  ];

  const toggleGenre = (id) =>
    setSelectedGenres((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));

  const isInWatchlist = (id) => watchlist.some((x) => x.id === id);
  
  const addToWatchlist = (m) => {
    if (!isInWatchlist(m.id)) {
      setWatchlist((w) => [...w, m]);
    }
  };

  const removeFromWatchlist = (id) =>
    setWatchlist((w) => w.filter((m) => m.id !== id));

  const goNext = () => {
    setDirection(1);
    setStep(2);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(1);
  };

  async function finishOnboarding(opts = {}) {
    const { skipGenres = false, skipMovies = false } = opts;
    setError("");
    setSaving(true);

    try {
      const user_id = session?.user?.id;
      if (!user_id) throw new Error("Not authenticated");

      // Ensure user row exists
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("id", user_id)
        .maybeSingle();

      if (!existing) {
        await supabase.from("users").insert({
          id: user_id,
          email: session.user.email,
          name: session.user.user_metadata?.name || null,
        });
      }

      // Save genres
      if (!skipGenres && selectedGenres.length) {
        await supabase.from("user_preferences").delete().eq("user_id", user_id);
        const rows = selectedGenres.map((genre_id) => ({ user_id, genre_id }));
        await supabase.from("user_preferences").upsert(rows, {
          onConflict: "user_id,genre_id",
        });
      }

      // Save movies
      if (!skipMovies && watchlist.length) {
        const rows = watchlist.map((m) => ({
          user_id,
          movie_id: m.id,
          title: m.title ?? null,
          poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
          release_date: m.release_date ?? null,
          vote_average: typeof m.vote_average === "number" ? m.vote_average : null,
          genre_ids: Array.isArray(m.genre_ids) ? m.genre_ids : null,
          source: "onboarding",
        }));

        for (const row of rows) {
          await supabase.from("movies_watched").upsert(row, {
            onConflict: "user_id,movie_id",
          });
        }
      }

      // Mark complete
      await supabase.from("users").update({
        onboarding_complete: true,
        onboarding_completed_at: new Date().toISOString(),
      }).eq("id", user_id);

      await supabase.auth.updateUser({
        data: { onboarding_complete: true, has_onboarded: true },
      });

      navigate("/home", { replace: true });
    } catch (e) {
      console.error("Onboarding save failed:", e);
      setError(e.message || "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-black text-white">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white mb-4" />
          <p className="text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
          style={{ width: `${(step / 2) * 100}%` }}
        />
      </div>

      {/* Content Container with Slide Animation */}
      <div className="relative h-screen overflow-hidden">
        <div
          className="absolute inset-0 flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(${direction === 1 ? (step === 1 ? '0%' : '-100%') : (step === 1 ? '0%' : '-100%')})`,
          }}
        >
          {/* Step 1: Genres */}
          <div className="w-full flex-shrink-0 h-full overflow-y-auto">
            <StepGenres
              genres={GENRES}
              selectedGenres={selectedGenres}
              toggleGenre={toggleGenre}
              onNext={goNext}
              onSkip={() => finishOnboarding({ skipGenres: true })}
              saving={saving}
            />
          </div>

          {/* Step 2: Movies */}
          <div className="w-full flex-shrink-0 h-full overflow-y-auto">
            <StepMovies
              popular={popular}
              query={query}
              setQuery={setQuery}
              results={results}
              searchLoading={searchLoading}
              watchlist={watchlist}
              isInWatchlist={isInWatchlist}
              addToWatchlist={addToWatchlist}
              removeFromWatchlist={removeFromWatchlist}
              onBack={goBack}
              onFinish={() => finishOnboarding()}
              onSkip={() => finishOnboarding({ skipMovies: true })}
              saving={saving}
            />
          </div>
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-red-500/90 backdrop-blur-md text-white px-4 py-3 rounded-lg shadow-2xl z-50 animate-slide-up">
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={() => setError("")}
            className="absolute top-2 right-2 text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ===== Step 1: Genres ===== */
function StepGenres({ genres, selectedGenres, toggleGenre, onNext, onSkip, saving }) {
  return (
    <div className="min-h-screen flex flex-col px-4 sm:px-6 md:px-8 lg:px-12 py-12 sm:py-16 md:py-20">
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <p className="text-sm sm:text-base text-white/60 font-semibold mb-2">Step 1 of 2</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4">
            What do you love?
          </h1>
          <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto">
            Pick at least 3 genres to help us personalize your experience
          </p>
        </div>

        {/* Genre Grid */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {genres.map((g) => {
            const active = selectedGenres.includes(g.id);
            return (
              <button
                key={g.id}
                onClick={() => toggleGenre(g.id)}
                className={`relative group rounded-2xl p-6 transition-all duration-300 ${
                  active
                    ? "bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/50 scale-105"
                    : "bg-white/5 border-2 border-white/10 hover:border-white/30 hover:bg-white/10"
                }`}
              >
                <div className="text-4xl mb-2">{g.emoji}</div>
                <div className="text-sm sm:text-base font-bold">{g.label}</div>
                {active && (
                  <div className="absolute top-2 right-2 bg-orange-500 rounded-full p-1">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onNext}
            disabled={selectedGenres.length < 3 || saving}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 px-8 py-4 rounded-full text-lg font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xl"
          >
            Continue
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={onSkip}
            disabled={saving}
            className="text-white/60 hover:text-white font-semibold transition-colors"
          >
            Skip
          </button>
        </div>

        {selectedGenres.length > 0 && selectedGenres.length < 3 && (
          <p className="text-center text-sm text-orange-400 mt-4">
            Pick {3 - selectedGenres.length} more to continue
          </p>
        )}
      </div>
    </div>
  );
}

/* ===== Step 2: Movies ===== */
function StepMovies({
  popular,
  query,
  setQuery,
  results,
  searchLoading,
  watchlist,
  isInWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  onBack,
  onFinish,
  onSkip,
  saving,
}) {
  return (
    <div className="min-h-screen flex flex-col px-4 sm:px-6 md:px-8 lg:px-12 py-12 sm:py-16 md:py-20">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-sm sm:text-base text-white/60 font-semibold mb-2">Step 2 of 2</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4">
            Pick your favorites
          </h1>
          <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto mb-6">
            Add at least 5 movies you love — the more you add, the better your recommendations
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for movies..."
              className="w-full bg-white/10 border border-white/20 rounded-full pl-12 pr-4 py-4 text-white placeholder-white/40 focus:outline-none focus:border-orange-500/50 focus:bg-white/15 transition-all"
            />
            {searchLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        {query && results.length > 0 && (
          <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-4 max-h-80 overflow-y-auto">
            {results.map((m) => (
              <MovieSearchResult
                key={m.id}
                movie={m}
                isSelected={isInWatchlist(m.id)}
                onToggle={() =>
                  isInWatchlist(m.id) ? removeFromWatchlist(m.id) : addToWatchlist(m)
                }
              />
            ))}
          </div>
        )}

        {/* Popular Movies */}
        {!query && popular.length > 0 && (
          <div className="flex-1 mb-6">
            <h3 className="text-lg font-bold mb-4">Popular Movies</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-3">
              {popular.map((m) => (
                <MoviePoster
                  key={m.id}
                  movie={m}
                  isSelected={isInWatchlist(m.id)}
                  onToggle={() =>
                    isInWatchlist(m.id) ? removeFromWatchlist(m.id) : addToWatchlist(m)
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Selected Movies */}
        {watchlist.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4">Your Picks ({watchlist.length})</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {watchlist.map((m) => (
                <div key={m.id} className="relative flex-shrink-0">
                  <img
                    src={`https://image.tmdb.org/t/p/w185${m.poster_path}`}
                    alt={m.title}
                    className="w-20 h-30 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeFromWatchlist(m.id)}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onBack}
            disabled={saving}
            className="text-white/60 hover:text-white font-semibold transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={onFinish}
            disabled={watchlist.length < 5 || saving}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 px-8 py-4 rounded-full text-lg font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xl"
          >
            {saving ? "Saving..." : "Finish"}
          </button>
          <button
            onClick={onSkip}
            disabled={saving}
            className="text-white/60 hover:text-white font-semibold transition-colors"
          >
            Skip
          </button>
        </div>

        {watchlist.length > 0 && watchlist.length < 5 && (
          <p className="text-center text-sm text-orange-400 mt-4">
            Add {5 - watchlist.length} more to continue
          </p>
        )}
      </div>
    </div>
  );
}

/* ===== Movie Poster Card ===== */
function MoviePoster({ movie, isSelected, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`relative rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 ${
        isSelected ? "ring-4 ring-orange-500" : ""
      }`}
    >
      <img
        src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
        alt={movie.title}
        className="w-full aspect-[2/3] object-cover"
      />
      {isSelected && (
        <div className="absolute inset-0 bg-orange-500/20 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-orange-500 rounded-full p-2">
            <Check className="h-5 w-5" />
          </div>
        </div>
      )}
    </button>
  );
}

/* ===== Search Result Item ===== */
function MovieSearchResult({ movie, isSelected, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors group"
    >
      <img
        src={
          movie.poster_path
            ? `https://image.tmdb.org/t/p/w92${movie.poster_path}`
            : "https://via.placeholder.com/92x138/111/fff?text=?"
        }
        alt={movie.title}
        className="w-12 h-18 object-cover rounded"
      />
      <div className="flex-1 text-left">
        <div className="font-semibold text-white group-hover:text-orange-400 transition-colors">
          {movie.title}
        </div>
        <div className="text-sm text-white/60">
          {movie.release_date ? movie.release_date.slice(0, 4) : "—"}
        </div>
      </div>
      <div
        className={`transition-colors ${
          isSelected ? "text-orange-500 font-bold" : "text-white/40"
        }`}
      >
        {isSelected ? <Check className="h-5 w-5" /> : "Add"}
      </div>
    </button>
  );
}
