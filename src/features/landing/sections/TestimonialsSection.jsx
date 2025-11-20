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
    <section className="relative py-16 sm:py-24 md:py-32 bg-black overflow-hidden">
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

  return (
    <div
      className={`group relative p-6 sm:p-8 rounded-2xl bg-neutral-900/50 backdrop-blur-sm border border-white/10 hover:border-purple-500/30 transition-all duration-700 ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      }`}
    >
      {/* Quote Icon */}
      <div className="absolute top-6 right-6 text-purple-500/20">
        <Quote className="h-12 w-12" />
      </div>

      {/* Star Rating */}
      <div className="flex items-center gap-1 mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-purple-500 text-purple-500" />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="relative z-10 text-base sm:text-lg text-white/90 leading-relaxed mb-6">
        "{quote}"
      </blockquote>

      {/* Metric Badge */}
      <div className="mb-6">
        <div className="inline-flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <span className="text-sm font-bold text-purple-400">
            {metric}
          </span>
          <span className="text-xs text-white/50">
            {detail}
          </span>
        </div>
      </div>

      {/* Author Info */}
      <div className="flex items-center gap-4 pt-6 border-t border-white/10">
        {/* Avatar */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
          {avatar}
        </div>

        {/* Name & Location */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm sm:text-base truncate">
            {name}
          </div>
          <div className="text-xs text-white/60 truncate">
            {role} • {location}
          </div>
        </div>
      </div>

      {/* Hover gradient overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
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
