// src/features/landing/sections/TestimonialsSection.jsx
import { useStaggeredAnimation } from '@/features/landing/utils/scrollAnimations'
import { Star, Quote } from 'lucide-react'

export default function TestimonialsSection() {
  const { containerRef, itemsVisible } = useStaggeredAnimation(3, 200)

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Martinez',
      role: 'Film Enthusiast',
      location: 'Los Angeles, CA',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      quote: "I've discovered 15 indie films I'd never find on Netflix alone. FeelFlick gets my taste better than my film-buff friends.",
      metric: '92% recommendation match',
      detail: 'After rating 20 movies',
      rating: 5,
    },
    {
      id: 2,
      name: 'James Thompson',
      role: 'Casual Viewer',
      location: 'Austin, TX',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
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
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      quote: "Worth it just for the 'where to stream' feature. No more bouncing between apps to find who has what.",
      metric: 'Uses FeelFlick 3x per week',
      detail: 'For family movie nights',
      rating: 5,
    },
  ]

  return (
    <section id="testimonials" className="relative pt-6 pb-8 sm:pt-10 sm:pb-12 md:pt-12 md:pb-16 bg-black overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-5">
            Loved by{' '}
            <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">
              Movie Lovers
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Real people, real discoveries, real results. Join the community that's changing how we watch.
          </p>
        </div>

        {/* Testimonials grid */}
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
      </div>
    </section>
  )
}

/**
 * 💬 Testimonial card
 * Shows avatar, quote, metric, star rating, name/location
 */
function TestimonialCard({ testimonial, isVisible }) {
  const { name, role, location, avatar, quote, metric, detail, rating } = testimonial

  return (
    <div
      className={`group relative p-8 rounded-3xl bg-neutral-900/40 backdrop-blur-sm border border-white/10 hover:border-purple-500/30 hover:bg-neutral-900/60 transition-all duration-500 ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-12'
      }`}
    >
      {/* Quote Icon */}
      <div className="absolute top-8 right-8 text-purple-500/20 group-hover:text-purple-500/40 transition-colors duration-500">
        <Quote className="h-10 w-10 fill-current" />
      </div>

      {/* Author info */}
      <div className="flex items-center gap-4 mb-6">
        <img 
          src={avatar} 
          alt={name} 
          className="w-14 h-14 rounded-full object-cover border-2 border-white/10 group-hover:border-purple-500/50 transition-colors duration-300 shadow-lg"
        />
        <div>
          <div className="font-bold text-white text-lg">{name}</div>
          <div className="text-sm text-white/50">{role} • {location}</div>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1 mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-base sm:text-lg text-white/80 leading-relaxed mb-8 relative z-10">
        "{quote}"
      </blockquote>

      {/* Metric badge */}
      <div className="pt-6 border-t border-white/5">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {metric}
          </span>
          <span className="text-xs text-white/40">
            {detail}
          </span>
        </div>
      </div>
    </div>
  )
}
