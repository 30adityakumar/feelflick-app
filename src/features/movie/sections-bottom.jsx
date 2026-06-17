import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { tmdbImg } from '@/shared/api/tmdb'
import { PARASITE_TIMELINE_SAMPLE, PARASITE_DNA_DELTA_SAMPLE, HP as HP_BASE, RADIUS } from './data'
import { useMovieData } from './useMovieData'
import { useUserRating } from './hooks/useUserRating'

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

// FeelFlick — Movie page · Cast (flip), Videos (hover-preview), Providers, Pairs (reshuffle), Friends, TasteTwin, Timeline, Director shelf, YourTake unlock, Footer.

const RESET_BTN = {
  background:'none', border:'none', padding:0, margin:0, font:'inherit',
  color:'inherit', textAlign:'left', cursor:'pointer', display:'block', width:'100%',
};

// ── Cast with hover-flip ─────────────────────────────────────────
function CastSection() {
  const { mv, cast } = useMovieData();
  if (cast.length === 0) return null;
  const hasCrew = (mv.cinematographer && mv.cinematographer !== '—') || (mv.composer && mv.composer !== '—');
  return (
    <section className="ff-movie-section" style={{ padding:'72px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:32, flexWrap:'wrap', gap:24 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: 'var(--ts-text-secondary, #beb8ad)', marginBottom:14, display:'inline-flex', alignItems:'center', gap:10 }}>
            <span style={{ height:1, width:22, background: 'var(--ts-border-strong, #46423d)', opacity:0.6 }} />Ensemble
          </div>
          <h2 className="ff-movie-section-h2" style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:44, lineHeight:1, fontWeight:400, letterSpacing:'-0.035em', color: HP.text, margin:0 }}>The cast.</h2>
        </div>
        {hasCrew && (
          <div style={{ fontSize:12, color: HP.textMuted, fontFamily:'Inter, sans-serif', letterSpacing:'0.06em' }}>
            {mv.cinematographer && mv.cinematographer !== '—' && <>
              <span style={{ color: HP.textSoft }}>Cinematography</span> {mv.cinematographer}
            </>}
            {mv.cinematographer && mv.cinematographer !== '—' && mv.composer && mv.composer !== '—' && (
              <span style={{ width:1, height:11, background: HP.border, display:'inline-block', margin:'0 14px', verticalAlign:'middle' }} />
            )}
            {mv.composer && mv.composer !== '—' && <>
              <span style={{ color: HP.textSoft }}>Music</span> {mv.composer}
            </>}
          </div>
        )}
      </div>
      <div className="ff-movie-cast-grid" style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(cast.length, 6)}, 1fr)`, gap:18 }}>
        {cast.map(p => <CastCard key={p.name} p={p} />)}
      </div>
    </section>
  );
}

function CastCard({ p }) {
  const reduced = useReducedMotion();
  const [hover, setHover] = useState(false);
  const hasFlip = p.also && p.also.length > 0;
  const hasProfile = Boolean(p.profilePath);
  const flipped = hasFlip && hover;
  return (
    <button
      type="button"
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      onFocus={()=>setHover(true)}
      onBlur={()=>setHover(false)}
      aria-label={`${p.name} as ${p.role}`}
      style={{ ...RESET_BTN, perspective:1000 }}
    >
      {/* F5.4: the 3D flip transition is instant under reduced motion (the back face
          still appears on hover/focus — just without the spin). */}
      <div style={{ aspectRatio:'2/3', borderRadius:RADIUS.sm, marginBottom:14, position:'relative', transformStyle:'preserve-3d', transition: reduced ? 'none' : 'transform 0.6s cubic-bezier(0.2,0.8,0.2,1)', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
        {/* Front */}
        <div style={{ position:'absolute', inset:0, borderRadius:RADIUS.sm, overflow:'hidden', background:'var(--ts-surface-2, #241e19)', border:`1px solid ${HP.border}`, backfaceVisibility:'hidden' }}>
          {hasProfile ? (
            <img src={tmdbImg(p.profilePath, 'w342')} alt={p.name} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
          ) : (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif', fontSize:54, fontWeight:200, color:'var(--ts-text-secondary, #beb8ad)', opacity:0.6 }}>{p.name.split(' ').map(w=>w[0]).join('')}</div>
          )}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.65))' }} />
        </div>
        {/* Back (only when filmography data has resolved) */}
        {hasFlip && (
          <div style={{ position:'absolute', inset:0, borderRadius:RADIUS.sm, padding:16, background:'var(--ts-surface-2, #241e19)', border:'1px solid var(--ts-border-subtle, #302c28)', backfaceVisibility:'hidden', transform:'rotateY(180deg)', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color: HP.text, opacity:0.85, marginBottom:10 }}>Also in</div>
              <ul style={{ margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:6 }}>
                {p.also.map(t => <li key={t} style={{ fontFamily:'Inter, sans-serif', fontSize:12, color: HP.text, fontStyle:'italic', letterSpacing:'-0.005em' }}>{t}</li>)}
              </ul>
            </div>
            {/* Real overlap count from user_history. When the user has zero
                of this actor's other films, the line stays out so we don't
                ship a misleading "0 in your library" footer. */}
            {p.inYourLibrary > 0 && (
              <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color: HP.text, opacity:0.6 }}>
                {p.inYourLibrary} in your library
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ fontFamily:'Inter, sans-serif', fontSize:14, fontWeight:500, color: HP.text, letterSpacing:'-0.015em', marginBottom:4 }}>{p.name}</div>
      <div style={{ fontSize:11, color: HP.textMuted, fontFamily:'Inter, sans-serif', fontStyle:'italic' }}>{p.role}</div>
    </button>
  );
}

// ── Videos: extras only ───────────────────────────────────────────
// The main trailer is reachable from three places on the page already (hero
// CTA, sticky bar CTA, sticky bar's Play Trailer on scroll). A fourth giant
// thumbnail in the middle is just redundant scroll-mass. Self-hide the
// whole section when there are no extras to surface.
//
// TMDB orders videos by official + recency, so videos[0] is virtually always
// the canonical main trailer. We skip it here and ship the supporting roster
// — featurettes, extended cuts, behind-the-scenes clips, foreign trailers.
function VideosSection({ onPlayVideo }) {
  const { videos } = useMovieData();
  const extras = videos.slice(1);
  if (extras.length === 0) return null;
  return (
    <section className="ff-movie-section" style={{ padding:'64px 88px', borderTop:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.012)' }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: 'var(--ts-text-secondary, #beb8ad)', marginBottom:18, display:'inline-flex', alignItems:'center', gap:10 }}>
        <span style={{ height:1, width:22, background: 'var(--ts-border-strong, #46423d)', opacity:0.6 }} />More to watch
      </div>
      <h2 className="ff-movie-section-h2" style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:36, lineHeight:1.05, fontWeight:400, letterSpacing:'-0.03em', color: HP.text, margin:'0 0 28px 0' }}>
        Featurettes & <em style={{ fontStyle:'italic', fontWeight:400, color: HP.textSoft }}>extras.</em>
      </h2>
      <div className="ff-movie-videos-rest" style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(extras.length, 3)},1fr)`, gap:18 }}>
        {extras.map(v => <VideoThumb key={v.id} v={v} onPlay={() => onPlayVideo?.(v)} />)}
      </div>
    </section>
  );
}

