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

        const completed = data?.onboarding_complete === true || Boolean(data?.onboarding_completed_at);
        if (completed) navigate("/home", { replace: true });
        else setChecking(false);
      } catch (e) {
        console.warn("onboarding check failed:", e);
        setChecking(false);
      }
    })();
  }, [session, navigate]);

  // popular picks for step 2 (take 6)
  useEffect(() => {
    let active = true;
    if (!TMDB_KEY && !session) return;
    (async () => {
      try {
        const since = new Date();
        since.setDate(since.getDate() - 90);
        const { data: views } = await dbSelectWatchedSince(since);
        const counts = new Map();
        (views || []).forEach(v => {
          if (!v?.movie_id) return;
          counts.set(v.movie_id, (counts.get(v.movie_id) || 0) + 1);
        });
        const topIds = Array.from(counts.entries())
          .sort((a, b) => b[1] - a[1])
            // grab a few more then filter by poster below
          .slice(0, 20)
          .map(([id]) => id);

        if (topIds.length) {
          const { data: rows } = await supabase
            .from("movies")
            .select("id,tmdb_id,title,poster_path,popularity,vote_average")
            .in("id", topIds);

          const top = (rows || [])
            .filter(r => r?.poster_path)
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0) || (b.vote_average || 0) - (a.vote_average || 0))
            .slice(0, 6);

          if (active && top.length === 6) {
            setPopular(top);
            setPopularSource("app");
            return;
          }
        }
      } catch (e) {
        // fall back to TMDb
      }

      if (!active) return;
      if (!TMDB_KEY) return;

      try {
        const r = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}`);
        const j = await r.json();
        const top = (j?.results || [])
          .filter(m => m.poster_path)
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 6);
        if (active) {
          setPopular(top);
          setPopularSource("tmdb");
        }
      } catch (e) {
        console.warn("TMDb popular failed", e);
      }
    })();

    function dbSelectWatchedSince(since) {
      return supabase
        .from("movies_watched")
        .select("movie_id")
        .gte("created_at", since.toISOString());
    }

    return () => {
      active = false;
    };
  }, [TMDB_KEY, session]);

  // search
  useEffect(() => {
    let active = true;
    if (!query) { setResults([]); setShowAllResults(false); return; }
    (async () => {
      try {
        const r = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`
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
    return () => { active = false };
  }, [query, TMDB_KEY]);

  const GENRES = useMemo(() => [
    { id: 28,  label:"Action" }, { id: 12, label:"Adventure" },
    { id: 16,  label:"Animation"}, { id: 35, label:"Comedy" },
    { id: 80,  label:"Crime" },   { id: 99, label:"Documentary" },
    { id: 18,  label:"Drama" },   { id: 10751, label:"Family" },
    { id: 14,  label:"Fantasy" }, { id: 36, label:"History" },
    { id: 27,  label:"Horror" },  { id: 10402,label:"Music" },
    { id: 9648,label:"Mystery"},  { id: 10749,label:"Romance" },
    { id: 878, label:"Sci-fi" },  { id: 53, label:"Thriller"}
  ], []);

  const toggleGenre = (id) => setSelectedGenres(g => g.includes(id) ? g.filter(x=>x!==id) : [...g,id]);
  const inPicks     = (id) => watchlist.some(x => x.id === id);
  const addPick     = (m)  => { if (!inPicks(m.id)) setWatchlist(w => [...w, m]) };
  const removePick  = (id) => setWatchlist(w => w.filter(m => m.id !== id));

  // ---------- SAVE & NORMALIZE WATCHLIST (UPDATED) ----------
  async function saveAndGo(opts = {}) {
    const { skipGenres = false, skipMovies = false } = opts;
    setError(""); setLoading(true);

    try {
      const user_id = session?.user?.id;
      if (!user_id) throw new Error("No authenticated user.");

      const email = session.user.email;
      const name  = session.user.user_metadata?.name || "";

      // ensure users row
      const { data: existing } =
        await supabase.from("users").select("id").eq("id", user_id).maybeSingle();
      if (existing) {
        await supabase.from("users").update({ email, name }).eq("id", user_id);
      } else {
        try {
          await supabase.from("users").insert({ id: user_id, email, name });
        } catch (e) {
          if (String(e?.code) !== "23505") console.warn("users insert warn:", e);
        }
      }

      // genres
        if (!skipGenres) {
          await supabase.from("user_preferences").delete().eq("user_id", user_id);
          if (selectedGenres.length) {
            await supabase
              .from("user_preferences")
              .upsert(
                selectedGenres.map(genre_id => ({ user_id, genre_id })),
                { onConflict: "user_id,genre_id" }
              );
          }
        }

      // watchlist (normalize to internal ids)
      if (!skipMovies && watchlist.length) {
        const internalIds = await normalizeWatchlistToInternalIds(watchlist, supabase);
        if (internalIds.length) {
          const rows = Array.from(new Set(internalIds)).map(mid => ({
            user_id, movie_id: mid, status: "onboarding"
          }));
          const { error: wlErr } = await supabase
            .from("user_watchlist")
            .upsert(rows, { onConflict: "user_id,movie_id" });
          if (wlErr) {
            console.error("user_watchlist upsert failed:", wlErr);
            throw wlErr;
          }
        }
      }

      await supabase
        .from("users")
        .update({ onboarding_complete: true, onboarding_completed_at: new Date().toISOString() })
        .eq("id", user_id);

      await supabase.auth.updateUser({
        data: { onboarding_complete: true, has_onboarded: true, onboarded: true },
      });

      navigate("/home", { replace: true, state: { fromOnboarding: true } });
    } catch (e) {
      console.error("Onboarding save failed:", e);
      setError("Could not save your preferences — please try again.");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Ensure each picked movie has a local `movies.id`.
   * - If item already came from `public.movies` (has `tmdb_id` field), use its `id`.
   * - If item is a raw TMDb result (no `tmdb_id`, only `id`), upsert into `public.movies`
   *   using unique `tmdb_id`, then read back the generated internal `id`.
   * Returns number[] of internal movie IDs.
   */
  async function normalizeWatchlistToInternalIds(picks, supabaseClient) {
    const internalIds = [];
    const tmdbRows = [];

    for (const m of picks) {
      if (Object.prototype.hasOwnProperty.call(m, "tmdb_id")) {
        // already our movies row
        if (typeof m.id === "number") internalIds.push(m.id);
      } else if (typeof m.id === "number") {
        // TMDb object
        tmdbRows.push({
          tmdb_id: m.id,
          title: m.title ?? "",
          original_title: m.original_title ?? null,
          release_date: m.release_date ? m.release_date : null,
          poster_path: m.poster_path ?? null,
          backdrop_path: m.backdrop_path ?? null,
          runtime: m.runtime ?? null,
          vote_average: m.vote_average ?? null,
          vote_count: m.vote_count ?? null,
          popularity: m.popularity ?? null,
          original_language: m.original_language ?? null,
          adult: m.adult ?? false,
          status: m.status ?? null,
          tagline: m.tagline ?? null,
        });
      }
    }

    if (tmdbRows.length) {
      const { error: upsertErr } = await supabaseClient
        .from("movies")
        .upsert(tmdbRows, { onConflict: "tmdb_id" });
      if (upsertErr) {
        console.error("movies upsert (tmdb) failed:", upsertErr);
        throw upsertErr;
      }
      const ids = tmdbRows.map(r => r.tmdb_id);
      const { data: rows, error: selErr } = await supabaseClient
        .from("movies")
        .select("id, tmdb_id")
        .in("tmdb_id", ids);
      if (selErr) {
        console.error("movies select by tmdb_id failed:", selErr);
        throw selErr;
      }
      const map = new Map(rows.map(r => [Number(r.tmdb_id), r.id]));
      const resolved = ids.map(tid => map.get(Number(tid))).filter(v => typeof v === "number");
      internalIds.push(...resolved);
    }

    return internalIds;
  }
  // ---------------------------------------------------------

  if (checking) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-white/90 font-semibold">
        Loading profile…
      </div>
    );
  }

  return (
    <div className="relative w-[min(92vw,920px)] rounded-[22px] p-[1px] bg-[linear-gradient(135deg,rgba(254,146,69,.45),rgba(235,66,59,.35),rgba(45,119,255,.35),rgba(0,209,255,.35))] shadow-[0_40px_120px_rgba(0,0,0,.55)]">
      <div
        className="rounded-[21px] bg-black/45 backdrop-blur-md ring-1 ring-white/10 overflow-hidden"
        style={{ maxHeight: 'calc(100svh - var(--topnav-h,72px) - var(--footer-h,0px) - 32px)' }}
      >
        {/* header */}
        <div className="px-5 sm:px-6 py-4">
          <h2 className="text-center text-[clamp(1.1rem,2.2vw,1.5rem)] font-extrabold text-white tracking-tight">
            {step === 1 ? "Let’s get to know your taste." : "Pick a few favorite movies."}
          </h2>
          <p className="mt-1 text-center text-[12.5px] text-white/75">
            {step === 1
              ? "Choose a few genres you love — it helps us recommend movies that match your energy."
              : "Tap some popular picks or search to add more. The more you pick, the better the recs."}
          </p>
          {error && <p className="mt-2 text-center text-[12.5px] text-red-400">{error}</p>}
        </div>

        {/* body */}
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {step === 1 && (
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
              {GENRES.map(g => {
                const active = selectedGenres.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGenre(g.id)}
                    className="h-10 rounded-2xl border text-white text-[13px] font-medium transition-all"
                    style={{
                      borderColor: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.12)',
                      background: active
                        ? 'linear-gradient(135deg, rgba(60,140,255,.35), rgba(120,180,255,.55))'
                        : 'rgba(255,255,255,0.03)',
                      boxShadow: active ? '0 10px 28px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.06)' : 'none'
                    }}
                  >
                    <span className="px-3">{g.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <>
              <input
                type="text"
                placeholder="Search a movie…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[13.5px] text-white placeholder-white/40 focus:outline-none"
              />

              {!query && !!popular.length && (
                <>
                  <h3 className="mt-4 mb-2 text-[13px] font-semibold text-white/80">
                    {popularSource === 'app' ? 'Popular with FeelFlick users' : 'Popular right now'}
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {popular.map(m => {
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
                            src={m.poster_path ? (m.tmdb_id ? `https://image.tmdb.org/t/p/w185${m.poster_path}` : `https://image.tmdb.org/t/p/w185${m.poster_path}`) : ""}
                            alt={m.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 transition-opacity hover:opacity-100" />
                          {selected && <div className="absolute inset-0 ring-2 ring-[#fe9245]/80 rounded-lg" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {query && results.length > 0 && (
                <div className="mt-3 rounded-xl bg-white/[.04] ring-1 ring-white/10 max-h-[240px] overflow-auto">
                  {(showAllResults ? results : results.slice(0, 8)).forEach}
                  {(showAllResults ? results : results.slice(0, 8)).map(r => {
                    const selected = inPicks(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          if (selected) removePick(r.id);
                          else { addPick(r); setQuery(""); setResults([]); }
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2 hover:bg-white/5 text-left"
                      >
                        <img
                          src={r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : "https://dummyimage.com/60x90/111/fff&text=?"}
                          alt=""
                          className="w-[28px] h-[42px] object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="text-[13.5px] text-white">{r.title}</div>
                          <div className="text-[12px] text-white/60">{r.release_date ? r.release_date.slice(0,4) : "—"}</div>
                        </div>
                        <span className={`text-[12px] ${selected ? 'text-[#fe9245]' : 'text-white/60'}`}>
                          {selected ? 'Added' : 'Add'}
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

              {watchlist.length > 0 && (
                <>
                  <h3 className="mt-4 mb-2 text-[13px] font-semibold text-white/80">Your picks</h3>
                  <div className="flex flex-wrap gap-2">
                    {watchlist.map(m => (
                      <div key={m.id} className="relative">
                        <img
                          src={m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : "https://dummyimage.com/60x90/111/fff&text=?"}
                          alt={m.title}
                          className="w-[60px] h-[90px] object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removePick(m.id)}
                          className="absolute -top-2 -right-2 h-5 w-5 grid place-items-center rounded-full bg-black/70 text-white text-xs"
                          aria-label={`Remove ${m.title}`}
                        >×</button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* footer actions */}
        <div className="px-5 sm:px-6 pb-5 sm:pb-6">
          {step === 1 ? (
            <div className="flex items-center justify-center gap-6">
              <button
                className="px-6 py-2.5 rounded-2xl font-extrabold text-[15px] text-white"
                style={{ background: BTN_BG, boxShadow: "0 2px 10px #eb423b22", opacity: loading ? 0.7 : 1 }}
                disabled={loading}
                onClick={() => setStep(2)}
              >Next</button>
              <button
                className="text-[13.5px] font-extrabold text-[#fe9245] focus:outline-none"
                disabled={loading}
                onClick={() => saveAndGo({ skipGenres: true })}
              >Skip</button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-5">
              <button
                className="text-[13px] font-semibold text-white/80"
                onClick={() => setStep(1)}
                disabled={loading}
              >&lt; Back</button>
              <button
                className="px-6 py-2.5 rounded-2xl font-extrabold text-[15px] text-white"
                style={{ background: BTN_BG, boxShadow: "0 2px 10px #eb423b22", opacity: loading ? 0.7 : 1 }}
                disabled={loading}
                onClick={() => saveAndGo()}
              >Finish</button>
              {/* correct call */}
              <button
                className="px-6 py-2.5 rounded-2xl font-extrabold text-[15px] text-white hidden"
                onClick={() => {}}
              />
              <button
                className="text-[13.5px] font-extrabold text-[#fe9245] focus:outline-none"
                disabled={loading}
                onClick={() => saveAndGo({ skipMovies: true })}
              >Skip</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}