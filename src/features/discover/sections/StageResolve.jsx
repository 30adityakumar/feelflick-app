import { useEffect } from 'react'
import { useReducedMotion } from 'framer-motion'
import { HP } from '../constants'

// How long the resolve transition holds before StagePick. The recommendation is
// already computed locally — this is a calm ORIENTATION beat, not a loading screen.
export const RESOLVE_DURATION_MS = 900

// Stage 2.3 (F3.7) — the single resolve transition. Replaces the old ~6.2s ceremony
// (Breath → constellation collapse → title card) with one short, mood-coloured beat.
// No progress, no percentage, no film title before the result. Under reduced motion
// the hold is 0ms — the result appears immediately, with no forced visual waiting.
export default function StageResolve({ blendHex, onDone }) {
  const reduced = useReducedMotion()
  useEffect(() => {
    const duration = reduced ? 0 : RESOLVE_DURATION_MS
    const t = setTimeout(onDone, duration)
    return () => clearTimeout(t)
  }, [onDone, reduced])

  return (
    <section
      className="ff-resolve ff-discover-section"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{ position:'relative', minHeight:'82vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', textAlign:'center' }}
    >
      <div className="ff-resolve__mark" aria-hidden="true" style={{ position:'relative', width:120, height:120, marginBottom:30 }}>
        <div className="ff-resolve__halo" style={{ position:'absolute', inset:0, borderRadius:'50%', background:`radial-gradient(circle at center, ${blendHex}55, ${blendHex}14 45%, transparent 70%)` }} />
        <div style={{ position:'absolute', inset:'32%', borderRadius:'50%', border:`1px solid ${blendHex}`, opacity:0.7 }} />
      </div>
      <div className="ff-resolve__eyebrow" style={{ fontSize:11, fontWeight:600, letterSpacing:'0.32em', textTransform:'uppercase', color:blendHex, fontFamily:'Outfit', marginBottom:12 }}>One film for tonight</div>
      <div className="ff-resolve__message" style={{ fontFamily:'Outfit', fontSize:22, fontWeight:300, color:HP.textSoft, fontStyle:'italic', letterSpacing:'-0.015em' }}>Bringing tonight into focus.</div>
    </section>
  )
}
