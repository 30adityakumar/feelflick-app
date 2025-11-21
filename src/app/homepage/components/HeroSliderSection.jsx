// src/app/homepage/components/HeroSliderSection.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, Play, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'

const tmdbImg = (p, s = 'original') => p ? `https://image.tmdb.org/t/p/${s}${p}` : ''

export default function HeroSliderSection({ className = '' }) {
  const [slides, setSlides] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()
  const timerRef = useRef(null)

  // Fetch trending movies
  useEffect(() => {
    setLoading(true)
    fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US`)
      .then(r => r.json())
      .then(j => {
        const movies = j?.results?.slice(0, 7) ?? [] // Fetch a few more for the carousel feel
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
    timerRef.current = setInterval(() => handleNext(), 6000)
    return () => clearInterval(timerRef.current)
  }, [slides.length, currentIndex, isPaused])

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length)
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const handleManualChange = (index) => {
    setCurrentIndex(index)
  }

  if (loading) {
    return (
      <section className={`relative w-full h-[60vh] md:h-[70vh] bg-black flex items-center justify-center ${className}`}>
        <div className="w-full max-w-6xl mx-auto px-4 h-full flex items-center">
          <div className="w-full aspect-video rounded-3xl bg-white/5 animate-pulse ring-1 ring-white/10" />
        </div>
      </section>
    )
  }

  if (!slides.length) return null

  const currentMovie = slides[currentIndex]

  // Helper to determine slide position classes
  const getSlideStyles = (index) => {
    // Calculate circular distance
    const length = slides.length
    // We want to know "how far" this slide is from the current index, wrapping around
    let diff = (index - currentIndex + length) % length
    if (diff > length / 2) diff -= length // Handle negative wrapping

    // Active Slide
    if (diff === 0) {
      return "z-30 scale-100 opacity-100 translate-x-0 brightness-100 ring-1 ring-white/20 shadow-[0_0_50px_-10px_rgba(168,85,247,0.4)]"
    }
    // Next Slide (Peek Right)
    if (diff === 1) {
      return "z-20 scale-90 opacity-40 translate-x-[105%] md:translate-x-[85%] brightness-50 hover:opacity-60 hover:brightness-75 cursor-pointer"
    }
    // Prev Slide (Peek Left)
    if (diff === -1) {
      return "z-20 scale-90 opacity-40 -translate-x-[105%] md:-translate-x-[85%] brightness-50 hover:opacity-60 hover:brightness-75 cursor-pointer"
    }
    // Hidden Slides
    return "z-0 scale-75 opacity-0 translate-x-0"
  }

  return (
    <section 
      className={`relative w-full h-[60vh] md:h-[80vh] overflow-hidden bg-black flex flex-col justify-center group ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      
      {/* 1. Ambient Background Layer */}
      {/* We use the current movie's backdrop, heavily blurred, to create the atmosphere */}
      <div className="absolute inset-0 z-0 transition-opacity duration-700">
        <div 
          key={`bg-${currentMovie?.id}`}
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 opacity-40 blur-3xl scale-110"
          style={{ backgroundImage: `url(${tmdbImg(currentMovie?.backdrop_path)})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* 2. Carousel Container */}
      <div className="relative z-10 w-full max-w-[90rem] mx-auto h-[60%] md:h-[70%] perspective-[1000px]">
        <div className="relative w-full h-full flex items-center justify-center">
          
          {slides.map((movie, index) => {
            const positionStyles = getSlideStyles(index)
            const isActive = index === currentIndex
            
            // Handle clicking side cards to navigate
            const handleClick = () => {
              if (!isActive) handleManualChange(index)
            }

            return (
              <div
                key={movie.id}
                onClick={handleClick}
                className={`
                  absolute w-[85%] md:w-[65%] lg:w-[60%] aspect-video 
                  rounded-2xl md:rounded-3xl overflow-hidden 
                  transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                  bg-neutral-900
                  ${positionStyles}
                `}
              >
                {/* Card Image */}
                <img 
                  src={tmdbImg(movie.backdrop_path)} 
                  alt={movie.title} 
                  className="w-full h-full object-cover"
                />

                {/* Active Card Content Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-12 flex flex-col items-start gap-4">
                    
                    {/* Metadata Tags */}
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                      <div className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 backdrop-blur-md flex items-center gap-1.5">
                        <span className="text-purple-300 text-xs font-bold">★ {movie.vote_average?.toFixed(1)}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md text-white/90 text-xs font-medium border border-white/10">
                        {movie.release_date?.split('-')[0]}
                      </span>
                      <span className="hidden sm:inline px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md text-white/90 text-xs font-medium border border-white/10">
                        English
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-2xl max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                      {movie.title}
                    </h2>

                    {/* Overview (Desktop only) */}
                    <p className="hidden md:block text-white/80 text-sm md:text-base line-clamp-2 max-w-2xl drop-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                      {movie.overview}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
                      <button 
                        onClick={() => nav(`/movie/${movie.id}`)}
                        className="flex items-center gap-2 px-6 md:px-8 py-3 md:py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-lg shadow-purple-900/40 hover:scale-105 hover:shadow-purple-900/60 active:scale-95 transition-all group"
                      >
                        <Play className="h-4 w-4 md:h-5 md:w-5 fill-current" />
                        <span>Watch Now</span>
                      </button>
                      
                      <button 
                        onClick={() => nav(`/movie/${movie.id}`)}
                        className="flex items-center gap-2 px-4 md:px-6 py-3 md:py-3.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white font-semibold transition-all hover:scale-105 active:scale-95"
                      >
                        <Info className="h-4 w-4 md:h-5 md:w-5" />
                        <span className="hidden sm:inline">Details</span>
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Navigation Arrows */}
        <button 
          onClick={handlePrev}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-40 h-12 w-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button 
          onClick={handleNext}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 h-12 w-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

      </div>

      {/* Bottom Indicators */}
      <div className="absolute bottom-6 md:bottom-10 left-0 right-0 flex justify-center gap-2 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => handleManualChange(idx)}
            className={`
              h-1.5 rounded-full transition-all duration-500 
              ${idx === currentIndex 
                ? 'w-8 bg-gradient-to-r from-purple-500 to-pink-500 shadow-glow' 
                : 'w-2 bg-white/20 hover:bg-white/40'
              }
            `}
          />
        ))}
      </div>
    </section>
  )
}
