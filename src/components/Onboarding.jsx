import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

/* ─── simple theme vars ─────────────────────────────── */
const THEME = {
  gradient : "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
  cardBg   : "rgba(32,26,34,0.95)",
  highlight: "#fe9245",
  text     : "#fff"
};

/* ─── Onboarding component ──────────────────────────── */
export default function Onboarding({ session }) {
  const navigate       = useNavigate();
  const TMDB_KEY       = import.meta.env.VITE_TMDB_API_KEY;
  const searchInputRef = useRef();

  /* ui state */
  const [step,setStep]         = useState(1);
  const [selectedGenres,setG]  = useState([]);
  const [query,setQuery]       = useState("");
  const [results,setResults]   = useState([]);
  const [watchlist,setWatch]   = useState([]);
  const [saving,setSaving]     = useState(false);
  const [error,setError]       = useState("");

  /** redirect if already done */
  useEffect(()=>{
    if(session?.user?.user_metadata?.onboarding_complete){
      navigate("/app",{replace:true});
    }
  },[session,navigate]);

  /** TMDb search */
  useEffect(()=>{
    if(!query){ setResults([]); return; }
    const ctrl=new AbortController();
    (async ()=>{
      try{
        const r = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`,{signal:ctrl.signal});
        const j = await r.json();
        setResults(j.results?.slice(0,7)??[]);
      }catch{/* ignore */}
    })();
    return ()=>ctrl.abort();
  },[query,TMDB_KEY]);

  /** genre helpers */
  const GENRES = useMemo(()=>[
    {id:28,label:"Action"},{id:12,label:"Adventure"},{id:16,label:"Animation"},
    {id:35,label:"Comedy"},{id:80,label:"Crime"},{id:99,label:"Documentary"},
    {id:18,label:"Drama"},{id:10751,label:"Family"},{id:14,label:"Fantasy"},
    {id:36,label:"History"},{id:27,label:"Horror"},{id:10402,label:"Music"},
    {id:9648,label:"Mystery"},{id:10749,label:"Romance"},{id:878,label:"Sci-Fi"},
    {id:53,label:"Thriller"}
  ],[]);
  const toggle = id=>setG(g=>g.includes(id)?g.filter(x=>x!==id):[...g,id]);

  /** watch-list helpers */
  const addMovie = m => { if(!watchlist.some(x=>x.id===m.id)){ setWatch([...watchlist,m]); setQuery(""); searchInputRef.current?.focus();}};
  const rmMovie  = id=>setWatch(watchlist.filter(m=>m.id!==id));

  /* ──────────────────────────────────────────────────
     🆕  Ensure movies exist in public.movies
     ────────────────────────────────────────────────── */
  async function ensureMoviesExist(movieArr){
    const ids = movieArr.map(m=>m.id);
    const { data:existing } = await supabase.from("movies").select("id").in("id",ids);
    const existingIds = new Set(existing?.map(x=>x.id));
    const missing     = movieArr.filter(m=>!existingIds.has(m.id));

    if(!missing.length) return;

    // fetch full details for missing titles (minimum columns is fine)
    const details = await Promise.all(
      missing.map(async m=>{
        const res = await fetch(`https://api.themoviedb.org/3/movie/${m.id}?api_key=${TMDB_KEY}`);
        const j   = await res.json();
        return {
          id   : j.id,
          title: j.title,
          poster_path : j.poster_path,
          release_date: j.release_date
        };
      })
    );

    // upsert into movies table
    await supabase.from("movies")
      .upsert(details,{ onConflict:"id" })
      .throwOnError();
  }

  /* ──────────────────────────────────────────────────
     💾  Finish onboarding
     ────────────────────────────────────────────────── */
  async function finish(skipMovies=false){
    if(!session?.user) return;
    setSaving(true); setError("");
    const { id:user_id, email, user_metadata } = session.user;

    try{
      /* 1️⃣ guarantee row in public.users */
      await supabase.from("users")
        .upsert([{ id:user_id, email, name:user_metadata?.name ?? null }],{onConflict:"id"})
        .throwOnError();

      /* 2️⃣ pref table */
      await supabase.from("user_preferences").delete().eq("user_id",user_id).throwOnError();
      if(selectedGenres.length){
        await supabase.from("user_preferences")
          .upsert(selectedGenres.map(genre_id=>({user_id,genre_id})),{onConflict:"user_id,genre_id"})
          .throwOnError();
      }

      /* 3️⃣ watch-list */
      await supabase.from("user_watchlist")
        .delete()
        .eq("user_id",user_id)
        .eq("status","onboarding")
        .throwOnError();

      if(!skipMovies && watchlist.length){
        /* 🆕 make sure referenced movies exist */
        await ensureMoviesExist(watchlist);

        await supabase.from("user_watchlist")
          .upsert(
            watchlist.map(m=>({user_id,movie_id:m.id,status:"onboarding"})),
            {onConflict:"user_id,movie_id"}
          )
          .throwOnError();
      }

      /* 4️⃣ mark complete */
      await supabase.from("users").update({onboarding_complete:true}).eq("id",user_id).throwOnError();
      await supabase.auth.updateUser({data:{onboarding_complete:true}});

      navigate("/app",{replace:true});
    }catch(e){
      console.error("Onboarding save failed:",e);
      setError("Could not save your preferences — please try again.");
    }finally{
      setSaving(false);
    }
  }

  /* ─────────────────────────────────────────────── UI */
  return (
    <div style={{minHeight:"100vh",background:"#101015",display:"flex",alignItems:"center",justifyContent:"center",padding:18}}>
      <div style={{background:THEME.cardBg,color:THEME.text,borderRadius:18,boxShadow:"0 10px 40px #000b",padding:"40px 24px",maxWidth:480,width:"100%",position:"relative"}}>
        {error && <p style={{background:"#2d141c",color:"#ff527f",padding:10,borderRadius:8,textAlign:"center",fontWeight:700}}>{error}</p>}

        {/* STEP 1 */}
        {step===1 && (
          <>
            <h2 style={{textAlign:"center",fontWeight:900,fontSize:"1.45rem"}}>Pick your favourite genres</h2>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",margin:"18px 0"}}>
              {GENRES.map(g=>(
                <button key={g.id} onClick={()=>toggle(g.id)}
                  style={{padding:"8px 16px",borderRadius:30,border:"none",fontWeight:700,color:"#fff",
                          background:selectedGenres.includes(g.id)?THEME.gradient:"#282539",cursor:"pointer"}}>
                  {g.label}
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(2)} disabled={!selectedGenres.length}
                style={{flex:1,padding:12,border:"none",borderRadius:8,fontWeight:800,
                        background:THEME.gradient,opacity:selectedGenres.length?1:0.4,cursor:selectedGenres.length?"pointer":"not-allowed"}}>
                Next
              </button>
              <button onClick={()=>finish(true)} style={{padding:12,border:"none",borderRadius:8,
                        background:"#353148",color:"#ffe3b3",fontWeight:700}}>Skip</button>
            </div>
          </>
        )}

        {/* STEP 2 */}
        {step===2 && (
          <>
            <h2 style={{textAlign:"center",fontWeight:900,fontSize:"1.3rem"}}>Add a couple of movies you love</h2>
            <input ref={searchInputRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search…" autoFocus
                   style={{width:"100%",background:"#232330",color:"#fff",border:"none",borderRadius:8,padding:12,margin:"15px 0"}}/>
            <div style={{maxHeight:170,overflowY:"auto"}}>
              {results.map(r=>(
                <div key={r.id} onClick={()=>addMovie(r)}
                     style={{display:"flex",alignItems:"center",gap:10,padding:6,cursor:"pointer"}}>
                  <img src={r.poster_path?`https://image.tmdb.org/t/p/w92${r.poster_path}`:'/posters/placeholder.png'}
                       alt={r.title} style={{width:36,height:52,objectFit:"cover",borderRadius:6}}/>
                  <span>{r.title}{r.release_date && <small style={{opacity:.6}}> ({r.release_date.slice(0,4)})</small>}</span>
                </div>
              ))}
            </div>
            {watchlist.length>0 && (
              <div style={{display:"flex",flexWrap:"wrap",gap:8,margin:"12px 0"}}>
                {watchlist.map(m=>(
                  <div key={m.id} style={{background:"#232330",borderRadius:20,padding:"4px 12px",display:"flex",alignItems:"center",gap:6}}>
                    {m.title}
                    <button onClick={()=>rmMovie(m.id)} style={{border:"none",background:"none",color:"#ffbbaa",cursor:"pointer"}}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(1)} style={{flex:1,padding:12,border:"none",borderRadius:8,background:"#353148",color:"#fff"}}>‹ Back</button>
              <button onClick={()=>finish(false)} disabled={saving}
                      style={{flex:1,padding:12,border:"none",borderRadius:8,fontWeight:800,background:THEME.gradient}}>Finish</button>
              <button onClick={()=>finish(true)}
                      style={{padding:12,border:"none",borderRadius:8,background:"#353148",color:"#ffe3b3",fontWeight:700}}>Skip</button>
            </div>
          </>
        )}

        {saving && <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:18}}>Saving…</div>}
      </div>
    </div>
  );
}
