// src/features/landing/sections/HowItWorksSection.jsx
import { useState, useEffect, useRef } from 'react'
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Star, Sparkles, Play, ArrowRight, Check } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'

export default function HowItWorksSection() {
  const { containerRef, itemsVisible } = useStaggeredAnimation(3, 150)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [hoveredStep, setHoveredStep] = useState(null)

  const steps = [
    {
      number: '01',
      icon: <Star className="h-6 w-6 sm:h-7 sm:w-7" />,
      title: 'Rate Your Favorites',
      description: 'Every reaction sharpens your recommendations.',
      detail: '60',
      detailSuffix: ' seconds',
      detailIcon: <Check className="h-3 w-3" />,
      color: 'amber',
    },
    {
      number: '02',
      icon: <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" />,
      title: 'Get Mood Matches',
      description: 'AI reads emotional tone, pacing, crowd feel - not just genres.',
      detail: '98',
      detailSuffix: '% accuracy',
      detailIcon: <Sparkles className="h-3 w-3" />,
      color: 'purple',
    },
    {
      number: '03',
      icon: <Play className="h-6 w-6 sm:h-7 sm:w-7" />,
      title: 'Watch Instantly',
      description: 'See where to stream - Netflix, Prime, Hulu, Max, 100+ more.',
      detail: 'One click',
      detailSuffix: '',
      detailIcon: <Play className="h-3 w-3" />,
      color: 'teal',
      isText: true,
    },
  ]

  async function handleGetStarted() {
    if (isAuthenticating) return
    setIsAuthenticating(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Auth error:', error)
      alert('Sign in failed. Please try again.')
    } finally {
      setIsAuthenticating(false)
    }
  }

  return (
    <section
      id="how-it-works"
      className="relative pt-16 pb-20 sm:pt-20 sm:pb-24 md:pt-24 md:pb-28 bg-black overflow-hidden"
      aria-labelledby="how-it-works-heading"
    >
      {/* Ambient gradient accents */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: '9s' }} aria-hidden="true" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-orange-400/10 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: '11s', animationDelay: '2s' }} aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <h2 
            id="how-it-works-heading"
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4 sm:mb-6 leading-tight"
          >
            How{' '}
            <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">
              FeelFlick
            </span>{' '}
            Works
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed px-4">
            Instantly discover the right film for your mood—no training period, no puzzle-box UI.
          </p>
        </div>

        {/* Steps Grid */}
        <div
          ref={containerRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 mb-10 sm:mb-12"
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
              {/* SVG connector line, desktop only */}
              {index < steps.length - 1 && (
                <AnimatedConnector
                  isVisible={itemsVisible.includes(index)}
                  color={step.color === 'amber' ? '#f59e0b' : step.color === 'purple' ? '#a855f7' : '#14b8a6'}
                />
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <button
            onClick={handleGetStarted}
            disabled={isAuthenticating}
            className="group inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed touch-target"
            aria-label={isAuthenticating ? 'Signing you in' : 'Try FeelFlick free'}
          >
            {isAuthenticating ? (
              <>
                <svg 
                  className="animate-spin h-5 w-5" 
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Starting...</span>
              </>
            ) : (
              <>
                <span>Try It Free</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </>
            )}
          </button>
          <p className="mt-4 text-xs sm:text-sm text-white/40 font-medium">
            No card required • 60 seconds to start
          </p>
        </div>
      </div>
    </section>
  )
}

/**
 * Animated number counter with memoization
 */
const AnimatedNumber = ({ value, suffix = '', isVisible }) => {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    if (!isVisible) return
    
    const target = parseInt(value)
    if (isNaN(target)) return
    
    const duration = 1500
    const increment = target / (duration / 16)
    let current = 0
    
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, 16)
    
    return () => clearInterval(timer)
  }, [isVisible, value])
  
  return <>{count}{suffix}</>
}

/**
 * Animated SVG connector for desktop
 */
function AnimatedConnector({ isVisible, color }) {
  return (
    <div 
      className="hidden md:flex absolute top-1/2 -right-5 lg:-right-10 -translate-y-1/2 z-20 w-10 lg:w-20 h-8 items-center justify-center"
      aria-hidden="true"
    >
      <svg className="w-full h-full" viewBox="0 0 100 40" fill="none">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="50%" stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={color} stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <path 
          d="M 5 20 L 80 20"
          stroke={`url(#gradient-${color})`}
          strokeWidth="2"
          strokeDasharray="75"
          strokeDashoffset={isVisible ? "0" : "75"}
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.5s'
          }}
        />
        <path 
          d="M 75 15 L 85 20 L 75 25"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={isVisible ? "0.8" : "0"}
          style={{
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) 1.2s'
          }}
        />
      </svg>
    </div>
  )
}

/**
 * Step card with hover effects and animations
 */
function StepCard({ step, index, isVisible, onHover, isHovered }) {
  const { number, icon, title, description, detail, detailSuffix, detailIcon, color, isText } = step
  
  const colorClasses = {
    amber: {
      iconBg: 'bg-amber-500/10',
      iconText: 'text-amber-400',
      numberText: 'text-amber-400/10',
      border: 'hover:border-amber-400/40',
      shadow: 'hover:shadow-amber-500/10',
      badge: 'bg-amber-600/10 border-amber-400/30 text-amber-300',
    },
    purple: {
      iconBg: 'bg-purple-500/10',
      iconText: 'text-purple-400',
      numberText: 'text-purple-400/10',
      border: 'hover:border-purple-400/40',
      shadow: 'hover:shadow-purple-500/10',
      badge: 'bg-purple-600/10 border-purple-400/30 text-purple-300',
    },
    teal: {
      iconBg: 'bg-teal-500/10',
      iconText: 'text-teal-400',
      numberText: 'text-teal-400/10',
      border: 'hover:border-teal-400/40',
      shadow: 'hover:shadow-teal-500/10',
      badge: 'bg-teal-600/10 border-teal-400/30 text-teal-300',
    }
  }
  
  const colors = colorClasses[color]

  return (
    <article
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      className={`
        group relative p-6 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl
        bg-neutral-900/70 backdrop-blur-sm 
        border border-white/10 ${colors.border}
        shadow-xl ${colors.shadow}
        transition-all duration-500 ease-out
        hover:scale-105 active:scale-100
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
      `}
      style={{
        transitionDelay: `${index * 100}ms`,
        willChange: isHovered ? 'transform' : 'auto',
      }}
    >
      {/* Large faded step number */}
      <div 
        className={`absolute top-4 right-4 text-6xl sm:text-7xl font-black ${colors.numberText} select-none pointer-events-none transition-opacity duration-300 ${isHovered ? 'opacity-30' : 'opacity-100'}`}
        aria-hidden="true"
      >
        {number}
      </div>

      {/* Icon circle */}
      <div 
        className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl mb-5 ${colors.iconBg} ${colors.iconText} shadow-lg transition-transform duration-300 ${isHovered ? 'scale-110 rotate-3' : 'scale-100'}`}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 tracking-tight">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm sm:text-base text-white/70 leading-relaxed mb-5">
        {description}
      </p>

      {/* Animated detail badge */}
      <div 
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border ${colors.badge} backdrop-blur-sm shadow-md transition-all duration-300 ${isHovered ? 'scale-105' : 'scale-100'}`}
      >
        <span className="text-white/80" aria-hidden="true">{detailIcon}</span>
        <span className="text-xs sm:text-sm font-bold tracking-wide">
          {isText ? (
            detail
          ) : (
            <AnimatedNumber value={detail} suffix={detailSuffix} isVisible={isVisible} />
          )}
        </span>
      </div>
    </article>
  )
}