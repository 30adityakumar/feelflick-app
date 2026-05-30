import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useGoogleAuth } from '@/shared/hooks/useGoogleAuth'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { C, HP_GRAD as GRAD } from '@/shared/lib/tokens'
import './landing.css'
// Posters render at <=240px wide on the landing — w342 is the right TMDB size.
const TMDB=(p)=>`https://image.tmdb.org/t/p/w342${p}`;

const PICKS=[
  {title:'Past Lives',year:2023,runtime:'1h 45m',dir:'Celine Song',poster:TMDB('/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg'),mood:'Tender',moodHex:'#F472B6',why:'Two strangers in a New York bar — but they were children once, in Seoul. A slow ache that lives in glances.'},
  {title:'Parasite',year:2019,runtime:'2h 12m',dir:'Bong Joon-ho',poster:TMDB('/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg'),mood:'Tense',moodHex:'#EF4444',why:'A grift becomes architecture. Bong builds his cage room by room until the gate clicks shut.'},
  {title:'Her',year:2013,runtime:'2h 6m',dir:'Spike Jonze',poster:TMDB('/eCOtqtfvn7mxGl6nfmq4b1exJRc.jpg'),mood:'Bittersweet',moodHex:'#FB7185',why:'Near-future Los Angeles. A man falls for an operating system. Tender, lonely, alive in every frame — Phoenix at his most undone.'},
  {title:'Interstellar',year:2014,runtime:'2h 49m',dir:'Christopher Nolan',poster:TMDB('/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'),mood:'Mythic',moodHex:'#0EA5E9',why:'A father leaves Earth to save it. Time bends around love. Nolan at his largest scale and his most tender.'},
  {title:'PK',year:2014,runtime:'2h 33m',dir:'Rajkumar Hirani',poster:TMDB('/uqoAHhuKZnWxzXbXSUycgpLPmUW.jpg'),mood:'Thoughtful',moodHex:'#FBBF24',why:'An alien lands in Rajasthan and starts asking questions no priest can answer. Aamir Khan, wide-eyed, dismantling certainty.'},
  {title:'The Truman Show',year:1998,runtime:'1h 43m',dir:'Peter Weir',poster:TMDB('/vuza0WqY239yBXOadKlGwJsZJFE.jpg'),mood:'Restless',moodHex:'#34D399',why:'A man discovers his entire life is a televised set. Jim Carrey, unsettlingly tender, pushing against the walls of a manufactured world.'},
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
  { l:'Briefing',  h:'#briefing' },
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
  const navLinkStyle={fontFamily:'Inter',fontSize:13,fontWeight:500,color:C.textMid,display:'inline-flex',alignItems:'center',height:44,padding:'0 4px',textDecoration:'none'};
  const ctaPillStyle={display:'inline-flex',alignItems:'center',gap:6,fontFamily:'Inter',fontSize:13,fontWeight:600,color:'#fff',padding:'0 18px',height:44,borderRadius:999,background:GRAD,border:'none',cursor:isAuthenticating?'progress':'pointer',opacity:isAuthenticating?0.7:1,whiteSpace:'nowrap'};
  return(
    <header style={{position:'fixed',top:0,left:0,right:0,zIndex:50,transition:'all 0.4s ease',background:s||open?'rgba(6,6,10,0.92)':'transparent',backdropFilter:s||open?'saturate(140%) blur(20px)':'none',borderBottom:s||open?`1px solid ${C.hairline}`:'1px solid transparent'}}>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'0 20px',display:'flex',alignItems:'center',justifyContent:'space-between',height:64,gap:12}}>
        <a href="/" className="ff-link" style={{fontFamily:'Inter',fontSize:21,fontWeight:900,letterSpacing:'-0.012em',background:GRAD,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',flexShrink:0}}>FEELFLICK</a>
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
            <a key={n.l} href={n.h} onClick={()=>setOpen(false)} className="ff-link" style={{fontFamily:'Inter',fontSize:16,fontWeight:500,color:C.textHi,display:'flex',alignItems:'center',minHeight:48,borderBottom:`1px solid ${C.hairline}`,textDecoration:'none'}}>{n.l}</a>
          )}
          <button type="button" onClick={()=>{ setOpen(false); signInWithGoogle(); }} disabled={isAuthenticating} className="ff-link" style={{fontFamily:'Inter',fontSize:16,fontWeight:500,color:C.textMid,display:'flex',alignItems:'center',minHeight:48,background:'transparent',border:'none',padding:0,cursor:'pointer',textAlign:'left'}} aria-label="Sign in with Google">Sign in</button>
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
                <div style={{fontFamily:'Inter',fontSize:11,color:C.textFaint}}>scrolling · 23 min</div>
              </div>
              {/* Mocked grid of small posters with shimmer */}
              {[
                {label:'Trending today',blur:0,op:1},
                {label:'Because you watched anything',blur:0.5,op:0.78},
                {label:'Top 10 in your country',blur:1.2,op:0.55},
              ].map((row,idx)=>(
                <div key={idx} style={{marginBottom:10}}>
                  <div style={{fontFamily:'Inter',fontSize:9.5,color:C.textFaint,marginBottom:5,fontWeight:500,letterSpacing:'0.04em'}}>{row.label}</div>
                  <div style={{display:'flex',gap:6,filter:`blur(${row.blur}px)`,opacity:row.op}}>
                    {Array.from({length:8}).map((_,i)=><div key={i} style={{flex:'none',width:72,height:100,borderRadius:3,background:`linear-gradient(135deg,rgba(255,255,255,${0.04+(i%3)*0.02}),rgba(255,255,255,0.02))`,border:`1px solid ${C.hairline}`}}/>)}
                  </div>
                </div>
              ))}
              <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,transparent 50%,#0c0a14 95%)',pointerEvents:'none'}}/>
              <div style={{position:'absolute',bottom:20,left:24,right:24,fontFamily:'Inter',fontSize:13,color:C.textLow,fontStyle:'italic',lineHeight:1.5}}>
                “Maybe this one… no. What about… no. Let’s see what’s trending…”
              </div>
            </div>
            {/* Right: clarity */}
            <div style={{position:'relative',borderRadius:14,overflow:'hidden',background:`linear-gradient(160deg,${C.purple}10,transparent 80%)`,border:`1px solid ${C.purple}44`,padding:'32px 32px 36px',display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div className="ff-eyebrow" style={{color:C.purple}}>FeelFlick · Tonight</div>
                <div style={{fontFamily:'Inter',fontSize:11,color:C.textFaint}}>deciding · 47 sec</div>
              </div>
              <div style={{margin:'auto',display:'flex',gap:24,alignItems:'flex-end',maxWidth:380}}>
                <div style={{position:'relative',width:140,aspectRatio:'2/3',borderRadius:4,boxShadow:`0 20px 40px -14px rgba(0,0,0,0.7),0 0 0 1px ${C.purple}33`,overflow:'hidden'}}>
                <Poster src={PICKS[3].poster} title={PICKS[3].title} accent={PICKS[3].moodHex} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
              </div>
                <div style={{paddingBottom:6}}>
                  <h3 style={{fontFamily:'Outfit',fontSize:22,fontWeight:400,color:C.text,margin:0,letterSpacing:'-0.02em'}}>{PICKS[3].title}</h3>
                  <div style={{fontFamily:'Inter',fontSize:11,color:C.textLow,marginTop:4}}>{PICKS[3].dir} · {PICKS[3].year}</div>
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
    {n:'03',k:'Receive the edition',t:'One film.',b:'Not three options. One pick, with the article that makes its case.',visual:'pick'},
  ];
  return(
    <section id="ritual" style={{padding:'160px 32px',borderTop:`1px solid ${C.hairline}`,background:C.bgLight}}>
      <div style={{maxWidth:1280,margin:'0 auto'}}>
        <Reveal>
          <div style={{textAlign:'center',marginBottom:84}}>
            <div className="ff-eyebrow" style={{marginBottom:26,color:C.purple}}>The Ritual · Three steps</div>
            <h2 className="ff-d2" style={{fontSize:'clamp(44px,5.6vw,80px)',color:C.text,margin:0,textWrap:'balance',maxWidth:880,marginLeft:'auto',marginRight:'auto'}}>
              Three short questions. <em className="ff-italic" style={{color:C.textMid}}>One film.</em>
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
        {moods.map(m=><div key={m.n} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 9px',borderRadius:999,background:m.on?`${m.h}1f`:'rgba(255,255,255,0.03)',border:`1px solid ${m.on?m.h+'55':C.hairline}`,color:m.on?C.text:C.textLow,fontFamily:'Inter',fontSize:10,fontWeight:m.on?600:500}}><span style={{width:4,height:4,borderRadius:999,background:m.h}}/>{m.n}</div>)}
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
      {rows.map(r=><div key={r.l} style={{display:'flex',justifyContent:'space-between',paddingBottom:8,borderBottom:`1px solid ${C.hairline}`,fontFamily:'Inter',fontSize:12}}><span style={{color:C.textLow}}>{r.l}</span><span style={{color:C.textHi,fontWeight:500}}>{r.v}</span></div>)}
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
        <div className="ff-eyebrow" style={{color:C.textLow,marginBottom:6}}>Edition Nº 142</div>
        <h4 style={{fontFamily:'Outfit',fontSize:17,fontWeight:300,color:C.text,margin:0,letterSpacing:'-0.022em',lineHeight:1.1}}>{p.title}</h4>
        <div style={{fontFamily:'Inter',fontSize:10,color:C.textLow,marginTop:3}}>{p.dir} · {p.year}</div>
        <p className="ff-italic" style={{fontSize:11,color:C.textMid,marginTop:10,fontStyle:'italic',lineHeight:1.4,paddingLeft:8,borderLeft:`1.5px solid ${p.moodHex}55`}}>A slow ache that lives in glances.</p>
      </div>
    </div>
  );
}

// ── The Film File (what every pick comes with) ────────────────
function FilmFile(){
  const motifs=['Class tension','Quiet endings','Slow burn','Two-handers'];
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
              Not just a poster. A short essay, a critic’s line, the mood arc, what to drink, and one film we’d skip tonight — and why.
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
              <div className="ff-eyebrow" style={{color:C.textLow,marginBottom:18}}>The Feature · p. 01</div>
              <h3 className="ff-d2" style={{fontSize:'clamp(36px,4.4vw,58px)',color:C.text,margin:0}}>{PICKS[2].title}</h3>
              <div style={{marginTop:10,display:'flex',alignItems:'center',gap:11,fontFamily:'Inter',fontSize:13,color:C.textLow}}>
                <span style={{fontStyle:'italic'}}>directed by {PICKS[2].dir}</span>
                <span style={{color:C.textFaint}}>·</span><span>{PICKS[2].year}</span>
                <span style={{color:C.textFaint}}>·</span><span>{PICKS[2].runtime}</span>
              </div>
              <p className="ff-body" style={{marginTop:24,fontSize:16,color:C.textHi,lineHeight:1.65,maxWidth:520}}>
                <span className="ff-italic" style={{float:'left',fontSize:64,lineHeight:0.85,color:C.purple,marginRight:10,marginTop:6,marginBottom:-4,letterSpacing:'-0.06em',fontWeight:300}}>{PICKS[2].why.charAt(0)}</span>
                {PICKS[2].why.slice(1)}
              </p>
              <blockquote style={{margin:'28px 0 0 0',padding:'14px 0 14px 20px',borderLeft:`2px solid ${C.purple}77`}}>
                <p style={{margin:0,fontFamily:'Outfit',fontSize:18,fontWeight:300,fontStyle:'italic',color:C.text,lineHeight:1.4,letterSpacing:'-0.012em'}}>“Tender enough to break your composure.”</p>
                <div className="ff-eyebrow" style={{color:C.textLow,marginTop:8}}>— FeelFlick Editors</div>
              </blockquote>
              <div style={{marginTop:28,display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                <div style={{padding:'14px 16px',borderRadius:8,background:'rgba(255,255,255,0.022)',border:`1px solid ${C.hairline}`}}>
                  <div className="ff-eyebrow" style={{color:C.purple,marginBottom:8}}>Pairs with</div>
                  <div style={{fontFamily:'Inter',fontSize:12.5,color:C.textMid,fontStyle:'italic',lineHeight:1.55}}>A glass of red. Ninety minutes of nothing else.</div>
                </div>
                <div style={{padding:'14px 16px',borderRadius:8,background:'rgba(255,255,255,0.022)',border:`1px solid ${C.hairline}`}}>
                  <div className="ff-eyebrow" style={{color:C.purple,marginBottom:8}}>Why for you</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{motifs.map(t=><span key={t} style={{padding:'3px 9px',borderRadius:999,background:`${C.purple}10`,border:`1px solid ${C.purple}33`,fontFamily:'Inter',fontSize:11,color:C.textMid}}>{t}</span>)}</div>
                </div>
              </div>
              {/* Emotional arc + skip tonight — now below right content */}
              <div style={{marginTop:28,display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:20,alignItems:'stretch'}}>
                <div style={{padding:'18px 20px',borderRadius:10,background:'rgba(255,255,255,0.022)',border:`1px solid ${C.hairline}`}}>
                  <div className="ff-eyebrow" style={{color:C.textLow,marginBottom:14}}>Emotional arc · 126 min</div>
                  <svg viewBox="0 0 280 56" width="100%" height="56">
                    <defs>
                      <linearGradient id="arc-g" x1="0" x2="1"><stop offset="0%" stopColor={C.purple} stopOpacity="0.6"/><stop offset="100%" stopColor={C.pink} stopOpacity="0.95"/></linearGradient>
                      <linearGradient id="arc-f" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={C.purple} stopOpacity="0.22"/><stop offset="100%" stopColor={C.purple} stopOpacity="0"/></linearGradient>
                    </defs>
                    <path d="M4,42 L34,38 L62,32 L92,26 L120,22 L150,18 L178,14 L210,12 L240,18 L276,22 L276,52 L4,52 Z" fill="url(#arc-f)"/>
                    <path d="M4,42 L34,38 L62,32 L92,26 L120,22 L150,18 L178,14 L210,12 L240,18 L276,22" fill="none" stroke="url(#arc-g)" strokeWidth="1.8" strokeLinecap="round"/>
                    <circle cx="210" cy="12" r="2.6" fill={C.pink}/>
                  </svg>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:9.5,color:C.textFaint,fontFamily:'Outfit',letterSpacing:'0.08em',textTransform:'uppercase'}}><span>Quiet</span><span style={{color:C.pink}}>Peak</span><span>Bittersweet</span></div>
                </div>
                <div style={{padding:'14px 18px',borderRadius:10,background:`${C.amber}0a`,border:`1px solid ${C.amber}33`,display:'flex',flexDirection:'column',justifyContent:'center'}}>
                  <div className="ff-eyebrow" style={{color:C.amber,marginBottom:6}}>Skip tonight</div>
                  <div style={{fontFamily:'Inter',fontSize:13,color:C.textMid,fontStyle:'italic'}}>Hereditary. Your settled energy will resent it.</div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── The Briefing ──────────────────────────────────────────────
function Briefing(){
  return(
    <section id="briefing" style={{padding:'160px 32px',borderTop:`1px solid ${C.hairline}`,background:C.bgLight}}>
      <div style={{maxWidth:1280,margin:'0 auto'}}>
        <Reveal>
          <div className="ff-grid-2" style={{marginBottom:72}}>
            <div>
              <div className="ff-eyebrow" style={{marginBottom:24,color:C.purple}}>The Briefing</div>
              <h2 className="ff-d2" style={{fontSize:'clamp(44px,5.6vw,80px)',color:C.text,margin:0,textWrap:'balance'}}>
                Or get it <em className="ff-italic" style={{color:C.textMid}}>served.</em>
              </h2>
            </div>
            <p className="ff-body" style={{fontSize:18,color:C.textMid,lineHeight:1.7,maxWidth:480}}>
              Some nights you want to ask. Others you want it ready. Turn on the Briefing and three picks arrive every evening — tonight’s selection, a mood-match, and one from deep in your DNA. For the evenings you don’t want to think.
            </p>
          </div>
        </Reveal>
        <Reveal delay={150}>
          <div style={{borderRadius:14,background:'rgba(255,255,255,0.022)',border:`1px solid ${C.hairline}`,padding:'40px 48px',position:'relative',overflow:'hidden'}}>
            <div aria-hidden style={{position:'absolute',inset:0,background:`radial-gradient(ellipse 50% 30% at 20% 0%,${C.purple}14,transparent 60%)`,pointerEvents:'none'}}/>
            <div style={{position:'relative',display:'flex',alignItems:'center',gap:14,paddingBottom:24,borderBottom:`1px solid ${C.hairline}`}}>
              <div className="ff-eyebrow" style={{color:C.purple}}>FeelFlick · The Briefing</div>
              <div style={{height:1,width:28,background:C.purple,opacity:0.5}}/>
              <div className="ff-eyebrow" style={{color:C.textLow}}>An example issue</div>
              <div style={{flex:1}}/>
              <div className="ff-italic" style={{fontSize:13,color:C.textLow,fontStyle:'italic'}}>What yours might look like</div>
            </div>
            <div style={{position:'relative',marginTop:40}} className="ff-grid-3">
              {[PICKS[1], PICKS[3], PICKS[5]].map((p,i)=>(
                <article key={i}>
                  <div style={{position:'relative',marginBottom:18}}>
                    <div style={{width:'100%',aspectRatio:'2/3',borderRadius:5,boxShadow:'0 20px 40px -16px rgba(0,0,0,0.7)',overflow:'hidden'}}>
                      <Poster src={p.poster} title={p.title} accent={p.moodHex} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                    </div>
                    <div style={{position:'absolute',top:10,left:10,padding:'4px 8px',borderRadius:3,background:'rgba(0,0,0,0.78)',backdropFilter:'blur(8px)',border:`1px solid ${p.moodHex}44`,fontFamily:'Outfit',fontSize:9.5,fontWeight:700,color:p.moodHex,letterSpacing:'0.06em'}}>{[94,88,82][i]}% MATCH</div>
                  </div>
                  <div className="ff-eyebrow" style={{color:p.moodHex,marginBottom:9}}>0{i+1} · {['Tonight\'s pick','Mood match','From your DNA'][i]}</div>
                  <h3 style={{fontFamily:'Outfit',fontSize:22,fontWeight:400,color:C.text,margin:'0 0 6px 0',letterSpacing:'-0.02em'}}>{p.title}</h3>
                  <div style={{fontFamily:'Inter',fontSize:11.5,color:C.textLow,marginBottom:14}}>{p.year} · {p.dir}</div>
                  <p className="ff-body" style={{margin:0,fontSize:13,fontWeight:400,color:C.textMid,lineHeight:1.6}}>{p.why.split('. ')[0]}.</p>
                </article>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

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
              Letterboxd has your ratings. Netflix has your watch time. FeelFlick has the shape of you — moods, directors, recurring motifs, the runtime you actually have patience for. Visible only to you.
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
                      <span style={{fontFamily:'Inter',fontSize:12,color:C.textLow}}>{Math.round(w.v*100)}</span>
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
                    <span key={d} style={{padding:'7px 13px',borderRadius:999,background:`${C.purple}10`,border:`1px solid ${C.purple}33`,fontFamily:'Inter',fontSize:12.5,color:C.textMid}}>{d}</span>
                  )}
                </div>
              </div>
              <div>
                <div className="ff-eyebrow" style={{color:C.textLow,marginBottom:14}}>Recurring motifs</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
                  {['Class tension','Quiet endings','Two-handers','Long takes','Rain','Patient ache'].map(t=>
                    <span key={t} style={{padding:'7px 13px',borderRadius:999,background:'rgba(255,255,255,0.04)',border:`1px solid ${C.hairline}`,fontFamily:'Inter',fontSize:12.5,color:C.textMid}}>{t}</span>
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
  const twins=[
    {n:'Marco',match:87,h:'#A78BFA',mood:'Slow-burn obsessed',recent:'Rated Past Lives ★★★★★ · 2 days ago'},
    {n:'Priya',match:79,h:'#F472B6',mood:'Late-night cerebral',recent:'Saved 3 films · last week'},
    {n:'Theo',match:64,h:'#7DD3FC',mood:'Crime + thriller',recent:'Started a list · "Refn-coded"'},
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
              Not popularity. Compatibility. We compute the overlap between your taste graph and theirs — and tell you how reliably their five-star agrees with what you’ll feel.
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
                <div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${C.hairline}`,fontFamily:'Inter',fontSize:12,color:C.textLow,lineHeight:1.5}}>{t.recent}</div>
              </article>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

// ── M.'s letter ────────────────────────────────────────────────
function MLetter(){
  return(
    <section style={{padding:'160px 32px',borderTop:`1px solid ${C.hairline}`,background:C.bgPaper}}>
      <div style={{maxWidth:880,margin:'0 auto'}}>
        <Reveal>
          <div style={{textAlign:'center',marginBottom:48}}>
            <div className="ff-eyebrow" style={{marginBottom:14,color:C.purple}}>Meet M., your curator</div>
            <p className="ff-body" style={{fontSize:18,color:C.textMid,maxWidth:520,marginLeft:'auto',marginRight:'auto',lineHeight:1.6}}>
              The engine has a voice. <em style={{color:C.textHi}}>M.</em> reads your taste, the time of day, and what you logged last week — then writes a short note with the pick.
            </p>
          </div>
        </Reveal>
        <Reveal delay={150}>
          {/* Inner card capped at 720 so the letter body reads at ~67ch (dyslexia comfort range), inside the 880-wide section column. */}
          <div style={{position:'relative',maxWidth:720,margin:'0 auto',padding:'56px 56px',borderRadius:16,background:'rgba(15,12,24,0.78)',border:`1px solid ${C.hairline}`,boxShadow:'0 32px 60px -20px rgba(0,0,0,0.7)'}}>
            <div aria-hidden style={{position:'absolute',top:-26,right:32,width:52,height:52,borderRadius:999,background:GRAD,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Outfit',fontWeight:700,fontSize:22,color:'#fff',boxShadow:'0 12px 24px -8px rgba(0,0,0,0.6)'}}>M</div>
            <div className="ff-italic" style={{fontSize:13,color:C.textLow,fontStyle:'italic',marginBottom:24}}>An example letter · what yours might read like</div>
            <p className="ff-body" style={{fontSize:18,color:C.textMid,lineHeight:1.75,margin:0,fontFamily:'Inter'}}>
              When you’ve leaned <em style={{color:C.textHi}}>slow-burn</em> nine nights running, Tuesday has earned some tenderness, and we go softer.
            </p>
            <p className="ff-body" style={{fontSize:18,color:C.textMid,lineHeight:1.75,marginTop:14,fontFamily:'Inter'}}>
              <em style={{color:C.textHi}}>Past Lives</em> is patient. It won’t ask for your forgiveness; it’ll ask for your attention. Give it both. There’s a moment in the airport — you’ll know.
            </p>
            <p className="ff-body" style={{fontSize:18,color:C.textMid,lineHeight:1.75,marginTop:14,fontFamily:'Inter'}}>
              Have it with a glass of something warm and the phone in another room.
            </p>
            <div className="ff-italic" style={{fontSize:18,color:C.textHi,fontStyle:'italic',marginTop:24,letterSpacing:'-0.005em'}}>— M.</div>
          </div>
        </Reveal>
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
          <p className="ff-body" style={{marginTop:22,fontSize:16,color:C.textMid,lineHeight:1.65}}>One price. No tiers. The whole engine — picks, DNA, the Briefing — for everyone.</p>
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
                {['Unlimited picks, any hour','Cinematic DNA, forever','The Briefing if you want it','No ads. No upsells. No algorithm tax.'].map(t=>
                  <li key={t} style={{display:'flex',alignItems:'center',gap:12,fontFamily:'Inter',fontSize:16,color:C.textMid}}>
                    <span style={{width:18,height:18,borderRadius:999,background:`${C.purple}20`,color:C.purple,display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>{t}
                  </li>
                )}
              </ul>
              <button type="button" onClick={signInWithGoogle} disabled={isAuthenticating} className="ff-link" style={{display:'block',width:'100%',textAlign:'center',marginTop:36,padding:'15px 22px',borderRadius:999,background:GRAD,color:'#fff',fontFamily:'Inter',fontSize:14,fontWeight:600,border:'none',cursor:isAuthenticating?'progress':'pointer',opacity:isAuthenticating?0.7:1}} aria-label="Start free with Google">{isAuthenticating?'Opening Google…':'Start free →'}</button>
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
          <button type="button" onClick={signInWithGoogle} disabled={isAuthenticating} className="ff-link" style={{display:'inline-flex',alignItems:'center',gap:10,marginTop:52,padding:'16px 32px',borderRadius:999,background:GRAD,color:'#fff',fontFamily:'Inter',fontSize:14.5,fontWeight:600,boxShadow:'0 18px 40px -10px rgba(236,72,153,0.5)',border:'none',cursor:isAuthenticating?'progress':'pointer',opacity:isAuthenticating?0.7:1}} aria-label="Begin with Google">
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
  const style = {fontFamily:'Inter',fontSize:14,color:C.textMid,textDecoration:'none',transition:'color 0.2s ease',display:'inline-flex',alignItems:'center',minHeight:44,paddingRight:12};
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
          <div style={{fontFamily:'Inter',fontSize:20,fontWeight:900,letterSpacing:'-0.012em',background:GRAD,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>FEELFLICK</div>
          <p className="ff-italic" style={{marginTop:14,fontFamily:'Inter',fontSize:13,color:C.textLow,lineHeight:1.6,maxWidth:340,fontStyle:'italic'}}>The right film. Right now.</p>
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
      <div style={{maxWidth:1280,margin:'56px auto 0',paddingTop:28,borderTop:`1px solid ${C.hairline}`,display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12,fontFamily:'Inter',fontSize:11.5,color:C.textFaint}}>
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
        <Briefing/>
        <DNA/>
        <Community/>
        <MLetter/>
        <Pricing/>
        <FinalCTA/>
      </main>
      <Footer/>
    </div>
  );
}
