import { useState, useEffect, useRef, useMemo } from 'react'

export function Reveal({children,delay=0}){
  const ref=useRef(null);
  const [iv,setIv]=useState(false);
  useEffect(()=>{
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting){setTimeout(()=>setIv(true),delay);obs.disconnect();}},{threshold:0.15});
    if(ref.current)obs.observe(ref.current);
    return()=>obs.disconnect();
  },[delay]);
  return<div ref={ref} className={`ff-reveal${iv?' in':''}`}>{children}</div>;
}

// Universal poster with mood-gradient fallback if TMDB image misses
export function Poster({src,title,accent='#A78BFA',style}){
  const [failed,setFailed]=useState(false);
  if(failed){
    return(
      <div style={{...style,display:'flex',alignItems:'flex-end',padding:'14px 16px',background:`linear-gradient(160deg, ${accent}cc 0%, ${accent}77 45%, ${accent}22 100%)`,overflow:'hidden'}}>
        <div style={{position:'relative',zIndex:1}}>
          <div className="ff-eyebrow" style={{color:'rgba(255,255,255,0.6)',marginBottom:6}}>FeelFlick</div>
          <div style={{fontFamily:'Outfit',fontWeight:500,fontSize:16,color:'#fff',letterSpacing:'-0.018em',lineHeight:1.1,textShadow:'0 2px 8px rgba(0,0,0,0.5)'}}>{title}</div>
        </div>
      </div>
    );
  }
  // Below-fold posters (Problem/Ritual/FilmFile/Briefing/Community) — lazy + async
  // decode so they don't compete with the hero LCP. The hero poster is a separate
  // eager <img> by design.
  return <img src={src} alt={title} loading="lazy" decoding="async" style={style} onError={()=>setFailed(true)}/>;
}

export function Stars({tint,count=50}){
  const stars=useMemo(()=>Array.from({length:count},()=>({x:Math.random()*100,y:Math.random()*100,s:Math.random()*1.3+0.3,dly:Math.random()*8,dur:6+Math.random()*8,op:0.15+Math.random()*0.4})),[count]);
  return(
    <div aria-hidden style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
      <div style={{position:'absolute',inset:0,background:`radial-gradient(ellipse 80% 50% at 50% 0%,${tint}1c,transparent 60%),radial-gradient(ellipse 60% 40% at 50% 100%,${tint}10,transparent 60%)`}}/>
      {stars.map((s,i)=><div key={i} style={{position:'absolute',left:`${s.x}%`,top:`${s.y}%`,width:s.s,height:s.s,borderRadius:999,background:'#fff',opacity:s.op,animation:`ff-tw ${s.dur}s ease-in-out ${s.dly}s infinite`}}/>)}
    </div>
  );
}
