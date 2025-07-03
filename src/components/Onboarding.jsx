import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

// -- Theme
const COLORS = {
  dark: "#18141c",
  surface: "#232330",
  accent: "#fe9245",
  accent2: "#eb423b",
  border: "#fe9245"
};

const GENRES = [
  { id: 28, label: "Action" }, { id: 12, label: "Adventure" },
  { id: 16, label: "Animation" }, { id: 35, label: "Comedy" },
  { id: 80, label: "Crime" }, { id: 99, label: "Documentary" },
  { id: 18, label: "Drama" }, { id: 10751, label: "Family" },
  { id: 14, label: "Fantasy" }, { id: 36, label: "History" },
  { id: 27, label: "Horror" }, { id: 10402, label: "Music" },
  { id: 9648, label: "Mystery" }, { id: 10749, label: "Romance" },
  { id: 878, label: "Sci-Fi" }, { id: 53, label: "Thriller" },
];

export default function Onboarding() {
  const [session, setSession] = useState(null);
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showAllResults, setShowAllResults] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

  // -- Sync session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // -- Prevent re-onboarding
  useEffect(() => {
    if (session && session.user?.user_metadata?.onboarding_complete) {
      navigate("/app", { replace: true });
    }
  }, [session, navigate]);

  // -- TMDB Search with "See more"
  useEffect(() => {
    if (!query) { setResults([]); return; }
    let cancel = false;
    fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(json => {
        if (!cancel) {
          // Always sort by popularity
          const sorted = (json.results || []).sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
          setResults(sorted.slice(0, 20)); // keep all for "See more"
          setShowAllResults(false);
        }
      });
    return () => { cancel = true; };
  }, [query, TMDB_KEY]);

  // -- Genre toggle
  const toggleGenre = id =>
    setSelectedGenres(g =>
      g.includes(id) ? g.filter(x => x !== id) : [...g, id]
    );

  // -- Add/remove watchlist
  const addToWatchlist = m => {
    if (watchlist.some(w => w.id === m.id)) return;
    setWatchlist([...watchlist, m]);
    setQuery("");
    setResults([]);
    setShowAllResults(false);
  };
  const removeFromWatchlist = id => setWatchlist(watchlist.filter(m => m.id !== id));

  // -- Save onboarding
  async function finishOnboarding(skipGenres = false, skipMovies = false) {
    setError("");
    const user_id = session?.user?.id;
    try {
      // Save genres
      const delPrefs = await supabase.from("user_preferences").delete().eq("user_id", user_id);
      if (!skipGenres && selectedGenres.length) {
        const upPrefs = await supabase.from("user_preferences").upsert(
          selectedGenres.map(genre_id => ({ user_id, genre_id })),
          { onConflict: ["user_id", "genre_id"] }
        );
        console.log('user_preferences:', upPrefs);
        if (upPrefs.error) throw upPrefs.error;
      }

      // Save watchlist (insert any missing movies first)
      const delWatch = await supabase.from("user_watchlist").delete().eq("user_id", user_id).eq("status", "onboarding");
      if (!skipMovies && watchlist.length) {
        for (const m of watchlist) {
          // insert movie if not exists
          const movieUp = await supabase.from("movies").upsert({
            id: m.id, title: m.title,
            poster_path: m.poster_path,
            release_date: m.release_date
          }, { onConflict: ["id"] });
          console.log('movies upsert:', movieUp);
          if (movieUp.error) throw movieUp.error;
        }
        const upWatch = await supabase.from("user_watchlist").upsert(
          watchlist.map(m => ({
            user_id, movie_id: m.id, status: "onboarding"
          })),
          { onConflict: ["user_id", "movie_id"] }
        );
        console.log('user_watchlist:', upWatch);
        if (upWatch.error) throw upWatch.error;
      }

      // Mark onboarding complete
      const updateUserTable = await supabase.from("users").update({ onboarding_complete: true }).eq("id", user_id);
      const updateAuth = await supabase.auth.updateUser({ data: { onboarding_complete: true } });
      console.log('users update:', updateUserTable);
      console.log('auth update:', updateAuth);

      navigate("/app", { replace: true });
    } catch (err) {
      setError("Could not save your preferences — please try again.");
      console.error("Onboarding save failed:", err);
    }
  }

  if (!session) return null;

  // -- Inline style constants (use same as last version)

  const card = {
    width: "clamp(370px, 44vw, 520px)", maxWidth: 520, minHeight: 305,
    background: "rgba(24,20,28,0.94)", borderRadius: 30,
    padding: "28px 24px 30px 24px", boxShadow: "0 8px 64px #000a",
    display: "flex", flexDirection: "column", alignItems: "center",
    position: "relative", margin: "30px auto 0 auto"
  };

  const logoRow = {
    position: "absolute", top: 38, left: 38, display: "flex", alignItems: "center", zIndex: 10
  };

  return (
    <div style={{
      minHeight: "100vh", width: "100vw",
      background: "url('/background-poster.jpg') center/cover no-repeat",
      fontFamily: "Inter, system-ui, sans-serif", position: "relative"
    }}>
      {/* FeelFlick Logo */}
      <div style={logoRow}>
        <img src="/logo.png" alt="FeelFlick" style={{ width: 48, height: 48, borderRadius: 12, marginRight: 11, boxShadow: "0 1.5px 12px #0004" }} />
        <span style={{
          fontSize: 31, fontWeight: 900, color: "#fff", letterSpacing: "-1.1px", textShadow: "0 1px 7px #19194044"
        }}>FeelFlick</span>
      </div>

      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <div style={card}>
          {error && (
            <div style={{
              background: "#9b212b", color: "#fff", fontWeight: 700, borderRadius: 8,
              padding: "11px 0", width: "100%", textAlign: "center", marginBottom: 13, fontSize: 15
            }}>{error}</div>
          )}
          {step === 1 && (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 900, textAlign: "center", color: "#fff", marginBottom: 8, lineHeight: 1.17 }}>
                What do you like to watch?
              </h1>
              <div style={{ color: "#d7dbe8", fontSize: 15.5, textAlign: "center", marginBottom: 4, fontWeight: 400 }}>
                Pick a few genres that match your taste.
              </div>
              <div style={{
                color: COLORS.accent, fontSize: 13.8, fontWeight: 500, textAlign: "center", marginBottom: 19,
                letterSpacing: 0.01
              }}>
                This helps us give you recommendations that actually fit your mood!
              </div>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                gap: "10px 8px", marginBottom: 20, width: "100%"
              }}>
                {GENRES.map((g, idx) => {
                  const selected = selectedGenres.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleGenre(g.id)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14.2, fontWeight: 500, letterSpacing: "0.01em",
                        borderRadius: 13, border: selected ? "none" : `1.5px solid ${COLORS.accent}`,
                        background: selected
                          ? "linear-gradient(90deg,#367cff 15%,#fe9245 92%)"
                          : "transparent",
                        color: "#fff", height: 36, minWidth: 0,
                        boxShadow: selected ? "0 2px 8px #fe924523" : "none",
                        transition: "all 0.13s",
                        cursor: "pointer",
                        padding: "0 14px",
                        outline: "none",
                        textAlign: "center"
                      }}
                    >
                      <span style={{
                        fontWeight: 500, fontSize: 14.2, letterSpacing: 0.01,
                        textAlign: "center", whiteSpace: "nowrap",
                        textTransform: "capitalize"
                      }}>
                        {g.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div style={{
                display: "flex", width: "100%", justifyContent: "center", gap: 15
              }}>
                <button
                  onClick={() => finishOnboarding(true, false)}
                  style={{
                    background: "none", border: "none", color: COLORS.accent, fontWeight: 700,
                    fontSize: 15.2, cursor: "pointer", letterSpacing: 0.01
                  }}
                >SKIP</button>
                <button
                  disabled={selectedGenres.length === 0}
                  onClick={() => setStep(2)}
                  style={{
                    background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
                    color: "#fff", border: "none", borderRadius: 10,
                    fontWeight: 800, fontSize: 16.5, padding: "7px 21px",
                    margin: 0, minWidth: 74, boxShadow: "0 2px 6px #fe924518",
                    cursor: selectedGenres.length ? "pointer" : "not-allowed",
                    opacity: selectedGenres.length ? 1 : 0.63,
                    letterSpacing: 0.01,
                  }}
                >NEXT</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={{
                fontSize: 23.5, fontWeight: 900, color: "#fff", marginBottom: 7, textAlign: "center"
              }}>Any favourite movies?</h2>
              <div style={{
                color: "#fff", fontSize: 13.6, fontWeight: 400, opacity: 0.85,
                marginBottom: 2, textAlign: "center", lineHeight: 1.4
              }}>
                Type to search your favourites.{" "}
                <span style={{ color: COLORS.accent, fontWeight: 600 }}>
                  Pick at least one for better suggestions.
                </span>
              </div>
              <div style={{ marginBottom: 10 }}></div>
              {/* Search box */}
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search a movie…"
                style={{
                  width: "100%", background: "#242436", border: "none",
                  borderRadius: 9, padding: "10px 14px", fontSize: 15,
                  color: "#fff", fontWeight: 500, marginBottom: 6, outline: "none"
                }}
              />
              {/* Suggestions */}
              {results.length > 0 && (
                <div style={{
                  width: "100%", background: "#232338", borderRadius: 9,
                  boxShadow: "0 2px 10px #0003", marginBottom: 8
                }}>
                  {(showAllResults ? results : results.slice(0, 3)).map((r, i) => (
                    <div key={r.id}
                      style={{
                        display: "flex", alignItems: "center",
                        cursor: "pointer", padding: "7px 10px", borderBottom: i === results.length - 1 ? "none" : "1px solid #272745"
                      }}
                      onClick={() => addToWatchlist(r)}
                    >
                      <img src={r.poster_path
                        ? `https://image.tmdb.org/t/p/w92${r.poster_path}`
                        : "/posters/placeholder.png"}
                        alt={r.title}
                        style={{ width: 25, height: 36, objectFit: "cover", borderRadius: 6, marginRight: 8, background: "#212121" }}
                      />
                      <span style={{
                        color: "#fff", fontSize: 13.8, fontWeight: 500
                      }}>
                        {r.title}
                        <span style={{ color: "#babacf", fontWeight: 400, marginLeft: 5, fontSize: 12 }}>
                          {r.release_date ? `(${r.release_date.slice(0, 4)})` : ""}
                        </span>
                      </span>
                    </div>
                  ))}
                  {results.length > 3 && !showAllResults && (
                    <div style={{ textAlign: "center", padding: "7px 0" }}>
                      <button onClick={() => setShowAllResults(true)}
                        style={{
                          border: "none", background: "none", color: COLORS.accent,
                          fontSize: 13, fontWeight: 600, cursor: "pointer"
                        }}>
                        See more…
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Picked movies */}
              {watchlist.length > 0 && (
                <div style={{ width: "100%", marginBottom: 8 }}>
                  <div style={{
                    color: "#fff", fontWeight: 700, fontSize: 13.5, marginBottom: 7
                  }}>Your picks:</div>
                  <div style={{
                    display: "flex", flexWrap: "wrap", gap: "8px 8px"
                  }}>
                    {watchlist.map(m => (
                      <div key={m.id}
                        style={{
                          display: "flex", alignItems: "center", background: "#232338",
                          borderRadius: 8, padding: "3px 8px 3px 3px", gap: 6,
                          fontWeight: 500, fontSize: 12.7, color: "#fff", minWidth: 68
                        }}>
                        <img src={m.poster_path
                          ? `https://image.tmdb.org/t/p/w92${m.poster_path}`
                          : "/posters/placeholder.png"}
                          alt={m.title} style={{
                            width: 18, height: 28, borderRadius: 5, objectFit: "cover", background: "#232330"
                          }} />
                        <span>{m.title}</span>
                        <button
                          style={{
                            background: "none", border: "none", color: COLORS.accent2,
                            fontSize: 15, cursor: "pointer", marginLeft: 4, fontWeight: 700, lineHeight: 1
                          }}
                          onClick={() => removeFromWatchlist(m.id)}
                        >×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Controls */}
              <div style={{
                display: "flex", width: "100%", justifyContent: "center", gap: 15, marginTop: 10
              }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    background: "none", border: "none", color: COLORS.accent, fontWeight: 700,
                    fontSize: 14, cursor: "pointer", letterSpacing: 0.01
                  }}
                >&lt; BACK</button>
                <button
                  onClick={() => finishOnboarding(false, false)}
                  style={{
                    background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
                    color: "#fff", border: "none", borderRadius: 10,
                    fontWeight: 800, fontSize: 15.5, padding: "6px 20px",
                    margin: 0, minWidth: 68, boxShadow: "0 2px 6px #fe924519",
                    cursor: "pointer", letterSpacing: 0.01,
                  }}
                >FINISH</button>
                <button
                  onClick={() => finishOnboarding(false, true)}
                  style={{
                    background: "none", border: "none", color: COLORS.accent, fontWeight: 700,
                    fontSize: 14, cursor: "pointer", letterSpacing: 0.01
                  }}
                >SKIP</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
