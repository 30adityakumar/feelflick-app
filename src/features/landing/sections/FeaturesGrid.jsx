// src/features/landing/sections/FeaturesGrid.jsx
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Sparkles, Tv2, Heart, TrendingUp, Lock, Zap } from 'lucide-react'

/**
 * 💎 FEATURES GRID SECTION
 * 
 * Plex-inspired feature showcase + Chexy-style quantification
 * 
 * Shows 3 primary features:
 * 1. AI-Powered Discovery (92% accuracy)
 * 2. 100+ Streaming Services (comprehensive)
 * 3. Never Forget (unlimited watchlists)
 * 
 * Each feature has:
 * - Icon (visual recognition)
 * - Metric (quantified benefit)
 * - Title (capability)
 * - Description (how it helps)
 */
export default function FeaturesGrid() {
  const features = [
  {
    icon: <Sparkles className="h-8 w-8" />,
    metric: '92% Match Accuracy',
    title: 'AI-Powered Discovery',
    description: 'Our algorithm learns your unique taste—not your demographic. Get recommendations that actually match how you feel.',
    gradient: 'from-purple-500 to-purple-600',
    glowColor: 'purple',
  },
  {
    icon: <Tv2 className="h-8 w-8" />,
    metric: '100+ Services Indexed',
    title: 'Find Where to Watch',
    description: 'Netflix, Prime, Disney+, HBO Max, Hulu, and 95+ more. One click shows you exactly where to stream any movie.',
    gradient: 'from-pink-500 to-pink-600',
    glowColor: 'pink',
  },
  {
    icon: <Heart className="h-8 w-8" />,
    metric: 'Unlimited Watchlists',
    title: 'Never Forget a Great Movie',
    description: "Save movies you want to watch, create custom lists, and rate what you've seen. Your personal movie library.",
    gradient: 'from-purple-500 to-pink-500',
    glowColor: 'purple',
  },
]


  // Bonus features (smaller cards)
  const bonusFeatures = [
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: 'Gets Better Over Time',
      description: 'The more you rate, the smarter recommendations become',
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: 'Privacy-First',
      description: 'We never sell your data or share your viewing habits',
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Lightning Fast',
      description: 'Find your perfect movie in under 60 seconds',
    },
  ]

  return (
    <section className="relative py-16 sm:py-24 md:py-32 bg-gradient-to-b from-black via-neutral-950 to-black overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 📝 SECTION HEADER */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 sm:mb-6">
            Why Choose{' '}
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              FeelFlick?
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Smarter recommendations. Faster discovery. Better movies.
          </p>
        </div>

        {/* 🎯 PRIMARY FEATURES GRID */}
        <div
          ref={containerRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12"
        >
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              feature={feature}
              isVisible={itemsVisible.includes(index)}
            />
          ))}
        </div>

        {/* 🌟 BONUS FEATURES (smaller cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {bonusFeatures.map((feature, index) => (
            <BonusFeatureCard
              key={feature.title}
              feature={feature}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * 🎴 FEATURE CARD (Primary Features)
 * Large card with icon, metric, title, description
 */
function FeatureCard({ feature, isVisible }) {
  const { icon, metric, title, description, gradient, glowColor } = feature

  return (
    <div
      className={`group relative p-6 sm:p-8 rounded-2xl bg-neutral-900/50 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-700 ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      }`}
    >
      {/* Icon with gradient background */}
      <div className="relative mb-6">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl`}>
          {icon}
        </div>
        {/* Glow effect */}
        <div className={`absolute inset-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300`} />
      </div>

      {/* Metric badge */}
      <div className="mb-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r ${gradient} text-white text-xs font-bold shadow-md`}>
          {metric}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-tight">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm sm:text-base text-white/70 leading-relaxed">
        {description}
      </p>

      {/* Hover gradient overlay */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none`} />
    </div>
  )
}

/**
 * 🌟 BONUS FEATURE CARD (Secondary Features)
 * Smaller card with icon, title, description
 */
function BonusFeatureCard({ feature, delay }) {
  const { icon, title, description } = feature

  return (
    <div
      className="group p-4 sm:p-6 rounded-xl bg-neutral-900/30 backdrop-blur-sm border border-white/5 hover:border-purple-500/30 hover:bg-neutral-900/50 transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Icon */}
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 text-purple-400 mb-3 group-hover:bg-purple-500/10 transition-colors duration-300">
        {icon}
      </div>

      {/* Title */}
      <h4 className="text-base sm:text-lg font-bold text-white mb-2 leading-tight">
        {title}
      </h4>

      {/* Description */}
      <p className="text-xs sm:text-sm text-white/60 leading-snug">
        {description}
      </p>
    </div>
  )
}
