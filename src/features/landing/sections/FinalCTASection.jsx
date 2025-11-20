// src/features/landing/sections/FinalCTASection.jsx
import { useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import googleSvg from '@/assets/icons/google.svg'

export default function FinalCTASection({ onAuthOpen }) {
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
    <section className="relative pt-10 pb-14 sm:pt-16 sm:pb-20 bg-gradient-to-b from-black via-neutral-950 to-black overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* CTA Card */}
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm font-medium backdrop-blur-sm shadow-sm">
              <Sparkles className="h-4 w-4" />
              Join 10,000+ Movie Lovers
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
            <span className="block text-white mb-2">
              Ready to Stop Scrolling?
            </span>
            <span className="block bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Start Watching Tonight.
            </span>
          </h2>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl md:text-2xl text-white/70 leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-10">
            Get personalized movie recommendations in{' '}
            <span className="text-purple-400 font-bold">60 seconds</span>.
            <br className="hidden sm:block" />
            No credit card. No commitment. Just movies you'll love.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            {/* Primary CTA */}
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
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
            </button>
            {/* Secondary CTA */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-lg hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Learn More
            </button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/60 mb-8">
            <TrustBadge icon={<Check className="h-4 w-4" />} text="Free forever" />
            <TrustBadge icon={<Check className="h-4 w-4" />} text="No credit card required" />
            <TrustBadge icon={<Check className="h-4 w-4" />} text="Privacy-first" />
          </div>
        </div>
      </div>
    </section>
  )
}

/* Trust Badge row */
function TrustBadge({ icon, text }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-purple-400">
        {icon}
      </div>
      <span className="font-medium">{text}</span>
    </div>
  )
}
