// src/app/homepage/components/CarouselRow.jsx
import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Check, Eye, EyeOff, Info, Loader2 } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'


// Lines 7-8 - Add image preloading and optimization
const tmdbImg = (p, s = 'w342') => p ? `https://image.tmdb.org/t/p/${s}${p}` : ''
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY


// Add intersection observer for lazy loading
const observerOptions = {
  root: null,
  rootMargin: '200px',
  threshold: 0.01
}


export default function CarouselRow({ title, tmdbCategory, rowId }) {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [watchlistTmdbIds, setWatchlistTmdbIds] = useState(new Set())
  const [watchedTmdbIds, setWatchedTmdbIds] = useState(new Set())
  const [actionLoading, setActionLoading] = useState({})
  const [hoveredMovie, setHoveredMovie] = useState(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [genres, setGenres] = useState({})
  const [imageLoaded, setImageLoaded] = useState({})
  
  const scrollContainerRef = useRef(null)
  const hoverTimeoutRef = useRef(null)
  const nav = useNavigate()



  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (mounted) setUser(currentUser)
      } catch (err) {
        console.error('[CarouselRow] User fetch error:', err)
      }
    })()
    return () => { mounted = false }
  }, [])


  useEffect(() => {
    let mounted = true
    
    fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_KEY}`)
      .then(res => res.json())
      .then(data => {
        if (mounted) {
          const genreMap = {}
          data.genres?.forEach(g => { genreMap[g.id] = g.name })
          setGenres(genreMap)
        }
      })
      .catch(err => console.error('[CarouselRow] Genre fetch error:', err))


    return () => { mounted = false }
  }, [])


// Fetch movies from TMDB (CRITICAL - was missing!)
useEffect(() => {
    let mounted = true


    const fetchMovies = async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${tmdbCategory}?api_key=${TMDB_KEY}&language=en-US&page=1`
        )
        
        if (!res.ok) throw new Error('Failed to fetch movies')
        
        const data = await res.json()
        
        if (!mounted) return


        // Show movies immediately
        setMovies(data.results || [])
        setLoading(false)
      } catch (error) {
        console.error('[CarouselRow] Fetch error:', error)
        if (mounted) {
          setMovies([])
          setLoading(false)
        }
      }
    }


    fetchMovies()


    return () => { mounted = false }
  }, [tmdbCategory])
  
// Live sync watchlist and watched status (FIXED - uses existing states)
useEffect(() => {
  if (!user || !movies.length) return


  const syncStatus = async () => {
    try {
      // Sync watchlist status
      const { data: wl } = await supabase
        .from('user_watchlist')
        .select(`
          movie_id,
          movies!inner(tmdb_id)
        `)
        .eq('user_id', user.id)


      // Sync watched history
      const { data: wh } = await supabase
        .from('user_history')
        .select(`
          movie_id,
          movies!inner(tmdb_id)
        `)
        .eq('user_id', user.id)


      // Filter to only current carousel movies
      const movieTmdbIds = movies.map(m => m.id)
      
      if (wl?.length) {
        const watchlistTmdbIds = wl
          .filter(item => movieTmdbIds.includes(item.movies.tmdb_id))
          .map(item => item.movies.tmdb_id)
        setWatchlistTmdbIds(new Set(watchlistTmdbIds))  // ✅ Use EXISTING state
      } else {
        setWatchlistTmdbIds(new Set())                   // ✅ Use EXISTING state
      }


      if (wh?.length) {
        const watchedTmdbIds = wh
          .filter(item => movieTmdbIds.includes(item.movies.tmdb_id))
          .map(item => item.movies.tmdb_id)
        setWatchedTmdbIds(new Set(watchedTmdbIds))       // ✅ Use EXISTING state
      } else {
        setWatchedTmdbIds(new Set())                     // ✅ Use EXISTING state
      }
    } catch (err) {
      console.error('CarouselRow sync failed:', err)
    }
  }


  // Initial sync
  syncStatus()


  // Real-time subscriptions
  const watchlistChannel = supabase
    .channel('carousel_watchlist')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_watchlist',
        filter: `user_id=eq.${user.id}`
      },
      syncStatus
    )
    .subscribe()


  const historyChannel = supabase
    .channel('carousel_history')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_history',
        filter: `user_id=eq.${user.id}`
      },
      syncStatus
    )
    .subscribe()


  return () => {
    supabase.removeChannel(watchlistChannel)
    supabase.removeChannel(historyChannel)
  }
}, [user, movies.length])



  const scroll = useCallback((direction) => {
    const container = scrollContainerRef.current
    if (!container) return
    
    const scrollAmount = container.clientWidth * 0.75
    const newPosition = direction === 'left'
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min(container.scrollWidth - container.clientWidth, scrollPosition + scrollAmount)
    
    container.scrollTo({ left: newPosition, behavior: 'smooth' })
    setScrollPosition(newPosition)
  }, [scrollPosition])


  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      setScrollPosition(scrollContainerRef.current.scrollLeft)
    }
  }, [])


  // Ensure movie exists in DB and return internal ID (NEW)
  // Ensure movie exists in DB and return internal ID (UPDATED like HeroSlider)
