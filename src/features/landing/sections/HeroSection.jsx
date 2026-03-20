// src/features/landing/sections/HeroSection.jsx
import { useState, useMemo, useEffect, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import googleSvg from '@/assets/icons/google.svg'
import { useGoogleAuth } from '@/features/landing/utils/useGoogleAuth'

// 🎬 Curated high-quality posters (TMDB paths)
const POSTER_ROWS = [
  [
    '/q6y0Go1rZgVoTFZYpK391L0imU.jpg', // Pulp Fiction
    '/gEU2QniL6E77NI6lCU6MxlNBvIx.jpg', // Interstellar
    '/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', // LOTR
    '/kwB7d51AIcyzPOB0Mq5aJEGM4q0.jpg', // Goodfellas
    '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', // Godfather
    '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', // Dark Knight
    '/8kSerJrhr6s0CnjLk8QXX397003.jpg', // Fight Club
  ],
  [
    '/saHP97rTPS5eLmrLQEcANmKrsFl.jpg', // Forrest Gump
    '/sM33SANp9z6rXW8Itn7NnG1CXEs.jpg', // Zootopia
    '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', // Fight Club (Alt)
    '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', // Amelie
    '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', // Parasite
    '/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', // Spirited Away
    '/q719jXXEzOoYaps6babgKnONONX.jpg', // Your Name
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
    }, 2200)
    return () => clearInterval(interval)
  }, [])

  return (
    <span
      className={`inline-block bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-transparent transition-opacity duration-[400ms] ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {MOOD_WORDS[index]}.
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

  if (!path) {
    return (
      <div
        className="relative w-40 sm:w-44 md:w-48 h-60 sm:h-68 md:h-72 shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br from-purple-900 via-black to-amber-900/40"
        role="presentation"
        aria-hidden="true"
      />
    )
  }

  return (
    <div
      className="relative w-40 sm:w-44 md:w-48 h-60 sm:h-68 md:h-72 shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br from-purple-900 via-black to-amber-900/40 transition-transform duration-300 hover:scale-105 will-change-transform"
      role="presentation"
      aria-hidden="true"
    >
      {loadState === 'loading' && (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900 animate-pulse" />
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

export default function HeroSection() {
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth()
  const [row1, row2] = usePosterRows()

  const scrollToMoodDemo = () => {
    const element = document.getElementById('mood-demo')
    if (!element) return
    const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - 80
    window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
  }

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black pt-20"
      aria-labelledby="hero-heading"
    >
      {/* Animated poster wall background */}
      <div
        className="absolute inset-0 z-0 select-none pointer-events-none"
        style={{ opacity: 0.35 }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black via-black/40 to-black" />
        <div className="absolute inset-0 z-10 bg-gradient-to-tr from-purple-900/40 via-transparent to-amber-700/20" />
        <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]" />

        <div className="flex flex-col justify-center h-full gap-6 scale-[1.08] rotate-[-2deg] origin-center">
          <div className="flex gap-4 sm:gap-5 md:gap-6 animate-scroll-left w-[220%]">
            {row1.map((path, i) => (
              <PosterTile key={`r1-${i}`} path={path} />
            ))}
          </div>
          <div className="flex gap-4 sm:gap-5 md:gap-6 animate-scroll-right w-[220%]">
            {row2.map((path, i) => (
              <PosterTile key={`r2-${i}`} path={path} />
            ))}
          </div>
        </div>
      </div>

      {/* Hero content */}
      <motion.div
        className="relative z-20 max-w-5xl mx-auto px-4 text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Headline */}
        <h1
          id="hero-heading"
          className="mb-8 leading-none"
        >
          <span className="block text-white/75 text-2xl sm:text-3xl font-semibold tracking-wide mb-3">
            Find films for when you're feeling
          </span>
          <span className="block text-hero font-black tracking-tight leading-none">
            <MoodRotator />
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-white/60 max-w-xl mx-auto mb-10 leading-relaxed">
          Not what's trending. Not the algorithm.{' '}
          <span className="text-white/90 font-semibold">The right film for right now.</span>
        </p>

        {/* Primary CTA */}
        <div className="flex items-center justify-center">
          <button
            onClick={signInWithGoogle}
            disabled={isAuthenticating}
            className="group relative w-full max-w-xs sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-white text-black font-bold text-base sm:text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)] transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden touch-target"
            aria-label={isAuthenticating ? 'Signing in with Google' : 'Get started with Google sign in'}
          >
            <span
              className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ animation: 'shimmer 2s ease-in-out infinite', backgroundSize: '200% 100%' }}
              aria-hidden="true"
            />
            <span className="relative flex items-center justify-center gap-3">
              {isAuthenticating ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <img src={googleSvg} alt="" className="w-5 h-5" aria-hidden="true" />
                  <span>Get Started — It's Free</span>
                </>
              )}
            </span>
          </button>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <button
        onClick={scrollToMoodDemo}
        className="hidden lg:block absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-white/30 hover:text-white/60 transition-colors animate-bounce touch-target"
        aria-label="Scroll to explore moods"
      >
        <ArrowRight className="w-6 h-6 rotate-90" />
      </button>
    </section>
  )
}
