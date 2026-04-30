// src/features/landing-v2/sections/VsScrollingV2.jsx
import { useEffect, useState } from 'react'
import { BRAND } from '@/features/landing-v2/theme'
import { SectionEyebrow } from '@/features/landing-v2/components/atoms'

const ROWS = [
  { feature: 'Time to start watching',                                         them: '17 minutes', us: '47 seconds' },
  { feature: 'Decisions you make',                                             them: '~40',        us: '1' },
  { feature: 'Posters scrolled past',                                          them: '~120',       us: '0' },
  { feature: 'Tabs opened to check ratings',                                   them: '3-4',        us: '0' },
  { feature: 'Films suggested by an algorithm trained on you',                 them: 'No',         us: 'Yes' },
  { feature: "Films pushed because they're trending",                          them: 'Yes',        us: 'No' },
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

export default function VsScrollingV2() {
  const isMobile = useIsMobile()
  return (
    <section style={{
      position: 'relative', background: '#000',
      padding: isMobile ? '72px 22px' : '120px 80px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 56px' }}>
          <SectionEyebrow label="The 20-minute scroll" />
          <h2 style={{
            fontSize: isMobile ? 32 : 52, fontWeight: 900,
            letterSpacing: '-0.025em', lineHeight: 1.04,
            margin: '14px 0 16px', color: '#fff', textWrap: 'balance',
          }}>
            What scrolling Netflix<br />
            <span style={{ background: BRAND.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>actually costs you.</span>
          </h2>
        </div>

        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ROWS.map((r, i) => (
              <div key={i} style={{
                padding: '14px 16px', borderRadius: 14,
                border: `1px solid ${BRAND.border}`,
                background: 'rgba(255,255,255,0.025)',
              }}>
                <p style={{ fontSize: 13, color: BRAND.w60, margin: '0 0 8px' }}>{r.feature}</p>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, color: BRAND.w40, margin: '0 0 2px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Scrolling</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{r.them}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, color: 'rgba(192,132,252,0.7)', margin: '0 0 2px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>FeelFlick</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#c4b5fd', margin: 0 }}>{r.us}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            borderRadius: 22, overflow: 'hidden',
            border: `1px solid ${BRAND.border}`,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
          }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr',
              padding: '18px 28px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(0,0,0,0.3)',
            }}>
              <span />
              <span style={{ fontSize: 11, fontWeight: 700, color: BRAND.w60, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Scrolling Netflix</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(192,132,252,0.85)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>FeelFlick</span>
            </div>
            {ROWS.map((r, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr',
                padding: '18px 28px',
                borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: 14.5, color: BRAND.w60 }}>{r.feature}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{r.them}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{r.us}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
