// src/features/landing/sections/HeroSection.jsx
import { useState, useMemo } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { Sparkles, PlayCircle } from 'lucide-react'
import googleSvg from '@/assets/icons/google.svg'

// 🎬 Curated high-quality posters (TMDB paths)
const POSTER_ROWS = [
  // Row 1: Iconic / Modern Classics
  [
    '/q6y0Go1rZgVoTFZYpK391L0imU.jpg', // Pulp Fiction
    '/gEU2QniL6E77NI6lCU6MxlNBvIx.jpg', // Interstellar
    '/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', // LOTR
    '/kwB7d51AIcyzPOB0Mq5aJEGM4q0.jpg', // Goodfellas
    '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', // Godfather
    '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', // Dark Knight
    '/8kSerJrhr6s0CnjLk8QXX397003.jpg', // Fight Club
  ],
  // Row 2: Diverse / Visual Stunners
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

// 🔹 Small helper so we don't spread arrays directly inline every render
function usePosterRows() {
  return useMemo(
    () => [
      [...POSTER_ROWS[0], ...POSTER_ROWS[0], ...POSTER_ROWS[0]],
      [...POSTER_ROWS[1], ...POSTER_ROWS[1], ...POSTER_ROWS[1]],
    ],
    [],
  )
}

// 🔹 Single tile with robust error handling
function PosterTile({ path, id }) {
  const [failed, setFailed] = useState(false)

  if (!path) {
    // Defensive: if path is falsy, render gradient tile instead of mounting an <img>
    return (
      <div
        className="relative w-40 sm:w-44 md:w-48 h-60 sm:h-68 md:h-72 shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br from-purple-900 via-black to-amber-900/40"
        aria-hidden="true"
      />
    )
  }

  return (
    <div
      className="relative w-40 sm:w-44 md:w-48 h-60 sm:h-68 md:h-72 shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br from-purple-900 via-black to-amber-900/40"
      aria-hidden="true"
    >
      {!failed && (
        <img
          src={`https://image.tmdb.org/t/p/w500${path}`}
          className="w-full h-full object-cover"
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}

export default function HeroSection() {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [row1, row2] = usePosterRows()

  async function handleGoogleSignIn() {
    if (isAuthenticating) return
    setIsAuthenticating(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Safe-guard: window should exist in browser environment
          redirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/onboarding`
              : undefined,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Auth error:', error)
      // In production you might swap this for a toast/snackbar
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

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black pt-20">
      {/* 🎬 Animated poster wall */}
      <div className="absolute inset-0 z-0 opacity-30 select-none pointer-events-none">
        {/* Slightly richer gradient instead of aurora:
            - Keeps focus on content
            - Avoids visual noise on top of posters */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black via-black/40 to-black" />
        <div className="absolute inset-0 z-10 bg-gradient-to-tr from-purple-900/40 via-transparent to-amber-700/20" />

        <div className="flex flex-col justify-center h-full gap-6 scale-[1.08] rotate-[-2deg] origin-center">
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

      {/* 📝 Content */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors cursor-default">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-amber-100/90">
            Find movies that match your mood
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-8 leading-tight">
          <span className="block text-white drop-shadow-2xl">
            Stop Scrolling.
          </span>
          <span className="block bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-transparent drop-shadow-2xl pb-2">
            Start Feeling.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-2xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          Like Spotify for movies. Discover films based on your{' '}
          <span className="text-white font-bold">vibe, emotion, and taste</span>
          —not just what&apos;s trending.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="group relative w-full max-w-xs sm:max-w-none sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-white text-black font-bold text-base sm:text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)] transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center gap-3">
              {isAuthenticating ? (
                'Signing in...'
              ) : (
                <>
                  <img src={googleSvg} alt="Google" className="w-5 h-5" />
                  <span>Get Started — It&apos;s Free</span>
                </>
              )}
            </span>
          </button>

          <button
            onClick={scrollToHowItWorks}
            className="w-full max-w-xs sm:max-w-none sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white font-bold text-base sm:text-lg hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-5 h-5" />
            <span>How It Works</span>
          </button>
        </div>

        {/* Trust signals (100+ services removed) */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-white/40 font-medium">
          <span>✓ Always Free</span>
          <span>✓ No Ads</span>
          <span>✓ Privacy First</span>
        </div>
      </div>
    </section>
  )
}
