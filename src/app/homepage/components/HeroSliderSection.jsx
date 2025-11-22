// src/app/homepage/components/HeroSliderSection.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, Plus, Check, Eye } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'

const tmdbImg = (p, s = 'original') => p ? `https://image.tmdb.org/t/p/${s}${p}` : ''

export default function HeroSliderSection({ className = '' }) {
  const [slides, setSlides] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [watchlistIds, setWatchlistIds] = useState(new Set())
  const [watchedIds, setWatchedIds] = useState(new Set())
  const nav = useNavigate()
  const timerRef = useRef(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  // Get user, watchlist, and watch history
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Fetch watchlist
        const { data: watchlistData } = await supabase
          .from('user_watchlist')
          .select('movie_id')
          .eq('user_id', user.id)
        if (watchlistData) setWatchlistIds(new Set(watchlistData.map(item => item.movie_id)))

        // Fetch watch history
        const { data: historyData } = await supabase
          .from('user_history')
          .select('movie_id')
          .eq('user_id', user.id)
        if (historyData) setWatchedIds(new Set(historyData.map(item => item.movie_id)))
      }
    })()
  }, [])

  // Fetch trending movies with genres
  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${import.meta.env.VITE_TMDB_API_KEY}`).then(r => r.json()),
      fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${import.meta.env.VITE_TMDB_API_KEY}`).then(r => r.json())
    ])
      .then(([moviesRes, genresRes]) => {
        const genreMap = new Map(genresRes.genres?.map(g => [g.id, g.name]) || [])
        const movies = moviesRes?.results?.slice(0, 5).map(m => ({
          ...m,
          genres: m.genre_ids?.slice(0, 3).map(id => genreMap.get(id)).filter(Boolean) || []
        })) || []
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
    timerRef.current = setInterval(() => nextSlide(), 8000)
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
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) nextSlide()
      else prevSlide()
    }
  }

  // Actions
  const currentMovie = slides[currentIndex]
  const isInWatchlist = currentMovie?.id && watchlistIds.has(currentMovie.id)
  const isWatched = currentMovie?.id && watchedIds.has(currentMovie.id)

  const handleViewDetails = () => {
    if (currentMovie?.id) nav(`/movie/${currentMovie.id}`)
  }

  const toggleWatchlist = async () => {
    if (!user || !currentMovie?.id) return
    const movieId = currentMovie.id
    
    if (isInWatchlist) {
      await supabase
        .from('user_watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId)
      setWatchlistIds(prev => {
        const next = new Set(prev)
        next.delete(movieId)
        return next
      })
    } else {
      await supabase
        .from('user_watchlist')
        .upsert({
          user_id: user.id,
          movie_id: movieId,
          added_at: new Date().toISOString()
        })
      setWatchlistIds(prev => new Set(prev).add(movieId))
    }
  }

  const toggleWatched = async () => {
    if (!user || !currentMovie?.id) return
    const movieId = currentMovie.id
    
    if (isWatched) {
      await supabase
        .from('user_history')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId)
      setWatchedIds(prev => {
        const next = new Set(prev)
        next.delete(movieId)
        return next
      })
    } else {
      await supabase
        .from('user_history')
        .upsert({
          user_id: user.id,
          movie_id: movieId,
          watched_at: new Date().toISOString()
        })
      setWatchedIds(prev => new Set(prev).add(movieId))
    }
  }

  if (loading) {
    return (
      <section className={`relative w-full bg-black ${className}`}>
        <div className="h-[90vh] animate-pulse bg-neutral-900" />
      </section>
    )
  }

  if (!slides.length) return null

  return (
    <section 
      className={`relative w-full overflow-hidden bg-black ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Hero Container - 90vh for more immersive feel */}
      <div className="relative w-full h-[90vh] min-h-[600px]">
        {/* Background Images with Ken Burns effect */}
        {slides.map((movie, idx) => {
          const bg = tmdbImg(movie.backdrop_path || movie.poster_path, 'original')
          return (
            <div 
              key={movie.id}
              className={`absolute inset-0 transition-all duration-1000 ease-out ${
                idx === currentIndex 
                  ? 'opacity-100 z-10 scale-100' 
                  : 'opacity-0 z-0 scale-105'
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

        {/* Enhanced Cinematic Gradients */}
        <div className="absolute top-0 inset-x-0 h-32 md:h-40 bg-gradient-to-b from-black via-black/80 to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 left-0 w-full md:w-3/5 bg-gradient-to-r from-black via-black/70 md:via-black/40 to-transparent z-20 pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-4/5 bg-gradient-to-t from-black via-black/90 to-transparent z-20 pointer-events-none" />

        {/* Content Overlay */}
        <div className="absolute inset-0 z-30 flex flex-col justify-end pb-16 md:pb-20 lg:pb-24 pt-24">
          <div className="w-full px-4 md:px-12 lg:px-16 xl:px-20">
            <div className="max-w-3xl">
              {/* Title */}
              <h1 className="text-white font-black tracking-tight leading-[0.95] text-4xl sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-2xl mb-4 md:mb-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {currentMovie?.title}
              </h1>

              {/* Meta Info Row */}
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                {/* Rating Badge */}
                {currentMovie?.vote_average > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 backdrop-blur-md shadow-lg">
                    <span className="text-purple-300 text-base font-bold">★</span>
                    <span className="text-white font-bold text-sm">{currentMovie.vote_average.toFixed(1)}</span>
                  </div>
                )}

                {/* Year */}
                {currentMovie?.release_date && (
                  <span className="text-white/90 font-bold text-base drop-shadow-lg">
                    {new Date(currentMovie.release_date).getFullYear()}
                  </span>
                )}

                {/* Quality Badge */}
                <span className="px-2 py-0.5 rounded border border-white/30 text-white/90 text-xs font-bold backdrop-blur-sm">
                  4K
                </span>

                {/* Genres */}
                {currentMovie?.genres?.slice(0, 2).map(genre => (
                  <span 
                    key={genre}
                    className="text-white/80 text-sm font-medium drop-shadow-md"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* Overview */}
              {currentMovie?.overview && (
                <p className="hidden md:block text-white/95 text-base md:text-lg leading-relaxed line-clamp-3 drop-shadow-xl mb-6 md:mb-7 max-w-2xl font-medium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                  {currentMovie.overview}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                {/* Primary CTA - View Details */}
                <button 
                  onClick={handleViewDetails}
                  className="group inline-flex items-center justify-center gap-2 md:gap-2.5 rounded-lg md:rounded-xl px-6 md:px-8 py-3 md:py-3.5 text-sm md:text-base font-bold text-white transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-500/30 shadow-2xl shadow-purple-900/40 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                >
                  <Info className="h-4 w-4 md:h-5 md:w-5 group-hover:scale-110 transition-transform" />
                  <span>View Details</span>
                </button>

                {/* Watchlist Toggle */}
                {user && (
                  <div className="relative group/tooltip">
                    <button 
                      onClick={toggleWatchlist}
                      className="inline-flex items-center justify-center h-[48px] md:h-[52px] w-[48px] md:w-[52px] rounded-lg md:rounded-xl text-white transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-white/20 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 shadow-xl"
                      aria-label={isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                    >
                      {isInWatchlist ? (
                        <Check className="h-5 w-5 md:h-6 md:w-6" />
                      ) : (
                        <Plus className="h-5 w-5 md:h-6 md:w-6" />
                      )}
                    </button>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black/90 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity duration-200 backdrop-blur-sm">
                      {isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/90"></div>
                    </div>
                  </div>
                )}

                {/* Already Watched Toggle */}
                {user && (
                  <div className="relative group/tooltip">
                    <button 
                      onClick={toggleWatched}
                      className="inline-flex items-center justify-center h-[48px] md:h-[52px] w-[48px] md:w-[52px] rounded-lg md:rounded-xl text-white transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-white/20 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 shadow-xl"
                      aria-label={isWatched ? "Mark as Unwatched" : "Mark as Watched"}
                    >
                      <Eye className={`h-5 w-5 md:h-6 md:w-6 ${isWatched ? 'fill-white' : ''}`} />
                    </button>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black/90 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity duration-200 backdrop-blur-sm">
                      {isWatched ? "Mark as Unwatched" : "Mark as Watched"}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/90"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button 
          onClick={prevSlide} 
          disabled={isTransitioning}
          className="hidden lg:flex absolute left-4 xl:left-8 top-1/2 -translate-y-1/2 z-40 items-center justify-center h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm text-white/60 transition-all hover:bg-black/60 hover:text-white opacity-0 hover:opacity-100 group-hover:opacity-100 active:scale-95 disabled:opacity-0 focus:outline-none group"
          aria-label="Previous slide"
        >
          <svg className="h-6 w-6 stroke-current stroke-[2.5]" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button 
          onClick={nextSlide} 
          disabled={isTransitioning}
          className="hidden lg:flex absolute right-4 xl:right-8 top-1/2 -translate-y-1/2 z-40 items-center justify-center h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm text-white/60 transition-all hover:bg-black/60 hover:text-white opacity-0 hover:opacity-100 group-hover:opacity-100 active:scale-95 disabled:opacity-0 focus:outline-none group"
          aria-label="Next slide"
        >
          <svg className="h-6 w-6 stroke-current stroke-[2.5]" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full ${
                idx === currentIndex 
                  ? 'h-1.5 w-8 bg-white shadow-lg shadow-white/30' 
                  : 'h-1.5 w-1.5 bg-white/40 hover:bg-white/70 hover:w-2'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
