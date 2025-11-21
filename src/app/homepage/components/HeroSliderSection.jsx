// src/app/homepage/components/HeroSliderSection.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'

const tmdbImg = (p, s = 'original') => p ? `https://image.tmdb.org/t/p/${s}${p}` : ''

export default function HeroSliderSection({ className = '' }) {
  const [slides, setSlides] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()
  const timerRef = useRef(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  // Fetch trending movies
  useEffect(() => {
    setLoading(true)
    fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US`)
      .then(r => r.json())
      .then(j => {
        const movies = j?.results?.slice(0, 5) ?? []
        setSlides(movies)
        setLoading(false)
      })
      .catch(() => {
        setSlides([])
        setLoading(false)
      })
  }, [])

  // Auto-advance slides
  useEffect(() => {
    if (!slides.length || isPaused) return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => nextSlide(), 7000)
    return () => clearInterval(timerRef.current)
  }, [slides.length, currentIndex, isPaused])

  const nextSlide = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex(prev => (prev + 1) % slides.length)
    setTimeout(() => setIsTransitioning(false), 1000)
  }

  const prevSlide = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length)
    setTimeout(() => setIsTransitioning(false), 1000)
  }

  const goToSlide = (index) => {
    if (isTransitioning || index === currentIndex) return
    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => setIsTransitioning(false), 1000)
  }

  // Touch gestures
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const diffX = touchStartX.current - touchEndX.current
    const minSwipeDistance = 50
    if (Math.abs(diffX) > minSwipeDistance) {
      if (diffX > 0) nextSlide()
      else prevSlide()
    }
    touchStartX.current = 0
    touchEndX.current = 0
  }

  const currentMovie = slides[currentIndex]
  const viewDetails = () => currentMovie?.id && nav(`/movie/${currentMovie.id}`)

  if (loading) {
    return (
      <section className={`relative w-full bg-black ${className}`}>
        <div className="h-[75vh] animate-pulse bg-neutral-900" />
      </section>
    )
  }

  if (!slides.length) return null

  return (
    <section
      className={`relative w-full overflow-hidden bg-black ${className}`}
      style={{ paddingTop: 'calc(0.8 * var(--hdr-h, 64px))' }}
    >
      {/* Hero Image Container - 75vh + header height for overlap */}
      <div className="relative w-full h-[75vh]">
        {/* Background Images */}
        {slides.map((movie, idx) => {
          const bg = tmdbImg(movie.backdrop_path || movie.poster_path, 'original')
          return (
            <div 
              key={movie.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img 
                src={bg} 
                alt={movie.title} 
                className="absolute inset-0 h-full w-full object-cover" 
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </div>
          )
        })}

        {/* Enhanced Black Gradients - DON'T overlap with header gradient */}
        {/* Left side fade */}
        <div className="absolute inset-y-0 left-0 w-3/5 md:w-1/2 bg-gradient-to-r from-black/70 via-black/50 to-transparent z-20 pointer-events-none" />
        
        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-3/5 bg-gradient-to-t from-black via-black/85 to-transparent z-20 pointer-events-none" />

        {/* Content Overlay - STARTS AFTER HEADER */}
        <div 
          className="absolute inset-0 z-30 flex flex-col justify-end pb-12 md:pb-16"
          style={{ paddingTop: 'calc(var(--hdr-h, 64px) + 2rem)' }}
        >
          <div className="w-full px-4 md:px-12 lg:px-16">
            <div className="max-w-2xl">
              {/* Title */}
              <h1 className="text-white font-black tracking-tight leading-tight text-3xl sm:text-4xl md:text-5xl drop-shadow-2xl mb-2 line-clamp-2">
                {currentMovie?.title}
              </h1>

              {/* Meta Info */}
              <div className="flex items-center gap-2 mb-2 text-sm">
                {currentMovie?.vote_average && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 backdrop-blur-sm">
                    <span className="text-purple-300 font-bold text-sm">★</span>
                    <span className="text-purple-300 font-semibold text-xs">{currentMovie.vote_average.toFixed(1)}</span>
                  </div>
                )}
                {currentMovie?.release_date && (
                  <span className="text-white/90 font-semibold text-sm drop-shadow-md">
                    {new Date(currentMovie.release_date).getFullYear()}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded bg-white/10 text-white/80 text-xs font-semibold backdrop-blur-sm">HD</span>
              </div>

              {/* Overview */}
              {currentMovie?.overview && (
                <p className="hidden md:block text-white/90 text-sm leading-relaxed line-clamp-2 drop-shadow-lg mb-4 max-w-xl">
                  {currentMovie.overview}
                </p>
              )}

              {/* Single Button */}
              <button 
                onClick={viewDetails}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-500/20 shadow-xl shadow-purple-900/20 bg-gradient-to-r from-purple-600 to-pink-600"
              >
                <Info className="h-4 w-4" />
                <span>More Info</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Arrows (Desktop) */}
        <button 
          onClick={prevSlide} 
          disabled={isTransitioning}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-40 items-center justify-center h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm text-white/60 transition-all hover:bg-black/50 hover:text-white opacity-0 hover:opacity-100 active:scale-95 disabled:opacity-0 focus:outline-none group"
          aria-label="Previous slide"
        >
          <svg className="h-5 w-5 fill-none viewBox-0 0 24 24 stroke-current group-hover:-translate-x-0.5 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button 
          onClick={nextSlide} 
          disabled={isTransitioning}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-40 items-center justify-center h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm text-white/60 transition-all hover:bg-black/50 hover:text-white opacity-0 hover:opacity-100 active:scale-95 disabled:opacity-0 focus:outline-none group"
          aria-label="Next slide"
        >
          <svg className="h-5 w-5 fill-none viewBox-0 0 24 24 stroke-current group-hover:translate-x-0.5 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 md:bottom-6 right-4 md:right-8 z-40 flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1 rounded-full transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                idx === currentIndex 
                  ? 'w-8 bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50' 
                  : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
