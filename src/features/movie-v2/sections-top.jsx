import { useEffect, useRef, useState } from 'react'
import { FILM_PALETTE, HP, HP_GRAD } from './data'
import { useMovieData } from './useMovieData'

// FeelFlick — Movie page · Hero, scroll progress, trailer modal, why-for-you, synopsis, mood radar, take, critic quotes.

const iconBtnStyle = { width:36, height:36, borderRadius:999, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(12px)', border:`1px solid rgba(255,255,255,0.08)`, color:'rgba(250,250,250,0.72)', cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center' };

// Reset-button style for wrapping elements that need to be focusable buttons
// without inheriting the browser's default button chrome.
const RESET_BTN = {
  background:'none', border:'none', padding:0, margin:0, font:'inherit',
  color:'inherit', textAlign:'left', cursor:'pointer', display:'block', width:'100%',
};

// ── Scroll-progress hairline ──────────────────────────────────────
function ScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setPct(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, height:2, zIndex:200, pointerEvents:'none' }}>
      <div style={{ height:'100%', width:`${pct}%`, background: HP_GRAD, transition:'width 0.1s linear', boxShadow:`0 0 12px ${FILM_PALETTE.primary}88` }} />
    </div>
  );
}

// ── Film grain overlay (16mm-ish noise via animated SVG) ────────
function FilmGrain() {
  return (
    <div aria-hidden style={{
      position:'fixed', inset:0, pointerEvents:'none', zIndex:90,
      opacity:0.05, mixBlendMode:'overlay',
      backgroundImage: 'url("data:image/svg+xml;utf8,<svg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'2\' seed=\'5\'/></filter><rect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/></svg>")',
      backgroundSize:'200px 200px',
      animation:'mv-grain 0.9s steps(4) infinite',
    }} />
  );
}

