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
      description: 'Swipe through movies you know. Love it? Hate it? Every rating sharpens your taste profile.',
      detail: '60',
      detailSuffix: ' seconds',
      detailIcon: <Check className="h-3 w-3" />,
      color: 'amber',
      features: ['Tinder-style swiping', 'Rate 10+ movies', 'Skip what you don\'t know'],
    },
    {
      number: '02',
      icon: <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" />,
      title: 'Get Mood Matches',
      description: 'Our AI analyzes emotional tone, pacing, and crowd sentiment—not just genre tags.',
      detail: '98',
      detailSuffix: '% accuracy',
      detailIcon: <Sparkles className="h-3 w-3" />,
      color: 'purple',
      features: ['Emotion-based', 'Not just genres', 'Learns your taste'],
    },
    {
      number: '03',
      icon: <Play className="h-6 w-6 sm:h-7 sm:w-7" />,
      title: 'Watch Instantly',
      description: 'See exactly where to stream it. Netflix, Prime, Hulu, Max—we check 100+ services.',
      detail: 'One click',
      detailSuffix: '',
      detailIcon: <Play className="h-3 w-3" />,
      color: 'teal',
      features: ['100+ services', 'Direct links', 'Rent/buy options'],
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
          redirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/onboarding`
              : undefined,
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
    <section id="how-it-works" className="relative pt-10 pb-14 sm:pt-16 sm:pb-20 bg-black overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4 sm:mb-6">
            How{' '}
            <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">
              FeelFlick
            </span>
            {' '}Works
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed px-4">
            No complex setup. No training period. Just instant, personalized recommendations.
          </p>
        </div>

        {/* Steps Grid */}
        <div
          ref={containerRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 mb-12 sm:mb-16"
        >
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              <StepCard
                step={step}
                index={index}
                isVisible={itemsVisible.includes(index)}
                isLast={index === steps.length - 1}
                onHover={setHoveredStep}
                isHovered={hoveredStep === index}
              />

              {/* Animated SVG connector (desktop only, not after last item) */}
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
            className="group inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base sm:text-lg hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.6)] transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />
            <span className="relative">{isAuthenticating ? 'Starting...' : 'Try It Free'}</span>
            <ArrowRight className="relative h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-white/40">No credit card required • Takes 60 seconds</p>
        </div>
      </div>
    </section>
  )
}

/**
 * ✨ WOW FACTOR #1: Animated Counter
 */
function AnimatedNumber({ value, suffix = '', isVisible }) {
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
 * ✨ WOW FACTOR #2: Animated SVG Connecting Lines
 */
function AnimatedConnector({ isVisible, color }) {
  return (
    <div className="hidden md:flex absolute top-1/2 -right-5 lg:-right-10 -translate-y-1/2 z-20 w-10 lg:w-20 h-8 items-center justify-center">
      <svg 
        className="w-full h-full"
        viewBox="0 0 100 40"
        fill="none"
      >
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="50%" stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={color} stopOpacity="0.8" />
          </linearGradient>
        </defs>
        {/* Main line */}
        <path
          d="M 5 20 L 80 20"
          stroke={`url(#gradient-${color})`}
          strokeWidth="2"
          strokeDasharray="75"
          strokeDashoffset={isVisible ? "0" : "75"}
          style={{
            transition: 'stroke-dashoffset 0.8s ease-out 0.5s'
          }}
        />
        {/* Arrow head */}
        <path
          d="M 75 15 L 85 20 L 75 25"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={isVisible ? "0.8" : "0"}
          style={{
            transition: 'opacity 0.3s ease-out 1.2s'
          }}
        />
      </svg>
    </div>
  )
}

/**
 * ✨ WOW FACTOR #3: 3D Card Tilt + Enhanced Step Card
 */
