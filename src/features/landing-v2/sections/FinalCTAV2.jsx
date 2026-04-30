// src/features/landing-v2/sections/FinalCTAV2.jsx
import { useEffect, useState } from 'react'
import { BRAND } from '@/features/landing-v2/theme'
import { TONE_COPY } from '@/features/landing-v2/data'
import { PrimaryCTA } from '@/features/landing-v2/components/atoms'

const TONE = TONE_COPY.confident

function useIsMobile(bp = 768) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < bp)
  useEffect(() => {
    const onR = () => setM(window.innerWidth < bp)
    window.addEventListener('resize', onR)
    return () => window.removeEventListener('resize', onR)
  }, [bp])
  return m
}

export default function FinalCTAV2() {
  const isMobile = useIsMobile()
  return (
    <section style={{
      position: 'relative', background: '#000',
      padding: isMobile ? '88px 22px' : '160px 80px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      textAlign: 'center', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(168,85,247,0.18), rgba(236,72,153,0.10) 40%, transparent 70%)',
      }} />
      <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{
          fontSize: isMobile ? 38 : 76, fontWeight: 900,
          letterSpacing: '-0.035em', lineHeight: 1.02,
          margin: '0 0 22px', color: '#fff', textWrap: 'balance', whiteSpace: 'pre-line',
        }}>
          {TONE.finalH}
        </h2>
        <p style={{
          fontSize: isMobile ? 15 : 17, color: BRAND.w60,
          lineHeight: 1.6, margin: '0 auto 36px',
          maxWidth: 520,
        }}>{TONE.finalSub}</p>
        <PrimaryCTA label="Get Started Free" />
        <p style={{ fontSize: 12, color: BRAND.w40, margin: '16px 0 0' }}>
          47 seconds to your first pick. Free forever.
        </p>
      </div>
    </section>
  )
}
