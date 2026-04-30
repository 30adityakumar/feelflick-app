// src/features/landing-v2/sections/PrivacyV2.jsx
import { useEffect, useState } from 'react'
import { BRAND } from '@/features/landing-v2/theme'
import { SectionEyebrow } from '@/features/landing-v2/components/atoms'

const PLEDGES = [
  { num: '0',  label: 'ads, ever' },
  { num: '0',  label: 'third-party trackers' },
  { num: '0',  label: 'data sold' },
  { num: '$0', label: 'forever — for the core experience' },
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

export default function PrivacyV2() {
  const isMobile = useIsMobile()
  return (
    <section id="privacy" style={{
      position: 'relative', background: '#06060a',
      padding: isMobile ? '72px 22px' : '120px 80px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 56px' }}>
          <SectionEyebrow label="The deal" />
          <h2 style={{
            fontSize: isMobile ? 32 : 52, fontWeight: 900,
            letterSpacing: '-0.025em', lineHeight: 1.04,
            margin: '14px 0 16px', color: '#fff', textWrap: 'balance',
          }}>
            Your taste graph is yours.
          </h2>
          <p style={{ fontSize: isMobile ? 14.5 : 16, color: BRAND.w60, lineHeight: 1.6, margin: '0 auto', maxWidth: 600 }}>
            We only use what you tell us to make the next pick sharper. Nothing leaves our servers. You can export it or delete it any time.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? 12 : 18,
        }}>
          {PLEDGES.map((p, i) => (
            <div key={i} style={{
              padding: isMobile ? '20px 16px' : '32px 24px',
              borderRadius: 18,
              border: `1px solid ${BRAND.border}`,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
              textAlign: 'center',
            }}>
              <p style={{
                fontSize: isMobile ? 36 : 56, fontWeight: 900,
                background: BRAND.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 8px',
              }}>{p.num}</p>
              <p style={{ fontSize: isMobile ? 12 : 13, color: BRAND.w60, margin: 0, lineHeight: 1.4 }}>{p.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
