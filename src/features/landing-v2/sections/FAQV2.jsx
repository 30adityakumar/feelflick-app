// src/features/landing-v2/sections/FAQV2.jsx
import { useEffect, useState } from 'react'
import { BRAND } from '@/features/landing-v2/theme'
import { SectionEyebrow } from '@/features/landing-v2/components/atoms'

const ITEMS = [
  { q: 'Is FeelFlick a streaming service?', a: "No. We don't stream films — we help you choose them. Once you pick, watch wherever you already do (Netflix, Max, Criterion, your hard drive)." },
  { q: 'Do I need to rate everything I watch?', a: "No. A skip is a signal. A re-watch is a signal. We learn from how you actually use the app — not from a homework assignment." },
  { q: "Will it ever push me what's trending?", a: "Not unless trending happens to be right for you. Trending is a list. You're a person." },
  { q: 'How is my data used?', a: 'Only to make your picks sharper. No selling, no ads, no third-party tracking. Your taste graph is yours — export it or delete it any time.' },
  { q: "How does it handle moods I can't name?", a: 'Tell it what you watched yesterday and how you felt about it. We can read between the lines. "Something like X but lighter" is a perfectly good prompt.' },
  { q: 'Is it really free?', a: 'Yes. The core experience is free forever, supported by an optional Pro tier (advanced filters, multiple taste profiles, offline). No ads in either tier.' },
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

export default function FAQV2() {
  const isMobile = useIsMobile()
  const [openIdx, setOpenIdx] = useState(0)

  return (
    <section style={{
      position: 'relative', background: '#000',
      padding: isMobile ? '72px 22px' : '120px 80px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <SectionEyebrow label="Common questions" />
          <h2 style={{
            fontSize: isMobile ? 30 : 44, fontWeight: 900,
            letterSpacing: '-0.025em', lineHeight: 1.05,
            margin: '14px 0 0', color: '#fff',
          }}>Everything else.</h2>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {ITEMS.map((it, i) => {
            const open = i === openIdx
            return (
              <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  onClick={() => setOpenIdx(open ? -1 : i)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    width: '100%', padding: '24px 0', gap: 16,
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    textAlign: 'left', fontFamily: 'inherit',
                  }}
                >
                  <h3 style={{
                    fontSize: isMobile ? 16 : 19, fontWeight: 700,
                    color: '#fff', letterSpacing: '-0.01em', margin: 0,
                  }}>{it.q}</h3>
                  <span style={{
                    fontSize: 18, color: BRAND.w40, flexShrink: 0,
                    transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
                    transition: 'transform 0.25s',
                    fontWeight: 300,
                  }}>+</span>
                </button>
                <div style={{
                  maxHeight: open ? 200 : 0, overflow: 'hidden',
                  transition: 'max-height 0.3s ease, padding 0.3s ease',
                  padding: open ? '0 0 24px' : '0',
                }}>
                  <p style={{
                    fontSize: isMobile ? 14 : 14.5, color: BRAND.w60,
                    lineHeight: 1.65, margin: 0, maxWidth: 720,
                  }}>{it.a}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
