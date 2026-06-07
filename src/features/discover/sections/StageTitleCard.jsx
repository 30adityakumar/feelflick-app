import { useEffect } from 'react'

// ── Black title-card cut ──
export default function StageTitleCard({ title, onDone, playTitleCue }) {
  // Mount-only: play the title cue once + start the 1400ms timer. playTitleCue is
  // an FFAudio adapter passed from Discover.jsx (F3.3) — intentionally OUT of the
  // dep array so the cue/timer fire exactly once (matching pre-extraction behaviour).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { playTitleCue(); const t = setTimeout(onDone, 1400); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position:'fixed', inset:0, background:'#000', zIndex:90, display:'flex', alignItems:'center', justifyContent:'center', animation:'ff-titlecard 1.4s ease forwards' }}>
      <div style={{ fontFamily:'Outfit', fontSize:'clamp(40px, 6vw, 72px)', fontWeight:200, color:'#fafafa', letterSpacing:'-0.045em', textAlign:'center', textWrap:'balance', animation:'ff-titleword 1.4s ease forwards' }}>{title}</div>
    </div>
  );
}
