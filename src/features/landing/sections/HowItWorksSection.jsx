// src/features/landing/sections/HowItWorksSection.jsx
import { useState } from 'react'
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Heart, Sparkles, MonitorPlay } from 'lucide-react'

export default function HowItWorksSection() {
  const { containerRef, itemsVisible } = useStaggeredAnimation(3, 150)
  const [hoveredStep, setHoveredStep] = useState(null)

  const steps = [
    {
      number: '01',
      icon: <Heart className="h-6 w-6 sm:h-7 sm:w-7" />,
      title: 'Tell us your taste',
      description: 'Rate a few films and FeelFlick builds an emotional fingerprint — not just a list.',
      badge: 'Your fingerprint',
    },
    {
      number: '02',
      icon: <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" />,
      title: 'Pick your mood',
      description: "Tell us how you're feeling right now. Restless? Nostalgic? We'll find exactly the right film.",
      badge: 'Mood-aware',
    },
    {
      number: '03',
      icon: <MonitorPlay className="h-6 w-6 sm:h-7 sm:w-7" />,
      title: 'Find where to watch',
      description: 'See every streaming service showing your pick — Netflix, Prime, Hulu, Max, and 100+ more.',
      badge: 'One click',
    },
  ]

  return (
    <section
      id="how-it-works"
      className="relative pt-16 pb-20 sm:pt-20 sm:pb-24 md:pt-24 md:pb-28 bg-black overflow-hidden"
      aria-labelledby="how-it-works-heading"
    >
      {/* Subtle top border */}
      <div className="absolute top-0 inset-x-0 h-px bg-white/8" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <h2
            id="how-it-works-heading"
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4 sm:mb-6 leading-tight text-white"
          >
            Built around your taste.
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed px-4">
            Not your streaming history. Not the algorithm. You.
          </p>
        </div>

        {/* Steps Grid */}
        <div
          ref={containerRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10"
          role="list"
          aria-label="Steps to use FeelFlick"
        >
          {steps.map((step, index) => (
            <div key={step.number} className="relative" role="listitem">
              <StepCard
                step={step}
                index={index}
                isVisible={itemsVisible.includes(index)}
                onHover={setHoveredStep}
                isHovered={hoveredStep === index}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function StepCard({ step, index, isVisible, onHover, isHovered }) {
  const { number, icon, title, description, badge } = step

  return (
    <article
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      className={`
        group relative p-6 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl
        bg-white/[0.03] backdrop-blur-sm
        border border-white/8 hover:border-white/20
        shadow-xl transition-all duration-500 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
      `}
      style={{
        transitionDelay: `${index * 100}ms`,
      }}
    >
      {/* Large faded step number */}
      <div
        className="absolute top-4 right-4 text-7xl font-black text-white/[0.04] select-none pointer-events-none"
        aria-hidden="true"
      >
        {number}
      </div>

      {/* Icon circle */}
      <div
        className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl mb-5 bg-white/5 text-white/70 transition-transform duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 tracking-tight">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm sm:text-base text-white/55 leading-relaxed mb-5">
        {description}
      </p>

      {/* Badge */}
      <div className="inline-flex items-center px-3.5 py-2 rounded-lg border border-white/15 bg-white/5">
        <span className="text-xs sm:text-sm font-semibold text-white/60 tracking-wide">{badge}</span>
      </div>
    </article>
  )
}
