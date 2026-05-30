import { useState, useEffect, useRef } from 'react'
import { useGoogleAuth } from '@/shared/hooks/useGoogleAuth'
import { C, HP_GRAD as GRAD } from '@/shared/lib/tokens'

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
export default function Header(){
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
        <a href="/" className="ff-link" style={{fontFamily:'Inter',fontSize:21,fontWeight:700,letterSpacing:'-0.012em',background:GRAD,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',flexShrink:0}}>FEELFLICK</a>
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
