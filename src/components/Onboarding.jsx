import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const THEME = {
  accent: "#fe9245",
  accent2: "#eb423b",
  dark: "#101015",
  card: "#18141c",
  white: "#fff"
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  // WIZARD STATE
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [skipGenres, setSkipGenres] = useState(false);
  const [skipMovies, setSkipMovies] = useState(false);

  // TMDB
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
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
  const toggleGenre = (id) =>
    setSelectedGenres((g) => g.includes(id) ? g.filter(x => x !== id) : [...g, id]);

  // AUTH
  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => setSession(data?.session));
    return () => sub.data?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    if (session.user?.user_metadata?.onboarding_complete)
      navigate("/app", { replace: true });
  }, [session, navigate]);

  // TMDB SEARCH
  useEffect(() => {
    if (!query) { setResults([]); setShowAll(false); return; }
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`,
          { signal: ctrl.signal }
        );
        const json = await res.json();
        // Sort by popularity descending
        const all = (json.results || []).sort((a, b) => b.popularity - a.popularity);
        setResults(all);
      } catch {}
    })();
    return () => ctrl.abort();
  }, [query, TMDB_KEY]);

  // --- Add/Remove Movies ---
  const addToWatchlist = (movie) => {
    if (!watchlist.some(m => m.id === movie.id))
      setWatchlist([...watchlist, movie]);
  };
  const removeFromWatchlist = (id) => setWatchlist(watchlist.filter(m => m.id !== id));

  // --- Save preferences ---
  async function saveAll() {
    setSaving(true); setError("");
    const user_id = session?.user?.id;
    try {
      // 1. Insert any new genres
      if (!skipGenres) {
        await supabase.from("user_preferences").delete().eq("user_id", user_id);
        if (selectedGenres.length)
          await supabase.from("user_preferences").upsert(
            selectedGenres.map(genre_id => ({ user_id, genre_id })),
            { onConflict: ['user_id', 'genre_id'] }
          );
      }
      // 2. For each selected movie, insert into movies if not exists
      for (const m of watchlist) {
        const { data, error: e1 } = await supabase.from("movies")
          .upsert({
            id: m.id,
            title: m.title,
            poster_path: m.poster_path,
            release_date: m.release_date
          }, { onConflict: ['id'] });
        if (e1) throw e1;
      }
      // 3. Save watchlist
      await supabase.from("user_watchlist").delete().eq("user_id", user_id).eq("status", "onboarding");
      if (!skipMovies && watchlist.length)
        await supabase.from("user_watchlist").upsert(
          watchlist.map(m => ({ user_id, movie_id: m.id, status: "onboarding" })),
          { onConflict: ['user_id', 'movie_id'] }
        );
      // 4. Mark onboarding complete
      await supabase.from("users").update({ onboarding_complete: true }).eq("id", user_id);
      await supabase.auth.updateUser({ data: { onboarding_complete: true } });
      // 5. Done!
      navigate("/app", { replace: true });
    } catch (e) {
      setError("Could not save your preferences — please try again.");
      console.error("Onboarding save failed:", e);
    } finally {
      setSaving(false);
    }
  }

  // --- UI ---
  return (
    <div style={{
      minHeight: "100vh",
      minWidth: "100vw",
      background: `url(/background-poster.jpg) center/cover no-repeat, ${THEME.dark}`,
      display: "flex", flexDirection: "column", alignItems: "stretch"
    }}>
      {/* FeelFlick logo */}
      <div style={{
        position: "absolute", top: 32, left: 40, zIndex: 9,
        display: "flex", alignItems: "center", gap: 14
      }}>
        <img src="/logo.png" alt="FeelFlick" style={{ width: 52, height: 52, borderRadius: 16, boxShadow: "0 2px 10px #0003" }} />
        <span style={{
          fontWeight: 900, fontSize: 36, color: THEME.white,
          letterSpacing: "-1.2px", textShadow: "0 1px 8px #19194055"
        }}>
          FeelFlick
        </span>
      </div>
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "60px 10px"
      }}>
        <div style={{
          background: "rgba(24, 20, 28, 0.95)",
          borderRadius: 38,
          maxWidth: 620,
          width: "100%",
          boxShadow: "0 8px 48px #000a",
          padding: "44px 42px 38px 42px",
          position: "relative"
        }}>
          {/* Error */}
          {error && <div style={{
            background: "#ae2333",
            color: "#fff", fontWeight: 700,
            borderRadius: 10, textAlign: "center",
            marginBottom: 25, padding: "14px 6px", fontSize: 22
          }}>{error}</div>}

          {/* STEP 1: Genres */}
          {step === 1 && (
            <>
              <div style={{
                fontWeight: 900, fontSize: 38, textAlign: "center", marginBottom: 13, color: THEME.white,
                lineHeight: 1.13
              }}>What do you like to watch?</div>
              <div style={{
                textAlign: "center", color: "#ededed", marginBottom: 4, fontSize: 20, fontWeight: 400
              }}>
                Pick a few genres that match your taste.
              </div>
              <div style={{
                textAlign: "center", color: THEME.accent, marginBottom: 19, fontSize: 18, fontWeight: 500
              }}>
                This helps us give you recommendations that actually fit your mood!
              </div>
              {/* Genre grid */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "22px 18px",
                maxWidth: 540, margin: "0 auto 34px auto"
              }}>
                {GENRES.map(g =>
                  <button key={g.id}
                    onClick={() => toggleGenre(g.id)}
                    style={{
                      border: selectedGenres.includes(g.id)
                        ? `2.7px solid transparent`
                        : `2.1px solid ${THEME.accent}`,
                      background: selectedGenres.includes(g.id)
                        ? "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)"
                        : "transparent",
                      color: selectedGenres.includes(g.id) ? "#fff" : "#ededed",
                      fontWeight: 600,
                      fontSize: 20,
                      borderRadius: 19,
                      minWidth: 100, minHeight: 55,
                      padding: "0 22px",
                      outline: "none",
                      cursor: "pointer",
                      transition: "all 0.13s",
                      textAlign: "center",
                      boxShadow: selectedGenres.includes(g.id)
                        ? "0 5px 20px #eb423b28"
                        : "none",
                      overflow: "hidden",
                      whiteSpace: "nowrap"
                    }}
                  >
                    <span style={{
                      fontSize: 19,
                      fontWeight: 500,
                      fontFamily: "Inter, system-ui, sans-serif",
                      textTransform: "capitalize",
                      letterSpacing: "-0.2px",
                    }}>{g.label.charAt(0).toUpperCase() + g.label.slice(1).toLowerCase()}</span>
                  </button>
                )}
              </div>
              {/* Controls */}
              <div style={{ display: "flex", justifyContent: "center", gap: 36, marginTop: 12 }}>
                <button
                  style={{
                    background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
                    border: "none", borderRadius: 13,
                    color: "#fff", fontWeight: 800, fontSize: 19,
                    padding: "8px 40px", minWidth: 112, cursor: "pointer",
                    opacity: selectedGenres.length === 0 ? 0.75 : 1, marginRight: 7,
                    boxShadow: "0 2px 11px 0 #fe924522"
                  }}
                  onClick={() => setStep(2)}
                  disabled={selectedGenres.length === 0}
                >Next</button>
                <button
                  style={{
                    background: "none", border: "none", color: THEME.accent,
                    fontWeight: 700, fontSize: 18, cursor: "pointer", marginLeft: 7, opacity: 0.9
                  }}
                  onClick={() => { setSkipGenres(true); setStep(2); }}
                >Skip</button>
              </div>
            </>
          )}

          {/* STEP 2: Movies */}
          {step === 2 && (
            <>
              <div style={{
                fontWeight: 900, fontSize: 32, textAlign: "center", marginBottom: 11, color: THEME.white, lineHeight: 1.11
              }}>Any favourite movies?</div>
              <div style={{
                textAlign: "center", color: "#fff", fontSize: 15, fontWeight: 400, marginBottom: 5, opacity: 0.95, letterSpacing: "-0.2px"
              }}>
                Type to search your favourites. <span style={{ color: THEME.accent, fontWeight: 500 }}>Pick at least one for better suggestions.</span>
              </div>
              {/* Search */}
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); setShowAll(false); }}
                placeholder="Search a movie…"
                style={{
                  width: "100%",
                  background: "#232335",
                  border: "none",
                  outline: "none",
                  borderRadius: 11,
                  padding: "12px 19px",
                  fontSize: 17,
                  color: "#fff",
                  margin: "14px 0 7px 0",
                  boxShadow: "0 2px 10px #0002"
                }}
              />
              {/* Suggestions */}
              {results.length > 0 && (
                <div style={{
                  maxHeight: showAll ? 380 : 160, overflowY: "auto",
                  background: "#232330", borderRadius: 9, boxShadow: "0 3px 13px #0002",
                  margin: "0 0 9px 0", padding: "7px 0"
                }}>
                  {(showAll ? results : results.slice(0, 3)).map(r =>
                    <div
                      key={r.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "8px 20px", cursor: "pointer", transition: "background 0.12s",
                        background: watchlist.some(m => m.id === r.id) ? "#28233a" : "none"
                      }}
                      onClick={() => addToWatchlist(r)}
                    >
                      <img src={r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : "/posters/placeholder.png"}
                        alt={r.title} style={{ width: 34, height: 51, borderRadius: 7, objectFit: "cover", background: "#18141c" }} />
                      <span style={{ color: "#fff", fontWeight: 500, fontSize: 16, letterSpacing: "-0.15px" }}>
                        {r.title} <span style={{ color: "#fffc", fontWeight: 400, fontSize: 14, marginLeft: 2 }}>
                          {r.release_date ? `(${r.release_date.slice(0, 4)})` : ""}
                        </span>
                      </span>
                    </div>
                  )}
                  {results.length > 3 && !showAll && (
                    <div
                      onClick={() => setShowAll(true)}
                      style={{
                        textAlign: "center", color: THEME.accent, fontWeight: 700, cursor: "pointer",
                        fontSize: 14, padding: "7px 0"
                      }}>
                      See more
                    </div>
                  )}
                </div>
              )}

              {/* Picked movies */}
              {watchlist.length > 0 && (
                <div style={{ margin: "7px 0 16px 0" }}>
                  <div style={{ color: "#fff", fontWeight: 600, marginBottom: 3, fontSize: 15 }}>Your picks:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                    {watchlist.map(m =>
                      <div key={m.id} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: "#211c2a", borderRadius: 11, padding: "6px 13px 6px 7px",
                        marginBottom: 2, minWidth: 120
                      }}>
                        <img src={m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : "/posters/placeholder.png"}
                          alt={m.title}
                          style={{ width: 32, height: 48, borderRadius: 6, objectFit: "cover", background: "#18141c", marginRight: 6 }} />
                        <span style={{ color: "#fff", fontWeight: 500, fontSize: 16, flex: 1, letterSpacing: "-0.1px" }}>{m.title}</span>
                        <button onClick={() => removeFromWatchlist(m.id)}
                          style={{
                            color: "#fff", background: "none", border: "none", marginLeft: 5,
                            cursor: "pointer", fontSize: 21, opacity: 0.65, transition: "opacity 0.17s"
                          }}>×</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Controls */}
              <div style={{ display: "flex", justifyContent: "center", gap: 36, marginTop: 6 }}>
                <button
                  style={{
                    background: "none", border: "none", color: THEME.accent,
                    fontWeight: 700, fontSize: 17, cursor: "pointer", marginRight: 9
                  }}
                  onClick={() => { setStep(1); }}
                >&lt; Back</button>
                <button
                  style={{
                    background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
                    border: "none", borderRadius: 13,
                    color: "#fff", fontWeight: 800, fontSize: 19,
                    padding: "8px 40px", minWidth: 112, cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1, marginLeft: 5, boxShadow: "0 2px 11px 0 #fe924522"
                  }}
                  onClick={saveAll}
                  disabled={saving}
                >{saving ? "Saving..." : "Finish"}</button>
                <button
                  style={{
                    background: "none", border: "none", color: THEME.accent,
                    fontWeight: 700, fontSize: 17, cursor: "pointer", marginLeft: 5, opacity: 0.9
                  }}
                  onClick={saveAll}
                  disabled={saving}
                >Skip</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
