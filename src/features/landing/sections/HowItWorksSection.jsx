// src/features/landing/sections/HowItWorksSection.jsx
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Star, Sparkles, Play } from 'lucide-react'

export default function HowItWorksSection() {
  const { containerRef, itemsVisible } = useStaggeredAnimation(3, 150)

  return (
    <section
      id="how-it-works"
      className="relative pb-24 bg-neutral-950 overflow-hidden"
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4">
            From Mood to Movie in{' '}
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Under a Minute
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto">
            Rate a few movies, discover your perfect match. No scrolling required.
          </p>
        </div>

        {/* Steps */}
        <div ref={containerRef} className="space-y-8">
          <Step 
            number="01"
            icon={<Star className="w-8 h-8 text-amber-400" />} 
            title="Rate 10-15 movies you've watched" 
            desc="Love it? Hate it? Every rating sharpens your taste profile and helps us understand your unique preferences." 
            isVisible={itemsVisible.includes(0)} 
          />
          <Step 
            number="02"
            icon={<Sparkles className="w-8 h-8 text-purple-400" />} 
            title="Get instant mood-based recommendations" 
            desc="Our AI analyzes emotional tone, pacing, and crowd sentiment—delivering matches based on how you feel right now, not just genre tags." 
            isVisible={itemsVisible.includes(1)} 
          />
          <Step 
            number="03"
            icon={<Play className="w-8 h-8 text-teal-400" />} 
            title="Tap to watch on 100+ streaming services" 
            desc="See exactly where each movie is streaming. Netflix, Prime, Hulu, Max—we check them all so you don't have to." 
            isVisible={itemsVisible.includes(2)} 
          />
        </div>
      </div>
    </section>
  )
}

function Step({ number, icon, title, desc, isVisible }) {
  return (
    <div 
      className={`group relative flex gap-6 p-8 rounded-3xl bg-neutral-900/40 border border-white/5 hover:border-purple-500/30 hover:bg-neutral-900/60 transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
    >
      {/* Number Badge */}
      <div className="flex-shrink-0">
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
          {icon}
          <span className="absolute -top-2 -right-2 text-xs font-black text-white/40 group-hover:text-purple-400 transition-colors">
            {number}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
          {title}
        </h3>
        <p className="text-base sm:text-lg text-white/60 leading-relaxed">
          {desc}
        </p>
      </div>

      {/* Subtle hover glow */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  )
}
