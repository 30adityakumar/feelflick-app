// src/features/onboarding/Onboarding.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";
import { markOnboardingComplete } from "@/shared/lib/supabase/onboarding";

const BTN_BG = "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)";
const GENRE_SELECTED_BG =
  "linear-gradient(88deg, var(--theme-color,#FF5B2E), var(--theme-color-secondary,#367cff) 80%)";
const DARK_BG = "rgba(22,19,28,0.9)";

export default function Onboarding() {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showAllResults, setShowAllResults] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

  /* ------------------------------------------------------------------ */
  /* 0) If onboarding already complete (metadata OR table) → go /home   */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user }, error: uerr } = await supabase.auth.getUser();
      if (uerr) console.warn(uerr);
      if (!user) {
        navigate("/auth", { replace: true });
        return;
      }

      const meta = user.user_metadata || {};
      const metaDone =
        meta.onboarding_complete === true ||
        meta.has_onboarded === true ||
        meta.onboarded === true ||
        !!meta.onboarding_completed_at;

      let tableDone = false;
      const { data, error } = await supabase
        .from("users")
        .select("onboarding_complete")
        .eq("id", user.id)
        .maybeSingle();

      if (!error) tableDone = !!data?.onboarding_complete;

      if (metaDone || tableDone) {
        navigate("/home", { replace: true });
        return;
      }

      if (mounted) setChecking(false);
    })();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  /* ----------------------------------------------- */
  /* 1) Static genres list                           */
  /* ----------------------------------------------- */
  const GENRES = useMemo(
    () => [
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
      { id: 878, label: "Sci-fi" },
      { id: 53, label: "Thriller" },
    ],
    []
  );

  /* ----------------------------------------------- */
  /* 2) TMDb search                                  */
  /* ----------------------------------------------- */
  useEffect(() => {
    let active = true;
    if (!query) {
      setResults([]);
      setShowAllResults(false);
      return;
    }

    fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(
        query
      )}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const all = (data?.results || []).sort(
          (a, b) =>
            (b.popularity || 0) - (a.popularity || 0) ||
            (b.vote_average || 0) - (a.vote_average || 0)
        );
        setResults(all);
        setShowAllResults(false);
      })
      .catch((e) => console.warn("TMDb search failed:", e));

    return () => {
      active = false;
    };
  }, [query, TMDB_KEY]);

  /* ----------------------------------------------- */
  /* 3) UI helpers                                   */
  /* ----------------------------------------------- */
  const toggleGenre = (id) =>
    setSelectedGenres((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));

  const handleAddMovie = (m) => {
    if (!watchlist.some((x) => x.id === m.id)) {
      setWatchlist((w) => [...w, m]);
    }
    setQuery("");
    setResults([]);
    setShowAllResults(false);
  };

  const handleRemoveMovie = (id) =>
    setWatchlist((w) => w.filter((m) => m.id !== id));

  /* ------------------------------------------------------------------ */
  /* 4) Save + mark complete (writes both auth metadata & users table)  */
  /* ------------------------------------------------------------------ */
  async function saveAndFinish({ skipGenres = false, skipMovies = false } = {}) {
    setError("");
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const user_id = user.id;
      const email = user.email ?? null;
      const name = user.user_metadata?.name ?? null;

      // Ensure a row exists in public.users (RLS policies must allow this)
      {
        const { error } = await supabase
          .from("users")
          .upsert({ id: user_id, email, name }, { onConflict: "id" });
        if (error) throw error;
      }

      // Preferences
      if (!skipGenres) {
        await supabase.from("user_preferences").delete().eq("user_id", user_id);
        if (selectedGenres.length) {
          const rows = selectedGenres.map((genre_id) => ({ user_id, genre_id }));
          const { error } = await supabase
            .from("user_preferences")
            .upsert(rows, { onConflict: "user_id,genre_id" });
          if (error) throw error;
        }
      }

      // Movies / watchlist
      if (!skipMovies && watchlist.length) {
        // Seed main movies table (idempotent)
        const movieRows = watchlist.map((m) => ({
          tmdb_id: m.id,
          title: m.title,
          poster_path: m.poster_path ?? null,
          release_date: m.release_date ?? null,
        }));
        const { error: moviesErr } = await supabase
          .from("movies")
          .upsert(movieRows, { onConflict: "tmdb_id" });
        if (moviesErr) throw moviesErr;

        // Optional: your “watched” table
        const watchedRows = watchlist.map((m) => ({
          user_id,
          movie_id: m.id,
          title: m.title,
          poster: m.poster_path ?? null,
          release_date: m.release_date ?? null,
          vote_average: m.vote_average ?? null,
          genre_ids: m.genre_ids ?? null,
        }));
        const { error: watchedErr } = await supabase
          .from("movies_watched")
          .upsert(watchedRows, { onConflict: "user_id,movie_id" });
        if (watchedErr) console.warn("movies_watched upsert warning:", watchedErr);

        // Clean + upsert onboarding watchlist
        await supabase
          .from("user_watchlist")
          .delete()
          .eq("user_id", user_id)
          .eq("status", "onboarding");

        const wlRows = watchlist.map((m) => ({
          user_id,
          movie_id: m.id,
          status: "onboarding",
        }));
        const { error: wlErr } = await supabase
          .from("user_watchlist")
          .upsert(wlRows, { onConflict: "user_id,movie_id" });
        if (wlErr) throw wlErr;
      }

      // ✅ Belt + suspenders: updates auth metadata + users.onboarding_complete
      await markOnboardingComplete();

      navigate("/home", { replace: true });
    } catch (e) {
      console.error("Onboarding save failed:", e);
      setError(e?.message || "Could not save your preferences — please try again.");
    } finally {
      setLoading(false);
    }
  }

  /* ----------------------------------------------- */
  /* 5) Loader                                       */
  /* ----------------------------------------------- */
  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-black text-white">
        <div className="text-lg font-bold">Loading profile…</div>
      </div>
    );
  }

  /* ----------------------------------------------- */
  /* 6) UI                                           */
  /* ----------------------------------------------- */
  const CARD_WIDTH = typeof window !== "undefined" && window.innerWidth < 700 ? "100vw" : "700px";
  const CARD_MARGIN =
    typeof window !== "undefined" && window.innerWidth < 700 ? "11px" : "0 auto";

  return (
    <div
      className="min-h-screen w-screen flex flex-col items-stretch justify-stretch relative font-sans"
      // Same family as your LandingHero so the transition feels smooth
      style={{
        background:
          "linear-gradient(120deg,#0a121a 0%,#0d1722 50%,#0c1017 100%)",
      }}
    >
      {/* Logo top left */}
      <div className="absolute left-8 top-6 z-10 flex items-center gap-2.5">
        <img
          src="/logo.png"
          alt="FeelFlick"
          className="w-[42px] h-[42px] rounded-[12px] shadow-md"
        />
        <span className="text-[23px] font-extrabold text-white tracking-tight drop-shadow-lg">
          FeelFlick
        </span>
      </div>

      {/* Card */}
      <div
        className="self-center flex flex-col"
        style={{
          width: CARD_WIDTH,
          margin: CARD_MARGIN,
          minHeight: 500,
          marginTop: 72,
          marginBottom: 16,
          background: DARK_BG,
          borderRadius: 22,
          boxShadow: "0 8px 44px 0 #0007",
          padding: "36px 30px 27px 30px",
          zIndex: 10,
        }}
      >
        {error && (
          <div className="text-red-400 bg-[#3d1113] rounded-md text-center mb-3 font-semibold text-[14.5px] py-2 px-1.5">
            {error}
          </div>
        )}

        {/* ---------- STEP 1: GENRES ---------- */}
        {step === 1 && (
          <>
            <h2 className="text-2xl font-extrabold text-white text-center mb-1 tracking-tight">
              Let’s get to know your taste.
            </h2>
            <div className="text-[13px] font-normal text-[#e9e9ef] text-center mb-2 mt-1 tracking-tight">
              Pick a few genres you love — it helps us recommend movies that match your energy.
            </div>

            <div className="grid grid-cols-4 gap-2 w-full mx-auto mb-3 justify-items-center items-center">
              {GENRES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`w-[120px] h-[34px] rounded-xl border text-white font-medium transition-all duration-150 ${
                    selectedGenres.includes(g.id) ? "shadow-md" : ""
                  }`}
                  style={{
                    margin: "3px 0",
                    border: "1.1px solid #fe9245",
                    background: selectedGenres.includes(g.id)
                      ? GENRE_SELECTED_BG
                      : "transparent",
                    boxShadow: selectedGenres.includes(g.id)
                      ? "0 2px 7px #fdaf4111"
                      : "none",
                    outline: "none",
                    padding: "3.5px 0",
                    fontSize: 12,
                  }}
                  onClick={() => toggleGenre(g.id)}
                >
                  <span className="font-medium text-center leading-[1.17] truncate">
                    {g.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex justify-center mt-4 gap-6">
              <button
                className="px-6 py-2 rounded-lg font-extrabold text-[15px] text-white"
                style={{
                  background: BTN_BG,
                  boxShadow: "0 2px 10px #eb423b22",
                  opacity: loading ? 0.7 : 1,
                  minWidth: 80,
                  letterSpacing: 0.01,
                }}
                disabled={loading}
                onClick={() => setStep(2)}
              >
                Next
              </button>
              <button
                className="bg-none text-[#fe9245] font-extrabold text-[13.5px]"
                disabled={loading}
                onClick={() => saveAndFinish({ skipGenres: true })}
              >
                Skip
              </button>
            </div>
          </>
        )}

        {/* ---------- STEP 2: MOVIES ---------- */}
        {step === 2 && (
          <>
            <h2 className="text-2xl font-extrabold text-white text-center mb-1 tracking-tight">
              Got some favorite movies?
            </h2>
            <div className="text-[13px] text-white font-normal text-center mb-2 mt-1 opacity-85 tracking-tight">
              Pick a few to help us understand your taste and give you more personalized suggestions.
            </div>

            <input
              type="text"
              placeholder="Search a movie…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#232330] rounded-lg py-2.5 px-3 text-[13px] font-medium text-white outline-none border-none mb-2 mt-0 shadow"
            />

            {query && results.length > 0 && (
              <div className="bg-[#242134] rounded-[20px] max-h-[200px] overflow-y-auto mb-1.5 shadow">
                {(showAllResults ? results : results.slice(0, 3)).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center px-3 py-1.5 border-b border-[#302c37] cursor-pointer gap-1.5 transition-colors duration-100 hover:bg-[#232330]"
                    onClick={() => handleAddMovie(r)}
                  >
                    <img
                      src={
                        r.poster_path
                          ? `https://image.tmdb.org/t/p/w185${r.poster_path}`
                          : "https://dummyimage.com/80x120/232330/fff&text=No+Image"
                      }
                      alt={r.title}
                      className="w-[27px] h-[40px] object-cover rounded-[5px] mr-0.5 mb-0.5 bg-[#101012]"
                    />
                    <span className="text-white font-semibold text-[13px]">
                      {r.title}{" "}
                      <span className="text-[#eee] font-normal text-[13px] ml-1.5">
                        {r.release_date ? `(${r.release_date.slice(0, 4)})` : ""}
                      </span>
                    </span>
                  </div>
                ))}
                {!showAllResults && results.length > 3 && (
                  <div
                    className="text-center py-1 text-[#fe9245] font-semibold text-[14px] cursor-pointer select-none"
                    onClick={() => setShowAllResults(true)}
                  >
                    See more
                  </div>
                )}
              </div>
            )}

            {watchlist.length > 0 && (
              <div>
                <div className="text-white font-bold text-[14px] mt-2.5 mb-1.5">
                  Your picks:
                </div>
                <div className="flex flex-wrap gap-2.5 mb-2.5">
                  {watchlist.map((m) => (
                    <div
                      key={m.id}
                      className="flex flex-col items-center gap-0.5 bg-[#231d2d] rounded-md px-0.5 py-0.5"
                    >
                      <img
                        src={
                          m.poster_path
                            ? `https://image.tmdb.org/t/p/w92${m.poster_path}`
                            : "https://dummyimage.com/80x120/232330/fff&text=No+Image"
                        }
                        alt={m.title}
                        className="w-[60px] h-[90px] object-cover rounded bg-[#101012] mx-1.5"
                      />
                      <span className="flex flex-col items-center font-medium text-[13px] text-white mt-1">
                        {m.title}
                      </span>
                      <button
                        className="bg-none border-none text-[#fd7069] text-[22px] mt-0 mx-0 cursor-pointer font-normal opacity-80"
                        onClick={() => handleRemoveMovie(m.id)}
                        tabIndex={-1}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center mt-2 gap-4">
              <button
                className="px-3 py-1.5 rounded-md font-extrabold text-xs text-[#fe9245] bg-none"
                disabled={loading}
                onClick={() => setStep(1)}
              >
                &lt; Back
              </button>
              <button
                className="px-6 py-2 rounded-xl font-extrabold text-[15px] text-white"
                style={{
                  background: BTN_BG,
                  boxShadow: "0 2px 10px #eb423b22",
                  opacity: loading ? 0.7 : 1,
                  minWidth: 65,
                }}
                disabled={loading}
                onClick={() => saveAndFinish({ skipGenres: false, skipMovies: false })}
              >
                Finish
              </button>
              <button
                className="bg-none text-[#fe9245] font-extrabold text-xs"
                disabled={loading}
                onClick={() => saveAndFinish({ skipGenres: false, skipMovies: true })}
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