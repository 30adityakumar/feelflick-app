// src/features/landing/sections/HeroSection.jsx
import { useState, useMemo, useEffect, useRef } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { Sparkles, PlayCircle, ArrowRight } from 'lucide-react'
import googleSvg from '@/assets/icons/google.svg'

/**
 * Hero Section - First impression is everything
 * 
 * Features:
 * - Cinematic animated poster wall background
 * - Smooth parallax effects
 * - Performance optimized (memoized arrays, lazy loading)
 * - Accessibility focused (proper ARIA labels, keyboard nav)
 * - Mobile-first responsive design
 */

// 🎬 Curated high-quality posters (TMDB paths)
// Chosen for visual diversity and iconic recognition
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

/**
 * Memoized poster rows to prevent recreation on every render
 * Triples each row for seamless infinite scroll effect
 */
function usePosterRows() {
  return useMemo(
    () => [
      [...POSTER_ROWS[0], ...POSTER_ROWS[0], ...POSTER_ROWS[0]],
      [...POSTER_ROWS[1], ...POSTER_ROWS[1], ...POSTER_ROWS[1]],
    ],
    [],
  )
}

/**
 * Single poster tile with robust error handling and loading states
 */
function PosterTile({ path, index }) {
  const [loadState, setLoadState] = useState('loading')
  const imgRef = useRef(null)

  useEffect(() => {
    if (!path || !imgRef.current) return

    // Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && loadState === 'loading') {
            const img = entry.target
            img.src = img.dataset.src
          }
        })
      },
      { rootMargin: '50px' }
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
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const contentRef = useRef(null)
  const [row1, row2] = usePosterRows()

  // 🎬 Smooth parallax effect on scroll
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

  /**
   * Google OAuth sign-in handler
   */
  async function handleGoogleSignIn() {
    if (isAuthenticating) return
    setIsAuthenticating(true)

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
      alert('Sign in failed. Please try again.')
    } finally {
      setIsAuthenticating(false)
    }
  }

  /**
   * Smooth scroll to How It Works section
   */
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

  // Subtle parallax transform (less aggressive for smoothness)
  const parallaxY = scrollY * 0.3

  return (
    <section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black pt-20"
      aria-labelledby="hero-heading"
    >
      {/* 🎬 Animated poster wall background */}
      <div 
        className="absolute inset-0 z-0 opacity-30 select-none pointer-events-none"
        aria-hidden="true"
      >
        {/* Multi-layer gradients for depth */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black via-black/40 to-black" />
        <div className="absolute inset-0 z-10 bg-gradient-to-tr from-purple-900/40 via-transparent to-amber-700/20" />
        <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]" />

        <div className="flex flex-col justify-center h-full gap-6 scale-[1.08] rotate-[-2deg] origin-center">
          {/* Row 1 - Scrolls left */}
          <div className="flex gap-4 sm:gap-5 md:gap-6 animate-scroll-left w-[220%]">
            {row1.map((path, i) => (
              <PosterTile key={`r1-${i}`} path={path} index={i} />
            ))}
          </div>

          {/* Row 2 - Scrolls right */}
          <div className="flex gap-4 sm:gap-5 md:gap-6 animate-scroll-right w-[220%]">
            {row2.map((path, i) => (
              <PosterTile key={`r2-${i}`} path={path} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* 📝 Hero content with subtle parallax */}
      <div
        ref={contentRef}
        className="relative z-20 max-w-5xl mx-auto px-4 text-center"
        style={{ transform: `translateY(${parallaxY}px)` }}
      >
        {/* Badge */}
        <div 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-default touch-target"
          role="status"
          aria-live="polite"
        >
          <Sparkles className="w-4 h-4 text-amber-400" aria-hidden="true" />
          <span className="text-sm font-medium text-amber-100/90">
            Find movies that match your mood
          </span>
        </div>

        {/* Headline */}
        <h1 
          id="hero-heading"
          className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1]"
        >
          <span className="block text-white drop-shadow-2xl">
            Stop Scrolling.
          </span>
          <span className="block bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-transparent drop-shadow-2xl pb-2">
            Start Watching.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-2xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          Discover films based on your{' '}
          <span className="text-white font-bold">vibe, emotion, and taste</span>
          —not just what's trending.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          {/* Primary CTA */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="group relative w-full max-w-xs sm:max-w-none sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-white text-black font-bold text-base sm:text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)] transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden touch-target"
            aria-label={isAuthenticating ? 'Signing in with Google' : 'Get started with Google sign in'}
          >
            {/* Shimmer effect on hover */}
            <span 
              className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                animation: 'shimmer 2s ease-in-out infinite',
                backgroundSize: '200% 100%',
              }}
              aria-hidden="true"
            />
            
            <span className="relative flex items-center justify-center gap-3">
              {isAuthenticating ? (
                <>
                  <svg 
                    className="animate-spin h-5 w-5" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                      fill="none"
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
                  <img 
                    src={googleSvg} 
                    alt="" 
                    className="w-5 h-5"
                    aria-hidden="true"
                  />
                  <span>Get Started — It's Free</span>
                </>
              )}
            </span>
          </button>

          {/* Secondary CTA */}
          <button
            onClick={scrollToHowItWorks}
            className="w-full max-w-xs sm:max-w-none sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white font-bold text-base sm:text-lg hover:bg-white/20 hover:border-white/20 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 touch-target"
            aria-label="Learn how FeelFlick works"
          >
            <PlayCircle className="w-5 h-5" aria-hidden="true" />
            <span>How It Works</span>
          </button>
        </div>

        {/* Trust signals */}
        <div 
          className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-white/40 font-medium"
          role="list"
          aria-label="Trust badges"
        >
          <span className="hover:text-white/60 transition-colors" role="listitem">✓ Always Free</span>
          <span className="hover:text-white/60 transition-colors" role="listitem">✓ No Ads</span>
          <span className="hover:text-white/60 transition-colors" role="listitem">✓ Privacy First</span>
        </div>
      </div>

      {/* Scroll indicator (optional, shows on desktop) */}
      <button
        onClick={scrollToHowItWorks}
        className="hidden lg:block absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-white/40 hover:text-white/60 transition-colors animate-bounce touch-target"
        aria-label="Scroll to learn more"
      >
        <ArrowRight className="w-6 h-6 rotate-90" />
      </button>
    </section>
  )
}