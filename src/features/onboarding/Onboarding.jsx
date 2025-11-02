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

  // session
  useEffect(() => {
    let unsub;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    unsub = data?.subscription?.unsubscribe;
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  // already onboarded?
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

  // popular picks for step 2 (App-first, TMDb fallback) — exactly 6 items
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // try FeelFlick data: most watched last 90 days
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

      // TMDb fallback
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

  // search
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

  async function saveAndGo(opts = {}) {
    const { skipGenres = false, skipMovies = false } = opts;
    setError("");
    setLoading(true);
    try {
      const user_id = session?.user?.id;
      if (!user_id) throw new Error("No authenticated user.");

      const email = session.user.email;
      const name = session.user.user_metadata?.name || "";

      // create/update users row (no UPSERT to avoid RLS 403)
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("id", user_id)
        .maybeSingle();
      if (existing) {
        await supabase.from("users").update({ email, name }).eq("id", user_id);
      } else {
        await supabase
          .from("users")
          .insert({ id: user_id, email, name })
          .then(
            () => {},
            (e) => {
              if (String(e?.status) !== "403")
                console.warn("users insert warn:", e);
            }
          );
      }

      if (!skipGenres) {
        await supabase.from("user_preferences").delete().eq("user_id", user_id);
        if (selectedGenres.length) {
          await supabase.from("user_preferences").upsert(
            selectedGenres.map((genre_id) => ({ user_id, genre_id })),
            { onConflict: "user_id,genre_id" }
          );
        }
      }

      if (!skipMovies && watchlist.length) {
        const uniq = Array.from(new Map(watchlist.map((m) => [m.id, m])).values());
        const { error: wlErr } = await supabase
          .from("user_watchlist")
          .upsert(
            uniq.map((m) => ({
              user_id,
              movie_id: m.id,
              status: "onboarding",
            })),
            { onConflict: "user_id,movie_id", ignoreDuplicates: true }
          );
        if (wlErr && wlErr.code !== "23505")
          console.warn("watchlist upsert warn:", wlErr);
      }

      await supabase
        .from("users")
        .update({ onboarding_complete: true })
        .eq("id", user_id);
      await supabase.auth.updateUser({
        data: { onboarding_complete: true, has_onboarded: true },
      });

      navigate("/home", { replace: true, state: { fromOnboarding: true } });
    } catch (e) {
      console.error("Onboarding save failed:", e);
      setError("Could not save your preferences — please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-white/90 font-semibold">
        Loading profile…
      </div>
    );
  }

  // Positioned just above center, below TopNav
  return (
    <div
      className="px-3 md:px-0"
      style={{
        minHeight: "calc(100svh - var(--footer-h,0px))",
        paddingTop: "var(--topnav-h,72px)",
        paddingBottom: "4px",
        display: "grid",
        placeItems: "center",
      }}
    >
      {/* Card wrapper with slight upward offset */}
      <div className="relative isolate w-[min(92vw,920px)] rounded-[22px] p-[1px] bg-[linear-gradient(135deg,rgba(254,146,69,.45),rgba(235,66,59,.35),rgba(45,119,255,.35),rgba(0,209,255,.35))] shadow-[0_40px_120px_rgba(0,0,0,.55)] -translate-y-[2vh] md:-translate-y-[3vh] lg:-translate-y-[4vh]">
        {/* soft brand glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -z-10 rounded-[28px] opacity-70 blur-2xl md:-inset-4 -inset-1"
          style={{
            background:
              "radial-gradient(65% 55% at 18% 12%, rgba(254,146,69,.18), transparent 60%), radial-gradient(70% 60% at 85% 20%, rgba(0,209,255,.16), transparent 65%)",
          }}
        />

        <div
          className="rounded-[21px] bg-black/45 backdrop-blur-md ring-1 ring-white/10 overflow-hidden flex flex-col"
          style={{
            height: "min(720px, calc(100svh - var(--topnav-h,72px) - var(--footer-h,0px) - 18px))",
          }}
        >
          {/* header */}
          <div className="px-5 sm:px-6 py-4 shrink-0">
            <p className="text-center text-[12.5px] font-semibold text-white/70 tracking-wide">
              {step === 1 ? "Step 1 of 2" : "Step 2 of 2"}
            </p>

            <h2 className="mt-1 text-center text-[clamp(1.1rem,2.2vw,1.5rem)] font-extrabold text-white tracking-tight">
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

          {/* body */}
          <div className="flex-1 px-5 sm:px-6 pb-6 sm:pb-7 overflow-y-auto">
            {step === 1 && (
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                {GENRES.map((g) => {
                  const active = selectedGenres.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGenre(g.id)}
                      className={`h-9 rounded-xl border text-white text-[13px] font-medium transition-all ${
                        active ? "ring-1 ring-white/10 backdrop-blur-md" : ""
                      }`}
                      style={
                        active
                          ? {
                              borderColor: "rgba(150,180,255,0.45)",
                              background:
                                "linear-gradient(135deg, rgba(60,120,255,0.55), rgba(100,70,255,0.45))",
                              boxShadow:
                                "inset 0 1px 0 rgba(255,255,255,0.2), 0 0 12px rgba(80,140,255,0.4)",
                              backdropFilter: "blur(6px)",
                            }
                          : {
                              borderColor: "rgba(255,255,255,0.15)",
                              background: "rgba(255,255,255,0.03)",
                              boxShadow:
                                "inset 0 1px 0 rgba(255,255,255,0.05)",
                            }
                      }
                    >
                      <span className="px-3">{g.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 2 && (
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
                            onClick={() =>
                              selected ? removePick(m.id) : addPick(m)
                            }
                            className="relative rounded-lg overflow-hidden ring-1 ring-white/10"
                            aria-pressed={selected}
                            title={m.title}
                          >
                            <img
                              src={
                                m.poster_path?.startsWith("http")
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
                    {(showAllResults ? results : results.slice(0, 8)).map(
                      (r) => {
                        const selected = inPicks(r.id);
                        return (
                          <button
                            key={r.id}
                            type="button"
                            oonClick={() => {
                              if (selected) {removePick(r.id)
                                } else {
                                  addPick(r)
                                  setQuery('')
                                  setResults([])
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
                              <div className="text-[13.5px] text-white">
                                {r.title}
                              </div>
                              <div className="text-[12px] text-white/60">
                                {r.release_date
                                  ? r.release_date.slice(0, 4)
                                  : "—"}
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
                      }
                    )}
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
            )}
          </div>

          {/* footer actions */}
          <div className="shrink-0 px-5 sm:px-6 pb-5 sm:pb-6">
            {step === 1 ? (
              <div className="flex items-center justify-center gap-6">
                <button
                  className="px-6 py-2.5 rounded-2xl font-extrabold text-[15px] text-white"
                  style={{
                    background: BTN_BG,
                    boxShadow: "0 2px 10px #eb423b22",
                    opacity: loading ? 0.7 : 1,
                  }}
                  disabled={loading}
                  onClick={() => setStep(2)}
                >
                  Next
                </button>
                <button
                  className="text-[13.5px] font-extrabold text-[#fe9245] focus:outline-none focus:ring-0 active:outline-none"
                  disabled={loading}
                  onClick={() => saveAndGo({ skipGenres: true })}
                >
                  Skip
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-5">
                <button
                  className="text-[13px] font-semibold text-white/80"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  &lt; Back
                </button>
                <button
                  className="px-6 py-2.5 rounded-2xl font-extrabold text-[15px] text-white"
                  style={{
                    background: BTN_BG,
                    boxShadow: "0 2px 10px #eb423b22",
                    opacity: loading ? 0.7 : 1,
                  }}
                  disabled={loading}
                  onClick={() => saveAndGo()}
                >
                  Finish
                </button>
                <button
                  className="text-[13.5px] font-extrabold text-[#fe9245] focus:outline-none focus:ring-0 active:outline-none"
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
  );
}