function VideoThumb({ v, onPlay }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      onFocus={()=>setHover(true)}
      onBlur={()=>setHover(false)}
      onClick={onPlay}
      aria-label={`Play ${v.title}`}
      style={{ ...RESET_BTN, cursor:'pointer' }}
    >
      <div style={{ position:'relative', aspectRatio:'16/9', borderRadius:RADIUS.xs, overflow:'hidden', marginBottom:12, transform: hover?'translateY(-2px)':'none', transition:'transform 0.25s ease', boxShadow: hover ? `0 16px 40px -10px rgba(0,0,0,0.6)` : 'none' }}>
        <img src={v.thumb} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter: hover?'brightness(0.55) saturate(1.2)':'none', transition:'filter 0.3s ease' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.7))' }} />
        <div style={{ position:'absolute', top:10, left:10, padding:'3px 8px', borderRadius:3, background:'rgba(0,0,0,0.7)', fontSize:9, fontWeight:600, color: HP.textSoft, fontFamily:'Inter, sans-serif', letterSpacing:'0.14em', textTransform:'uppercase' }}>{v.kind}</div>
        {v.duration && v.duration !== '—' && (
          <div style={{ position:'absolute', bottom:10, right:10, fontSize:11, color: HP.text, fontFamily:'Inter, sans-serif', fontWeight:500 }}>{v.duration}</div>
        )}
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:`translate(-50%,-50%) scale(${hover?1.15:1})`, width:48, height:48, borderRadius:RADIUS.pill, background:'rgba(255,255,255,0.95)', display:'flex', alignItems:'center', justifyContent:'center', transition:'transform 0.3s ease' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#0a0510"><path d="M5 3v18l16-9z"/></svg>
        </div>
      </div>
      <div style={{ fontFamily:'Inter, sans-serif', fontSize:14, fontWeight:500, color: HP.text, letterSpacing:'-0.01em' }}>{v.title}</div>
    </button>
  );
}

// ── Providers ────────────────────────────────────────────────────
const PROVIDER_ATTRIBUTION = 'Availability for the United States via TMDB and JustWatch. Listings can change or lag behind provider updates.';

