// src/features/landing/sections/HeroSection.jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { Sparkles, PlayCircle, Loader2 } from 'lucide-react'
import googleSvg from '@/assets/icons/google.svg'

// 🎬 Curated high-quality posters (TMDB) - 3 rows for depth
const POSTER_ROWS = [
  // Row 1: Iconic Classics
  [
    '/q6y0Go1rZgVoTFZYpK391L0imU.jpg', // Pulp Fiction
    '/gEU2QniL6E77NI6lCU6MxlNBvIx.jpg', // Interstellar
    '/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', // LOTR
    '/kwB7d51AIcyzPOB0Mq5aJEGM4q0.jpg', // Goodfellas
    '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', // Godfather
    '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', // Dark Knight
  ],
  // Row 2: Visual Masterpieces
  [
    '/8kSerJrhr6s0CnjLk8QXX397003.jpg', // Fight Club
    '/saHP97rTPS5eLmrLQEcANmKrsFl.jpg', // Forrest Gump
    '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', // Amelie
    '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', // Parasite
    '/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', // Spirited Away
    '/q719jXXEzOoYaps6babgKnONONX.jpg', // Your Name
  ],
  // Row 3: Modern Cinema
  [
    '/sM33SANp9z6rXW8Itn7NnG1CXEs.jpg', // Zootopia
    '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', // Fight Club
    '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', // Spider-Verse
    '/8b8R8l88Qje9dn9OE8UIyBSXL3b.jpg', // Dune
    '/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg', // Avengers
    '/5VTN0pR8gcqV3EPUHHfMGnJYN9L.jpg', // Inception
  ],
]

export default function HeroSection() {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [imagesLoaded, setImagesLoaded] = useState(false)

  // Preload critical images
  useEffect(() => {
    const imagesToPreload = POSTER_ROWS.flat().slice(0, 6)
    let loadedCount = 0

    imagesToPreload.forEach((path) => {
      const img = new Image()
      img.src = `https://image.tmdb.org/t/p/w500${path}`
      img.onload = () => {
        loadedCount++
        if (loadedCount === imagesToPreload.length) {
          setImagesLoaded(true)
        }
      }
    })
  }, [])

  const handleGoogleSignIn = useCallback(async () => {
    setIsAuthenticating(true)
    setAuthError(null)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
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

      // Success state (user will be redirected)
      console.log('Auth initiated successfully', data)
    } catch (error) {
      console.error('Auth error:', error)
      setAuthError(error.message || 'Authentication failed. Please try again.')
      setIsAuthenticating(false)
    }
  }, [])

  const scrollToHowItWorks = useCallback(() => {
    const element = document.getElementById('how-it-works')
    if (!element) return

    const headerOffset = 80
    const elementPosition = element.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    })
  }, [])

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
      aria-label="Hero section"
    >
      {/* 🎬 CINEMATIC POSTER WALL BACKGROUND */}
      <div
        className={`absolute inset-0 z-0 select-none pointer-events-none transition-opacity duration-1000 ${
          imagesLoaded ? 'opacity-30' : 'opacity-0'
        }`}
        aria-hidden="true"
      >
        {/* Multi-layered vignette for depth */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        <div className="absolute inset-0 z-10 bg-black/30" />

        {/* 3 Rows of scrolling posters */}
        <div className="flex flex-col justify-center h-full gap-4 sm:gap-6 scale-110 -rotate-2 origin-center">
          {/* Row 1: Slow left scroll */}
          <PosterRow posters={POSTER_ROWS[0]} direction="left" speed="slow" rowIndex={0} />

          {/* Row 2: Medium right scroll */}
          <PosterRow posters={POSTER_ROWS[1]} direction="right" speed="medium" rowIndex={1} />

          {/* Row 3: Slow left scroll */}
          <PosterRow posters={POSTER_ROWS[2]} direction="left" speed="medium" rowIndex={2} />
        </div>

        {/* Ambient glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      {/* 📝 HERO CONTENT */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
        {/* Premium badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl mb-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-default group"
          role="status"
          aria-label="Service tagline"
        >
          <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span className="text-sm font-semibold text-amber-50/90 tracking-wide">
            Find movies that match your mood
          </span>
        </div>

        {/* Headline with sophisticated typography */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.1]">
          <span className="block text-white drop-shadow-[0_0_40px_rgba(0,0,0,0.8)] mb-2">
            Stop Scrolling.
          </span>
          <span className="block bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_60px_rgba(168,85,247,0.4)]">
            Start Feeling.
          </span>
        </h1>

        {/* Value proposition */}
        <p className="text-lg sm:text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
          Like Spotify for movies. Discover films based on your{' '}
          <span className="text-white font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
            vibe, emotion, and taste
          </span>
          —not just what&apos;s trending.
        </p>

        {/* Error message */}
        {authError && (
          <div
            className="max-w-md mx-auto mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm"
            role="alert"
          >
            {authError}
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-12">
          {/* Primary CTA */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="group relative w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-black font-bold text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_80px_-10px_rgba(255,255,255,0.6)] transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            aria-label="Sign in with Google"
          >
            <span className="flex items-center justify-center gap-3">
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <img
                    src={googleSvg}
                    alt=""
                    className="w-5 h-5"
                    loading="eager"
                  />
                  <span>Get Started — It&apos;s Free</span>
                </>
              )}
            </span>
          </button>

          {/* Secondary CTA */}
          <button
            onClick={scrollToHowItWorks}
            className="group w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white font-bold text-lg hover:bg-white/20 hover:border-white/20 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            aria-label="Learn how it works"
          >
            <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>How It Works</span>
          </button>
        </div>

        {/* Trust signals */}
        <div
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/50 font-medium"
          role="list"
          aria-label="Platform benefits"
        >
          <span className="flex items-center gap-2" role="listitem">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Always Free
          </span>
          <span className="flex items-center gap-2" role="listitem">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            No Ads
          </span>
          <span className="flex items-center gap-2" role="listitem">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Privacy First
          </span>
        </div>
      </div>

      {/* Scroll indicator (subtle) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 animate-bounce" aria-hidden="true">
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-white/40 rounded-full" />
        </div>
      </div>
    </section>
  )
}

/**
 * PosterRow Component - Individual scrolling row
 */
function PosterRow({ posters, direction, speed, rowIndex }) {
  const animationClass =
    direction === 'left'
      ? speed === 'slow'
        ? 'animate-scroll-left-slow'
        : 'animate-scroll-left'
      : speed === 'slow'
      ? 'animate-scroll-right-slow'
      : 'animate-scroll-right'

  return (
    <div className={`flex gap-4 sm:gap-6 ${animationClass} w-[200%]`}>
      {[...posters, ...posters, ...posters].map((path, i) => (
        <div
          key={`poster-${rowIndex}-${i}`}
          className="relative w-40 h-60 sm:w-48 sm:h-72 shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10 group"
        >
          <img
            src={`https://image.tmdb.org/t/p/w500${path}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            alt=""
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
          {/* Subtle shine effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      ))}
    </div>
  )
}
