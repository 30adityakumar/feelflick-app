// src/features/landing/sections/HeroSection.jsx
import { useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { Sparkles, PlayCircle, AlertCircle } from 'lucide-react'
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
    '/kwB7d51AIcyzPOB0Mq5aJEGM4q0.jpg', // Goodfellas
  ],
]

export default function HeroSection() {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState(null)

  async function handleGoogleSignIn() {
    setIsAuthenticating(true)
    setAuthError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Auth error:', error)
      setAuthError('Unable to sign in. Please try again.')
      setIsAuthenticating(false)
    }
  }

  const scrollToHowItWorks = () => {
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
    <section
      className="relative h-screen min-h-[600px] max-h-[1080px] flex items-center justify-center overflow-hidden bg-black"
      aria-label="Hero section"
    >
      {/* 🎬 Animated Poster Wall Background */}
      <div
        className="absolute inset-0 z-0 opacity-30 select-none pointer-events-none"
        aria-hidden="true"
      >
        {/* Vignette overlays */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute inset-0 z-10 bg-black/40" />

        {/* Poster rows */}
        <div className="flex flex-col justify-center h-full gap-4 sm:gap-6 scale-110 rotate-[-2deg] origin-center">
          {/* Row 1: Scrolls Left */}
          <div className="flex gap-4 sm:gap-6 animate-scroll-left will-change-transform">
            {[...POSTER_ROWS[0], ...POSTER_ROWS[0], ...POSTER_ROWS[0]].map(
              (path, i) => (
                <div
                  key={`r1-${i}`}
                  className="relative w-32 h-48 sm:w-40 sm:h-60 md:w-48 md:h-72 shrink-0 rounded-lg sm:rounded-xl overflow-hidden shadow-2xl border border-white/10"
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w500${path}`}
                    className="w-full h-full object-cover"
                    alt=""
                    loading="lazy"
                  />
                </div>
              ),
            )}
          </div>

          {/* Row 2: Scrolls Right */}
          <div className="flex gap-4 sm:gap-6 animate-scroll-right will-change-transform">
            {[...POSTER_ROWS[1], ...POSTER_ROWS[1], ...POSTER_ROWS[1]].map(
              (path, i) => (
                <div
                  key={`r2-${i}`}
                  className="relative w-32 h-48 sm:w-40 sm:h-60 md:w-48 md:h-72 shrink-0 rounded-lg sm:rounded-xl overflow-hidden shadow-2xl border border-white/10"
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w500${path}`}
                    className="w-full h-full object-cover"
                    alt=""
                    loading="lazy"
                  />
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      {/* 📝 Hero Content */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        {/* Mood Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 sm:mb-8 hover:bg-white/10 transition-all duration-300 cursor-default group">
          <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs sm:text-sm font-medium text-amber-100/90">
            Find movies that match your mood
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="mb-6 sm:mb-8 leading-[1.1] tracking-tight">
          <span className="block text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(0,0,0,0.9)]">
            Stop Scrolling.
          </span>
          <span className="block text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,0,0,0.9)] pb-2">
            Start Feeling.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-base sm:text-xl md:text-2xl text-white/70 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-medium px-4">
          Like Spotify for movies. Discover films based on your{' '}
          <span className="text-white font-bold">vibe, emotion, and taste</span>
          —not just what&apos;s trending.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-10">
          <button
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="group relative w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-black font-bold text-base sm:text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)] transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            aria-label="Sign in with Google"
          >
            <span className="flex items-center justify-center gap-3">
              {isAuthenticating ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-black"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <img src={googleSvg} alt="" className="w-5 h-5" />
                  <span>Get Started — It&apos;s Free</span>
                </>
              )}
            </span>
          </button>

          <button
            onClick={scrollToHowItWorks}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white font-bold text-base sm:text-lg hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            aria-label="Learn how it works"
          >
            <PlayCircle className="w-5 h-5" />
            <span>How It Works</span>
          </button>
        </div>

        {/* Error Message */}
        {authError && (
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Trust Signals */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-3 text-xs sm:text-sm text-white/40 font-medium">
          <span className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Always Free
          </span>
          <span className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            No Ads
          </span>
          <span className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Privacy First
          </span>
        </div>
      </div>
    </section>
  )
}
