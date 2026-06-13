import { forwardRef, useState, useMemo } from 'react'
import CanonicalEyebrow from '@/shared/ui/Eyebrow'
import { ROSE, C } from '@/shared/lib/tokens'
import { useInView } from '@/shared/hooks/useInView'

// Landing-flavored eyebrow — the canonical `shared/ui/Eyebrow` primitive at the
// landing's deliberately lighter Inter 600 (every other surface uses the
// primitive's default 700). Baking the 600 here keeps that one intentional
// deviation in a single place instead of scattered across ~35 call-sites, while
// still delegating all styling (size, spacing, uppercase, optional rule) to the
// shared source of truth. Callers pass `color`/`style` per instance.
export function Eyebrow(props){
  return <CanonicalEyebrow weight={600} {...props}/>;
}

// Brand sign-in pill — the landing's single CTA shape, shared by Header,
// Hero, Pricing, and FinalCTA. ONE source for the invariant bits (radius-999
// rose fill, white Inter 600, borderless, and the disabled/loading treatment) +
// the button wiring. Deliberately PRESENTATIONAL: callers pass the shared
// `loading` (isAuthenticating) and `onClick` (signInWithGoogle) from a single
// useGoogleAuth() per section, so a section with several auth buttons (Header)
// keeps ONE shared loading state rather than fragmenting it per pill.
// Not promoted to shared/ui by design: that tier's <Button> (Tailwind) is the
// canonical app CTA; the landing is inline-style + uses the .ff-link class.
// `style` merges the per-instance layout (padding/size/shadow/width); `children`
// is a node or a (loading)=>node render-fn so each call-site keeps its exact
// label and loading swap.
const CTA_PILL = { borderRadius:999, background:ROSE, color:'#fff', fontFamily:'Inter', fontWeight:600, border:'none' }
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

// Brand wordmark — the FEELFLICK lockup shared by Header + Footer (and a
// candidate to promote to shared/ui if the authed TopNav adopts it). One source
// for the brand lettering: Inter 600 with POSITIVE 0.04em tracking — all-caps
// lockups need air between glyphs (Stripe/Vercel/editorial standard); the hero's
// negative tracking is for big mixed-case display, not a small caps logo. Solid
// rose ink (the retired purple→pink gradient clip is gone). `size` sets the cap
// height (Header 21 / Footer 20); `style` merges for layout (e.g. flexShrink).
// Renders a <span> so callers wrap it in their own <a>/<div> for linking + positioning.
export function Wordmark({ size=21, style }){
  return (
    <span style={{ fontFamily:'Inter, sans-serif', fontSize:size, fontWeight:600, letterSpacing:'0.04em', color:ROSE, ...style }}>FEELFLICK</span>
  );
}

export function Reveal({children,delay=0}){
  const [ref,iv]=useInView({threshold:0.15,delay});
  return<div ref={ref} className={`ff-reveal${iv?' in':''}`}>{children}</div>;
}

