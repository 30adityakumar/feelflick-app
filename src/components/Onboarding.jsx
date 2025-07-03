import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

// Helper: Theme colors
const COLORS = {
  bg: "#18141c",
  surface: "#232330",
  accent: "#fe9245",
  accent2: "#eb423b",
  white: "#fff",
  text: "#c6c7d2",
  shadow: "0 6px 24px #000a"
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  // --- Wizard state
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState([]);  // [genreId, ...]
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);                // TMDB results
  const [allResults, setAllResults] = useState([]);          // For "See more"
  const [showAll, setShowAll] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // --- Auth
  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => { if (isMounted) setSession(session); });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => { if (isMounted) setSession(s); });
    return () => { isMounted = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!session) return;
    if (session.user?.user_metadata?.onboarding_complete) navigate("/app", { replace: true });
  }, [session, navigate]);

  // --- Genre list (static)
  const GENRES = useMemo(() => [
    { id: 28, label: "Action" }, { id: 12, label: "Adventure" }, { id: 16, label: "Animation" },
    { id: 35, label: "Comedy" }, { id: 80, label: "Crime" }, { id: 99, label: "Documentary" },
    { id: 18, label: "Drama" }, { id: 10751, label: "Family" }, { id: 14, label: "Fantasy" },
    { id: 36, label: "History" }, { id: 27, label: "Horror" }, { id: 10402, label: "Music" },
    { id: 9648, label: "Mystery" }, { id: 10749, label: "Romance" }, { id: 878, label: "Sci‑Fi" },
    { id: 53, label: "Thriller" }
  ], []);

  // --- Genre select/deselect
  const toggleGenre = id => setSelectedGenres(g =>
    g.includes(id) ? g.filter(x => x !== id) : [...g, id]
  );

  // --- TMDb search, top 3 by popularity, with "see more"
  useEffect(() => {
    if (!query) { setResults([]); setAllResults([]); setShowAll(false); return; }
    let abort = false;
    (async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`
        );
        const json = await res.json();
        if (!abort) {
          // sort by popularity desc, then show top 3 (or all if showAll)
          const sorted = (json.results || []).sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
          setAllResults(sorted);
          setResults(sorted.slice(0, 3));
        }
      } catch { /* ignore */ }
    })();
    return () => { abort = true; };
  }, [query]);

  const showMore = () => setResults(allResults);

  // --- Add/remove movies from watchlist
  const addToWatchlist = movie => {
    if (!watchlist.some(m => m.id === movie.id)) setWatchlist(watchlist => [...watchlist, movie]);
    setQuery("");
    setResults([]);
    setShowAll(false);
  };
  const removeFromWatchlist = id =>
    setWatchlist(watchlist => watchlist.filter(m => m.id !== id));

  // --- Save all data
  async function saveOnboarding(skipGenres = false, skipMovies = false) {
    if (!session) return;
    setSaving(true); setError("");
    const user_id = session.user.id;

    try {
      // --- USERS table (mark onboarding complete)
      await supabase.from("users").upsert({
        id: user_id,
        onboarding_complete: true,
        name: session.user.user_metadata?.name ?? "",
        email: session.user.email
      });

      // --- Update Supabase Auth meta
      await supabase.auth.updateUser({ data: { onboarding_complete: true } });

      // --- GENRES (clear old, insert new)
      await supabase.from("user_preferences").delete().eq("user_id", user_id);
      if (!skipGenres && selectedGenres.length) {
        await supabase.from("user_preferences").upsert(
          selectedGenres.map(genre_id => ({ user_id, genre_id }))
        );
      }

      // --- MOVIES (ensure all movies in movies table)
      if (!skipMovies && watchlist.length) {
        // For each movie, upsert to movies table if needed
        for (const m of watchlist) {
          // Only insert title/poster/release_date to keep it simple
          await supabase.from("movies").upsert({
            tmdb_id: m.id,
            title: m.title,
            poster_path: m.poster_path,
            release_date: m.release_date
          }, { onConflict: ["tmdb_id"] });
        }
        // Clean old onboarding picks
        await supabase.from("user_watchlist").delete().eq("user_id", user_id).eq("status", "onboarding");
        // Save new picks
        await supabase.from("user_watchlist").upsert(
          watchlist.map(m => ({ user_id, movie_id: m.id, status: "onboarding" }))
        );
      }
      // --- Done
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err.message || "Error saving onboarding. Try again!");
      setSaving(false);
    }
  }

  // --- RENDER ---
  if (!session) return null;
  const isMobile = window.innerWidth < 600;

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg, color: COLORS.text,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? 8 : 36
    }}>
      <div style={{
        width: "100%", maxWidth: 480, margin: "0 auto",
        background: COLORS.surface, borderRadius: 24, boxShadow: COLORS.shadow,
        padding: isMobile ? "25px 10px" : "38px 42px"
      }}>
        {step === 1 && (
          <>
            <div style={{
              fontSize: 26, fontWeight: 900, textAlign: "center", color: COLORS.white, marginBottom: 10
            }}>What do you like to watch?</div>
            <div style={{ color: COLORS.text, fontSize: 16, textAlign: "center", marginBottom: 18 }}>
              Pick a few genres that match your taste. This helps us give you recommendations that actually fit your mood!
            </div>
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 22
            }}>
              {GENRES.map(g =>
                <button
                  key={g.id}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 18,
                    border: "none",
                    background: selectedGenres.includes(g.id)
                      ? `linear-gradient(90deg,${COLORS.accent} 10%,${COLORS.accent2} 90%)`
                      : "#242439",
                    color: COLORS.white,
                    fontWeight: 700,
                    fontSize: 15,
                    boxShadow: selectedGenres.includes(g.id) ? "0 2px 10px #fe924533" : "none",
                    cursor: "pointer",
                    opacity: selectedGenres.includes(g.id) ? 1 : 0.93,
                    transition: "background 0.17s, box-shadow 0.15s"
                  }}
                  onClick={() => toggleGenre(g.id)}
                >
                  {g.label}
                </button>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              <span />
              <button
                disabled={selectedGenres.length === 0}
                style={{
                  background: `linear-gradient(90deg,${COLORS.accent} 10%,${COLORS.accent2} 90%)`,
                  color: "#fff", fontWeight: 800, fontSize: 15,
                  padding: "9px 28px", borderRadius: 9, border: "none",
                  boxShadow: "0 2px 8px #fe924522", cursor: selectedGenres.length ? "pointer" : "not-allowed", opacity: selectedGenres.length ? 1 : 0.58
                }}
                onClick={() => setStep(2)}
              >Next</button>
              <button
                style={{
                  background: "none", color: COLORS.accent,
                  border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer"
                }}
                onClick={() => saveOnboarding(true, false)}
              >Skip</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{
              fontSize: 26, fontWeight: 900, textAlign: "center", color: COLORS.white, marginBottom: 10
            }}>Any favourite movies?</div>
            <div style={{ color: COLORS.text, fontSize: 16, textAlign: "center", marginBottom: 16 }}>
              Type to search your favourites. <span style={{ color: COLORS.accent }}>Pick at least one for better suggestions.</span>
              <br />
              (We show top 3 results by popularity. Hit “See more” for all matches.)
            </div>
            <input
              type="text"
              placeholder="Search a movie…"
              style={{
                width: "100%", fontSize: 15, padding: "10px 14px",
                borderRadius: 8, border: "none", background: "#232330", color: COLORS.white,
                marginBottom: 10, boxShadow: "0 1.5px 8px 0 #0004", outline: "none"
              }}
              value={query}
              onChange={e => { setQuery(e.target.value); setShowAll(false); }}
            />
            {results.length > 0 && (
              <div style={{
                maxHeight: 220, overflowY: "auto", marginBottom: 7, background: "#181828", borderRadius: 12,
                boxShadow: "0 2px 9px #19194022"
              }}>
                {results.map(r =>
                  <div
                    key={r.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                      padding: "7px 12px", borderBottom: "1px solid #23234044"
                    }}
                    onClick={() => addToWatchlist(r)}
                  >
                    <img
                      src={r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : "/posters/placeholder.png"}
                      alt={r.title}
                      style={{ width: 38, height: 56, objectFit: "cover", borderRadius: 8, marginRight: 8 }}
                    />
                    <span style={{ color: COLORS.white }}>{r.title}
                      <span style={{ color: "#c6c7d2", marginLeft: 5, fontSize: 13, fontWeight: 500 }}>
                        {r.release_date ? `(${r.release_date.slice(0, 4)})` : ""}
                      </span>
                    </span>
                  </div>
                )}
                {!showAll && allResults.length > 3 && (
                  <div style={{
                    padding: "7px 0", textAlign: "center", background: "none"
                  }}>
                    <button
                      style={{
                        background: "none", color: COLORS.accent, border: "none", fontWeight: 700,
                        fontSize: 14, cursor: "pointer", padding: "0 7px"
                      }}
                      onClick={showMore}
                    >See more</button>
                  </div>
                )}
              </div>
            )}
            {watchlist.length > 0 && (
              <>
                <div style={{ fontWeight: 600, marginBottom: 7 }}>Your picks:</div>
                <div style={{
                  display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 18
                }}>
                  {watchlist.map(m =>
                    <div key={m.id} style={{
                      display: "flex", alignItems: "center", gap: 5,
                      background: "#232340", borderRadius: 13, padding: "6px 12px", fontSize: 14, fontWeight: 600
                    }}>
                      <img
                        src={m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : "/posters/placeholder.png"}
                        alt={m.title}
                        style={{ width: 26, height: 36, objectFit: "cover", borderRadius: 6 }}
                      />
                      <span style={{ color: COLORS.white }}>{m.title}</span>
                      <button
                        style={{
                          background: "none", color: COLORS.accent2, border: "none", fontSize: 16, marginLeft: 2,
                          cursor: "pointer"
                        }}
                        onClick={() => removeFromWatchlist(m.id)}
                        aria-label="Remove"
                      >×</button>
                    </div>
                  )}
                </div>
              </>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <button
                style={{
                  background: "none", color: COLORS.accent, border: "none",
                  fontWeight: 700, fontSize: 15, cursor: "pointer"
                }}
                onClick={() => setStep(1)}
              >‹ Back</button>
              <button
                style={{
                  background: `linear-gradient(90deg,${COLORS.accent} 10%,${COLORS.accent2} 90%)`,
                  color: "#fff", fontWeight: 800, fontSize: 15,
                  padding: "9px 28px", borderRadius: 9, border: "none",
                  boxShadow: "0 2px 8px #fe924522", cursor: "pointer"
                }}
                onClick={() => saveOnboarding(false, false)}
                disabled={saving}
              >Finish</button>
              <button
                style={{
                  background: "none", color: COLORS.accent,
                  border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer"
                }}
                onClick={() => saveOnboarding(false, true)}
              >Skip</button>
            </div>
            {error && (
              <div style={{ color: COLORS.accent2, fontWeight: 700, marginTop: 12, textAlign: "center" }}>
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
