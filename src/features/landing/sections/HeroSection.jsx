// src/features/landing/sections/HeroSection.jsx
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { Star, Sparkles, ChevronDown } from 'lucide-react'
import googleSvg from '@/assets/icons/google.svg'

/**
 * 🎬 HERO SECTION
 * 
 * Cinematic parallax hero with movie backdrop rotation
 */

// Movie backdrop URLs from TMDB
const backdrops = [
  'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg', // Dune
  'https://image.tmdb.org/t/p/original/mSDsSDwaP3E7dEfUPWy4J0djt4O.jpg', // Blade Runner 2049
  'https://image.tmdb.org/t/p/original/vL5LR6WdxWPjLPFRLe133jXWsh5.jpg', // Parasite
]

export default function HeroSection({ showInlineAuth, onAuthOpen, onAuthClose }) {
  const [scrollY, setScrollY] = useState(0)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [backdropIndex, setBackdropIndex] = useState(0)
  const heroRef = useRef(null)

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-rotate backdrops every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBackdropIndex((prev) => (prev + 1) % backdrops.length)
    }, 5000)
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
      setIsAuthenticating(false)
    }
  }

  const parallaxTransform = `translateY(${scrollY * 0.5}px)`
  const fadeOpacity = Math.max(1 - scrollY / 400, 0)

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* CINEMATIC MOVIE BACKDROP */}
      <div
        className="absolute inset-0 z-0"
        style={{ transform: parallaxTransform }}
      >
        {backdrops.map((src, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: i === backdropIndex ? 1 : 0,
            }}
          />
        ))}
        
        {/* Dark gradient overlays for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* CONTENT */}
      <div
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        style={{ opacity: fadeOpacity }}
      >
        {/* Beta Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6 sm:mb-8">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white/90">Early Access - Help Shape FeelFlick</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-tight mb-6">
          <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Stop Scrolling.
          </span>
          <br />
          <span className="text-white">Start Watching.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-8">
          Find movies you'll love in <span className="font-bold text-blue-400">60 seconds</span><br className="hidden sm:block" />
          based on your taste and how you feel
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src={googleSvg} alt="Google" className="w-5 h-5" />
            <span>{isAuthenticating ? 'Signing in...' : 'Get Started Free'}</span>
          </button>

          <button
            onClick={() => {
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold text-lg hover:bg-white/20 transition-all duration-300"
          >
            <span>Learn More</span>
          </button>
        </div>

        {/* Social Proof */}
        <div className="flex items-center justify-center gap-6 text-sm text-white/60">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-purple-400 fill-purple-400" />
              ))}
            </div>
            <span className="font-semibold text-white">4.8/5</span>
          </div>
          <span>•</span>
          <span>Rated by 10,000+ movie lovers</span>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Free forever</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Privacy-first</span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce"
        style={{ opacity: Math.max(1 - scrollY / 200, 0) }}
      >
        <ChevronDown className="h-8 w-8 text-white/40" />
      </div>
    </section>
  )
}
