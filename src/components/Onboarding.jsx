import { useEffect, useState, useMemo } from "react";
import { useNavigate }                  from "react-router-dom";
import { supabase }                     from "../supabaseClient";

const ACCENT  = "#fe9245";
const ACCENT2 = "#eb423b";
const OUTLINE = "1.1px solid #fe9245";
const BTN_BG  = "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)";
const GENRE_SELECTED_BG = "linear-gradient(88deg, var(--theme-color,#FF5B2E), var(--theme-color-secondary,#367cff) 80%)";
const DARK_BG = "rgba(22,19,28,0.9)";

export default function Onboarding() {
  const navigate = useNavigate();
  const [session, setSession]   = useState(null);
  const [checking, setChecking] = useState(true);
  const [step, setStep]         = useState(1);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState([]);
  const [showAllResults, setShowAllResults] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

  // 1. Auth/session logic (no change)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } =
      supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener?.subscription?.unsubscribe();
  }, []);

  // 2. Onboarding status check (no client-side upsert needed)
  useEffect(() => {
    if (!session || !session.user) return;

    supabase
      .from("users")
      .select("onboarding_complete")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("SELECT users failed:", error.message);
          setError("Could not load profile — reload.");
          setChecking(false);
          return;
        }
        if (data?.onboarding_complete ||
            session.user.user_metadata?.onboarding_complete) {
          navigate("/app", { replace:true });
        } else {
          setChecking(false); // show onboarding UI
        }
      });
  }, [session, navigate]);

  // 3. Genre list (hook always runs)
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

  // 4. TMDb search (same)
  useEffect(() => {
    let active = true;
    if (!query) { setResults([]); setShowAllResults(false); return; }

    fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(data => {
        if (!active) return;
        const all = (data.results || []).sort(
          (a, b) =>
            (b.popularity || 0) - (a.popularity || 0) ||
            (b.vote_average || 0) - (a.vote_average || 0)
        );
        setResults(all); setShowAllResults(false);
      });

    return () => { active = false; };
  }, [query, TMDB_KEY]);

  // 5. UI helpers (no change)
  const toggleGenre      = id => setSelectedGenres(g => g.includes(id) ? g.filter(x=>x!==id) : [...g,id]);
  const handleAddMovie   = m  => { if (!watchlist.some(x=>x.id===m.id)) setWatchlist(w=>[...w,m]); setQuery(""); setResults([]); setShowAllResults(false); };
  const handleRemoveMovie= id => setWatchlist(w => w.filter(m => m.id !== id));

  // 6. Save and finish onboarding (no change)
  async function saveAndGo(skipGenres=false, skipMovies=false) {
    setError(""); setLoading(true);
    try {
      const user_id = session.user.id;
      const email   = session.user.email;
      const name    = session.user.user_metadata?.name || "";

      await supabase.from("users").upsert(
        [{ id:user_id, email, name }],
        { onConflict:["id"] }
      );

      if (!skipGenres) {
        await supabase.from("user_preferences")
                      .delete().eq("user_id", user_id);
        if (selectedGenres.length) {
          await supabase.from("user_preferences").upsert(
            selectedGenres.map(genre_id => ({ user_id, genre_id })),
            { onConflict:["user_id","genre_id"] }
          );
        }
      }

      if (!skipMovies) {
        for (const m of watchlist) {
          await supabase.from("movies").upsert(
            { tmdb_id:m.id,title:m.title,poster_path:m.poster_path,
              release_date:m.release_date },
            { onConflict:["tmdb_id"] }
          );
        }
        await supabase.from("user_watchlist")
                      .delete()
                      .eq("user_id", user_id)
                      .eq("status","onboarding");

        if (watchlist.length) {
          await supabase.from("user_watchlist").upsert(
            watchlist.map(m => ({
              user_id, movie_id:m.id, status:"onboarding"
            })),
            { onConflict:["user_id","movie_id"] }
          );
        }
      }

      await supabase.from("users")
                    .update({ onboarding_complete:true })
                    .eq("id", user_id);
      await supabase.auth.updateUser({
        data:{ onboarding_complete:true }
      });

      navigate("/app", { replace:true });
    } catch (e) {
      console.error("Onboarding save failed:", e);
      setError("Could not save your preferences — please try again.");
    }
    setLoading(false);
  }

  // 7. Loader (always runs after hooks)
  if (checking) {
    return (
      <div style={{
        minHeight:"100vh",display:"flex",alignItems:"center",
        justifyContent:"center",background:"#000",color:"#fff",
        fontWeight:700,fontSize:18,letterSpacing:"0.02em"
      }}>
        Loading&nbsp;profile…
      </div>
    );
  }

  // 8. UI (all your original code below, unchanged)
  const CARD_WIDTH  = window.innerWidth < 700 ? "100vw" : "7--px";
  const CARD_MARGIN = window.innerWidth < 700 ? "11px"  : "0 auto";
  const genreFontSize  = 12;
  const genreBtnHeight = 34;

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
      <div style={{ position: "absolute", left: 32, top: 23, zIndex: 11, display: "flex", alignItems: "center", gap: 10 }}>
        <img src="/logo.png" alt="FeelFlick" style={{ width: 42, height: 42, borderRadius: 12, boxShadow: "0 1.5px 8px #0002" }} />
        <span style={{ fontSize: 23, fontWeight: 900, color: "#fff", letterSpacing: "-1px", textShadow: "0 1px 7px #19194044" }}>
          FeelFlick
        </span>
      </div>
      <div
        style={{
          width: CARD_WIDTH,
          margin: CARD_MARGIN,
          minHeight: 500,
          marginTop: 72,
          marginBottom: 16,
          alignSelf: "center",
          background: DARK_BG,
          borderRadius: 22,
          boxShadow: "0 8px 44px 0 #0007",
          padding: "36px 30px 27px 30px",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {error && (
          <div style={{
            color: "#f44336",
            background: "#3d1113",
            borderRadius: 6,
            textAlign: "center",
            marginBottom: 12,
            fontWeight: 600,
            fontSize: 14.5,
            padding: "7px 4px"
          }}>{error}</div>
        )}
        {/* Step 1: Genres */}
        {step === 1 && (
          <>
            <h2 style={{
              fontSize: 25,
              fontWeight: 900,
              color: "#fff",
              textAlign: "center",
              marginBottom: 4,
              letterSpacing: ".01em"
            }}>
              Let’s get to know your taste.
            </h2>
            <div style={{
              fontSize: 13,
              fontWeight: 400,
              color: "#e9e9ef",
              textAlign: "center",
              marginBottom: 8,
              marginTop: 4,
              letterSpacing: ".01em"
            }}>
              Pick a few genres you love — it helps us recommend movies that truly match your energy.
            </div>

            {/* Genre Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "8px 7px",
                justifyItems: "center",
                alignItems: "center",
                margin: "0 auto 12px auto",
                width: "100%",
              }}
            >
              {GENRES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  style={{
                    width: 120,
                    height: genreBtnHeight,
                    margin: "3px 0",
                    borderRadius: 12,
                    border: OUTLINE,
                    background: selectedGenres.includes(g.id)
                      ? GENRE_SELECTED_BG
                      : "transparent",
                    color: "#fff",
                    fontSize: genreFontSize,
                    fontWeight: 500,
                    letterSpacing: 0.01,
                    textAlign: "center",
                    boxShadow: selectedGenres.includes(g.id)
                      ? "0 2px 7px #fdaf4111"
                      : "none",
                    outline: "none",
                    padding: "3.5px 0",
                    transition: "all 0.15s",
                    borderWidth: "1px"
                  }}
                  onClick={() => toggleGenre(g.id)}
                >
                  <span style={{
                    fontWeight: 500,
                    textAlign: "center",
                    lineHeight: "1.17",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {g.label}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 16, gap: 23 }}>
              <button
                style={{
                  padding: "7px 21px",
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: 15,
                  background: BTN_BG,
                  color: "#fff",
                  border: "none",
                  marginRight: 8,
                  cursor: "pointer",
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
                style={{
                  background: "none",
                  color: ACCENT,
                  fontWeight: 800,
                  fontSize: 13.5,
                  border: "none",
                  cursor: "pointer",
                  minWidth: 44
                }}
                disabled={loading}
                onClick={() => saveAndGo(true, false)}
              >
                Skip
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
              marginBottom: 4,
              letterSpacing: ".01em"
            }}>
              Got some favorite movies?
            </h2>
            <div style={{
              fontSize: 13,
              color: "#fff",
              fontWeight: 400,
              textAlign: "center",
              marginBottom: 8,
              marginTop: 4,
              opacity: 0.84,
              letterSpacing: ".01em",
              fontFamily: "inherit"
            }}>
              Pick a few to help us understand your taste and give you more personalized suggestions.
            </div>
            <input
              type="text"
              placeholder="Search a movie…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: "100%",
                background: "#232330",
                borderRadius: 8,
                padding: "12px 14px",
                fontSize: 15,
                fontWeight: 500,
                color: "#fff",
                outline: "none",
                border: "none",
                marginBottom: 8,
                marginTop: 0,
                letterSpacing: 0.01,
                boxShadow: "0 1px 5px 0 #0004"
              }}
            />
            {/* Suggestions */}
            {query && results.length > 0 && (
              <div
                style={{
                  background: "#242134",
                  borderRadius: 20,
                  maxHeight: 200,
                  overflowY: "auto",
                  marginBottom: 6,
                  boxShadow: "0 1px 8px #0004"
                }}
              >
                {(showAllResults ? results : results.slice(0, 3)).map((r, idx) => (
                  <div
                    key={r.id}
                    style={{
                      display: "flex", 
                      alignItems: "center",
                      padding: "7px 11px",
                      borderBottom: "1px solid #302c37",
                      cursor: "pointer",
                      gap: 6,
                      transition: "background 0.11s",
                    }}
                    onClick={() => handleAddMovie(r)}
                  >
                    <img
                      src={r.poster_path ? `https://image.tmdb.org/t/p/w185${r.poster_path}` : "https://dummyimage.com/80x120/232330/fff&text=No+Image"}
                      alt={r.title}
                      style={{ width: 27, height: 40, objectFit: "cover", borderRadius: 5, marginRight: 2, marginBottom: 1, background: "#101012" }}
                    />
                    {/* Multi-line movie title */}
                    <span style={{ color: "#fff", fontWeight: 600, fontSize: 13, display: "flex", flexDirection: "column" }}>
                      {/* Split r.title into lines of 7 words each */}
                      {r.title
                        .split(" ")
                        .reduce((lines, word, i) => {
                          if (i % 7 === 0) lines.push([]);
                          lines[lines.length - 1].push(word);
                          return lines;
                        }, [])
                        .map((words, i) => (
                          <span key={i} style={{ display: "block" }}>
                            {words.join(" ")}
                            {/* On the last line, also show year if available */}
                            {i === 0 && (
                              <span style={{ color: "#eee", fontWeight: 400, fontSize: 14, marginLeft: 7 }}>
                                {r.release_date ? `(${r.release_date.slice(0, 4)})` : ""}
                              </span>
                            )}
                          </span>
                        ))}
                    </span>
                  </div>
                ))}
                {!showAllResults && results.length > 3 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "5px 0 4px",
                      color: ACCENT,
                      fontWeight: 600,
                      fontSize: 14,
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
                  fontSize: 14,
                  marginTop: 10,
                  marginBottom: 6
                }}>
                  Your picks:
                </div>
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px 12px",
                  marginBottom: 10
                }}>
                  {watchlist.map(m => (
                    <div key={m.id} style={{
                      display: "flex", flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      background: "#231d2d",
                      borderRadius: 7,
                      padding: "2px 2px 2px 2px"
                    }}>
                      <img src={m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : "https://dummyimage.com/80x120/232330/fff&text=No+Image"}
                        alt={m.title}
                        style={{ width: 67.5, height: 100, objectFit: "cover", borderRadius: 2, marginRight: 2, background: "#101012" }}
                      />
                      {/* Title split into lines of 7 words */}
                      <span style={{ display: "flex", flexDirection: "column", alignItems: "center", fontWeight: 600, fontSize: 15, color: "#fff", marginTop: 5 }}>
                        {m.title
                          .split(" ")
                          .reduce((lines, word, i) => {
                            if (i % 7 === 0) lines.push([]);
                            lines[lines.length - 1].push(word);
                            return lines;
                          }, [])
                          .map((words, i) => (
                            <span key={i} style={{ display: "block" }}>
                              {words.join(" ")}
                            </span>
                          ))}
                      </span>
                      <button
                        style={{
                          background: "none",
                          border: "none",
                          color: "#fd7069",
                          fontSize: 20,
                          marginTop: 0,
                          marginLeft: 0,
                          marginRight: 0,
                          marginBottom: 0,
                          cursor: "pointer",
                          fontWeight: 600,
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
            <div style={{ display: "flex", justifyContent: "center", marginTop: 8, gap: 17 }}>
              <button
                style={{
                  padding: "5px 14px",
                  borderRadius: 7,
                  fontWeight: 800,
                  fontSize: 12,
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
                &lt; Back
              </button>
              <button
                style={{
                  padding: "7px 21px",
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 15,
                  background: BTN_BG,
                  color: "#fff",
                  border: "none",
                  marginRight: 7,
                  cursor: "pointer",
                  boxShadow: "0 2px 10px #eb423b22",
                  opacity: loading ? 0.7 : 1,
                  minWidth: 65,
                }}
                disabled={loading}
                onClick={() => saveAndGo(false, false)}
              >
                Finish
              </button>
              <button
                style={{
                  background: "none",
                  color: ACCENT,
                  fontWeight: 800,
                  fontSize: 12,
                  border: "none",
                  cursor: "pointer",
                  minWidth: 44
                }}
                disabled={loading}
                onClick={() => saveAndGo(false, true)}
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
