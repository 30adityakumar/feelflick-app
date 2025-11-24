// src/features/landing/sections/HeroSection.jsx
import { useState, useMemo, useEffect, useRef, memo } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { Sparkles, PlayCircle } from 'lucide-react'
import googleSvg from '@/assets/icons/google.svg'

// 🎬 Curated high-quality posters (TMDB paths)
const POSTER_ROWS = [
  [
    '/q6y0Go1rZgVoTFZYpK391L0imU.jpg',
    '/gEU2QniL6E77NI6lCU6MxlNBvIx.jpg',
    '/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg',
    '/kwB7d51AIcyzPOB0Mq5aJEGM4q0.jpg',
    '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    '/8kSerJrhr6s0CnjLk8QXX397003.jpg',
  ],
  [
    '/saHP97rTPS5eLmrLQEcANmKrsFl.jpg',
    '/sM33SANp9z6rXW8Itn7NnG1CXEs.jpg',
    '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
    '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    '/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg',
    '/q719jXXEzOoYaps6babgKnONONX.jpg',
  ],
]

function usePosterRows() {
  return useMemo(
    () => [
      [...POSTER_ROWS[0], ...POSTER_ROWS[0], ...POSTER_ROWS[0]],
      [...POSTER_ROWS[1], ...POSTER_ROWS[1], ...POSTER_ROWS[1]],
    ],
    [],
  )
}

const PosterTile = memo(function PosterTile({ path }) {
  const [failed, setFailed] = useState(false)

  if (!path) {
    return (
      <div
        className="relative w-40 sm:w-44 md:w-48 h-60 sm:h-68 md:h-72 shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br from-purple-900 via-black to-amber-900/40"
        aria-hidden="true"
      />
    )
  }

  return (
    <div
      className="relative w-40 sm:w-44 md:w-48 h-60 sm:h-68 md:h-72 shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br from-purple-900 via-black to-amber-900/40 transition-transform duration-300 hover:scale-105 will-change-transform"
      aria-hidden="true"
    >
      {!failed && (
        <img
          src={`https://image.tmdb.org/t/p/w500${path}`}
          className="w-full h-full object-cover"
          alt={`Movie poster`}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
})

export default function HeroSection() {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const contentRef = useRef(null)
  const [row1, row2] = usePosterRows()

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setScrollY(window.scrollY)
        ticking = false
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  async function handleGoogleSignIn() {
    if (isAuthenticating) return
    setIsAuthenticating(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/onboarding`
              : undefined,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Auth error:', error)
      alert('Sign in failed. Please try again.')
    } finally {
      setIsAuthenticating(false)
    }
  }

  const scrollToHowItWorks = () => {
    if (typeof window === 'undefined') return
    const element = document.getElementById('how-it-works')
    if (!element) return

    const headerOffset = 80
    const elementPosition = element.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    })
  }

  const parallaxY = scrollY * 0.3

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black pt-20 z-20 select-none">
      {/* Poster Wall */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black via-black/40 to-black" />
        <div className="absolute inset-0 z-10 bg-gradient-to-tr from-purple-900/50 via-pink-700/30 to-amber-700/30 blend-mode-overlay" />

        <div
          className="flex flex-col justify-center h-full gap-6 scale-[1.1] rotate-[-2deg] origin-center will-change-transform"
          style={{ transform: `translateY(${parallaxY}px)` }}
        >
          {/* Row 1 */}
          <div className="flex gap-4 sm:gap-5 md:gap-6 animate-scroll-left w-[220%]">
            {row1.map((path, i) => (
              <PosterTile key={`r1-${i}`} path={path} />
            ))}
          </div>

          {/* Row 2 */}
          <div className="flex gap-4 sm:gap-5 md:gap-6 animate-scroll-right w-[220%]">
            {row2.map((path, i) => (
              <PosterTile key={`r2-${i}`} path={path} />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="relative z-20 max-w-5xl mx-auto px-4 text-center"
        style={{ transform: `translateY(${parallaxY}px)` }}
      >
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/20 backdrop-blur-xl mb-8 hover:bg-white/10 hover:border-purple-400 transition-all duration-300 select-text cursor-default"
          aria-label="Tagline: Find movies that match your mood"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-amber-100/90">
            Find movies that match your mood
          </span>
        </div>

        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-8 leading-tight select-text">
          <span className="block text-white drop-shadow-2xl">Stop Scrolling.</span>
          <span className="block bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-transparent drop-shadow-2xl pb-2 animate-pulse-slow">
            Start Watching.
          </span>
        </h1>

        <p className="text-lg sm:text-2xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed font-medium select-text">
          Like Spotify for movies. Discover films based on your{' '}
          <span className="text-white font-bold">vibe, emotion, and taste</span>—not
          just what&apos;s trending.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            aria-busy={isAuthenticating}
            aria-live="polite"
            className="group relative w-full max-w-xs sm:max-w-none sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-white bg-opacity-90 text-black font-bold text-base sm:text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)] transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden backdrop-blur-xl border border-transparent hover:border-purple-400"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />

            <span className="relative flex items-center justify-center gap-3">
              {isAuthenticating ? (
                'Signing in...'
              ) : (
                <>
                  <img src={googleSvg} alt="Google icon" className="w-5 h-5" />
                  <span>Get Started — It&apos;s Free</span>
                </>
              )}
            </span>
          </button>

          <button
            onClick={scrollToHowItWorks}
            className="w-full max-w-xs sm:max-w-none sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white font-bold text-base sm:text-lg hover:bg-white/20 hover:border-white/20 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
            aria-label="Learn how FeelFlick works"
          >
            <PlayCircle className="w-5 h-5" />
            <span>How It Works</span>
          </button>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-white/40 font-medium select-text">
          <span className="hover:text-white/60 transition-colors cursor-default" aria-label="Always Free">✓ Always Free</span>
          <span className="hover:text-white/60 transition-colors cursor-default" aria-label="No Ads">✓ No Ads</span>
          <span className="hover:text-white/60 transition-colors cursor-default" aria-label="Privacy First">✓ Privacy First</span>
        </div>
      </div>
    </section>
  )
}
