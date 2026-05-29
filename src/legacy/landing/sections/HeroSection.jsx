// src/features/landing/sections/HeroSection.jsx
import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { LogIn, Loader2 } from 'lucide-react'

import { useGoogleAuth } from '@/shared/hooks/useGoogleAuth'
import MoodDemoPanel from '@/legacy/landing/components/MoodDemoPanel'
import Button from '@/shared/ui/Button'

const MOOD_COLORS = {
  nostalgic:  { primary: '222,184,135', secondary: '193,154,107' },
  tense:      { primary: '108,123,179', secondary: '100,130,180' },
  cozy:       { primary: '168,198,134', secondary: '126,200,200' },
  euphoric:   { primary: '255,217,61',  secondary: '255,140,66'  },
  curious:    { primary: '78,205,196',  secondary: '69,183,170'  },
  melancholy: { primary: '155,142,196', secondary: '108,123,179' },
}

function CTABlock({ signInWithGoogle, isAuthenticating, align = 'start' }) {
  return (
    <div className={`flex flex-col ${align === 'center' ? 'items-center' : 'items-center lg:items-start'}`}>
      <div className="inline-flex flex-col items-center gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={signInWithGoogle}
          disabled={isAuthenticating}
          className="touch-target"
          aria-label={isAuthenticating ? 'Signing in' : 'Get started free with FeelFlick'}
        >
          {isAuthenticating ? (
            <><Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" aria-hidden="true" /> Signing in…</>
          ) : (
            <>
              Get Started Free
              <LogIn className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            </>
          )}
        </Button>
        <p className="w-full text-center text-xs text-white/40">
          Free forever · No credit card · No ads
        </p>
      </div>
    </div>
  )
}

export default function HeroSection() {
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth()
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  const [activeMood, setActiveMood] = useState('nostalgic')
  const handleMoodChange = useCallback((moodId) => setActiveMood(moodId), [])

  const moodColors = MOOD_COLORS[activeMood] || MOOD_COLORS.nostalgic

  return (
    <>
      <style>{`
        .hero-headline {
          font-size: clamp(2.5rem, 8vw, 3.5rem);
        }
        @media (min-width: 1024px) {
          .hero-headline {
            font-size: clamp(3.5rem, 5vw, 5rem);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in-up {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
      <section
        id="hero"
        className="relative min-h-screen overflow-hidden bg-black"
        aria-label="FeelFlick — the right film, right now"
      >
        {/* ── LAYER 1: Static cinematic tint (always present) ──────────── */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(88,28,135,0.18) 0%, rgba(168,85,247,0.08) 40%, rgba(236,72,153,0.10) 70%, rgba(0,0,0,0.20) 100%)',
          }}
          aria-hidden="true"
        />

        {/* ── LAYER 2: Mood-reactive bloom (driven by demo panel) ──────── */}
        {!prefersReducedMotion && (
          <motion.div
            key={activeMood}
            className="pointer-events-none absolute inset-0 z-[1]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            style={{
              background: `radial-gradient(ellipse 80% 65% at 50% 28%, rgba(${moodColors.primary},0.22) 0%, rgba(${moodColors.secondary},0.10) 40%, transparent 75%)`,
            }}
            aria-hidden="true"
          />
        )}

        {/* ── LAYER 3: Bottom ambient glow ─────────────────────────────── */}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 50% 110%, rgba(168,85,247,0.18), transparent 65%)',
          }}
          aria-hidden="true"
        />

        {/* ── LAYER 4: Nav top fade ────────────────────────────────────── */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-20"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)' }}
          aria-hidden="true"
        />

        {/* ── LAYER 5: Content ─────────────────────────────────────────── */}
        <div className="relative z-10 flex min-h-screen flex-col lg:flex-row lg:items-center">
          {/* MOBILE-ONLY headline (above panel). Hidden on lg. */}
          <div className="animate-fade-in-up flex flex-col items-center px-6 pt-24 text-center lg:hidden">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-purple-400/60">
              FILMS THAT KNOW YOU
            </p>
            <h1 className="hero-headline mb-5 font-black leading-[1.05] tracking-tight">
              <span className="block text-white">The right film.</span>
              <span
                className="block"
                style={{
                  background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  display: 'inline-block',
                  paddingBottom: '0.1em',
                }}
              >
                Right now.
              </span>
            </h1>
            <p className="mb-2 max-w-[520px] text-sm leading-relaxed text-white/60">
              Picks shaped by your mood, taste, and cinematic history.
            </p>
          </div>

          {/* DESKTOP left column — headline + CTA stacked. Hidden on mobile.
              Right padding intentionally tight so the demo panel sits closer. */}
          <div className="hidden animate-fade-in-up lg:flex lg:w-[48%] lg:items-center lg:justify-start lg:pl-16 lg:pr-6 xl:pl-24 xl:pr-8">
            <div className="max-w-xl">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-purple-400/60">
                FILMS THAT KNOW YOU
              </p>
              <h1 className="hero-headline mb-7 font-black leading-[1.05] tracking-tight">
                <span className="block text-white">The right film.</span>
                <span
                  className="block"
                  style={{
                    background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    display: 'inline-block',
                    paddingBottom: '0.1em',
                  }}
                >
                  Right now.
                </span>
              </h1>
              <p className="mb-6 max-w-[520px] text-lg leading-relaxed text-white/60">
                Picks shaped by your mood, taste, and cinematic history.
              </p>
              <CTABlock signInWithGoogle={signInWithGoogle} isAuthenticating={isAuthenticating} />
            </div>
          </div>

          {/* Demo panel — center on mobile, right column on desktop.
              Tight left padding so the panel sits close to the headline. */}
          <div className="flex w-full items-center justify-center px-6 pt-6 lg:w-[52%] lg:pl-2 lg:pr-12 lg:pt-0 xl:pr-16">
            <MoodDemoPanel onMoodChange={handleMoodChange} />
          </div>

          {/* MOBILE-ONLY CTA below panel. Hidden on lg. */}
          <div className="flex flex-col items-center px-6 pb-16 pt-8 lg:hidden">
            <CTABlock signInWithGoogle={signInWithGoogle} isAuthenticating={isAuthenticating} align="center" />
          </div>
        </div>
      </section>
    </>
  )
}
