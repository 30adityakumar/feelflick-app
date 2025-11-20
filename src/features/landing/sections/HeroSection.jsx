// src/features/landing/sections/HeroSection.jsx
import { useState, useEffect } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { Sparkles, TrendingUp, Users, ChevronDown } from 'lucide-react'
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
  const [liveStats, setLiveStats] = useState({ users: 1247, movies: 12453 })

  // Simulated live counter (replace with real data)
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats((prev) => ({
        users: prev.users + Math.floor(Math.random() * 3),
        movies: prev.movies + Math.floor(Math.random() * 5),
      }))
    }, 8000)
    return () => clearInterval(interval)
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
    window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black pt-20">
      {/* 🎬 Enhanced Animated Poster Wall */}
      <div className="absolute inset-0 z-0 opacity-40 select-none pointer-events-none">
        {/* Vignette overlays */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute inset-0 z-10 bg-radial-gradient from-transparent via-black/20 to-black/60" />
        
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-500/10 blur-[120px] rounded-full animate-pulse-slow" />

        <div className="flex flex-col justify-center h-full gap-6 scale-110 rotate-[-2deg] origin-center">
          {/* Row 1 */}
          <div className="flex gap-6 animate-scroll-left w-[200%]">
            {[...POSTER_ROWS[0], ...POSTER_ROWS[0], ...POSTER_ROWS[0]].map((path, i) => (
              <div
                key={`r1-${i}`}
                className="relative w-48 h-72 shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10 hover:scale-105 transition-transform duration-300"
              >
                <img
                  src={`https://image.tmdb.org/t/p/w500${path}`}
                  className="w-full h-full object-cover"
                  alt=""
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          {/* Row 2 */}
          <div className="flex gap-6 animate-scroll-right w-[200%]">
            {[...POSTER_ROWS[1], ...POSTER_ROWS[1], ...POSTER_ROWS[1]].map((path, i) => (
              <div
                key={`r2-${i}`}
                className="relative w-48 h-72 shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10 hover:scale-105 transition-transform duration-300"
              >
                <img
                  src={`https://image.tmdb.org/t/p/w500${path}`}
                  className="w-full h-full object-cover"
                  alt=""
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 📝 Content */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 text-center">
        
        {/* Live Stats Badge (Social Proof) */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors cursor-default group">
          <TrendingUp className="w-4 h-4 text-green-400 animate-pulse" />
          <span className="text-sm font-medium text-white/90">
            <span className="text-green-400 font-bold tabular-nums">{liveStats.users.toLocaleString()}</span> movies discovered today
          </span>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1]">
          <span className="block text-white drop-shadow-2xl animate-fade-in-up">
            Stop Scrolling.
          </span>
          <span className="block bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-transparent drop-shadow-2xl pb-2 animate-fade-in-up animation-delay-150">
            Start Feeling.
          </span>
        </h1>

        {/* Value Prop Subheadline */}
        <p className="text-lg sm:text-2xl text-white/70 max-w-2xl mx-auto mb-4 leading-relaxed font-medium animate-fade-in-up animation-delay-300">
          You want a movie for <span className="text-white font-bold italic">tonight</span>, not in 30 minutes.{' '}
          <span className="text-white/90">FeelFlick finds your perfect match in under 60 seconds.</span>
        </p>

        {/* Spotify Comparison */}
        <p className="text-base sm:text-lg text-white/50 max-w-xl mx-auto mb-10 animate-fade-in-up animation-delay-450">
          Like Spotify for movies—powered by <span className="text-purple-400">vibe, emotion, and taste</span>, not just genres.
        </p>

        {/* Primary CTA */}
        <div className="flex flex-col items-center gap-4 animate-fade-in-up animation-delay-600">
          <button
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="group relative w-full sm:w-auto px-10 py-5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)] hover:shadow-[0_0_60px_-10px_rgba(168,85,247,0.8)] transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span className="flex items-center justify-center gap-3">
              {isAuthenticating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <img src={googleSvg} alt="Google" className="w-5 h-5" />
                  <span>Start Discovering — Free Forever</span>
                </>
              )}
            </span>
          </button>

          {/* Trust Signals Below CTA */}
          <p className="text-sm text-white/40">
            <span className="inline-flex items-center gap-1">
              <Users className="w-4 h-4" />
              Join {liveStats.users.toLocaleString()}+ movie lovers
            </span>
            <span className="mx-2">•</span>
            No credit card needed
          </p>
        </div>

        {/* Secondary Soft CTA - Lower Contrast */}
        <button
          onClick={scrollToHowItWorks}
          className="mt-6 inline-flex items-center gap-2 text-white/60 hover:text-white/90 transition-colors text-sm font-medium group animate-fade-in-up animation-delay-750"
        >
          <span>See how it works</span>
          <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
        </button>

        {/* Feature Pills */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-3 animate-fade-in-up animation-delay-900">
          <FeaturePill icon={<Sparkles className="w-3.5 h-3.5" />}>AI-Powered</FeaturePill>
          <FeaturePill>Always Free</FeaturePill>
          <FeaturePill>No Ads</FeaturePill>
          <FeaturePill>100+ Services</FeaturePill>
          <FeaturePill>Privacy First</FeaturePill>
        </div>
      </div>
    </section>
  )
}

// Feature Pill Component
function FeaturePill({ icon, children }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white/80 hover:border-white/20 transition-all cursor-default">
      {icon}
      <span>{children}</span>
    </div>
  )
}
