import React, { useState, useEffect } from 'react'
import { HP, HP_GRAD, MOODS, LANG_OPTIONS } from './data'
import { getMoodTag } from './components'

// FeelFlick — Browse v3 immersive: MoodBackdrop + QuickLook slide-over.

// Hooks aliases
const useS = useState; const useE = useEffect;

// Local icons
const Ic = ({ d, s=16, fill='none' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IcX     = (p) => <Ic {...p} d={<><path d="M18 6 6 18M6 6l12 12"/></>} />;
const IcPlus  = (p) => <Ic {...p} d={<><path d="M12 5v14M5 12h14"/></>} />;
const IcCheck = (p) => <Ic {...p} d={<path d="M20 6 9 17l-5-5"/>} />;
const IcEye   = (p) => <Ic {...p} d={<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>} />;
const IcEyeOff= (p) => <Ic {...p} d={<><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><path d="m2 2 20 20"/></>} />;

// /browse v5 — immersive additions: ambient mood backdrop, hero spotlight rail, quick-look panel.

// ── Ambient mood backdrop ─────────────────────────────────────
function MoodBackdrop({ tint }) {
  return (
    <div aria-hidden style={{
      position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
      background: `
        radial-gradient(ellipse 60% 40% at 30% 0%, ${tint}1c, transparent 65%),
        radial-gradient(ellipse 80% 50% at 100% 30%, ${tint}10, transparent 70%),
        radial-gradient(ellipse 70% 60% at 0% 80%, ${tint}0e, transparent 70%)
      `,
      transition:'background 0.7s cubic-bezier(.2,.7,.2,1)',
    }} />
  );
}

// ── Hero spotlight strip — 3 big cinematic cards (mood-aware) ─
function Spotlight({ mood, items, watched, watchlist, onTW, onTWL, onOpen }) {
  // Top 3 films by current match
  const top3 = items.slice(0, 3);
  const m = MOODS.find(x => x.id === mood) || MOODS[0];
  const tint = m.hex;
  if (top3.length < 3) return null;
  return (
    <section style={{ position:'relative', padding:'4px 56px 36px' }}>
      <div style={{ marginBottom:14, display:'flex', alignItems:'center', gap:14 }}>
        <span style={{ fontFamily:'Outfit', fontSize:11, fontWeight:600, letterSpacing:'0.28em', textTransform:'uppercase', color:tint }}>
          {mood==='all' ? "Tonight's shortlist" : `Tonight · ${m.label}`}
        </span>
        <span style={{ height:1, flex:1, background:`linear-gradient(90deg, ${tint}55, transparent)` }} />
        <span style={{ fontFamily:'Inter', fontSize:11.5, color:HP.textFaint }}>Top {top3.length} by match</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:18 }}>
        {top3.map((f, i) => {
          const matchScore = mood==='all' ? f.ff : Math.round(0.6*(f.fit[mood]*100) + 0.25*f.ff + 0.15*(100 - Math.abs(115 - f.runtime)));
          const isWatched = watched.has(f.id);
          const isWL = watchlist.has(f.id);
          return <SpotlightCard key={f.id} f={f} mood={mood} matchScore={matchScore} idx={i+1} watched={isWatched} inWatchlist={isWL} onTW={()=>onTW(f.id)} onTWL={()=>onTWL(f.id)} onOpen={()=>onOpen(f)} />;
        })}
      </div>
    </section>
  );
}

