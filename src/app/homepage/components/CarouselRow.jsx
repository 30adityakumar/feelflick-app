// src/app/homepage/components/CarouselRow.jsx
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Check, Eye, EyeOff, Info } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'

const tmdbImg = (p, s = 'w500') => p ? `https://image.tmdb.org/t/p/${s}${p}` : ''

export default function CarouselRow({ title, tmdbCategory, rowId }) {
  const [movies, setMovies] = useState([])
  const [user, setUser] = useState(null)
  const [watchlistTmdbIds, setWatchlistTmdbIds] = useState(new Set())
  const [watchedTmdbIds, setWatchedTmdbIds] = useState(new Set())
  const [hoveredMovie, setHoveredMovie] = useState(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [genres, setGenres] = useState({})
  const [showExpandedContent, setShowExpandedContent] = useState(false)
  
  const scrollContainerRef = useRef(null)
  const hoverTimeoutRef = useRef(null)
  const contentTimeoutRef = useRef(null)
  const nav = useNavigate()

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    })()
  }, [])

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${import.meta.env.VITE_TMDB_API_KEY}`)
      .then(r => r.json())
      .then(data => {
        const genreMap = {}
        data.genres?.forEach(g => { genreMap[g.id] = g.name })
        setGenres(genreMap)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${tmdbCategory}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US&page=1`
        )
        const data = await res.json()
        setMovies(data.results || [])

        const { data: { user } } = await supabase.auth.getUser()
        if (user && data.results?.length > 0) {
          const tmdbIds = data.results.map(m => m.id)

          const { data: wl } = await supabase.from('user_watchlist').select('movie_id').eq('user_id', user.id).in('movie_id', tmdbIds)
          if (wl) setWatchlistTmdbIds(new Set(wl.map(w => w.movie_id)))

          const { data: wh } = await supabase.from('movies_watched').select('movie_id').eq('user_id', user.id).in('movie_id', tmdbIds)
          if (wh) setWatchedTmdbIds(new Set(wh.map(w => w.movie_id)))
        }
      } catch (error) {
        console.error('Error fetching movies:', error)
      }
    }

    fetchMovies()
  }, [tmdbCategory])

  const scroll = (direction) => {
    const container = scrollContainerRef.current
    if (!container) return
    const scrollAmount = container.clientWidth * 0.85
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min(container.scrollWidth - container.clientWidth, scrollPosition + scrollAmount)
    container.scrollTo({ left: newPosition, behavior: 'smooth' })
    setScrollPosition(newPosition)
  }

  const handleScroll = () => {
    if (scrollContainerRef.current) setScrollPosition(scrollContainerRef.current.scrollLeft)
  }

  const ensureMovieInDb = async (movie) => {
    await supabase.from('movies').upsert({
      tmdb_id: movie.id, title: movie.title, original_title: movie.original_title,
      overview: movie.overview, poster_path: movie.poster_path, backdrop_path: movie.backdrop_path,
      release_date: movie.release_date || null, vote_average: movie.vote_average,
      vote_count: movie.vote_count, popularity: movie.popularity,
      original_language: movie.original_language, json_data: movie
    }, { onConflict: 'tmdb_id' })
  }

  const toggleWatchlist = async (e, movie) => {
    e.stopPropagation()
    if (!user) return
    const tmdbId = movie.id
    const isInWatchlist = watchlistTmdbIds.has(tmdbId)

    if (isInWatchlist) {
      setWatchlistTmdbIds(prev => { const n = new Set(prev); n.delete(tmdbId); return n })
      await supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', tmdbId)
    } else {
      setWatchlistTmdbIds(prev => new Set(prev).add(tmdbId))
      setWatchedTmdbIds(prev => { const n = new Set(prev); n.delete(tmdbId); return n })
      await ensureMovieInDb(movie)
      await Promise.all([
        supabase.from('user_watchlist').upsert({ 
          user_id: user.id, movie_id: tmdbId, added_at: new Date().toISOString(), status: 'want_to_watch' 
        }, { onConflict: 'user_id,movie_id' }),
        supabase.from('movies_watched').delete().eq('user_id', user.id).eq('movie_id', tmdbId)
      ])
    }
  }

  const toggleWatched = async (e, movie) => {
    e.stopPropagation()
    if (!user) return
    const tmdbId = movie.id
    const isWatched = watchedTmdbIds.has(tmdbId)

    if (isWatched) {
      setWatchedTmdbIds(prev => { const n = new Set(prev); n.delete(tmdbId); return n })
      await supabase.from('movies_watched').delete().eq('user_id', user.id).eq('movie_id', tmdbId)
    } else {
      setWatchedTmdbIds(prev => new Set(prev).add(tmdbId))
      setWatchlistTmdbIds(prev => { const n = new Set(prev); n.delete(tmdbId); return n })
      await ensureMovieInDb(movie)
      await Promise.all([
        supabase.from('movies_watched').upsert({
          user_id: user.id, movie_id: tmdbId, title: movie.title, poster: movie.poster_path,
          release_date: movie.release_date || null, vote_average: movie.vote_average,
          genre_ids: movie.genre_ids, watched_at: new Date().toISOString(), source: 'carousel_row'
        }, { onConflict: 'user_id,movie_id' }),
        supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', tmdbId)
      ])
    }
  }

  const handleMouseEnter = (movie) => {
    clearTimeout(hoverTimeoutRef.current)
    clearTimeout(contentTimeoutRef.current)
    
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredMovie(movie.id)
      // Staged animation: content appears after scale animation
      contentTimeoutRef.current = setTimeout(() => {
        setShowExpandedContent(true)
      }, 250)
    }, 400)
  }

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeoutRef.current)
    clearTimeout(contentTimeoutRef.current)
    setShowExpandedContent(false)
    setTimeout(() => setHoveredMovie(null), 100)
  }

  const canScrollLeft = scrollPosition > 5
  const canScrollRight = scrollContainerRef.current 
    ? scrollPosition < scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth - 5
    : false

  if (!movies.length) return null

  return (
    <div className="relative mb-6 md:mb-8 lg:mb-12">
      {/* Section Title */}
      <h2 className="text-white text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-5 px-4 md:px-12 lg:px-16 tracking-tight">
        {title}
      </h2>

      {/* Carousel Container */}
      <div className="relative group/carousel">
        {/* Navigation Arrows */}
        {canScrollLeft && (
          <button 
            onClick={() => scroll('left')} 
            className="absolute left-0 md:left-2 top-0 bottom-0 z-40 w-12 md:w-16 bg-gradient-to-r from-black/90 via-black/70 to-transparent flex items-center justify-start pl-2 md:pl-4 text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hover:from-black" 
            aria-label="Scroll left"
          >
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/60 hover:scale-110 transition-all duration-200">
              <ChevronLeft className="h-6 w-6 md:h-7 md:w-7" />
            </div>
          </button>
        )}

        {canScrollRight && (
          <button 
            onClick={() => scroll('right')} 
            className="absolute right-0 md:right-2 top-0 bottom-0 z-40 w-12 md:w-16 bg-gradient-to-l from-black/90 via-black/70 to-transparent flex items-center justify-end pr-2 md:pr-4 text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hover:from-black" 
            aria-label="Scroll right"
          >
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/60 hover:scale-110 transition-all duration-200">
              <ChevronRight className="h-6 w-6 md:h-7 md:w-7" />
            </div>
          </button>
        )}

        {/* Movies Scroll Container */}
        <div 
          ref={scrollContainerRef} 
          onScroll={handleScroll}
          className="flex gap-1.5 md:gap-2 overflow-x-scroll scrollbar-hide px-4 md:px-12 lg:px-16 scroll-smooth py-16 md:py-20" 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map((movie, index) => {
            const isInWatchlist = watchlistTmdbIds.has(movie.id)
            const isWatched = watchedTmdbIds.has(movie.id)
            const isHovered = hoveredMovie === movie.id
            const movieGenres = movie.genre_ids?.slice(0, 3).map(id => genres[id]).filter(Boolean) || []

            return (
              <div
                key={`${rowId}-${movie.id}`}
                className="relative flex-shrink-0 w-[140px] md:w-[180px] lg:w-[200px] group/card"
                style={{
                  transform: isHovered ? 'scale(1.5) translateY(-10px)' : 'scale(1)',
                  transformOrigin: 'center center',
                  transition: 'transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  zIndex: isHovered ? 50 : 1,
                  marginLeft: isHovered ? '60px' : '0',
                  marginRight: isHovered ? '60px' : '0',
                  transitionProperty: 'transform, margin',
                  transitionDuration: '350ms, 350ms',
                  transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1), ease-out'
                }}
                onMouseEnter={() => handleMouseEnter(movie)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Movie Card */}
                <div 
                  className={`relative rounded-lg overflow-hidden cursor-pointer bg-neutral-900 ${
                    isHovered ? 'shadow-2xl shadow-black/60' : 'shadow-lg shadow-black/30'
                  }`}
                  style={{
                    transition: 'box-shadow 350ms cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                  onClick={() => nav(`/movie/${movie.id}`)}
                >
                  {/* Poster Container */}
                  <div className="relative aspect-[2/3] overflow-hidden">
                    {/* Main Poster Image */}
                    <img 
                      src={tmdbImg(movie.poster_path, isHovered ? 'w780' : 'w500')} 
                      alt={movie.title} 
                      className="w-full h-full object-cover transition-opacity duration-300"
                      loading="lazy"
                    />

                    {/* Multi-layer Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
                    
                    {/* Rating Badge - Top Right */}
                    <div className={`absolute top-2 right-2 transition-all duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                      {movie.vote_average > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-br from-purple-600/95 to-pink-600/95 backdrop-blur-md shadow-xl border border-white/10">
                          <span className="text-white text-xs font-bold">★</span>
                          <span className="text-white text-xs font-bold">{movie.vote_average.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Info Panel - Prime Video Style */}
                  {isHovered && (
                    <div 
                      className={`absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black via-black/95 to-black/40 transition-opacity duration-200 ${
                        showExpandedContent ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {/* Title */}
                      <h3 className="text-white text-base md:text-lg font-bold mb-2 line-clamp-2 leading-tight drop-shadow-lg">
                        {movie.title}
                      </h3>

                      {/* Meta Row */}
                      <div className="flex items-center gap-2 mb-2.5 text-xs md:text-sm">
                        {/* Rating with gradient */}
                        {movie.vote_average > 0 && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/30 backdrop-blur-sm">
                            <span className="text-purple-300 font-bold">★</span>
                            <span className="text-white font-bold">{movie.vote_average.toFixed(1)}</span>
                          </div>
                        )}
                        
                        {/* Year */}
                        {movie.release_date && (
                          <span className="text-white/90 font-semibold">
                            {new Date(movie.release_date).getFullYear()}
                          </span>
                        )}

                        {/* Quality Badge */}
                        <span className="px-1.5 py-0.5 rounded border border-white/30 text-white/80 text-[10px] font-bold">
                          HD
                        </span>
                      </div>

                      {/* Genres */}
                      {movieGenres.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {movieGenres.map(genre => (
                            <span 
                              key={genre} 
                              className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 text-[10px] md:text-xs font-medium backdrop-blur-sm border border-white/10 transition-colors"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Description */}
                      {movie.overview && (
                        <p className="text-white/80 text-[11px] md:text-xs leading-relaxed line-clamp-3 mb-3">
                          {movie.overview}
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {/* Primary CTA - View Details */}
                        <button
                          onClick={(e) => { e.stopPropagation(); nav(`/movie/${movie.id}`) }}
                          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs md:text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-purple-900/50"
                        >
                          <Info className="h-3.5 w-3.5" />
                          <span>Details</span>
                        </button>

                        {user && (
                          <>
                            {/* Watchlist Toggle */}
                            <button
                              onClick={(e) => toggleWatchlist(e, movie)}
                              className={`flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-md border ${
                                isInWatchlist 
                                  ? 'bg-purple-500/25 border-purple-400/50 text-purple-300 shadow-lg shadow-purple-900/30' 
                                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white shadow-lg'
                              }`}
                              title={isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                            >
                              {isInWatchlist ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            </button>

                            {/* Watched Toggle */}
                            <button
                              onClick={(e) => toggleWatched(e, movie)}
                              className={`flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-md border ${
                                isWatched 
                                  ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-300 shadow-lg shadow-emerald-900/30' 
                                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white shadow-lg'
                              }`}
                              title={isWatched ? 'Watched' : 'Mark as Watched'}
                            >
                              {isWatched ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Title Below Card - Hidden on Hover */}
                {!isHovered && (
                  <div className="mt-2 px-1">
                    <p className="text-white text-xs md:text-sm font-semibold line-clamp-2 leading-tight">
                      {movie.title}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
