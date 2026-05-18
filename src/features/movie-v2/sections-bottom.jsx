import { useEffect, useState } from 'react'
import { tmdbImg } from '@/shared/api/tmdb'
import { FILM_PALETTE, TIMELINE, DNA_DELTA, HP, HP_GRAD } from './data'
import { useMovieData } from './useMovieData'

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
    <section style={{ padding:'72px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:32, flexWrap:'wrap', gap:24 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: HP.purple, marginBottom:14, display:'inline-flex', alignItems:'center', gap:10 }}>
            <span style={{ height:1, width:22, background: HP.purple, opacity:0.6 }} />Ensemble
          </div>
          <h2 style={{ fontFamily:'Outfit', fontSize:44, lineHeight:1, fontWeight:500, letterSpacing:'-0.035em', color: HP.text, margin:0 }}>The cast.</h2>
        </div>
        {hasCrew && (
          <div style={{ fontSize:12, color: HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.06em' }}>
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
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(cast.length, 6)}, 1fr)`, gap:18 }}>
        {cast.map(p => <CastCard key={p.name} p={p} />)}
      </div>
    </section>
  );
}

function CastCard({ p }) {
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
      <div style={{ aspectRatio:'2/3', borderRadius:6, marginBottom:14, position:'relative', transformStyle:'preserve-3d', transition:'transform 0.6s cubic-bezier(0.2,0.8,0.2,1)', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
        {/* Front */}
        <div style={{ position:'absolute', inset:0, borderRadius:6, overflow:'hidden', background:`linear-gradient(155deg, ${p.tint}33, ${p.tint}08)`, border:`1px solid ${HP.border}`, backfaceVisibility:'hidden' }}>
          {hasProfile ? (
            <img src={tmdbImg(p.profilePath, 'w342')} alt={p.name} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
          ) : (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit', fontSize:54, fontWeight:200, color:p.tint, opacity:0.6 }}>{p.name.split(' ').map(w=>w[0]).join('')}</div>
          )}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.65))' }} />
        </div>
        {/* Back (only when filmography data exists) */}
        {hasFlip && (
          <div style={{ position:'absolute', inset:0, borderRadius:6, padding:16, background:`linear-gradient(155deg, ${p.tint}55, ${p.tint}15)`, border:`1px solid ${p.tint}55`, backfaceVisibility:'hidden', transform:'rotateY(180deg)', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color: HP.text, opacity:0.85, marginBottom:10 }}>Also in</div>
              <ul style={{ margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:6 }}>
                {p.also.map(t => <li key={t} style={{ fontFamily:'Outfit, Inter, sans-serif', fontSize:12, color: HP.text, fontStyle:'italic', letterSpacing:'-0.005em' }}>{t}</li>)}
              </ul>
            </div>
            <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color: HP.text, opacity:0.6 }}>3 in your library</div>
          </div>
        )}
      </div>
      <div style={{ fontFamily:'Outfit', fontSize:14, fontWeight:500, color: HP.text, letterSpacing:'-0.015em', marginBottom:4 }}>{p.name}</div>
      <div style={{ fontSize:11, color: HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic' }}>{p.role}</div>
    </button>
  );
}

// ── Videos with hover preview ─────────────────────────────────────
function VideosSection({ onPlayTrailer }) {
  const { videos } = useMovieData();
  if (videos.length === 0) return null;
  const main = videos[0];
  const rest = videos.slice(1);
  return (
    <section style={{ padding:'88px 88px', borderTop:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.012)' }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: HP.purple, marginBottom:24, display:'inline-flex', alignItems:'center', gap:10 }}>
        <span style={{ height:1, width:22, background: HP.purple, opacity:0.6 }} />Press play
      </div>
      <h2 style={{ fontFamily:'Outfit', fontSize:44, lineHeight:1, fontWeight:500, letterSpacing:'-0.035em', color: HP.text, margin:'0 0 36px 0' }}>Trailers & extras.</h2>

      <button
        type="button"
        onClick={onPlayTrailer}
        aria-label={`Play ${main.title}`}
        style={{ ...RESET_BTN, position:'relative', borderRadius:6, overflow:'hidden', cursor:'pointer', boxShadow:`0 28px 80px -20px rgba(0,0,0,0.9), 0 0 60px ${FILM_PALETTE.primary}22` }}
      >
        <img src={main.thumb} alt={main.title} style={{ width:'100%', aspectRatio:'16/9', objectFit:'cover', display:'block' }} />
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg, rgba(0,0,0,0.20), rgba(0,0,0,0.70)), radial-gradient(circle at 50% 50%, ${FILM_PALETTE.primary}33, transparent 60%)` }} />
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:96, height:96, borderRadius:999, background:'rgba(255,255,255,0.95)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 16px 56px -8px rgba(0,0,0,0.7), 0 0 0 8px rgba(255,255,255,0.05)`, transition:'transform 0.3s ease' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="#0a0510"><path d="M5 3v18l16-9z"/></svg>
          </div>
        </div>
        <div style={{ position:'absolute', bottom:24, left:28, right:28, display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color: HP.purple }}>{main.kind}{main.duration && main.duration !== '—' ? ` · ${main.duration}` : ''}</div>
            <div style={{ fontFamily:'Outfit', fontSize:26, fontWeight:500, color: HP.text, letterSpacing:'-0.02em', marginTop:4 }}>{main.title}</div>
          </div>
        </div>
      </button>

      {rest.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(rest.length, 3)},1fr)`, gap:18, marginTop:18 }}>
          {rest.map(v => <VideoThumb key={v.id} v={v} onPlay={onPlayTrailer} />)}
        </div>
      )}
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
      <div style={{ position:'relative', aspectRatio:'16/9', borderRadius:4, overflow:'hidden', marginBottom:12, transform: hover?'translateY(-2px)':'none', transition:'transform 0.25s ease', boxShadow: hover ? `0 16px 40px -10px rgba(0,0,0,0.6)` : 'none' }}>
        <img src={v.thumb} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter: hover?'brightness(0.55) saturate(1.2)':'none', transition:'filter 0.3s ease' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.7))' }} />
        <div style={{ position:'absolute', top:10, left:10, padding:'3px 8px', borderRadius:3, background:'rgba(0,0,0,0.7)', fontSize:9, fontWeight:600, color: HP.textSoft, fontFamily:'Outfit', letterSpacing:'0.14em', textTransform:'uppercase' }}>{v.kind}</div>
        {v.duration && v.duration !== '—' && (
          <div style={{ position:'absolute', bottom:10, right:10, fontSize:11, color: HP.text, fontFamily:'Outfit', fontWeight:500 }}>{v.duration}</div>
        )}
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:`translate(-50%,-50%) scale(${hover?1.15:1})`, width:48, height:48, borderRadius:999, background:'rgba(255,255,255,0.95)', display:'flex', alignItems:'center', justifyContent:'center', transition:'transform 0.3s ease' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#0a0510"><path d="M5 3v18l16-9z"/></svg>
        </div>
      </div>
      <div style={{ fontFamily:'Outfit', fontSize:14, fontWeight:500, color: HP.text, letterSpacing:'-0.01em' }}>{v.title}</div>
    </button>
  );
}

// ── Providers ────────────────────────────────────────────────────
function ProvidersSection() {
  const { providers } = useMovieData();
  const hasAny = providers.flatrate.length + providers.rent.length + providers.buy.length > 0;
  if (!hasAny) return null;

  const ProviderChip = ({ p }) => (
    <a
      href={providers.link || 'https://www.justwatch.com'}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Watch on ${p.name} (opens JustWatch in a new tab)`}
      title={p.name}
      style={{ width:56, height:56, borderRadius:8, background:'rgba(255,255,255,0.06)', border:`1px solid ${HP.border}`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', textDecoration:'none', cursor:'pointer', transition:'all 0.2s' }}
    >
      {p.logoPath ? (
        <img src={tmdbImg(p.logoPath, 'w92')} alt="" style={{ width:40, height:40, objectFit:'contain', borderRadius:4 }} />
      ) : (
        <span style={{ fontFamily:'Outfit', fontWeight:700, fontSize:20, color:p.tint }}>{p.logo}</span>
      )}
    </a>
  );

  return (
    <section style={{ padding:'64px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:64, alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: HP.purple, marginBottom:14 }}>Where to watch</div>
          <h2 style={{ fontFamily:'Outfit', fontSize:36, lineHeight:1.05, fontWeight:500, letterSpacing:'-0.03em', color: HP.text, margin:0 }}>Pick your portal.</h2>
          <a
            href={providers.link || 'https://www.justwatch.com'}
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginTop:18, display:'inline-flex', alignItems:'center', gap:6, fontSize:11, color: HP.textSoft, fontFamily:'Outfit', letterSpacing:'0.06em', textTransform:'uppercase', textDecoration:'none' }}
          >
            More options on JustWatch <span style={{ fontSize:14, lineHeight:1 }}>›</span>
          </a>
        </div>
        <div>
          {providers.flatrate.length > 0 && <>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color: HP.textMuted, marginBottom:14, fontFamily:'Outfit' }}>Stream</div>
            <div style={{ display:'flex', gap:10, marginBottom:28, flexWrap:'wrap' }}>{providers.flatrate.map((p,i) => <ProviderChip key={i} p={p} />)}</div>
          </>}
          {(providers.rent.length > 0 || providers.buy.length > 0) && <>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color: HP.textMuted, marginBottom:14, fontFamily:'Outfit' }}>Rent / Buy</div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {providers.rent.map((p,i) => <ProviderChip key={`r${i}`} p={p} />)}
              {providers.buy.map((p,i) => <ProviderChip key={`b${i}`} p={p} />)}
            </div>
          </>}
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
    <section style={{ padding:'88px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:36, flexWrap:'wrap', gap:20 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: HP.purple, marginBottom:14, display:'inline-flex', alignItems:'center', gap:10 }}>
            <span style={{ height:1, width:22, background: HP.purple, opacity:0.6 }} />Pairs with
          </div>
          <h2 style={{ fontFamily:'Outfit', fontSize:48, lineHeight:1, fontWeight:500, letterSpacing:'-0.035em', color: HP.text, margin:0, textWrap:'balance' }}>
            If this hits, <em style={{ fontStyle:'italic', fontWeight:400, color: HP.textSoft }}>these will too.</em>
          </h2>
        </div>
        {canReshuffle && (
          <button onClick={()=>setSeed(s=>s+1)} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 16px', borderRadius:999, background:'rgba(255,255,255,0.06)', border:`1px solid ${HP.borderStrong}`, color: HP.textSoft, fontFamily:'Outfit', fontSize:12, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 18 0M3 12l3-3M3 12l3 3"/></svg>
            Reshuffle
          </button>
        )}
      </div>
      <div key={seed} style={{ display:'grid', gridTemplateColumns:`repeat(${pageSize},1fr)`, gap:24 }}>
        {picks.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => goToMovie?.(s.tmdbId)}
            aria-label={`Open ${s.title}${s.year ? ` (${s.year})` : ''}`}
            style={{ ...RESET_BTN, animation:`mv-pair-in 0.6s ${i*0.08}s cubic-bezier(0.2,0.8,0.2,1) both` }}
          >
            <div style={{ position:'relative', borderRadius:6, overflow:'hidden', marginBottom:14, boxShadow:'0 12px 28px -10px rgba(0,0,0,0.5)' }}>
              <img src={s.poster} alt={s.title} style={{ width:'100%', aspectRatio:'2/3', objectFit:'cover', display:'block' }} />
              <div style={{ position:'absolute', top:10, left:10, padding:'4px 8px', borderRadius:3, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)', border:'1px solid rgba(167,139,250,0.35)', fontSize:9, fontWeight:700, color: HP.purple, fontFamily:'Outfit', letterSpacing:'0.08em' }}>
                {s.match}% MATCH
              </div>
            </div>
            <div style={{ fontFamily:'Outfit', fontSize:17, fontWeight:500, color: HP.text, letterSpacing:'-0.015em' }}>{s.title}</div>
            <div style={{ fontSize:11, color: HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.04em', marginTop:3, marginBottom:10 }}>
              {s.year}{s.dir ? ` · ${s.dir}` : ''}
            </div>
            {s.why && (
              <span style={{ display:'block', fontSize:12.5, lineHeight:1.55, color: HP.textSoft, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic' }}>“{s.why}”</span>
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
    <section style={{ padding:'56px 88px', borderTop:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.012)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:32, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:24 }}>
          <div style={{ display:'flex' }}>
            {friends.slice(0, 5).map((f, i) => (
              <div key={f.id} style={{ width:36, height:36, borderRadius:999, background: f.avatarBg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit', fontWeight:700, color:'#0A0510', fontSize:14, border:'2px solid #06060a', marginLeft: i>0 ? -10 : 0, overflow:'hidden' }}>
                {f.avatarUrl ? (
                  <img src={f.avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                ) : (
                  (f.name || '?').charAt(0).toUpperCase()
                )}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontFamily:'Outfit', fontSize:16, fontWeight:500, color: HP.text, letterSpacing:'-0.01em' }}>
              {friends.length} {friends.length === 1 ? 'person' : 'people'} you follow loved this
            </div>
            <div style={{ fontSize:12, color: HP.textMuted, fontFamily:'Outfit', marginTop:2 }}>
              {summaryNames} · avg <span style={{ color: HP.amber, fontWeight:600 }}>{avgDisplay}★</span>
            </div>
          </div>
        </div>
        {friends.some(f => f.reviewText) && (
          <button
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            style={{ padding:'10px 18px', borderRadius:6, background:'transparent', border:`1px solid ${HP.borderStrong}`, color: HP.textSoft, fontFamily:'Outfit', fontSize:12, fontWeight:600, letterSpacing:'0.04em', cursor:'pointer' }}
          >
            {open ? 'Hide notes' : 'See their notes →'}
          </button>
        )}
      </div>
      {open && (
        <div style={{ marginTop:20, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:14, animation:'mv-fade-in 0.3s ease both' }}>
          {friends.filter(f => f.reviewText).map(f => (
            <div key={f.id} style={{ padding:'14px 16px', borderRadius:6, background:'rgba(255,255,255,0.03)', border:`1px solid ${HP.border}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <div style={{ width:28, height:28, borderRadius:999, background: f.avatarBg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit', fontWeight:700, color:'#0A0510', fontSize:12, overflow:'hidden' }}>
                  {f.avatarUrl ? <img src={f.avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (f.name || '?').charAt(0).toUpperCase()}
                </div>
                <div style={{ fontFamily:'Outfit', fontSize:13, fontWeight:600, color: HP.text }}>{f.name}</div>
                <div style={{ marginLeft:'auto', fontSize:11, color: HP.amber, fontFamily:'Outfit', fontWeight:700 }}>{(f.rating / 2).toFixed(1)}★</div>
              </div>
              <div style={{ fontSize:12, color: HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic' }}>
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
function TasteTwinReview({ twin }) {
  if (!twin) return null;
  // user_ratings.rating is 1-10; star display is 1-5.
  const starsFilled = Math.round(twin.rating / 2);
  return (
    <section style={{ padding:'72px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:48, alignItems:'flex-start' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ position:'relative', width:96, height:96, borderRadius:999, background: twin.avatarBg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit', fontWeight:700, color:'#0A0510', fontSize:36, margin:'0 auto', boxShadow:`0 0 32px ${twin.avatarBg}55`, overflow:'hidden' }}>
            {twin.avatarUrl ? (
              <img src={twin.avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            ) : (
              (twin.name || '?').charAt(0).toUpperCase()
            )}
            <div style={{ position:'absolute', bottom:-6, right:-6, padding:'3px 9px', borderRadius:999, background: HP.bgDeep, border:`1px solid ${HP.purple}`, fontSize:10, fontWeight:700, color: HP.purple, fontFamily:'Outfit' }}>{twin.matchPct}%</div>
          </div>
          <div style={{ marginTop:14, fontFamily:'Outfit', fontSize:14, fontWeight:600, color: HP.text }}>{twin.name}</div>
          <div style={{ fontSize:11, color: HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.06em', textTransform:'uppercase', marginTop:3 }}>Your taste twin</div>
        </div>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: HP.purple, marginBottom:14, display:'inline-flex', alignItems:'center', gap:10 }}>
            <span style={{ height:1, width:22, background: HP.purple, opacity:0.6 }} />They rated it · {twin.watchedDate}
          </div>
          {twin.note ? (
            <p style={{ margin:0, fontFamily:'Outfit, Inter, sans-serif', fontSize:24, lineHeight:1.5, color: HP.text, fontStyle:'italic', letterSpacing:'-0.012em', textWrap:'pretty' }}>
              “{twin.note}”
            </p>
          ) : (
            <p style={{ margin:0, fontFamily:'Outfit, Inter, sans-serif', fontSize:18, lineHeight:1.5, color: HP.textSoft, fontStyle:'italic', letterSpacing:'-0.012em' }}>
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
function TimelineSection() {
  const { mv, hasOverlay } = useMovieData();
  const timeline = hasOverlay
    ? TIMELINE
    : (mv.releaseDate ? [{ date: mv.releaseDate, label: 'Released', note: null }] : []);
  if (timeline.length === 0 && mv.languages.length === 0) return null;
  return (
    <section style={{ padding:'72px 88px', borderTop:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.012)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:64, alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: HP.purple, marginBottom:14 }}>Release path</div>
          <h2 style={{ fontFamily:'Outfit', fontSize:36, lineHeight:1.05, fontWeight:500, letterSpacing:'-0.03em', color: HP.text, margin:0 }}>How it traveled.</h2>
          {mv.languages.length > 0 && (
            <div style={{ marginTop:24, display:'flex', alignItems:'center', gap:10, fontSize:11, color: HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.08em', textTransform:'uppercase', flexWrap:'wrap' }}>
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
              <div style={{ position:'absolute', left:-3.5, top:4, width:11, height:11, borderRadius:999, background: i===0 ? FILM_PALETTE.primary : HP.purple, boxShadow:`0 0 12px ${i===0 ? FILM_PALETTE.primary : HP.purple}66` }} />
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color: HP.textMuted, fontFamily:'Outfit' }}>{t.date}</div>
              <div style={{ fontFamily:'Outfit', fontSize:18, fontWeight:500, color: HP.text, letterSpacing:'-0.015em', marginTop:4 }}>{t.label}</div>
              {t.note && <div style={{ fontSize:12, color: HP.textSoft, marginTop:3, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic' }}>{t.note}</div>}
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
    <section style={{ padding:'72px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:32 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: HP.purple, marginBottom:14, display:'inline-flex', alignItems:'center', gap:10 }}>
            <span style={{ height:1, width:22, background: HP.purple, opacity:0.6 }} />{directorLabel}
          </div>
          <h2 style={{ fontFamily:'Outfit', fontSize:36, lineHeight:1, fontWeight:500, letterSpacing:'-0.03em', color: HP.text, margin:0 }}>
            Where to <em style={{ fontStyle:'italic', fontWeight:400, color: HP.textSoft }}>go next.</em>
          </h2>
        </div>
        {mv.directorId && (
          <a
            href={`https://www.themoviedb.org/person/${mv.directorId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding:'9px 16px', borderRadius:999, background:'transparent', border:`1px solid ${HP.border}`, color: HP.textSoft, fontFamily:'Outfit', fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', textDecoration:'none' }}
          >Full filmography →</a>
        )}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(dirShelf.length, 5)}, 1fr)`, gap:18 }}>
        {dirShelf.map(f => (
          <button
            key={f.tmdbId}
            type="button"
            onClick={() => goToMovie?.(f.tmdbId)}
            aria-label={`Open ${f.title}${f.year ? ` (${f.year})` : ''}`}
            style={{ ...RESET_BTN }}
          >
            <div style={{ position:'relative', borderRadius:4, overflow:'hidden', marginBottom:10, boxShadow:'0 8px 24px -8px rgba(0,0,0,0.5)' }}>
              <img src={f.poster} alt={f.title} style={{ width:'100%', aspectRatio:'2/3', objectFit:'cover', display:'block' }} onError={(e)=>{ e.currentTarget.style.display='none'; }} />
              <div style={{ position:'absolute', inset:0, background:`linear-gradient(155deg, ${FILM_PALETTE.primary}11, transparent)` }} />
              {f.yourRating ? (
                <div style={{ position:'absolute', top:8, right:8, padding:'3px 7px', borderRadius:3, background:'rgba(0,0,0,0.85)', border:`1px solid ${HP.amber}55`, fontSize:9, fontWeight:700, color: HP.amber, fontFamily:'Outfit', letterSpacing:'0.06em' }}>{f.yourRating}★ YOU</div>
              ) : (
                <div style={{ position:'absolute', top:8, right:8, padding:'3px 7px', borderRadius:3, background:'rgba(0,0,0,0.75)', border:`1px solid ${HP.border}`, fontSize:9, fontWeight:600, color: HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.06em' }}>UNSEEN</div>
              )}
            </div>
            <div style={{ fontFamily:'Outfit', fontSize:13, fontWeight:500, color: HP.text, letterSpacing:'-0.01em' }}>{f.title}</div>
            <div style={{ fontSize:11, color: HP.textMuted, fontFamily:'Outfit' }}>{f.year}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

// ── Your Take (locked → unlocked after watched) ──────────────────
function YourTake({ isWatched }) {
  if (isWatched) return <YourTakeUnlocked />;

  return (
    <section style={{ padding:'72px 88px', borderTop:`1px solid ${HP.border}` }}>
      <div style={{ padding:'40px 36px', borderRadius:6, background:'linear-gradient(135deg, rgba(167,139,250,0.04), rgba(236,72,153,0.02))', border:`1px solid ${HP.border}`, display:'grid', gridTemplateColumns:'auto 1fr auto', gap:32, alignItems:'center' }}>
        <div style={{ width:56, height:56, borderRadius:999, background:'rgba(167,139,250,0.12)', border:`1px solid ${HP.purple}33`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={HP.purple} strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color: HP.purple, marginBottom:8 }}>Your take · locked</div>
          <div style={{ fontFamily:'Outfit', fontSize:22, fontWeight:500, color: HP.text, letterSpacing:'-0.02em' }}>Mark watched in the hero to rate this film.</div>
          <div style={{ fontSize:13, color: HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', marginTop:6, fontStyle:'italic' }}>Your taste signal sharpens with every honest rating.</div>
        </div>
      </div>
    </section>
  );
}

const REACTION_TAGS = ['Loved it', 'Liked it', 'It was OK', "Didn't connect"];

function YourTakeUnlocked() {
  const { hasOverlay } = useMovieData();
  const [stars, setStars] = useState(0);
  const [reaction, setReaction] = useState('');
  const [note, setNote] = useState('');
  return (
    <section style={{ padding:'72px 88px', borderTop:`1px solid ${HP.border}`, animation:'mv-fade-in 0.6s ease both' }}>
      <div style={{ padding:'40px 36px', borderRadius:6, background:`linear-gradient(135deg, ${FILM_PALETTE.primary}11, rgba(167,139,250,0.04))`, border:`1px solid ${FILM_PALETTE.primary}33` }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: FILM_PALETTE.primary, marginBottom:14, display:'inline-flex', alignItems:'center', gap:10 }}>
          <span style={{ width:8, height:8, borderRadius:999, background: FILM_PALETTE.primary, boxShadow:`0 0 12px ${FILM_PALETTE.primary}` }} />
          Unlocked · How did it land?
        </div>
        <div style={{ display:'grid', gridTemplateColumns: hasOverlay ? '1fr 1.4fr' : '1fr', gap:48, alignItems:'flex-start', marginTop:14 }}>
          <div>
            <div role="radiogroup" aria-label="Your star rating" style={{ display:'flex', gap:6, marginBottom:18 }}>
              {[1,2,3,4,5].map(i => (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={stars === i}
                  aria-label={`${i} star${i > 1 ? 's' : ''}`}
                  onClick={()=>setStars(i)}
                  style={{ background:'transparent', border:'none', cursor:'pointer', padding:4 }}
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
                      padding:'7px 12px', borderRadius:999,
                      background: active ? 'rgba(167,139,250,0.14)' : 'rgba(255,255,255,0.04)',
                      border:`1px solid ${active ? HP.purple + '88' : HP.border}`,
                      color: active ? HP.text : HP.textSoft,
                      fontFamily:'Outfit', fontSize:11.5, fontWeight:500, cursor:'pointer', letterSpacing:'-0.005em',
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
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Optional: one sentence on what stuck with you…"
                style={{ width:'100%', minHeight:80, padding:'12px 14px', borderRadius:6, background:'rgba(0,0,0,0.4)', border:`1px solid ${HP.border}`, color: HP.text, fontFamily:'Outfit, Inter, sans-serif', fontSize:13.5, lineHeight:1.5, resize:'vertical', outline:'none' }}
              />
            </label>
          </div>
          {hasOverlay && <DNADelta />}
        </div>
      </div>
    </section>
  );
}

function DNADelta() {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 350);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ padding:'22px 24px', borderRadius:6, background:'rgba(0,0,0,0.35)', border:`1px solid ${HP.border}` }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color: HP.purple, marginBottom:6 }}>Your engine projects this shift</div>
      <div style={{ fontSize:12, color: HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic', marginBottom:18 }}>Real before/after deltas land in a follow-up — for now, projected from your taste profile.</div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {DNA_DELTA.map(d => {
          const w = animated ? d.after : d.before;
          const delta = (d.after - d.before).toFixed(2);
          return (
            <div key={d.motif}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
                <span style={{ fontFamily:'Outfit', fontSize:13, fontWeight:500, color: HP.text }}>{d.motif}</span>
                <span style={{ fontFamily:'Outfit', fontSize:11, color: FILM_PALETTE.primary, fontWeight:700 }}>+{delta}</span>
              </div>
              <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:999, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${w*100}%`, background:`linear-gradient(90deg, ${HP.purple}, ${FILM_PALETTE.primary})`, transition:'width 1.4s cubic-bezier(0.2,0.8,0.2,1)' }} />
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
    <section style={{ padding:'72px 88px', borderTop:`1px solid ${HP.border}`, background:'rgba(255,255,255,0.012)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:80 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color: HP.purple, marginBottom:18 }}>Production</div>
          <h3 style={{ fontFamily:'Outfit', fontSize:28, fontWeight:500, color: HP.text, margin:'0 0 24px 0', letterSpacing:'-0.025em' }}>The notes.</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'20px 32px' }}>
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
      <div style={{ fontSize:10, color: HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:'Outfit', fontSize:15, color: HP.text, letterSpacing:'-0.01em', fontWeight:500 }}>{value}</div>
    </div>
  );
}

function MovieFooter({ onBackToBriefing }) {
  const { mv } = useMovieData();
  const linkStyle = { fontSize:12, color: HP.textMuted, letterSpacing:'0.04em', textDecoration:'none', cursor:'pointer' };
  const btnStyle = { ...linkStyle, background:'none', border:'none', padding:0, font:'inherit' };
  return (
    <footer style={{ padding:'48px 88px 64px', borderTop:`1px solid ${HP.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'Outfit, Inter, sans-serif', flexWrap:'wrap', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:28, height:28, borderRadius:6, background: HP_GRAD, display:'inline-flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit', fontWeight:700, fontSize:13, color:'#fff' }}>FF</div>
        <span style={{ fontSize:13, color: HP.textMuted, letterSpacing:'0.04em' }}>FeelFlick · Film File Nº {String(mv.id).padStart(4, '0')}</span>
      </div>
      <div style={{ display:'flex', gap:28, fontFamily:'Outfit, Inter, sans-serif' }}>
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
        >Back to Briefing</button>
      </div>
    </footer>
  );
}

export { CastSection, VideosSection, ProvidersSection, PairsWith, FriendsLoved, TasteTwinReview, TimelineSection, DirectorShelf, YourTake, DetailsSection, MovieFooter }
