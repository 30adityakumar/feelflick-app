import { useState, useEffect, useMemo } from 'react'
import { useGoogleAuth } from '@/shared/hooks/useGoogleAuth'
import { C, HP_GRAD as GRAD } from '@/shared/lib/tokens'
import { Stars } from '../primitives'
import { PICKS } from '../data'

// ── Hero ───────────────────────────────────────────────────
// Criterion-like: the pick is the hero. Editorial.
export default function Hero(){
  const [idx,setIdx]=useState(0);
  const [paused,setPaused]=useState(false);
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth();
  // 5.4s auto-rotation. Pauses on hover/focus-within (WCAG 2.2.2 "Pause, Stop,
  // Hide") and on prefers-reduced-motion (no auto-rotation at all in that mode;
  // the dots still work for manual paging).
  useEffect(()=>{
    if(paused) return;
    if(typeof window!=='undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t=setInterval(()=>setIdx(i=>(i+1)%PICKS.length),5400);
    return()=>clearInterval(t);
  },[paused]);
  const p=PICKS[idx];
  const greeting=useMemo(()=>{
    const d=new Date(),h=d.getHours();
    const day=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
    const part=h<5?'late':h<12?'morning':h<17?'afternoon':h<22?'evening':'night';
    return`${day} ${part}`;
  },[]);
  return(
    <section
      className="ff-hero"
      onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}
      onFocus={()=>setPaused(true)} onBlur={()=>setPaused(false)}
      style={{position:'relative',display:'flex',alignItems:'center',overflow:'hidden',padding:'140px 32px 80px'}}>
      <Stars tint={p.moodHex} count={70}/>
      <div style={{position:'relative',zIndex:1,maxWidth:1280,margin:'0 auto',width:'100%'}} className="ff-grid-hero">
        <div>
          <div className="ff-eyebrow" style={{marginBottom:32}}>
            <span style={{color:C.textLow}}>FeelFlick · {greeting}</span>
          </div>
          <h1 className="ff-d1" style={{fontSize:'clamp(56px,7vw,118px)',color:C.text,margin:0}}>
            Films that{' '}<br/>know <em className="ff-italic" style={{color:C.textMid}}>you.</em>
          </h1>
          <p className="ff-body" style={{marginTop:36,fontSize:18,color:C.textMid,maxWidth:480,lineHeight:1.6}}>
            The right film. Right now. Tuned to your mood, your taste, and everything you’ve ever loved on screen.
          </p>
          <div style={{marginTop:48,display:'flex',alignItems:'center',gap:18}}>
            <button type="button" onClick={signInWithGoogle} disabled={isAuthenticating} className="ff-link" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'15px 28px',borderRadius:999,background:GRAD,color:'#fff',fontFamily:'Inter',fontSize:14,fontWeight:600,boxShadow:'0 14px 32px -10px rgba(236,72,153,0.45)',border:'none',cursor:isAuthenticating?'progress':'pointer',opacity:isAuthenticating?0.7:1}} aria-label="Start free with Google">{isAuthenticating?'Opening Google…':'Start free →'}</button>
            <a href="#ritual" className="ff-link" style={{fontFamily:'Inter',fontSize:14,fontWeight:500,color:C.textMid,letterSpacing:'0.01em',display:'inline-flex',alignItems:'center',minHeight:44,padding:'0 4px'}}>See how it works</a>
          </div>
        </div>
        <div key={p.title} className="ff-fade-swap" style={{position:'relative',padding:'12px 0'}}>
          <div className="ff-eyebrow" style={{color:p.moodHex,marginBottom:18,transition:'color 0.6s'}}>Tonight’s selection · {p.mood}</div>
          <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:32,alignItems:'flex-start'}}>
            <div style={{position:'relative'}}>
              <div aria-hidden style={{position:'absolute',inset:-18,borderRadius:14,background:`radial-gradient(ellipse at center,${p.moodHex}55,transparent 70%)`,filter:'blur(40px)',transition:'background 0.8s'}}/>
              <img key={p.poster} src={p.poster} alt={p.title} onError={(e)=>{e.currentTarget.style.display='none';e.currentTarget.parentNode.style.background=`linear-gradient(160deg, ${p.moodHex}cc 0%, ${p.moodHex}55 50%, ${p.moodHex}1a 100%)`;e.currentTarget.parentNode.dataset.fallback=p.title;}} style={{position:'relative',width:240,aspectRatio:'2/3',objectFit:'cover',borderRadius:5,boxShadow:`0 28px 56px -18px rgba(0,0,0,0.85),0 0 0 1px ${p.moodHex}33`,transition:'all 0.8s cubic-bezier(.2,.7,.2,1)'}}/>
            </div>
            <div style={{paddingTop:8}}>
              {/* Hero film title rotates — kept as <div> (not <h2>) to preserve page heading hierarchy. */}
              <div key={p.title+'-t'} className="ff-d2" style={{fontSize:'clamp(32px,3.4vw,46px)',color:C.text,margin:0,animation:'ff-tw 0s'}}>{p.title}</div>
              <div style={{marginTop:10,display:'flex',alignItems:'center',gap:11,fontFamily:'Inter',fontSize:12,color:C.textLow}}>
                <span style={{fontStyle:'italic'}}>{p.dir}</span>
                <span style={{color:C.textFaint}}>·</span>
                <span>{p.year}</span>
                <span style={{color:C.textFaint}}>·</span>
                <span>{p.runtime}</span>
              </div>
              {/* Hero card blurb — regular weight 400, mood-hex left rule gives it editorial flair without italic body. */}
              <p className="ff-body" style={{marginTop:24,fontSize:16,fontWeight:400,color:C.textMid,lineHeight:1.65,maxWidth:340,paddingLeft:14,borderLeft:`2px solid ${p.moodHex}55`}}>{p.why}</p>
              {/* Dots */}
              <div style={{marginTop:32,display:'flex',gap:8}}>
                {PICKS.map((_,i)=><button key={i} onClick={()=>setIdx(i)} aria-label={`pick ${i+1}`} style={{width:i===idx?22:6,height:6,borderRadius:999,background:i===idx?p.moodHex:C.textFaint,border:'none',padding:0,cursor:'pointer',transition:'all 0.4s cubic-bezier(.2,.7,.2,1)'}}/>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
