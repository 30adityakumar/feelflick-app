import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

// Color theme for styles
const THEME = {
  gradient: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
  darkBg: "#18141c",
  cardBg: "rgba(32,26,34,0.95)",
  highlight: "#fe9245",
  accent: "#eb423b",
  text: "#fff"
};

export default function Onboarding({ session }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [saving, setSaving] = useState(false);
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
  const searchInput = useRef();

  // If onboarding already done, redirect to main app
  useEffect(() => {
    if (session?.user?.user_metadata?.onboarding_complete) {
      navigate("/app", { replace: true });
    }
  }, [session, navigate]);

  // GENRES
  const GENRES = useMemo(() => [
    { id: 28,  label: "Action" },    { id: 12, label: "Adventure" },
    { id: 16,  label: "Animation" }, { id: 35, label: "Comedy"    },
    { id: 80,  label: "Crime" },     { id: 99, label: "Documentary" },
    { id: 18,  label: "Drama" },     { id: 10751, label: "Family" },
    { id: 14,  label: "Fantasy" },   { id: 36, label: "History"   },
    { id: 27,  label: "Horror" },    { id: 10402,label: "Music"    },
    { id: 9648,label: "Mystery" },   { id: 10749,label: "Romance"  },
    { id: 878, label: "Sci‑Fi" },    { id: 53, label: "Thriller"  },
  ], []);
  const toggleGenre = (id) => setSelectedGenres(g => g.includes(id) ? g.filter(x=>x!==id) : [...g, id]);
  const selectAllGenres = () => setSelectedGenres(GENRES.map(g => g.id));
  const clearGenres = () => setSelectedGenres([]);

  // TMDB search for movies
  useEffect(() => {
    if (!query) { setResults([]); return; }
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`, { signal: ctrl.signal });
        const json = await res.json();
        setResults(json.results?.slice(0, 7) || []);
      } catch (_) {}
    })();
    return () => ctrl.abort();
  }, [query, TMDB_KEY]);

  const addToWatchlist = (movie) => {
    if (watchlist.some(m => m.id === movie.id)) return;
    setWatchlist([...watchlist, movie]);
    setQuery("");
    if (searchInput.current) searchInput.current.focus();
  };
  const removeFromWatchlist = (id) => setWatchlist(watchlist.filter(m => m.id !== id));

  // ------- Save to SQL! -----------
  async function finishOnboarding(skipMovies = false) {
    setSaving(true);
    const user_id = session.user.id;

    // Genres: upsert user_preferences
    if (selectedGenres.length) {
      // Remove old, insert new
      await supabase.from("user_preferences").delete().eq("user_id", user_id);
      await supabase.from("user_preferences").insert(
        selectedGenres.map(genre_id => ({ user_id, genre_id }))
      );
    } else {
      // User skipped genres: clear out if any
      await supabase.from("user_preferences").delete().eq("user_id", user_id);
    }

    // Watchlist: upsert user_watchlist (for onboarding, status=onboarding)
    if (!skipMovies && watchlist.length) {
      // Remove old, insert new
      await supabase.from("user_watchlist").delete().eq("user_id", user_id).eq("status", "onboarding");
      await supabase.from("user_watchlist").insert(
        watchlist.map(m => ({
          user_id, movie_id: m.id, status: "onboarding"
        }))
      );
    }

    // Mark onboarding complete
    await supabase
      .from("users")
      .update({ onboarding_complete: true })
      .eq("id", user_id);

    // Also update Supabase Auth user metadata (if you want)
    await supabase.auth.updateUser({
      data: { onboarding_complete: true }
    });

    setSaving(false);
    navigate("/app", { replace: true });
  }

  // --- UI ---

  return (
    <div style={{
      minHeight: "100vh",
      background: "#101015",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "18px"
    }}>
      <div style={{
        background: THEME.cardBg,
        borderRadius: 18,
        boxShadow: "0 10px 40px #000b",
        padding: "40px 24px 28px 24px",
        maxWidth: 480,
        width: "100%",
        color: THEME.text,
        position: "relative"
      }}>
        {step === 1 && (
          <>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <span style={{ fontWeight: 700, color: THEME.highlight }}>Step 1</span>
              <span style={{ color: "#b6b9d6", fontWeight: 500 }}> of 2</span>
            </div>
            <h2 style={{ fontWeight: 900, fontSize: "1.55rem", marginBottom: 7, letterSpacing: "-0.5px", textAlign: "center" }}>
              Welcome to FeelFlick!
            </h2>
            <p style={{
              color: "#e2e4ec", fontSize: 16, marginBottom: 24, textAlign: "center"
            }}>
              <span style={{ color: THEME.highlight, fontWeight: 600 }}>Pick your favourite genres</span> to help us personalize your movie feed.
            </p>
            <div style={{
              display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginBottom: 19
            }}>
              {GENRES.map(g => (
                <button
                  key={g.id}
                  onClick={() => toggleGenre(g.id)}
                  style={{
                    padding: "9px 17px",
                    borderRadius: 32,
                    fontWeight: 700,
                    fontSize: "1rem",
                    border: "none",
                    outline: "none",
                    background: selectedGenres.includes(g.id)
                      ? THEME.gradient
                      : "#282539",
                    color: selectedGenres.includes(g.id) ? "#fff" : "#f0f0f0",
                    boxShadow: selectedGenres.includes(g.id) ? "0 4px 14px #eb423b2b" : undefined,
                    opacity: selectedGenres.includes(g.id) ? 1 : 0.88,
                    cursor: "pointer",
                    transition: "all 0.18s"
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <div style={{ textAlign: "center", marginBottom: 10 }}>
              <span style={{
                color: "#ffb17a", fontWeight: 600, fontSize: 15
              }}>
                {selectedGenres.length} of {GENRES.length} selected
              </span>
              <span style={{ marginLeft: 14 }}>
                <button
                  style={{
                    color: "#91bfff", background: "none", border: "none", fontSize: 14,
                    cursor: "pointer", marginRight: 5
                  }}
                  onClick={selectAllGenres}
                  type="button"
                >Select All</button>
                <button
                  style={{
                    color: "#ffbbaa", background: "none", border: "none", fontSize: 14,
                    cursor: "pointer"
                  }}
                  onClick={clearGenres}
                  type="button"
                >Clear</button>
              </span>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button
                style={{
                  background: THEME.gradient,
                  color: "#fff",
                  fontWeight: 800,
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 0",
                  width: "100%",
                  fontSize: "1.1rem",
                  opacity: selectedGenres.length ? 1 : 0.5,
                  cursor: selectedGenres.length ? "pointer" : "not-allowed",
                  boxShadow: "0 3px 18px #fe924515",
                  transition: "all 0.15s"
                }}
                disabled={!selectedGenres.length}
                onClick={() => setStep(2)}
              >
                Next: Pick Movies
              </button>
              <button
                style={{
                  background: "#353148",
                  color: "#ffe3b3",
                  fontWeight: 700,
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 0",
                  width: "90px",
                  fontSize: "1.02rem",
                  marginLeft: 5,
                  opacity: 1,
                  cursor: "pointer"
                }}
                onClick={() => finishOnboarding(true)}
              >
                Skip
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <span style={{ fontWeight: 700, color: THEME.highlight }}>Step 2</span>
              <span style={{ color: "#b6b9d6", fontWeight: 500 }}> of 2</span>
            </div>
            <h2 style={{ fontWeight: 900, fontSize: "1.3rem", marginBottom: 7, textAlign: "center" }}>
              Add a couple of movies you love
            </h2>
            <p style={{ color: "#e2e4ec", fontSize: 16, marginBottom: 18, textAlign: "center" }}>
              Search and add 1–3 movies for an even better start!
            </p>
            <input
              ref={searchInput}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search for a movie…"
              style={{
                width: "100%",
                background: "#232330",
                color: "#fff",
                borderRadius: 7,
                border: "none",
                fontSize: 16,
                padding: "12px 13px",
                marginBottom: 13,
                outline: "none",
                boxShadow: "0 2px 9px #fe92450a"
              }}
              autoFocus
            />
            <div style={{ maxHeight: 172, overflowY: "auto", marginBottom: 10 }}>
              {results.map(r =>
                <div
                  key={r.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    background: "#221c23",
                    borderRadius: 9,
                    marginBottom: 7,
                    padding: "6px 11px",
                    cursor: "pointer",
                    transition: "background 0.17s"
                  }}
                  onClick={() => addToWatchlist(r)}
                >
                  <img
                    src={r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : '/posters/placeholder.png'}
                    alt={r.title}
                    style={{ width: 37, height: 52, borderRadius: 7, objectFit: "cover" }}
                  />
                  <div>
                    <span style={{ fontWeight: 700 }}>{r.title}</span>
                    {r.release_date &&
                      <span style={{ color: "#b3c0d0", fontSize: 13, marginLeft: 6 }}>
                        ({r.release_date.slice(0, 4)})
                      </span>
                    }
                  </div>
                </div>
              )}
            </div>
            {watchlist.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 15, color: "#ffb17a", fontWeight: 700, marginBottom: 2 }}>Your watchlist:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {watchlist.map(m =>
                    <div key={m.id} style={{
                      display: "flex", alignItems: "center",
                      background: "#232330", borderRadius: 20, padding: "6px 13px",
                      color: "#fff", fontWeight: 600, fontSize: 14, marginBottom: 2
                    }}>
                      {m.title}
                      <button
                        style={{
                          background: "none", border: "none",
                          color: "#ffbbaa", fontSize: 18, marginLeft: 9, cursor: "pointer"
                        }}
                        onClick={() => removeFromWatchlist(m.id)}
                        title="Remove"
                        type="button"
                      >×</button>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button
                style={{
                  background: "#353148",
                  color: "#fff",
                  fontWeight: 700,
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 0",
                  width: "100%",
                  fontSize: "1.1rem",
                  boxShadow: "0 3px 18px #fe924515",
                  cursor: "pointer"
                }}
                onClick={() => setStep(1)}
              >
                ‹ Back
              </button>
              <button
                style={{
                  background: THEME.gradient,
                  color: "#fff",
                  fontWeight: 800,
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 0",
                  width: "100%",
                  fontSize: "1.1rem",
                  boxShadow: "0 3px 18px #fe924515",
                  cursor: "pointer"
                }}
                onClick={() => finishOnboarding(false)}
                disabled={saving}
              >
                Finish
              </button>
              <button
                style={{
                  background: "#353148",
                  color: "#ffe3b3",
                  fontWeight: 700,
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 0",
                  width: "90px",
                  fontSize: "1.02rem",
                  marginLeft: 5,
                  opacity: 1,
                  cursor: "pointer"
                }}
                onClick={() => finishOnboarding(true)}
              >
                Skip
              </button>
            </div>
          </>
        )}

        {saving && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(28,20,32,0.62)",
            color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 18, zIndex: 10,
            borderRadius: 18
          }}>
            Saving…
          </div>
        )}
      </div>
    </div>
  );
}
