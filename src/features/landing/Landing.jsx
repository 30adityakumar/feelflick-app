import { useState, useEffect, useRef, useMemo, useId } from 'react'
import { Link } from 'react-router-dom'
import { useGoogleAuth } from '@/features/landing-v2/utils/useGoogleAuth'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import './landing.css'

const C={bg:'#06060a',bgPure:'#000',bgLight:'#0d0b14',bgPaper:'#0f0c18',text:'#FAFAFA',textHi:'rgba(250,250,250,0.92)',textMid:'rgba(250,250,250,0.72)',textLow:'rgba(250,250,250,0.55)',textFaint:'rgba(250,250,250,0.28)',hairline:'rgba(255,255,255,0.08)',hairlineStrong:'rgba(255,255,255,0.14)',purple:'#A78BFA',pink:'#EC4899',amber:'#F59E0B',green:'#34D399'};
const GRAD='linear-gradient(135deg,#9333ea 0%,#ec4899 100%)';
// Posters render at <=240px wide on the landing — w342 is the right TMDB size.
const TMDB=(p)=>`https://image.tmdb.org/t/p/w342${p}`;

// `match` + `streaming` added to mirror the real /home Tonight's Pick:
// every shipped film card carries a match % (engine signal) and a
// streaming-availability badge. Numbers are illustrative; provider
// objects use real TMDB logo paths so the landing's StreamingChip
// looks identical to the inside's (which fetches the same data via
// getMovieWatchProviders → tmdb.org/t/p/w92{logoPath}).
const TMDB_LOGO = (p) => `https://image.tmdb.org/t/p/w92${p}`
const PROVIDERS = {
  netflix:    { name: 'Netflix',     logoPath: '/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg', type: 'flatrate' },
  appletv:    { name: 'Apple TV+',   logoPath: '/peURlLlr8jggOwK53fJ5wdQl05y.jpg', type: 'flatrate' },
  hulu:       { name: 'Hulu',        logoPath: '/giwM8XX4V2AQb9vsoN7yti82tKK.jpg', type: 'flatrate' },
  paramount:  { name: 'Paramount+',  logoPath: '/xbhHHa1YgtpwhC8lb1NQ3ACVcLd.jpg', type: 'flatrate' },
  prime:      { name: 'Prime Video', logoPath: '/68MNrwlkpF7WnmNPXLah69CR5cb.jpg', type: 'flatrate' },
  max:        { name: 'Max',         logoPath: '/jbe4gVSfRlbPTdESXhEKpornsfu.jpg', type: 'flatrate' },
}
const PICKS=[
  {title:'Past Lives',year:2023,runtime:'1h 45m',dir:'Celine Song',poster:TMDB('/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg'),mood:'Tender',moodHex:'#F472B6',why:'Two strangers in a New York bar — but they were children once, in Seoul. A slow ache that lives in glances.',match:88,streaming:PROVIDERS.appletv},
  {title:'Parasite',year:2019,runtime:'2h 12m',dir:'Bong Joon-ho',poster:TMDB('/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg'),mood:'Tense',moodHex:'#EF4444',why:'A grift becomes architecture. Bong builds his cage room by room until the gate clicks shut.',match:91,streaming:PROVIDERS.hulu},
  {title:'Her',year:2013,runtime:'2h 6m',dir:'Spike Jonze',poster:TMDB('/eCOtqtfvn7mxGl6nfmq4b1exJRc.jpg'),mood:'Bittersweet',moodHex:'#FB7185',why:'Near-future Los Angeles. A man falls for an operating system. Tender, lonely, alive in every frame — Phoenix at his most undone.',match:84,streaming:PROVIDERS.netflix},
  {title:'Interstellar',year:2014,runtime:'2h 49m',dir:'Christopher Nolan',poster:TMDB('/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'),mood:'Mythic',moodHex:'#0EA5E9',why:'A father leaves Earth to save it. Time bends around love. Nolan at his largest scale and his most tender.',match:79,streaming:PROVIDERS.paramount},
  {title:'PK',year:2014,runtime:'2h 33m',dir:'Rajkumar Hirani',poster:TMDB('/uqoAHhuKZnWxzXbXSUycgpLPmUW.jpg'),mood:'Thoughtful',moodHex:'#FBBF24',why:'An alien lands in Rajasthan and starts asking questions no priest can answer. Aamir Khan, wide-eyed, dismantling certainty.',match:76,streaming:PROVIDERS.netflix},
  {title:'The Truman Show',year:1998,runtime:'1h 43m',dir:'Peter Weir',poster:TMDB('/vuza0WqY239yBXOadKlGwJsZJFE.jpg'),mood:'Restless',moodHex:'#34D399',why:'A man discovers his entire life is a televised set. Jim Carrey, unsettlingly tender, pushing against the walls of a manufactured world.',match:82,streaming:PROVIDERS.paramount},
];

function Reveal({children,delay=0}){
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
function Poster({src,title,accent='#A78BFA',style}){
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
  return <img src={src} alt={title} style={style} onError={()=>setFailed(true)}/>;
}

// MatchRing — animated SVG ring with gradient stroke. Ported verbatim
// from src/features/home-v2/sections-top.jsx so the landing's example
// pick shows the SAME ring the user sees on /home Tonight's Pick.
// Numbers tween 0 → pct over 1.4s; stroke fills proportionally.
function MatchRing({pct, size = 60}){
  const id = useId();
  const gradId = `ff-mr-${id.replace(/:/g, '')}`;
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setV(pct || 0), 250);
    return () => clearTimeout(t);
  }, [pct]);
  const dash = v * 0.943;  // 0..100 → 0..94.3, matching SVG r=15 circumference
  return (
    <div style={{
      position: 'absolute', bottom: 14, right: 14,
      width: size, height: size, borderRadius: 999,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
      boxShadow: '0 12px 28px -6px rgba(0,0,0,0.6)',
    }}>
      <svg viewBox="0 0 36 36" style={{width: '100%', height: '100%', transform: 'rotate(-90deg)'}}>
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5"/>
        <circle cx="18" cy="18" r="15" fill="none" stroke={`url(#${gradId})`} strokeWidth="2.5" strokeDasharray={`${dash} 100`} strokeLinecap="round" style={{transition: 'stroke-dasharray 1.4s cubic-bezier(0.2,0.8,0.2,1)'}}/>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#A78BFA"/>
            <stop offset="100%" stopColor="#EC4899"/>
          </linearGradient>
        </defs>
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <span style={{fontFamily: 'Outfit', fontSize: Math.round(size * 0.31), fontWeight: 300, color: '#FAFAFA', letterSpacing: '-0.04em', lineHeight: 1}}>
          {v}<span style={{fontSize: Math.round(size * 0.16), color: 'rgba(250,250,250,0.45)', marginLeft: 1}}>%</span>
        </span>
        <span style={{fontSize: Math.round(size * 0.095), fontWeight: 700, color: '#A78BFA', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2}}>Match</span>
      </div>
    </div>
  );
}

