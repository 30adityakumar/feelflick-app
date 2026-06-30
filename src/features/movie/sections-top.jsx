import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import Tooltip from '@/shared/ui/Tooltip'
import Button from '@/shared/ui/Button'
// TEMPORARY visual-compatibility import. The two trailer controls (hero + sticky bar)
// now render the canonical <Button variant="primary"> DIRECTLY — semantic ownership lives
// in Button; the PrimaryAction *component* is retired from this route (the final
// production wrapper consumer). This stylesheet still loads HERE so those controls keep
// their EXACT pre-migration Film File pixels (the legacy flat-ivory recipe applied via the
// `.ts-action-primary*` compatibility classes — see MOVIE_PRIMARY_COMPAT_* below). Movie
// must load it itself rather than relying on Home or Watchlist route chunks. The classes +
// import stay until the final neutral-primary convergence; this migration satisfies ONLY
// retirement-gate condition 1 (zero production component imports) — conditions 2–4 remain.
import '@/shared/ui/thoughtful-seatmate/PrimaryAction.css'
import { HP as HP_BASE, RADIUS } from './data'
import { useMovieData } from './useMovieData'

const HP = {
  ...HP_BASE,
  panel: 'var(--ts-surface-1, #1d1814)',
  border: 'var(--ts-border-subtle, #302c28)',
  borderStrong: 'var(--ts-border-strong, #46423d)',
  text: 'var(--ts-text-primary, #f3ecdf)',
  textSoft: 'var(--ts-text-secondary, #beb8ad)',
  textMuted: 'var(--ts-text-muted, #8d887f)',
  textFaint: 'var(--ts-text-muted, #8d887f)',
  purple: 'var(--ts-text-secondary, #beb8ad)',
  purpleDeep: 'var(--ts-text-muted, #8d887f)',
  pink: 'var(--ts-text-secondary, #beb8ad)',
}

// FeelFlick — Movie page · Hero, scroll progress, trailer modal, why-for-you, synopsis, mood radar, take, critic quotes.

// F5.7: ≥44×44 touch target (the visible icon stays small).
const iconBtnStyle = { width:44, height:44, borderRadius:RADIUS.pill, background:'rgba(8,9,9,0.55)', border:'1px solid rgba(255,255,255,0.18)', color: HP.textSoft, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)' };

// TEMPORARY compatibility class strings — NOT components, hooks or shared abstractions.
// They reproduce the retired PrimaryAction wrapper's class output so the migrated trailer
// <Button variant="primary"> controls keep the legacy flat-ivory recipe (via PrimaryAction.css,
// imported above): MD for the hero (size="md"), SM for the sticky bar (size="sm"). Removed
// only at the final neutral-primary convergence.
const MOVIE_PRIMARY_COMPAT_MD = 'ts-action-primary ts-action-primary--md';
const MOVIE_PRIMARY_COMPAT_SM = 'ts-action-primary ts-action-primary--sm';

// Reset-button style for wrapping elements that need to be focusable buttons
// without inheriting the browser's default button chrome.

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
      <div style={{ height:'100%', width:`${pct}%`, background:'var(--ts-text-primary, #f3ecdf)', transition:'width 0.1s linear' }} />
    </div>
  );
}

// ── Film grain overlay (16mm-ish noise via animated SVG) ────────
function FilmGrain() {
  return (
    <div aria-hidden className="ff-movie-grain" style={{
      position:'fixed', inset:0, pointerEvents:'none', zIndex:90,
      opacity:0.05, mixBlendMode:'overlay',
      backgroundImage: 'url("data:image/svg+xml;utf8,<svg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'2\' seed=\'5\'/></filter><rect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/></svg>")',
      backgroundSize:'200px 200px',
      animation:'mv-grain 0.9s steps(4) infinite',
    }} />
  );
}

// The trailer/featurette dialog now lives in ./components/AccessibleMediaDialog
// (F5.4) — the inline TrailerModal was removed from here.

