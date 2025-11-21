// src/app/homepage/components/HeroSliderSection.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Info, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'

const tmdbImg = (p, s = 'original') => p ? `https://image.tmdb.org/t/p/${s}${p}` : ''

export default function HeroSliderSection({ className = '' }) {
  const [slides, setSlides] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [loading, setLoading] = useState(true)
  const [genres, setGenres] = useState({})
  const nav = useNavigate()
  const timerRef = useRef(null)
  const containerRef = useRef(null)

  // Fetch genres
  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${import.meta.env.VITE_TMDB_API_KEY}`)
      .then(r => r.json())
      .then(j => {
        const map = {}
        j.genres?.forEach(g => { map[g.id] = g.name })
        setGenres(map)
      })
      .catch(() => setGenres({}))
  }, [])

  // Fetch trending movies
  useEffect(() => {
    setLoading(true)
    fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US`)
      .then(r => r.json())
      .then(j => {
        const movies = j?.results?.slice(0, 8) ?? []
        setSlides(movies)
        setLoading(false)
      })
      .catch(() => {
        setSlides([])
        setLoading(false)
      })
  }, [])

  // Auto-advance
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
    setTimeout(() => setIsTransitioning(false), 600)
  }

  const prevSlide = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length)
    setTimeout(() => setIsTransitioning(false), 600)
  }

  const goToSlide = (index) => {
    if (isTransitioning || index === currentIndex) return
    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => setIsTransitioning(false), 600)
  }

  const currentMovie = slides[currentIndex]
  const nextMovies = slides.slice(currentIndex + 1, currentIndex + 4)
  if (nextMovies.length < 3) {
    nextMovies.push(...slides.slice(0, 3 - nextMovies.length))
  }

  const viewDetails = (id) => id && nav(`/movie/${id}`)

  if (loading) {
    return (
      <section className={`relative w-full bg-black ${className}`}>
        <div className="h-[60vh] md:h-[70vh] animate-pulse bg-neutral-900" />
      </section>
    )
  }

  if (!slides.length) return null

  return (
    <section 
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-black ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Prime Video Style Layout */}
      <div className="relative w-full h-[60vh] md:h-[70vh] flex items-center">
        
        {/* Background Blur Layer */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 transition-opacity duration-700"
            style={{
              backgroundImage: `url(${tmdbImg(currentMovie?.backdrop_path, 'w1280')})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(40px) brightness(0.4)',
              transform: 'scale(1.1)'
            }}
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/40" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full h-full px-4 md:px-8 lg:px-12 flex items-center">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            
            {/* Featured Movie - Left Side */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-4 md:space-y-5">
              
              {/* Title */}
              <h1 className="text-white font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight tracking-tight drop-shadow-2xl line-clamp-2">
                {currentMovie?.title}
              </h1>

              {/* Meta Row */}
              <div className="flex flex-wrap items-center gap-3 text-sm md:text-base">
                {/* Rating Badge */}
                {currentMovie?.vote_average > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 backdrop-blur-md">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-white font-bold">{currentMovie.vote_average.toFixed(1)}</span>
                  </div>
                )}
                
                {/* Year */}
                {currentMovie?.release_date && (
                  <span className="text-white/90 font-semibold">
                    {new Date(currentMovie.release_date).getFullYear()}
                  </span>
                )}

                {/* Genres */}
                <div className="hidden md:flex items-center gap-2">
                  {currentMovie?.genre_ids?.slice(0, 3).map(gid => (
                    <span key={gid} className="px-2.5 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium backdrop-blur-sm">
                      {genres[gid] || 'Unknown'}
                    </span>
                  ))}
                </div>
              </div>

              {/* Overview */}
              {currentMovie?.overview && (
                <p className="hidden md:block text-white/90 text-base lg:text-lg leading-relaxed line-clamp-3 max-w-2xl drop-shadow-lg">
                  {currentMovie.overview}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Primary CTA - Play/Watch */}
                <button 
                  onClick={() => viewDetails(currentMovie.id)}
                  className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm md:text-base transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-900/50 active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-500/50"
                >
                  <Play className="h-5 w-5 fill-current" />
                  <span>Watch Now</span>
                </button>

                {/* Secondary CTA - More Info */}
                <button 
                  onClick={() => viewDetails(currentMovie.id)}
                  className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-3.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold text-sm md:text-base border border-white/20 transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-white/30"
                >
                  <Info className="h-5 w-5" />
                  <span>More Info</span>
                </button>
              </div>
            </div>

            {/* Preview Thumbnails - Right Side (Desktop Only) */}
            <div className="hidden lg:flex lg:col-span-5 flex-col justify-center space-y-3">
              {nextMovies.map((movie, idx) => (
                <button
                  key={movie.id}
                  onClick={() => goToSlide((currentIndex + idx + 1) % slides.length)}
                  className="group relative w-full aspect-video rounded-lg overflow-hidden transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <img 
                    src={tmdbImg(movie.backdrop_path, 'w500')} 
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-100 group-hover:opacity-90 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white font-bold text-sm leading-tight line-clamp-1">{movie.title}</h3>
                    {movie.vote_average > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-yellow-400 text-xs font-semibold">{movie.vote_average.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button 
          onClick={prevSlide} 
          disabled={isTransitioning}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-black/50 backdrop-blur-md text-white/80 hover:bg-black/70 hover:text-white transition-all active:scale-90 disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          aria-label="Previous"
        >
          <ChevronLeft className="h-6 w-6 mx-auto" />
        </button>
        
        <button 
          onClick={nextSlide} 
          disabled={isTransitioning}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-black/50 backdrop-blur-md text-white/80 hover:bg-black/70 hover:text-white transition-all active:scale-90 disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          aria-label="Next"
        >
          <ChevronRight className="h-6 w-6 mx-auto" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1 rounded-full transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                idx === currentIndex 
                  ? 'w-10 bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50' 
                  : 'w-6 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