// StreamingChip — ported from sections-top.jsx. Shows the provider logo
// (32×32 image) + "Streaming on" label + provider name in a compact
// bordered pill. Same component the user sees on /home Tonight's Pick.
function StreamingChip({provider}){
  if(!provider) return null;
  const label = provider.type === 'flatrate' ? 'Streaming on'
    : provider.type === 'rent' ? 'Rent on'
    : 'Buy on';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      padding: '6px 10px', borderRadius: 8,
      background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.07)`,
      maxWidth: '100%',
    }}>
      <img src={`${TMDB_LOGO(provider.logoPath)}`} alt={provider.name} style={{height: 28, width: 28, flex: 'none', borderRadius: 4, objectFit: 'cover'}} loading="lazy"/>
      <div style={{minWidth: 0}}>
        <p style={{fontFamily: 'Outfit', fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(250,250,250,0.32)', lineHeight: 1, margin: 0}}>{label}</p>
        <p style={{fontFamily: 'Outfit', fontSize: 12, fontWeight: 600, color: '#FAFAFA', lineHeight: 1, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{provider.name}</p>
      </div>
    </div>
  );
}

function Stars({tint,count=50}){
  const stars=useMemo(()=>Array.from({length:count},()=>({x:Math.random()*100,y:Math.random()*100,s:Math.random()*1.3+0.3,dly:Math.random()*8,dur:6+Math.random()*8,op:0.15+Math.random()*0.4})),[count]);
  return(
    <div aria-hidden style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
      <div style={{position:'absolute',inset:0,background:`radial-gradient(ellipse 80% 50% at 50% 0%,${tint}1c,transparent 60%),radial-gradient(ellipse 60% 40% at 50% 100%,${tint}10,transparent 60%)`}}/>
      {stars.map((s,i)=><div key={i} style={{position:'absolute',left:`${s.x}%`,top:`${s.y}%`,width:s.s,height:s.s,borderRadius:999,background:'#fff',opacity:s.op,animation:`ff-tw ${s.dur}s ease-in-out ${s.dly}s infinite`}}/>)}
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────
// Below 768px the desktop nav collapses to a hamburger that opens a full-screen
// drawer. Above 768px the desktop nav is shown as-is. The transition is gated
// by `.ff-hide-on-mobile` / `.ff-show-on-mobile` rules in landing.css.
const NAV_ITEMS = [
  { l:'Ritual',    h:'#ritual'   },
  { l:'Film file', h:'#file'     },
  { l:'Pricing',   h:'#pricing'  },
];

// Desktop nav link with color shift on hover/focus — the missing affordance
// that flagged in the world-class UX audit.
function NavLink({href, children, baseStyle, onClick}){
  const [h,setH]=useState(false);
  return (
    <a
      href={href}
      onClick={onClick}
      className="ff-link"
      onMouseEnter={()=>setH(true)}
      onMouseLeave={()=>setH(false)}
      onFocus={()=>setH(true)}
      onBlur={()=>setH(false)}
      style={{...baseStyle,color: h ? C.textHi : C.textMid,transition:'color 0.15s ease'}}
    >{children}</a>
  );
}
function Header(){
  const [s,setS]=useState(false);
  const [open,setOpen]=useState(false);
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth();
  // Stable refs for the drawer + hamburger so the drawer effects can target
  // them without relying on global selectors (which fight React's lifecycle).
  const drawerRef=useRef(null);
  const hamburgerRef=useRef(null);
  useEffect(()=>{const on=()=>setS(window.scrollY>24);window.addEventListener('scroll',on,{passive:true});return()=>window.removeEventListener('scroll',on);},[]);
  // While the drawer is open:
  //  - lock body scroll (already worked)
  //  - Escape closes (already worked)
  //  - tap-outside (pointerdown anywhere not inside drawer or hamburger) closes
  //  - focus trap: Tab cycles inside the drawer; Shift+Tab wraps backwards
  //  - autofocus the first drawer item on open; restore focus to hamburger on close
  useEffect(()=>{
    if(!open){
      // Returning from open → closed: restore focus to the hamburger button.
      hamburgerRef.current?.focus();
      return;
    }
    document.body.style.overflow='hidden';

    const onKey=(e)=>{
      if(e.key==='Escape'){ setOpen(false); return; }
      if(e.key!=='Tab') return;
      const drawer=drawerRef.current;
      if(!drawer) return;
      const focusables=Array.from(drawer.querySelectorAll('a, button')).filter(el=>!el.disabled);
      if(focusables.length===0) return;
      const first=focusables[0];
      const last=focusables[focusables.length-1];
      if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
    };
    const onPointerDown=(e)=>{
      const drawer=drawerRef.current;
      const ham=hamburgerRef.current;
      if(drawer && !drawer.contains(e.target) && ham && !ham.contains(e.target)){
        setOpen(false);
      }
    };

    // Autofocus the first focusable element in the drawer (async to allow render).
    const focusTimer=setTimeout(()=>{
      const first=drawerRef.current?.querySelector('a, button');
      first?.focus();
    },0);

    window.addEventListener('keydown',onKey);
    document.addEventListener('pointerdown',onPointerDown);
    return()=>{
      document.body.style.overflow='';
      clearTimeout(focusTimer);
      window.removeEventListener('keydown',onKey);
      document.removeEventListener('pointerdown',onPointerDown);
    };
  },[open]);
  const navLinkStyle={fontFamily:'Outfit, Inter, sans-serif',fontSize:13,fontWeight:500,color:C.textMid,display:'inline-flex',alignItems:'center',height:44,padding:'0 4px',textDecoration:'none'};
  const ctaPillStyle={display:'inline-flex',alignItems:'center',gap:6,fontFamily:'Outfit, Inter, sans-serif',fontSize:13,fontWeight:600,color:'#fff',padding:'0 18px',height:44,borderRadius:999,background:GRAD,border:'none',cursor:isAuthenticating?'progress':'pointer',opacity:isAuthenticating?0.7:1,whiteSpace:'nowrap'};
  return(
    <header style={{position:'fixed',top:0,left:0,right:0,zIndex:50,transition:'all 0.4s ease',background:s||open?'rgba(6,6,10,0.92)':'transparent',backdropFilter:s||open?'saturate(140%) blur(20px)':'none',borderBottom:s||open?`1px solid ${C.hairline}`:'1px solid transparent'}}>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'0 20px',display:'flex',alignItems:'center',justifyContent:'space-between',height:64,gap:12}}>
        <a href="/" className="ff-link" style={{fontFamily:'Outfit, Inter, sans-serif',fontSize:21,fontWeight:900,letterSpacing:'-0.012em',background:GRAD,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',flexShrink:0}}>FEELFLICK</a>
        {/* Desktop nav — hidden on mobile */}
        <nav className="ff-hide-on-mobile" style={{display:'flex',alignItems:'center',gap:24}}>
          {NAV_ITEMS.map(n=>
            <NavLink key={n.l} href={n.h} baseStyle={navLinkStyle}>{n.l}</NavLink>
          )}
        </nav>
        {/* Desktop CTA cluster — hidden on mobile */}
        <div className="ff-hide-on-mobile" style={{display:'flex',alignItems:'center',gap:14}}>
          <button type="button" onClick={signInWithGoogle} disabled={isAuthenticating} className="ff-link" style={navLinkStyle} aria-label="Sign in with Google">Sign in</button>
          <button type="button" onClick={signInWithGoogle} disabled={isAuthenticating} className="ff-link" style={ctaPillStyle} aria-label="Start free with Google">{isAuthenticating?'Opening Google…':'Start free →'}</button>
        </div>
        {/* Mobile: hamburger + start-free pill */}
        <div className="ff-show-on-mobile" style={{alignItems:'center',gap:10}}>
          <button type="button" onClick={signInWithGoogle} disabled={isAuthenticating} className="ff-link" style={{...ctaPillStyle,fontSize:13,padding:'0 16px',height:44}} aria-label="Start free with Google">{isAuthenticating?'…':'Start free'}</button>
          <button ref={hamburgerRef} type="button" onClick={()=>setOpen(v=>!v)} aria-label={open?'Close menu':'Open menu'} aria-expanded={open} aria-controls="ff-mobile-drawer" style={{width:44,height:44,display:'inline-flex',alignItems:'center',justifyContent:'center',background:'transparent',border:`1px solid ${C.hairline}`,borderRadius:999,color:C.text,cursor:'pointer',padding:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open
                ? <><path d="M6 6l12 12"/><path d="M18 6l-12 12"/></>
                : <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>}
            </svg>
          </button>
        </div>
      </div>
      {/* Mobile drawer — slides + fades in on mount via .ff-drawer-in animation.
          ref enables tap-outside detection + focus trap from the effect above. */}
      {open && (
        <div ref={drawerRef} id="ff-mobile-drawer" role="dialog" aria-modal="true" aria-label="Navigation menu" className="ff-show-on-mobile ff-drawer-in" style={{flexDirection:'column',padding:'12px 20px 32px',gap:4,borderTop:`1px solid ${C.hairline}`}}>
          {NAV_ITEMS.map(n=>
            <a key={n.l} href={n.h} onClick={()=>setOpen(false)} className="ff-link" style={{fontFamily:'Outfit, Inter, sans-serif',fontSize:16,fontWeight:500,color:C.textHi,display:'flex',alignItems:'center',minHeight:48,borderBottom:`1px solid ${C.hairline}`,textDecoration:'none'}}>{n.l}</a>
          )}
          <button type="button" onClick={()=>{ setOpen(false); signInWithGoogle(); }} disabled={isAuthenticating} className="ff-link" style={{fontFamily:'Outfit, Inter, sans-serif',fontSize:16,fontWeight:500,color:C.textMid,display:'flex',alignItems:'center',minHeight:48,background:'transparent',border:'none',padding:0,cursor:'pointer',textAlign:'left'}} aria-label="Sign in with Google">Sign in</button>
        </div>
      )}
    </header>
  );
}

// ── Hero ───────────────────────────────────────────────────
// Criterion-like: the pick is the hero. Editorial.
function Hero(){
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
            <button type="button" onClick={signInWithGoogle} disabled={isAuthenticating} className="ff-link" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'15px 28px',borderRadius:999,background:GRAD,color:'#fff',fontFamily:'Outfit, Inter, sans-serif',fontSize:14,fontWeight:600,boxShadow:'0 14px 32px -10px rgba(236,72,153,0.45)',border:'none',cursor:isAuthenticating?'progress':'pointer',opacity:isAuthenticating?0.7:1}} aria-label="Start free with Google">{isAuthenticating?'Opening Google…':'Start free →'}</button>
            <a href="#ritual" className="ff-link" style={{fontFamily:'Outfit, Inter, sans-serif',fontSize:14,fontWeight:500,color:C.textMid,letterSpacing:'0.01em',display:'inline-flex',alignItems:'center',minHeight:44,padding:'0 4px'}}>See how it works</a>
          </div>
        </div>
        <div key={p.title} className="ff-fade-swap" style={{position:'relative',padding:'12px 0'}}>
          <div className="ff-eyebrow" style={{color:p.moodHex,marginBottom:18,transition:'color 0.6s'}}>Tonight’s selection · {p.mood}</div>
          <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:32,alignItems:'flex-start'}}>
            <div style={{position:'relative'}}>
              <div aria-hidden style={{position:'absolute',inset:-18,borderRadius:14,background:`radial-gradient(ellipse at center,${p.moodHex}55,transparent 70%)`,filter:'blur(40px)',transition:'background 0.8s'}}/>
              <img key={p.poster} src={p.poster} alt={p.title} onError={(e)=>{e.currentTarget.style.display='none';e.currentTarget.parentNode.style.background=`linear-gradient(160deg, ${p.moodHex}cc 0%, ${p.moodHex}55 50%, ${p.moodHex}1a 100%)`;e.currentTarget.parentNode.dataset.fallback=p.title;}} style={{position:'relative',width:240,aspectRatio:'2/3',objectFit:'cover',borderRadius:5,boxShadow:`0 28px 56px -18px rgba(0,0,0,0.85),0 0 0 1px ${p.moodHex}33`,transition:'all 0.8s cubic-bezier(.2,.7,.2,1)'}}/>
              {/* Animated MatchRing — ported from home-v2/sections-top.jsx.
                  Same SVG gradient stroke + black backdrop the user sees
                  on /home Tonight's Pick (sized 60px to match). */}
              <MatchRing pct={p.match} size={60}/>
            </div>
            <div style={{paddingTop:8}}>
              {/* Hero film title rotates — kept as <div> (not <h2>) to preserve page heading hierarchy. */}
              <div key={p.title+'-t'} className="ff-d2" style={{fontSize:'clamp(32px,3.4vw,46px)',color:C.text,margin:0,animation:'ff-tw 0s'}}>{p.title}</div>
              <div style={{marginTop:10,display:'flex',alignItems:'center',gap:11,fontFamily:'Outfit, Inter, sans-serif',fontSize:12,color:C.textLow}}>
                <span style={{fontStyle:'italic'}}>{p.dir}</span>
                <span style={{color:C.textFaint}}>·</span>
                <span>{p.year}</span>
                <span style={{color:C.textFaint}}>·</span>
                <span>{p.runtime}</span>
              </div>
              {/* StreamingChip — ported from home-v2/sections-top.jsx.
                  Provider logo + label + name, exactly as the user
                  sees it on /home Tonight's Pick. */}
              <div style={{marginTop:14}}>
                <StreamingChip provider={p.streaming}/>
              </div>
              {/* Hero card blurb — regular weight 400, mood-hex left rule gives it editorial flair without italic body. */}
              <p className="ff-body" style={{marginTop:20,fontSize:16,fontWeight:400,color:C.textMid,lineHeight:1.65,maxWidth:340,paddingLeft:14,borderLeft:`2px solid ${p.moodHex}55`}}>{p.why}</p>
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

// ── The Problem (Apple "vs" split) ─────────────────────────
function TheProblem(){
  // Build a fake Netflix-style chaotic wall
  return(
    <section style={{position:'relative',padding:'160px 32px',borderTop:`1px solid ${C.hairline}`,background:C.bgPure,overflow:'hidden'}}>
      <div style={{maxWidth:1280,margin:'0 auto'}}>
        <Reveal>
          <div style={{textAlign:'center',marginBottom:80}}>
            <div className="ff-eyebrow" style={{marginBottom:28,color:C.purple}}>The problem</div>
            <h2 className="ff-d2" style={{fontSize:'clamp(44px,5.6vw,80px)',color:C.text,margin:'0 auto',textWrap:'balance',maxWidth:880}}>
              You spent <em className="ff-italic" style={{color:'#EF4444'}}>23 minutes</em> picking.{' '}<br/>You watched <em className="ff-italic" style={{color:C.purple}}>thirty.</em>
            </h2>
            <p className="ff-body" style={{fontSize:18,color:C.textMid,maxWidth:580,margin:'30px auto 0',lineHeight:1.6}}>
              Streaming taught us to scroll. Three rivals, twelve rows, four trailers, no decision. Most evenings end without a film — and the few that do, end with a film no-one quite wanted.
            </p>
          </div>
        </Reveal>
        <Reveal delay={150}>
          <div style={{maxWidth:1280,margin:'0 auto'}} className="ff-grid-2">
            {/* Left: chaos */}
            <div style={{position:'relative',borderRadius:14,overflow:'hidden',background:'#0c0a14',border:`1px solid ${C.hairline}`,padding:'24px 24px 0'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
                <div className="ff-eyebrow" style={{color:'#EF4444'}}>Streaming · Tonight</div>
                <div style={{fontFamily:'Outfit, Inter, sans-serif',fontSize:11,color:C.textFaint}}>scrolling · 23 min</div>
              </div>
              {/* Mocked grid of small posters with shimmer */}
              {[
                {label:'Trending today',blur:0,op:1},
                {label:'Because you watched anything',blur:0.5,op:0.78},
                {label:'Top 10 in your country',blur:1.2,op:0.55},
              ].map((row,idx)=>(
                <div key={idx} style={{marginBottom:10}}>
                  <div style={{fontFamily:'Outfit, Inter, sans-serif',fontSize:9.5,color:C.textFaint,marginBottom:5,fontWeight:500,letterSpacing:'0.04em'}}>{row.label}</div>
                  <div style={{display:'flex',gap:6,filter:`blur(${row.blur}px)`,opacity:row.op}}>
                    {Array.from({length:8}).map((_,i)=><div key={i} style={{flex:'none',width:72,height:100,borderRadius:3,background:`linear-gradient(135deg,rgba(255,255,255,${0.04+(i%3)*0.02}),rgba(255,255,255,0.02))`,border:`1px solid ${C.hairline}`}}/>)}
                  </div>
                </div>
              ))}
              <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,transparent 50%,#0c0a14 95%)',pointerEvents:'none'}}/>
              <div style={{position:'absolute',bottom:20,left:24,right:24,fontFamily:'Outfit, Inter, sans-serif',fontSize:13,color:C.textLow,fontStyle:'italic',lineHeight:1.5}}>
                “Maybe this one… no. What about… no. Let’s see what’s trending…”
              </div>
            </div>
            {/* Right: clarity */}
            <div style={{position:'relative',borderRadius:14,overflow:'hidden',background:`linear-gradient(160deg,${C.purple}10,transparent 80%)`,border:`1px solid ${C.purple}44`,padding:'32px 32px 36px',display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div className="ff-eyebrow" style={{color:C.purple}}>FeelFlick · Tonight</div>
                <div style={{fontFamily:'Outfit, Inter, sans-serif',fontSize:11,color:C.textFaint}}>deciding · 47 sec</div>
              </div>
              <div style={{margin:'auto',display:'flex',gap:24,alignItems:'flex-end',maxWidth:380}}>
                <div style={{position:'relative',width:140,aspectRatio:'2/3',borderRadius:4,boxShadow:`0 20px 40px -14px rgba(0,0,0,0.7),0 0 0 1px ${C.purple}33`,overflow:'hidden'}}>
                <Poster src={PICKS[3].poster} title={PICKS[3].title} accent={PICKS[3].moodHex} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
              </div>
                <div style={{paddingBottom:6}}>
                  <h3 style={{fontFamily:'Outfit',fontSize:22,fontWeight:400,color:C.text,margin:0,letterSpacing:'-0.02em'}}>{PICKS[3].title}</h3>
                  <div style={{fontFamily:'Outfit, Inter, sans-serif',fontSize:11,color:C.textLow,marginTop:4}}>{PICKS[3].dir} · {PICKS[3].year}</div>
                  <div className="ff-eyebrow" style={{color:C.purple,marginTop:14}}>94% match</div>
                </div>
              </div>
              <div className="ff-italic" style={{fontFamily:'Outfit',fontSize:13,color:C.textMid,fontStyle:'italic',lineHeight:1.5}}>
                “Forty-seven seconds. The right film. The rest of the night, yours.”
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── The Ritual (single combined section) ─────────────────────
function Ritual(){
  const steps=[
    {n:'01',k:'Read the room',t:'How you feel.',b:'Tap one to three moods from a constellation of eight.',visual:'mood'},
    {n:'02',k:'Fit the hour',t:'About the night.',b:"Time, company, energy. The engine bends to fit.",visual:'night'},
    {n:'03',k:'Receive the edition',t:'One film.',b:'One pick, with the article that makes its case. Two near-misses behind it if you want them.',visual:'pick'},
  ];
  return(
    <section id="ritual" style={{padding:'160px 32px',borderTop:`1px solid ${C.hairline}`,background:C.bgLight}}>
      <div style={{maxWidth:1280,margin:'0 auto'}}>
        <Reveal>
          <div style={{textAlign:'center',marginBottom:84}}>
            <div className="ff-eyebrow" style={{marginBottom:26,color:C.purple}}>The Ritual · Three steps</div>
            <h2 className="ff-d2" style={{fontSize:'clamp(44px,5.6vw,80px)',color:C.text,margin:0,textWrap:'balance',maxWidth:880,marginLeft:'auto',marginRight:'auto'}}>
              Three short steps. <em className="ff-italic" style={{color:C.textMid}}>One film.</em>
            </h2>
            <p className="ff-body" style={{marginTop:24,fontSize:18,color:C.textMid,maxWidth:560,marginLeft:'auto',marginRight:'auto',lineHeight:1.65}}>
              The whole flow takes a minute. The night gets back the rest.
            </p>
          </div>
        </Reveal>
        <div className="ff-grid-3">
          {steps.map((s,i)=>(
            <Reveal key={s.n} delay={i*150}>
              <div style={{position:'relative',padding:'32px 28px',borderRadius:14,background:'rgba(255,255,255,0.022)',border:`1px solid ${C.hairline}`,height:'100%',display:'flex',flexDirection:'column'}}>
                <div className="ff-eyebrow" style={{marginBottom:18,color:C.purple}}>{s.k} · {s.n}</div>
                <div style={{flex:'none',marginBottom:24}}>
                  {s.visual==='mood'&&<MoodVisual/>}
                  {s.visual==='night'&&<NightVisual/>}
                  {s.visual==='pick'&&<PickMiniVisual/>}
                </div>
                <h3 className="ff-d2" style={{fontSize:'clamp(26px,2.6vw,34px)',color:C.text,margin:0,letterSpacing:'-0.025em'}}>{s.t}</h3>
                <p className="ff-body" style={{marginTop:10,fontSize:16,color:C.textMid,lineHeight:1.6}}>{s.b}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
function MoodVisual(){
  const moods=[{n:'Tender',h:'#F472B6'},{n:'Tense',h:'#EF4444'},{n:'Slow-burn',h:'#A78BFA',on:true},{n:'Cerebral',h:'#7DD3FC'},{n:'Cozy',h:'#FBBF24'},{n:'Bittersweet',h:'#FB7185',on:true},{n:'Mythic',h:'#0EA5E9'},{n:'Restless',h:'#34D399'}];
  return(
    <div style={{position:'relative',aspectRatio:'4/3',borderRadius:10,background:C.bg,border:`1px solid ${C.hairline}`,padding:'22px 18px',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',gap:14}}>
      <div className="ff-eyebrow" style={{color:C.textLow}}>Your constellation</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center',maxWidth:260}}>
        {moods.map(m=><div key={m.n} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 9px',borderRadius:999,background:m.on?`${m.h}1f`:'rgba(255,255,255,0.03)',border:`1px solid ${m.on?m.h+'55':C.hairline}`,color:m.on?C.text:C.textLow,fontFamily:'Outfit, Inter, sans-serif',fontSize:10,fontWeight:m.on?600:500}}><span style={{width:4,height:4,borderRadius:999,background:m.h}}/>{m.n}</div>)}
      </div>
      <div className="ff-italic" style={{fontSize:14,color:C.textHi,fontStyle:'italic'}}>“The Long Goodbye”</div>
    </div>
  );
}
function NightVisual(){
  const rows=[{l:'Time',v:'~2 hrs'},{l:'With',v:'Just me'},{l:'Energy',v:'Settled'},{l:'Wanting',v:'To be moved'}];
  return(
    <div style={{aspectRatio:'4/3',borderRadius:10,background:C.bg,border:`1px solid ${C.hairline}`,padding:'22px 22px',display:'flex',flexDirection:'column',justifyContent:'center',gap:11}}>
      <div className="ff-eyebrow" style={{color:C.textLow,marginBottom:4}}>The night</div>
      {rows.map(r=><div key={r.l} style={{display:'flex',justifyContent:'space-between',paddingBottom:8,borderBottom:`1px solid ${C.hairline}`,fontFamily:'Outfit, Inter, sans-serif',fontSize:12}}><span style={{color:C.textLow}}>{r.l}</span><span style={{color:C.textHi,fontWeight:500}}>{r.v}</span></div>)}
    </div>
  );
}
function PickMiniVisual(){
  const p=PICKS[0];
  return(
    <div style={{aspectRatio:'4/3',borderRadius:10,background:C.bg,border:`1px solid ${C.hairline}`,padding:18,overflow:'hidden',display:'flex',gap:16,alignItems:'center'}}>
      <div style={{width:80,aspectRatio:'2/3',borderRadius:3,flex:'none',overflow:'hidden'}}>
        <Poster src={p.poster} title={p.title} accent={p.moodHex} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
      </div>
      <div style={{minWidth:0}}>
        {/* Match the /discover Stage 3 mood-line ("For your comfort reel
            night.") instead of the numbered-serial fiction. Past Lives is
            tender; the product would caption it the same way. */}
        <div className="ff-italic" style={{fontSize:11,color:C.textLow,marginBottom:6,fontStyle:'italic',letterSpacing:'0.01em'}}>For your tender night.</div>
        <h4 style={{fontFamily:'Outfit',fontSize:17,fontWeight:300,color:C.text,margin:0,letterSpacing:'-0.022em',lineHeight:1.1}}>{p.title}</h4>
        <div style={{fontFamily:'Outfit, Inter, sans-serif',fontSize:10,color:C.textLow,marginTop:3}}>{p.dir} · {p.year}</div>
        <p className="ff-italic" style={{fontSize:11,color:C.textMid,marginTop:10,fontStyle:'italic',lineHeight:1.4,paddingLeft:8,borderLeft:`1.5px solid ${p.moodHex}55`}}>A slow ache that lives in glances.</p>
      </div>
    </div>
  );
}

// ── The Film File (what every pick comes with) ────────────────
function FilmFile(){
  return(
    <section id="file" style={{padding:'200px 32px',borderTop:`1px solid ${C.hairline}`,background:C.bgPure,position:'relative'}}>
      <div aria-hidden style={{position:'absolute',inset:0,background:`radial-gradient(ellipse 80% 50% at 70% 30%,${C.purple}12,transparent 60%)`,pointerEvents:'none'}}/>
      <div style={{position:'relative',maxWidth:1280,margin:'0 auto'}}>
        <Reveal>
          <div style={{textAlign:'center',marginBottom:84}}>
            <div className="ff-eyebrow" style={{marginBottom:26,color:C.purple}}>The Film File</div>
            <h2 className="ff-d2" style={{fontSize:'clamp(44px,5.6vw,80px)',color:C.text,margin:'0 auto',textWrap:'balance',maxWidth:780}}>
              Every pick comes with <em className="ff-italic" style={{color:C.textMid}}>its case.</em>
            </h2>
            <p className="ff-body" style={{fontSize:18,color:C.textMid,maxWidth:560,margin:'24px auto 0',lineHeight:1.65}}>
              Not just a poster. A short essay, a critic’s line, a mood signature, and the best night to watch it.
            </p>
          </div>
        </Reveal>
        <Reveal delay={150}>
          <div className="ff-grid-feature" style={{padding:'48px 48px',borderRadius:18,background:'rgba(255,255,255,0.02)',border:`1px solid ${C.hairline}`}}>
            <div>
              <div style={{width:'100%',aspectRatio:'2/3',borderRadius:6,boxShadow:'0 28px 56px -18px rgba(0,0,0,0.85)',overflow:'hidden'}}>
                <Poster src={PICKS[2].poster} title={PICKS[2].title} accent={PICKS[2].moodHex} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
              </div>
            </div>
            <div>
              {/* Eyebrow structure ported verbatim from /movie/:id
                  sections-top.jsx — "Film File ━ Nº {id} · {year} ·
                  {language}". Same spacing, same purple rule, same
                  Outfit weights/letter-spacing. */}
              <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:22}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.28em',textTransform:'uppercase',color:C.purple}}>Film File</div>
                <div style={{flex:'none',height:1,width:36,background:C.purple,opacity:0.5}}/>
                <div style={{fontSize:10,fontWeight:500,letterSpacing:'0.18em',textTransform:'uppercase',color:C.textLow,fontFamily:'Outfit, Inter, sans-serif'}}>Nº 0152 · 2013 · English</div>
              </div>
              <h3 className="ff-d2" style={{fontSize:'clamp(36px,4.4vw,58px)',color:C.text,margin:0}}>{PICKS[2].title}</h3>
              <div style={{marginTop:10,display:'flex',alignItems:'center',gap:11,fontFamily:'Outfit, Inter, sans-serif',fontSize:13,color:C.textLow}}>
                <span style={{fontStyle:'italic'}}>directed by {PICKS[2].dir}</span>
                <span style={{color:C.textFaint}}>·</span><span>{PICKS[2].year}</span>
                <span style={{color:C.textFaint}}>·</span><span>{PICKS[2].runtime}</span>
              </div>
              {/* Best-watched daypart line — matches the real /movie/:id
                  hero pill (e.g. "BEST WATCHED · WEDNESDAY NIGHT · 132 QUIET
                  MINUTES" on Parasite). This is a shipped product feature
                  the landing was hiding. */}
              <div style={{marginTop:20,display:'inline-flex',alignItems:'center',gap:10,padding:'8px 14px',borderRadius:999,background:`${C.purple}14`,border:`1px solid ${C.purple}33`,color:C.purple}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                <span style={{fontFamily:'Outfit',fontSize:11,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase'}}>Best watched · Sunday night · 126 quiet minutes</span>
              </div>
              {/* Regular prose paragraph — drop-cap removed since product
                  FF Take on /movie/:id has no drop-cap treatment. */}
              <p className="ff-body" style={{marginTop:24,fontSize:16,color:C.textHi,lineHeight:1.65,maxWidth:520}}>
                {PICKS[2].why}
              </p>
              {/* Pull-quote — attribution removed since product FF Take is
                  unsigned. The voice is implied, not asserted. */}
              <blockquote style={{margin:'28px 0 0 0',padding:'14px 0 14px 20px',borderLeft:`2px solid ${C.purple}77`}}>
                <p style={{margin:0,fontFamily:'Outfit',fontSize:18,fontWeight:300,fontStyle:'italic',color:C.text,lineHeight:1.4,letterSpacing:'-0.012em'}}>“Tender enough to break your composure.”</p>
              </blockquote>
              {/* "Why for you" motifs panel removed in the landing trim
                  pass — the Hero card's mood label + the FF Take's
                  prose already convey motifs editorially, and the
                  product's `/movie/:id` Why This Is Your Kind of Film
                  section is where the user encounters the full chip
                  array. Keeping the Film File card focused on:
                  daypart + prose + pull-quote (three real artefacts). */}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── The Briefing — REMOVED ──────────────────────────────────
// The Briefing section was retired in the landing-alignment pass.
// Reasons: (1) the Hero card already demonstrates a single pick with
// match ring + streaming chip + mood label, so the Briefing's "look
// what one pick contains" pitch was redundant; (2) the 3-cards-visible
// layout didn't match /home's 1-hero + 2-alternates-via-dots reality;
// (3) the email-delivery half of "Briefing" isn't shipped yet
// (send-daily-briefings edge function + per-user timezone are
// outstanding work). The "Briefing" nav anchor has also been removed.
// If we ship the daily email delivery later, this section can be
// re-introduced — git history has the original implementation.

// ── DNA — your portrait ────────────────────────────────────────
function DNA(){
  const ref=useRef(null);
  const [iv,setIv]=useState(false);
  useEffect(()=>{const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setIv(true);o.disconnect();}},{threshold:0.3});if(ref.current)o.observe(ref.current);return()=>o.disconnect();},[]);
  const weights=[{n:'Tense',v:0.84,h:'#EF4444'},{n:'Slow-burn',v:0.78,h:'#A78BFA'},{n:'Bittersweet',v:0.71,h:'#FB7185'},{n:'Cerebral',v:0.68,h:'#7DD3FC'},{n:'Tender',v:0.62,h:'#F472B6'}];
  return(
    <section id="dna" ref={ref} style={{padding:'160px 32px',borderTop:`1px solid ${C.hairline}`}}>
      <div style={{maxWidth:1280,margin:'0 auto'}}>
        <Reveal>
          <div style={{textAlign:'center',marginBottom:80}}>
            <div className="ff-eyebrow" style={{marginBottom:26,color:C.purple}}>Your Cinematic DNA</div>
            <h2 className="ff-d2" style={{fontSize:'clamp(44px,5.6vw,80px)',color:C.text,margin:'0 auto',textWrap:'balance',maxWidth:880}}>
              A portrait you can only get <em className="ff-italic" style={{color:C.textMid}}>by watching.</em>
            </h2>
            <p className="ff-body" style={{fontSize:18,color:C.textMid,maxWidth:580,margin:'24px auto 0',lineHeight:1.65}}>
              Letterboxd has your ratings. Netflix has your watch time. FeelFlick has the shape of you — moods, directors, recurring motifs, the runtime you actually have patience for. Yours to share, or keep.
            </p>
          </div>
        </Reveal>
        <Reveal delay={150}>
          <div className="ff-grid-2" style={{padding:'48px 48px',borderRadius:16,background:'rgba(255,255,255,0.018)',border:`1px solid ${C.hairline}`}}>
            <div>
              <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:28}}>
                <div className="ff-eyebrow" style={{color:C.purple}}>An example DNA</div>
                <div className="ff-italic" style={{fontSize:11,color:C.textFaint,fontStyle:'italic'}}>Sharper with every watch</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                {weights.map((w,i)=>
                  <div key={w.n}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                      <span style={{fontFamily:'Outfit',fontSize:14,fontWeight:400,color:C.text}}>{w.n}</span>
                      <span style={{fontFamily:'Outfit, Inter, sans-serif',fontSize:12,color:C.textLow}}>{Math.round(w.v*100)}</span>
                    </div>
                    <div style={{height:2,background:'rgba(255,255,255,0.05)',borderRadius:999,overflow:'hidden'}}>
                      <div style={{height:'100%',width:iv?`${w.v*100}%`:'0%',background:w.h,opacity:0.85,transition:`width 1.6s cubic-bezier(.2,.7,.2,1) ${i*0.1+0.1}s`}}/>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:28}}>
              <div>
                <div className="ff-eyebrow" style={{color:C.textLow,marginBottom:14}}>Signature directors</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
                  {['Bong Joon-ho','Wong Kar-wai','Denis Villeneuve','Park Chan-wook'].map(d=>
                    <span key={d} style={{padding:'7px 13px',borderRadius:999,background:`${C.purple}10`,border:`1px solid ${C.purple}33`,fontFamily:'Outfit, Inter, sans-serif',fontSize:12.5,color:C.textMid}}>{d}</span>
                  )}
                </div>
              </div>
              <div>
                <div className="ff-eyebrow" style={{color:C.textLow,marginBottom:14}}>Recurring motifs</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
                  {['Class tension','Quiet endings','Two-handers','Long takes','Rain','Patient ache'].map(t=>
                    <span key={t} style={{padding:'7px 13px',borderRadius:999,background:'rgba(255,255,255,0.04)',border:`1px solid ${C.hairline}`,fontFamily:'Outfit, Inter, sans-serif',fontSize:12.5,color:C.textMid}}>{t}</span>
                  )}
                </div>
              </div>
              {/* Archetype row — the inside /profile renders 3 archetype
                  pills (e.g. "The Bittersweet / The Crowd-Pleaser /
                  The Earnest"). Real product feature the landing was
                  under-pitching. */}
              <div>
                <div className="ff-eyebrow" style={{color:C.textLow,marginBottom:14}}>Archetype</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
                  {['The Bittersweet','The Crowd-Pleaser','The Earnest'].map(t=>
                    <span key={t} style={{padding:'7px 13px',borderRadius:3,background:`${C.purple}18`,border:`1px solid ${C.purple}55`,fontFamily:'Outfit',fontSize:11,fontWeight:600,color:C.text,letterSpacing:'0.06em',textTransform:'uppercase'}}>{t}</span>
                  )}
                </div>
              </div>
              {/* Mixtape row — /profile renders a "YOUR MIXTAPE · 4 films
                  that define you" panel. Naming + 4-film count matches
                  the shipped derivation. */}
              <div>
                <div className="ff-eyebrow" style={{color:C.textLow,marginBottom:14}}>Mixtape · 4 films that define you</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
                  {['Past Lives','Her','Parasite','In the Mood for Love'].map(t=>
                    <span key={t} className="ff-italic" style={{padding:'7px 13px',borderRadius:999,background:'rgba(255,255,255,0.025)',border:`1px solid ${C.hairline}`,fontFamily:'Outfit',fontSize:12.5,fontStyle:'italic',color:C.text}}>{t}</span>
                  )}
                </div>
              </div>
              <div style={{paddingTop:24,borderTop:`1px solid ${C.hairline}`}}>
                <div className="ff-eyebrow" style={{color:C.textLow,marginBottom:10}}>Your signature line</div>
                <div className="ff-italic" style={{fontSize:21,fontStyle:'italic',color:C.text,letterSpacing:'-0.018em',lineHeight:1.3}}>“Films that earn their silences.”</div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Community / Taste twins ────────────────────────────────────
function Community(){
  // Twin bios + "last watched" lines mirror what /people + /home Taste
  // Twins actually display: a {mood + tone} signature derived from the
  // fingerprint, and a "Last · {film} · {ago}" caption pulled from the
  // user's most recent rating. Earlier landing copy used verbs ("Rated
  // ★★★★★", "Saved 3 films", "Started a list 'Refn-coded'") that
  // implied a per-twin activity feed the product doesn't surface.
  const twins=[
    {n:'Marco',match:87,h:'#A78BFA',mood:'Slow-burn + tender films',recent:'Last · Past Lives · 2d'},
    {n:'Priya',match:79,h:'#F472B6',mood:'Cerebral + late-night films',recent:'Last · Stalker · 1w'},
    {n:'Theo',match:64,h:'#7DD3FC',mood:'Crime + thriller films',recent:'Last · Drive · 4d'},
  ];
  return(
    <section style={{padding:'160px 32px',borderTop:`1px solid ${C.hairline}`,background:C.bgPure}}>
      <div style={{maxWidth:1280,margin:'0 auto'}}>
        <Reveal>
          <div className="ff-grid-2" style={{marginBottom:72}}>
            <h2 className="ff-d2" style={{fontSize:'clamp(44px,5.6vw,80px)',color:C.text,margin:0,textWrap:'balance'}}>
              Find the people whose ratings <em className="ff-italic" style={{color:C.textMid}}>actually predict yours.</em>
            </h2>
            <p className="ff-body" style={{fontSize:18,color:C.textMid,lineHeight:1.7,maxWidth:440}}>
              Compatibility, not popularity. We compute the overlap between your taste graph and theirs — and tell you how reliably their five-star agrees with what you’ll feel. <em style={{color:C.textLow,fontStyle:'italic'}}>Twins unlock once you’ve rated about a dozen films.</em>
            </p>
          </div>
        </Reveal>
        <Reveal>
          <div className="ff-eyebrow" style={{textAlign:'center',marginBottom:32,color:C.textFaint}}>Example taste twins · What yours might look like</div>
        </Reveal>
        <div className="ff-grid-3">
          {twins.map((t,i)=>
            <Reveal key={t.n} delay={i*100}>
              <article style={{padding:'30px 28px',borderRadius:14,background:'rgba(255,255,255,0.022)',border:`1px solid ${C.hairline}`}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24}}>
                  <div style={{position:'relative',width:48,height:48}}>
                    <div style={{position:'absolute',inset:-3,borderRadius:999,background:`conic-gradient(${t.h},${C.pink},${t.h})`,opacity:0.7}}/>
                    <div style={{position:'relative',width:48,height:48,borderRadius:999,background:C.bg,padding:2}}>
                      <div style={{width:'100%',height:'100%',borderRadius:999,background:t.h,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Outfit',fontWeight:700,color:C.bg,fontSize:17}}>{t.n.charAt(0)}</div>
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontFamily:'Outfit',fontSize:32,fontWeight:200,color:C.text,letterSpacing:'-0.045em',lineHeight:1}}>{t.match}<span style={{fontSize:13,color:C.textLow}}>%</span></div>
                    <div className="ff-eyebrow" style={{color:C.textFaint,marginTop:3}}>Match</div>
                  </div>
                </div>
                <div style={{fontFamily:'Outfit',fontSize:17,fontWeight:500,color:C.text}}>{t.n}</div>
                <div className="ff-italic" style={{fontFamily:'Outfit',fontSize:12,color:C.textLow,fontStyle:'italic',marginTop:3}}>{t.mood}</div>
                <div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${C.hairline}`,fontFamily:'Outfit, Inter, sans-serif',fontSize:12,color:C.textLow,lineHeight:1.5}}>{t.recent}</div>
              </article>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ────────────────────────────────────────────────────
