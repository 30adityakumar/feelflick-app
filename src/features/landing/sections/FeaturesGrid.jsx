// src/features/landing/sections/FeaturesGrid.jsx
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Sparkles, Tv2, Lock } from 'lucide-react'

/**
 * 💎 FEATURES GRID
 * 
 * Two-column layout: Features + Visual mockup
 */

export default function FeaturesGrid() {
  const { containerRef, itemsVisible } = useStaggeredAnimation(3, 200)

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'AI-Powered Discovery',
      description: 'Our algorithm learns your unique taste—not your demographic. Get recommendations that actually match how you feel.',
      badge: '92% Match Accuracy',
      color: 'purple',
    },
    {
      icon: <Tv2 className="w-6 h-6" />,
      title: 'Find Where to Watch',
      description: 'Netflix, Prime, Disney+, HBO Max, Hulu, and 95+ more. One click shows you exactly where to stream any movie.',
      badge: '100+ Services Indexed',
      color: 'blue',
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Never Forget a Great Movie',
      description: "Save movies you want to watch, create custom lists, and rate what you've seen. Your personal movie library.",
      badge: 'Unlimited Watchlists',
      color: 'pink',
    },
  ]

  return (
    <section
      id="features"
      ref={containerRef}
      className="relative py-20 sm:py-28 bg-gradient-to-b from-black via-neutral-950 to-black overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Features List */}
          <div className="space-y-10">
            {features.map((feature, index) => (
              <FeatureItem
                key={index}
                {...feature}
                isVisible={itemsVisible.includes(index)}
                delay={index * 100}
              />
            ))}
          </div>

          {/* Right Column: Visual Mockup */}
          <div className="relative">
            <MovieCard
              isVisible={itemsVisible.includes(1)}
              delay={400}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Feature Item Component
 */
function FeatureItem({ icon, title, description, badge, color, isVisible, delay }) {
  const gradients = {
    purple: 'from-purple-500 to-pink-500',
    blue: 'from-blue-500 to-cyan-400',
    pink: 'from-pink-500 to-fuchsia-500',
  }

  const badgeColors = {
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    pink: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  }

  return (
    <div
      className={`flex items-start gap-4 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${gradients[color]} shadow-lg flex items-center justify-center`}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1">
        {/* Badge */}
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mb-2 border ${badgeColors[color]}`}>
          {badge}
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{title}</h3>

        {/* Description */}
        <p className="text-white/70 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

/**
 * Movie Card Mockup Component
 */
function MovieCard({ isVisible, delay }) {
  return (
    <div
      className={`group relative rounded-2xl overflow-hidden shadow-2xl shadow-black/60 transition-all duration-700 hover:scale-105 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Movie Poster */}
      <img
        src="https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"
        alt="Arrival"
        className="w-full h-[500px] object-cover"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

      {/* Hover Play Button */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white">
          <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
        {/* Title */}
        <h3 className="text-2xl font-bold text-white">Arrival</h3>

        {/* Match Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-lg">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-bold text-white">98% Match</span>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-3 text-sm text-white/70">
          <span>2016</span>
          <span>•</span>
          <span>Sci-Fi</span>
          <span>•</span>
          <span>1h 56m</span>
        </div>
      </div>
    </div>
  )
}
