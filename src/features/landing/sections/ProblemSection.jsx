// src/features/landing/sections/ProblemSection.jsx
import { useScrollAnimation, useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Clock, Search, Frown } from 'lucide-react'

/**
 * 🎯 PROBLEM SECTION
 * 
 * Chexy-inspired pain point agitation with emotional resonance
 * 
 * Strategy:
 * - Lead with relatable question
 * - Show the math (overwhelm)
 * - Emphasize wasted time
 * - Position FeelFlick as solution
 */
export default function ProblemSection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 })

  return (
    <section
      ref={ref}
      className="relative py-16 sm:py-24 md:py-32 bg-gradient-to-b from-black via-neutral-950 to-black"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8 sm:space-y-12">
          
          {/* 🎯 MAIN HEADLINE - The Hook */}
          <h2
            className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Tired of{' '}
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              30-Minute Scroll Sessions?
            </span>
          </h2>

          {/* 💬 SUBHEADLINE - Relatable pain */}
          <p
            className={`text-lg sm:text-xl md:text-2xl text-white/70 leading-relaxed transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            You finally have time to watch a movie.
            <br className="hidden sm:block" />
            But choosing one feels like a <span className="text-pink-400 font-semibold">full-time job</span>.
          </p>

          {/* 📊 THE MATH - Overwhelming stats */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 py-8 transition-all duration-1000 delay-400 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {/* Netflix */}
            <StatCard
              platform="Netflix"
              count="15,000+"
              label="titles"
              icon={<Search className="h-8 w-8" />}
              delay="delay-[600ms]"
              isVisible={isVisible}
            />

            {/* Prime Video */}
            <StatCard
              platform="Prime Video"
              count="12,000+"
              label="titles"
              icon={<Search className="h-8 w-8" />}
              delay="delay-[800ms]"
              isVisible={isVisible}
            />

            {/* Your Time */}
            <StatCard
              platform="Your Time"
              count="2 hours"
              label="to actually watch"
              icon={<Clock className="h-8 w-8" />}
              accent
              delay="delay-[1000ms]"
              isVisible={isVisible}
            />
          </div>

          {/* 😫 EMOTIONAL PAIN POINTS */}
          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 transition-all duration-1000 delay-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <PainPoint
              icon={<Frown className="h-6 w-6" />}
              text="You spend 30 minutes browsing, only to watch nothing"
            />
            <PainPoint
              icon={<Frown className="h-6 w-6" />}
              text="You end up rewatching The Office for the 10th time"
            />
            <PainPoint
              icon={<Frown className="h-6 w-6" />}
              text="You pick something random and regret it 20 minutes in"
            />
          </div>

          {/* 🎬 SOLUTION TEASER */}
          <div
            className={`pt-8 transition-all duration-1000 delay-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <p className="text-xl sm:text-2xl font-semibold text-white mb-4">
              There's a better way.
            </p>
            <p className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto">
              FeelFlick finds your perfect match in{' '}
              <span className="text-purple-400 font-bold">60 seconds</span>
              —no endless scrolling, no decision fatigue.
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}

/**
 * 📊 STAT CARD COMPONENT
 * Shows overwhelming platform stats
 */
function StatCard({ platform, count, label, icon, accent = false, delay, isVisible }) {
  return (
    <div
      className={`relative group p-6 sm:p-8 rounded-2xl bg-neutral-900/50 backdrop-blur-sm border ${
        accent 
          ? 'border-purple-500/30 bg-purple-500/5' 
          : 'border-white/10'
      } hover:border-purple-500/50 transition-all duration-300 ${delay} ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      {/* Icon */}
      <div className={`flex justify-center mb-4 ${accent ? 'text-purple-400' : 'text-white/40'}`}>
        {icon}
      </div>

      {/* Platform */}
      <div className="text-sm font-medium text-white/60 mb-2">
        {platform}
      </div>

      {/* Count */}
      <div className={`text-3xl sm:text-4xl font-black mb-1 ${
        accent 
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent' 
          : 'text-white'
      }`}>
        {count}
      </div>

      {/* Label */}
      <div className="text-xs sm:text-sm text-white/50">
        {label}
      </div>

      {/* Glow effect on hover */}
      {accent && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
      )}
    </div>
  )
}

/**
 * 😫 PAIN POINT COMPONENT
 * Individual frustration point
 */
function PainPoint({ icon, text }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-neutral-900/30 border border-white/5">
      <div className="flex-shrink-0 text-pink-400 mt-0.5">
        {icon}
      </div>
      <p className="text-sm sm:text-base text-white/70 leading-snug text-left">
        {text}
      </p>
    </div>
  )
}
