// src/features/landing/sections/FinalCTASection.jsx
import { useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { ArrowRight, Check, Sparkles, Shield, Zap, Heart } from 'lucide-react'
import googleSvg from '@/assets/icons/google.svg'

export default function FinalCTASection() {
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section 
      className="relative pt-16 pb-20 sm:pt-20 sm:pb-24 bg-gradient-to-b from-black via-neutral-950 to-black overflow-hidden"
      aria-labelledby="final-cta-heading"
    >
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* CTA Card */}
        <div className="max-w-4xl mx-auto text-center">
          {/* Social Proof Badge */}
          <div className="flex justify-center mb-6 sm:mb-8 animate-fade-in-down">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm font-semibold backdrop-blur-sm shadow-lg hover:scale-105 transition-transform duration-300">
              <Sparkles className="h-4 w-4 animate-pulse" />
              Join 10,000+ Movie Lovers
            </span>
          </div>

          {/* Headline */}
          <h2 
            id="final-cta-heading"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6 sm:mb-8"
          >
            <span className="block text-white mb-2 animate-fade-in-up">
              Ready to Stop Scrolling?
            </span>
            <span className="block bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-clip-text text-transparent animate-fade-in-up delay-100">
              Start Watching Tonight.
            </span>
          </h2>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl md:text-2xl text-white/70 leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-10 px-4 animate-fade-in-up delay-200">
            Get personalized movie recommendations in{' '}
            <span className="text-purple-400 font-bold">60 seconds</span>.
            <br className="hidden sm:block" />
            No credit card. No commitment. Just movies you'll love.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 sm:mb-12 animate-fade-in-up delay-300">
            {/* Primary CTA */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating}
              className="group relative w-full max-w-xs sm:max-w-none sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base sm:text-lg shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden touch-target"
              aria-label={isAuthenticating ? 'Signing you in with Google' : 'Get started free with Google'}
            >
              {/* Shimmer effect */}
              <span 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  animation: 'shimmer 2s ease-in-out infinite',
                  backgroundSize: '200% 100%',
                }}
                aria-hidden="true"
              />
              
              <span className="relative z-10 flex items-center justify-center gap-3">
                {isAuthenticating ? (
                  <>
                    <svg 
                      className="animate-spin h-5 w-5" 
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
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
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                    <span>Get Started Free</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>

              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300" aria-hidden="true" />
            </button>

            {/* Secondary CTA */}
            <button
              onClick={scrollToTop}
              className="w-full max-w-xs sm:max-w-none sm:w-auto px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-base sm:text-lg hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95 touch-target"
              aria-label="Learn more about FeelFlick"
            >
              Learn More
            </button>
          </div>

          {/* Trust Badges */}
          <div 
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-white/60 mb-8 animate-fade-in-up delay-400"
            role="list"
            aria-label="Trust badges"
          >
            <TrustBadge icon={<Check className="h-4 w-4" />} text="Free forever" />
            <TrustBadge icon={<Shield className="h-4 w-4" />} text="Privacy-first" />
            <TrustBadge icon={<Zap className="h-4 w-4" />} text="No credit card" />
            <TrustBadge icon={<Heart className="h-4 w-4" />} text="No commitment" />
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Trust badge component
 */
function TrustBadge({ icon, text }) {
  return (
    <div 
      className="flex items-center gap-2 hover:text-white transition-colors duration-200"
      role="listitem"
    >
      <div className="text-purple-400">
        {icon}
      </div>
      <span className="font-medium">{text}</span>
    </div>
  )
}

/**
 * Stat component
 */
function Stat({ number, label }) {
  return (
    <div className="text-center" role="listitem">
      <div className="text-2xl sm:text-3xl font-black text-white mb-1">
        {number}
      </div>
      <div className="text-xs sm:text-sm text-white/50 font-medium">
        {label}
      </div>
    </div>
  )
}