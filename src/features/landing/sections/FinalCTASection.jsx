// src/features/landing/sections/FinalCTASection.jsx
import { ArrowRight, Check, Shield } from 'lucide-react'
import googleSvg from '@/assets/icons/google.svg'
import { useGoogleAuth } from '@/features/landing/utils/useGoogleAuth'

export default function FinalCTASection() {
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth()

  return (
    <section
      className="relative pt-20 pb-24 sm:pt-24 sm:pb-28 bg-black overflow-hidden"
      aria-labelledby="final-cta-heading"
    >
      {/* Subtle top border */}
      <div className="absolute top-0 inset-x-0 h-px bg-white/8" aria-hidden="true" />

      {/* Single centered radial glow — depth without noise */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(168,85,247,0.08) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        {/* Headline */}
        <h2
          id="final-cta-heading"
          className="mb-6 sm:mb-8"
        >
          <span className="block text-lg sm:text-xl text-white/50 font-medium mb-3 tracking-wide">
            Your next favorite film
          </span>
          <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-none text-white">
            is already out there.
          </span>
        </h2>

        {/* Subheadline */}
        <p className="text-base sm:text-lg text-white/45 leading-relaxed max-w-xl mx-auto mb-10 sm:mb-12">
          Tell FeelFlick how you feel and get a personalized pick in seconds.
        </p>

        {/* Primary CTA */}
        <div className="flex items-center justify-center mb-4">
          <button
            onClick={signInWithGoogle}
            disabled={isAuthenticating}
            className="group relative w-full max-w-xs sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base sm:text-lg shadow-xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
            aria-label={isAuthenticating ? 'Signing you in with Google' : 'Get started free with Google'}
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {isAuthenticating ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <img src={googleSvg} alt="" className="h-5 w-5" aria-hidden="true" />
                  <span>Get Started Free</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </span>
          </button>
        </div>

        {/* Quick reassurance */}
        <p className="text-white/30 text-sm font-medium mb-10 sm:mb-12">
          Join in 10 seconds. No credit card.
        </p>

        {/* Trust Badges */}
        <div
          className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-white/35"
          role="list"
          aria-label="Trust badges"
        >
          <TrustBadge icon={<Check className="h-4 w-4" />} text="Free forever" />
          <TrustBadge icon={<Shield className="h-4 w-4" />} text="Privacy-first" />
        </div>
      </div>
    </section>
  )
}

function TrustBadge({ icon, text }) {
  return (
    <div
      className="flex items-center gap-2"
      role="listitem"
    >
      <div className="text-white/40">{icon}</div>
      <span className="font-medium">{text}</span>
    </div>
  )
}
