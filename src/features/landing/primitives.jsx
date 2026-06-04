import { useState, useMemo } from 'react'
import CanonicalEyebrow from '@/shared/ui/Eyebrow'
import { HP_GRAD as GRAD } from '@/shared/lib/tokens'
import { useInView } from '@/shared/hooks/useInView'

// Landing-flavored eyebrow — the canonical `shared/ui/Eyebrow` primitive at the
// landing's deliberately lighter Outfit 600 (every other surface uses the
// primitive's default 700). Baking the 600 here keeps that one intentional
// deviation in a single place instead of scattered across ~35 call-sites, while
// still delegating all styling (size, spacing, uppercase, optional rule) to the
// shared source of truth. Callers pass `color`/`style` per instance.
export function Eyebrow(props){
  return <CanonicalEyebrow weight={600} {...props}/>;
}

// Brand-gradient sign-in pill — the landing's single CTA shape, shared by Header,
// Hero, Pricing, and FinalCTA. ONE source for the invariant bits (radius-999
// gradient, white Inter 600, borderless, and the disabled/loading treatment) +
// the button wiring. Deliberately PRESENTATIONAL: callers pass the shared
// `loading` (isAuthenticating) and `onClick` (signInWithGoogle) from a single
// useGoogleAuth() per section, so a section with several auth buttons (Header)
// keeps ONE shared loading state rather than fragmenting it per pill.
// Not promoted to shared/ui by design: that tier's <Button> (Tailwind) is the
// canonical app CTA; the landing is inline-style + uses the .ff-link class.
// `style` merges the per-instance layout (padding/size/shadow/width); `children`
// is a node or a (loading)=>node render-fn so each call-site keeps its exact
// label and loading swap.
const CTA_PILL = { borderRadius:999, background:GRAD, color:'#fff', fontFamily:'Inter', fontWeight:600, border:'none' }
export function AuthCTA({ onClick, loading=false, style, ariaLabel, children }){
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="ff-link ff-cta"
      style={{ ...CTA_PILL, cursor:loading?'progress':'pointer', opacity:loading?0.7:1, ...style }}
      aria-label={ariaLabel}
    >{typeof children==='function' ? children(loading) : children}</button>
  );
}

// Brand wordmark — the gradient FEELFLICK lockup shared by Header + Footer (and a
// candidate to promote to shared/ui if the authed TopNav adopts it). One source
// for the brand lettering: Outfit 600 (the brand DISPLAY face — a logo is
// display-tier, per CLAUDE.md) with POSITIVE 0.04em tracking — all-caps lockups
// need air between glyphs (Stripe/Vercel/editorial standard); the hero's
// negative tracking is for big mixed-case display, not a small caps logo. Brand-
// gradient text clip. `size` sets the cap height (Header 21 / Footer 20); `style`
// merges for layout (e.g. flexShrink). Renders a <span> so callers wrap it in
// their own <a>/<div> for linking + positioning.
export function Wordmark({ size=21, style }){
  return (
    <span style={{ fontFamily:'Outfit', fontSize:size, fontWeight:600, letterSpacing:'0.04em', background:GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', ...style }}>FEELFLICK</span>
  );
}

export function Reveal({children,delay=0}){
  const [ref,iv]=useInView({threshold:0.15,delay});
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
