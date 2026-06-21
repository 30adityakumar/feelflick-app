// src/features/discover/sections/DiscoverResolveStage.jsx
// Stage 2.3 — resolve. A short orientation beat when the recommendation is
// already computed; the legitimate LOADING state while the request is still
// pending; an honest error hand-off on failure. No fake progress, no simulated
// "AI thinking". Reduced-motion users reveal immediately once data is ready.

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

export const RESOLVE_MIN_MS = 600 // within the approved 500–800ms range

export default function DiscoverResolveStage({ ready, error, onDone, onError, blendHex }) {
  const reduced = useReducedMotion()
  const startRef = useRef(Date.now())

  useEffect(() => {
    if (error) { onError?.(); return undefined }
    if (!ready) return undefined // still loading — this screen IS the loading state
    const elapsed = Date.now() - startRef.current
    const remaining = reduced ? 0 : Math.max(0, RESOLVE_MIN_MS - elapsed)
    const t = setTimeout(() => onDone?.(), remaining)
    return () => clearTimeout(t)
  }, [ready, error, reduced, onDone, onError])

  return (
    <section className="ff-disc-stage ff-disc-resolve" role="status" aria-live="polite" aria-atomic="true">
      <div className="ff-disc-resolve__mark" aria-hidden="true" style={{ '--blend': blendHex }}>
        <div className="ff-disc-resolve__halo" style={{ background: `radial-gradient(circle at center, ${blendHex}55, ${blendHex}14 45%, transparent 70%)` }} />
        <div className="ff-disc-resolve__ring" style={{ borderColor: blendHex }} />
      </div>
      <p className="ff-disc-resolve__eyebrow">One film first · two directions in reserve</p>
      <p className="ff-disc-resolve__message">Bringing tonight into focus.</p>
    </section>
  )
}
