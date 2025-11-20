// src/features/landing/sections/HeroSection.jsx
import { useState, useEffect } from 'react'
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
    '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', // Godfather
  ],
]

export default function HeroSection() {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  async function handleGoogleSignIn() {
    setIsAuthenticating(true)
    setAuthError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
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
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }

  return (
    <section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black pt-20 pb-12"
      aria-label="Hero section"
    >
      {/* 🎬 Animated poster wall background */}
      <div 
        className="absolute inset-0 z-0 opacity-30 select-none pointer-events-none"
        aria-hidden="true"
      >
        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute inset-0 z-10 bg-black/40" />

        <div className={`flex flex-col justify-center h-full gap-4 sm:gap-6 scale-110 rotate-[-2deg] origin-center ${prefersReducedMotion ? '' : ''}`}>
          {/* Row 1 - Scrolls Left */}
          <div className={`flex gap-4 sm:gap-6 w-[200%] ${prefersReducedMotion ? '' : 'animate-scroll-left'}`}>
            {[...POSTER_ROWS[0], ...POSTER_ROWS[0], ...POSTER_ROWS[0]].map((path, i) => (
              <PosterCard key={`r1-${i}`} path={path} />
            ))}
          </div>

          {/* Row 2 - Scrolls Right */}
          <div className={`flex gap-4 sm:gap-6 w-[200%] ${prefersReducedMotion ? '' : 'animate-scroll-right'}`}>
            {[...POSTER_ROWS[1], ...POSTER_ROWS[1], ...POSTER_ROWS[1]].map((path, i) => (
              <PosterCard key={`r2-${i}`} path={path} />
            ))}
          </div>
        </div>
      </div>

      {/* 📝 Main Content */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <div 
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 sm:mb-8 hover:bg-white/10 transition-colors cursor-default"
          role="status"
          aria-label="Platform tagline"
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 flex-shrink-0" aria-hidden="true" />
          <span className="text-xs sm:text-sm font-medium text-amber-100/90">
            Find movies that match your mood
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 sm:mb-8 leading-[1.1] sm:leading-tight">
          <span className="block text-white drop-shadow-2xl">
            Stop Scrolling.
          </span>
          <span className="block bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-transparent drop-shadow-2xl">
            Start Feeling.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-base sm:text-xl md:text-2xl text-white/70 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-medium px-4 sm:px-0">
          Like Spotify for movies. Discover films based on your{' '}
          <span className="text-white font-bold">vibe, emotion, and taste</span>
          —not just what&apos;s trending.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
          <button
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="group relative w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white text-black font-bold text-sm sm:text-base shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            aria-label={isAuthenticating ? 'Signing in with Google' : 'Get started with Google'}
          >
            <span className="flex items-center justify-center gap-2.5">
              {isAuthenticating ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <img src={googleSvg} alt="" className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                  <span>Get Started — It&apos;s Free</span>
                </>
              )}
            </span>
          </button>

          <button
            onClick={scrollToHowItWorks}
            className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white font-bold text-sm sm:text-base hover:bg-white/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            aria-label="Learn how FeelFlick works"
          >
            <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            <span>How It Works</span>
          </button>
        </div>

        {/* Error Message */}
        {authError && (
          <div 
            className="mb-6 sm:mb-8 flex items-center justify-center gap-2 text-red-400 text-sm"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{authError}</span>
          </div>
        )}

        {/* Trust Signals */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs sm:text-sm text-white/40 font-medium">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Always Free
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            No Ads
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Privacy First
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            100+ Services
          </span>
        </div>
      </div>
    </section>
  )
}

// 🎬 Optimized Poster Card Component
function PosterCard({ path }) {
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  if (hasError) {
    return (
      <div className="relative w-36 sm:w-48 h-52 sm:h-72 shrink-0 rounded-lg sm:rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-neutral-900 flex items-center justify-center">
        <div className="text-white/20 text-xs">Image unavailable</div>
      </div>
    )
  }

  return (
    <div className="relative w-36 sm:w-48 h-52 sm:h-72 shrink-0 rounded-lg sm:rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-neutral-900">
      {!isLoaded && (
        <div className="absolute inset-0 bg-neutral-800 animate-pulse" />
      )}
      <img
        src={`https://image.tmdb.org/t/p/w500${path}`}
        srcSet={`https://image.tmdb.org/t/p/w342${path} 342w, https://image.tmdb.org/t/p/w500${path} 500w`}
        sizes="(max-width: 640px) 144px, 192px"
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        alt=""
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </div>
  )
}
