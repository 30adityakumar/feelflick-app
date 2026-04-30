// src/features/landing-v2/sections/SampleGalleryV2.jsx
import { useEffect, useState } from 'react'
import { BRAND } from '@/features/landing-v2/theme'
import { MOODS } from '@/features/landing-v2/data'
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

export default function SampleGalleryV2() {
  const isMobile = useIsMobile()
  const [activeIdx, setActiveIdx] = useState(0)
  const active = MOODS[activeIdx]

  return (
    <section style={{
      position: 'relative', background: '#000',
      padding: isMobile ? '72px 22px' : '120px 80px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${active.color}1a, transparent 60%)`,
        transition: 'background 0.6s',
      }} />
      <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 48px' }}>
          <SectionEyebrow label="See the magic before signing up" />
          <h2 style={{
            fontSize: isMobile ? 32 : 52, fontWeight: 900,
            letterSpacing: '-0.025em', lineHeight: 1.04,
            margin: '14px 0 16px', color: '#fff', textWrap: 'balance',
          }}>
            Pick a mood.<br />See what we&apos;d pick.
          </h2>
        </div>

        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
          gap: 8, marginBottom: 40,
        }}>
          {MOODS.map((m, idx) => {
            const isActive = idx === activeIdx
            return (
              <button
                key={m.id}
                onClick={() => setActiveIdx(idx)}
                style={{
                  padding: '10px 18px', borderRadius: 999,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${isActive ? m.color + 'aa' : 'rgba(255,255,255,0.12)'}`,
                  background: isActive ? `${m.color}22` : 'rgba(255,255,255,0.03)',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                  transition: 'all 0.2s', fontFamily: 'inherit',
                }}
              >
                <span style={{ marginRight: 6 }}>{m.emoji}</span>{m.label}
              </button>
            )
          })}
        </div>

        <div key={activeIdx} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: isMobile ? 12 : 28,
          maxWidth: 880, margin: '0 auto',
          animation: 'lv2-fadein 0.5s ease',
        }}>
          {active.films.map((f, i) => (
            <div key={f.path} style={{ animation: `lv2-slide 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.08}s backwards` }}>
              <Poster data={f} w="100%" badge={active.matches[i]} accent={i === 0 ? active.color : undefined} />
              <p style={{ fontSize: isMobile ? 12 : 14, fontWeight: 700, color: '#fff', margin: '10px 0 2px', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.title}</p>
              <p style={{ fontSize: isMobile ? 11 : 12, color: BRAND.w40, margin: 0 }}>{f.year}</p>
            </div>
          ))}
        </div>

        <p style={{
          textAlign: 'center', fontSize: 14, color: BRAND.w40,
          margin: '40px auto 0', fontStyle: 'italic', maxWidth: 580,
        }}>
          These are starting points. Once you sign up, picks get sharper as we learn your taste.
        </p>
      </div>
    </section>
  )
}
