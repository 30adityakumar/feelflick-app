// src/features/landing-v2/sections/HowItWorksV2.jsx
import { useEffect, useState } from 'react'
import { BRAND } from '@/features/landing-v2/theme'
import { SectionEyebrow } from '@/features/landing-v2/components/atoms'

const STEPS = [
  { n: '01', h: 'Say how you feel', b: 'A pill, a word, or a sentence. The vague "I want something good" is fine — we can disambiguate.' },
  { n: '02', h: 'We read the room', b: 'Mood + your taste graph + time-of-day + history. Not just "what people watched."' },
  { n: '03', h: 'One pick wins',    b: 'Plus 2 alternates with a one-line reason each. Pick fast, or pick well — your call.' },
]

function useIsMobile(bp = 768) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < bp)
  useEffect(() => {
    const onR = () => setM(window.innerWidth < bp)
    window.addEventListener('resize', onR)
    return () => window.removeEventListener('resize', onR)
  }, [bp])
  return m
}

export default function HowItWorksV2() {
  const isMobile = useIsMobile()
  return (
    <section id="how" style={{
      position: 'relative', background: '#000',
      padding: isMobile ? '72px 22px' : '120px 80px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 56px' }}>
          <SectionEyebrow label="How it works" />
          <h2 style={{
            fontSize: isMobile ? 32 : 52, fontWeight: 900,
            letterSpacing: '-0.025em', lineHeight: 1.04,
            margin: '14px 0 16px', color: '#fff', textWrap: 'balance',
          }}>
            Three steps.<br />Forty-seven seconds.
          </h2>
          <p style={{ fontSize: isMobile ? 14.5 : 16, color: BRAND.w60, lineHeight: 1.6, margin: 0 }}>
            Faster than picking a meal at a restaurant. Sharper than asking a friend.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 16 : 24,
        }}>
          {STEPS.map(s => (
            <div key={s.n} style={{
              borderRadius: 22,
              padding: isMobile ? '24px 22px' : '32px 28px',
              border: `1px solid ${BRAND.border}`,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.01))',
              position: 'relative', overflow: 'hidden',
            }}>
              <span style={{
                position: 'absolute', top: -12, right: -8,
                fontSize: 110, fontWeight: 900, color: 'rgba(255,255,255,0.04)',
                letterSpacing: '-0.04em', lineHeight: 1, fontStyle: 'italic',
              }}>{s.n}</span>
              <div style={{ position: 'relative' }}>
                <p style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.16em', color: 'rgba(192,132,252,0.7)', margin: '0 0 14px' }}>STEP {s.n}</p>
                <h3 style={{ fontSize: isMobile ? 21 : 23, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', margin: '0 0 10px' }}>{s.h}</h3>
                <p style={{ fontSize: 14.5, color: BRAND.w60, lineHeight: 1.6, margin: 0 }}>{s.b}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
