// src/features/landing/sections/HeroSection.jsx
import { useState, useEffect } from 'react'
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
  const [mounted, setMounted] = useState(false)

  // Trigger animation start after mount to prevent hydration mismatches
  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleGoogleSignIn() {
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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black pt-20">
      {/* 🎬 ANIMATED POSTER WALL BACKGROUND */}
      {/* We use a fixed height/width container to prevent layout shift */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden">
        
        {/* Cinematic Vignette - Crucial for text readability */}
        <div className="absolute inset-0 z-20 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute inset-0 z-20 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
        <div className="absolute inset-0 z-10 bg-black/60" /> {/* General dimmer */}

        {/* The Moving Wall */}
        <div 
          className={`flex flex-col justify-center h-full gap-6 scale-110 rotate-[-2deg] origin-center transition-opacity duration-1000 ${mounted ? 'opacity-40' : 'opacity-0'}`}
        >
          {/* Row 1: Moves Left */}
          <div className="flex gap-6 animate-scroll-left w-[200%] will-change-transform">
            {[...POSTER_ROWS[0], ...POSTER_ROWS[0], ...POSTER_ROWS[0]].map((path, i) => (
              <div
                key={`r1-${i}`}
                className="relative w-32 sm:w-48 h-48 sm:h-72 shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/5 bg-neutral-900"
              >
                <img
                  src={`https://image.tmdb.org/t/p/w500${path}`}
                  className="w-full h-full object-cover"
                  alt=""
                  loading="eager"
                />
              </div>
            ))}
          </div>

          {/* Row 2: Moves Right */}
          <div className="flex gap-6 animate-scroll-right w-[200%] will-change-transform">
            {[...POSTER_ROWS[1], ...POSTER_ROWS[1], ...POSTER_ROWS[1]].map((path, i) => (
              <div
                key={`r2-${i}`}
                className="relative w-32 sm:w-48 h-48 sm:h-72 shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/5 bg-neutral-900"
              >
                <img
                  src={`https://image.tmdb.org/t/p/w500${path}`}
                  className="w-full h-full object-cover"
                  alt=""
                  loading="eager"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 💡 AMBIENT SPOTLIGHT */}
      {/* Creates a subtle glow behind the text to separate it from the posters */}
      <div className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-radial-gradient from-purple-900/20 to-transparent blur-3xl pointer-events-none" />

      {/* 📝 CONTENT LAYER */}
      <div className="relative z-30 max-w-5xl mx-auto px-4 text-center flex flex-col items-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl mb-8 shadow-[0_0_20px_-5px_rgba(245,158,11,0.2)] animate-fade-in-up">
          <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-sm font-medium text-amber-100/90 tracking-wide">
            Find movies that match your mood
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] animate-fade-in-up animation-delay-200">
          <span className="block text-white drop-shadow-2xl">
            Stop Scrolling.
          </span>
          <span className="block bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-transparent drop-shadow-2xl pb-2">
            Start Feeling.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-2xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed font-medium animate-fade-in-up animation-delay-400">
          Like Spotify for movies. Discover films based on your{' '}
          <span className="text-white font-bold">vibe, emotion, and taste</span>
          —not just what&apos;s trending.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full animate-fade-in-up animation-delay-600">
          <button
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="group relative w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-black font-bold text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)] transition-all duration-300 hover:scale-105 active:scale-95"
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
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-white font-bold text-lg hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-5 h-5" />
            <span>How It Works</span>
          </button>
        </div>

        {/* Trust Signals */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-white/40 font-medium animate-fade-in-up animation-delay-800">
          <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-green-500" /> Always Free</span>
          <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-green-500" /> No Ads</span>
          <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-green-500" /> Privacy First</span>
          <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-green-500" /> 100+ Services</span>
        </div>
      </div>
    </section>
  )
}
