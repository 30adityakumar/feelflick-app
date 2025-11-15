// src/features/landing/components/LandingHero.jsx
import { Link } from 'react-router-dom'

export default function LandingHero() {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Video Background with Fallback */}
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/logo.png"
          className="h-full w-full object-cover"
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>
        
        {/* Fallback gradient if video fails */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-neutral-900 to-black" />
      </div>

      {/* Overlay Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-start justify-center px-4 sm:px-6 md:px-8 lg:px-12 max-w-7xl mx-auto">
        <div className="max-w-3xl">
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight mb-6">
            <span className="text-white">Discover movies that </span>
            <span className="bg-gradient-to-r from-[#FF9245] via-[#EB423B] to-[#E03C9E] bg-clip-text text-transparent">
              match your vibe
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl md:text-2xl text-white/80 mb-8 max-w-2xl leading-relaxed">
            Your personal movie companion. Build watchlists, track what you've watched, and find your next favorite film.
          </p>

          {/* CTA */}
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF9245] to-[#EB423B] px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-bold text-white shadow-2xl transition-all hover:shadow-[0_0_40px_rgba(255,146,69,0.4)] hover:scale-105 active:scale-95"
          >
            Get Started
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>

          {/* Features */}
          <div className="mt-12 flex flex-wrap gap-6 text-sm sm:text-base text-white/70">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-[#FF9245]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Free forever</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-[#FF9245]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-[#FF9245]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Get started in seconds</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:block">
        <div className="flex flex-col items-center gap-2 text-white/50 animate-bounce">
          <span className="text-xs font-medium uppercase tracking-wider">Scroll</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  )
}
