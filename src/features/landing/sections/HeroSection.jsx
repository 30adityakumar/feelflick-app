// src/features/landing/sections/HeroSection.jsx
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { Star, Sparkles, ChevronDown } from 'lucide-react'
import googleSvg from '@/assets/icons/google.svg'

/**
 * 🎬 HERO SECTION
 * 
 * Plex-inspired cinematic experience with Chexy-style conversion focus
 * 
 * Features:
 * - Parallax movie backdrop
 * - Purple/Pink gradient headline
 * - Inline Google auth
 * - Social proof (rating)
 * - Smooth scroll indicator
 * - Fully responsive
 */
export default function HeroSection({ showInlineAuth, onAuthOpen, onAuthClose }) {
  const [scrollY, setScrollY] = useState(0)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const heroRef = useRef(null)

  // 🎬 Parallax Effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 🔐 Google Sign In
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

  // Calculate parallax transform
  const parallaxTransform = `translateY(${scrollY * 0.5}px)`
  const fadeOpacity = Math.max(1 - scrollY / 400, 0)

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        // Account for TopNav height
        paddingTop: 'var(--topnav-h, 72px)',
      }}
    >
      {/* 
        🎨 BACKGROUND LAYER
        Cinematic movie backdrop with parallax
      */}
      <div
        className="absolute inset-0 z-0"
        style={{ transform: parallaxTransform }}
      >
        {/* Movie Backdrop Image */}
        <div className="absolute inset-0">
          <img
            src="https://image.tmdb.org/t/p/original/mSDsSDwaP3E7dEfUPWy4J0djt4O.jpg"
            alt="Cinematic backdrop"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        {/* Dark Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* 
        📝 CONTENT LAYER
        Headline, CTA, social proof
      */}
      <div
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        style={{ opacity: fadeOpacity }}
      >
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          
          {/* 🏷️ PILOT BADGE */}
          <div className="flex justify-center animate-fade-in">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm font-medium backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              Early Access - Help Shape FeelFlick
            </span>
          </div>

          {/* 🎯 MAIN HEADLINE */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] animate-fade-in-up">
            <span className="block bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Stop Scrolling.
            </span>
            <span className="block text-white mt-2">
              Start Watching.
            </span>
          </h1>

          {/* 💬 SUBHEADLINE */}
          <p className="text-lg sm:text-xl md:text-2xl text-white/80 leading-relaxed max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
            Find movies you'll love in <span className="text-purple-400 font-bold">60 seconds</span>
            <br className="hidden sm:block" />
            based on your taste and how you feel
          </p>

          {/* 
            🎬 CTA SECTION
            Shows either:
            - Sign in buttons (default)
            - Inline auth modal (when showInlineAuth = true)
          */}
          {!showInlineAuth ? (
            // Default: Primary CTA
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-400">
              <button
                onClick={handleGoogleSignIn}
                disabled={isAuthenticating}
                className="group relative w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <img src={googleSvg} alt="Google" className="h-5 w-5" />
                  {isAuthenticating ? 'Signing in...' : 'Get Started Free'}
                </span>
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              </button>

              <button
                onClick={onAuthOpen}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-lg hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Learn More
              </button>
            </div>
          ) : (
            // Inline Auth Modal
            <div className="animate-fade-in-up animation-delay-400">
              <InlineAuthModal onClose={onAuthClose} />
            </div>
          )}

          {/* ⭐ SOCIAL PROOF */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-white/60 animate-fade-in-up animation-delay-600">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-purple-500 text-purple-500" />
                ))}
              </div>
              <span className="font-medium">4.8/5</span>
            </div>
            <span className="hidden sm:block text-white/30">•</span>
            <span>Rated by 10,000+ movie lovers</span>
          </div>

          {/* 📜 TRUST SIGNALS */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 animate-fade-in-up animation-delay-800">
            <span>✓ Free forever</span>
            <span>✓ No credit card required</span>
            <span>✓ Privacy-first</span>
          </div>
        </div>
      </div>

      {/* 
        👇 SCROLL INDICATOR
        Subtle chevron that fades out on scroll
      */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce"
        style={{ opacity: Math.max(1 - scrollY / 200, 0) }}
      >
        <ChevronDown className="h-8 w-8 text-white/40" />
      </div>
    </section>
  )
}

/**
 * 🔐 INLINE AUTH MODAL
 * Shown when user clicks "Learn More" or "Get Started"
 */
function InlineAuthModal({ onClose }) {
  const [isAuthenticating, setIsAuthenticating] = useState(false)

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

  return (
    <div className="max-w-md mx-auto p-6 sm:p-8 rounded-2xl bg-neutral-900/95 backdrop-blur-xl border border-white/10 shadow-2xl">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        aria-label="Close"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Modal Content */}
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-2">
            Start Your Journey
          </h3>
          <p className="text-white/70 text-sm">
            Sign in to discover movies you'll love
          </p>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isAuthenticating}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <img src={googleSvg} alt="Google" className="h-5 w-5" />
          <span className="text-gray-900 font-semibold">
            {isAuthenticating ? 'Signing in...' : 'Continue with Google'}
          </span>
        </button>

        {/* Trust Signals */}
        <div className="pt-4 border-t border-white/10 space-y-2 text-xs text-white/60 text-center">
          <p>✓ Free forever, no credit card required</p>
          <p>✓ We never sell your data</p>
        </div>
      </div>
    </div>
  )
}