// ── Trailer modal (with theatrical curtains) ─────────────────────
function TrailerModal({ open, onClose }) {
  const { mv } = useMovieData();
  const closeBtnRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const focusTimer = setTimeout(() => closeBtnRef.current?.focus(), 0);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(focusTimer);
      const prev = previouslyFocusedRef.current;
      if (prev && typeof prev.focus === 'function') prev.focus();
    };
  }, [open, onClose]);

  if (!open || !mv?.trailerYouTubeId) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="mv-trailer-caption" style={{
      position:'fixed', inset:0, zIndex:300,
      animation:'mv-fade-in 0.4s ease both',
    }}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close trailer"
        style={{
          ...RESET_BTN,
          position:'absolute', inset:0, width:'100%', height:'100%',
          background:'rgba(0,0,0,0.92)', backdropFilter:'blur(20px)', cursor:'pointer',
        }}
      />

      <div aria-hidden style={{ position:'absolute', top:0, bottom:0, left:0, width:'50%', background:`linear-gradient(90deg, ${FILM_PALETTE.glow} 0%, transparent 100%)`, opacity:0.6, animation:'mv-curtain-l 0.6s cubic-bezier(0.2,0.8,0.2,1) both', pointerEvents:'none' }} />
      <div aria-hidden style={{ position:'absolute', top:0, bottom:0, right:0, width:'50%', background:`linear-gradient(-90deg, ${FILM_PALETTE.glow} 0%, transparent 100%)`, opacity:0.6, animation:'mv-curtain-r 0.6s cubic-bezier(0.2,0.8,0.2,1) both', pointerEvents:'none' }} />

      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Close trailer"
          style={{
            position:'absolute', top:24, right:24,
            width:40, height:40, borderRadius:999,
            background:'rgba(255,255,255,0.08)', border:`1px solid ${HP.border}`, color: HP.text,
            cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center',
            fontSize:18, lineHeight:1, zIndex:5, pointerEvents:'auto',
          }}
        >×</button>

        <div style={{
          position:'relative', width:'min(1120px, 90vw)', aspectRatio:'16/9',
          borderRadius:8, overflow:'hidden', pointerEvents:'auto',
          boxShadow:`0 40px 120px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.08), 0 0 80px ${FILM_PALETTE.primary}33`,
          animation:'mv-zoom-in 0.5s cubic-bezier(0.2,0.8,0.2,1) both',
        }}>
          <iframe
            src={`https://www.youtube.com/embed/${mv.trailerYouTubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={`${mv.title} — Official Trailer`}
            frameBorder="0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}
          />
        </div>

        <div id="mv-trailer-caption" style={{ position:'absolute', bottom:32, left:'50%', transform:'translateX(-50%)', textAlign:'center', animation:'mv-fade-in 0.6s 0.2s ease both', pointerEvents:'none' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: HP.purple, marginBottom:6 }}>Now Playing</div>
          <div style={{ fontFamily:'Outfit', fontSize:18, fontWeight:500, color: HP.text, letterSpacing:'-0.015em' }}>{mv.title} · Official Trailer</div>
        </div>
      </div>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────
function MovieHero({
  onPlayTrailer, onBack, onShare,
  isInWatchlist, isWatched, onToggleWatchlist, onToggleWatched, loading, canAct,
}) {
  const { mv } = useMovieData();
  const [scrollY, setScrollY] = useState(0);
  const [tilt, setTilt] = useState({ x:0, y:0 });

  useEffect(() => {
    const on = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const onPosterMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const cx = (e.clientX - r.left) / r.width - 0.5;
    const cy = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: cx * -8, y: cy * 8 });
  };

  const hasRuntime = mv.runtime > 0;
  const hasRatings = mv.imdbRating != null;
  const hasTrailer = Boolean(mv.trailerYouTubeId);

  return (
    <section style={{ position:'relative', minHeight: 760, overflow:'hidden' }}>
      {/* Parallax backdrop with ken-burns drift */}
      <div style={{ position:'absolute', inset:0, transform:`translateY(${scrollY * 0.4}px)`, willChange:'transform' }}>
        <div style={{ position:'absolute', inset:0, animation:'mv-kenburns 22s ease-in-out infinite alternate' }}>
          {mv.backdrop
            ? <img src={mv.backdrop} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 30%' }} />
            : <div style={{ width:'100%', height:'100%', background:`radial-gradient(ellipse at center, ${FILM_PALETTE.glow} 0%, #06060a 70%)` }} />
          }
        </div>
        <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 80% 70% at 20% 30%, rgba(${FILM_PALETTE.rgb.primary}, 0.38), transparent 60%), radial-gradient(ellipse 60% 50% at 90% 90%, rgba(${FILM_PALETTE.rgb.secondary}, 0.18), transparent 55%)` }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.30) 30%, rgba(0,0,0,0.85) 82%, #06060a 100%)' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 50%, transparent 100%)' }} />
      </div>

      {/* Top nav */}
      <div style={{ position:'absolute', top:0, left:0, right:0, padding:'24px 56px', display:'flex', alignItems:'center', justifyContent:'space-between', zIndex:5 }}>
        <button onClick={onBack} aria-label="Go back" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 16px', borderRadius:999, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(12px)', border:`1px solid ${HP.border}`, color: HP.textSoft, fontFamily:'Outfit', fontSize:12, fontWeight:600, letterSpacing:'0.04em', cursor:'pointer' }}>
          <span style={{ fontSize:14, lineHeight:1 }}>‹</span> Back
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <button onClick={onShare} aria-label="Share this film" title="Share" style={iconBtnStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
        </div>
      </div>

      <div style={{ position:'relative', zIndex:2, padding:'140px 88px 64px', display:'grid', gridTemplateColumns:'auto 1fr', gap:64, alignItems:'flex-end', minHeight:760 }}>
        {/* Poster with 3D tilt */}
        <div style={{ position:'relative', width:300, flex:'none', perspective:1200 }}
             onMouseMove={onPosterMove} onMouseLeave={()=>setTilt({x:0,y:0})}>
          <div style={{
            position:'relative', borderRadius:8, overflow:'visible',
            transform:`rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
            transition:'transform 0.2s ease',
            willChange:'transform',
          }}>
            {mv.poster
              ? <img src={mv.poster} alt={mv.title} style={{ width:'100%', display:'block', borderRadius:8, boxShadow:`0 36px 100px -20px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.06), 0 0 60px ${FILM_PALETTE.primary}44` }} />
              : <div style={{ width:'100%', aspectRatio:'2/3', borderRadius:8, background:`linear-gradient(155deg, ${FILM_PALETTE.primary}55, ${FILM_PALETTE.glow}33)`, display:'flex', alignItems:'center', justifyContent:'center', color:HP.text, fontFamily:'Outfit', fontSize:24, padding:24, textAlign:'center', boxShadow:`0 36px 100px -20px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.06)` }}>{mv.title}</div>
            }
            <MatchRing pct={mv.ffMatch} />
          </div>
        </div>

        <div style={{ maxWidth:780 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:22 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: HP.purple }}>Film File</div>
            <div style={{ flex:'none', height:1, width:36, background: HP.purple, opacity:0.5 }} />
            <div style={{ fontSize:10, fontWeight:500, letterSpacing:'0.18em', textTransform:'uppercase', color: HP.textMuted, fontFamily:'Outfit' }}>Nº {String(mv.id).padStart(4, '0')} · {mv.year || '—'} · {mv.language}</div>
          </div>

          <h1 style={{ fontFamily:'Outfit, Inter, sans-serif', fontSize:108, lineHeight:0.92, fontWeight:600, letterSpacing:'-0.052em', color: HP.text, margin:0, textWrap:'balance' }}>
            {mv.title}
          </h1>

          {(mv.originalTitle && mv.originalTitle !== mv.title) || mv.tagline ? (
            <div style={{ display:'flex', alignItems:'baseline', gap:18, marginTop:14, flexWrap:'wrap' }}>
              {mv.originalTitle && mv.originalTitle !== mv.title && (
                <span style={{ fontFamily:'Outfit', fontSize:24, fontWeight:300, color: HP.textSoft, fontStyle:'italic', letterSpacing:'-0.01em' }}>{mv.originalTitle}</span>
              )}
              {mv.originalTitle && mv.originalTitle !== mv.title && mv.tagline && (
                <span style={{ width:1, height:18, background: HP.border }} />
              )}
              {mv.tagline && (
                <span style={{ fontFamily:'Outfit, Inter, sans-serif', fontSize:15, color: HP.textMuted, fontStyle:'italic' }}>“{mv.tagline}”</span>
              )}
            </div>
          ) : null}

          <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:24, fontSize:12, color: HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.06em', textTransform:'uppercase', flexWrap:'wrap' }}>
            <span style={{ padding:'3px 8px', border:`1px solid ${HP.borderStrong}`, borderRadius:3, fontWeight:600, color: HP.textSoft }}>{mv.certification}</span>
            {mv.year && <span>{mv.year}</span>}
            {hasRuntime && <>
              <span style={{ width:3, height:3, borderRadius:999, background: HP.textFaint }} />
              <span>{Math.floor(mv.runtime/60)}h {mv.runtime%60}m</span>
            </>}
            {mv.director && mv.director !== '—' && <>
              <span style={{ width:3, height:3, borderRadius:999, background: HP.textFaint }} />
              <span>Dir. <span style={{ color: HP.text, fontWeight:600 }}>{mv.director}</span></span>
            </>}
            {mv.genres.length > 0 && <>
              <span style={{ width:3, height:3, borderRadius:999, background: HP.textFaint }} />
              <span>{mv.genres.join(' / ')}</span>
            </>}
          </div>

          {mv.daypartFit && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginTop:22, padding:'8px 14px', borderRadius:999, background:'rgba(167,139,250,0.08)', border:`1px solid ${HP.purple}33`, color: HP.purple }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
              <span style={{ fontFamily:'Outfit', fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Best watched · {mv.daypartFit}</span>
            </div>
          )}

          <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:32, flexWrap:'wrap' }}>
            <button
              onClick={onPlayTrailer}
              disabled={!hasTrailer}
              title={hasTrailer ? undefined : 'No trailer available'}
              style={{
                display:'inline-flex', alignItems:'center', gap:10,
                padding:'14px 22px', borderRadius:8,
                background: HP_GRAD, border:'none', color:'#fff',
                fontFamily:'Outfit', fontSize:14, fontWeight:600, letterSpacing:'0.02em',
                cursor: hasTrailer ? 'pointer' : 'not-allowed', opacity: hasTrailer ? 1 : 0.5,
                boxShadow:'0 12px 32px -8px rgba(236,72,153,0.55)',
              }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3v18l16-9z"/></svg>
              Play Trailer
            </button>
            <MarkWatchedButton
              isWatched={isWatched}
              onToggleWatched={onToggleWatched}
              loading={loading?.watched}
              canAct={canAct}
            />
            <SaveButton
              isInWatchlist={isInWatchlist}
              onToggleWatchlist={onToggleWatchlist}
              loading={loading?.watchlist}
              canAct={canAct}
            />
            <div style={{ flex:1 }} />
            {hasRatings && (
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:999, background:'rgba(0,0,0,0.5)', border:`1px solid ${HP.border}` }}>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill={HP.amber}><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>
                  <span style={{ fontFamily:'Outfit', fontSize:13, fontWeight:600, color: HP.text }}>{mv.imdbRating}</span>
                  <span style={{ fontSize:10, color: HP.textFaint, marginLeft:2 }}>TMDB</span>
                </span>
                {mv.rtCritic != null && <>
                  <span style={{ width:1, height:12, background: HP.border }} />
                  <span style={{ fontSize:11, color: HP.textSoft, fontFamily:'Outfit' }}><span style={{ color: HP.amber, fontWeight:700 }}>{mv.rtCritic}%</span> Critics</span>
                </>}
                {mv.rtAudience != null && <>
                  <span style={{ width:1, height:12, background: HP.border }} />
                  <span style={{ fontSize:11, color: HP.textSoft, fontFamily:'Outfit' }}><span style={{ color: HP.text, fontWeight:700 }}>{mv.rtAudience}%</span> Audience</span>
                </>}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function MatchRing({ pct }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setV(pct), 250);
    return () => clearTimeout(t);
  }, [pct]);
  const dash = v * 0.943;
  return (
    <div style={{ position:'absolute', bottom:-22, right:-22, width:96, height:96, borderRadius:999, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(12px)', boxShadow:'0 16px 40px -8px rgba(0,0,0,0.7)' }}>
      <svg viewBox="0 0 36 36" style={{ width:'100%', height:'100%', transform:'rotate(-90deg)' }}>
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
        <circle cx="18" cy="18" r="15" fill="none" stroke="url(#ring)" strokeWidth="2.5" strokeDasharray={`${dash} 100`} strokeLinecap="round" style={{ transition:'stroke-dasharray 1.4s cubic-bezier(0.2,0.8,0.2,1)' }} />
        <defs><linearGradient id="ring" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={HP.purple}/><stop offset="100%" stopColor={HP.pink}/></linearGradient></defs>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontFamily:'Outfit', fontSize:30, fontWeight:300, color: HP.text, letterSpacing:'-0.04em', lineHeight:1 }}>{v}<span style={{ fontSize:13, color: HP.textMuted, marginLeft:1 }}>%</span></span>
        <span style={{ fontSize:8, fontWeight:700, color: HP.purple, letterSpacing:'0.18em', textTransform:'uppercase', marginTop:2 }}>Match</span>
      </div>
    </div>
  );
}

