// src/features/landing/sections/HeroSection.jsx
import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LogIn, Loader2, ArrowDown } from 'lucide-react'

import { useGoogleAuth } from '@/features/landing/utils/useGoogleAuth'
import Button from '@/shared/ui/Button'

const POSTER_ROWS = [
  [
    { path: '/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg', tag: 'Curious'     }, // Interstellar
    { path: '/pEzNVQfdzYDzVK0XqxERIw2x2se.jpg', tag: 'Reflective'  }, // Arrival
    { path: '/u68AjlvlutfEIcpmbYpKcdi09ut.jpg', tag: 'Inventive'   }, // Everything Everywhere All at Once
    { path: '/5UwdhrjXhUgsiDhe1dpS9z4yj7q.jpg', tag: 'Cerebral'    }, // Synecdoche, New York
    { path: '/mE24wUCfjK8AoBBjaMjho7Rczr7.jpg', tag: 'Tense'       }, // Get Out
    { path: '/hjlZSXM86wJrfCv5VKfR5DI2VeU.jpg', tag: 'Unsettling'  }, // Hereditary
    { path: '/pThyQovXQrw2m0s9x82twj48Jq4.jpg', tag: 'Clever'      }, // Knives Out
    { path: '/vz3Vd6nfq9YZrVvyYx5RHFaYKV3.jpg', tag: 'Witty'       }, // In Bruges
    { path: '/nSxDa3M9aMvGVLoItzWTepQ5h5d.jpg', tag: 'Whimsical'   }, // Amélie
    { path: '/1OJ9vkD5xPt3skC6KguyXAgagRZ.jpg', tag: 'Feel-good'   }, // Paddington 2
    { path: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', tag: 'Sharp'       }, // Parasite
  ],
  [
    { path: '/fa0RDkAlCec0STeMNAhPaF89q6U.jpg', tag: 'Mastery'     }, // There Will Be Blood
    { path: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', tag: 'Soulful'     }, // Spirited Away
    { path: '/z7xXihu5wHuSMWymq5VAulPVuvg.jpg', tag: 'Mythic'      }, // Pan's Labyrinth
    { path: '/6Ryitt95xrO8KXuqRGm1fUuNwqF.jpg', tag: 'Nostalgic'   }, // Coco
    { path: '/gl66K7zRdtNYGrxyS2YDUP5ASZd.jpg', tag: 'Coming-of-age' }, // Lady Bird
    { path: '/eCOtqtfvn7mxGl6nfmq4b1exJRc.jpg', tag: 'Intimate'    }, // Her
    { path: '/iYypPT4bhqXfq1b6EnmxvRt6b2Y.jpg', tag: 'Longing'     }, // In the Mood for Love
    { path: '/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg', tag: 'Editorial'   }, // The Grand Budapest Hotel
    { path: '/7Y9ILV1unpW9mLpGcqyGQU72LUy.jpg', tag: 'Offbeat'     }, // The Lobster
    { path: '/hA2ple9q4qnwxp3hKVNhroipsir.jpg', tag: 'Kinetic'     }, // Mad Max: Fury Road
    { path: '/602vevIURmpDfzbnv5Ubi6wIkQm.jpg', tag: 'Intense'     }, // Drive
  ],
]

const MOOD_WORDS = ['nostalgic', 'tense', 'cozy', 'euphoric', 'curious', 'melancholy']

const MOOD_COLORS = {
  nostalgic:  { primary: '222,184,135', secondary: '193,154,107' },
  tense:      { primary: '108,123,179', secondary: '100,130,180' },
  cozy:       { primary: '168,198,134', secondary: '126,200,200' },
  euphoric:   { primary: '255,217,61',  secondary: '255,140,66'  },
  curious:    { primary: '78,205,196',  secondary: '69,183,170'  },
  melancholy: { primary: '155,142,196', secondary: '108,123,179' },
}

function usePosterRows() {
  return useMemo(
    () => [
      [...POSTER_ROWS[0], ...POSTER_ROWS[0], ...POSTER_ROWS[0]],
      [...POSTER_ROWS[1], ...POSTER_ROWS[1], ...POSTER_ROWS[1]],
    ],
    [],
  )
}


function PosterTile({ path, tag }) {
  return (
    <div
      className="relative w-36 sm:w-40 h-52 sm:h-60 shrink-0 rounded-xl overflow-hidden border border-white/8 bg-neutral-900"
      role="presentation"
      aria-hidden="true"
    >
      <img
        src={`https://image.tmdb.org/t/p/w342${path}`}
        className="w-full h-full object-cover"
        alt=""
        loading="eager"
        decoding="async"
      />
      {/* Top gradient fade for tag legibility */}
      <div
        className="absolute inset-x-0 top-0 h-12 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.60) 0%, transparent 100%)' }}
      />
      {/* Mood tag */}
      {tag && (
        <span className="absolute top-2.5 right-2.5 text-[9px] font-medium tracking-[0.12em] uppercase text-white/60 select-none">
          {tag}
        </span>
      )}
    </div>
  )
}


export default function HeroSection() {
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth()
  const [row1, row2] = usePosterRows()
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  const [moodIndex, setMoodIndex] = useState(0)
  const [tintOpacity, setTintOpacity] = useState(0)

  useEffect(() => {
    // Fade in tint after mount
    const fadeIn = setTimeout(() => setTintOpacity(1), 400)
    const interval = setInterval(() => {
      setMoodIndex(i => (i + 1) % MOOD_WORDS.length)
    }, 3000)
    return () => {
      clearTimeout(fadeIn)
      clearInterval(interval)
    }
  }, [])

  const activeMoodColors = MOOD_COLORS[MOOD_WORDS[moodIndex]]

  const scrollToMoodDemo = () => {
    const element = document.getElementById('mood-demo')
    if (!element) return
    const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - 80
    window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
  }

  return (
    <>
      <style>{`
        .hero-headline {
          font-size: clamp(2.75rem, 9vw, 3.75rem);
        }
        @media (min-width: 1024px) {
          .hero-headline {
            font-size: clamp(4.5rem, 6vw, 7rem);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-scroll-left,
          .animate-scroll-right {
            animation: none !important;
          }
          .animate-fade-in-up {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
      <section
        id="hero"
        className="relative min-h-screen bg-black overflow-hidden"
        aria-labelledby="hero-heading"
      >

      {/* ── LAYER 1: Full-bleed poster wall ──────────────────────────────
          Sits behind everything. Covers the whole section on both
          mobile and desktop. The gradient layers above control what's
          visible and what merges into black.
      ─────────────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 z-0 select-none pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="flex flex-col justify-start lg:justify-center h-full gap-5 rotate-[-2deg] scale-[1.08] origin-top lg:origin-center pt-16 sm:pt-20 lg:pt-0"
          style={{ opacity: 0.92 }}
        >
          <div className="flex gap-4 animate-scroll-left w-[220%]">
            {row1.map((item, i) => <PosterTile key={`r1-${i}`} path={item.path} tag={item.tag} />)}
          </div>
          <div className="flex gap-4 animate-scroll-right w-[220%]">
            {row2.map((item, i) => <PosterTile key={`r2-${i}`} path={item.path} tag={item.tag} />)}
          </div>
        </div>
      </div>

      {/* ── LAYER 2: Dynamic mood-colour tint ────────────────────────────
          Shifts hue with the rotating mood word for a cinema wash effect.
          Base purple layer underneath; mood overlay cross-fades on top.
      ─────────────────────────────────────────────────────────────── */}
      {/* Base: static purple-pink cinematic tint — always present */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(88,28,135,0.14) 0%, rgba(168,85,247,0.06) 40%, rgba(236,72,153,0.08) 70%, rgba(0,0,0,0.20) 100%)',
        }}
        aria-hidden="true"
      />
      {/* Mood overlay — cross-fades when mood word changes */}
      {!prefersReducedMotion && (
        <motion.div
          key={moodIndex}
          className="absolute inset-0 z-[1] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: tintOpacity * 0.55 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{
            background: `linear-gradient(135deg, rgba(${activeMoodColors.primary},0.18) 0%, rgba(${activeMoodColors.secondary},0.10) 50%, transparent 80%)`,
          }}
          aria-hidden="true"
        />
      )}

      {/* ── LAYER 3a: Desktop merge gradient ─────────────────────────────
          Left 60% = content. Transition zone = 30%–65%.
          Goes solid black → transparent over a very wide band so the
          two halves melt into each other rather than cut.
      ─────────────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none hidden lg:block"
        style={{
          background: 'linear-gradient(to right, #06060A 0%, #06060A 40%, rgba(0,0,0,0.88) 52%, rgba(0,0,0,0.4) 63%, rgba(0,0,0,0.08) 76%, transparent 88%)',
        }}
        aria-hidden="true"
      />

      {/* ── LAYER 3b: Mobile merge gradient ──────────────────────────────
          Top 40% = posters (with only the cinematic tint).
          Bottom 60% = content. The transition zone goes from ~30vh to ~44vh
          — a 14vh tall seamless dissolve.
      ─────────────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none lg:hidden"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.15) 26vh, rgba(0,0,0,0.6) 32vh, rgba(0,0,0,0.92) 37vh, #06060A 40vh)',
        }}
        aria-hidden="true"
      />

      {/* ── LAYER 4: Nav top fade (always) ───────────────────────────── */}
      <div
        className="absolute inset-x-0 top-0 z-[3] h-20 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)' }}
        aria-hidden="true"
      />

      {/* ── LAYER 5: Content — sits above all gradients ───────────────── */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">

        {/* Mobile: top spacer — posters show through here */}
        <div className="lg:hidden flex-shrink-0" style={{ height: '32vh' }} aria-hidden="true" />

        {/* Unified content block — responsive alignment and sizing */}
        <div
          className="flex items-center justify-center text-center lg:text-left lg:justify-start lg:w-[70%] lg:px-16 xl:px-28 px-6 pb-10 lg:pb-0 animate-fade-in-up"
          style={{ minHeight: '68vh' }}
        >
          <div className="max-w-sm lg:max-w-2xl">
            {/* Eyebrow — sits above the h1, low-contrast label */}
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-400/60 mb-3 lg:mb-4">
              FILMS THAT KNOW YOU
            </p>
            {/* Single h1 — id appears once, no duplicate */}
            <h1
              id="hero-heading"
              className="hero-headline font-black tracking-tight leading-[1.05] mb-5 lg:mb-8"
            >
              <span className="block text-white">The right film.</span>
              <span
                className="block"
                style={{
                  background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 45%, #fbbf24 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  display: 'inline-block',
                  paddingBottom: '0.1em',
                }}
              >Right now.</span>
            </h1>
            <p className="text-sm lg:text-lg text-white/60 leading-relaxed mb-2 max-w-[560px]">
              FeelFlick recommends movies based on your mood, your taste, and the moment you&apos;re in — so you spend less time scrolling and more time watching.
            </p>
            <p className="text-sm text-white/35 mt-2 mb-5 lg:mb-6 max-w-[560px]">
              Not a streaming service — a smarter way to choose what to watch.
            </p>

            {/* CTA + trust line — trust text is constrained to pill width */}
            <div className="flex flex-col items-center lg:items-start">
              <div className="inline-flex flex-col items-center gap-3">

                {/* Primary CTA */}
                <Button
                  variant="primary"
                  size="lg"
                  onClick={signInWithGoogle}
                  disabled={isAuthenticating}
                  className="touch-target"
                  aria-label={isAuthenticating ? 'Signing in' : 'Get started free with FeelFlick'}
                >
                  {isAuthenticating ? (
                    <><Loader2 className="h-4 w-4 animate-spin flex-shrink-0" aria-hidden="true" /> Signing in...</>
                  ) : (
                    <>
                      Get Started Free
                      <LogIn className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    </>
                  )}
                </Button>

                {/* Trust line — centered under pill, width bounded by it */}
                <p className="text-xs text-white/40 text-center w-full">
                  Free forever · No credit card · No ads
                </p>

              </div>
            </div>
          </div>
        </div>

        {/* Desktop: 30% right spacer — posters show through */}
        <div className="hidden lg:block w-[30%]" aria-hidden="true" />

      </div>

      {/* See how it works — bottom-center anchor */}
      <button
        onClick={scrollToMoodDemo}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors duration-200 touch-target"
        aria-label="See how FeelFlick works"
      >
        See how it works
        <ArrowDown className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
      </button>

    </section>
    </>
  )
}
