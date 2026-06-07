import { useEffect } from 'react'

// ── Stage 2.4 — Breath pause ──
export default function StageBreath({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, [onDone]);
  return (
    <section style={{ position:'relative', minHeight:'82vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', textAlign:'center' }}>
      <div style={{ position:'relative', width:140, height:140, marginBottom:32 }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1px solid rgba(167,139,250,0.35)', animation:'ff-breath 2.2s ease-in-out forwards' }} />
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'radial-gradient(circle at center, rgba(167,139,250,0.18), transparent 65%)', animation:'ff-breath-bloom 2.2s ease-in-out forwards' }} />
      </div>
      <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.32em', textTransform:'uppercase', color:'rgba(167,139,250,0.85)', fontFamily:'Outfit', marginBottom:10 }}>Take a breath</div>
      <div style={{ fontFamily:'Outfit', fontSize:22, fontWeight:300, color:'rgba(250,250,250,0.65)', fontStyle:'italic', letterSpacing:'-0.015em' }}>The room is yours.</div>
    </section>
  );
}