function SpotlightCard({ f, mood, matchScore, idx, watched, inWatchlist, onTW, onTWL, onOpen }) {
  const [h, setH] = useS(false);
  const why = mood==='all' ? `${f.dir} · FF ${f.ff}%` : f.rationale[mood];
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <article onClick={onOpen} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{ position:'relative', borderRadius:14, overflow:'hidden', cursor:'pointer', border:`1px solid ${h?'rgba(216,180,254,0.32)':HP.border}`, transition:'all 0.25s ease', boxShadow: h?'0 30px 60px -18px rgba(0,0,0,0.75)':'0 16px 36px -16px rgba(0,0,0,0.6)' }}>
      <div style={{ position:'relative', aspectRatio:'16/10' }}>
        {/* Backdrop poster blurred */}
        <div style={{ position:'absolute', inset:0, backgroundImage:`url(${f.poster})`, backgroundSize:'cover', backgroundPosition:'center 20%', filter: h ? 'blur(14px) saturate(140%) brightness(0.55)' : 'blur(20px) saturate(120%) brightness(0.45)', transition:'filter 0.4s ease', transform:'scale(1.1)' }} />
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(115deg, rgba(6,6,10,0.85) 0%, rgba(6,6,10,0.55) 45%, rgba(6,6,10,0.85) 100%)` }} />

        {/* Foreground content */}
        <div style={{ position:'relative', height:'100%', padding:'18px', display:'flex', gap:18, alignItems:'flex-end' }}>
          <img src={f.poster} alt={f.title} loading="lazy" style={{ width:90, aspectRatio:'2/3', objectFit:'cover', borderRadius:5, boxShadow:'0 12px 28px -8px rgba(0,0,0,0.7)' }} />
          <div style={{ flex:1, minWidth:0, color:'#fff' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <span style={{ fontFamily:'Outfit', fontSize:9.5, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:HP.purple }}>0{idx} · Pick of the night</span>
            </div>
            <h3 style={{ fontFamily:'Outfit', fontSize:22, fontWeight:500, color:'#fff', margin:0, letterSpacing:'-0.018em', lineHeight:1.15 }}>{f.title}</h3>
            <div style={{ marginTop:4, fontFamily:'Inter', fontSize:12, color:'rgba(255,255,255,0.65)' }}>{f.year} · {f.dir} · {f.runtime}m</div>
            <div style={{ marginTop:10, fontFamily:'Inter', fontSize:12, color:HP.purple, lineHeight:1.45 }}>{why}</div>
          </div>
          <div style={{ position:'absolute', top:14, right:14, display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontFamily:'Outfit', fontSize:24, fontWeight:300, color:'#fff', letterSpacing:'-0.025em', lineHeight:1 }}>{matchScore}<span style={{ fontSize:11, color:'rgba(255,255,255,0.55)' }}>%</span></span>
          </div>
          {/* Action row — appears on hover */}
          <div style={{ position:'absolute', bottom:14, right:14, display:'flex', gap:6, opacity: h?1:0, transform: h?'translateY(0)':'translateY(6px)', transition:'all 0.2s ease' }}>
            <button onClick={e=>{e.stopPropagation(); onTWL();}} title={inWatchlist?'In watchlist':'Add to watchlist'} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:999, border:`1px solid ${inWatchlist?'rgba(216,180,254,0.5)':'rgba(255,255,255,0.2)'}`, background: inWatchlist?'rgba(168,85,247,0.85)':'rgba(0,0,0,0.55)', color:'#fff', cursor:'pointer' }}>{inWatchlist ? <IcCheck s={13}/> : <IcPlus s={13}/>}</button>
            <button onClick={e=>{e.stopPropagation(); onTW();}}  title={watched?'Mark unwatched':'Mark watched'} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:999, border:`1px solid ${watched?'rgba(110,231,183,0.5)':'rgba(255,255,255,0.2)'}`, background: watched?'rgba(16,185,129,0.85)':'rgba(0,0,0,0.55)', color:'#fff', cursor:'pointer' }}>{watched ? <IcEye s={13}/> : <IcEyeOff s={13}/>}</button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Quick-look slide-over panel ───────────────────────────────
function QuickLook({ film, mood, watched, inWatchlist, onTW, onTWL, onClose }) {
  // Hooks must run unconditionally — keep useE above the early return.
  useE(() => {
    if (!film) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [film, onClose]);
  if (!film) return null;
  const matchScore = mood==='all' ? film.ff : Math.round(0.6*(film.fit[mood]*100) + 0.25*film.ff + 0.15*(100 - Math.abs(115 - film.runtime)));
  const moodTag = getMoodTag(film);
  return (
    // Backdrop: dismisses on click. Escape handled by the useE effect above.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)', display:'flex', justifyContent:'flex-end' }}>
      {/* Panel wrapper stops propagation so clicks inside don't dismiss. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div onClick={e=>e.stopPropagation()} style={{ width:'min(520px, 95vw)', height:'100%', background:HP.bg, borderLeft:`1px solid ${HP.borderStrong}`, overflowY:'auto', boxShadow:'-40px 0 80px -20px rgba(0,0,0,0.8)', animation:'qlSlide 0.32s cubic-bezier(.2,.7,.2,1)' }}>
        <style>{`@keyframes qlSlide { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Backdrop hero */}
        <div style={{ position:'relative', height:280 }}>
          <div style={{ position:'absolute', inset:0, backgroundImage:`url(${film.poster})`, backgroundSize:'cover', backgroundPosition:'center 25%', filter:'blur(16px) saturate(140%) brightness(0.5)', transform:'scale(1.15)' }} />
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(180deg, transparent 0%, ${HP.bg} 95%)` }} />
          <button onClick={onClose} aria-label="Close" style={{ position:'absolute', top:18, right:18, width:36, height:36, borderRadius:999, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)', border:`1px solid ${HP.borderStrong}`, color:'#fff', cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center' }}><IcX s={16}/></button>
          <div style={{ position:'absolute', bottom:0, left:24, right:24, display:'flex', gap:18, alignItems:'flex-end', paddingBottom:24 }}>
            <img src={film.poster} alt="" style={{ width:110, aspectRatio:'2/3', objectFit:'cover', borderRadius:5, boxShadow:'0 22px 44px -12px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06)' }} />
            <div style={{ flex:1, minWidth:0 }}>
              {moodTag && <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'3px 9px', borderRadius:999, background:`${moodTag.color}1a`, border:`1px solid ${moodTag.color}44`, color:moodTag.color, fontFamily:'Inter', fontSize:11, fontWeight:600, marginBottom:8 }}>{moodTag.label}</div>}
              <h2 style={{ fontFamily:'Outfit', fontSize:28, fontWeight:500, color:'#fff', margin:0, letterSpacing:'-0.022em', lineHeight:1.1 }}>{film.title}</h2>
              <div style={{ marginTop:6, fontFamily:'Inter', fontSize:13, color:'rgba(255,255,255,0.72)' }}>{film.year} · {film.dir} · {film.runtime}m</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'8px 28px 32px' }}>
          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, padding:'18px 0', borderBottom:`1px solid ${HP.border}` }}>
            {[
              { label:'Match', value: matchScore + '%', tint:HP.purple },
              { label:'FF', value: film.ff,    tint:HP.text },
              { label:'Critics', value: film.critic,  tint:HP.textHi },
              { label:'Audience', value: film.audience, tint:HP.textHi },
            ].map(s => (
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'Outfit', fontSize:22, fontWeight:300, color:s.tint, letterSpacing:'-0.02em', lineHeight:1 }}>{s.value}</div>
                <div style={{ marginTop:4, fontFamily:'Inter', fontSize:10, color:HP.textFaint, letterSpacing:'0.08em', textTransform:'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Why this rank */}
          <div style={{ padding:'20px 0', borderBottom:`1px solid ${HP.border}` }}>
            <div style={{ fontFamily:'Outfit', fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:HP.purple, marginBottom:10 }}>Why this rank</div>
            <div style={{ fontFamily:'Inter', fontSize:14, color:HP.textHi, lineHeight:1.55 }}>{mood==='all' ? `Strong FeelFlick rating (${film.ff}), available on your streamers, and one ${film.dir} works in.` : film.rationale[mood]}</div>
          </div>

          {/* Mood fit */}
          <div style={{ padding:'20px 0', borderBottom:`1px solid ${HP.border}` }}>
            <div style={{ fontFamily:'Outfit', fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:HP.textLow, marginBottom:14 }}>Mood fit</div>
            <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
              {Object.entries(film.fit).map(([k, v]) => {
                const moodObj = MOODS.find(m=>m.id===k);
                if (!moodObj) return null;
                return (
                  <div key={k} style={{ display:'grid', gridTemplateColumns:'90px 1fr 36px', gap:12, alignItems:'center' }}>
                    <span style={{ fontFamily:'Inter', fontSize:12, color:moodObj.hex, fontWeight:500 }}>{moodObj.label}</span>
                    <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:999, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${v*100}%`, background:moodObj.hex, opacity:0.85 }} />
                    </div>
                    <span style={{ fontFamily:'Inter', fontSize:11, color:HP.textLow, textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{Math.round(v*100)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details */}
          <div style={{ padding:'20px 0', borderBottom:`1px solid ${HP.border}`, display:'grid', gridTemplateColumns:'auto 1fr', gap:'10px 18px', fontFamily:'Inter', fontSize:13 }}>
            <span style={{ color:HP.textLow }}>Genre</span><span style={{ color:HP.textHi }}>{film.genre}</span>
            <span style={{ color:HP.textLow }}>Language</span><span style={{ color:HP.textHi }}>{LANG_OPTIONS.find(l=>l.value===film.lang)?.label || film.lang}</span>
            <span style={{ color:HP.textLow }}>Pacing</span><span style={{ color:HP.textHi }}>{film.pacing <= 4 ? 'Slow' : film.pacing >= 7 ? 'Fast' : 'Steady'}</span>
            <span style={{ color:HP.textLow }}>Intensity</span><span style={{ color:HP.textHi }}>{film.intensity <= 5 ? 'Chill' : film.intensity >= 7 ? 'Intense' : 'Moderate'}</span>
            <span style={{ color:HP.textLow }}>Attention</span><span style={{ color:HP.textHi }}>{film.attention === 'high' ? 'Needs focus' : 'Easy to multitask'}</span>
            <span style={{ color:HP.textLow }}>Streaming</span><span style={{ color:film.available===false?HP.textFaint:HP.green }}>{film.available===false?'Not on yours':'On your streamers'}</span>
          </div>

          {/* Actions */}
          <div style={{ paddingTop:20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <button onClick={()=>onTW(film.id)} style={{ height:44, borderRadius:999, background: watched ? 'rgba(16,185,129,0.18)' : HP_GRAD, border: watched ? `1px solid ${HP.green}55` : 'none', color: watched ? HP.green : '#fff', fontFamily:'Inter', fontSize:13, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {watched ? <><IcEye s={14}/>Watched</> : <><IcEye s={14}/>Mark watched</>}
            </button>
            <button onClick={()=>onTWL(film.id)} style={{ height:44, borderRadius:999, background: inWatchlist ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.05)', border: inWatchlist ? `1px solid ${HP.purple}66` : `1px solid ${HP.borderStrong}`, color: inWatchlist ? HP.purple : HP.textHi, fontFamily:'Inter', fontSize:13, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {inWatchlist ? <><IcCheck s={14}/>In watchlist</> : <><IcPlus s={14}/>Add to watchlist</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export { MoodBackdrop, QuickLook }
