// src/app/homepage/components/HeroSliderSection.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Info } from 'lucide-react'

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

  useEffect(() => {
    if (!slides.length || isPaused) return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => nextSlide(), 6000)
    return () => clearInterval(timerRef.current)
  }, [slides.length, currentIndex, isPaused])

  const nextSlide = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex(prev => (prev + 1) % slides.length)
    setTimeout(() => setIsTransitioning(false), 700)
  }

  const prevSlide = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length)
    setTimeout(() => setIsTransitioning(false), 700)
  }

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      diff > 0 ? nextSlide() : prevSlide()
    }
  }

  if (loading) {
    return (
      <section className={`relative w-full overflow-hidden bg-black ${className}`}>
        {/* Black overlay to match header height */}
        <div 
          className="absolute top-0 left-0 right-0 bg-black z-10"
          style={{ height: 'var(--hdr-h, 64px)' }}
        />
        <div className="relative w-full h-[70vh] sm:h-[80vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-purple-500" />
        </div>
      </section>
    )
  }

  if (!slides.length) {
    return (
      <section className={`relative w-full overflow-hidden bg-black ${className}`}>
        {/* Black overlay to match header height */}
        <div 
          className="absolute top-0 left-0 right-0 bg-black z-10"
          style={{ height: 'var(--hdr-h, 64px)' }}
        />
        <div className="relative w-full h-[70vh] sm:h-[80vh] flex items-center justify-center">
          <p className="text-white/50">No trending movies available</p>
        </div>
      </section>
    )
  }

  const current = slides[currentIndex]

  return (
    <section 
      className={`relative w-full overflow-hidden bg-black ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Black overlay at top to match header - ensures content doesn't peek through */}
      <div 
        className="absolute top-0 left-0 right-0 bg-black z-10"
        style={{ height: 'var(--hdr-h, 64px)' }}
      />

      {/* Slide Container */}
      <div className="relative w-full h-[70vh] sm:h-[80vh]">
        {slides.map((slide, idx) => {
          const isActive = idx === currentIndex
          const backdrop = tmdbImg(slide.backdrop_path, 'original')
          const poster = tmdbImg(slide.poster_path, 'w500')

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
              }`}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={backdrop || poster}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                {/* Multi-layer gradient for cinematic depth */}
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <div className="absolute inset-0 bg-black/20" />
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-0 flex items-center">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
                  <div className="max-w-2xl space-y-6 animate-fade-in">
                    {/* Title */}
                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-tight drop-shadow-2xl">
                      {slide.title}
                    </h1>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-sm sm:text-base">
                      <span className="px-3 py-1 rounded-full bg-purple-500/90 text-white font-bold shadow-lg">
                        {slide.vote_average ? slide.vote_average.toFixed(1) : 'N/A'}
                      </span>
                      <span className="text-white/80 font-medium">
                        {slide.release_date?.slice(0, 4) || 'Unknown'}
                      </span>
                    </div>

                    {/* Overview */}
                    <p className="text-base sm:text-lg text-white/90 leading-relaxed line-clamp-3 drop-shadow-lg">
                      {slide.overview || 'No description available.'}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4 pt-2">
                      <button
                        onClick={() => nav(`/movie/${slide.id}`)}
                        className="group flex items-center gap-3 px-8 py-3.5 rounded-full bg-white text-black font-bold text-base shadow-2xl hover:bg-white/90 transition-all hover:scale-105 active:scale-95"
                      >
                        <Play className="h-5 w-5 fill-current" />
                        Watch Now
                      </button>
                      <button
                        onClick={() => nav(`/movie/${slide.id}`)}
                        className="flex items-center gap-3 px-8 py-3.5 rounded-full bg-white/20 backdrop-blur-sm text-white font-bold text-base border-2 border-white/30 hover:bg-white/30 hover:border-white/50 transition-all hover:scale-105 active:scale-95"
                      >
                        <Info className="h-5 w-5" />
                        More Info
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (!isTransitioning) {
                setIsTransitioning(true)
                setCurrentIndex(idx)
                setTimeout(() => setIsTransitioning(false), 700)
              }
            }}
            className={`transition-all duration-300 rounded-full ${
              idx === currentIndex
                ? 'w-10 h-2 bg-gradient-to-r from-purple-500 to-pink-500'
                : 'w-2 h-2 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Navigation Arrows (Desktop) */}
      <button
        onClick={prevSlide}
        disabled={isTransitioning}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 items-center justify-center h-12 w-12 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110"
        aria-label="Previous slide"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        disabled={isTransitioning}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 items-center justify-center h-12 w-12 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110"
        aria-label="Next slide"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </section>
  )
}
