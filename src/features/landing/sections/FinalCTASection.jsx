// src/features/landing/sections/FinalCTASection.jsx
import { ArrowRight, Check, Shield, Zap } from 'lucide-react'
import googleSvg from '@/assets/icons/google.svg'
import { useGoogleAuth } from '@/features/landing/utils/useGoogleAuth'

const MOOD_TAGS = [
  { text: 'Nostalgic', top: '15%', left: '7%', rotate: '-6deg', opacity: 0.18, size: 'text-sm' },
  { text: 'Curious', top: '22%', right: '9%', rotate: '4deg', opacity: 0.14, size: 'text-xs' },
  { text: 'Tense', top: '62%', left: '4%', rotate: '2deg', opacity: 0.12, size: 'text-xs' },
  { text: 'Cozy', bottom: '22%', right: '7%', rotate: '-3deg', opacity: 0.18, size: 'text-sm' },
  { text: 'Euphoric', top: '42%', left: '2%', rotate: '7deg', opacity: 0.13, size: 'text-xs' },
  { text: 'Melancholy', bottom: '38%', right: '4%', rotate: '-2deg', opacity: 0.11, size: 'text-xs' },
]

export default function FinalCTASection() {
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth()

  return (
    <section
      className="relative pt-16 pb-20 sm:pt-20 sm:pb-24 bg-gradient-to-b from-black via-neutral-950 to-black overflow-hidden"
      aria-labelledby="final-cta-heading"
    >
      {/* Animated background glows */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl" />

        {/* Floating mood tags */}
        {MOOD_TAGS.map(({ text, rotate, opacity, size, ...pos }) => (
          <span
            key={text}
            className={`absolute ${size} font-medium text-white border border-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm select-none`}
            style={{ ...pos, transform: `rotate(${rotate})`, opacity }}
            aria-hidden="true"
          >
            {text}
          </span>
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">

          {/* Headline */}
          <h2
            id="final-cta-heading"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6 sm:mb-8"
          >
            <span className="block text-white mb-2">Your Next Favorite Film</span>
            <span className="block bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">
              Is Already Out There.
            </span>
          </h2>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl md:text-2xl text-white/70 leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-10 px-4">
            Tell FeelFlick how you feel and get a personalized pick in seconds.
          </p>

          {/* Primary CTA */}
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={signInWithGoogle}
              disabled={isAuthenticating}
              className="group relative w-full max-w-xs sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base sm:text-lg shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden touch-target"
              aria-label={isAuthenticating ? 'Signing you in with Google' : 'Get started free with Google'}
            >
              <span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ animation: 'shimmer 2s ease-in-out infinite', backgroundSize: '200% 100%' }}
                aria-hidden="true"
              />
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
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300" aria-hidden="true" />
            </button>
          </div>

          {/* Quick reassurance */}
          <p className="text-white/35 text-sm font-medium mb-10 sm:mb-12">
            Join in 10 seconds. No credit card.
          </p>

          {/* Trust Badges */}
          <div
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-white/60"
            role="list"
            aria-label="Trust badges"
          >
            <TrustBadge icon={<Check className="h-4 w-4" />} text="Free forever" />
            <TrustBadge icon={<Shield className="h-4 w-4" />} text="Privacy-first" />
            <TrustBadge icon={<Zap className="h-4 w-4" />} text="No credit card" />
          </div>
        </div>
      </div>
    </section>
  )
}

function TrustBadge({ icon, text }) {
  return (
    <div
      className="flex items-center gap-2 hover:text-white transition-colors duration-200"
      role="listitem"
    >
      <div className="text-purple-400">{icon}</div>
      <span className="font-medium">{text}</span>
    </div>
  )
}
