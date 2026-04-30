// src/features/landing-v2/sections/DayInLifeV2.jsx
import { useEffect, useState } from 'react'
import { BRAND } from '@/features/landing-v2/theme'
import { MOODS, POSTERS } from '@/features/landing-v2/data'
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

const MOMENTS = [
  {
    time: '7:42 PM', day: 'Wednesday',
    vibe: 'Wiped out from a long day',
    moodId: 'cozy',
    pick: POSTERS.paddington,
    reason: 'Low-stakes, gentle warmth. Nothing to figure out.',
  },
  {
    time: '10:15 PM', day: 'Friday',
    vibe: 'Wired, want something to chew on',
    moodId: 'curious',
    pick: POSTERS.interstellar,
    reason: 'Cerebral and visual. Big questions, big feelings.',
  },
  {
    time: '2:08 AM', day: 'Sunday',
    vibe: 'Cannot sleep, feel weird',
    moodId: 'melancholy',
    pick: POSTERS.her,
    reason: "Quiet, beautiful, won't demand much from you.",
  },
]

export default function DayInLifeV2() {
  const isMobile = useIsMobile()
  return (
    <section id="day" style={{
      position: 'relative', background: '#0a0610',
      padding: isMobile ? '72px 22px' : '120px 80px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 50% 40% at 80% 30%, rgba(168,85,247,0.10), transparent 60%), radial-gradient(ellipse 50% 40% at 20% 80%, rgba(236,72,153,0.10), transparent 60%)',
      }} />
      <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 64px' }}>
          <SectionEyebrow label="A day in the life" />
          <h2 style={{
            fontSize: isMobile ? 32 : 52, fontWeight: 900,
            letterSpacing: '-0.025em', lineHeight: 1.04,
            margin: '14px 0 16px', color: '#fff', textWrap: 'balance',
          }}>
            Same person.<br />Three different nights.
          </h2>
          <p style={{ fontSize: isMobile ? 14.5 : 16, color: BRAND.w60, lineHeight: 1.6, margin: 0 }}>
            Mood-first means the answer changes when you do. Tuesday-tired and Friday-wired don&apos;t get the same film.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 18 : 28,
        }}>
          {MOMENTS.map((m, i) => {
            const mood = MOODS.find(x => x.id === m.moodId)
            return (
              <div key={i} style={{
                borderRadius: 22, padding: isMobile ? '20px 18px' : '24px 22px',
                border: `1px solid ${BRAND.border}`,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: mood.color, letterSpacing: '0.04em' }}>{m.time}</span>
                  <span style={{ fontSize: 11, color: BRAND.w40, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{m.day}</span>
                </div>
                <p style={{
                  fontSize: isMobile ? 18 : 19, fontWeight: 700, color: '#fff',
                  letterSpacing: '-0.01em', margin: '0 0 18px', lineHeight: 1.35,
                }}>&quot;{m.vibe}&quot;</p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 999,
                  background: `${mood.color}1f`,
                  border: `1px solid ${mood.color}55`,
                  fontSize: 12, fontWeight: 600, color: mood.color,
                  marginBottom: 18,
                }}>
                  <span>{mood.emoji}</span>
                  <span>{mood.label}</span>
                </div>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 74, flexShrink: 0 }}>
                    <Poster data={m.pick} w="100%" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
                    <p style={{ fontSize: 11, color: BRAND.w40, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px', fontWeight: 600 }}>Tonight&apos;s pick</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 2px', letterSpacing: '-0.01em' }}>{m.pick.title}</p>
                    <p style={{ fontSize: 12, color: BRAND.w40, margin: '0 0 8px' }}>{m.pick.year}</p>
                    <p style={{ fontSize: 12.5, color: BRAND.w60, lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>{m.reason}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
