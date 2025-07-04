//  src/pages/Onboarding.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate }            from "react-router-dom";
import { supabase }               from "../supabaseClient";

/* ----- design tokens (unchanged) ----- */
const ACCENT  = "#fe9245";
const ACCENT2 = "#eb423b";
const OUTLINE = "1.1px solid #fe9245";
const BTN_BG  = "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)";
const GENRE_SELECTED_BG = "linear-gradient(90deg,#367cff 0%,#fdaf41 90%)";
const DARK_BG = "rgba(22,19,28,0.99)";

export default function Onboarding() {
  /* ───── state ───── */
  const navigate = useNavigate();
  const [session,   setSession]   = useState(null);
  const [checking,  setChecking]  = useState(true);   // gate while we decide
  const [step,      setStep]      = useState(1);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState([]);
  const [showAllResults, setShowAllResults] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

  /* ───── 1. get auth session ───── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } =
      supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener?.subscription?.unsubscribe();
  }, []);

  /* ───── 2. once session exists, read onboarding flag ───── */
  useEffect(() => {
    if (!session || !session.user) return;

    supabase
      .from("users")
      .select("onboarding_complete")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("SELECT users failed →", error.message);
          setError("Could not load your profile — please reload.");
          setChecking(false);
          return;
        }

        if (data?.onboarding_complete ||
            session.user.user_metadata?.onboarding_complete) {
          navigate("/app", { replace: true });
        } else {
          setChecking(false);                // 💡 show onboarding UI
        }
      });
  }, [session, navigate]);

  /* ───── 3. loader gate ───── */
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

  /* ───── 4. genres config (unchanged) ───── */
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

  /* ───── 5. TMDb search (unchanged) ───── */
  useEffect(() => {
    let active = true;
    if (!query) { setResults([]); setShowAllResults(false); return; }

    fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(data => {
        if (!active) return;
        const all = (data.results || []).sort((a,b)=>(b.popularity||0)-(a.popularity||0));
        setResults(all); setShowAllResults(false);
      });

    return () => { active = false; };
  }, [query, TMDB_KEY]);

  /* ───── helpers (unchanged) ───── */
  const toggleGenre = id =>
    setSelectedGenres(g => g.includes(id) ? g.filter(x=>x!==id) : [...g,id]);

  const handleAddMovie = m => {
    if (!watchlist.some(x=>x.id===m.id))
      setWatchlist(w => [...w, m]);
    setQuery(""); setResults([]); setShowAllResults(false);
  };

  const handleRemoveMovie = id =>
    setWatchlist(w => w.filter(m => m.id !== id));

  /* ───── 6. Finish / Skip (unchanged logic) ───── */
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

  /* ───── 7. UI (unchanged) ───── */
  const CARD_WIDTH  = window.innerWidth < 700 ? "97vw" : "460px";
  const CARD_MARGIN = window.innerWidth < 700 ? "11px"  : "0 auto";
  const genreFontSize  = 13.5;
  const genreBtnHeight = 34;

  return (
    <div style={{
      minHeight:"100vh",width:"100vw",
      background:`url(/background-poster.jpg) center/cover, #18141c`,
      fontFamily:"Inter, system-ui, sans-serif",
      display:"flex",flexDirection:"column"
    }}>
      {/* … EVERYTHING in your UI block is identical to the file you uploaded  … */}
      {/* (omitted here for brevity — paste your existing JSX below) */}
    </div>
  );
}
