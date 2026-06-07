import { useEffect, useMemo } from 'react'
import { MOODS } from '../derive'
import { HP } from '../constants'

export default function StageReveal({ selected, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, [onDone]);
  const blendHex = MOODS.find(m=>m.id===selected[0])?.hex || HP.purple;
  const lines = [];
  for (let i = 0; i < selected.length; i++) {
    for (let j = i+1; j < selected.length; j++) {
      const a = MOODS.find(m => m.id === selected[i]);
      const b = MOODS.find(m => m.id === selected[j]);
      if (a && b) lines.push({ a, b, key:`${a.id}-${b.id}` });
    }
  }
  const burstDots = useMemo(() => Array.from({length:24}, (_,i) => ({ a: (i/24)*Math.PI*2, r: 180 + Math.random()*120, s: 2 + Math.random()*3, dly: 1100 + Math.random()*200 })), []);
  return (
    <section style={{ position:'relative', minHeight:'82vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', textAlign:'center' }}>
      <div style={{ position:'relative', width:'min(560px, 80vw)', aspectRatio:'1' }}>
        <div style={{ position:'absolute', inset:0, animation:'ff-collapse-long 2.6s cubic-bezier(.5,0,.4,1) forwards' }}>
          <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:`radial-gradient(circle at center, ${blendHex}99, ${blendHex}22 40%, transparent 70%)`, filter:'blur(20px)', animation:'ff-bloom-long 2.6s cubic-bezier(.5,0,.4,1) forwards' }} />
          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
            {lines.map(({ a, b, key }) => <line key={key} x1={`${a.x}%`} y1={`${a.y}%`} x2={`${b.x}%`} y2={`${b.y}%`} stroke={blendHex} strokeWidth="1.6" style={{ opacity:0.8 }} />)}
          </svg>
          {selected.map(id => {
            const m = MOODS.find(x => x.id === id);
            if (!m) return null;
            return <div key={m.id} style={{ position:'absolute', left:`${m.x}%`, top:`${m.y}%`, transform:'translate(-50%,-50%)', width:48, height:48, borderRadius:999, background:`radial-gradient(circle at 35% 30%, ${m.hex}, ${m.hex}66 60%, ${m.hex}11)`, boxShadow:`0 0 32px ${m.hex}aa` }} />;
          })}
        </div>
        {burstDots.map((d, i) => (
          <span key={i} style={{ position:'absolute', top:'50%', left:'50%', width:d.s, height:d.s, borderRadius:999, background:blendHex, boxShadow:`0 0 ${d.s*3}px ${blendHex}`, opacity:0, animation:`ff-burst-late 1.4s cubic-bezier(.2,.7,.2,1) ${d.dly}ms forwards`, '--tx': `${Math.cos(d.a)*d.r}px`, '--ty': `${Math.sin(d.a)*d.r}px` }} />
        ))}
      </div>
      <div style={{ marginTop:32, fontSize:11, fontWeight:600, letterSpacing:'0.28em', textTransform:'uppercase', color:blendHex, fontFamily:'Outfit', opacity:0, animation:'ff-fade-late 2.6s ease forwards' }}>Reading the room…</div>
    </section>
  );
}