const ensureMovieInDb = async (movie) => {
  try {
    // Check if movie already exists
    const { data: existing } = await supabase
      .from('movies')
      .select('id')
      .eq('tmdb_id', movie.id)
      .maybeSingle()

    if (existing) return existing.id

    // Try to fetch full details from TMDB for better data
    let fullMovie = movie
    try {
      const detailsRes = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_KEY}&language=en-US`
      )
      if (detailsRes.ok) {
        fullMovie = await detailsRes.json()
      }
    } catch (err) {
      console.warn('[CarouselRow] Failed to fetch full movie details, using list data:', err)
    }

    // Upsert full movie data
    const { data: inserted, error } = await supabase
      .from('movies')
      .upsert({
        tmdb_id: fullMovie.id,
        title: fullMovie.title,
        original_title: fullMovie.original_title,
        overview: fullMovie.overview || null,
        poster_path: fullMovie.poster_path,
        backdrop_path: fullMovie.backdrop_path,
        release_date: fullMovie.release_date || null,
        vote_average: fullMovie.vote_average || null,
        vote_count: fullMovie.vote_count || null,
        popularity: fullMovie.popularity || null,
        original_language: fullMovie.original_language,
        adult: fullMovie.adult || false,
        json_data: fullMovie
      }, { onConflict: 'tmdb_id' })
      .select('id')
      .single()

    if (error) {
      console.error('[CarouselRow] Failed to insert movie:', error)
      throw error
    }

    return inserted.id
  } catch (err) {
    console.error('[CarouselRow] ensureMovieInDb failed:', err)
    throw err   // IMPORTANT: surface the failure
  }
}




// Toggle watchlist (FIXED - without source until schema updated)
const toggleWatchlist = async (e, movie) => {
  e.stopPropagation()
  if (!user || !movie?.id) return

  const tmdbId = movie.id
  const wasInWatchlist = watchlistTmdbIds.has(tmdbId)

  setActionLoading(prev => ({ ...prev, [`wl-${movie.id}`]: true }))

  try {
    if (wasInWatchlist) {
      // Remove from watchlist
      setWatchlistTmdbIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(tmdbId)
        return newSet
      })

      const internalMovieId = await ensureMovieInDb(movie)
      if (internalMovieId) {
        const { error: deleteError } = await supabase
          .from('user_watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', internalMovieId)
        
        if (deleteError) {
          console.error('[CarouselRow] Delete watchlist error:', deleteError)
          throw deleteError
        }
      }
    } else {
      // Add to watchlist
      setWatchlistTmdbIds(prev => new Set([...prev, tmdbId]))
      setWatchedTmdbIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(tmdbId)
        return newSet
      })

      const internalMovieId = await ensureMovieInDb(movie)
      if (!internalMovieId) {
        throw new Error('Failed to get internal movie ID')
      }

      console.log('[CarouselRow] Inserting watchlist with ID:', internalMovieId)

      // Insert into watchlist (WITHOUT source for now)
      const { data: insertData, error: insertError } = await supabase
        .from('user_watchlist')
        .upsert({
          user_id: user.id,
          movie_id: internalMovieId,
          added_at: new Date().toISOString(),
          status: 'want_to_watch',
          added_from_recommendation: false,
          mood_session_id: null,
          source: 'carousel_row'  // ❌ REMOVE THIS LINE until schema updated
        }, { onConflict: 'user_id,movie_id' })
        .select()

      if (insertError) {
        console.error('[CarouselRow] Insert watchlist error:', insertError)
        throw insertError
      }

      console.log('[CarouselRow] Watchlist insert success:', insertData)

      // Remove from history if exists
      await supabase
        .from('user_history')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', internalMovieId)
    }
  } catch (error) {
    console.error('[CarouselRow] toggleWatchlist failed:', error)
    
    // Revert optimistic update
    if (wasInWatchlist) {
      setWatchlistTmdbIds(prev => new Set([...prev, tmdbId]))
    } else {
      setWatchlistTmdbIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(tmdbId)
        return newSet
      })
    }
  } finally {
    setActionLoading(prev => ({ ...prev, [`wl-${movie.id}`]: false }))
  }
}

  // Toggle watched (UPDATED - normalized tables)
// Toggle watched (FIXED - uses existing states)
const toggleWatched = async (e, movie) => {
  e.stopPropagation()
  if (!user || !movie?.id) return


  const tmdbId = movie.id
  const wasWatched = watchedTmdbIds.has(tmdbId)  // ✅ OLD state name


  setActionLoading(prev => ({ ...prev, [`wh-${movie.id}`]: true }))  // ✅ Per-movie


  try {
    if (wasWatched) {
      setWatchedTmdbIds(prev => {      // ✅ OLD state name
        const newSet = new Set(prev)
        newSet.delete(tmdbId)
        return newSet
      })


      const internalMovieId = await ensureMovieInDb(movie)
      if (internalMovieId) {
        await supabase
          .from('user_history')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', internalMovieId)
      }
    } else {
      setWatchedTmdbIds(prev => new Set([...prev, tmdbId]))  // ✅ OLD state name
      setWatchlistTmdbIds(prev => {                          // ✅ OLD state name
        const newSet = new Set(prev)
        newSet.delete(tmdbId)
        return newSet
      })


      const internalMovieId = await ensureMovieInDb(movie)
      if (internalMovieId) {
        await supabase.from('user_history').insert({
          user_id: user.id,
          movie_id: internalMovieId,
          watched_at: new Date().toISOString(),
          source: 'carousel_row',
          watch_duration_minutes: null,
          mood_session_id: null
        })


        await supabase
          .from('user_watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', internalMovieId)
      }
    }
  } catch (error) {
    console.error('toggleWatched failed:', error)
    // Revert
    if (wasWatched) {
      setWatchedTmdbIds(prev => new Set([...prev, tmdbId]))
    } else {
      setWatchedTmdbIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(tmdbId)
        return newSet
      })
    }
  } finally {
    setActionLoading(prev => ({ ...prev, [`wh-${movie.id}`]: false }))
  }
}



  const handleMouseEnter = useCallback((movie) => {
    clearTimeout(hoverTimeoutRef.current)
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredMovie(movie.id)
    }, 300)
  }, [])


  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimeoutRef.current)
    setHoveredMovie(null)
  }, [])


  const canScrollLeft = scrollPosition > 0
  const canScrollRight = scrollContainerRef.current
    ? scrollPosition < scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth
    : false


  // Lines 256-272 - Minimal skeleton loader
  if (loading) {
    return (
      <section className="mb-6">
        <h2 className="text-white text-xl font-bold mb-2 px-12">
          {title}
        </h2>
        <div className="flex gap-2 px-12 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[160px] md:w-[185px] aspect-[2/3] bg-white/5 rounded-md"
            />
          ))}
        </div>
      </section>
    )
  }


  if (!movies.length) {
    return (
      <section className="mb-8 md:mb-12">
        <h2 className="text-white text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          {title}
        </h2>
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <p className="text-white/50 text-sm">No movies available</p>
        </div>
      </section>
    )
  }


  return (
    <section className="mb-8 md:mb-12">
      <h2 className="text-white text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        {title}
      </h2>


      <div className="relative group">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 backdrop-blur-sm shadow-xl touch-target"
            type="button"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        )}


        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-1 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 backdrop-blur-sm shadow-xl touch-target"
            type="button"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        )}


        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 overflow-x-scroll scrollbar-hide px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 md:py-10 lg:py-12 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map((movie) => {
            const isInWatchlist = watchlistTmdbIds.has(movie.id)
            const isWatched = watchedTmdbIds.has(movie.id)
            const isHovered = hoveredMovie === movie.id
            const movieGenres = movie.genre_ids?.slice(0, 3).map(id => genres[id]).filter(Boolean) || []
            const wlLoading = actionLoading[`wl-${movie.id}`]
            const whLoading = actionLoading[`wh-${movie.id}`]


            return (
              <article
                key={`${rowId}-${movie.id}`}
                className="relative flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] xl:w-[220px] transition-all duration-300 ease-out"
                style={{
                  transform: isHovered ? 'scale(1.35)' : 'scale(1)',
                  zIndex: isHovered ? 40 : 10,
                  marginLeft: isHovered ? '25px' : '0',
                  marginRight: isHovered ? '25px' : '0'
                }}
                onMouseEnter={() => handleMouseEnter(movie)}
                onMouseLeave={handleMouseLeave}
                onFocus={() => handleMouseEnter(movie)}
                onBlur={handleMouseLeave}
              >
                <div
                  className="relative bg-neutral-900 rounded-lg overflow-hidden shadow-2xl cursor-pointer transition-shadow duration-300 focus-within:ring-4 focus-within:ring-purple-600"
                  onClick={() => nav(`/movie/${movie.id}`)}
                >
                  <div className="relative aspect-[2/3] overflow-hidden">
                    {!imageLoaded[movie.id] && (
                      <div className="absolute inset-0 bg-white/10 animate-pulse" />
                    )}
                    <img
                      src={tmdbImg(movie.poster_path)}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      draggable={false}
                      onLoad={() => setImageLoaded(prev => ({ ...prev, [movie.id]: true }))}
                      style={{ opacity: imageLoaded[movie.id] ? 1 : 0, transition: 'opacity 0.3s' }}
                    />


                    {movie.vote_average > 0 && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-br from-purple-500/95 to-pink-500/95 backdrop-blur-sm shadow-lg text-xs font-bold text-white select-none">
                        <span>★</span>
                        {movie.vote_average.toFixed(1)}
                      </div>
                    )}
                  </div>


                  {isHovered && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-transparent flex flex-col justify-end p-3 md:p-4 text-white select-none z-50">
                      <h3 className="text-sm md:text-base font-bold line-clamp-2 mb-2">{movie.title}</h3>


                      <div className="flex items-center gap-2 mb-2 text-xs text-white/80">
                        {movie.release_date && (
                          <span className="font-medium">{new Date(movie.release_date).getFullYear()}</span>
                        )}
                        {movie.vote_average > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-purple-300 font-semibold">★ {movie.vote_average.toFixed(1)}</span>
                          </>
                        )}
                      </div>


                      {movieGenres.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2.5">
                          {movieGenres.map(genre => (
                            <span
                              key={genre}
                              className="px-1.5 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-medium backdrop-blur-sm"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}


                      {movie.overview && (
                        <p className="text-white/70 text-[11px] md:text-xs line-clamp-2 md:line-clamp-3 leading-relaxed mb-3">
                          {movie.overview}
                        </p>
                      )}


                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            nav(`/movie/${movie.id}`)
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold transition-all hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-500 touch-target"
                          type="button"
                        >
                          <Info className="h-3 w-3" />
                          <span>Details</span>
                        </button>


                        {user && (
                          <>
                            <button
                              onClick={(e) => toggleWatchlist(e, movie)}
                              disabled={wlLoading}
                              className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all hover:scale-110 backdrop-blur-md border shadow-lg focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed touch-target ${
                                isInWatchlist
                                  ? 'bg-purple-500/30 border-purple-400 text-purple-300 focus:ring-purple-300'
                                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white focus:ring-white'
                              }`}
                              type="button"
                            >
                              {wlLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : isInWatchlist ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <Plus className="h-3.5 w-3.5" />
                              )}
                            </button>


                            <button
                              onClick={(e) => toggleWatched(e, movie)}
                              disabled={whLoading}
                              className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all hover:scale-110 backdrop-blur-md border shadow-lg focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed touch-target ${
                                isWatched
                                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 focus:ring-emerald-300'
                                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white focus:ring-white'
                              }`}
                              type="button"
                            >
                              {whLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : isWatched ? (
                                <Eye className="h-3.5 w-3.5" />
                              ) : (
                                <EyeOff className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}