// src/features/landing-v2/sections/CinematicDNAV2.jsx
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

const RECENTLY = [POSTERS.inception, POSTERS.martian, POSTERS.synecdoche, POSTERS.interstellar]
const DIRECTORS = ['Christopher Nolan', 'Ridley Scott', 'Bong Joon-ho']
const GENRES = [
  { name: 'Sci-Fi',   pct: 84 },
  { name: 'Thriller', pct: 71 },
  { name: 'Mystery',  pct: 63 },
]

export default function CinematicDNAV2() {
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
        background: 'radial-gradient(ellipse 50% 60% at 90% 50%, rgba(168,85,247,0.13), transparent 65%)',
      }} />
      <div style={{
        position: 'relative', maxWidth: 1280, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '0.85fr 1.15fr',
        gap: isMobile ? 40 : 80,
        alignItems: 'center',
      }}>
        <div>
          <SectionEyebrow label="Cinematic DNA" />
          <h2 style={{
            fontSize: isMobile ? 36 : 60, fontWeight: 900,
            letterSpacing: '-0.035em', lineHeight: 1.0,
            margin: '14px 0 22px', color: '#fff',
          }}>
            Your taste,<br />made visible.
          </h2>
          <p style={{ fontSize: isMobile ? 15 : 16.5, color: BRAND.w60, lineHeight: 1.65, margin: '0 0 18px', maxWidth: 460 }}>
            Every film you watch builds your Cinematic DNA — a living portrait of your genres, directors, mood patterns, and the stories that stay with you.
          </p>
          <p style={{ fontSize: isMobile ? 15 : 16.5, color: BRAND.w60, lineHeight: 1.65, margin: 0, maxWidth: 460 }}>
            It&apos;s not a hidden algorithm. It&apos;s something you can see, share, and grow — film by film.
          </p>
        </div>

        <div style={{
          borderRadius: 22,
          padding: isMobile ? '22px 20px' : '28px 30px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: BRAND.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '0.02em',
            }}>AK</div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>Aditya K.</p>
              <p style={{ fontSize: 12.5, color: BRAND.w60, margin: '2px 0 0', fontStyle: 'italic' }}>Obsessed with films that mess with time.</p>
            </div>
          </div>

          <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: BRAND.w40, margin: '0 0 12px' }}>Top Genres</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {GENRES.map(g => (
              <div key={g.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{g.name}</span>
                  <span style={{ fontSize: 11, color: BRAND.w40, fontFamily: 'JetBrains Mono, monospace' }}>{g.pct}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${g.pct}%`, height: '100%', background: BRAND.gradient }} />
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: BRAND.w40, margin: '0 0 12px' }}>Top Directors</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {DIRECTORS.map(d => (
              <span key={d} style={{
                padding: '6px 14px', borderRadius: 999,
                fontSize: 12.5, fontWeight: 500,
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.85)',
                background: 'rgba(255,255,255,0.03)',
              }}>{d}</span>
            ))}
          </div>

          <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: BRAND.w40, margin: '0 0 10px' }}>Taste Summary</p>
          <p style={{ fontSize: 13, color: BRAND.w60, lineHeight: 1.55, margin: '0 0 24px', fontStyle: 'italic' }}>
            &quot;Gravitates toward time-bending puzzles — memory, alternate timelines, and the films that stay with you long after the credits.&quot;
          </p>

          <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: BRAND.w40, margin: '0 0 12px' }}>Recently Watched</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {RECENTLY.map(p => (
              <Poster key={p.path} data={p} w="100%" />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
