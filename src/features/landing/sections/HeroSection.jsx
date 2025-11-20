// src/features/landing/sections/HeroSection.jsx
import { useState, useEffect } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { Sparkles, PlayCircle, ArrowRight } from 'lucide-react'
import googleSvg from '@/assets/icons/google.svg'

// 🎬 Curated high-quality posters (TMDB paths) - Diverse, recognizable, high-contrast
const POSTER_ROWS = [
  // Row 1: Iconic blockbusters (high recognition)
  [
    '/q6y0Go1rZgVoTFZYpK391L0imU.jpg', // Pulp Fiction
    '/gEU2QniL6E77NI6lCU6MxlNBvIx.jpg', // Interstellar
    '/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', // LOTR
    '/kwB7d51AIcyzPOB0Mq5aJEGM4q0.jpg', // Goodfellas
    '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', // Godfather
    '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', // Dark Knight
    '/8kSerJrhr6s0CnjLk8QXX397003.jpg', // Fight Club
  ],
  // Row 2: Visual diversity (color, genre, mood)
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Subtle parallax on mouse move
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20
      const y = (e.clientY / window.innerHeight - 0.5) * 20
      setMousePosition({ x, y })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* 🎬 Cinematic Poster Wall Background */}
      <div 
        className="absolute inset-0 z-0 opacity-25 select-none pointer-events-none"
        style={{
          transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        {/* Vignette overlays for cinematic feel */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        <div className="absolute inset-0 z-10 bg-black/30" />

        {/* Poster Grid */}
        <div className="flex flex-col justify-center h-full gap-6 scale-110 rotate-[-1.5deg] origin-center">
          {/* Row 1 - Scroll Left */}
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

          {/* Row 2 - Scroll Right */}
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

      {/* ✨ Content Layer */}
      <div className="relative z-20 max-w-6xl mx-auto px-6 sm:px-8 text-center pt-24 pb-16 sm:pb-24">
        
        {/* Badge with subtle animation */}
        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-default group">
          <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
          <span className="text-sm font-semibold text-white/90 tracking-wide">
            Find movies that match your mood
          </span>
        </div>

        {/* Hero Headline - Production Typography */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[1.1]">
          <span className="block text-white drop-shadow-[0_8px_32px_rgba(0,0,0,0.8)] mb-2">
            Stop Scrolling.
          </span>
          <span className="block bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_8px_32px_rgba(168,85,247,0.4)] animate-gradient-shift">
            Start Feeling.
          </span>
        </h1>

        {/* Value Prop - Concise & Powerful */}
        <p className="text-lg sm:text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-12 leading-relaxed font-medium px-4">
          Like <span className="text-purple-400 font-bold">Spotify</span> for movies. 
          Discover films based on your{' '}
          <span className="relative inline-block">
            <span className="text-white font-bold">vibe, emotion, and taste</span>
            <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 blur-sm"></span>
          </span>
          —not just what's trending.
        </p>

        {/* CTA Buttons - Production-Grade Hierarchy */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 mb-14">
          {/* Primary CTA - Unmissable */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="group relative w-full sm:w-auto px-10 py-5 rounded-2xl bg-white text-black font-bold text-lg shadow-[0_0_60px_-15px_rgba(255,255,255,0.4)] hover:shadow-[0_0_80px_-10px_rgba(255,255,255,0.6)] transition-all duration-500 hover:scale-[1.02] active:scale-95 overflow-hidden"
          >
            {/* Shine effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            
            <span className="relative flex items-center justify-center gap-3">
              {isAuthenticating ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <img src={googleSvg} alt="Google" className="w-5 h-5" />
                  <span>Get Started — It's Free</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </span>
          </button>

          {/* Secondary CTA - Ghost Style */}
          <button
            onClick={scrollToHowItWorks}
            className="group w-full sm:w-auto px-10 py-5 rounded-2xl bg-white/5 backdrop-blur-md border-2 border-white/10 text-white font-bold text-lg hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>How It Works</span>
          </button>
        </div>

        {/* Trust Badges - Horizontal Pills */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/50 font-medium">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            <span className="text-white/70">Always Free</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            <span className="text-white/70">Privacy First</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <span className="text-white/70">100+ Services</span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator - Subtle */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-white/40 rounded-full animate-scroll-down" />
        </div>
      </div>
    </section>
  )
}
