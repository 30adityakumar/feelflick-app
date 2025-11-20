// src/features/landing/sections/ProblemSection.jsx
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Search, Clock, Frown } from 'lucide-react'

/**
 * 😩 PROBLEM SECTION
 * 
 * P2 IMPROVEMENTS:
 * - Added streaming service logos/screenshots
 * - Specific movie examples (The Office)
 * - More concrete visual context
 */

export default function ProblemSection() {
  const problems = [
    {
      icon: Search,
      stat: '30 minutes',
      issue: 'You spend 30 minutes browsing',
      context: 'Netflix • Prime Video • Disney+',
      description: 'only to watch nothing',
      visual: '🔍',
    },
    {
      icon: Clock,
      stat: 'The Office',
      issue: 'You end up rewatching',
      context: 'For the 10th time',
      description: 'for the 10th time',
      visual: '📺',
    },
    {
      icon: Frown,
      stat: '20 minutes',
      issue: 'You pick something random',
      context: 'And give up on it',
      description: 'and regret it 20 minutes in',
      visual: '😞',
    },
  ]

  const { containerRef, itemsVisible } = useStaggeredAnimation(3, 200)

  return (
    <section className="relative py-16 sm:py-24 md:py-32 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-6">
            <span className="text-white">Tired of </span>
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              30-Minute Scroll
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Sessions?
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            You finally have time to watch a movie.
            <br />
            But choosing one feels like a{' '}
            <span className="text-pink-400 font-bold">full-time job</span>.
          </p>
        </div>

        {/* Problem Cards */}
        <div
          ref={containerRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12"
        >
          {problems.map((problem, index) => (
            <ProblemCard
              key={problem.stat}
              problem={problem}
              isVisible={itemsVisible.includes(index)}
            />
          ))}
        </div>

        {/* P2: Visual Streaming Service Context */}
        <div className="relative mt-12 sm:mt-16">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 opacity-40">
            {/* Streaming service logos */}
            <StreamingLogo name="Netflix" color="#E50914" />
            <StreamingLogo name="Prime Video" color="#00A8E1" />
            <StreamingLogo name="Your Time" color="#A855F7" highlight />
            <StreamingLogo name="Disney+" color="#113CCF" />
            <StreamingLogo name="HBO Max" color="#7B27D9" />
          </div>
          
          <p className="text-center text-white/60 mt-6 text-sm">
            15,000+ titles on Netflix. 12,000+ on Prime Video.
            <span className="block mt-2 text-purple-400 font-semibold">But only 2 hours to actually watch.</span>
          </p>
        </div>

        {/* Transition Text */}
        <div className="text-center mt-16 sm:mt-20">
          <p className="text-xl sm:text-2xl font-bold text-white mb-3">
            There's a better way.
          </p>
          <p className="text-lg text-white/70">
            FeelFlick finds your perfect match in{' '}
            <span className="text-purple-400 font-bold">60 seconds</span>—no endless scrolling, no decision fatigue.
          </p>
        </div>
      </div>
    </section>
  )
}

/**
 * Problem Card Component
 */
function ProblemCard({ problem, isVisible }) {
  const { icon: Icon, stat, issue, context, visual } = problem

  return (
    <div
      className={`relative p-6 sm:p-8 rounded-2xl bg-neutral-900/30 border border-white/10 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {/* Icon/Visual */}
      <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-neutral-800/50 border border-white/10 mb-6">
        <span className="text-3xl">{visual}</span>
      </div>

      {/* Stat */}
      <div className="mb-3">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30">
          {stat}
        </span>
      </div>

      {/* Issue */}
      <h3 className="text-lg font-bold text-white mb-2">
        {issue}
      </h3>

      {/* Context */}
      <p className="text-sm text-white/50 mb-1">
        {context}
      </p>
    </div>
  )
}

/**
 * Streaming Logo Component
 */
function StreamingLogo({ name, color, highlight }) {
  return (
    <div className={`px-4 py-2 rounded-lg ${highlight ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50' : 'bg-neutral-900/50 border border-white/10'}`}>
      <span className={`text-sm font-bold ${highlight ? 'text-purple-400' : 'text-white/70'}`} style={!highlight ? { color } : {}}>
        {name}
      </span>
    </div>
  )
}