function Pricing(){
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth();
  return(
    <section id="pricing" style={{padding:'160px 32px',borderTop:`1px solid ${C.hairline}`}}>
      <div style={{maxWidth:880,margin:'0 auto',textAlign:'center'}}>
        <Reveal>
          <div className="ff-eyebrow" style={{marginBottom:24,color:C.purple}}>Pricing</div>
          <h2 className="ff-d2" style={{fontSize:'clamp(44px,5.6vw,80px)',color:C.text,margin:0}}>
            <em className="ff-italic" style={{color:C.textMid}}>Free.</em> Forever.
          </h2>
          <p className="ff-body" style={{marginTop:22,fontSize:16,color:C.textMid,lineHeight:1.65}}>One price. No paid tier. The whole engine — picks, DNA, the Film File — for everyone. <em style={{color:C.textLow,fontStyle:'italic'}}>Early signups get a Founding Member badge — same product, slightly better story.</em></p>
        </Reveal>
        <Reveal delay={150}>
          {/* Inner price card capped at 480 so it stays focused inside the 880 outer column. */}
          <div style={{maxWidth:480,margin:'56px auto 0',padding:'48px 44px',borderRadius:16,background:`linear-gradient(160deg,${C.purple}15,transparent 80%)`,border:`1px solid ${C.purple}55`,position:'relative',overflow:'hidden'}}>
            <div aria-hidden style={{position:'absolute',top:-40,right:-40,width:200,height:200,borderRadius:999,background:`radial-gradient(circle,${C.purple}30,transparent 70%)`,filter:'blur(30px)'}}/>
            <div style={{position:'relative'}}>
              <div className="ff-eyebrow" style={{color:C.textLow,marginBottom:18}}>The whole thing</div>
              <div style={{display:'flex',alignItems:'baseline',justifyContent:'center',gap:8,marginBottom:32}}>
                <span style={{fontFamily:'Outfit',fontSize:84,fontWeight:200,color:C.text,letterSpacing:'-0.055em',lineHeight:0.9}}>$0</span>
                <span className="ff-italic" style={{fontSize:14,color:C.textLow,fontStyle:'italic'}}>/ forever</span>
              </div>
              <ul style={{margin:0,padding:0,listStyle:'none',display:'flex',flexDirection:'column',gap:14,textAlign:'left',maxWidth:380,marginLeft:'auto',marginRight:'auto'}}>
                {['Unlimited picks, any hour','Cinematic DNA, forever','Every film with its own Film File','No ads. No upsells. No algorithm tax.'].map(t=>
                  <li key={t} style={{display:'flex',alignItems:'center',gap:12,fontFamily:'Outfit, Inter, sans-serif',fontSize:16,color:C.textMid}}>
                    <span style={{width:18,height:18,borderRadius:999,background:`${C.purple}20`,color:C.purple,display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>{t}
                  </li>
                )}
              </ul>
              <button type="button" onClick={signInWithGoogle} disabled={isAuthenticating} className="ff-link" style={{display:'block',width:'100%',textAlign:'center',marginTop:36,padding:'15px 22px',borderRadius:999,background:GRAD,color:'#fff',fontFamily:'Outfit, Inter, sans-serif',fontSize:14,fontWeight:600,border:'none',cursor:isAuthenticating?'progress':'pointer',opacity:isAuthenticating?0.7:1}} aria-label="Start free with Google">{isAuthenticating?'Opening Google…':'Start free →'}</button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Final CTA ──────────────────────────────────────────────────
function FinalCTA(){
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth();
  return(
    <section id="start" style={{position:'relative',padding:'200px 32px',borderTop:`1px solid ${C.hairline}`,background:C.bgPure,overflow:'hidden'}}>
      <Stars tint={C.purple} count={80}/>
      <div style={{position:'relative',maxWidth:880,margin:'0 auto',textAlign:'center'}}>
        <Reveal>
          <div className="ff-eyebrow" style={{color:C.purple,marginBottom:32}}>Stop scrolling. Start watching.</div>
        </Reveal>
        <Reveal delay={150}>
          <h2 className="ff-d1" style={{fontSize:'clamp(72px,11vw,160px)',color:C.text,margin:0}}>
            Tonight is <em className="ff-italic" style={{color:C.textMid}}>yours.</em>
          </h2>
        </Reveal>
        <Reveal delay={300}>
          {/* FinalCTA sub — upright weight 400 at ceremonial size carries the page-close gravitas without italic. */}
          <p className="ff-body" style={{fontSize:'clamp(17px,1.9vw,22px)',fontWeight:400,color:C.textMid,lineHeight:1.5,maxWidth:540,margin:'36px auto 0'}}>
            One film, for the way you feel. Open it anytime.
          </p>
        </Reveal>
        <Reveal delay={450}>
          <button type="button" onClick={signInWithGoogle} disabled={isAuthenticating} className="ff-link" style={{display:'inline-flex',alignItems:'center',gap:10,marginTop:52,padding:'16px 32px',borderRadius:999,background:GRAD,color:'#fff',fontFamily:'Outfit, Inter, sans-serif',fontSize:14.5,fontWeight:600,boxShadow:'0 18px 40px -10px rgba(236,72,153,0.5)',border:'none',cursor:isAuthenticating?'progress':'pointer',opacity:isAuthenticating?0.7:1}} aria-label="Begin with Google">
            {isAuthenticating?'Opening Google…':'Begin'} <span>→</span>
          </button>
        </Reveal>
        <Reveal delay={550}>
          <div className="ff-eyebrow" style={{marginTop:24,color:C.textFaint}}>Free · No credit card · No ads</div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────
// Each link maps to a real route. Pages that don't exist yet are intentionally
// omitted — we don't advertise vapor (e.g. Manifesto, Press, Careers, Contact
// are removed until they ship). React Router <Link> is used for in-app routes
// and plain <a> for external/email targets.
function FooterLink({to, href, children}){
  // 44px tap target via inline-flex + min-height; padding-right gives spacing
  // between adjacent tappable links without affecting visual rhythm.
  const style = {fontFamily:'Outfit, Inter, sans-serif',fontSize:14,color:C.textMid,textDecoration:'none',transition:'color 0.2s ease',display:'inline-flex',alignItems:'center',minHeight:44,paddingRight:12};
  if(href){
    return <a href={href} style={style} onMouseEnter={e=>e.currentTarget.style.color=C.textHi} onMouseLeave={e=>e.currentTarget.style.color=C.textMid}>{children}</a>;
  }
  return <Link to={to} style={style} onMouseEnter={e=>e.currentTarget.style.color=C.textHi} onMouseLeave={e=>e.currentTarget.style.color=C.textMid}>{children}</Link>;
}
function Footer(){
  const columns = [
    {t:'Product', items:[
      {label:'Discover', to:'/discover'},
      {label:'Browse',   to:'/browse'},
      {label:'About',    to:'/about'},
    ]},
    {t:'Legal', items:[
      {label:'Privacy',  to:'/privacy'},
      {label:'Terms',    to:'/terms'},
      {label:'Contact',  href:'mailto:hello@feelflick.com'},
    ]},
  ];
  return(
    <footer style={{padding:'72px 32px 84px',borderTop:`1px solid ${C.hairline}`}}>
      <div className="ff-grid-footer" style={{maxWidth:1280,margin:'0 auto',gridTemplateColumns:'2fr 1fr 1fr'}}>
        <div>
          <div style={{fontFamily:'Outfit, Inter, sans-serif',fontSize:20,fontWeight:900,letterSpacing:'-0.012em',background:GRAD,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>FEELFLICK</div>
          <p className="ff-italic" style={{marginTop:14,fontFamily:'Outfit, Inter, sans-serif',fontSize:13,color:C.textLow,lineHeight:1.6,maxWidth:340,fontStyle:'italic'}}>The right film. Right now.</p>
        </div>
        {columns.map(c=>
          <div key={c.t}>
            <div className="ff-eyebrow" style={{color:C.textLow,marginBottom:18}}>{c.t}</div>
            <ul style={{margin:0,padding:0,listStyle:'none',display:'flex',flexDirection:'column',gap:11}}>
              {c.items.map(item =>
                <li key={item.label}><FooterLink to={item.to} href={item.href}>{item.label}</FooterLink></li>
              )}
            </ul>
          </div>
        )}
      </div>
      <div style={{maxWidth:1280,margin:'56px auto 0',paddingTop:28,borderTop:`1px solid ${C.hairline}`,display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12,fontFamily:'Outfit, Inter, sans-serif',fontSize:11.5,color:C.textFaint}}>
        <span>© FeelFlick · {new Date().getFullYear()}</span>
        <span className="ff-italic" style={{fontStyle:'italic'}}>Made for the patient.</span>
      </div>
    </footer>
  );
}

export default function Landing(){
  usePageMeta({
    title: 'FeelFlick — The right film. Right now.',
    description: "Films that know you. Tuned to your mood, your taste, and everything you've ever loved on screen. Free forever.",
    url: 'https://app.feelflick.com/',
  })
  // Opt motion-enabled clients into Reveal's hide-then-fade-in animation.
  // Crawlers, screen readers reading the static DOM, and prefers-reduced-motion
  // users never receive this class — so they see the page already-visible.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    document.documentElement.classList.add('with-motion')
    return () => document.documentElement.classList.remove('with-motion')
  }, [])
  return(
    <div>
      {/* Keyboard-only skip link. Invisible until focused; jumps past the fixed header + nav. */}
      <a href="#main" className="ff-skip">Skip to content</a>
      <Header/>
      <main id="main">
        <Hero/>
        <TheProblem/>
        <Ritual/>
        <FilmFile/>
        <DNA/>
        <Community/>
        <Pricing/>
        <FinalCTA/>
      </main>
      <Footer/>
    </div>
  );
}
