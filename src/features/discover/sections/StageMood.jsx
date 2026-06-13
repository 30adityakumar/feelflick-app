import { useMemo } from 'react'
import { ROSE, ROSE_DEEP } from '@/shared/lib/tokens'
import { MOODS, constellationName } from '../derive'
import { HP } from '../constants'

function ParticleBurst({ hex }) {
  const dots = useMemo(() => Array.from({length:12}, (_,i) => ({ a: (i/12)*Math.PI*2, r: 60 + Math.random()*40, s: 2 + Math.random()*3, dly: Math.random()*60 })), []);
  return (
    <div aria-hidden style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
      {dots.map((d, i) => (
        <span key={i} style={{ position:'absolute', top:'50%', left:'50%', width:d.s, height:d.s, borderRadius:999, background:hex, boxShadow:`0 0 ${d.s*2}px ${hex}`, animation:`ff-burst 0.8s cubic-bezier(.2,.7,.2,1) ${d.dly}ms forwards`, '--tx': `${Math.cos(d.a)*d.r}px`, '--ty': `${Math.sin(d.a)*d.r}px` }} />
      ))}
    </div>
  );
}

export default function StageMood({ selected, setSelected, onNext, blendHex, bursts, fireBurst, audioToggle, playMoodCue, playContinueCue }) {
  const toggle = (id, hex) => {
    if (selected.includes(id)) setSelected(selected.filter(x => x !== id));
    else if (selected.length < 3) { setSelected([...selected, id]); fireBurst(id, hex); playMoodCue(id); }
  };
  const lines = [];
  for (let i = 0; i < selected.length; i++) {
    for (let j = i+1; j < selected.length; j++) {
      const a = MOODS.find(m => m.id === selected[i]);
      const b = MOODS.find(m => m.id === selected[j]);
      if (a && b) lines.push({ a, b, key:`${a.id}-${b.id}` });
    }
  }
  const cName = constellationName(selected);
  return (
    <section className="ff-discover-section" style={{ position:'relative', minHeight:'80vh', animation:'ff-fade 0.5s ease' }}>
      {audioToggle}
      <div style={{ textAlign:'center', marginBottom:8 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.32em', textTransform:'uppercase', color:ROSE, marginBottom:14 }}>Step 1 of 2</div>
        <h1 style={{ fontFamily:'var(--font-editorial)', fontSize:'clamp(28px, 5vw, 56px)', lineHeight:1.05, fontWeight:400, letterSpacing:'-0.03em', color:HP.text, margin:0 }}>What&rsquo;s the <em style={{ fontStyle:'italic', color:blendHex, transition:'color 0.5s ease' }}>shape</em> of your mood?</h1>
        <p style={{ marginTop:14, fontFamily:'Inter, sans-serif', fontSize:14, color:HP.textMuted, fontStyle:'italic' }}>Pick 1–3 moods. Form your constellation.</p>
      </div>
      <div className="ff-mood-canvas" role="group" aria-label="Choose one to three moods" style={{ position:'relative', width:'100%', maxWidth:1080, borderRadius:18, background:'rgba(255,255,255,0.012)', border:`1px solid ${HP.border}`, overflow:'hidden' }}>
        <svg aria-hidden="true" style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
          <defs><linearGradient id="ff-grad" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#A78BFA" stopOpacity="0.9" /><stop offset="100%" stopColor="#EC4899" stopOpacity="0.9" /></linearGradient></defs>
          {lines.map(({ a, b, key }) => (
            <line key={key} x1={`${a.x}%`} y1={`${a.y}%`} x2={`${b.x}%`} y2={`${b.y}%`} stroke="url(#ff-grad)" strokeWidth="1.4" strokeDasharray="400" strokeDashoffset="400" style={{ animation:'ff-draw 0.7s cubic-bezier(.2,.7,.2,1) forwards' }} />
          ))}
        </svg>
        {MOODS.map(m => {
          const on = selected.includes(m.id);
          const order = selected.indexOf(m.id) + 1;
          const burst = bursts.find(b => b.id === m.id);
          return (
            <div key={m.id} className="ff-mood-node" style={{ position:'absolute', left:`${m.x}%`, top:`${m.y}%`, transform:'translate(-50%, -50%)' }}>
              {burst && <ParticleBurst hex={m.hex} key={burst.t} />}
              <button onClick={()=>toggle(m.id, m.hex)} aria-pressed={on} title={m.hint} className={`ff-mood-button ${on ? 'is-on' : ''}`} style={{ position:'relative', border:'none', background:'transparent', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:0 }}>
                <div className="ff-mood-orb" data-on={on ? 'true' : 'false'} style={{ position:'relative', borderRadius:999, background:`radial-gradient(circle at 35% 30%, ${m.hex}, ${m.hex}66 60%, ${m.hex}11)`, boxShadow: on?`0 0 32px ${m.hex}aa, 0 0 64px ${m.hex}44`:`0 0 12px ${m.hex}33`, transition:'all 0.4s ease', animation: on?'none':'ff-pulse 4s ease-in-out infinite', border: on?`2px solid ${m.hex}`:'none' }}>
                  {on && <span className="ff-mood-badge" style={{ position:'absolute', top:-6, right:-6, borderRadius:999, background:'#06060a', border:`1px solid ${m.hex}`, color:m.hex, fontFamily:'Inter, sans-serif', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{order}</span>}
                </div>
                <div className="ff-mood-label" style={{ fontFamily:'Inter, sans-serif', fontWeight: on?600:500, color: on?HP.text:HP.textSoft, transition:'all 0.3s ease' }}>{m.label}</div>
                {/* Hint only on desktop — on mobile multiple selected hints
                   collide with neighbour orbs in the tight canvas; touch
                   users can't read it via `title` tooltip anyway, so dropping
                   it on small viewports trades nothing for a clean layout. */}
                {on && <div className="ff-mood-hint" style={{ color:m.hex, fontFamily:'Inter, sans-serif', fontStyle:'italic', textAlign:'center' }}>{m.hint}</div>}
              </button>
            </div>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div style={{ marginTop:18, textAlign:'center', animation:'ff-fade 0.5s ease' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:HP.textMuted, fontFamily:'Inter, sans-serif', marginBottom:4 }}>Your constellation</div>
          <div style={{ fontFamily:'Inter, sans-serif', fontSize:24, fontStyle:'italic', fontWeight:400, color:blendHex, transition:'color 0.5s ease' }}>&ldquo;{cName}&rdquo;</div>
        </div>
      )}
      {/* MoodStage is the /discover front door (F3.5) — no Back button, since
         there is no prior in-flow stage to return to. */}
      <div className="ff-stage-action-bar">
        {/* Selection counter — warmer than the old "X of 3 selected" utility
           string. Reads as a soft nudge when empty, a confirmation while
           building, and a quiet sign-off when full. */}
        <div className="ff-stage-action-bar__meta" style={{ fontSize:11, color:HP.textFaint, fontFamily:'Inter, sans-serif', letterSpacing:'0.06em' }}>
          {selected.length === 0 ? 'Pick at least one'
            : selected.length === 3 ? 'Locked in'
            : `${selected.length} chosen`}
        </div>
        <button onClick={()=>{ playContinueCue(); onNext(); }} disabled={selected.length===0} style={{ padding:'14px 26px', borderRadius:999, background: selected.length>0?ROSE_DEEP:'rgba(255,255,255,0.04)', border: selected.length>0?'none':`1px solid ${HP.border}`, color: selected.length>0?'#fff':HP.textFaint, fontFamily:'Inter, sans-serif', fontSize:13, fontWeight:600, letterSpacing:'0.04em', cursor: selected.length>0?'pointer':'not-allowed' }}>Continue →</button>
      </div>
    </section>
  );
}