function StepCard({ step, index, isVisible, onHover, isHovered }) {
  const { number, icon, title, description, detail, detailSuffix, detailIcon, color, features, isText } = step
  const cardRef = useRef(null)

  // 3D Tilt Effect
  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = (y - centerY) / 25
    const rotateY = (centerX - x) / 25

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
  }

  const colorClasses = {
    amber: {
      iconBg: 'bg-amber-500/10',
      iconText: 'text-amber-400',
      iconGlow: 'shadow-amber-500/20 group-hover:shadow-amber-500/40',
      numberText: 'text-amber-500/20',
      detailBg: 'bg-amber-500/10',
      detailBorder: 'border-amber-500/30',
      detailText: 'text-amber-400',
      cardBorder: 'group-hover:border-amber-500/50',
      cardGlow: 'group-hover:shadow-amber-500/10',
      featureDot: 'bg-amber-500',
    },
    purple: {
      iconBg: 'bg-purple-500/10',
      iconText: 'text-purple-400',
      iconGlow: 'shadow-purple-500/20 group-hover:shadow-purple-500/40',
      numberText: 'text-purple-500/20',
      detailBg: 'bg-purple-500/10',
      detailBorder: 'border-purple-500/30',
      detailText: 'text-purple-400',
      cardBorder: 'group-hover:border-purple-500/50',
      cardGlow: 'group-hover:shadow-purple-500/10',
      featureDot: 'bg-purple-500',
    },
    teal: {
      iconBg: 'bg-teal-500/10',
      iconText: 'text-teal-400',
      iconGlow: 'shadow-teal-500/20 group-hover:shadow-teal-500/40',
      numberText: 'text-teal-500/20',
      detailBg: 'bg-teal-500/10',
      detailBorder: 'border-teal-500/30',
      detailText: 'text-teal-400',
      cardBorder: 'group-hover:border-teal-500/50',
      cardGlow: 'group-hover:shadow-teal-500/10',
      featureDot: 'bg-teal-500',
    },
  }

  const colors = colorClasses[color]

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => {
        onHover(null)
        handleMouseLeave()
      }}
      onMouseMove={handleMouseMove}
      className={`group relative p-6 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-neutral-900/50 backdrop-blur-sm border border-white/10 ${colors.cardBorder} ${colors.cardGlow} shadow-2xl transition-all duration-700 ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-12'
      }`}
      style={{ 
        transformStyle: 'preserve-3d',
        transition: 'transform 0.1s ease-out, opacity 0.7s, translate 0.7s, border-color 0.3s, box-shadow 0.3s'
      }}
    >
      {/* Large background number */}
      <div 
        className={`absolute top-4 sm:top-6 right-4 sm:right-6 text-6xl sm:text-7xl md:text-8xl font-black ${colors.numberText} select-none pointer-events-none transition-all duration-500 ${
          isHovered ? 'scale-110 opacity-100' : 'scale-100 opacity-100'
        }`}
        style={{ transform: 'translateZ(20px)' }}
      >
        {number}
      </div>

      {/* Icon with enhanced glow */}
      <div 
        className={`relative inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl ${colors.iconBg} ${colors.iconText} mb-5 sm:mb-6 shadow-lg ${colors.iconGlow} transition-all duration-500 ${
          isHovered ? 'scale-110 rotate-6' : 'scale-100 rotate-0'
        }`}
        style={{ transform: 'translateZ(30px)' }}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="relative z-10" style={{ transform: 'translateZ(40px)' }}>
        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 leading-tight">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm sm:text-base text-white/70 leading-relaxed mb-5 sm:mb-6">
          {description}
        </p>

        {/* Features list (shows on hover) */}
        <div className={`space-y-2 mb-5 sm:mb-6 transition-all duration-500 ${
          isHovered ? 'opacity-100 max-h-40' : 'opacity-0 max-h-0 overflow-hidden'
        }`}>
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2 text-xs sm:text-sm text-white/60">
              <div className={`w-1.5 h-1.5 rounded-full ${colors.featureDot}`} />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Detail badge with animated counter */}
        <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl ${colors.detailBg} border ${colors.detailBorder} backdrop-blur-sm transition-all duration-300 ${
          isHovered ? 'scale-105' : 'scale-100'
        }`}>
          <span className="flex-shrink-0">{detailIcon}</span>
          <span className={`text-xs sm:text-sm font-bold ${colors.detailText}`}>
            {isText ? (
              detail
            ) : (
              <AnimatedNumber value={detail} suffix={detailSuffix} isVisible={isVisible} />
            )}
          </span>
        </div>
      </div>

      {/* Hover glow overlay */}
      <div className={`absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${
        color === 'amber' ? 'from-amber-500/5 to-transparent' :
        color === 'purple' ? 'from-purple-500/5 to-transparent' :
        'from-teal-500/5 to-transparent'
      } opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
    </div>
  )
}
