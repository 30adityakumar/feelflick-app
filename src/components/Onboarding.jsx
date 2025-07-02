import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

/**
 * First‑time onboarding wizard (3 quick steps)
 *  1️⃣ pick favourite genres
 *  2️⃣ add a couple of movies to an initial watch‑list (optional)
 *  3️⃣ review → save → jump into the main app
 */
export default function Onboarding() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  /* ──────────────── wizard state ──────────────── */
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState([]);           // [id,…]
  const [query, setQuery] = useState("");                            // TMDB search box
  const [results, setResults] = useState([]);                         // search results
  const [watchlist, setWatchlist] = useState([]);                     // [{id,title,poster_path}, …]
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

  /* ──────────────── auth check ──────────────── */
  useEffect(() => {
    const { data: { session } } = supabase.auth.getSession();
    setSession(session);
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;                   // wait for auth
    // if onboarding already done, send them to main app
    if (session.user?.user_metadata?.onboarding_complete) {
      navigate("/app", { replace: true });
    }
  }, [session, navigate]);

  /* ──────────────── genre helpers ──────────────── */
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
  const toggleGenre = (id) => {
    setSelectedGenres((g)=>g.includes(id)?g.filter(x=>x!==id):[...g,id]);
  };

  /* ──────────────── TMDb search ──────────────── */
  useEffect(() => {
    if (!query) { setResults([]); return; }
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`, {signal:ctrl.signal});
        const json = await res.json();
        setResults(json.results?.slice(0,7) || []);
      } catch(_){}
    })();
    return () => ctrl.abort();
  }, [query, TMDB_KEY]);

  const addToWatchlist = (movie) => {
    if (watchlist.some(m=>m.id===movie.id)) return;
    setWatchlist([...watchlist, movie]);
  };
  const removeFromWatchlist = (id) => setWatchlist(watchlist.filter(m=>m.id!==id));

  /* ──────────────── finish & save ──────────────── */
  const finishOnboarding = async () => {
    if (!session) return;
    await supabase.auth.updateUser({
      data: {
        onboarding_complete: true,
        favourite_genres: selectedGenres,
        initial_watchlist: watchlist.map(m=>m.id)
      }
    });
    navigate("/app", { replace: true });
  };

  /* ──────────────── UI ──────────────── */
  if (!session) return null; // show nothing while auth resolving

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 px-4 py-10 text-white">
      <div className="w-full max-w-2xl bg-[#18141c] rounded-2xl shadow-2xl p-8">
        {step===1 && (
          <>
            <h2 className="text-2xl font-extrabold mb-4 text-center">Pick a few favourite genres</h2>
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              {GENRES.map(g=>
                <button key={g.id} className={`px-4 py-2 rounded-full text-sm font-semibold transition ${selectedGenres.includes(g.id)?'bg-gradient-to-r from-orange-400 to-rose-500':'bg-zinc-800 hover:bg-zinc-700'}`} onClick={()=>toggleGenre(g.id)}>
                  {g.label}
                </button>)}
            </div>
            <div className="flex justify-between">
              <span></span>
              <button disabled={selectedGenres.length===0} className="px-6 py-2 rounded-lg font-bold bg-gradient-to-r from-orange-400 to-rose-500 disabled:opacity-40" onClick={()=>setStep(2)}>Next ›</button>
            </div>
          </>) }

        {step===2 && (
          <>
            <h2 className="text-2xl font-extrabold mb-4 text-center">Add 1‑3 movies you love</h2>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search a movie…" className="w-full bg-zinc-800 rounded-lg px-4 py-2 outline-none mb-4" />
            <div className="max-h-40 overflow-y-auto mb-4 space-y-1">
              {results.map(r=>
                <div key={r.id} className="flex items-center gap-3 hover:bg-zinc-800 p-2 rounded-lg cursor-pointer" onClick={()=>addToWatchlist(r)}>
                  <img src={r.poster_path?`https://image.tmdb.org/t/p/w92${r.poster_path}`:'/posters/placeholder.png'} alt={r.title} className="w-10 h-14 object-cover rounded" />
                  <span>{r.title} <span className="text-xs text-zinc-400">({r.release_date?.slice(0,4)})</span></span>
                </div>)}
            </div>
            {watchlist.length>0 && (
              <><div className="text-sm font-semibold mb-2">Your list:</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {watchlist.map(m=>
                  <div key={m.id} className="flex items-center gap-1 bg-zinc-800 px-3 py-1 rounded-full text-sm">
                    {m.title}
                    <button onClick={()=>removeFromWatchlist(m.id)} className="text-zinc-400 hover:text-rose-400">×</button>
                  </div>)}
              </div></>) }

            <div className="flex justify-between">
              <button className="px-6 py-2 rounded-lg font-bold bg-zinc-700 hover:bg-zinc-600" onClick={()=>setStep(1)}>‹ Back</button>
              <button className="px-6 py-2 rounded-lg font-bold bg-gradient-to-r from-orange-400 to-rose-500" onClick={()=>setStep(3)}>Next ›</button>
            </div>
          </>) }

        {step===3 && (
          <>
            <h2 className="text-2xl font-extrabold mb-4 text-center">Ready to roll! 🎬</h2>
            <p className="text-center mb-6">We’ll start you off with personalised picks based on <span className="font-semibold text-orange-400">{selectedGenres.length}</span> genres and <span className="font-semibold text-orange-400">{watchlist.length}</span> favourite movies.</p>
            <button className="w-full py-3 rounded-lg font-bold text-lg bg-gradient-to-r from-orange-400 to-rose-500" onClick={finishOnboarding}>Take me to FeelFlick</button>
          </>) }
      </div>
    </div>
  );
}
