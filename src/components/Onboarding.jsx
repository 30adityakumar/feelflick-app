import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

/* ───────────────────────────────────────────────────────
   🎨  Simple theme helpers
   ─────────────────────────────────────────────────────── */
const THEME = {
  gradient: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
  cardBg: "rgba(32,26,34,0.95)",
  text:    "#fff",
  highlight:"#fe9245"
};

/* ───────────────────────────────────────────────────────
   ✨  Onboarding
   ─────────────────────────────────────────────────────── */
export default function Onboarding({ session }) {
  const navigate            = useNavigate();
  const TMDB_KEY            = import.meta.env.VITE_TMDB_API_KEY;
  const searchInput         = useRef();

  /* page-level state */
  const [step, setStep]         = useState(1);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [query,setQuery]        = useState("");
  const [results,setResults]    = useState([]);
  const [watchlist,setWatch]    = useState([]);
  const [saving,setSaving]      = useState(false);
  const [error,setError]        = useState("");

  /* 🚪 redirect if already onboarded */
  useEffect(() => {
    if (session?.user?.user_metadata?.onboarding_complete) {
      navigate("/app",{replace:true});
    }
  },[session,navigate]);

  /* 🎬  TMDB search */
  useEffect(() => {
    if (!query) { setResults([]); return; }
    const ctrl=new AbortController();
    (async () => {
      try {
        const r = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`,
          {signal:ctrl.signal}
        );
        const j = await r.json();
        setResults(j.results?.slice(0,7) ?? []);
      } catch { /* ignore */ }
    })();
    return () => ctrl.abort();
  },[query,TMDB_KEY]);

  /* 🎭  genre helpers */
  const GENRES = useMemo(()=>[
    {id:28,label:"Action"},{id:12,label:"Adventure"},{id:16,label:"Animation"},
    {id:35,label:"Comedy"},{id:80,label:"Crime"},{id:99,label:"Documentary"},
    {id:18,label:"Drama"},{id:10751,label:"Family"},{id:14,label:"Fantasy"},
    {id:36,label:"History"},{id:27,label:"Horror"},{id:10402,label:"Music"},
    {id:9648,label:"Mystery"},{id:10749,label:"Romance"},{id:878,label:"Sci-Fi"},
    {id:53,label:"Thriller"}
  ],[]);
  const toggleGenre   = id => setSelectedGenres(g=>g.includes(id)?g.filter(x=>x!==id):[...g,id]);
  const selectAll     = () => setSelectedGenres(GENRES.map(g=>g.id));
  const clearGenres   = () => setSelectedGenres([]);

  /* 🛠  watch-list helpers */
  const addMovie    = m => { if(!watchlist.some(x=>x.id===m.id)){ setWatch([...watchlist,m]); setQuery(""); searchInput.current?.focus();}};
  const removeMovie = id => setWatch(watchlist.filter(m=>m.id!==id));

  /* 💾  final save */
  async function finishOnboarding(skipMovies=false){
    if(!session?.user) return;
    setSaving(true); setError("");
    const { id:user_id, email, user_metadata } = session.user;

    try{
      /* ensure row exists in public.users */
      await supabase
        .from("users")
        .upsert(
          [{ id:user_id, email, name:user_metadata?.name ?? null }],
          { onConflict:"id" }
        )
        .throwOnError();

      /* USER PREFERENCES -------------------------------------------------- */
      await supabase.from("user_preferences")
        .delete()
        .eq("user_id",user_id)
        .throwOnError();

      if(selectedGenres.length){
        await supabase.from("user_preferences")
          .upsert(
            selectedGenres.map(genre_id=>({user_id,genre_id})),
            { onConflict:"user_id,genre_id" }
          )
          .throwOnError();
      }

      /* USER WATCHLIST (onboarding status) -------------------------------- */
      await supabase.from("user_watchlist")
        .delete()
        .eq("user_id",user_id)
        .eq("status","onboarding")
        .throwOnError();

      if(!skipMovies && watchlist.length){
        await supabase.from("user_watchlist")
          .upsert(
            watchlist.map(m=>({user_id,movie_id:m.id,status:"onboarding"})),
            { onConflict:"user_id,movie_id" }
          )
          .throwOnError();
      }

      /* mark onboarding complete everywhere */
      await supabase.from("users")
        .update({onboarding_complete:true})
        .eq("id",user_id)
        .throwOnError();

      await supabase.auth.updateUser({data:{onboarding_complete:true}});

      navigate("/app",{replace:true});
    }catch(e){
      console.error("Onboarding save failed:",e);
      setError("Could not save your preferences — please try again.");
    }finally{
      setSaving(false);
    }
  }

  /* ───────────────────────────────────────────────────────
     🖼  UI
     ─────────────────────────────────────────────────────── */
  return (
    <div style={{minHeight:"100vh",background:"#101015",display:"flex",alignItems:"center",justifyContent:"center",padding:18}}>
      <div style={{background:THEME.cardBg,color:THEME.text,borderRadius:18,boxShadow:"0 10px 40px #000b",padding:"40px 24px",width:"100%",maxWidth:480,position:"relative"}}>
        {error && <p style={{background:"#2d141c",color:"#ff4b6b",padding:10,borderRadius:7,textAlign:"center",fontWeight:700}}>{error}</p>}

        {/* STEP 1 – genres */}
        {step===1 && (
          <>
            <h2 style={{textAlign:"center",fontWeight:900,fontSize:"1.5rem"}}>Pick your favourite genres</h2>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",margin:"18px 0"}}>
              {GENRES.map(g=>(
                <button key={g.id} onClick={()=>toggleGenre(g.id)}
                  style={{
                    padding:"8px 16px",fontWeight:700,borderRadius:30,border:"none",
                    background:selectedGenres.includes(g.id)?THEME.gradient:"#282539",
                    color:"#fff",cursor:"pointer"}}
                >{g.label}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(2)} disabled={!selectedGenres.length}
                style={{flex:1,padding:12,fontWeight:800,border:"none",borderRadius:8,
                        background:THEME.gradient,opacity:selectedGenres.length?1:0.4,cursor:selectedGenres.length?"pointer":"not-allowed"}}>
                Next
              </button>
              <button onClick={()=>finishOnboarding(true)}
                style={{padding:12  ,fontWeight:700,border:"none",borderRadius:8,background:"#353148",color:"#ffe3b3"}}>
                Skip
              </button>
            </div>
          </>
        )}

        {/* STEP 2 – movies */}
        {step===2 && (
          <>
            <h2 style={{textAlign:"center",fontWeight:900,fontSize:"1.3rem"}}>Add a couple of movies you love</h2>
            <input ref={searchInput} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search…" autoFocus
              style={{width:"100%",padding:12,borderRadius:8,border:"none",background:"#232330",color:"#fff",margin:"14px 0"}}/>
            <div style={{maxHeight:170,overflow:"auto"}}>
              {results.map(r=>(
                <div key={r.id} onClick={()=>addMovie(r)} style={{display:"flex",alignItems:"center",gap:8,padding:6,cursor:"pointer"}}>
                  <img src={r.poster_path?`https://image.tmdb.org/t/p/w92${r.poster_path}`:'/posters/placeholder.png'}
                       alt={r.title} style={{width:36,height:52,objectFit:"cover",borderRadius:6}}/>
                  <span>{r.title} {r.release_date && <small style={{opacity:.6}}>({r.release_date.slice(0,4)})</small>}</span>
                </div>
              ))}
            </div>
            {watchlist.length>0 && (
              <div style={{margin:"10px 0",display:"flex",flexWrap:"wrap",gap:6}}>
                {watchlist.map(m=>(
                  <div key={m.id} style={{background:"#232330",padding:"4px 10px",borderRadius:20,display:"flex",alignItems:"center",gap:6}}>
                    <span>{m.title}</span>
                    <button onClick={()=>removeMovie(m.id)} style={{background:"none",border:"none",color:"#ffbbaa",cursor:"pointer"}}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(1)}
                style={{flex:1,padding:12,fontWeight:700,border:"none",borderRadius:8,background:"#353148",color:"#fff"}}>‹ Back</button>
              <button onClick={()=>finishOnboarding(false)} disabled={saving}
                style={{flex:1,padding:12,fontWeight:800,border:"none",borderRadius:8,
                        background:THEME.gradient,cursor:"pointer"}}>
                Finish
              </button>
              <button onClick={()=>finishOnboarding(true)} style={{padding:12,fontWeight:700,border:"none",borderRadius:8,background:"#353148",color:"#ffe3b3"}}>
                Skip
              </button>
            </div>
          </>
        )}

        {saving && <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:18}}>Saving…</div>}
      </div>
    </div>
  );
}
