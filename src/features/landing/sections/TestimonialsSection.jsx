// src/features/landing/sections/TestimonialsSection.jsx
import { useState } from 'react'
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
    <section 
      id="testimonials" 
      className="relative pt-20 pb-24 sm:pt-24 sm:pb-28 md:pt-28 md:pb-32 bg-black overflow-hidden"
      aria-labelledby="testimonials-heading"
    >
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} aria-hidden="true" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <h2 
            id="testimonials-heading"
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-5 sm:mb-6 leading-tight"
          >
            Loved by{' '}
            <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">
              Movie Lovers
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed px-4">
            Real people, real discoveries, real results. Join the community that's changing how we watch.
          </p>
        </div>

        {/* Testimonials grid */}
        <div
          ref={containerRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
          role="list"
          aria-label="User testimonials"
        >
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              index={index}
              isVisible={itemsVisible.includes(index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * Testimonial card with enhanced accessibility
 */
function TestimonialCard({ testimonial, index, isVisible }) {
  const { name, role, location, avatar, quote, metric, detail, rating } = testimonial
  const [avatarLoaded, setAvatarLoaded] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)

  return (
    <article
      className={`
        group relative p-7 sm:p-8 rounded-2xl sm:rounded-3xl 
        bg-neutral-900/40 backdrop-blur-sm border border-white/10 
        hover:border-purple-500/30 hover:bg-neutral-900/60 
        transition-all duration-500 ease-out
        hover:scale-105 active:scale-100
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
      `}
      style={{
        transitionDelay: `${index * 150}ms`,
        willChange: isVisible ? 'transform' : 'auto',
      }}
      role="listitem"
    >
      {/* Quote Icon */}
      <div 
        className="absolute top-8 right-8 text-purple-500/20 group-hover:text-purple-500/40 transition-colors duration-500"
        aria-hidden="true"
      >
        <Quote className="h-10 w-10 fill-current" />
      </div>

      {/* Author info */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-purple-500/50 transition-colors duration-300 shadow-lg shrink-0">
          {!avatarLoaded && !avatarFailed && (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-700 to-neutral-800 animate-pulse" />
          )}
          {avatarFailed && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <span className="text-xl font-bold text-white">{name[0]}</span>
            </div>
          )}
          {!avatarFailed && (
            <img 
              src={avatar} 
              alt={`${name}'s profile picture`}
              className={`w-full h-full object-cover transition-opacity duration-500 ${avatarLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setAvatarLoaded(true)}
              onError={() => setAvatarFailed(true)}
            />
          )}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-white text-base sm:text-lg truncate">{name}</div>
          <div className="text-sm text-white/50 truncate">{role} • {location}</div>
        </div>
      </div>

      {/* Rating */}
      <div 
        className="flex items-center gap-1 mb-5"
        role="img"
        aria-label={`Rated ${rating} out of 5 stars`}
      >
        {[...Array(rating)].map((_, i) => (
          <Star 
            key={i} 
            className="h-4 w-4 fill-amber-500 text-amber-500" 
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Quote */}
      <figure className="mb-8">
        <blockquote className="text-base sm:text-lg text-white/80 leading-relaxed relative z-10">
          "{quote}"
        </blockquote>
      </figure>

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
    </article>
  )
}