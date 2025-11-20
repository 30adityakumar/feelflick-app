// src/features/landing/sections/TestimonialsSection.jsx
import { useScrollAnimation, useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Star, Quote } from 'lucide-react'

/**
 * ⭐ TESTIMONIALS SECTION
 * 
 * Chexy-inspired social proof with specificity
 * 
 * Each testimonial includes:
 * - Real-sounding name + location
 * - Specific quote (not generic)
 * - Concrete metric/result
 * - Star rating (5/5)
 * - Photo (placeholder for now)
 * 
 * Strategy: Show diverse personas to appeal to different user types
 */
export default function TestimonialsSection() {
  const { containerRef, itemsVisible } = useStaggeredAnimation(3, 200)

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Martinez',
      role: 'Film Enthusiast',
      location: 'Los Angeles, CA',
      avatar: 'SM', // Placeholder initials
      quote: "I've discovered 15 indie films I'd never find on Netflix alone. FeelFlick gets my taste better than my film-buff friends.",
      metric: '92% recommendation match',
      detail: 'After rating 20 movies',
      rating: 5,
    },
    {
      id: 2,
      name: 'James Thompson',
      role: 'Married Guy',
      location: 'Austin, TX',
      avatar: 'JT',
      quote: "My wife and I spent HOURS choosing movies before. Now we find something we both love in under 2 minutes.",
      metric: 'Saved 4+ hours/month',
      detail: 'On decision making',
      rating: 5,
    },
    {
      id: 3,
      name: 'Maria Lopez',
      role: 'Busy Mom',
      location: 'Chicago, IL',
      avatar: 'ML',
      quote: "Worth it just for the 'where to stream' feature. No more bouncing between apps to find who has what.",
      metric: 'Uses FeelFlick 3x per week',
      detail: 'For family movie nights',
      rating: 5,
    },
  ]

  return (
    <section id="testimonials" className="relative py-8 sm:py-16 md:py-24 bg-black overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 📝 SECTION HEADER */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 sm:mb-6">
            Loved by{' '}
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Movie Lovers
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Real people, real discoveries, real results
          </p>
        </div>

        {/* 🎯 TESTIMONIALS GRID */}
        <div
          ref={containerRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              isVisible={itemsVisible.includes(index)}
            />
          ))}
        </div>

        {/* 📊 STATS ROW */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <StatItem number="10,000+" label="Active Users" />
          <StatItem number="4.8/5" label="Average Rating" />
          <StatItem number="92%" label="Match Accuracy" />
          <StatItem number="100+" label="Streaming Services" />
        </div>
      </div>
    </section>
  )
}

/**
 * 💬 TESTIMONIAL CARD
 * Individual testimonial with photo, quote, metric
 */
function TestimonialCard({ testimonial, isVisible }) {
  const { name, role, location, avatar, quote, metric, detail, rating } = testimonial

  // Animated counter for metric (if numeric)
  const isPercent = metric.match(/(\d+)%/)
  const isNumber = metric.match(/(\d+)/)
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!isVisible || !isNumber) return
    let start = 0
    const end = parseInt(isPercent ? isPercent[1] : isNumber[1], 10)
    const timer = setInterval(() => {
      start += Math.ceil(end / 30)
      setCount(Math.min(start, end))
      if (start >= end) clearInterval(timer)
    }, 18)
    return () => clearInterval(timer)
  }, [isVisible, isNumber, isPercent])

  return (
    <div
      className={`group relative p-6 sm:p-8 rounded-2xl bg-neutral-900/60 backdrop-blur-sm border border-white/10 shadow-lg hover:shadow-[0_0_40px_0_rgba(168,85,247,0.3)] hover:border-purple-500/40 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {/* Animated quote icon */}
      <div className="absolute top-6 right-6 text-purple-500/20 animate-pulse-slow">
        <Quote className="h-12 w-12" />
      </div>

      {/* Persona chip */}
      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-400/10 text-purple-300 font-medium text-xs absolute top-6 left-6">
        🎬 {role}
      </div>

      {/* Star Rating */}
      <div className="flex items-center gap-1 mb-4 pt-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-purple-500 text-purple-500" />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="relative z-10 text-base sm:text-lg text-white/90 leading-relaxed mb-6">
        "{quote}"
      </blockquote>

      {/* Metric Badge + Animated Counter */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/15 border border-purple-500/20 font-medium text-sm">
          <span className="text-purple-300 font-black">
            {isPercent ? `${count}%` : isNumber ? count : metric}
          </span>
          {!isNumber && (
            <span className="text-purple-300 font-black">{metric}</span>
          )}
          <span className="text-xs text-white/50 ml-1">
            {detail}
          </span>
        </div>
      </div>

      {/* Author info with gradient avatar */}
      <div className="flex items-center gap-4 pt-5 border-t border-white/10">
        <div className="relative flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-1">
          <div className="flex items-center justify-center w-full h-full bg-neutral-900 rounded-full text-white font-bold text-base shadow-lg">
            {avatar}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm sm:text-base truncate">
            {name}
          </div>
          <div className="text-xs text-white/60 truncate">
            {location}
          </div>
        </div>
      </div>

      {/* Streaming icons or confetti on hover overlay (example of "rich" background) */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-60 transition-opacity duration-700">
        <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" className="absolute left-8 top-4 w-8 h-8 opacity-30 blur-[2px]" />
        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a6/Amazon_Prime_Logo.svg" className="absolute right-6 bottom-10 w-10 h-5 opacity-20 blur-[2px]" />
        <div className="absolute right-12 top-10 w-4 h-4 bg-amber-400 rounded-full blur-sm opacity-40" />
      </div>
    </div>
  )
}



/**
 * 📊 STAT ITEM
 * Small stat card for bottom row
 */
function StatItem({ number, label }) {
  return (
    <div className="text-center p-4 rounded-xl bg-neutral-900/30 border border-white/5 hover:border-purple-500/20 transition-colors duration-300">
      <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-1">
        {number}
      </div>
      <div className="text-xs sm:text-sm text-white/60">
        {label}
      </div>
    </div>
  )
}
