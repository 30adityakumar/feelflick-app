// src/features/landing/sections/HowItWorksSection.jsx
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Star, Sparkles, PlayCircle, ArrowRight } from 'lucide-react'

/**
 * ⚡ HOW IT WORKS SECTION
 * 
 * Plex-inspired visual clarity + Chexy-style simplicity
 * 
 * Shows 3-step process:
 * 1. Rate movies (input)
 * 2. Get recommendations (algorithm)
 * 3. Watch instantly (output)
 * 
 * No jargon, no complexity - just clarity
 */
export default function HowItWorksSection() {
  const { containerRef, itemsVisible } = useStaggeredAnimation(3, 200)

  const steps = [
    {
      number: '01',
      icon: <Star className="h-8 w-8" />,
      title: 'Tell Us Your Taste',
      description: 'Rate 5-10 movies you love (or hate). The more you rate, the better we get.',
      detail: 'Takes 60 seconds',
      color: 'purple',
    },
    {
      number: '02',
      icon: <Sparkles className="h-8 w-8" />,
      title: 'Get AI Recommendations',
      description: 'Our algorithm analyzes your taste and finds your perfect matches.',
      detail: '92% accuracy',
      color: 'pink',
    },
    {
      number: '03',
      icon: <PlayCircle className="h-8 w-8" />,
      title: 'Watch Instantly',
      description: 'Click to stream on Netflix, Prime, Disney+, or any of 100+ services.',
      detail: 'One-click access',
      color: 'purple',
    },
  ]

  return (
    <section className="relative py-16 sm:py-24 md:py-32 bg-black overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 📝 SECTION HEADER */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 sm:mb-6">
            How{' '}
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              FeelFlick
            </span>
            {' '}Works
          </h2>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Three simple steps to discover your next favorite movie
          </p>
        </div>

        {/* 🎯 STEPS GRID */}
        <div
          ref={containerRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12"
        >
          {steps.map((step, index) => (
            <StepCard
              key={step.number}
              step={step}
              index={index}
              isVisible={itemsVisible.includes(index)}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>

        {/* 💡 BOTTOM CTA */}
        <div className="text-center mt-12 sm:mt-16">
          <p className="text-white/60 text-sm sm:text-base mb-6">
            No algorithm to train. No complex setup. Just instant recommendations.
          </p>
          <button className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95">
            Try It Free
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  )
}

/**
 * 🎴 STEP CARD COMPONENT
 * Individual step with icon, title, description
 */
function StepCard({ step, index, isVisible, isLast }) {
  const { number, icon, title, description, detail, color } = step

  // Color variants
  const colorClasses = {
    purple: {
      iconBg: 'bg-purple-500/10',
      iconText: 'text-purple-400',
      iconGlow: 'group-hover:shadow-purple-500/50',
      numberText: 'text-purple-500/30',
      detailBg: 'bg-purple-500/10',
      detailBorder: 'border-purple-500/30',
      detailText: 'text-purple-400',
      cardBorder: 'group-hover:border-purple-500/50',
    },
    pink: {
      iconBg: 'bg-pink-500/10',
      iconText: 'text-pink-400',
      iconGlow: 'group-hover:shadow-pink-500/50',
      numberText: 'text-pink-500/30',
      detailBg: 'bg-pink-500/10',
      detailBorder: 'border-pink-500/30',
      detailText: 'text-pink-400',
      cardBorder: 'group-hover:border-pink-500/50',
    },
  }

  const colors = colorClasses[color]

  return (
    <div className="relative">
      {/* Card */}
      <div
        className={`group relative p-6 sm:p-8 rounded-2xl bg-neutral-900/50 backdrop-blur-sm border border-white/10 ${colors.cardBorder} transition-all duration-700 ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Large background number */}
        <div className={`absolute top-4 right-4 text-6xl sm:text-7xl font-black ${colors.numberText} select-none`}>
          {number}
        </div>

        {/* Icon */}
        <div className={`relative inline-flex items-center justify-center w-16 h-16 rounded-2xl ${colors.iconBg} ${colors.iconText} mb-6 shadow-lg ${colors.iconGlow} transition-all duration-300`}>
          {icon}
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Title */}
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-tight">
            {title}
          </h3>

          {/* Description */}
          <p className="text-sm sm:text-base text-white/70 leading-relaxed mb-4">
            {description}
          </p>

          {/* Detail badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.detailBg} border ${colors.detailBorder}`}>
            <span className={`text-xs font-semibold ${colors.detailText}`}>
              {detail}
            </span>
          </div>
        </div>

        {/* Hover glow effect */}
        <div className={`absolute inset-0 rounded-2xl ${color === 'purple' ? 'bg-purple-500/5' : 'bg-pink-500/5'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      </div>

      {/* Arrow connector (desktop only, not after last item) */}
      {!isLast && (
        <div className="hidden md:flex absolute top-1/2 -right-6 lg:-right-12 -translate-y-1/2 z-20 items-center justify-center">
          <ArrowRight className={`h-6 w-6 lg:h-8 lg:w-8 ${colors.iconText} transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
          }`} />
        </div>
      )}
    </div>
  )
}