function MarkWatchedButton({ isWatched, onToggleWatched, loading, canAct }) {
  const wasWatchedRef = useRef(isWatched);
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    if (isWatched && !wasWatchedRef.current) {
      setConfetti(true);
      const t = setTimeout(() => setConfetti(false), 1800);
      return () => clearTimeout(t);
    }
    wasWatchedRef.current = isWatched;
  }, [isWatched]);

  const disabled = !canAct || loading;
  const title = !canAct ? 'Sign in to track what you watch' : undefined;

  return (
    <>
      <button
        onClick={onToggleWatched}
        disabled={disabled}
        aria-pressed={Boolean(isWatched)}
        title={title}
        style={{
          position:'relative',
          display:'inline-flex', alignItems:'center', gap:10,
          padding:'14px 22px', borderRadius:8,
          background: isWatched ? `${FILM_PALETTE.primary}22` : 'rgba(255,255,255,0.06)',
          border:`1px solid ${isWatched ? FILM_PALETTE.primary + '66' : HP.borderStrong}`,
          color: HP.text, fontFamily:'Outfit', fontSize:14, fontWeight:600,
          cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled && !isWatched ? 0.6 : 1,
          transition:'all 0.3s ease',
        }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        {isWatched ? 'Watched' : 'Mark Watched'}
      </button>
      {confetti && <Confetti />}
    </>
  );
}

