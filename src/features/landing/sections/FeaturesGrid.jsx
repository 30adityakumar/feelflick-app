// src/features/landing/sections/FeaturesGrid.jsx
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Sparkles, Tv2, Heart } from 'lucide-react'

/**
 * 💎 FEATURES GRID SECTION
 * 
 * P1 IMPROVEMENTS:
 * - Introduced secondary color system (purple, blue, amber)
 * - Color-coded by feature category
 * - Reduced purple saturation
 */

export default function FeaturesGrid() {
  const features = [
    {
      icon: Sparkles,
      badge: '92% Match Accuracy',
      badgeColor: 'from-purple-500 to-pink-500', // AI/Discovery = Purple
      iconBg: 'from-purple-500 to-pink-500',
      title: 'AI-Powered Discovery',
      description: 'Our algorithm learns your unique taste—not your demographic. Get recommendations that actually match how you feel.',
    },
    {
      icon: Tv2,
      badge: '100+ Services Indexed',
      badgeColor: 'from-blue-500 to-cyan-500', // Streaming = Blue
      iconBg: 'from-blue-500 to-cyan-500',
      title: 'Find Where to Watch',
      description: 'Netflix, Prime, Disney+, HBO Max, Hulu, and 95+ more. One click shows you exactly where to stream any movie.',
    },
    {
      icon: Heart,
      badge: 'Unlimited Watchlists',
      badgeColor: 'from-amber-500 to-orange-500', // Memory/Social = Amber
      iconBg: 'from-amber-500 to-orange-500',
      title: 'Never Forget a Great Movie',
      description: 'Save movies you want to watch, create custom lists, and rate what you've seen. Your personal movie library.',
    },
  ]

  const { containerRef, itemsVisible } = useStaggeredAnimation(features.length, 200)

  return (
    <section id="features" className="relative py-16 sm:py-24 md:py-32 bg-gradient-to-b from-black via-neutral-950 to-black overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4">
            <span className="text-white">Why Choose </span>
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              FeelFlick?
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto">
            Smarter recommendations. Faster discovery. Better movies.
          </p>
        </div>

        {/* Features Grid */}
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
      </div>
    </section>
  )
}

/**
 * Feature Card Component
 */
function FeatureCard({ feature, isVisible }) {
  const { icon: Icon, badge, badgeColor, iconBg, title, description } = feature

  return (
    <div
      className={`group relative p-6 sm:p-8 rounded-2xl bg-neutral-900/50 border border-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-700 hover:scale-105 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {/* Hover glow */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${iconBg} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500`} />

      {/* Icon */}
      <div className="relative mb-6">
        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${iconBg} shadow-lg`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>

      {/* Badge */}
      <div className="mb-4">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${badgeColor}`}>
          {badge}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-white/60 leading-relaxed">
        {description}
      </p>
    </div>
  )
}
