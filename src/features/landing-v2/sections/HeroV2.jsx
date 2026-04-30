// src/features/landing-v2/sections/HeroV2.jsx
// The interactive hero — auto-cycles through moods, glass panel, searching state,
// matched picks with %, top-pick caption. 1:1 with the prototype.

import { useEffect, useRef, useState } from 'react'

import { BRAND } from '@/features/landing-v2/theme'
import { MOODS, WANTS_BY_MOOD, TONE_COPY } from '@/features/landing-v2/data'
import { FFMark, Wordmark, Poster, PrimaryCTA, SectionEyebrow } from '@/features/landing-v2/components/atoms'
import { useGoogleAuth } from '@/features/landing/utils/useGoogleAuth'

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

function ConvNav({ isMobile }) {
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth()
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)',
      padding: isMobile ? '16px 22px' : '24px 56px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <Wordmark size={isMobile ? 18 : 22} />
      {!isMobile && (
        <div style={{ display: 'flex', gap: 36, alignItems: 'center', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <a href="#how" style={{ fontSize: 13, color: BRAND.w60, fontWeight: 500, textDecoration: 'none' }}>How it works</a>
          <a href="#day" style={{ fontSize: 13, color: BRAND.w60, fontWeight: 500, textDecoration: 'none' }}>Why it&apos;s different</a>
          <a href="#privacy" style={{ fontSize: 13, color: BRAND.w60, fontWeight: 500, textDecoration: 'none' }}>Privacy</a>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          onClick={signInWithGoogle}
          disabled={isAuthenticating}
          style={{
            fontSize: 13, fontWeight: 600, color: BRAND.w60,
            padding: '8px 18px', borderRadius: 999,
            border: `1px solid ${BRAND.borderHi}`, background: 'transparent',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >{isAuthenticating ? 'Signing in…' : 'Sign In'}</button>
      </div>
    </div>
  )
}

export default function HeroV2() {
  const isMobile = useIsMobile()
  const [moodIdx, setMoodIdx] = useState(0)
  const [phase, setPhase] = useState('typing') // 'typing' | 'resolved'
  const [userTaken, setUserTaken] = useState(false)
  const userResumeRef = useRef(null)
  const mood = MOODS[moodIdx % MOODS.length]
  const accentColor = mood.color

  // Auto-cycle until user takes over
  useEffect(() => {
    if (userTaken) return
    setPhase('typing')
    const resolveT = setTimeout(() => setPhase('resolved'), 1100)
    const nextT    = setTimeout(() => setMoodIdx(i => i + 1), 4400)
    return () => { clearTimeout(resolveT); clearTimeout(nextT) }
  }, [moodIdx, userTaken])

  // Resume autoplay 8s after user takes over
  useEffect(() => {
    if (!userTaken) return
    setPhase('typing')
    const t = setTimeout(() => setPhase('resolved'), 700)
    userResumeRef.current = setTimeout(() => setUserTaken(false), 8000)
    return () => {
      clearTimeout(t)
      if (userResumeRef.current) clearTimeout(userResumeRef.current)
    }
  }, [moodIdx, userTaken])

  const pickMood = (idx) => {
    setUserTaken(true)
    setMoodIdx(idx)
  }

  const wantOptions = WANTS_BY_MOOD[mood.id] || ['interesting']
  const currentWant = wantOptions[0]

  return (
    <section style={{
      position: 'relative',
      minHeight: isMobile ? 'auto' : '100vh',
      background: '#000',
      overflow: 'hidden',
      paddingBottom: isMobile ? 64 : 96,
    }}>
      <ConvNav isMobile={isMobile} />

      {/* Mood-reactive bloom */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 80% 65% at 50% 28%, ${accentColor}57 0%, rgba(88,28,135,0.32) 35%, transparent 70%)`,
        transition: 'background 1.4s ease',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 110%, rgba(168,85,247,0.18), transparent 65%)' }} />

      <div style={{
        position: 'relative', zIndex: 10,
        maxWidth: 1080, margin: '0 auto',
        padding: isMobile ? '120px 22px 32px' : '180px 40px 40px',
        textAlign: 'center',
      }}>
        <SectionEyebrow label={TONE.eyebrow} />
        <h1 style={{
          fontSize: isMobile ? 38 : 76, fontWeight: 900,
          letterSpacing: '-0.035em', lineHeight: 1.02,
          margin: '22px 0 18px', color: '#fff',
          textWrap: 'balance',
        }}>
          {TONE.h1a}<br />
          <span style={{
            background: 'linear-gradient(90deg, hsl(280 92% 65%), hsl(330 90% 60%))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', paddingBottom: '0.06em',
          }}>{TONE.h1b}</span>
        </h1>
        <p style={{
          fontSize: isMobile ? 15 : 18, color: BRAND.w60,
          lineHeight: 1.55, margin: '0 auto 36px',
          maxWidth: 600,
        }}>{TONE.sub}</p>

        {/* Glass interactive panel */}
        <div style={{
          position: 'relative',
          maxWidth: 760, margin: '0 auto',
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${phase === 'resolved' ? accentColor + '88' : 'rgba(255,255,255,0.10)'}`,
          borderRadius: isMobile ? 20 : 26,
          padding: isMobile ? '18px 16px' : '24px 28px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: phase === 'resolved'
            ? `0 24px 70px ${accentColor}33, inset 0 1px 0 rgba(255,255,255,0.08)`
            : '0 24px 70px rgba(0,0,0,0.5)',
          transition: 'all 600ms cubic-bezier(0.22,1,0.36,1)',
          textAlign: 'left',
        }}>
          {/* Sentence row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ flexShrink: 0, marginTop: 2 }}><FFMark size={isMobile ? 32 : 38} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, color: BRAND.w40, margin: '0 0 6px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
                {userTaken ? 'You, right now' : 'You, tonight'}
              </p>
              <p style={{
                fontSize: isMobile ? 17 : 23, fontWeight: 600, color: '#fff',
                margin: 0, lineHeight: 1.35, letterSpacing: '-0.01em',
              }}>
                I feel{' '}
                <span style={{
                  display: 'inline-block', color: accentColor, fontWeight: 800,
                  borderBottom: `2px solid ${accentColor}66`, paddingBottom: 1,
                  transition: 'color 400ms, border-color 400ms',
                }}>{mood.label.toLowerCase()}</span>
                {phase === 'typing' && (
                  <span style={{ display: 'inline-block', width: 2, height: '0.9em', background: accentColor, marginLeft: 2, verticalAlign: 'middle', animation: 'lv2-blink 1s steps(2) infinite' }} />
                )}
                <span style={{ color: BRAND.w40, fontWeight: 400 }}> tonight, want something </span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{currentWant}</span>
                <span style={{ color: BRAND.w40, fontWeight: 400 }}>.</span>
              </p>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: isMobile ? '18px 0' : '22px 0' }} />

          {/* Searching or films */}
          <div style={{ minHeight: isMobile ? 250 : 310 }}>
            {phase === 'typing' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 4px' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: 7, height: 7, borderRadius: 999, background: accentColor,
                      animation: `lv2-pulse 1.2s ease-in-out ${i * 0.15}s infinite`,
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 13, color: BRAND.w60 }}>
                  Searching 6,700 films across <span style={{ color: '#fff', fontWeight: 600 }}>{mood.label.toLowerCase()}</span>…
                </span>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: BRAND.w40, margin: 0 }}>3 picks for you</p>
                  <p style={{ fontSize: 11, color: BRAND.w40, margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>matched in 0.43s</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? 10 : 14 }}>
                  {mood.films.map((f, i) => (
                    <div key={f.path + moodIdx} style={{ animation: `lv2-slide 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.08}s backwards` }}>
                      <Poster data={f} w="100%" badge={mood.matches[i]} accent={i === 0 ? accentColor : undefined} />
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: '8px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.title}</p>
                      <p style={{ fontSize: 11, color: BRAND.w40, margin: '2px 0 0' }}>{f.year}</p>
                    </div>
                  ))}
                </div>
                {!isMobile && (
                  <p style={{ fontSize: 13, color: BRAND.w60, margin: '16px 0 0', fontStyle: 'italic', lineHeight: 1.55 }}>
                    → Top pick: <span style={{ color: '#fff', fontWeight: 600, fontStyle: 'normal' }}>{mood.films[0].title}</span>{mood.films[0].year ? ` (${mood.films[0].year})` : ''} — {mood.matches[0]}% match for the {mood.label.toLowerCase()} mood you described.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mood quick-picks */}
        <div style={{ marginTop: 28, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: BRAND.w40, alignSelf: 'center' }}>Try:</span>
          {MOODS.slice(0, isMobile ? 4 : 6).map((m, idx) => (
            <button
              key={m.id}
              onClick={() => pickMood(idx)}
              style={{
                padding: '6px 14px', borderRadius: 999,
                fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.12)',
                color: idx === moodIdx % MOODS.length ? '#fff' : 'rgba(255,255,255,0.65)',
                background: idx === moodIdx % MOODS.length ? `${m.color}22` : 'rgba(255,255,255,0.03)',
                fontFamily: 'inherit',
                transition: 'all 0.18s',
              }}
            >
              <span style={{ marginRight: 5 }}>{m.emoji}</span>{m.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: isMobile ? 36 : 48 }}>
          <PrimaryCTA label="Get Started Free" />
          <p style={{ fontSize: 12, color: BRAND.w40, margin: '14px 0 0' }}>
            Free forever · No credit card · No ads
          </p>
        </div>
      </div>
    </section>
  )
}
