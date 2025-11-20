// src/features/landing/sections/HeroSection.jsx
import { useState } from 'react'
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

export default function HeroSection() {
  const [isAuthenticating, setIsAuthenticating] = useState(false)

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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black pt-20 sm:pt-24">
      {/* 🎬 Animated poster wall */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Base gradient + vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.35),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(59,130,246,0.25),_transparent_55%)] mix-blend-screen opacity-70" />

        {/* Poster rows (hidden on very small screens for clarity) */}
        <div className="hidden xs:block absolute inset-0">
          <div className="flex flex-col justify-center h-full gap-5 sm:gap-6 scale-110 sm:scale-125 lg:scale-110 rotate-[-2deg] origin-center">
            {/* Row 1 */}
            <div className="flex gap-4 sm:gap-6 animate-scroll-left w-[240%] sm:w-[200%]">
              {[...POSTER_ROWS[0], ...POSTER_ROWS[0]].map((path, i) => (
                <div
                  key={`r1-${i}`}
                  className="relative w-28 h-40 sm:w-36 sm:h-52 lg:w-48 lg:h-72 shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-neutral-900/40"
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w500${path}`}
                    className="w-full h-full object-cover"
                    alt=""
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70" />
                </div>
              ))}
            </div>

            {/* Row 2 */}
            <div className="flex gap-4 sm:gap-6 animate-scroll-right w-[240%] sm:w-[200%]">
              {[...POSTER_ROWS[1], ...POSTER_ROWS[1]].map((path, i) => (
                <div
                  key={`r2-${i}`}
                  className="relative w-28 h-40 sm:w-36 sm:h-52 lg:w-48 lg:h-72 shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-neutral-900/40"
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w500${path}`}
                    className="w-full h-full object-cover"
                    alt=""
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 📝 Content */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/15 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors cursor-default">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs sm:text-sm font-medium text-amber-100/90">
            Find movies that match your mood
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 sm:mb-8 leading-tight">
          <span className="block text-white drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
            Stop Scrolling.
          </span>
          <span className="block bg-gradient-to-r from-purple-400 via-pink-500 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_20px_60px_rgba(236,72,153,0.7)] pt-1">
            Start Feeling.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-base sm:text-lg md:text-2xl text-white/70 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-medium">
          Like Spotify for movies. Discover films based on your{' '}
          <span className="text-white font-semibold">vibe, emotion, and taste</span>
          —not just what&apos;s trending.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="group relative w-full sm:w-auto px-7 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-white text-black font-semibold sm:font-bold text-base sm:text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)] transition-all duration-300 hover:scale-[1.03] active:scale-95 disabled:opacity-80 disabled:cursor-not-allowed"
            aria-busy={isAuthenticating}
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
            type="button"
            onClick={scrollToHowItWorks}
            className="w-full sm:w-auto px-7 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/15 text-white font-semibold sm:font-bold text-base sm:text-lg hover:bg-white/15 transition-all duration-300 hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-5 h-5" />
            <span>How It Works</span>
          </button>
        </div>

        {/* Trust row (100+ Services removed) */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs sm:text-sm text-white/45 font-medium">
          <span>✓ Always Free</span>
          <span>✓ No Ads</span>
          <span>✓ Privacy First</span>
        </div>
      </div>
    </section>
  )
}
