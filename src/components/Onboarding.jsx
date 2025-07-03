import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

// Theme variables
const ACCENT = "#fe9245";
const ACCENT2 = "#eb423b";
const DARK = "#18141c";
const OUTLINE = "1.2px solid #fe9245";
const BTN_BG = "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)";
const GENRE_SELECTED_BG = "linear-gradient(90deg,#2323b8 10%,#fdaf41 90%)";

export default function Onboarding() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  // Steps: 1 = genres, 2 = movies
  const [step, setStep] = useState(1);

  // Genres
  const [selectedGenres, setSelectedGenres] = useState([]);
  const GENRES = useMemo(() => [
    { id: 28, label: "Action" }, { id: 12, label: "Adventure" },
    { id: 16, label: "Animation" }, { id: 35, label: "Comedy" },
    { id: 80, label: "Crime" }, { id: 99, label: "Documentary" },
    { id: 18, label: "Drama" }, { id: 10751, label: "Family" },
    { id: 14, label: "Fantasy" }, { id: 36, label: "History" },
    { id: 27, label: "Horror" }, { id: 10402, label: "Music" },
    { id: 9648, label: "Mystery" }, { id: 10749, label: "Romance" },
    { id: 878, label: "Sci-fi" }, { id: 53, label: "Thriller" }
  ], []);
  function toggleGenre(id) {
    setSelectedGenres((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));
  }

  // Movies
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showAllResults, setShowAllResults] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

  // Auth/session check
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener?.subscription?.unsubscribe();
  }, []);

  // Genre grid, responsive
  function renderGenreButtons() {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0px",
          justifyItems: "center",
          alignItems: "center",
          marginTop: 2,
        }}
      >
        {GENRES.map((g) => (
          <button
            key={g.id}
            type="button"
            style={{
              width: 138,
              height: 38,
              margin: "10px 0",
              borderRadius: 14,
              border: OUTLINE,
              background: selectedGenres.includes(g.id)
                ? "linear-gradient(95deg,#3b36e8 20%,#fdaf41 90%)"
                : "transparent",
              color: "#fff",
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: 0.01,
              textAlign: "center",
              boxShadow: selectedGenres.includes(g.id)
                ? "0 2.5px 11px #fdaf4122"
                : "none",
              outline: "none",
              padding: "3.5px 0",
              transition: "all 0.15s",
              borderWidth: "1.2px"
            }}
            onClick={() => toggleGenre(g.id)}
          >
            <span style={{ fontWeight: 500 }}>
              {g.label.charAt(0).toUpperCase() + g.label.slice(1).toLowerCase()}
            </span>
          </button>
        ))}
      </div>
    );
  }

  // TMDb search logic (popularity sort, "see more" button)
  useEffect(() => {
    let active = true;
    if (!query) {
      setResults([]);
      setShowAllResults(false);
      return;
    }
    fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        let all = data.results || [];
        all = all.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        setResults(all);
        setShowAllResults(false);
      });
    return () => { active = false; };
  }, [query, TMDB_KEY]);

  function handleAddMovie(movie) {
    if (watchlist.some((m) => m.id === movie.id)) return;
    setWatchlist((old) => [...old, movie]);
    setQuery(""); // Clear search box after pick
    setResults([]);
    setShowAllResults(false);
  }
  function handleRemoveMovie(id) {
    setWatchlist((w) => w.filter((m) => m.id !== id));
  }

  // Save preferences/watched on Finish
  async function saveAndGo(skipGenres = false, skipMovies = false) {
    setError(""); setLoading(true);
    try {
      const user_id = session.user.id;

      // Save genres
      if (!skipGenres) {
        await supabase.from("user_preferences").delete().eq("user_id", user_id);
        if (selectedGenres.length) {
          await supabase.from("user_preferences").update(
            selectedGenres.map((genre_id) => ({ user_id, genre_id })),
            { onConflict: ["user_id", "genre_id"] }
          );
        }
      }

      // Save movies: update any missing into movies first, then update into watchlist
      if (!skipMovies) {
        for (const m of watchlist) {
          await supabase.from("movies").update(
            {
              tmdb_id: m.id,
              title: m.title,
              poster_path: m.poster_path,
              release_date: m.release_date,
            },
            { onConflict: ["tmdb_id"] }
          );
        }
        await supabase.from("user_watchlist").delete().eq("user_id", user_id).eq("status", "onboarding");
        if (watchlist.length) {
          await supabase.from("user_watchlist").update(
            watchlist.map((m) => ({
              user_id,
              movie_id: m.id,
              status: "onboarding",
            })),
            { onConflict: ["user_id", "movie_id"] }
          );
        }
      }

      await supabase.from("users").update({ onboarding_complete: true }).eq("id", user_id);
      await supabase.auth.updateUser({ data: { onboarding_complete: true } });

      navigate("/app", { replace: true });
    } catch (e) {
      setError("Could not save your preferences — please try again.");
      console.error("Onboarding save failed:", e);
    }
    setLoading(false);
  }

  // Card width
  const CARD_WIDTH = window.innerWidth < 700 ? "98vw" : "490px";
  const CARD_MARGIN = window.innerWidth < 700 ? "12px" : "0 auto";

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: `url(/background-poster.jpg) center/cover, #18141c`,
        fontFamily: "Inter, system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "stretch",
        position: "relative",
      }}
    >
      {/* Logo top left */}
      <div style={{ position: "absolute", left: 38, top: 34, zIndex: 11, display: "flex", alignItems: "center", gap: 12 }}>
        <img src="/logo.png" alt="FeelFlick" style={{ width: 48, height: 48, borderRadius: 14, boxShadow: "0 1.5px 8px #0002" }} />
        <span style={{ fontSize: 31, fontWeight: 900, color: "#fff", letterSpacing: "-1px", textShadow: "0 1px 7px #19194044" }}>
          FeelFlick
        </span>
      </div>
      <div
        style={{
          width: CARD_WIDTH,
          margin: CARD_MARGIN,
          minHeight: 390,
          marginTop: 70,
          marginBottom: 30,
          alignSelf: "center",
          background: "rgba(22,19,28,0.99)",
          borderRadius: 32,
          boxShadow: "0 8px 48px 0 #0008",
          padding: "28px 24px 23px 24px",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {error && (
          <div style={{
            color: "#f44336",
            background: "#3d1113",
            borderRadius: 7,
            textAlign: "center",
            marginBottom: 17,
            fontWeight: 700,
            fontSize: 17,
            padding: "9px 4px"
          }}>{error}</div>
        )}
        {/* Step 1: Genres */}
        {step === 1 && (
          <>
            <h2 style={{
              fontSize: 29,
              fontWeight: 900,
              color: "#fff",
              textAlign: "center",
              marginBottom: 5,
              letterSpacing: "-.01em"
            }}>
              What do you like to watch?
            </h2>
            <div style={{
              fontSize: 16,
              fontWeight: 400,
              color: "#e9e9ef",
              textAlign: "center",
              marginBottom: 2,
              marginTop: 2,
              letterSpacing: ".01em"
            }}>
              Pick a few genres that match your taste.
            </div>
            <div style={{
              fontSize: 14.5,
              fontWeight: 400,
              color: ACCENT,
              textAlign: "center",
              marginBottom: 13,
              marginTop: 1,
              fontFamily: "inherit",
              letterSpacing: ".01em"
            }}>
              This helps us give you recommendations that actually fit your mood!
            </div>
            {renderGenreButtons()}
            <div style={{ display: "flex", justifyContent: "center", marginTop: 23, gap: 40 }}>
              <button
                style={{
                  padding: "8px 28px",
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 16,
                  background: BTN_BG,
                  color: "#fff",
                  border: "none",
                  marginRight: 10,
                  cursor: "pointer",
                  boxShadow: "0 3px 17px #eb423b22",
                  opacity: loading ? 0.7 : 1,
                  minWidth: 86,
                  letterSpacing: 0.01,
                }}
                disabled={loading}
                onClick={() => setStep(2)}
              >
                NEXT
              </button>
              <button
                style={{
                  background: "none",
                  color: ACCENT,
                  fontWeight: 800,
                  fontSize: 16,
                  border: "none",
                  cursor: "pointer",
                  minWidth: 44
                }}
                disabled={loading}
                onClick={() => saveAndGo(true, false)}
              >
                SKIP
              </button>
            </div>
          </>
        )}
        {/* Step 2: Movies */}
        {step === 2 && (
          <>
            <h2 style={{
              fontSize: 25,
              fontWeight: 900,
              color: "#fff",
              textAlign: "center",
              marginBottom: 8,
              letterSpacing: "-.01em"
            }}>
              Any favourite movies?
            </h2>
            <div style={{
              fontSize: 14,
              color: "#fff",
              fontWeight: 400,
              textAlign: "center",
              marginBottom: 10,
              marginTop: 1,
              opacity: 0.84,
              letterSpacing: ".01em",
            }}>
              Type to search your favourites. <span style={{ color: ACCENT, fontWeight: 600 }}>Pick at least one for better suggestions.</span>
            </div>
            <input
              type="text"
              placeholder="Search a movie…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: "100%",
                background: "#232330",
                borderRadius: 10,
                padding: "9px 12px",
                fontSize: 16,
                fontWeight: 500,
                color: "#fff",
                outline: "none",
                border: "none",
                marginBottom: 7,
                marginTop: 2,
                letterSpacing: 0.01,
                boxShadow: "0 1.5px 8px 0 #0004"
              }}
            />
            {/* Suggestions */}
            {query && results.length > 0 && (
              <div
                style={{
                  background: "#242134",
                  borderRadius: 9,
                  maxHeight: 160,
                  overflowY: "auto",
                  marginBottom: 6,
                  boxShadow: "0 2px 14px #0004"
                }}
              >
                {(showAllResults ? results : results.slice(0, 3)).map((r, idx) => (
                  <div
                    key={r.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "8px 11px",
                      borderBottom: "1px solid #302c37",
                      cursor: "pointer",
                      gap: 11,
                      transition: "background 0.11s",
                    }}
                    onClick={() => handleAddMovie(r)}
                  >
                    <img
                      src={r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : "/posters/placeholder.png"}
                      alt={r.title}
                      style={{ width: 29, height: 41, objectFit: "cover", borderRadius: 6, background: "#101012" }}
                    />
                    <span style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>
                      {r.title} <span style={{ color: "#eee", fontWeight: 400, fontSize: 13, marginLeft: 6 }}>{r.release_date ? `(${r.release_date.slice(0, 4)})` : ""}</span>
                    </span>
                  </div>
                ))}
                {!showAllResults && results.length > 3 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "7px 0 6px",
                      color: ACCENT,
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                    onClick={() => setShowAllResults(true)}
                  >
                    See more
                  </div>
                )}
              </div>
            )}
            {/* Watchlist chips */}
            {watchlist.length > 0 && (
              <div>
                <div style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 15,
                  marginBottom: 2
                }}>
                  Your picks:
                </div>
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "7px 12px",
                  marginBottom: 12
                }}>
                  {watchlist.map(m => (
                    <div key={m.id} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#231d2d",
                      borderRadius: 10,
                      padding: "3px 11px 3px 4px"
                    }}>
                      <img src={m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : "/posters/placeholder.png"}
                        alt={m.title}
                        style={{ width: 24, height: 33, objectFit: "cover", borderRadius: 6, marginRight: 4, background: "#101012" }}
                      />
                      <span style={{ fontWeight: 700, fontSize: 13.5, color: "#fff" }}>{m.title}</span>
                      <button
                        style={{
                          background: "none",
                          border: "none",
                          color: "#fd7069",
                          fontSize: 19,
                          marginLeft: 1,
                          marginRight: 0,
                          cursor: "pointer",
                          fontWeight: 700,
                          opacity: 0.78
                        }}
                        onClick={() => handleRemoveMovie(m.id)}
                        tabIndex={-1}
                      >×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "center", marginTop: 10, gap: 30 }}>
              <button
                style={{
                  padding: "7px 22px",
                  borderRadius: 9,
                  fontWeight: 800,
                  fontSize: 14.5,
                  background: "none",
                  color: ACCENT,
                  border: "none",
                  marginRight: 7,
                  cursor: "pointer",
                  boxShadow: "none"
                }}
                disabled={loading}
                onClick={() => setStep(1)}
              >
                &lt; BACK
              </button>
              <button
                style={{
                  padding: "8px 24px",
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 15.5,
                  background: BTN_BG,
                  color: "#fff",
                  border: "none",
                  marginRight: 7,
                  cursor: "pointer",
                  boxShadow: "0 3px 17px #eb423b22",
                  opacity: loading ? 0.7 : 1,
                  minWidth: 74,
                }}
                disabled={loading}
                onClick={() => saveAndGo(false, false)}
              >
                FINISH
              </button>
              <button
                style={{
                  background: "none",
                  color: ACCENT,
                  fontWeight: 800,
                  fontSize: 14.5,
                  border: "none",
                  cursor: "pointer",
                  minWidth: 44
                }}
                disabled={loading}
                onClick={() => saveAndGo(false, true)}
              >
                SKIP
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