// F5.7: an EYEBROW + a labelled <section> shared by every provider state.
function ProviderSectionShell({ children }) {
  return (
    <section className="ff-movie-section ff-movie-providers" aria-label="Where to watch" style={{ padding:'64px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: 'var(--ts-text-secondary, #beb8ad)', marginBottom:14, display:'inline-flex', alignItems:'center', gap:10 }}>
        <span style={{ height:1, width:22, background: 'var(--ts-border-strong, #46423d)', opacity:0.6 }} />Where to watch
      </div>
      {children}
    </section>
  );
}
const sectionH2 = { fontFamily:'Inter, system-ui, sans-serif', fontSize:36, lineHeight:1.05, fontWeight:400, letterSpacing:'-0.03em', color: 'var(--ts-text-primary, #f3ecdf)', margin:0 };
const stateBody = { margin:'14px 0 0 0', fontSize:14, lineHeight:1.6, color:'var(--ts-text-secondary, #beb8ad)', fontFamily:'Inter, sans-serif', maxWidth:520, overflowWrap:'anywhere' };
const attributionStyle = { margin:'18px 0 0 0', fontSize:11.5, lineHeight:1.5, color:'var(--ts-text-secondary, #beb8ad)', fontFamily:'Inter, sans-serif', maxWidth:560, overflowWrap:'anywhere' };

function ProvidersSection() {
  const { providers, providerStatus } = useMovieData();
  const status = providerStatus
    || (providers.flatrate.length + providers.rent.length + providers.buy.length > 0 ? 'found' : 'empty');

  if (status === 'idle') return null;

  if (status === 'loading') {
    return (
      <ProviderSectionShell>
        <div role="status" aria-live="polite" style={{ marginTop:6, fontSize:14, color:'var(--ts-text-secondary, #beb8ad)', fontFamily:'Inter, sans-serif' }}>
          Checking availability…
        </div>
      </ProviderSectionShell>
    );
  }

  if (status === 'empty') {
    return (
      <ProviderSectionShell>
        <h2 className="ff-movie-section-h2" style={{ ...sectionH2, color:'var(--ts-text-primary, #f3ecdf)' }}>Availability not found</h2>
        <p style={stateBody}>We couldn’t find streaming, rental, or purchase options for the United States.</p>
        <p style={attributionStyle}>{PROVIDER_ATTRIBUTION}</p>
      </ProviderSectionShell>
    );
  }

  if (status === 'error') {
    return (
      <ProviderSectionShell>
        <h2 className="ff-movie-section-h2" style={{ ...sectionH2, color:'var(--ts-text-primary, #f3ecdf)' }}>Availability unavailable</h2>
        <p style={stateBody}>Provider information couldn’t be reached right now.</p>
        <p style={stateBody}>You can check again later or search directly on JustWatch.</p>
        <a
          href="https://www.justwatch.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginTop:18, display:'inline-flex', alignItems:'center', gap:6, fontSize:11, color: HP.textSoft, fontFamily:'Inter, sans-serif', letterSpacing:'0.06em', textTransform:'uppercase', textDecoration:'none' }}
        >
          Search on JustWatch <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span>
        </a>
      </ProviderSectionShell>
    );
  }

  // found
  const ProviderChip = ({ p }) => (
    <a
      href={providers.link || 'https://www.justwatch.com'}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Watch on ${p.name} (opens JustWatch in a new tab)`}
      title={p.name}
      style={{ width:56, height:56, borderRadius:RADIUS.md, background:'rgba(243,236,223,0.06)', border:`1px solid ${HP.border}`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', textDecoration:'none', cursor:'pointer', transition:'all 0.2s' }}
    >
      {p.logoPath ? (
        <img src={tmdbImg(p.logoPath, 'w92')} alt="" style={{ width:40, height:40, objectFit:'contain', borderRadius:RADIUS.xs }} />
      ) : (
        <span style={{ fontFamily:'Inter, sans-serif', fontWeight:700, fontSize:20, color:p.tint }}>{p.logo}</span>
      )}
    </a>
  );

  return (
    <section className="ff-movie-section ff-movie-providers" aria-label="Where to watch" style={{ padding:'64px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div className="ff-movie-providers-grid" style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:64, alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: 'var(--ts-text-secondary, #beb8ad)', marginBottom:14, display:'inline-flex', alignItems:'center', gap:10 }}>
            <span style={{ height:1, width:22, background: 'var(--ts-border-strong, #46423d)', opacity:0.6 }} />Where to watch
          </div>
          <h2 className="ff-movie-section-h2" style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:36, lineHeight:1.05, fontWeight:400, letterSpacing:'-0.03em', color: HP.text, margin:0 }}>
            Streaming <em style={{ fontStyle:'italic', fontWeight:400, color: HP.textSoft }}>now.</em>
          </h2>
          <a
            href={providers.link || 'https://www.justwatch.com'}
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginTop:18, display:'inline-flex', alignItems:'center', gap:6, fontSize:11, color: HP.textSoft, fontFamily:'Inter, sans-serif', letterSpacing:'0.06em', textTransform:'uppercase', textDecoration:'none' }}
          >
            More options on JustWatch <span aria-hidden="true">›</span><span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
        <div>
          {providers.flatrate.length > 0 && <>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color: HP.textMuted, marginBottom:14, fontFamily:'Inter, sans-serif' }}>Stream</div>
            <div style={{ display:'flex', gap:10, marginBottom:28, flexWrap:'wrap' }}>{providers.flatrate.map((p,i) => <ProviderChip key={i} p={p} />)}</div>
          </>}
          {(providers.rent.length > 0 || providers.buy.length > 0) && <>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color: HP.textMuted, marginBottom:14, fontFamily:'Inter, sans-serif' }}>Rent / Buy</div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {providers.rent.map((p,i) => <ProviderChip key={`r${i}`} p={p} />)}
              {providers.buy.map((p,i) => <ProviderChip key={`b${i}`} p={p} />)}
            </div>
          </>}
          <p style={attributionStyle}>{PROVIDER_ATTRIBUTION}</p>
        </div>
      </div>
    </section>
  );
}

// ── Pairs with (reshuffle) ───────────────────────────────────────
function PairsWith({ goToMovie }) {
  const { similar } = useMovieData();
  const [seed, setSeed] = useState(0);
  if (similar.length === 0) return null;
  const pageSize = Math.min(4, similar.length);
  const picks = (() => {
    const start = (seed * pageSize) % similar.length;
    return Array.from({ length: pageSize }, (_, i) => similar[(start + i) % similar.length]);
  })();
  const canReshuffle = similar.length > pageSize;

  return (
    <section className="ff-movie-section" style={{ padding:'88px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:36, flexWrap:'wrap', gap:20 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: 'var(--ts-text-secondary, #beb8ad)', marginBottom:14, display:'inline-flex', alignItems:'center', gap:10 }}>
            <span style={{ height:1, width:22, background: 'var(--ts-border-strong, #46423d)', opacity:0.6 }} />Pairs with
          </div>
          <h2 className="ff-movie-section-h2" style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:48, lineHeight:1, fontWeight:400, letterSpacing:'-0.035em', color: HP.text, margin:0, textWrap:'balance' }}>
            If this hits, <em style={{ fontStyle:'italic', fontWeight:400, color: HP.textSoft }}>these will too.</em>
          </h2>
        </div>
        {canReshuffle && (
          <button onClick={()=>setSeed(s=>s+1)} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 16px', borderRadius:RADIUS.pill, background:'rgba(243,236,223,0.06)', border:`1px solid ${HP.borderStrong}`, color: HP.textSoft, fontFamily:'Inter, sans-serif', fontSize:12, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 18 0M3 12l3-3M3 12l3 3"/></svg>
            Show me more
          </button>
        )}
      </div>
      <div key={seed} className="ff-movie-pairs-grid" style={{ display:'grid', gridTemplateColumns:`repeat(${pageSize},1fr)`, gap:24 }}>
        {picks.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => goToMovie?.(s.tmdbId)}
            aria-label={`Open ${s.title}${s.year ? ` (${s.year})` : ''}`}
            style={{ ...RESET_BTN, animation:`mv-pair-in 0.6s ${i*0.08}s cubic-bezier(0.2,0.8,0.2,1) both` }}
          >
            <div style={{ position:'relative', borderRadius:RADIUS.sm, overflow:'hidden', marginBottom:14, boxShadow:'0 12px 28px -10px rgba(0,0,0,0.5)' }}>
              <img src={s.poster} alt={s.title} style={{ width:'100%', aspectRatio:'2/3', objectFit:'cover', display:'block' }} />
              {/* F5.3: user-match % removed from Pairs-With cards (no fit number
                  outside the PrimaryCase band; s.match is unchanged in the data). */}
            </div>
            <div style={{ fontFamily:'Inter, sans-serif', fontSize:17, fontWeight:500, color: HP.text, letterSpacing:'-0.015em' }}>{s.title}</div>
            <div style={{ fontSize:11, color: HP.textMuted, fontFamily:'Inter, sans-serif', letterSpacing:'0.04em', marginTop:3, marginBottom:10 }}>
              {s.year}{s.dir ? ` · ${s.dir}` : ''}
            </div>
            {s.why && (
              <span style={{ display:'block', fontSize:12.5, lineHeight:1.55, color: HP.textSoft, fontFamily:'Inter, sans-serif', fontStyle:'italic' }}>{s.why}</span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

// ── Friends loved this (real data, hide when empty) ──────────────
function FriendsLoved({ friends }) {
  const [open, setOpen] = useState(false);
  if (!friends || friends.length === 0) return null;

  const summaryNames = friends.slice(0, 3).map(f => f.name).join(', ');
  const avgRating = friends.reduce((sum, f) => sum + (f.rating || 0), 0) / friends.length;
  const avgDisplay = (avgRating / 2).toFixed(1); // convert 1-10 → 1-5 for the star display

  return (
    <section className="ff-movie-section" style={{ padding:'56px 88px', borderTop:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.012)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:32, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:24 }}>
          <div style={{ display:'flex' }}>
            {friends.slice(0, 5).map((f, i) => (
              <div key={f.id} style={{ width:36, height:36, borderRadius:RADIUS.pill, background: f.avatarBg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif', fontWeight:700, color:'#0A0510', fontSize:14, border:'2px solid #06060a', marginLeft: i>0 ? -10 : 0, overflow:'hidden' }}>
                {f.avatarUrl ? (
                  <img src={f.avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                ) : (
                  (f.name || '?').charAt(0).toUpperCase()
                )}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontFamily:'Inter, sans-serif', fontSize:16, fontWeight:500, color: HP.text, letterSpacing:'-0.01em' }}>
              {friends.length} {friends.length === 1 ? 'person' : 'people'} you follow loved this
            </div>
            <div style={{ fontSize:12, color: HP.textMuted, fontFamily:'Inter, sans-serif', marginTop:2 }}>
              {summaryNames} · avg <span style={{ color: HP.amber, fontWeight:600 }}>{avgDisplay}★</span>
            </div>
          </div>
        </div>
        {friends.some(f => f.reviewText) && (
          <button
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            style={{ padding:'10px 18px', borderRadius:RADIUS.sm, background:'transparent', border:`1px solid ${HP.borderStrong}`, color: HP.textSoft, fontFamily:'Inter, sans-serif', fontSize:12, fontWeight:600, letterSpacing:'0.04em', cursor:'pointer' }}
          >
            {open ? 'Hide notes' : 'See their notes →'}
          </button>
        )}
      </div>
      {open && (
        <div style={{ marginTop:20, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:14, animation:'mv-fade-in 0.3s ease both' }}>
          {friends.filter(f => f.reviewText).map(f => (
            <div key={f.id} style={{ padding:'14px 16px', borderRadius:RADIUS.sm, background:'rgba(255,255,255,0.03)', border:`1px solid ${HP.border}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <div style={{ width:28, height:28, borderRadius:RADIUS.pill, background: f.avatarBg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif', fontWeight:700, color:'#0A0510', fontSize:12, overflow:'hidden' }}>
                  {f.avatarUrl ? <img src={f.avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (f.name || '?').charAt(0).toUpperCase()}
                </div>
                <div style={{ fontFamily:'Inter, sans-serif', fontSize:13, fontWeight:600, color: HP.text }}>{f.name}</div>
                <div style={{ marginLeft:'auto', fontSize:11, color: HP.amber, fontFamily:'Inter, sans-serif', fontWeight:700 }}>{(f.rating / 2).toFixed(1)}★</div>
              </div>
              <div style={{ fontSize:12, color: HP.textMuted, fontFamily:'Inter, sans-serif', fontStyle:'italic' }}>
                {f.reviewText}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Taste-twin spotlight review (real twin who rated this film) ──
// twin.note / twin.name / twin.rating are REAL user-authored data (user_ratings.
// review_text + the user's own rating) and must remain. twin.matchPct is the two
// users' OVERALL profile-level taste similarity (user_similarity) — NOT agreement on
// this specific film — so it is labelled "overall taste similarity" (F5.3). The
// similarity value/calc is unchanged. (Consent/privacy is a product-policy follow-up.)
function TasteTwinReview({ twin }) {
  if (!twin) return null;
  // user_ratings.rating is 1-10; star display is 1-5.
  const starsFilled = Math.round(twin.rating / 2);
  return (
    <section className="ff-movie-section" style={{ padding:'72px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div className="ff-movie-twin-grid" style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:48, alignItems:'flex-start' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ position:'relative', width:96, height:96, borderRadius:RADIUS.pill, background: twin.avatarBg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif', fontWeight:700, color:'#0A0510', fontSize:36, margin:'0 auto', boxShadow:'0 1px 2px rgba(0,0,0,0.3)', overflow:'hidden' }}>
            {twin.avatarUrl ? (
              <img src={twin.avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            ) : (
              (twin.name || '?').charAt(0).toUpperCase()
            )}
            <div aria-label={`${twin.matchPct}% overall taste similarity`} style={{ position:'absolute', bottom:-6, right:-6, padding:'3px 9px', borderRadius:RADIUS.pill, background: HP.bgDeep, border:'1px solid var(--ts-border-strong, #46423d)', fontSize:10, fontWeight:700, color: 'var(--ts-text-primary, #f3ecdf)', fontFamily:'Inter, sans-serif' }}>{twin.matchPct}%</div>
          </div>
          <div style={{ marginTop:14, fontFamily:'Inter, sans-serif', fontSize:14, fontWeight:600, color: HP.text }}>{twin.name}</div>
          <div style={{ fontSize:11, color: HP.textMuted, fontFamily:'Inter, sans-serif', letterSpacing:'0.06em', textTransform:'uppercase', marginTop:3 }}>Your taste twin</div>
          <div style={{ fontSize:10.5, color: HP.textMuted, fontFamily:'Inter, sans-serif', letterSpacing:'0.04em', marginTop:4 }}>{twin.matchPct}% overall taste similarity</div>
        </div>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: 'var(--ts-text-secondary, #beb8ad)', marginBottom:14, display:'inline-flex', alignItems:'center', gap:10 }}>
            <span style={{ height:1, width:22, background: 'var(--ts-border-strong, #46423d)', opacity:0.6 }} />They rated it · {twin.watchedDate}
          </div>
          {twin.note ? (
            <p style={{ margin:0, fontFamily:'Inter, system-ui, sans-serif', fontSize:24, lineHeight:1.5, color: HP.text, fontStyle:'italic', letterSpacing:'-0.012em', textWrap:'pretty' }}>
              “{twin.note}”
            </p>
          ) : (
            <p style={{ margin:0, fontFamily:'Inter, sans-serif', fontSize:18, lineHeight:1.5, color: HP.textSoft, fontStyle:'italic', letterSpacing:'-0.012em' }}>
              No note yet — just the rating.
            </p>
          )}
          <div style={{ marginTop:18, display:'inline-flex', gap:3 }}>
            {[1,2,3,4,5].map(i => (
              <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i<=starsFilled?HP.amber:'transparent'} stroke={i<=starsFilled?HP.amber:HP.textFaint} strokeWidth="2"><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Release timeline + Languages ─────────────────────────────────
const PARASITE_TMDB_ID = 496243

function TimelineSection() {
  const { mv } = useMovieData();
  // The rich Cannes → Oscar sweep → streaming timeline in data.js is the
  // Parasite milestone set (hand-coded). Until movies_editorial_overlay
  // gains a release_timeline JSONB column we can't ship that detail per
  // film, so every other movie falls back to its single TMDB release date.
  // Auto-generated overlays MUST NOT trigger the Parasite-specific list.
  const timeline = mv.id === PARASITE_TMDB_ID
    ? PARASITE_TIMELINE_SAMPLE
    : (mv.releaseDate ? [{ date: mv.releaseDate, label: 'Released', note: null }] : []);
  if (timeline.length === 0 && mv.languages.length === 0) return null;
  // The headline + kicker overpromise when we only have a single release
  // date — "How it traveled" implies a multi-stop journey. Adapt to the
  // honest one-event case for non-Parasite films.
  const isMultiEvent = timeline.length > 1;
  const kicker = isMultiEvent ? 'Release path' : 'Release';
  const headline = isMultiEvent ? 'How it traveled.' : 'When it dropped.';
  return (
    <section className="ff-movie-section" style={{ padding:'72px 88px', borderTop:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.012)' }}>
      <div className="ff-movie-timeline-grid" style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:64, alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: 'var(--ts-text-secondary, #beb8ad)', marginBottom:14 }}>{kicker}</div>
          <h2 className="ff-movie-section-h2" style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:36, lineHeight:1.05, fontWeight:400, letterSpacing:'-0.03em', color: HP.text, margin:0 }}>{headline}</h2>
          {mv.languages.length > 0 && (
            <div style={{ marginTop:24, display:'flex', alignItems:'center', gap:10, fontSize:11, color: HP.textMuted, fontFamily:'Inter, sans-serif', letterSpacing:'0.08em', textTransform:'uppercase', flexWrap:'wrap' }}>
              <span>Languages</span>
              {mv.languages.map(l => (
                <span key={l.code} style={{ padding:'3px 8px', borderRadius:3, background:'rgba(255,255,255,0.05)', border:`1px solid ${HP.border}`, color: HP.textSoft, fontWeight:600 }}>{l.code || '—'}</span>
              ))}
            </div>
          )}
        </div>
        <div style={{ position:'relative', paddingLeft:24 }}>
          <div style={{ position:'absolute', left:5, top:6, bottom:6, width:1, background: HP.border }} />
          {timeline.map((t, i) => (
            <div key={i} style={{ position:'relative', paddingBottom:24, paddingLeft:24 }}>
              <div style={{ position:'absolute', left:-3.5, top:4, width:11, height:11, borderRadius:RADIUS.pill, background: 'var(--ts-text-primary, #f3ecdf)', boxShadow:'none' }} />
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color: HP.textMuted, fontFamily:'Inter, sans-serif' }}>{t.date}</div>
              <div style={{ fontFamily:'Inter, sans-serif', fontSize:18, fontWeight:500, color: HP.text, letterSpacing:'-0.015em', marginTop:4 }}>{t.label}</div>
              {t.note && <div style={{ fontSize:12, color: HP.textSoft, marginTop:3, fontFamily:'Inter, sans-serif', fontStyle:'italic' }}>{t.note}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Director shelf ───────────────────────────────────────────────
function DirectorShelf({ goToMovie }) {
  const { mv, dirShelf } = useMovieData();
  if (dirShelf.length === 0) return null;
  const directorLabel = mv.director && mv.director !== '—' ? `The ${mv.director.split(' ').pop()} shelf` : 'More from the director';
  return (
    <section className="ff-movie-section" style={{ padding:'72px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:32 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: 'var(--ts-text-secondary, #beb8ad)', marginBottom:14, display:'inline-flex', alignItems:'center', gap:10 }}>
            <span style={{ height:1, width:22, background: 'var(--ts-border-strong, #46423d)', opacity:0.6 }} />{directorLabel}
          </div>
          <h2 className="ff-movie-section-h2" style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:36, lineHeight:1, fontWeight:400, letterSpacing:'-0.03em', color: HP.text, margin:0 }}>
            Where to go <em style={{ fontStyle:'italic', fontWeight:400, color: HP.textSoft }}>next.</em>
          </h2>
        </div>
        {mv.directorId && (
          <a
            href={`https://www.themoviedb.org/person/${mv.directorId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding:'9px 16px', borderRadius:RADIUS.pill, background:'transparent', border:`1px solid ${HP.border}`, color: HP.textSoft, fontFamily:'Inter, sans-serif', fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', textDecoration:'none' }}
          >Full filmography →</a>
        )}
      </div>
      <div className="ff-movie-director-grid" style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(dirShelf.length, 5)}, 1fr)`, gap:18 }}>
        {dirShelf.map(f => (
          <button
            key={f.tmdbId}
            type="button"
            onClick={() => goToMovie?.(f.tmdbId)}
            aria-label={`Open ${f.title}${f.year ? ` (${f.year})` : ''}`}
            style={{ ...RESET_BTN }}
          >
            <div style={{ position:'relative', borderRadius:RADIUS.xs, overflow:'hidden', marginBottom:10, boxShadow:'0 8px 24px -8px rgba(0,0,0,0.5)' }}>
              <img src={f.poster} alt={f.title} style={{ width:'100%', aspectRatio:'2/3', objectFit:'cover', display:'block' }} onError={(e)=>{ e.currentTarget.style.display='none'; }} />
              <div style={{ position:'absolute', inset:0, background:'transparent' }} />
              {f.yourRating ? (
                <div style={{ position:'absolute', top:8, right:8, padding:'3px 7px', borderRadius:3, background:'rgba(0,0,0,0.85)', border:`1px solid ${HP.amber}55`, fontSize:9, fontWeight:700, color: HP.amber, fontFamily:'Inter, sans-serif', letterSpacing:'0.06em' }}>{f.yourRating}★ YOU</div>
              ) : (
                <div style={{ position:'absolute', top:8, right:8, padding:'3px 7px', borderRadius:3, background:'rgba(0,0,0,0.75)', border:`1px solid ${HP.border}`, fontSize:9, fontWeight:600, color: HP.textMuted, fontFamily:'Inter, sans-serif', letterSpacing:'0.06em' }}>NEW TO YOU</div>
              )}
            </div>
            <div style={{ fontFamily:'Inter, sans-serif', fontSize:13, fontWeight:500, color: HP.text, letterSpacing:'-0.01em' }}>{f.title}</div>
            <div style={{ fontSize:11, color: HP.textMuted, fontFamily:'Inter, sans-serif' }}>{f.year}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

// ── Your Take (locked → unlocked after watched) ──────────────────
// F6.5: render the reflection surface in BOTH states. YourTakeUnlocked decides whether
// to show the editable form or the compact locked prompt — it unlocks when the film is
// watched OR when the user already has a reflection, so a rating/review survives Diary
// removal and stays visible + editable even when isWatched is false. This never enables
// a brand-new unwatched rating (no existing reflection + unwatched stays locked).
function YourTake({ isWatched, userId, internalId, onSaved, onError }) {
  return <YourTakeUnlocked isWatched={isWatched} userId={userId} internalId={internalId} onSaved={onSaved} onError={onError} />;
}

// Compact-until-watched prompt (F5.5): a small, discoverable cue that does NOT interrupt
// the decision path or imply a rating already exists — the rating controls (and the Mark
// Watched action) live in the Hero / sticky bar.
function YourTakeLockedPrompt() {
  return (
    <section className="ff-movie-section ff-movie-your-take-compact" style={{ padding:'28px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color: 'var(--ts-text-secondary, #beb8ad)', marginBottom:8 }}>After watching</div>
      <h2 className="ff-movie-section-h2" style={{ fontFamily:'Inter, sans-serif', fontSize:22, lineHeight:1.1, fontWeight:500, color: HP.text, margin:0, letterSpacing:'-0.02em' }}>Your take</h2>
      <p style={{ margin:'8px 0 0 0', fontSize:13.5, lineHeight:1.5, color: HP.textMuted, fontFamily:'Inter, sans-serif', maxWidth:560 }}>
        Mark this film watched above to rate it — your ratings sharpen your engine.
      </p>
    </section>
  );
}

const REACTION_TAGS = ['Loved it', 'Liked it', 'Mixed', "Didn't connect"];

function YourTakeUnlocked({ isWatched, userId, internalId, onSaved, onError }) {
  const { mv } = useMovieData();
  // DNADelta's projected motifs are still Parasite-specific until real
  // before/after deltas land. Gate to Parasite only so auto-generated
  // overlays on other films don't surface Bong's class-tension projection.
  const showDnaDelta = mv?.id === PARASITE_TMDB_ID;
  const {
    stars, reviewText, reaction,
    setStars, setReviewText, setReaction,
    saveStatus, hydrated,
  } = useUserRating({ userId, internalId });
  const canPersist = Boolean(userId && internalId);
  // After hydration: if the user already has data, surface a passive "saved"
  // hint so the form doesn't look empty. Distinct from the transient 'saved'
  // status that flashes after a write.
  const hasPersistedData = hydrated && (stars > 0 || reviewText || reaction);
  const showIdleSavedHint = saveStatus === 'idle' && hasPersistedData;
  // F6.5: editable when the film is watched OR an existing reflection is present.
  // Hydration-pending + unwatched stays locked until we know whether data exists, so
  // we never flash an empty editable form for an unwatched film with no reflection.
  const unlocked = isWatched || hasPersistedData;

  // F5.4: surface the LATEST settled rating outcome through the page live region
  // once — onSaved/onError fire on each saveStatus transition (not on every render).
  const prevStatusRef = useRef(saveStatus);
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = saveStatus;
    if (prev === saveStatus) return;
    if (saveStatus === 'saved') onSaved?.();
    else if (saveStatus === 'error') onError?.();
  }, [saveStatus, onSaved, onError]);

  // Unwatched + no existing reflection → compact locked prompt (no new unwatched rating).
  if (!unlocked) return <YourTakeLockedPrompt />;

  return (
    <section className="ff-movie-section" style={{ padding:'56px 88px', borderTop:`1px solid ${HP.border}`, animation:'mv-fade-in 0.6s ease both' }}>
      <div className="ff-movie-your-take-card" aria-busy={saveStatus === 'saving' || undefined} style={{ padding:'32px 28px', borderRadius:RADIUS.sm, background:'var(--ts-surface-1, #1d1814)', border:'1px solid var(--ts-border-subtle, #302c28)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, flexWrap:'wrap', marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: 'var(--ts-text-secondary, #beb8ad)', display:'inline-flex', alignItems:'center', gap:10 }}>
            <span style={{ width:8, height:8, borderRadius:RADIUS.pill, background: 'var(--ts-text-primary, #f3ecdf)', boxShadow:'none' }} />
            Unlocked · How did it land?
          </div>
          <SaveIndicator status={saveStatus} showIdleSavedHint={showIdleSavedHint} />
        </div>
        <div className="ff-movie-your-take-grid" style={{ display:'grid', gridTemplateColumns: showDnaDelta ? '1fr 1.4fr' : '1fr', gap:48, alignItems:'flex-start', marginTop:14 }}>
          <div>
            <div className="ff-movie-your-take-stars" role="radiogroup" aria-label="Your star rating" style={{ display:'flex', gap:6, marginBottom:18 }}>
              {[1,2,3,4,5].map(i => (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={stars === i}
                  aria-label={`${i} star${i > 1 ? 's' : ''}`}
                  // Click the same star twice to clear the rating (canonical
                  // "remove" gesture — Letterboxd, IMDb, Apple TV all behave
                  // this way). Hook deletes the row when stars=0 + note empty.
                  onClick={() => setStars(stars === i ? 0 : i)}
                  disabled={!canPersist}
                  style={{ background:'transparent', border:'none', cursor: canPersist ? 'pointer' : 'not-allowed', padding:4, opacity: canPersist ? 1 : 0.55 }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill={i<=stars?HP.amber:'transparent'} stroke={i<=stars?HP.amber:HP.textFaint} strokeWidth="1.6">
                    <path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>
                  </svg>
                </button>
              ))}
            </div>
            <div role="radiogroup" aria-label="Reaction" style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {REACTION_TAGS.map(t => {
                const active = reaction === t;
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setReaction(active ? '' : t)}
                    style={{
                      padding:'7px 12px', borderRadius:RADIUS.pill,
                      background: active ? 'rgba(243,236,223,0.06)' : 'rgba(255,255,255,0.04)',
                      border:`1px solid ${active ? 'var(--ts-focus, #f3ecdf)' : HP.border}`,
                      boxShadow: active ? 'inset 0 0 0 1px var(--ts-focus, #f3ecdf)' : 'none',
                      color: active ? HP.text : HP.textSoft,
                      fontFamily:'Inter, sans-serif', fontSize:11.5, fontWeight: active ? 700 : 500, cursor:'pointer', letterSpacing:'-0.005em',
                      transition:'all 0.18s ease',
                    }}>
                    {t}
                  </button>
                );
              })}
            </div>
            <label style={{ display:'block', marginTop:18 }}>
              <span style={{ position:'absolute', width:1, height:1, padding:0, margin:-1, overflow:'hidden', clip:'rect(0,0,0,0)', whiteSpace:'nowrap', border:0 }}>Your note</span>
              <textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                disabled={!canPersist}
                placeholder={canPersist
                  ? 'Optional: one sentence on what stuck with you…'
                  : 'Sign in to save your note.'}
                style={{ width:'100%', minHeight:80, padding:'12px 14px', borderRadius:RADIUS.sm, background:'rgba(0,0,0,0.4)', border:`1px solid ${HP.border}`, color: HP.text, fontFamily:'Inter, sans-serif', fontSize:13.5, lineHeight:1.5, resize:'vertical', outline:'none', opacity: canPersist ? 1 : 0.55 }}
              />
            </label>
          </div>
          {showDnaDelta && <DNADelta />}
        </div>
      </div>
    </section>
  );
}

// Quiet right-aligned pip next to the eyebrow:
//  - 'saving' → "Saving…"
//  - 'saved'  → "Saved ✓" (transient, flashes ~1.6s after each write)
//  - 'error'  → "Save failed — retry"
//  - idle + already-persisted data → "Saved" (passive hint after hydration)
function SaveIndicator({ status, showIdleSavedHint }) {
  if (status === 'idle' && !showIdleSavedHint) return null;
  const map = {
    saving:    { label: 'Saving…',                color: HP.textMuted },
    saved:     { label: 'Saved ✓',                color: 'var(--ts-text-primary, #f3ecdf)' },
    error:     { label: 'Could not save. Try again.', color: '#f87171' },
    idleSaved: { label: 'Saved',                  color: HP.textMuted },
  };
  const key = status === 'idle' ? 'idleSaved' : status;
  const cfg = map[key] || map.saving;
  return (
    <span style={{ fontSize:10.5, fontWeight:600, letterSpacing:'0.16em', textTransform:'uppercase', color: cfg.color, fontFamily:'Inter, sans-serif', transition:'color 0.2s ease' }}>
      {cfg.label}
    </span>
  );
}

function DNADelta() {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 350);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ padding:'22px 24px', borderRadius:RADIUS.sm, background:'rgba(0,0,0,0.35)', border:`1px solid ${HP.border}` }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color: 'var(--ts-text-secondary, #beb8ad)', marginBottom:6 }}>Your engine projects this shift</div>
      <div style={{ fontSize:12, color: HP.textMuted, fontFamily:'Inter, sans-serif', fontStyle:'italic', marginBottom:18 }}>Real before/after deltas land in a follow-up — for now, projected from your taste profile.</div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {PARASITE_DNA_DELTA_SAMPLE.map(d => {
          const w = animated ? d.after : d.before;
          const delta = (d.after - d.before).toFixed(2);
          return (
            <div key={d.motif}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
                <span style={{ fontFamily:'Inter, sans-serif', fontSize:13, fontWeight:500, color: HP.text }}>{d.motif}</span>
                <span style={{ fontFamily:'Inter, sans-serif', fontSize:11, color: 'var(--ts-text-secondary, #beb8ad)', fontWeight:700 }}>+{delta}</span>
              </div>
              <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:RADIUS.pill, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${w*100}%`, background:'var(--ts-text-secondary, #beb8ad)', transition:'width 1.4s cubic-bezier(0.2,0.8,0.2,1)' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Production / Awards ──────────────────────────────────────────
function DetailsSection() {
  const { mv } = useMovieData();
  const hasRuntime = mv.runtime > 0;
  return (
    <section className="ff-movie-section" style={{ padding:'72px 88px', borderTop:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.012)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:80 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: 'var(--ts-text-secondary, #beb8ad)', marginBottom:18 }}>Production</div>
          <h3 style={{ fontFamily:'Inter, system-ui, sans-serif', fontSize:28, fontWeight:400, color: HP.text, margin:'0 0 24px 0', letterSpacing:'-0.025em' }}>The receipts.</h3>
          <div className="ff-movie-details-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'20px 32px' }}>
            {mv.releaseDate && <Stat label="Released"   value={mv.releaseDate} />}
            {hasRuntime && <Stat label="Runtime"    value={`${Math.floor(mv.runtime/60)}h ${mv.runtime%60}m`} />}
            {mv.budget !== '—' && <Stat label="Budget"     value={mv.budget} />}
            {mv.revenue !== '—' && <Stat label="Box office" value={mv.revenue} />}
            {mv.language && mv.language !== '—' && <Stat label="Language"   value={mv.language} />}
            <Stat label="Rating"     value={mv.certification} />
            {mv.director && mv.director !== '—' && <Stat label="Director"   value={mv.director} />}
            {mv.writer && mv.writer !== '—' && <Stat label="Writer"     value={mv.writer} />}
          </div>
        </div>
      </div>
    </section>
  );
}
function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize:10, color: HP.textMuted, fontFamily:'Inter, sans-serif', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:'Inter, sans-serif', fontSize:15, color: HP.text, letterSpacing:'-0.01em', fontWeight:500 }}>{value}</div>
    </div>
  );
}

function MovieFooter({ onBackToBriefing }) {
  const { mv } = useMovieData();
  const linkStyle = { fontSize:12, color: HP.textMuted, letterSpacing:'0.04em', textDecoration:'none', cursor:'pointer' };
  const btnStyle = { ...linkStyle, background:'none', border:'none', padding:0, font:'inherit' };
  return (
    <footer className="ff-movie-section ff-movie-footer" style={{ padding:'48px 88px 64px', borderTop:`1px solid ${HP.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'Inter, sans-serif', flexWrap:'wrap', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:28, height:28, borderRadius:RADIUS.sm, background: 'var(--ts-surface-2, #241e19)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif', fontWeight:700, fontSize:13, color:'var(--ts-text-primary, #f3ecdf)' }}>FF</div>
        <span style={{ fontSize:13, color: HP.textMuted, letterSpacing:'0.04em' }}>FeelFlick · Film File Nº {String(mv.id).padStart(4, '0')}</span>
      </div>
      <div style={{ display:'flex', gap:28, fontFamily:'Inter, sans-serif' }}>
        <a
          href={`mailto:hello@feelflick.com?subject=${encodeURIComponent(`Report issue: ${mv.title}`)}`}
          style={linkStyle}
        >Report an issue</a>
        <a
          href={`https://www.themoviedb.org/movie/${mv.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
        >Source: TMDB</a>
        <button
          type="button"
          onClick={onBackToBriefing}
          style={btnStyle}
        >Back to home</button>
      </div>
    </footer>
  );
}

export { CastSection, VideosSection, ProvidersSection, PairsWith, FriendsLoved, TasteTwinReview, TimelineSection, DirectorShelf, YourTake, DetailsSection, MovieFooter }
