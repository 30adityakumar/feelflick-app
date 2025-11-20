// src/features/landing/sections/HeroSection.jsx
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { Sparkles, PlayCircle, ChevronDown, Star } from 'lucide-react'
import googleSvg from '@/assets/icons/google.svg'

// 🎬 CURATED POSTERS - Diverse genres, modern + classic, high recognition
const POSTER_ROWS = [
  // Row 1: Modern Blockbusters + Classics
  [
    '/8kSerJrhr6s0CnjLk8QXX397003.jpg', // Fight Club
    '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', // The Dark Knight
    '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', // Parasite
    '/gEU2QniL6E77NI6lCU6MxlNBvIx.jpg', // Interstellar
    '/q6y0Go1rZgVoTFZYpK391L0imU.jpg', // Pulp Fiction
    '/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', // LOTR
    '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', // The Godfather
    '/q719jXXEzOoYaps6babgKnONONX.jpg', // Your Name
  ],
  // Row 2: Diverse appeal - Animation, Drama, Sci-Fi, International
  [
    '/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', // Spirited Away
    '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', // Amelie
    '/sM33SANp9z6rXW8Itn7NnG1CXEs.jpg', // Zootopia
    '/saHP97rTPS5eLmrLQEcANmKrsFl.jpg', // Forrest Gump
    '/kwB7d51AIcyzPOB0Mq5aJEGM4q0.jpg', // Goodfellas
    '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', // Fight Club (Alt)
    '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', // Inception
    '/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg', // Avengers
  ],
]

export default function HeroSection() {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const heroRef = useRef(null)

  // 🎬 Parallax scroll effect (Apple-style physics)
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect()
        const scrollProgress = Math.max(0, -rect.top / window.innerHeight)
        setScrollY(scrollProgress)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
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
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
    >
      {/* 🎬 ANIMATED POSTER WALL - Multi-layer parallax */}
      <div
        className="absolute inset-0 z-0 select-none pointer-events-none"
        style={{
          opacity: Math.max(0.3 - scrollY * 0.3, 0),
          transform: `scale(${1 + scrollY * 0.1})`,
          filter: `blur(${scrollY * 4}px)`,
        }}
      >
        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
        <div className="absolute inset-0 z-10 bg-black/40" />

        {/* Animated poster rows with parallax */}
        <div
          className="flex flex-col justify-center h-full gap-6 scale-110 rotate-[-2deg] origin-center"
          style={{ transform: `translateY(${scrollY * 20}px)` }}
        >
          {/* Row 1 - Scrolling left */}
          <div className="flex gap-6 animate-scroll-left w-[200%]">
            {[...POSTER_ROWS[0], ...POSTER_ROWS[0], ...POSTER_ROWS[0]].map(
              (path, i) => (
                <div
                  key={`r1-${i}`}
                  className="relative w-48 h-72 shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10 transform transition-transform hover:scale-105 hover:z-20"
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w500${path}`}
                    className="w-full h-full object-cover"
                    alt=""
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                </div>
              ),
            )}
          </div>

          {/* Row 2 - Scrolling right */}
          <div className="flex gap-6 animate-scroll-right w-[200%]">
            {[...POSTER_ROWS[1], ...POSTER_ROWS[1], ...POSTER_ROWS[1]].map(
              (path, i) => (
                <div
                  key={`r2-${i}`}
                  className="relative w-48 h-72 shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10 transform transition-transform hover:scale-105 hover:z-20"
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w500${path}`}
                    className="w-full h-full object-cover"
                    alt=""
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      {/* 📝 HERO CONTENT - Benefit-first messaging */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20 pb-16">
        {/* Eyebrow badge with social proof */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 hover:bg-white/10 hover:border-amber-500/30 transition-all duration-300 cursor-default group"
          style={{
            opacity: Math.max(1 - scrollY * 2, 0),
            transform: `translateY(${-scrollY * 20}px)`,
          }}
        >
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <span className="text-sm font-medium text-amber-100/90">
            Join 10,000+ movie lovers finding their perfect match
          </span>
          <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
        </div>

        {/* Power headline - Benefit-first, emotional hook */}
        <h1
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.1]"
          style={{
            opacity: Math.max(1 - scrollY * 2, 0),
            transform: `translateY(${-scrollY * 30}px)`,
          }}
        >
          <span className="block text-white drop-shadow-2xl">
            Stop Scrolling.
          </span>
          <span className="block bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-transparent drop-shadow-2xl pb-2 animate-gradient bg-[length:200%_auto]">
            Start Feeling.
          </span>
        </h1>

        {/* Value prop - Analogous reference (Spotify) + clear differentiation */}
        <p
          className="text-xl sm:text-2xl md:text-3xl text-white/70 max-w-3xl mx-auto mb-6 leading-relaxed font-medium"
          style={{
            opacity: Math.max(1 - scrollY * 2, 0),
            transform: `translateY(${-scrollY * 40}px)`,
          }}
        >
          Like{' '}
          <span className="text-white font-bold">Spotify for movies</span>.
          Discover films based on your{' '}
          <span className="text-transparent bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text font-bold">
            vibe, emotion, and taste
          </span>
          —not just what&apos;s trending.
        </p>

        {/* Supporting subhead - Pain point addressed */}
        <p
          className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-12 font-medium"
          style={{
            opacity: Math.max(1 - scrollY * 2, 0),
            transform: `translateY(${-scrollY * 50}px)`,
          }}
        >
          Tired of spending 30 minutes finding something to watch?{' '}
          <span className="text-white/70">We get it.</span>
        </p>

        {/* CTA Stack - Primary action front and center */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-12"
          style={{
            opacity: Math.max(1 - scrollY * 2, 0),
            transform: `translateY(${-scrollY * 60}px)`,
          }}
        >
          <button
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="group relative w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-black font-bold text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.6)] transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center gap-3">
              {isAuthenticating ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
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
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white font-bold text-lg hover:bg-white/20 hover:border-white/20 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group"
          >
            <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>How It Works</span>
          </button>
        </div>

        {/* Trust badges - Redesigned for credibility */}
        <div
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-white/40 font-medium"
          style={{
            opacity: Math.max(1 - scrollY * 2, 0),
            transform: `translateY(${-scrollY * 70}px)`,
          }}
        >
          <div className="flex items-center gap-2 group">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="group-hover:text-white/60 transition-colors">
              Always Free
            </span>
          </div>
          <div className="flex items-center gap-2 group">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="group-hover:text-white/60 transition-colors">
              No Ads
            </span>
          </div>
          <div className="flex items-center gap-2 group">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="group-hover:text-white/60 transition-colors">
              Privacy First
            </span>
          </div>
          <div className="flex items-center gap-2 group">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="group-hover:text-white/60 transition-colors">
              100+ Streaming Services
            </span>
          </div>
        </div>
      </div>

      {/* Scroll indicator - Guide users to explore */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/40 animate-bounce cursor-pointer"
        onClick={scrollToHowItWorks}
        style={{
          opacity: Math.max(1 - scrollY * 4, 0),
        }}
      >
        <span className="text-xs font-medium uppercase tracking-wider">
          Discover More
        </span>
        <ChevronDown className="w-6 h-6" />
      </div>
    </section>
  )
}