// ── Hero ──────────────────────────────────────────────────────────
function MovieHero({
  onPlayTrailer, onShare,
  isInWatchlist, isWatched, onToggleWatchlist, onToggleWatched, loading, canAct, celebrate,
  heroReason, heroTags,
}) {
  const { mv, boundaryWarnings } = useMovieData();
  const reduced = useReducedMotion();
  const [scrollY, setScrollY] = useState(0);

  // F5.4: backdrop parallax is JS-driven — skip under reduced motion.
  useEffect(() => {
    if (reduced) return;
    const on = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [reduced]);

  const hasRuntime = mv.runtime > 0;
  const hasTrailer = Boolean(mv.trailerYouTubeId);

  const titleLen = (mv.title || '').length;
  const titleSizeClass = titleLen <= 20 ? 'title-s' : titleLen <= 35 ? 'title-m' : 'title-l';

  return (
    <section className="ff-movie-hero" style={{ position:'relative', minHeight:'min(78svh, 660px)', overflow:'hidden' }}>
      {/* Parallax backdrop with ken-burns drift */}
      <div style={{ position:'absolute', inset:0, transform:`translateY(${scrollY * 0.4}px)`, willChange:'transform' }}>
        <div style={{ position:'absolute', inset:0, animation:'mv-kenburns 22s ease-in-out infinite alternate' }}>
          {mv.backdrop
            ? <img src={mv.backdrop} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 32%' }} />
            : <div style={{ width:'100%', height:'100%', background:'var(--ts-surface-1, #1d1814)' }} />
          }
        </div>
      </div>
      {/* Scrim — mobile: deep bottom-up; desktop: bottom light + left-rail strong */}
      <div className="ff-movie-hero__scrim" aria-hidden="true" />

      {/* Top nav — share only */}
      <div className="ff-movie-top-nav" style={{ position:'absolute', top:0, right:0, padding:'24px clamp(20px, 3.4vw, 44px)', display:'flex', alignItems:'center', justifyContent:'flex-end', zIndex:5 }}>
        <Tooltip content="Share this film" side="bottom">
          <button type="button" onClick={onShare} aria-label="Share this film" className="ff-movie-icon-btn" style={iconBtnStyle}>
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
        </Tooltip>
      </div>

      {/* Content anchored bottom-left — homepage hero layout */}
      <div className="ff-movie-hero__content" style={{ position:'absolute', left:0, right:0, bottom:0, zIndex:2, paddingInline:'clamp(20px, 3.4vw, 44px)', paddingBottom:50 }}>
        <div className="ff-movie-hero__panel" style={{ width:'min(100%, 640px)' }}>

          {/* Title with length-aware tiers */}
          <h1 className={`ff-movie-hero-h1 ${titleSizeClass}`} style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:'clamp(38px, 10vw, 48px)', lineHeight:0.96, fontWeight:600, letterSpacing:'-0.03em', color: HP.text, margin:0, textWrap:'balance' }}>
            {mv.title}
          </h1>

          {/* Ratings: frosted pills */}
          {(mv.tmdbRating != null || mv.ffCritic != null || mv.ffAudience != null) && (
            <div className="ff-movie-hero__ratings" style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:6, marginTop:14 }}>
              {mv.tmdbRating != null && (
                <span className="ff-movie-hero__rating-pill">
                  <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>
                  <span style={{ fontWeight:700, color: HP.text }}>{mv.tmdbRating}</span>
                  <span style={{ color: HP.textMuted, fontSize:10, letterSpacing:'0.05em', textTransform:'uppercase' }}>TMDB</span>
                </span>
              )}
              {mv.ffCritic != null && (
                <span className="ff-movie-hero__rating-pill">
                  <span style={{ fontWeight:700, color:'#F59E0B' }}>{mv.ffCritic}%</span>
                  <span style={{ color: HP.textMuted, fontSize:10, letterSpacing:'0.05em', textTransform:'uppercase' }}>Critics</span>
                </span>
              )}
              {mv.ffAudience != null && (
                <span className="ff-movie-hero__rating-pill">
                  <span style={{ fontWeight:700, color: HP.text }}>{mv.ffAudience}%</span>
                  <span style={{ color: HP.textMuted, fontSize:10, letterSpacing:'0.05em', textTransform:'uppercase' }}>Audience</span>
                </span>
              )}
            </div>
          )}

          {/* Meta: cert · year · runtime · lang */}
          <div className="ff-movie-hero__meta" style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:'8px 10px', marginTop:14, color:'var(--ts-text-secondary, #beb8ad)', fontSize:'10.5px', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'Inter, sans-serif' }}>
            {mv.certification && <span style={{ padding:'2px 7px', border:`1px solid ${HP.borderStrong}`, borderRadius:3, fontWeight:600, color: HP.textSoft, fontSize:11 }}>{mv.certification}</span>}
            {mv.year && <><span style={{ width:3, height:3, borderRadius:RADIUS.pill, background:'currentColor', opacity:0.7, display:'inline-block' }} /><span>{mv.year}</span></>}
            {hasRuntime && <><span style={{ width:3, height:3, borderRadius:RADIUS.pill, background:'currentColor', opacity:0.7, display:'inline-block' }} /><span>{Math.floor(mv.runtime/60)}h {mv.runtime%60}m</span></>}
            {mv.language && <><span style={{ width:3, height:3, borderRadius:RADIUS.pill, background:'currentColor', opacity:0.7, display:'inline-block' }} /><span className="ff-movie-meta-lang">{mv.language}</span></>}
          </div>

          {/* Mood tags from film profile */}
          {heroTags?.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:14 }}>
              {heroTags.slice(0, 4).map(tag => (
                <span key={tag} style={{ fontFamily:'Inter, sans-serif', fontSize:10.5, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--ts-text-secondary, #beb8ad)', padding:'4px 10px', borderRadius:99, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.13)' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Tagline */}
          {heroReason && (
            <p className="ff-movie-hero__reason" style={{ maxWidth:560, margin:'14px 0 0', color:'var(--ts-text-secondary, #beb8ad)', fontSize:'clamp(0.9rem, 1.05vw, 1rem)', fontWeight:300, lineHeight:1.55, textWrap:'pretty', fontFamily:'Inter, sans-serif' }}>
              {heroReason}
            </p>
          )}

          {mv.daypartFit && (
            // F5.3: generated suggestion — FeelFlick-owned, not an objective "best time".
            <div aria-label={`FeelFlick-generated viewing suggestion: ${mv.daypartFit}`} style={{ display:'inline-flex', alignItems:'center', gap:10, marginTop:16, padding:'8px 14px', borderRadius:RADIUS.pill, background:'rgba(243,236,223,0.06)', border:`1px solid var(--ts-border-subtle, #302c28)`, color:'var(--ts-text-secondary, #beb8ad)' }}>
              <svg aria-hidden width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
              <span style={{ fontFamily:'Inter, sans-serif', fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>FeelFlick suggests · {mv.daypartFit}</span>
            </div>
          )}

          {boundaryWarnings?.length > 0 && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginTop:14, padding:'8px 14px', borderRadius:RADIUS.pill, background:'rgba(245,158,11,0.10)', border:`1px solid ${HP.amber || '#F59E0B'}33`, color:'#F59E0B' }} role="note">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
              <span style={{ fontFamily:'Inter, sans-serif', fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>
                Heads up · {boundaryWarnings.map(w => w.label).join(' · ')}
              </span>
            </div>
          )}

          {/* Actions: primary trailer + icon buttons (homepage layout) */}
          <div className="ff-movie-hero-actions" style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:8, marginTop:26 }}>
            <Button
              variant="primary"
              size="md"
              className={`${MOVIE_PRIMARY_COMPAT_MD} ff-movie-hero__primary`}
              onClick={onPlayTrailer}
              disabled={!hasTrailer}
              title={hasTrailer ? undefined : 'No trailer available'}
              style={{ cursor: hasTrailer ? 'pointer' : 'not-allowed', opacity: hasTrailer ? 1 : 0.5 }}
            >
              <span>
                <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3v18l16-9z"/></svg>
                Play Trailer
              </span>
            </Button>

            <SaveButton
              isInWatchlist={isInWatchlist}
              onToggleWatchlist={onToggleWatchlist}
              loading={loading?.watchlist}
              canAct={canAct}
              movieTitle={mv.title}
            />

            <MarkWatchedButton
              isWatched={isWatched}
              onToggleWatched={onToggleWatched}
              loading={loading?.watched}
              canAct={canAct}
              celebrate={celebrate}
              movieTitle={mv.title}
            />

            {/* StickyActionBar watches this element via IntersectionObserver */}
            <div id="hero-actions-sentinel" aria-hidden="true" style={{ height:1, pointerEvents:'none', flex:'none' }} />
          </div>
        </div>
      </div>
    </section>
  );
}


function MarkWatchedButton({ isWatched, onToggleWatched, loading, canAct, celebrate, movieTitle }) {
  // F5.4: confetti is driven by `celebrate` from MovieDetail — fired ONLY on settled
  // watched success AND only when motion is allowed (reduced-motion users never get
  // it). The old optimistic isWatched-flip trigger is removed.
  const disabled = !canAct || loading;
  const label = movieTitle || 'this film';
  return (
    <>
      <button
        type="button"
        className={`ff-movie-hero__btn${isWatched ? ' is-active' : ''}`}
        aria-label={isWatched ? `${label} marked as watched` : `Mark ${label} as watched`}
        aria-pressed={isWatched}
        title={!canAct ? 'Sign in to track what you watch' : undefined}
        disabled={disabled}
        aria-busy={Boolean(loading)}
        onClick={onToggleWatched}
        style={{ opacity: disabled && !isWatched ? 0.6 : 1 }}
      >
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <span className="ff-movie-hero__btn-label">{isWatched ? 'Watched' : 'Mark Watched'}</span>
      </button>
      {celebrate && <Confetti />}
    </>
  );
}

function SaveButton({ isInWatchlist, onToggleWatchlist, loading, canAct, movieTitle }) {
  const disabled = !canAct || loading;
  const label = movieTitle || 'this film';
  return (
    <button
      type="button"
      className={`ff-movie-hero__btn${isInWatchlist ? ' is-active' : ''}`}
      aria-label={isInWatchlist ? `Remove ${label} from watchlist` : `Add ${label} to watchlist`}
      aria-pressed={isInWatchlist}
      title={!canAct ? 'Sign in to save films' : undefined}
      disabled={disabled}
      aria-busy={Boolean(loading)}
      onClick={onToggleWatchlist}
      style={{ opacity: disabled && !isInWatchlist ? 0.6 : 1 }}
    >
      {isInWatchlist
        ? <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        : <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      }
      <span className="ff-movie-hero__btn-label">{isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
    </button>
  );
}

function Confetti() {
  const colors = ['#f3ecdf', '#beb8ad', '#8d887f'];
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

function StickyActionBar({ onPlayTrailer }) {
  const { mv } = useMovieData();
  const barRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById('hero-actions-sentinel');
    if (!sentinel) return;
    const obs = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, []);

  // F5.4: when the bar is visually hidden it must not be tabbable. If focus is inside
  // it as it hides, move focus out (least-disruptive safe fallback) so focus never
  // remains in an inert subtree.
  useEffect(() => {
    if (scrolled) return;
    const bar = barRef.current;
    if (bar && bar.contains(document.activeElement)) {
      document.activeElement.blur?.();
    }
  }, [scrolled]);

  const hasTrailer = Boolean(mv.trailerYouTubeId);

  return (
    <div
      ref={barRef}
      className="ff-movie-sticky-bar"
      // Hidden (un-scrolled) → aria-hidden + inert so its controls leave the
      // accessibility tree and the tab order. Shown → fully interactive.
      aria-hidden={!scrolled || undefined}
      inert={!scrolled ? true : undefined}
      style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        padding:'12px 56px',
        background:'var(--ts-surface-1, #1d1814)',
        borderBottom:`1px solid ${HP.border}`,
        transform: scrolled ? 'translateY(0)' : 'translateY(-100%)',
        transition:'transform 0.35s cubic-bezier(0.2,0.8,0.2,1)',
        pointerEvents: scrolled ? 'auto' : 'none',
        display:'flex', alignItems:'center', gap:20,
      }}
    >
      <div style={{ display:'flex', alignItems:'center', gap:14, flex:1 }}>
        {mv.poster && <img src={mv.poster} alt="" style={{ width:30, height:45, objectFit:'cover', borderRadius:3 }} />}
        <div>
          <div style={{ fontFamily:'Inter, sans-serif', fontSize:15, fontWeight:600, color: HP.text, letterSpacing:'-0.01em' }}>{mv.title}</div>
          <div style={{ fontSize:11, color: HP.textMuted, fontFamily:'Inter, sans-serif', letterSpacing:'0.04em' }}>
            {mv.year || '—'}
            {mv.director && mv.director !== '—' && <> · {mv.director}</>}
          </div>
        </div>
      </div>
      <Button
        variant="primary"
        size="sm"
        className={MOVIE_PRIMARY_COMPAT_SM}
        onClick={onPlayTrailer}
        disabled={!hasTrailer}
        title={hasTrailer ? undefined : 'No trailer available'}
        style={{
          padding:'8px 14px', borderRadius:RADIUS.sm,
          fontSize:12, fontWeight:600,
          cursor: hasTrailer ? 'pointer' : 'not-allowed', opacity: hasTrailer ? 1 : 0.5,
        }}
      >
        <span>Play Trailer</span>
      </Button>
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
    <section className="ff-movie-section" style={{ padding:'72px 88px 48px', borderTop:`1px solid ${HP.border}` }}>
      {/* Left column intentionally center-aligned to the right cards' total
          height — short headline + rationale on the left, four cards on the
          right. Sticky positioning used to pin the left during scroll, but
          that left a tall void below it. Centering balances the visual mass. */}
      <div className="ff-movie-why-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:72, alignItems:'center' }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:'var(--ts-text-secondary, #beb8ad)', marginBottom:18, display:'inline-flex', alignItems:'center', gap:10 }}>
            <span style={{ height:1, width:22, background:'var(--ts-border-strong, #46423d)', opacity:0.6 }} />
            {eyebrow || 'Why this fits you'}
          </div>
          <h2 className="ff-movie-section-h2" style={{ fontFamily:'Inter, sans-serif', fontSize:44, lineHeight:1.02, fontWeight:500, letterSpacing:'-0.035em', color: HP.text, margin:0, textWrap:'balance' }}>
            {headline || 'A signal-driven fit.'}
          </h2>
          {rationale && (
            <p style={{ marginTop:24, fontSize:15, lineHeight:1.7, color: HP.textSoft, fontFamily:'Inter, sans-serif', maxWidth:380, textWrap:'pretty' }}>
              {rationale}
            </p>
          )}
        </div>

        <div className="ff-movie-why-cards" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
          {reasons.map(r => {
            const active = highlightReasonId === r.id;
            return (
              <div key={r.id}
                className="ff-movie-why-card"
                onMouseEnter={() => onHoverReason?.(r.id)}
                onMouseLeave={() => onHoverReason?.(null)}
                style={{
                  padding:'28px 24px', borderRadius:RADIUS.sm,
                  border:`1px solid ${active ? 'var(--ts-border-strong, #46423d)' : HP.border}`,
                  background: active ? 'rgba(243,236,223,0.06)' : 'rgba(255,255,255,0.025)',
                  transition:'all 0.25s ease',
                  transform: active ? 'translateY(-2px)' : 'translateY(0)',
                  cursor:'default',
                }}>
                <div className="ff-movie-why-card-header">
                  <div className="ff-movie-why-card-icon" style={{ width:36, height:36, borderRadius:RADIUS.md, background:'rgba(243,236,223,0.06)', border:`1px solid var(--ts-border-subtle, #302c28)`, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--ts-text-secondary, #beb8ad)', marginBottom:18 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{iconMap[r.icon] || iconMap.dna}</svg>
                  </div>
                  <div className="ff-movie-why-card-title" style={{ fontFamily:'Inter, sans-serif', fontSize:16, fontWeight:500, color: HP.text, letterSpacing:'-0.015em', marginBottom:8 }}>{r.title}</div>
                </div>
                <p style={{ margin:0, fontSize:13, lineHeight:1.6, color: HP.textSoft, fontFamily:'Inter, sans-serif', textWrap:'pretty' }}>{r.detail}</p>
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
    <section className="ff-movie-section" style={{ padding:'56px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ maxWidth:780 }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:'var(--ts-text-secondary, #beb8ad)', display:'inline-flex', alignItems:'center', gap:10 }}>
            <span style={{ height:1, width:22, background:'var(--ts-border-strong, #46423d)', opacity:0.6 }} />Synopsis
          </div>
        </div>
        <p className="ff-movie-synopsis-text" style={{ margin:0, fontFamily:'Inter, system-ui, sans-serif', fontSize:19, lineHeight:1.6, color: HP.text, letterSpacing:'-0.01em', textWrap:'pretty', animation:'mv-fade-in 0.5s ease both' }}>
          <span style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:56, fontWeight:400, color:'var(--ts-text-primary, #f3ecdf)', float:'left', lineHeight:0.85, marginRight:10, marginTop:4, marginBottom:-6 }}>{first}</span>
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
    <section ref={ref} className="ff-movie-section" style={{ padding:'72px 88px', borderTop:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.012)' }}>
      <div className="ff-movie-radar-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:56, alignItems:'center' }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:'var(--ts-text-secondary, #beb8ad)', marginBottom:18, display:'inline-flex', alignItems:'center', gap:10 }}>
            <span style={{ height:1, width:22, background:'var(--ts-border-strong, #46423d)', opacity:0.6 }} />FeelFlick mood profile
          </div>
          <h2 className="ff-movie-section-h2" style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:40, lineHeight:1.02, fontWeight:400, letterSpacing:'-0.03em', color: HP.text, margin:0, textWrap:'balance' }}>
            How it <em style={{ fontStyle:'italic', fontWeight:400, color: HP.textSoft }}>feels.</em>
          </h2>
          {/* F5.3: generated origin made explicit; raw 0–100 numbers removed (the
              radar geometry still uses the unchanged weights internally). */}
          <p style={{ marginTop:20, fontSize:14, lineHeight:1.7, color: HP.textMuted, fontFamily:'Inter, sans-serif', maxWidth:380 }}>
            A generated reading of the film’s tone — not a measured fact. Six axes:
            pace, depth, dialogue, focus, range, intensity.
          </p>
          <div className="ff-movie-radar-list" style={{ marginTop:24, display:'flex', flexDirection:'column', gap:8 }}>
            {moods.map(m => {
              const lit = highlightMood === m.name;
              return (
                <div key={m.name}
                  onMouseEnter={() => enter(m.name)}
                  onMouseLeave={leave}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderRadius:RADIUS.sm, background: lit ? 'rgba(243,236,223,0.10)' : 'transparent', border:`1px solid ${lit ? 'var(--ts-focus, #f3ecdf)' : 'transparent'}`, transition:'all 0.25s ease', cursor:'default' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ width:8, height:8, borderRadius:RADIUS.pill, background: lit ? 'var(--ts-text-primary, #f3ecdf)' : 'var(--ts-text-muted, #8d887f)', boxShadow:'none' }} />
                    <span style={{ fontFamily:'Inter, sans-serif', fontSize:14, fontWeight:500, color: HP.text }}>{m.name}</span>
                  </div>
                  {/* F5.3: raw 0–100 value removed; axis label only (geometry uses m.weight). */}
                </div>
              );
            })}
          </div>
        </div>

        <div className="ff-movie-radar-svg" style={{ position:'relative', width:340, height:340, margin:'0 auto' }}>
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
            <path d={path(ptsFor(animW))} fill="rgba(243,236,223,0.12)" stroke="var(--ts-text-secondary, #beb8ad)" strokeWidth="1.5" />
            {ptsFor(animW).map((p, i) => {
              const m = moods[i];
              const lit = highlightMood === m.name;
              return <circle key={i} cx={p[0]} cy={p[1]} r={lit?7:4} fill={lit ? 'var(--ts-text-primary, #f3ecdf)' : 'var(--ts-text-secondary, #beb8ad)'}
                onMouseEnter={() => enter(m.name)} onMouseLeave={leave}
                style={{ transition:'all 0.3s ease', filter:'none', cursor:'default' }} />;
            })}
            {moods.map((m, i) => {
              const a = -Math.PI/2 + (i/n) * Math.PI*2;
              const lx = cx + Math.cos(a) * (R + 28);
              const ly = cy + Math.sin(a) * (R + 28);
              return (
                <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                  onMouseEnter={() => enter(m.name)} onMouseLeave={leave}
                  style={{ fontFamily:'Inter, sans-serif', fontSize:12, fontWeight:500, fill: highlightMood===m.name ? 'var(--ts-text-primary, #f3ecdf)' : HP.textSoft, letterSpacing:'0.02em', transition:'fill 0.25s ease', cursor:'default' }}>
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

// (FF Take + Critic Quotes were removed in F6B: `ff_take` now leads the
// consolidated PrimaryCaseCard, and the generated quotes moved to the honestly-
// reframed ViewerNotes component — see PrimaryCaseCard.jsx / ViewerNotes.jsx.)

function HeroRatings() {
  const { mv } = useMovieData();
  const hasRatings = mv.tmdbRating != null || mv.ffCritic != null || mv.ffAudience != null;
  if (!hasRatings) return null;
  return (
    <div className="ff-movie-hero-ratings-strip">
      {mv.tmdbRating != null && (
        <span style={{ display:'flex', alignItems:'center', gap:4 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill={HP.amber}><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>
          <span style={{ fontFamily:'Inter, sans-serif', fontSize:13, fontWeight:600, color: HP.text }}>{mv.tmdbRating}</span>
          <span style={{ fontSize:10, color: HP.textFaint, marginLeft:2 }}>TMDB</span>
        </span>
      )}
      {/* FF critic/audience scores are real aggregates from the movies row,
          not fabricated from vote_average. Each self-hides when absent. */}
      {mv.ffCritic != null && <>
        {mv.tmdbRating != null && <span style={{ width:1, height:12, background: HP.border }} />}
        <span style={{ fontSize:11, color: HP.textSoft, fontFamily:'Inter, sans-serif' }}>
          <span style={{ color: HP.amber, fontWeight:700 }}>{mv.ffCritic}%</span> Critics
        </span>
      </>}
      {mv.ffAudience != null && <>
        {(mv.tmdbRating != null || mv.ffCritic != null) && <span style={{ width:1, height:12, background: HP.border }} />}
        <span style={{ fontSize:11, color: HP.textSoft, fontFamily:'Inter, sans-serif' }}>
          <span style={{ color: HP.text, fontWeight:700 }}>{mv.ffAudience}%</span> Audience
        </span>
      </>}
    </div>
  );
}

export { ScrollProgress, FilmGrain, MovieHero, StickyActionBar, WhyForYou, Synopsis, MoodRadar, HeroRatings }
