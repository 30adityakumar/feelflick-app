// src/features/landing-v2/sections/TasteMatchV2.jsx
import { useEffect, useState } from 'react'
import { BRAND } from '@/features/landing-v2/theme'
import { SectionEyebrow } from '@/features/landing-v2/components/atoms'

function useIsMobile(bp = 768) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < bp)
  useEffect(() => {
    const onR = () => setM(window.innerWidth < bp)
    window.addEventListener('resize', onR)
    return () => window.removeEventListener('resize', onR)
  }, [bp])
  return m
}

export default function TasteMatchV2() {
  const isMobile = useIsMobile()
  return (
    <section style={{
      position: 'relative', background: '#000',
      padding: isMobile ? '72px 22px' : '120px 80px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 50% 60% at 20% 50%, rgba(168,85,247,0.10), transparent 65%)',
      }} />
      <div style={{
        position: 'relative', maxWidth: 1280, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr',
        gap: isMobile ? 32 : 80,
        alignItems: 'center',
      }}>
        <div style={{
          borderRadius: 22,
          padding: isMobile ? '24px 20px' : '32px 36px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center', gap: isMobile ? 14 : 28,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: BRAND.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800, color: '#fff',
                margin: '0 auto 12px',
              }}>AK</div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Aditya K.</p>
              <p style={{ fontSize: 11, color: BRAND.w40, margin: 0, lineHeight: 1.4 }}>42 films · Sci-fi thriller obsessed</p>
            </div>
            <div style={{ textAlign: 'center', padding: '0 8px' }}>
              <p style={{
                fontSize: isMobile ? 36 : 48, fontWeight: 900,
                background: BRAND.gradient,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                letterSpacing: '-0.04em', lineHeight: 1, margin: 0,
              }}>87%</p>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: BRAND.w40, margin: '6px 0 0',
              }}>Taste Match</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800, color: '#fff',
                margin: '0 auto 12px',
              }}>MR</div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Marco R.</p>
              <p style={{ fontSize: 11, color: BRAND.w40, margin: 0, lineHeight: 1.4 }}>83 films · Arthouse obsessive</p>
            </div>
          </div>
          <p style={{
            fontSize: 12.5, color: BRAND.w60, fontStyle: 'italic',
            textAlign: 'center', margin: '24px 0 0', lineHeight: 1.55,
            paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            You both love Nolan, gravitate toward slow-burn sci-fi, and rewatch the same ambiguous endings.
          </p>
        </div>

        <div>
          <SectionEyebrow label="Taste Match" />
          <h2 style={{
            fontSize: isMobile ? 36 : 56, fontWeight: 900,
            letterSpacing: '-0.035em', lineHeight: 1.02,
            margin: '14px 0 22px', color: '#fff',
          }}>
            Find people who<br />actually get your taste.
          </h2>
          <p style={{ fontSize: isMobile ? 15 : 16.5, color: BRAND.w60, lineHeight: 1.65, margin: 0, maxWidth: 460 }}>
            Not followers. Compatibility. See who shares your directors, your moods, and your taste in endings — and why their picks actually mean something.
          </p>
        </div>
      </div>
    </section>
  )
}
