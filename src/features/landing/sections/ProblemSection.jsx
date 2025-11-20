// src/features/landing/sections/ProblemSection.jsx
import { useScrollAnimation } from '@/features/landing/utils/scrollAnimations'
import { Clock } from 'lucide-react'

/**
 * 🎯 PROBLEM SECTION
 * 
 * Shows the pain point with streaming service logos
 */

export default function ProblemSection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 })

  return (
    <section
      id="problem"
      ref={ref}
      className="relative py-20 sm:py-28 bg-black"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Headline */}
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
            Tired of <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">30-Minute Scroll Sessions?</span>
          </h2>
          
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto">
            You finally have time to watch a movie.<br />
            But choosing one feels like a <span className="text-pink-400 font-bold">full-time job</span>.
          </p>
        </div>

        {/* Stats Grid */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-3 gap-6 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          {/* Netflix */}
          <StatCard
            logo={<NetflixLogo />}
            platform="Netflix"
            count="15,000+"
            label="titles"
          />

          {/* Prime Video */}
          <StatCard
            logo={<PrimeLogo />}
            platform="Prime Video"
            count="12,000+"
            label="titles"
          />

          {/* Your Time */}
          <StatCard
            logo={<Clock className="h-12 w-12 text-blue-400" />}
            platform="Your Time"
            count="2 hours"
            label="to actually watch"
            accent
          />
        </div>

        {/* Solution Teaser */}
        <div className="text-center mt-16">
          <p className="text-xl sm:text-2xl text-white/90 font-semibold mb-2">
            There's a better way.
          </p>
          <p className="text-lg text-white/60">
            FeelFlick finds your perfect match in{' '}
            <span className="text-blue-400 font-bold">60 seconds</span>—no endless scrolling, no decision fatigue.
          </p>
        </div>
      </div>
    </section>
  )
}

/**
 * Stat Card Component
 */
function StatCard({ logo, platform, count, label, accent }) {
  return (
    <div
      className={`relative p-8 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
        accent
          ? 'bg-gradient-to-br from-blue-500/20 to-cyan-400/20 border border-blue-500/30'
          : 'bg-white/5 border border-white/10 hover:border-white/20'
      }`}
    >
      {/* Logo/Icon */}
      <div className="flex justify-center mb-4">{logo}</div>

      {/* Platform Name */}
      <p className="text-sm text-white/60 text-center mb-2">{platform}</p>

      {/* Count */}
      <p className={`text-3xl sm:text-4xl font-black text-center mb-1 ${accent ? 'text-blue-400' : 'text-white'}`}>
        {count}
      </p>

      {/* Label */}
      <p className="text-sm text-white/50 text-center">{label}</p>
    </div>
  )
}

/**
 * Logo Components (Simplified SVG paths)
 */
function NetflixLogo() {
  return (
    <svg className="h-12 w-12 text-white/50" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 4.854.398-2.8-7.924-5.923-16.747-8.487-24zm8.489 0v9.63L18.6 22.951c-.043-7.86-.004-15.913.002-22.95zM5.398 1.05V24c1.873-.225 2.81-.312 4.715-.398v-9.22z"/>
    </svg>
  )
}

function PrimeLogo() {
  return (
    <svg className="h-12 w-12 text-white/50" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.398 6c-.072.036-1.124.52-1.124 1.642v8.716c0 1.122 1.052 1.606 1.124 1.642v.73c-1.444-.155-3.398-.845-3.398-2.372V7.642C2 6.115 3.954 5.425 5.398 5.27zm13.204 0c.072.036 1.124.52 1.124 1.642v8.716c0 1.122-1.052 1.606-1.124 1.642v.73c1.444-.155 3.398-.845 3.398-2.372V7.642C22 6.115 20.046 5.425 18.602 5.27zM12 8l-4 4 4 4 4-4z"/>
    </svg>
  )
}
