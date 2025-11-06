// src/features/onboarding/Onboarding.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";

const BTN_BG = "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)";

export default function Onboarding() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(1);

  const [selectedGenres, setSelectedGenres] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showAllResults, setShowAllResults] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [popular, setPopular] = useState([]);
  const [popularSource, setPopularSource] = useState(null); // 'app' | 'tmdb' | null

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

  /* ------------------------------ session ------------------------------ */
  useEffect(() => {
    let unsub;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    unsub = data?.subscription?.unsubscribe;
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  /* ------------------------- already onboarded? ------------------------- */
  useEffect(() => {
    if (!session?.user) return;
    (async () => {
      try {
        const meta = session.user.user_metadata || {};
        if (
          meta.onboarding_complete === true ||
          meta.has_onboarded === true ||
          meta.onboarded === true
        ) {
          navigate("/home", { replace: true });
          return;
        }
        const { data, error } = await supabase
          .from("users")
          .select("onboarding_complete,onboarding_completed_at")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) {
          console.warn("users SELECT failed:", error.message);
          setChecking(false);
          return;
        }

        const completed =
          data?.onboarding_complete === true ||
          Boolean(data?.onboarding_completed_at);
        if (completed) navigate("/home", { replace: true });
        else setChecking(false);
      } catch (e) {
        console.warn("onboarding check failed:", e);
        setChecking(false);
      }
    })();
  }, [session, navigate]);

  /* -------- popular picks for step 2 (App-first, TMDb fallback) -------- */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const since = new Date();
        since.setDate(since.getDate() - 90);

        const { data: watched, error: wErr } = await supabase
          .from("movies_watched")
          .select("movie_id")
          .gte("created_at", since.toISOString())
          .limit(5000);

        if (!wErr && watched && watched.length >= 6) {
          const counts = new Map();
          for (const r of watched) {
            counts.set(r.movie_id, (counts.get(r.movie_id) || 0) + 1);
          }
          const topIds = [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .map(([id]) => id);

          const { data: topMovies } = await supabase
            .from("movies")
            .select(
              "id,title,poster_path,release_date,popularity,vote_average"
            )
            .in("id", topIds);

          const withPosters = (topMovies || [])
            .filter((m) => m?.poster_path)
            .sort(
              (a, b) =>
                (b.popularity || 0) - (a.popularity || 0) ||
                (b.vote_average || 0) - (a.vote_average || 0)
            )
            .slice(0, 6);

          if (active && withPosters.length === 6) {
            setPopular(withPosters);
            setPopularSource("app");
            return;
          }
        }
      } catch {
        // fall through
      }

      try {
        const r = await fetch(
          `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}`
        );
        const j = await r.json();
        const picks = (j?.results || [])
          .filter((m) => m.poster_path)
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 6);
        if (active) {
          setPopular(picks);
          setPopularSource("tmdb");
        }
      } catch {
        if (active) setPopular([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [TMDB_KEY]);

  /* -------------------------------- search ------------------------------ */
  useEffect(() => {
    let active = true;
    if (!query) {
      setResults([]);
      setShowAllResults(false);
      return;
    }
    (async () => {
      try {
        const r = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(
            query
          )}`
        );
        const data = await r.json();
        if (!active) return;
        const all = (data.results || []).sort(
          (a, b) =>
            (b.popularity || 0) - (a.popularity || 0) ||
            (b.vote_average || 0) - (a.vote_average || 0)
        );
        setResults(all);
        setShowAllResults(false);
      } catch {
        if (!active) return;
        setResults([]);
        setShowAllResults(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [query, TMDB_KEY]);

  /* -------------------------------- genres ------------------------------ */
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

  const toggleGenre = (id) =>
    setSelectedGenres((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));
  const inPicks = (id) => watchlist.some((x) => x.id === id);
  const addPick = (m) => {
    if (!inPicks(m.id)) setWatchlist((w) => [...w, m]);
  };
  const removePick = (id) =>
    setWatchlist((w) => w.filter((m) => m.id !== id));

  /* --------------------------- data persistence -------------------------- */
  async function ensureUserRowOrFail(user) {
    const { data: existing, error: selErr } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (selErr) {
      console.warn("users SELECT failed:", selErr);
      throw new Error("Could not verify profile");
    }
    if (existing) return true;

    const payload = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || null,
    };
    const { error: insErr } = await supabase.from("users").insert(payload);
    if (insErr) {
      console.error("users INSERT failed:", insErr);
      throw new Error("Could not create your profile");
    }
    return true;
  }

  async function saveAndGo(opts = {}) {
    const { skipGenres = false, skipMovies = false } = opts;
    setError("");
    setLoading(true);
    try {
      const user_id = session?.user?.id;
      if (!user_id) throw new Error("No authenticated user.");

      await ensureUserRowOrFail(session.user);

      const email = session.user.email;
      const name = session.user.user_metadata?.name || "";
      const { error: updErr } = await supabase
        .from("users")
        .update({ email, name })
        .eq("id", user_id);
      if (updErr) console.warn("users UPDATE warn:", updErr);

      if (!skipGenres) {
        await supabase.from("user_preferences").delete().eq("user_id", user_id);
        if (selectedGenres.length) {
          const rows = selectedGenres.map((genre_id) => ({ user_id, genre_id }));
          const { error: upErr } = await supabase
            .from("user_preferences")
            .upsert(rows, { onConflict: "user_id,genre_id" });
          if (upErr) console.warn("user_preferences upsert warn:", upErr);
        }
      }

      if (!skipMovies && watchlist.length) {
        const uniq = Array.from(new Map(watchlist.map((m) => [m.id, m])).values());
        const rows = uniq.map((m) => ({
          user_id,
          movie_id: m.id,
          title: m.title ?? null,
          poster: m.poster_path
            ? (m.poster_path.startsWith("http")
                ? m.poster_path
                : `https://image.tmdb.org/t/p/w500${m.poster_path}`)
            : null,
          release_date: m.release_date ?? null,
          vote_average: typeof m.vote_average === "number" ? m.vote_average : null,
          genre_ids: Array.isArray(m.genre_ids) ? m.genre_ids : null,
        }));

        for (const row of rows) {
          const { error: insErr } = await supabase
            .from("movies_watched")
            .upsert(row, { onConflict: "user_id,movie_id" });
          if (insErr) console.warn("movies_watched upsert warn:", insErr);
        }
      }

      await supabase
        .from("users")
        .update({
          onboarding_complete: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("id", user_id);

      await supabase.auth.updateUser({
        data: { onboarding_complete: true, has_onboarded: true },
      });

      navigate("/home", { replace: true, state: { fromOnboarding: true } });
    } catch (e) {
      console.error("Onboarding save failed:", e);
      setError(e.message || "Could not save your preferences — please try again.");
    } finally {
      setLoading(false);
    }
  }

  /* --------------------------------- UI ---------------------------------- */
  if (checking) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-white/90 font-semibold">
        Loading profile…
      </div>
    );
  }

  // IMMERSIVE full-screen layer: no header/footer
  return (
    <div
      className="fixed inset-0 z-[60] overflow-hidden"
      style={{
        WebkitOverflowScrolling: "touch",
        background: "linear-gradient(120deg,#0a121a 0%,#0d1722 50%,#0c1017 100%)",
      }}
    >
      {/* Subtle animated BG accents (Option 3) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[65vmin] w-[65vmin] rounded-full blur-3xl opacity-60 bg-[radial-gradient(closest-side,rgba(254,146,69,0.35),rgba(254,146,69,0)_70%)] animate-slow-pulse" />
        <div className="absolute -bottom-44 -right-44 h-[70vmin] w-[70vmin] rounded-full blur-3xl opacity-55 bg-[radial-gradient(closest-side,rgba(235,66,59,0.3),rgba(235,66,59,0)_70%)] animate-slow-pulse [animation-delay:1.2s]" />
        <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_0%,rgba(255,255,255,0.05),rgba(255,255,255,0)_60%)]" />
      </div>

      {/* Inner scroller so iOS keyboard/safe areas behave nicely */}
      <div
        className="h-[100svh] w-full grid place-items-center px-3 md:px-0"
        style={{
          paddingTop: "max(env(safe-area-inset-top),10px)",
          paddingBottom: "max(env(safe-area-inset-bottom),10px)",
        }}
      >
        {/* Card wrapper */}
        <div className="relative isolate w-[min(94vw,980px)] rounded-[22px] p-[1px] bg-[linear-gradient(135deg,rgba(254,146,69,.45),rgba(235,66,59,.35),rgba(45,119,255,.35),rgba(0,209,255,.35))] shadow-[0_40px_120px_rgba(0,0,0,.55)]">
          {/* soft brand glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -z-10 rounded-[28px] opacity-70 blur-2xl md:-inset-4 -inset-1"
            style={{
              background:
                "radial-gradient(65% 55% at 18% 12%, rgba(254,146,69,.18), transparent 60%), radial-gradient(70% 60% at 85% 20%, rgba(0,209,255,.16), transparent 65%)",
            }}
          />

          {/* CARD */}
          <div
            className="rounded-[21px] bg-black/45 backdrop-blur-md ring-1 ring-white/10 overflow-hidden flex flex-col"
            style={{
              // slightly taller but we bias composition upward (Option 1)
              height: "min(680px, calc(100svh - 48px))",
            }}
          >
            {/* header */}
            <div className="px-5 sm:px-7 pt-5 pb-3 shrink-0">
              <p className="text-center text-[12.5px] font-semibold text-white/70 tracking-wide">
                {step === 1 ? "Step 1 of 2" : "Step 2 of 2"}
              </p>

              <h2 className="mt-1 text-center text-[clamp(1.2rem,2.6vw,1.6rem)] font-extrabold text-white tracking-tight">
                {step === 1
                  ? "Let’s get to know your taste."
                  : "Pick a few favorite movies."}
              </h2>
              <p className="mt-1 text-center text-[12.5px] text-white/75">
                {step === 1
                  ? "Choose a few genres you love — it helps us recommend movies that match your energy."
                  : "Tap some popular picks or search to add more. The more you pick, the better the recs."}
              </p>
              {error && (
                <p className="mt-2 text-center text-[12.5px] text-red-400">
                  {error}
                </p>
              )}
            </div>

            {/* body — composition shifted down a touch on desktop (Option 1) */}
            <div className="flex-1 px-5 sm:px-7 pb-6 sm:pb-7 overflow-y-auto md:-translate-y-[0.5vh]">
              {step === 1 && (
                <StepGenres
                  GENRES={GENRES}
                  selectedGenres={selectedGenres}
                  toggleGenre={toggleGenre}
                />
              )}

              {step === 2 && (
                <StepMovies
                  popular={popular}
                  popularSource={popularSource}
                  query={query}
                  setQuery={setQuery}
                  results={results}
                  setResults={setResults}
                  showAllResults={showAllResults}
                  setShowAllResults={setShowAllResults}
                  inPicks={inPicks}
                  addPick={addPick}
                  removePick={removePick}
                  watchlist={watchlist}
                />
              )}
            </div>

            {/* micro-copy anchor above CTAs (Option 4) */}
            <p className="px-5 sm:px-7 -mt-1 mb-2 text-center text-[12.5px] text-white/60">
              {step === 1
                ? "Pick as many as you like — you can always change these later."
                : "Add a few now; it makes your first recommendations smarter."}
            </p>

            {/* footer actions — with soft “breathe” animation (Option 6) */}
            <div className="shrink-0 px-5 sm:px-7 pb-5 sm:pb-6">
              {step === 1 ? (
                <div className="flex items-center justify-center gap-6">
                  <button
                    className="px-7 py-3 rounded-2xl font-extrabold text-[15px] text-white shadow-md hover:shadow-lg transition-all duration-200 animate-cta-breathe"
                    style={{
                      background: BTN_BG,
                      boxShadow: "0 10px 30px rgba(235,66,59,.25)",
                      opacity: loading ? 0.7 : 1,
                    }}
                    disabled={loading}
                    onClick={() => setStep(2)}
                  >
                    Next
                  </button>
                  <button
                    className="text-[13.5px] font-extrabold text-[#fe9245] focus:outline-none focus:ring-0 active:outline-none hover:opacity-90"
                    disabled={loading}
                    onClick={() => saveAndGo({ skipGenres: true })}
                  >
                    Skip
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-5">
                  <button
                    className="text-[13px] font-semibold text-white/80 hover:text-white"
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    &lt; Back
                  </button>
                  <button
                    className="px-7 py-3 rounded-2xl font-extrabold text-[15px] text-white shadow-md hover:shadow-lg transition-all duration-200 animate-cta-breathe"
                    style={{
                      background: BTN_BG,
                      boxShadow: "0 10px 30px rgba(235,66,59,.25)",
                      opacity: loading ? 0.7 : 1,
                    }}
                    disabled={loading}
                    onClick={() => saveAndGo()}
                  >
                    Finish
                  </button>
                  <button
                    className="text-[13.5px] font-extrabold text-[#fe9245] focus:outline-none focus:ring-0 active:outline-none hover:opacity-90"
                    disabled={loading}
                    onClick={() => saveAndGo({ skipMovies: true })}
                  >
                    Skip
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* tiny CSS helpers used above (local to this screen) */}
      <style>{`
        @keyframes cta-breathe {
          0%, 100% { transform: translateY(0); box-shadow: 0 10px 30px rgba(235,66,59,.25); }
          50%      { transform: translateY(-1px); box-shadow: 0 16px 36px rgba(235,66,59,.30); }
        }
        .animate-cta-breathe { animation: cta-breathe 3.2s ease-in-out infinite; }

        @keyframes slowPulse {
          0%, 100% { opacity: .45; transform: scale(1); }
          50%      { opacity: .65; transform: scale(1.04); }
        }
        .animate-slow-pulse { animation: slowPulse 12s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

/* ----------------------------- Subcomponents ---------------------------- */
function StepGenres({ GENRES, selectedGenres, toggleGenre }) {
  // Option 2 + 5: fuller chips, denser gaps; wider grid on desktop
  return (
    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-2.5">
      {GENRES.map((g) => {
        const active = selectedGenres.includes(g.id);
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => toggleGenre(g.id)}
            className={`h-10 md:h-11 rounded-2xl border text-white text-[13.5px] md:text-[14px] font-semibold transition-all
              ${active ? "ring-1 ring-white/10 backdrop-blur-md" : ""}
            `}
            style={
              active
                ? {
                    borderColor: "rgba(150,180,255,0.45)",
                    background:
                      "linear-gradient(135deg, rgba(60,120,255,0.55), rgba(100,70,255,0.45))",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.25), 0 0 12px rgba(80,140,255,0.4)",
                    backdropFilter: "blur(6px)",
                  }
                : {
                    borderColor: "rgba(255,255,255,0.16)",
                    background: "rgba(255,255,255,0.04)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                  }
            }
          >
            <span className="px-4 md:px-6">{g.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function StepMovies({
  popular,
  popularSource,
  query,
  setQuery,
  results,
  setResults,
  showAllResults,
  setShowAllResults,
  inPicks,
  addPick,
  removePick,
  watchlist,
}) {
  return (
    <>
      {/* search */}
      <input
        type="text"
        placeholder="Search a movie…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[13.5px] text-white placeholder-white/40 focus:outline-none"
      />

      {/* suggested grid */}
      {!query && popular.length > 0 && (
        <>
          <h3 className="mt-4 mb-2 text-[13px] font-semibold text-white/80">
            {popularSource === "app"
              ? "Popular with FeelFlick users"
              : "Popular right now"}
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {popular.map((m) => {
              const selected = inPicks(m.id);
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => (selected ? removePick(m.id) : addPick(m))}
                  className="relative rounded-lg overflow-hidden ring-1 ring-white/10"
                  aria-pressed={selected}
                  title={m.title}
                >
                  <img
                    src={
                      m.poster_path?.startsWith?.("http")
                        ? m.poster_path
                        : `https://image.tmdb.org/t/p/w185${m.poster_path}`
                    }
                    alt={m.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 transition-opacity hover:opacity-100" />
                  {selected && (
                    <div className="absolute inset-0 ring-2 ring-[#fe9245]/80 rounded-lg" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* search results */}
      {query && results.length > 0 && (
        <div className="mt-3 rounded-xl bg-white/[.04] ring-1 ring-white/10 max-h-[240px] overflow-auto">
          {(showAllResults ? results : results.slice(0, 8)).map((r) => {
            const selected = inPicks(r.id);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  if (selected) {
                    removePick(r.id);
                  } else {
                    addPick(r);
                    setQuery("");
                    setResults([]);
                  }
                }}
                className="flex w-full items-center gap-3 px-3 py-2 hover:bg-white/5 text-left"
              >
                <img
                  src={
                    r.poster_path
                      ? `https://image.tmdb.org/t/p/w92${r.poster_path}`
                      : "https://dummyimage.com/60x90/111/fff&text=?"
                  }
                  alt=""
                  className="w-[28px] h-[42px] object-cover rounded"
                />
                <div className="flex-1">
                  <div className="text-[13.5px] text-white">{r.title}</div>
                  <div className="text-[12px] text-white/60">
                    {r.release_date ? r.release_date.slice(0, 4) : "—"}
                  </div>
                </div>
                <span
                  className={`text-[12px] ${
                    selected ? "text-[#fe9245]" : "text-white/60"
                  }`}
                >
                  {selected ? "Added" : "Add"}
                </span>
              </button>
            );
          })}
          {!showAllResults && results.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAllResults(true)}
              className="w-full py-2 text-[12.5px] text-[#fe9245] font-semibold hover:bg-white/5"
            >
              Show more
            </button>
          )}
        </div>
      )}

      {/* chosen tiles */}
      {watchlist.length > 0 && (
        <>
          <h3 className="mt-4 mb-2 text-[13px] font-semibold text-white/80">
            Your picks
          </h3>
          <div className="flex flex-wrap gap-2">
            {watchlist.map((m) => (
              <div key={m.id} className="relative">
                <img
                  src={
                    m.poster_path
                      ? `https://image.tmdb.org/t/p/w92${m.poster_path}`
                      : "https://dummyimage.com/60x90/111/fff&text=?"
                  }
                  alt={m.title}
                  className="w-[60px] h-[90px] object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => removePick(m.id)}
                  className="absolute -top-2 -right-2 h-5 w-5 grid place-items-center rounded-full bg-black/70 text-white text-xs"
                  aria-label={`Remove ${m.title}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}