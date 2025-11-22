// src/app/homepage/components/HeroSliderSection.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, Plus, Check, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'

const tmdbImg = (p, s = 'original') => p ? `https://image.tmdb.org/t/p/${s}${p}` : ''

export default function HeroSliderSection({ className = '' }) {
  const [slides, setSlides] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // User Data
  const [user, setUser] = useState(null)
  // We store TMDB IDs in state for easy UI checking against the slide data (which uses TMDB IDs)
  const [watchlistTmdbIds, setWatchlistTmdbIds] = useState(new Set())
  const [watchedTmdbIds, setWatchedTmdbIds] = useState(new Set())
  
  // Swipe State
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [dragOffset, setDragOffset] = useState(0)
  
  const nav = useNavigate()
  const timerRef = useRef(null)

  // 1. Get User
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    })()
  }, [])

  // 2. Fetch Trending Movies & Sync Status
  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${import.meta.env.VITE_TMDB_API_KEY}`).then(r => r.json()),
      fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${import.meta.env.VITE_TMDB_API_KEY}`).then(r => r.json())
    ])
      .then(async ([moviesRes, genresRes]) => {
        const genreMap = new Map(genresRes.genres?.map(g => [g.id, g.name]) || [])
        const movies = moviesRes?.results?.slice(0, 5).map(m => ({
          ...m,
          genres: m.genre_ids?.slice(0, 3).map(id => genreMap.get(id)).filter(Boolean) || []
        })) || []
        
        setSlides(movies)

        // Sync Status with DB
        const { data: { user } } = await supabase.auth.getUser()
        if (user && movies.length > 0) {
          const tmdbIds = movies.map(m => m.id)

          // 1. Resolve TMDB IDs to Internal IDs
          const { data: dbMovies } = await supabase
            .from('movies')
            .select('id, tmdb_id')
            .in('tmdb_id', tmdbIds)

          if (dbMovies && dbMovies.length > 0) {
            const internalToTmdbMap = new Map(dbMovies.map(m => [m.id, m.tmdb_id]))
            const internalIds = dbMovies.map(m => m.id)

            // 2. Check Watchlist (using Internal IDs)
            const { data: wl } = await supabase
              .from('user_watchlist')
              .select('movie_id')
              .eq('user_id', user.id)
              .in('movie_id', internalIds)
            
            if (wl) {
              // Map back to TMDB IDs for UI state
              const foundTmdbIds = new Set(wl.map(w => internalToTmdbMap.get(w.movie_id)).filter(Boolean))
              setWatchlistTmdbIds(foundTmdbIds)
            }

            // 3. Check History (using Internal IDs)
            const { data: wh } = await supabase
              .from('movies_watched')
              .select('movie_id')
              .eq('user_id', user.id)
              .in('movie_id', internalIds)
            
            if (wh) {
              // Map back to TMDB IDs for UI state
              const foundTmdbIds = new Set(wh.map(w => internalToTmdbMap.get(w.movie_id)).filter(Boolean))
              setWatchedTmdbIds(foundTmdbIds)
            }
          }
        }
        
        setLoading(false)
      })
      .catch((err) => {
        console.error("Hero fetch error:", err)
        setSlides([])
        setLoading(false)
      })
  }, [])

  // Auto-advance
  useEffect(() => {
    if (!slides.length || isPaused || touchStart !== null) return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => nextSlide(), 8000)
    return () => clearInterval(timerRef.current)
  }, [slides.length, currentIndex, isPaused, touchStart])

  const nextSlide = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex(prev => (prev + 1) % slides.length)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const prevSlide = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const goToSlide = (index) => {
    if (isTransitioning || index === currentIndex) return
    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  // Swipe
  const minSwipeDistance = 50
  const onTouchStart = (e) => {
    setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); setDragOffset(0)
  }
  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
    if (touchStart !== null) setDragOffset(e.targetTouches[0].clientX - touchStart)
  }
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) { setTouchStart(null); setTouchEnd(null); setDragOffset(0); return }
    const distance = touchStart - touchEnd
    if (distance > minSwipeDistance) nextSlide()
    else if (distance < -minSwipeDistance) prevSlide()
    setTouchStart(null); setTouchEnd(null); setDragOffset(0)
  }

  // --------------------------------------------------
  // HELPER: Get Internal ID from TMDB ID (Upsert if needed)
  // --------------------------------------------------
  const getInternalMovieId = async (movie) => {
    // Try to find existing movie by TMDB ID
    const { data: existing } = await supabase
      .from('movies')
      .select('id')
      .eq('tmdb_id', movie.id)
      .maybeSingle()

    if (existing) return existing.id

    // If not found, insert it
    const { data: inserted, error } = await supabase
      .from('movies')
      .insert({
        tmdb_id: movie.id,
        title: movie.title,
        original_title: movie.original_title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        release_date: movie.release_date || null,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        popularity: movie.popularity,
        original_language: movie.original_language,
        json_data: movie
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('Error inserting movie:', error)
      return null
    }
    return inserted.id
  }

  // --------------------------------------------------
  // ACTIONS
  // --------------------------------------------------
  
  const currentMovie = slides[currentIndex]
  const isInWatchlist = currentMovie?.id && watchlistTmdbIds.has(currentMovie.id)
  const isWatched = currentMovie?.id && watchedTmdbIds.has(currentMovie.id)

  const handleViewDetails = () => {
    if (currentMovie?.id) nav(`/movie/${currentMovie.id}`)
  }

  const toggleWatchlist = async () => {
    if (!user || !currentMovie?.id) return
    const movie = currentMovie
    const tmdbId = movie.id
    
    if (isInWatchlist) {
      // REMOVE logic
      setWatchlistTmdbIds(prev => { const n = new Set(prev); n.delete(tmdbId); return n })
      
      // We need the internal ID to delete
      const { data: dbMovie } = await supabase.from('movies').select('id').eq('tmdb_id', tmdbId).single()
      if (dbMovie) {
        await supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', dbMovie.id)
      }
    } else {
      // ADD logic
      setWatchlistTmdbIds(prev => new Set(prev).add(tmdbId))
      setWatchedTmdbIds(prev => { const n = new Set(prev); n.delete(tmdbId); return n }) // Optimistic remove from watched

      const internalId = await getInternalMovieId(movie)
      if (internalId) {
        await Promise.all([
          supabase.from('user_watchlist').upsert({ 
            user_id: user.id, 
            movie_id: internalId, // Store INTERNAL ID
            added_at: new Date().toISOString(), 
            status: 'want_to_watch' 
          }, { onConflict: 'user_id, movie_id' }),
          
          supabase.from('movies_watched').delete().eq('user_id', user.id).eq('movie_id', internalId)
        ])
      }
    }
  }

  const toggleWatched = async () => {
    if (!user || !currentMovie?.id) return
    const movie = currentMovie
    const tmdbId = movie.id

    if (isWatched) {
      // REMOVE logic
      setWatchedTmdbIds(prev => { const n = new Set(prev); n.delete(tmdbId); return n })
      
      const { data: dbMovie } = await supabase.from('movies').select('id').eq('tmdb_id', tmdbId).single()
      if (dbMovie) {
        await supabase.from('movies_watched').delete().eq('user_id', user.id).eq('movie_id', dbMovie.id)
      }
    } else {
      // ADD logic
      setWatchedTmdbIds(prev => new Set(prev).add(tmdbId))
      setWatchlistTmdbIds(prev => { const n = new Set(prev); n.delete(tmdbId); return n }) // Optimistic remove from watchlist
      
      const internalId = await getInternalMovieId(movie)
      if (internalId) {
        await Promise.all([
          supabase.from('movies_watched').upsert({
            user_id: user.id,
            movie_id: internalId, // Store INTERNAL ID
            title: movie.title,
            poster: movie.poster_path,
            release_date: movie.release_date || null,
            vote_average: movie.vote_average,
            genre_ids: movie.genre_ids,
            watched_at: new Date().toISOString(),
            source: 'hero_slider'
          }, { onConflict: 'user_id, movie_id' }),
          
          supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', internalId)
        ])
      }
    }
  }

  if (loading) {
    return (
      <section className={`relative w-full bg-black ${className}`}>
        <div className="h-[80vh] animate-pulse bg-neutral-900" />
      </section>
    )
  }

  if (!slides.length) return null

  return (
    <section 
      className={`relative w-full overflow-hidden bg-black ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative w-full h-[75vh] sm:h-[80vh] min-h-[500px]">
        <div 
          className="relative w-full h-full"
          style={{
             transform: touchStart !== null ? `translateX(${dragOffset}px)` : 'translateX(0)',
             transition: touchStart !== null ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          {slides.map((movie, idx) => {
            const bg = tmdbImg(movie.backdrop_path || movie.poster_path, 'original')
            let opacityClass = 'opacity-0 z-0 scale-105'
            if (idx === currentIndex) opacityClass = 'opacity-100 z-10 scale-100'
            
            return (
              <div 
                key={movie.id}
                className={`absolute inset-0 transition-all duration-500 ease-out ${opacityClass}`}
              >
                <img 
                  src={bg} 
                  alt={movie.title} 
                  className="absolute inset-0 h-full w-full object-cover pointer-events-none select-none"
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              </div>
            )
          })}
        </div>

        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/90 to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 left-0 w-full md:w-2/5 bg-gradient-to-r from-black via-black/50 to-transparent z-20 pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-2/3 bg-gradient-to-t from-black via-black/80 to-transparent z-20 pointer-events-none" />

        <div className="absolute inset-0 z-30 flex flex-col justify-end pb-12 md:pb-16 lg:pb-20 pt-20 pointer-events-none">
          <div className="w-full px-4 md:px-12 lg:px-16 xl:px-20 pointer-events-auto">
            <div className="max-w-3xl">
              <h1 className="text-white font-black tracking-tight leading-[0.95] text-3xl sm:text-4xl md:text-5xl lg:text-6xl drop-shadow-2xl mb-3 md:mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {currentMovie?.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3 md:mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                {currentMovie?.vote_average > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 backdrop-blur-md shadow-lg">
                    <span className="text-purple-300 text-xs md:text-sm font-bold">★</span>
                    <span className="text-white font-bold text-[10px] md:text-xs">{currentMovie.vote_average.toFixed(1)}</span>
                  </div>
                )}
                {currentMovie?.release_date && (
                  <span className="text-white/90 font-bold text-xs md:text-sm drop-shadow-lg">
                    {new Date(currentMovie.release_date).getFullYear()}
                  </span>
                )}
                <span className="px-1.5 py-0.5 rounded border border-white/30 text-white/90 text-[10px] font-bold backdrop-blur-sm">4K</span>
                {currentMovie?.genres?.slice(0, 2).map(genre => (
                  <span key={genre} className="text-white/80 text-xs font-medium drop-shadow-md">{genre}</span>
                ))}
              </div>

              {currentMovie?.overview && (
                <p className="hidden md:block text-white/90 text-sm leading-relaxed line-clamp-3 drop-shadow-xl mb-5 md:mb-6 max-w-xl font-medium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                  {currentMovie.overview}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                <button 
                  onClick={handleViewDetails}
                  className="group inline-flex items-center justify-center gap-2 rounded-lg md:rounded-xl px-6 py-2.5 md:py-3 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-500/30 shadow-2xl shadow-purple-900/40 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                >
                  <Info className="h-4 w-4 fill-white group-hover:scale-110 transition-transform" />
                  <span>View Details</span>
                </button>

                {user && (
                  <>
                    <div className="relative group/tooltip">
                      <button onClick={toggleWatchlist} className={`inline-flex items-center justify-center h-[42px] md:h-[48px] w-[42px] md:w-[48px] rounded-lg md:rounded-xl text-white transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-white/20 backdrop-blur-md border shadow-xl ${isInWatchlist ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-white/10 hover:bg-white/20 border-white/20'}`}>
                        {isInWatchlist ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </button>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-black/80 rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                      </span>
                    </div>

                    <div className="relative group/tooltip">
                      <button onClick={toggleWatched} className={`inline-flex items-center justify-center h-[42px] md:h-[48px] w-[42px] md:w-[48px] rounded-lg md:rounded-xl text-white transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-white/20 backdrop-blur-md border shadow-xl ${isWatched ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-white/10 hover:bg-white/20 border-white/20'}`}>
                        {isWatched ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                      </button>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-black/80 rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {isWatched ? 'Mark as Unwatched' : 'Already Watched'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <button onClick={prevSlide} disabled={isTransitioning} className="hidden lg:flex absolute left-4 xl:left-8 top-1/2 -translate-y-1/2 z-40 items-center justify-center h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm text-white/60 transition-all hover:bg-black/60 hover:text-white opacity-0 hover:opacity-100 group-hover:opacity-100 active:scale-95 disabled:opacity-0 focus:outline-none group">
          <svg className="h-6 w-6 stroke-current stroke-[2.5]" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button onClick={nextSlide} disabled={isTransitioning} className="hidden lg:flex absolute right-4 xl:right-8 top-1/2 -translate-y-1/2 z-40 items-center justify-center h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm text-white/60 transition-all hover:bg-black/60 hover:text-white opacity-0 hover:opacity-100 group-hover:opacity-100 active:scale-95 disabled:opacity-0 focus:outline-none group">
          <svg className="h-6 w-6 stroke-current stroke-[2.5]" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>

        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
          {slides.map((_, idx) => (
            <button key={idx} onClick={() => goToSlide(idx)} aria-label={`Go to slide ${idx + 1}`} className={`transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full ${idx === currentIndex ? 'h-1.5 w-8 bg-white shadow-lg shadow-white/30' : 'h-1.5 w-1.5 bg-white/40 hover:bg-white/70 hover:w-2'}`} />
          ))}
        </div>
      </div>
    </section>
  )
}
