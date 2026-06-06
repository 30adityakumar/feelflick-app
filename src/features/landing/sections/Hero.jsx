import { useState, useEffect, useMemo } from 'react'
import { useGoogleAuth } from '@/shared/hooks/useGoogleAuth'
import { C } from '@/shared/lib/tokens'
import { Stars, Eyebrow, AuthCTA } from '../primitives'
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
          <Eyebrow color={C.textLow} style={{marginBottom:32}}>FeelFlick · {greeting}</Eyebrow>
          <h1 className="ff-d1" style={{fontSize:'clamp(56px,7vw,118px)',color:C.text,margin:0}}>
            Films that{' '}<br/>know <em className="ff-italic" style={{color:C.textMid}}>you.</em>
          </h1>
          <p className="ff-body" style={{marginTop:36,fontSize:18,color:C.textMid,maxWidth:480,lineHeight:1.6}}>
            The right film. Right now. Tuned to your mood, your taste, and everything you’ve ever loved on screen.
          </p>
          <div style={{marginTop:48,display:'flex',alignItems:'center',gap:18}}>
            <AuthCTA onClick={signInWithGoogle} loading={isAuthenticating} ariaLabel="Start free with Google" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'15px 28px',fontSize:14,boxShadow:'0 14px 32px -10px rgba(236,72,153,0.45)'}}>{l=>l?'Opening Google…':'Start free →'}</AuthCTA>
            <a href="#ritual" className="ff-link" style={{fontFamily:'Inter',fontSize:14,fontWeight:500,color:C.textMid,letterSpacing:'0.01em',display:'inline-flex',alignItems:'center',minHeight:44,padding:'0 4px'}}>See how it works</a>
          </div>
        </div>
        <div key={p.title} className="ff-fade-swap ff-hero-pickwrap" style={{position:'relative'}}>
          {/* Mood cue — restrained accent: a muted "Tonight's selection" label + a chip
              in the pick's mood hex. Accent ONLY; the brand identity stays dark base +
              the purple/pink gradient. inline-flex so it follows text-align (centers on mobile). */}
          <div style={{marginBottom:24}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:10}}>
              <Eyebrow color={C.textLow}>Tonight’s selection</Eyebrow>
              <span aria-hidden style={{width:3,height:3,borderRadius:999,background:C.textFaint}}/>
              <span style={{display:'inline-flex',alignItems:'center',gap:7,padding:'5px 11px',borderRadius:999,background:`${p.moodHex}1a`,border:`1px solid ${p.moodHex}40`,transition:'background 0.6s,border-color 0.6s'}}>
                <span aria-hidden style={{width:6,height:6,borderRadius:999,background:p.moodHex,transition:'background 0.6s'}}/>
                <span style={{fontFamily:'Outfit',fontSize:11,fontWeight:600,letterSpacing:'0.16em',textTransform:'uppercase',color:C.textHi}}>{p.mood}</span>
              </span>
            </span>
          </div>
          <div className="ff-hero-pick">
            {/* The pick — the cinematic object of the hero: larger poster, deeper mood
                glow, hairline frame, room to breathe. */}
            <div style={{position:'relative',width:'min(280px,68vw)'}}>
              <div aria-hidden style={{position:'absolute',inset:-30,borderRadius:18,background:`radial-gradient(ellipse at center,${p.moodHex}5c,transparent 70%)`,filter:'blur(52px)',transition:'background 0.8s'}}/>
              <img key={p.poster} src={p.poster} alt={p.title} onError={(e)=>{e.currentTarget.style.display='none';e.currentTarget.parentNode.style.background=`linear-gradient(160deg, ${p.moodHex}cc 0%, ${p.moodHex}55 50%, ${p.moodHex}1a 100%)`;e.currentTarget.parentNode.dataset.fallback=p.title;}} style={{position:'relative',width:'100%',aspectRatio:'2/3',objectFit:'cover',borderRadius:6,boxShadow:`0 40px 80px -24px rgba(0,0,0,0.9),0 0 0 1px ${p.moodHex}33`,transition:'all 0.8s cubic-bezier(.2,.7,.2,1)'}}/>
            </div>
            {/* Caption — title stays a <div> (NOT a heading) to keep one <h1> on the page. */}
            <div>
              <div key={p.title+'-t'} className="ff-d2" style={{fontSize:'clamp(30px,3.1vw,42px)',color:C.text,margin:0}}>{p.title}</div>
              {/* Inline meta so it follows the caption's text-align (left desktop / center mobile). */}
              <div style={{marginTop:10,fontFamily:'Inter',fontSize:12,color:C.textLow}}>
                <span style={{fontStyle:'italic'}}>{p.dir}</span>
                <span style={{color:C.textFaint}}> · </span>{p.year}
                <span style={{color:C.textFaint}}> · </span>{p.runtime}
              </div>
              {/* Hero blurb — the pick's "why", regular weight 400. */}
              <p className="ff-body" style={{marginTop:20,fontSize:15,fontWeight:400,color:C.textMid,lineHeight:1.65,maxWidth:360}}>{p.why}</p>
              {/* Dots — inline-flex inside a block so they follow text-align; behavior unchanged. */}
              <div style={{marginTop:26}}>
                <span style={{display:'inline-flex',gap:8}}>
                  {PICKS.map((_,i)=><button key={i} onClick={()=>setIdx(i)} aria-label={`pick ${i+1}`} style={{width:i===idx?22:6,height:6,borderRadius:999,background:i===idx?p.moodHex:C.textFaint,border:'none',padding:0,cursor:'pointer',transition:'all 0.4s cubic-bezier(.2,.7,.2,1)'}}/>)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
