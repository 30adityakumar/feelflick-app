import React, { useEffect } from 'react'
import MoodPill from '@/shared/components/MoodPill'
import { HP, HP_GRAD, MOODS, LANG_OPTIONS } from './data'
import { getMoodTag } from './components'

// FeelFlick — Browse v3 immersive: MoodBackdrop + QuickLook slide-over.

// Hooks aliases
const useE = useEffect;

// Local icons
const Ic = ({ d, s=16, fill='none' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IcX     = (p) => <Ic {...p} d={<><path d="M18 6 6 18M6 6l12 12"/></>} />;
const IcPlus  = (p) => <Ic {...p} d={<><path d="M12 5v14M5 12h14"/></>} />;
const IcCheck = (p) => <Ic {...p} d={<path d="M20 6 9 17l-5-5"/>} />;
const IcEye   = (p) => <Ic {...p} d={<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>} />;

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
              {moodTag && <MoodPill label={moodTag.label} color={moodTag.color} style={{ marginBottom:8 }} />}
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
