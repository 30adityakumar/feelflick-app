// src/features/landing/sections/HeroSection.jsx
import { useState, useMemo, useEffect, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import googleSvg from '@/assets/icons/google.svg'
import { useGoogleAuth } from '@/features/landing/utils/useGoogleAuth'

const POSTER_ROWS = [
  [
    '/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg', // Interstellar
    '/u68AjlvlutfEIcpmbYpKcdi09ut.jpg', // Everything Everywhere All at Once
    '/mE24wUCfjK8AoBBjaMjho7Rczr7.jpg', // Get Out
    '/uxzzxijgPIY7slzFvMotPv8wjKA.jpg', // Black Panther
    '/gDzOcq0pfeCeqMBwKIJlSmQpjkZ.jpg', // Dune
    '/pThyQovXQrw2m0s9x82twj48Jq4.jpg', // Knives Out
    '/hjlZSXM86wJrfCv5VKfR5DI2VeU.jpg', // Hereditary
  ],
  [
    '/nSxDa3M9aMvGVLoItzWTepQ5h5d.jpg', // Amélie
    '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', // Parasite
    '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', // Spirited Away
    '/q719jXXEzOoYaps6babgKnONONX.jpg', // Your Name
    '/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg', // La La Land
    '/6Ryitt95xrO8KXuqRGm1fUuNwqF.jpg', // Coco
    '/qLnfEmPrDjJfPyyddLJPkXmshkp.jpg', // Moonlight
  ],
]

const MOOD_WORDS = ['nostalgic', 'tense', 'cozy', 'euphoric', 'curious', 'melancholy']

function usePosterRows() {
  return useMemo(
    () => [
      [...POSTER_ROWS[0], ...POSTER_ROWS[0], ...POSTER_ROWS[0]],
      [...POSTER_ROWS[1], ...POSTER_ROWS[1], ...POSTER_ROWS[1]],
    ],
    [],
  )
}

function MoodRotator() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % MOOD_WORDS.length)
        setVisible(true)
      }, 400)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <span
      className={`inline-block pb-[0.15em] bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent transition-opacity duration-[400ms] ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {MOOD_WORDS[index]}
    </span>
  )
}

function PosterTile({ path }) {
  const [loadState, setLoadState] = useState('loading')
  const imgRef = useRef(null)

  useEffect(() => {
    if (!path || !imgRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && loadState === 'loading') {
            entry.target.src = entry.target.dataset.src
          }
        })
      },
      { rootMargin: '50px' },
    )
    observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [path, loadState])

  return (
    <div
      className="relative w-36 sm:w-40 h-52 sm:h-60 shrink-0 rounded-xl overflow-hidden border border-white/8 bg-neutral-900"
      role="presentation"
      aria-hidden="true"
    >
      {loadState === 'loading' && (
        <div className="absolute inset-0 bg-neutral-800 animate-pulse" />
      )}
      <img
        ref={imgRef}
        data-src={`https://image.tmdb.org/t/p/w500${path}`}
        className={`w-full h-full object-cover transition-opacity duration-700 ${
          loadState === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
        alt=""
        loading="lazy"
        onLoad={() => setLoadState('loaded')}
        onError={() => setLoadState('error')}
      />
    </div>
  )
}

function CTAButtons({ signInWithGoogle, isAuthenticating, scrollToMoodDemo, centered = false }) {
  return (
    <div className={`flex flex-col gap-4 ${centered ? 'items-center' : 'items-start'}`}>
      <div className={`flex flex-col sm:flex-row gap-3 ${centered ? 'items-center sm:items-center' : 'items-stretch sm:items-center'}`}>
        <button
          onClick={signInWithGoogle}
          disabled={isAuthenticating}
          className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-base shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
          aria-label={isAuthenticating ? 'Signing in' : 'Get started free with Google'}
        >
          {isAuthenticating ? (
            <>
              <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <img src={googleSvg} alt="" className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </>
          )}
        </button>
        <button
          onClick={scrollToMoodDemo}
          className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-white/12 text-white/50 text-sm font-medium hover:border-white/25 hover:text-white/80 hover:bg-white/4 transition-all duration-200 touch-target"
          aria-label="See how FeelFlick works"
        >
          See how it works ↓
        </button>
      </div>
      <p className="text-xs text-white/25">Free forever · No credit card required</p>
    </div>
  )
}

export default function HeroSection() {
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth()
  const [row1, row2] = usePosterRows()

  const scrollToMoodDemo = () => {
    const element = document.getElementById('how-it-works')
    if (!element) return
    const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - 80
    window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
  }

  return (
    <section
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
            {row1.map((path, i) => <PosterTile key={`r1-${i}`} path={path} />)}
          </div>
          <div className="flex gap-4 animate-scroll-right w-[220%]">
            {row2.map((path, i) => <PosterTile key={`r2-${i}`} path={path} />)}
          </div>
        </div>
      </div>

      {/* ── LAYER 2: FeelFlick cinematic colour tint ─────────────────────
          Purple-to-transparent overlay gives the poster grid a cinematic
          FeelFlick feel — like a cinema screen with a colour wash.
          Covers the whole section so the tint is consistent.
      ─────────────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(88,28,135,0.18) 0%, rgba(168,85,247,0.08) 40%, rgba(236,72,153,0.10) 70%, rgba(0,0,0,0.25) 100%)',
        }}
        aria-hidden="true"
      />

      {/* ── LAYER 3a: Desktop merge gradient ─────────────────────────────
          Left 60% = content. Transition zone = 30%–65%.
          Goes solid black → transparent over a very wide band so the
          two halves melt into each other rather than cut.
      ─────────────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none hidden lg:block"
        style={{
          background: 'linear-gradient(to right, #000 0%, #000 48%, rgba(0,0,0,0.92) 58%, rgba(0,0,0,0.5) 68%, rgba(0,0,0,0.1) 80%, transparent 90%)',
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
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.15) 22vh, rgba(0,0,0,0.6) 28vh, rgba(0,0,0,0.92) 34vh, #000 40vh)',
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

        {/* Desktop: 70% content column, vertically centred */}
        <div className="hidden lg:flex w-[70%] items-center px-16 xl:px-28 animate-fade-in-up">
          <div className="max-w-2xl">
            <h1
              id="hero-heading"
              className="font-black tracking-tight leading-[1.05] mb-8"
              style={{ fontSize: 'clamp(3.5rem, 5vw, 6rem)' }}
            >
              <span className="text-white">Movies that match</span>
              <br />
              <span className="gradient-text">your mood.</span>
            </h1>
            <p className="text-xl text-white/60 leading-relaxed mb-6 max-w-xl">
              FeelFlick helps you discover the right movie for how you feel right now — based on your mood, context, and taste, so you spend less time scrolling and more time watching.
            </p>
            <p className="text-lg text-white/40 mb-8">
              Feeling <MoodRotator />? There&apos;s a film for that.
            </p>
            <CTAButtons
              signInWithGoogle={signInWithGoogle}
              isAuthenticating={isAuthenticating}
              scrollToMoodDemo={scrollToMoodDemo}
            />
          </div>
        </div>

        {/* Desktop: 30% right spacer — posters show through */}
        <div className="hidden lg:block w-[30%]" aria-hidden="true" />

        {/* Mobile: top spacer — posters show through here */}
        <div className="lg:hidden flex-shrink-0" style={{ height: '32vh' }} aria-hidden="true" />

        {/* Mobile: content, centred */}
        <div
          className="lg:hidden flex items-center justify-center text-center px-6 pb-10 animate-fade-in-up"
          style={{ minHeight: '68vh' }}
        >
          <div className="max-w-sm">
            <h1
              id="hero-heading"
              className="font-black tracking-tight leading-[1.05] mb-5"
              style={{ fontSize: 'clamp(2.5rem, 9vw, 3.25rem)' }}
            >
              <span className="text-white">Movies that match</span>
              <br />
              <span className="gradient-text">your mood.</span>
            </h1>
            <p className="text-base text-white/60 leading-relaxed mb-5">
              FeelFlick helps you discover the right movie for how you feel right now — based on your mood, context, and taste.
            </p>
            <p className="text-base text-white/40 mb-7">
              Feeling <MoodRotator />? There&apos;s a film for that.
            </p>
            <CTAButtons
              signInWithGoogle={signInWithGoogle}
              isAuthenticating={isAuthenticating}
              scrollToMoodDemo={scrollToMoodDemo}
              centered
            />
          </div>
        </div>

      </div>
    </section>
  )
}