function SaveButton({ isInWatchlist, onToggleWatchlist, loading, canAct }) {
  const disabled = !canAct || loading;
  const title = !canAct ? 'Sign in to save films' : undefined;
  return (
    <button
      onClick={onToggleWatchlist}
      disabled={disabled}
      aria-pressed={Boolean(isInWatchlist)}
      title={title}
      style={{
        display:'inline-flex', alignItems:'center', gap:10,
        padding:'14px 22px', borderRadius:8,
        background: isInWatchlist ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.06)',
        border:`1px solid ${isInWatchlist ? HP.purple + '66' : HP.border}`,
        color: HP.textSoft, fontFamily:'Outfit', fontSize:14, fontWeight:500,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled && !isInWatchlist ? 0.6 : 1,
        transition:'all 0.25s ease',
      }}>
      {isInWatchlist ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      )}
      {isInWatchlist ? 'Saved' : 'Save'}
    </button>
  );
}

function Confetti() {
  const colors = [HP.purple, HP.pink, HP.amber, FILM_PALETTE.primary, FILM_PALETTE.secondary];
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.3,
    color: colors[i % colors.length],
    rot: Math.random() * 360,
  }));
  return (
    <div aria-hidden style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:250, overflow:'hidden' }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position:'absolute', top:'40%', left:`${p.left}%`,
          width:8, height:14, background: p.color,
          animation:`mv-confetti 1.6s ${p.delay}s cubic-bezier(0.3,0.7,0.6,1) forwards`,
          transform:`rotate(${p.rot}deg)`,
        }} />
      ))}
    </div>
  );
}