// Universal poster with mood-gradient fallback if TMDB image misses
export function Poster({src,title,accent=ROSE,style}){
  const [failed,setFailed]=useState(false);
  if(failed){
    return(
      <div style={{...style,display:'flex',alignItems:'flex-end',padding:'14px 16px',background:`linear-gradient(160deg, ${accent}cc 0%, ${accent}77 45%, ${accent}22 100%)`,overflow:'hidden'}}>
        <div style={{position:'relative',zIndex:1}}>
          <div className="ff-eyebrow" style={{color:'rgba(255,255,255,0.6)',marginBottom:6}}>FeelFlick</div>
          <div style={{fontFamily:'Inter, sans-serif',fontWeight:500,fontSize:16,color:'#fff',letterSpacing:'-0.018em',lineHeight:1.1,textShadow:'0 2px 8px rgba(0,0,0,0.5)'}}>{title}</div>
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

// Landing section scaffold — the outer <section> + centered content column that
// every editorial section below the hero repeats (8 near-identical hand-rolled
// copies before this extraction). PRESENTATIONAL ONLY: it emits the exact same
// DOM the sections used to inline — a real <section> (so landing.css's
// `section{…}`, `section#file,section#start`, and `section:first-of-type`
// responsive rules still match by element + id) wrapping the default
// `maxWidth:1280; margin:0 auto` column. It holds no visual opinion beyond those
// repeated invariants, so adopting it is render-faithful.
//
// Props (all optional except `children`):
//   • id           — forwarded to <section> (anchor target + the #file/#start CSS hooks)
//   • tone         — cinematic chapter surface (F1.2): 'void' (#000, dramatic/served beats) /
//                    'panel' (#0d0b14 lifted editorial surface, gets the .ff-sec-panel top-seam) /
//                    'base' (#06060a). Sets the background; an explicit `background` prop still wins.
//   • background   — explicit section background (back-compat / overrides `tone`); omitted when absent
//   • padding      — section padding (default '140px 32px' = the standard rhythm step; leads pass
//                    '160px 32px', crescendos FilmFile/FinalCTA pass '200px 32px')
//   • borderTop    — render the `1px solid C.hairline` top rule (default true — every section has it)
//   • position     — emitted only when passed (TheProblem/FilmFile/FinalCTA need 'relative')
//   • overflow     — emitted only when passed (TheProblem/FinalCTA need 'hidden')
//   • before       — node rendered INSIDE the <section> but BEFORE the content column,
//                    for the absolute decorative layers (FilmFile's radial glow, FinalCTA's <Stars>)
//   • innerStyle   — merged onto the content column (override maxWidth→880, add position/textAlign)
//   • style        — merged onto the <section>
//   • className    — extra class(es) merged onto the <section>
// forwardRef so DNA keeps its useInView ref on the <section> element itself.
const TONE_BG = { void: C.bgPure, panel: C.bgLight, base: C.bg };
export const SectionShell = forwardRef(function SectionShell(
  { id, tone, background, padding='140px 32px', borderTop=true, position, overflow, before, innerStyle, style, className, children },
  ref,
){
  const bg = background ?? (tone ? TONE_BG[tone] : undefined);
  const cls = [tone === 'panel' ? 'ff-sec-panel' : '', className].filter(Boolean).join(' ');
  return (
    <section
      id={id}
      ref={ref}
      className={cls || undefined}
      style={{
        padding,
        ...(borderTop ? { borderTop:`1px solid ${C.hairline}` } : null),
        ...(bg ? { background: bg } : null),
        ...(position ? { position } : null),
        ...(overflow ? { overflow } : null),
        ...style,
      }}
    >
      {before}
      <div style={{ maxWidth:1280, margin:'0 auto', ...innerStyle }}>{children}</div>
    </section>
  );
});

// Centered editorial section header — the `<div textAlign:center marginBottom>` +
// optional <Eyebrow> + ff-d2 <h2> (the clamp(44px,5.6vw,80px) display headline) +
// optional lede <p>, repeated verbatim by the centered-header sections
// (TheProblem, Ritual, FilmFile, DNA). The grid-split headers (Briefing, Community)
// and the per-Reveal-split headers (Pricing, FinalCTA) deliberately do NOT use this
// — their markup isn't this shape, so forcing it would change the DOM.
//
// `children` is the <h2> content, so each section keeps its exact copy + <em>
// accents. The few values the four sites vary are props with the common defaults.
export function SectionHeading({
  eyebrow,
  eyebrowColor=ROSE,
  eyebrowMarginBottom=26,
  marginBottom=80,
  headingMaxWidth=880,
  headingStyle,
  lede,
  ledeMaxWidth=580,
  ledeMarginTop=24,
  ledeLineHeight=1.65,
  align='center',
  style,
  children,
}){
  return (
    <div style={{ textAlign:align, marginBottom, ...style }}>
      {eyebrow && <Eyebrow color={eyebrowColor} style={{ marginBottom:eyebrowMarginBottom }}>{eyebrow}</Eyebrow>}
      <h2 className="ff-d2" style={{ fontSize:'clamp(44px,5.6vw,80px)', color:C.text, margin:'0 auto', textWrap:'balance', maxWidth:headingMaxWidth, ...headingStyle }}>
        {children}
      </h2>
      {lede && <p className="ff-body" style={{ fontSize:18, color:C.textMid, maxWidth:ledeMaxWidth, margin:`${ledeMarginTop}px auto 0`, lineHeight:ledeLineHeight }}>{lede}</p>}
    </div>
  );
}
