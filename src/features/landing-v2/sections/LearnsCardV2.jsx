// src/features/landing-v2/sections/LearnsCardV2.jsx
import { useEffect, useState } from 'react'
import { BRAND } from '@/features/landing-v2/theme'
import { POSTERS } from '@/features/landing-v2/data'
import { Poster, SectionEyebrow } from '@/features/landing-v2/components/atoms'

function useIsMobile(bp = 768) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < bp)
  useEffect(() => {
    const onR = () => setM(window.innerWidth < bp)
    window.addEventListener('resize', onR)
    return () => window.removeEventListener('resize', onR)
  }, [bp])
  return m
}

export default function LearnsCardV2() {
  const isMobile = useIsMobile()
  return (
    <section style={{
      position: 'relative', background: '#000',
      padding: isMobile ? '72px 22px' : '140px 80px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 50% 60% at 80% 30%, rgba(236,72,153,0.10), transparent 65%)',
      }} />
      <div style={{
        position: 'relative', maxWidth: 1280, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '0.9fr 1.1fr',
        gap: isMobile ? 32 : 80,
        alignItems: 'center',
      }}>
        <div>
          <SectionEyebrow label="Learns you" />
          <h2 style={{
            fontSize: isMobile ? 36 : 56, fontWeight: 900,
            letterSpacing: '-0.035em', lineHeight: 1.02,
            margin: '14px 0 22px', color: '#fff',
          }}>
            It gets better<br />at getting you.
          </h2>
          <p style={{ fontSize: isMobile ? 15 : 16.5, color: BRAND.w60, lineHeight: 1.65, margin: 0, maxWidth: 460 }}>
            Five films in, it&apos;s decent. Fifty films in, it starts to feel uncanny. Every watch, rating, and skip makes the next pick sharper.
          </p>
        </div>

        <div style={{
          borderRadius: 20,
          padding: isMobile ? '20px 18px' : '24px 26px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
            <div style={{ width: 36, flexShrink: 0 }}>
              <Poster data={POSTERS.parasite} w="100%" />
            </div>
            <p style={{ fontSize: 13, color: BRAND.w60, margin: 0 }}>
              Because you loved <span style={{ color: '#fff', fontWeight: 600, fontStyle: 'italic' }}>Parasite</span>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
            <div style={{ width: isMobile ? 84 : 110, flexShrink: 0 }}>
              <Poster data={POSTERS.synecdoche} w="100%" accent="#a855f7" />
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
                <h3 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>{POSTERS.synecdoche.title}</h3>
                <span style={{
                  flexShrink: 0,
                  padding: '4px 10px', borderRadius: 999,
                  background: 'rgba(168,85,247,0.18)',
                  border: '1px solid rgba(168,85,247,0.45)',
                  fontSize: 11.5, fontWeight: 700, color: '#c4b5fd',
                }}>94%</span>
              </div>
              <p style={{ fontSize: 12.5, color: BRAND.w60, margin: '0 0 14px' }}>
                {POSTERS.synecdoche.year} · Horror · Thriller
              </p>
              <p style={{ fontSize: 13.5, color: BRAND.w60, lineHeight: 1.55, margin: 0, fontStyle: 'italic' }}>
                Social horror that crawls under your skin — same tension, different nightmare.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
