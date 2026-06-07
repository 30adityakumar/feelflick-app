import { useMemo } from 'react'
import { HP_GRAD } from '@/shared/lib/tokens'
import { HP } from '../constants'

// ── Stage 0 — Hero with rotating epigraph ──
export default function StageHero({ onBegin, onSurprise }) {
  // Greeting is the only non-actionable piece kept above the headline —
  // a small time-aware grounding cue ("It's Saturday evening.") that
  // sets the right "tonight" framing for the question that follows. The
  // older masthead (Edition Nº NNN + random literary epigraph) was
  // magazine-flourish without payload — the edition number was the same
  // for every user on every page-load (it's days-since-launch), and the
  // epigraph was a random pull disconnected from the user.
  const greeting = useMemo(() => {
    const d = new Date();
    const h = d.getHours();
    const day = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
    const part = h < 6 ? 'late' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 22 ? 'evening' : 'night';
    return { day, part };
  }, []);
  return (
    <section style={{ position:'relative', minHeight:'82vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', textAlign:'center', animation:'ff-fade 0.6s ease' }}>
      <div style={{ fontFamily:'Outfit', fontSize:16, color:HP.textMuted, marginBottom:18 }}>It’s <span style={{ color:HP.textSoft }}>{greeting.day} {greeting.part}.</span></div>
      <h1 style={{ fontFamily:'Outfit', fontSize:'clamp(54px, 8vw, 104px)', lineHeight:0.94, fontWeight:200, letterSpacing:'-0.05em', color:HP.text, margin:0, maxWidth:1000, textWrap:'balance' }}>How do <em style={{ fontStyle:'italic', fontWeight:300, color:HP.textSoft }}>you</em> feel?</h1>
      <p style={{ marginTop:24, fontFamily:'Outfit, Inter, sans-serif', fontSize:16, color:HP.textMuted, fontStyle:'italic', maxWidth:520, lineHeight:1.55 }}>A few quick questions. One film for your night.</p>
      <div style={{ marginTop:40, display:'flex', gap:14 }}>
        <button onClick={onBegin} style={{ padding:'15px 32px', borderRadius:999, background:HP_GRAD, border:'none', color:'#fff', fontFamily:'Outfit', fontSize:14, fontWeight:600, letterSpacing:'0.04em', cursor:'pointer', boxShadow:'0 16px 36px -10px rgba(236,72,153,0.45)' }}>Begin →</button>
        <button onClick={onSurprise} style={{ padding:'15px 28px', borderRadius:999, background:'rgba(255,255,255,0.05)', border:`1px solid ${HP.border}`, color:HP.textSoft, fontFamily:'Outfit', fontSize:13, fontWeight:600, cursor:'pointer' }}>or, surprise me</button>
      </div>
    </section>
  );
}