function StickyActionBar({ onPlayTrailer, onBack, onToggleWatchlist, isInWatchlist, loading, canAct }) {
  const { mv } = useMovieData();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 80);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const wlDisabled = !canAct || loading?.watchlist;
  const wlTitle = !canAct ? 'Sign in to save films' : undefined;
  const hasTrailer = Boolean(mv.trailerYouTubeId);

  return (
    <div style={{
      position:'fixed', top:0, left:0, right:0, zIndex:100,
      padding:'12px 56px',
      background:'rgba(6,6,10,0.94)', backdropFilter:'blur(20px)',
      borderBottom:`1px solid ${HP.border}`,
      transform: scrolled ? 'translateY(0)' : 'translateY(-100%)',
      transition:'transform 0.35s cubic-bezier(0.2,0.8,0.2,1)',
      display:'flex', alignItems:'center', gap:20,
    }}>
      <button onClick={onBack} aria-label="Go back" style={{ width:32, height:32, borderRadius:999, background:'rgba(255,255,255,0.06)', border:`1px solid ${HP.border}`, color: HP.textSoft, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div style={{ display:'flex', alignItems:'center', gap:14, flex:1 }}>
        {mv.poster && <img src={mv.poster} alt="" style={{ width:30, height:45, objectFit:'cover', borderRadius:3 }} />}
        <div>
          <div style={{ fontFamily:'Outfit', fontSize:15, fontWeight:600, color: HP.text, letterSpacing:'-0.01em' }}>{mv.title}</div>
          <div style={{ fontSize:11, color: HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.04em' }}>
            {mv.year || '—'}
            {mv.director && mv.director !== '—' && <> · {mv.director}</>}
            <> · <span style={{ color: HP.purple, fontWeight:600 }}>{mv.ffMatch}% match</span></>
          </div>
        </div>
      </div>
      <button
        onClick={onPlayTrailer}
        disabled={!hasTrailer}
        title={hasTrailer ? undefined : 'No trailer available'}
        style={{
          padding:'8px 14px', borderRadius:6, background: HP_GRAD, border:'none', color:'#fff',
          fontFamily:'Outfit', fontSize:12, fontWeight:600,
          cursor: hasTrailer ? 'pointer' : 'not-allowed', opacity: hasTrailer ? 1 : 0.5,
        }}
      >
        Play Trailer
      </button>
      <button
        onClick={onToggleWatchlist}
        disabled={wlDisabled}
        aria-pressed={Boolean(isInWatchlist)}
        title={wlTitle}
        style={{
          padding:'8px 14px', borderRadius:6,
          background: isInWatchlist ? 'rgba(167,139,250,0.14)' : 'rgba(255,255,255,0.06)',
          border:`1px solid ${isInWatchlist ? HP.purple + '66' : HP.borderStrong}`,
          color: HP.text, fontFamily:'Outfit', fontSize:12, fontWeight:600,
          cursor: wlDisabled ? 'not-allowed' : 'pointer', opacity: wlDisabled && !isInWatchlist ? 0.6 : 1,
        }}>
        {isInWatchlist ? '✓ On Watchlist' : '+ Watchlist'}
      </button>
    </div>
  );
}

// ── Why for you (dynamic from taste fingerprint + film) ──────────
function WhyForYou({ eyebrow, headline, rationale, reasons, onHoverReason, highlightReasonId }) {
  const iconMap = {
    mood:     <path d="M12 21s-7-4.5-7-11a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 6.5-7 11-7 11 0 0-3-2-6-2z" fill="currentColor"/>,
    dna:      <><path d="M6 4c4 0 6 4 6 8s-2 8-6 8"/><path d="M18 4c-4 0-6 4-6 8s2 8 6 8"/><path d="M6 6h12M6 18h12M8 10h8M8 14h8"/></>,
    director: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></>,
    time:     <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  };
  if (!reasons || reasons.length === 0) return null;
  return (
    <section style={{ padding:'88px 88px 56px', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:80, alignItems:'flex-start' }}>
        <div style={{ position:'sticky', top:80 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: HP.purple, marginBottom:18, display:'inline-flex', alignItems:'center', gap:10 }}>
            <span style={{ height:1, width:22, background: HP.purple, opacity:0.6 }} />
            {eyebrow || 'Why this fits you'}
          </div>
          <h2 style={{ fontFamily:'Outfit', fontSize:52, lineHeight:1, fontWeight:500, letterSpacing:'-0.04em', color: HP.text, margin:0, textWrap:'balance' }}>
            {headline || 'A signal-driven fit.'}
          </h2>
          {rationale && (
            <p style={{ marginTop:24, fontSize:15, lineHeight:1.7, color: HP.textSoft, fontFamily:'Outfit, Inter, sans-serif', maxWidth:380, textWrap:'pretty' }}>
              {rationale}
            </p>
          )}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
          {reasons.map(r => {
            const active = highlightReasonId === r.id;
            return (
              <div key={r.id}
                onMouseEnter={() => onHoverReason?.(r.id)}
                onMouseLeave={() => onHoverReason?.(null)}
                style={{
                  padding:'28px 24px', borderRadius:6,
                  border:`1px solid ${active ? HP.purple+'66' : HP.border}`,
                  background: active ? 'rgba(167,139,250,0.06)' : 'rgba(255,255,255,0.025)',
                  transition:'all 0.25s ease',
                  transform: active ? 'translateY(-2px)' : 'translateY(0)',
                  cursor:'default',
                }}>
                <div style={{ width:36, height:36, borderRadius:8, background:'rgba(167,139,250,0.12)', border:`1px solid ${HP.purple}33`, display:'flex', alignItems:'center', justifyContent:'center', color: HP.purple, marginBottom:18 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{iconMap[r.icon] || iconMap.dna}</svg>
                </div>
                <div style={{ fontFamily:'Outfit', fontSize:16, fontWeight:500, color: HP.text, letterSpacing:'-0.015em', marginBottom:8 }}>{r.title}</div>
                <p style={{ margin:0, fontSize:13, lineHeight:1.6, color: HP.textSoft, fontFamily:'Outfit, Inter, sans-serif', textWrap:'pretty' }}>{r.detail}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Synopsis (uses TMDB overview) ────────────────────────────────
function Synopsis() {
  const { mv } = useMovieData();
  const text = mv.overview;
  if (!text) return null;
  const first = text.charAt(0);
  const rest = text.slice(1);
  return (
    <section style={{ padding:'72px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ maxWidth:820 }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:24 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: HP.purple, display:'inline-flex', alignItems:'center', gap:10 }}>
            <span style={{ height:1, width:22, background: HP.purple, opacity:0.6 }} />Synopsis
          </div>
        </div>
        <p style={{ margin:0, fontFamily:'Outfit, Inter, sans-serif', fontSize:23, lineHeight:1.55, color: HP.text, letterSpacing:'-0.012em', textWrap:'pretty', animation:'mv-fade-in 0.5s ease both' }}>
          <span style={{ fontFamily:'Outfit', fontSize:72, fontWeight:300, color: FILM_PALETTE.primary, float:'left', lineHeight:0.85, marginRight:12, marginTop:6, marginBottom:-6 }}>{first}</span>
          {rest}
        </p>
      </div>
    </section>
  );
}

// ── Mood radar (spider chart) + cross-referenced highlight ──────
function MoodRadar({ axes, highlightMood, onHoverAxis }) {
  const [in_, setIn] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setIn(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  if (!axes || axes.length < 3) return null;

  const moods = axes;
  const n = moods.length;
  const cx = 200, cy = 200, R = 140;

  const ptsFor = (weights) => moods.map((_, i) => {
    const angle = -Math.PI/2 + (i / n) * Math.PI * 2;
    const w = weights[i];
    return [cx + Math.cos(angle) * R * w, cy + Math.sin(angle) * R * w];
  });
  const path = (pts) => pts.map((p, i) => (i===0?'M':'L') + p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ') + ' Z';
  const targetW = moods.map(m => m.weight);
  const animW = in_ ? targetW : moods.map(()=>0);

  const enter = (name) => onHoverAxis?.(name);
  const leave = () => onHoverAxis?.(null);

  return (
    <section ref={ref} style={{ padding:'88px 88px', borderTop:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.012)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:64, alignItems:'center' }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: HP.purple, marginBottom:18, display:'inline-flex', alignItems:'center', gap:10 }}>
            <span style={{ height:1, width:22, background: HP.purple, opacity:0.6 }} />Mood Fingerprint
          </div>
          <h2 style={{ fontFamily:'Outfit', fontSize:48, lineHeight:1, fontWeight:500, letterSpacing:'-0.035em', color: HP.text, margin:0, textWrap:'balance' }}>
            How it <em style={{ fontStyle:'italic', fontWeight:400, color: HP.textSoft }}>feels.</em>
          </h2>
          <p style={{ marginTop:20, fontSize:14, lineHeight:1.7, color: HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', maxWidth:380 }}>
            Hand-coded by the FeelFlick taste engine from script, score, and reaction signal. Hover any axis to see what it means.
          </p>
          <div style={{ marginTop:24, display:'flex', flexDirection:'column', gap:8 }}>
            {moods.map(m => {
              const lit = highlightMood === m.name;
              return (
                <div key={m.name}
                  onMouseEnter={() => enter(m.name)}
                  onMouseLeave={leave}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderRadius:6, background: lit ? `${m.hex}1a` : 'transparent', border:`1px solid ${lit ? m.hex+'55' : 'transparent'}`, transition:'all 0.25s ease', cursor:'default' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ width:8, height:8, borderRadius:999, background: m.hex, boxShadow:`0 0 ${lit?12:0}px ${m.hex}` }} />
                    <span style={{ fontFamily:'Outfit', fontSize:14, fontWeight:500, color: HP.text }}>{m.name}</span>
                  </div>
                  <span style={{ fontFamily:'Outfit', fontSize:12, color: HP.textMuted }}>{Math.round(m.weight*100)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ position:'relative', width:400, height:400, margin:'0 auto' }}>
          <svg viewBox="0 0 400 400" style={{ width:'100%', height:'100%' }}>
            {[0.25, 0.5, 0.75, 1].map((r, i) => {
              const pts = moods.map((_, j) => {
                const a = -Math.PI/2 + (j/n) * Math.PI*2;
                return [cx + Math.cos(a)*R*r, cy + Math.sin(a)*R*r];
              });
              return <path key={i} d={path(pts)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
            })}
            {moods.map((_, i) => {
              const a = -Math.PI/2 + (i/n) * Math.PI*2;
              return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a)*R} y2={cy + Math.sin(a)*R} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
            })}
            <path d={path(ptsFor(animW))} fill={`${FILM_PALETTE.primary}33`} stroke={FILM_PALETTE.primary} strokeWidth="1.5" />
            {ptsFor(animW).map((p, i) => {
              const m = moods[i];
              const lit = highlightMood === m.name;
              return <circle key={i} cx={p[0]} cy={p[1]} r={lit?7:4} fill={m.hex}
                onMouseEnter={() => enter(m.name)} onMouseLeave={leave}
                style={{ transition:'all 0.3s ease', filter: lit?`drop-shadow(0 0 8px ${m.hex})`:'none', cursor:'default' }} />;
            })}
            {moods.map((m, i) => {
              const a = -Math.PI/2 + (i/n) * Math.PI*2;
              const lx = cx + Math.cos(a) * (R + 28);
              const ly = cy + Math.sin(a) * (R + 28);
              return (
                <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                  onMouseEnter={() => enter(m.name)} onMouseLeave={leave}
                  style={{ fontFamily:'Outfit', fontSize:12, fontWeight:500, fill: highlightMood===m.name ? m.hex : HP.textSoft, letterSpacing:'0.02em', transition:'fill 0.25s ease', cursor:'default' }}>
                  {m.name}
                </text>
              );
            })}
          </svg>
        </div>
      </div>
    </section>
  );
}

// ── FF Take (curated overlay only — PR 4 adds LLM fallback) ──────
function TheTake({ take }) {
  if (!take?.body) return null;
  return (
    <section style={{ padding:'88px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ maxWidth:880, position:'relative' }}>
        <div style={{ position:'absolute', top:-24, left:-12, fontFamily:'Outfit', fontSize:160, lineHeight:0.8, fontWeight:200, color: HP.purple, opacity:0.18 }}>“</div>
        <div style={{ position:'relative' }}>
          {take.byline && (
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: HP.purple, marginBottom:24, display:'inline-flex', alignItems:'center', gap:10 }}>
              <span style={{ height:1, width:22, background: HP.purple, opacity:0.6 }} />{take.byline}
            </div>
          )}
          <p style={{ margin:0, fontFamily:'Outfit, Inter, sans-serif', fontSize:32, lineHeight:1.32, fontWeight:400, color: HP.text, letterSpacing:'-0.018em', fontStyle:'italic', textWrap:'balance' }}>
            {take.body}
          </p>
          {take.meta && (
            <div style={{ marginTop:28, display:'flex', alignItems:'center', gap:14, fontSize:11, color: HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.06em' }}>
              <span style={{ width:24, height:1, background: HP.textMuted }} />
              <span style={{ textTransform:'uppercase' }}>{take.meta}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Critic Quotes (curated overlay only — PR 4 adds TMDB reviews fallback) ──
function CriticQuotes({ quotes }) {
  if (!quotes || quotes.length === 0) return null;
  return (
    <section style={{ padding:'56px 88px', borderTop:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.012)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64 }}>
        {quotes.map((q, i) => (
          <blockquote key={i} style={{ margin:0, paddingLeft:24, borderLeft:`2px solid ${i===0 ? FILM_PALETTE.primary : HP.purple}` }}>
            <p style={{ margin:0, fontFamily:'Outfit, Inter, sans-serif', fontSize:21, lineHeight:1.45, color: HP.text, fontStyle:'italic', letterSpacing:'-0.015em', textWrap:'pretty' }}>
              “{q.quote}”
            </p>
            <footer style={{ marginTop:14, fontSize:11, color: HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.08em', textTransform:'uppercase' }}>
              <span style={{ color: HP.textSoft, fontWeight:600 }}>{q.author}</span> · {q.outlet}
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

export { ScrollProgress, FilmGrain, TrailerModal, MovieHero, StickyActionBar, WhyForYou, Synopsis, MoodRadar, TheTake, CriticQuotes }
