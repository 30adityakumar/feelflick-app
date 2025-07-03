import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

// Theme
const COLORS = {
  primary: "#18406d",
  accent: "#fe9245",
  accent2: "#eb423b",
  dark: "#101015",
  surface: "#232330",
  lightText: "#f9f9fa",
  border: "#27335b"
};

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

// --- Helper to sleep
function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

export default function Onboarding() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  // ---- Onboarding wizard state
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState([]);   // [id, ...]
  const [query, setQuery] = useState("");                     // Search term
  const [results, setResults] = useState([]);                 // Movie suggestions
  const [showAll, setShowAll] = useState(false);              // Show more movies?
  const [watchlist, setWatchlist] = useState([]);             // [{id,title,poster_path}, ...]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // ---- App branding
  const BRAND_LOGO = "/logo.png";
  const BG_IMAGE = "/background-poster.jpg";

  // ---- Genre data (memoized)
  const GENRES = useMemo(() => [
    { id: 28,  label: "Action" },    { id: 12, label: "Adventure" },
    { id: 16,  label: "Animation" }, { id: 35, label: "Comedy"    },
    { id: 80,  label: "Crime" },     { id: 99, label: "Documentary" },
    { id: 18,  label: "Drama" },     { id: 10751, label: "Family" },
    { id: 14,  label: "Fantasy" },   { id: 36, label: "History"   },
    { id: 27,  label: "Horror" },    { id: 10402,label: "Music"    },
    { id: 9648,label: "Mystery" },   { id: 10749,label: "Romance"  },
    { id: 878, label: "Sci-Fi" },    { id: 53, label: "Thriller"  },
  ], []);
  
  // ---- Load session & redirect if already onboarded
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) return;
    if (session.user?.user_metadata?.onboarding_complete)
      navigate("/app", { replace: true });
  }, [session, navigate]);

  // ---- Movie search (TMDB, debounced)
  useEffect(() => {
    if (!query) { setResults([]); setShowAll(false); return; }
    let ignore = false;
    const ctrl = new AbortController();
    (async () => {
      await sleep(220); // Debounce
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`;
      try {
        const res = await fetch(url, { signal: ctrl.signal });
        const json = await res.json();
        if (ignore) return;
        let found = (json.results || []).sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        setResults(found);
        setShowAll(false);
      } catch { }
    })();
    return () => { ignore = true; ctrl.abort(); };
  }, [query]);

  // ---- Genre selection helpers
  const toggleGenre = id => {
    setSelectedGenres(g => g.includes(id) ? g.filter(x => x !== id) : [...g, id]);
  };

  // ---- Watchlist helpers
  const addToWatchlist = movie => {
    if (watchlist.some(m => m.id === movie.id)) return;
    setWatchlist([...watchlist, movie]);
  };
  const removeFromWatchlist = id => setWatchlist(watchlist.filter(m => m.id !== id));

  // ---- Save onboarding data to DB (genres + watchlist)
  const finishOnboarding = async (skipGenres, skipMovies) => {
    setLoading(true);
    setError("");
    try {
      const user_id = session?.user?.id;
      if (!user_id) throw new Error("User not found");

      // --- Genres: remove old, insert new
      if (!skipGenres) {
        await supabase.from("user_preferences").delete().eq("user_id", user_id);
        if (selectedGenres.length) {
          await supabase.from("user_preferences").upsert(
            selectedGenres.map(genre_id => ({ user_id, genre_id })),
            { onConflict: ['user_id', 'genre_id'] }
          );
        }
      }

      // --- Watchlist: remove old onboarding, insert new movies if not exist, then watchlist
      if (!skipMovies) {
        await supabase.from("user_watchlist").delete().eq("user_id", user_id).eq("status", "onboarding");

        // For each picked movie, ensure it's in the movies table, then upsert watchlist row
        for (const m of watchlist) {
          // Insert to movies if not exist (use tmdb_id as unique)
          const { data: exists } = await supabase.from("movies").select("id").eq("tmdb_id", m.id).maybeSingle();
          let movie_id = exists?.id;
          if (!movie_id) {
            const { data: movie } = await supabase.from("movies").insert({
              tmdb_id: m.id,
              title: m.title,
              poster_path: m.poster_path,
              release_date: m.release_date
            }).select("id").maybeSingle();
            movie_id = movie?.id;
          }
          if (movie_id) {
            await supabase.from("user_watchlist").upsert(
              { user_id, movie_id, status: "onboarding" },
              { onConflict: ['user_id', 'movie_id'] }
            );
          }
        }
      }

      // --- Mark onboarding complete in users and auth metadata
      await supabase.from("users").update({ onboarding_complete: true }).eq("id", session.user.id);
      await supabase.auth.updateUser({ data: { onboarding_complete: true } });

      navigate("/app", { replace: true });
    } catch (e) {
      setError("Could not save your preferences — please try again.");
      console.error("Onboarding save failed:", e);
    } finally {
      setLoading(false);
    }
  };

  // ---- UI
  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.dark,
      backgroundImage: `url('${BG_IMAGE}')`,
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Inter, system-ui, sans-serif"
    }}>
      {/* Branding */}
      <div style={{ position: "fixed", top: 38, left: 54, zIndex: 12, display: "flex", alignItems: "center", gap: 16 }}>
        <img src={BRAND_LOGO} alt="FeelFlick" style={{ height: 44, width: 44, borderRadius: 14, boxShadow: "0 1.5px 8px #0005" }} />
        <span style={{
          fontWeight: 900,
          fontSize: 31,
          letterSpacing: "-1.1px",
          color: COLORS.accent,
          textShadow: "0 1px 7px #19194044"
        }}>FeelFlick</span>
      </div>
      {/* Onboarding Card */}
      <div style={{
        background: "rgba(31,29,40,0.98)",
        boxShadow: "0 9px 36px #000d",
        borderRadius: 32,
        padding: "46px 44px 32px 44px",
        maxWidth: 620,
        minWidth: 420,
        width: "85vw",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        zIndex: 8
      }}>
        {/* Error Message */}
        {error && (
          <div style={{
            background: "#a31923",
            color: "#fff",
            borderRadius: 10,
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 18,
            padding: "11px 8px 8px 8px"
          }}>{error}</div>
        )}

        {/* ---- Step 1: Pick genres ---- */}
        {step === 1 && (
          <>
            <h2 style={{
              fontWeight: 900,
              fontSize: 32,
              color: "#fff",
              marginBottom: 10,
              textAlign: "center"
            }}>
              What do you like to watch?
            </h2>
            <div style={{
              fontSize: 18,
              color: "#e7e9ef",
              textAlign: "center",
              maxWidth: 560,
              margin: "0 auto 34px auto",
              opacity: 0.89,
              fontWeight: 400,
              letterSpacing: "-0.1px"
            }}>
              Pick a few genres that match your taste. <br />
              <span style={{ color: COLORS.accent }}>This helps us give you recommendations that actually fit your mood!</span>
            </div>
            {/* Genre grid: 4 columns */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "22px 20px",
              margin: "0 auto 38px auto",
              width: "100%",
              maxWidth: 520,
              minWidth: 340,
            }}>
              {GENRES.map(g => (
                <button
                  key={g.id}
                  onClick={() => toggleGenre(g.id)}
                  style={{
                    border: selectedGenres.includes(g.id)
                      ? "none"
                      : `2.3px solid ${COLORS.accent}`,
                    background: selectedGenres.includes(g.id)
                      ? "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)"
                      : "transparent",
                    color: selectedGenres.includes(g.id) ? "#fff" : "#f0f2fb",
                    fontWeight: 700,
                    fontSize: 18,
                    borderRadius: 19,
                    padding: "13px 6px",
                    boxShadow: selectedGenres.includes(g.id) ? "0 4px 16px #eb423b2a" : "none",
                    transition: "all 0.18s",
                    outline: "none",
                    cursor: "pointer",
                    minWidth: 0,
                    width: "100%",
                    minHeight: 48,
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <div style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 6
            }}>
              <div />
              <button
                onClick={() => setStep(2)}
                disabled={loading}
                style={{
                  background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  fontWeight: 900,
                  fontSize: 19,
                  padding: "13px 41px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.64 : 1,
                  boxShadow: "0 2px 9px #eb423b28"
                }}>
                NEXT
              </button>
              <button
                onClick={() => finishOnboarding(true, false)}
                style={{
                  color: COLORS.accent,
                  fontWeight: 700,
                  background: "none",
                  border: "none",
                  fontSize: 17,
                  marginLeft: 18,
                  cursor: "pointer"
                }}>SKIP</button>
            </div>
          </>
        )}

        {/* ---- Step 2: Pick movies ---- */}
        {step === 2 && (
          <>
            <h2 style={{
              fontWeight: 900,
              fontSize: 30,
              color: "#fff",
              marginBottom: 7,
              textAlign: "center"
            }}>
              Any favourite movies?
            </h2>
            <div style={{
              fontSize: 17,
              color: "#fdb65e",
              fontWeight: 600,
              textAlign: "center",
              marginBottom: 10
            }}>
              Type to search your favourites.<br />
              <span style={{ color: COLORS.accent, fontWeight: 700 }}>Pick at least one for better suggestions.</span>
            </div>
            {/* Search box */}
            <input
              type="text"
              value={query}
              placeholder="Search a movie…"
              onChange={e => setQuery(e.target.value)}
              style={{
                width: "100%",
                fontSize: 17,
                padding: "12px 18px",
                marginBottom: 12,
                background: "#25243a",
                border: "none",
                borderRadius: 9,
                color: "#fff",
                boxShadow: "0 1.5px 8px #0003"
              }}
            />
            {/* Search suggestions */}
            {results.length > 0 && (
              <div style={{
                width: "100%",
                background: "#16151f",
                borderRadius: 10,
                boxShadow: "0 2px 14px #0005",
                marginBottom: 13,
                padding: "5px 0",
                maxHeight: showAll ? 280 : 148,
                overflowY: "auto"
              }}>
                {(showAll ? results : results.slice(0, 3)).map(m => (
                  <div key={m.id}
                    onClick={() => { addToWatchlist(m); setQuery(""); setResults([]); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "7px 16px",
                      cursor: "pointer",
                      borderBottom: "1px solid #232336",
                      transition: "background 0.12s",
                      background: "#16151f"
                    }}
                  >
                    <img src={m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : "/posters/placeholder.png"}
                      alt={m.title}
                      style={{ width: 37, height: 55, objectFit: "cover", borderRadius: 6, marginRight: 8, background: "#18141c" }}
                    />
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{m.title}</span>
                    <span style={{ color: "#bdbdbd", fontWeight: 400, fontSize: 14, marginLeft: 7 }}>{m.release_date?.slice(0, 4) || ""}</span>
                  </div>
                ))}
                {results.length > 3 && !showAll && (
                  <div style={{ textAlign: "center", margin: "9px 0" }}>
                    <button
                      onClick={() => setShowAll(true)}
                      style={{
                        color: COLORS.accent, fontWeight: 700, background: "none", border: "none", fontSize: 15, cursor: "pointer"
                      }}>See more</button>
                  </div>
                )}
              </div>
            )}
            {/* Watchlist pills: poster + title */}
            {watchlist.length > 0 && (
              <div style={{ width: "100%", marginBottom: 10 }}>
                <div style={{ color: "#fff", fontWeight: 700, marginBottom: 4, fontSize: 16 }}>Your picks:</div>
                <div style={{
                  display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center"
                }}>
                  {watchlist.map(m => (
                    <div key={m.id} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: "#262236", borderRadius: 13, padding: "5px 14px 5px 7px", boxShadow: "0 1.5px 6px #0002"
                    }}>
                      <img src={m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : "/posters/placeholder.png"}
                        alt={m.title} style={{ width: 31, height: 44, borderRadius: 6, objectFit: "cover", background: "#18141c" }} />
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginLeft: 4, marginRight: 7 }}>{m.title}</span>
                      <button
                        onClick={() => removeFromWatchlist(m.id)}
                        style={{
                          color: "#eb423b", background: "none", border: "none",
                          fontSize: 18, fontWeight: 700, marginLeft: 3, cursor: "pointer", lineHeight: 1
                        }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Controls */}
            <div style={{
              width: "100%", display: "flex", justifyContent: "space-between",
              alignItems: "center", marginTop: 12
            }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  color: COLORS.accent, fontWeight: 700, background: "none", border: "none", fontSize: 17, marginRight: 18, cursor: "pointer"
                }}>‹ BACK</button>
              <button
                onClick={() => finishOnboarding(false, false)}
                disabled={loading}
                style={{
                  background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  fontWeight: 900,
                  fontSize: 19,
                  padding: "13px 41px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.64 : 1,
                  boxShadow: "0 2px 9px #eb423b28"
                }}>
                FINISH
              </button>
              <button
                onClick={() => finishOnboarding(false, true)}
                style={{
                  color: COLORS.accent,
                  fontWeight: 700,
                  background: "none",
                  border: "none",
                  fontSize: 17,
                  marginLeft: 18,
                  cursor: "pointer"
                }}>SKIP</button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
