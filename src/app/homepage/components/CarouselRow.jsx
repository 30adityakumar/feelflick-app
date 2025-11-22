// src/app/homepage/components/CarouselRow.jsx
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Check, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'

const tmdbImg = (p, s = 'w500') => p ? `https://image.tmdb.org/t/p/${s}${p}` : ''

export default function CarouselRow({ title, tmdbCategory, rowId }) {
  const [movies, setMovies] = useState([])
  const [user, setUser] = useState(null)
  const [watchlistTmdbIds, setWatchlistTmdbIds] = useState(new Set())
  const [watchedTmdbIds, setWatchedTmdbIds] = useState(new Set())
  const [scrollPosition, setScrollPosition] = useState(0)
  const scrollContainerRef = useRef(null)
  const nav = useNavigate()

  // Get User
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    })()
  }, [])

  // Fetch Movies & Sync Status
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${tmdbCategory}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US&page=1`
        )
        const data = await res.json()
        setMovies(data.results || [])

        // Sync Watchlist & Watched Status
        const { data: { user } } = await supabase.auth.getUser()
        if (user && data.results?.length > 0) {
          const tmdbIds = data.results.map(m => m.id)

          // Check Watchlist
          const { data: wl } = await supabase
            .from('user_watchlist')
            .select('movie_id')
            .eq('user_id', user.id)
            .in('movie_id', tmdbIds)
          if (wl) setWatchlistTmdbIds(new Set(wl.map(w => w.movie_id)))

          // Check Watched
          const { data: wh } = await supabase
            .from('movies_watched')
            .select('movie_id')
            .eq('user_id', user.id)
            .in('movie_id', tmdbIds)
          if (wh) setWatchedTmdbIds(new Set(wh.map(w => w.movie_id)))
        }
      } catch (error) {
        console.error('Error fetching movies:', error)
      }
    }

    fetchMovies()
  }, [tmdbCategory])

  // Scroll Functions
  const scroll = (direction) => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = container.clientWidth * 0.8
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min(container.scrollWidth - container.clientWidth, scrollPosition + scrollAmount)

    container.scrollTo({ left: newPosition, behavior: 'smooth' })
    setScrollPosition(newPosition)
  }

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setScrollPosition(scrollContainerRef.current.scrollLeft)
    }
  }

  // Helper: Ensure Movie in DB
  const ensureMovieInDb = async (movie) => {
    await supabase
      .from('movies')
      .upsert({
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
      }, { onConflict: 'tmdb_id' })
  }

  // Toggle Watchlist
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
          user_id: user.id, 
          movie_id: tmdbId,
          added_at: new Date().toISOString(),
          status: 'want_to_watch'
        }, { onConflict: 'user_id,movie_id' }),
        supabase.from('movies_watched').delete().eq('user_id', user.id).eq('movie_id', tmdbId)
      ])
    }
  }

  // Toggle Watched
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
          user_id: user.id,
          movie_id: tmdbId,
          title: movie.title,
          poster: movie.poster_path,
          release_date: movie.release_date || null,
          vote_average: movie.vote_average,
          genre_ids: movie.genre_ids,
          watched_at: new Date().toISOString(),
          source: 'carousel_row'
        }, { onConflict: 'user_id,movie_id' }),
        supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', tmdbId)
      ])
    }
  }

  const canScrollLeft = scrollPosition > 0
  const canScrollRight = scrollContainerRef.current 
    ? scrollPosition < scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth - 10
    : false

  if (!movies.length) return null

  return (
    <div className="relative mb-8 md:mb-10 lg:mb-12">
      {/* Section Title */}
      <h2 className="text-white text-xl md:text-2xl font-bold mb-4 px-4 md:px-12 lg:px-16">
        {title}
      </h2>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 backdrop-blur-sm"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 backdrop-blur-sm"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Movies Grid */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-3 md:gap-4 overflow-x-scroll scrollbar-hide px-4 md:px-12 lg:px-16 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map((movie) => {
            const isInWatchlist = watchlistTmdbIds.has(movie.id)
            const isWatched = watchedTmdbIds.has(movie.id)

            return (
              <div
                key={`${rowId}-${movie.id}`}
                className="relative flex-shrink-0 w-[140px] md:w-[180px] lg:w-[200px] group/card cursor-pointer"
                onClick={() => nav(`/movie/${movie.id}`)}
              >
                {/* Poster Image */}
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-neutral-900 shadow-lg transition-transform duration-300 group-hover/card:scale-105 group-hover/card:shadow-2xl">
                  <img
                    src={tmdbImg(movie.poster_path)}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    {/* Rating Badge */}
                    {movie.vote_average > 0 && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-br from-purple-500/90 to-pink-500/90 backdrop-blur-sm shadow-lg">
                        <span className="text-white text-xs font-bold">★</span>
                        <span className="text-white text-xs font-bold">{movie.vote_average.toFixed(1)}</span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-white text-sm font-bold line-clamp-2 mb-2">
                      {movie.title}
                    </h3>

                    {/* Action Buttons */}
                    {user && (
                      <div className="flex items-center gap-2">
                        {/* Watchlist Button */}
                        <button
                          onClick={(e) => toggleWatchlist(e, movie)}
                          className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all hover:scale-110 backdrop-blur-md border shadow-lg ${
                            isInWatchlist
                              ? 'bg-purple-500/30 border-purple-400 text-purple-300'
                              : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                          }`}
                          title={isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                        >
                          {isInWatchlist ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </button>

                        {/* Watched Button */}
                        <button
                          onClick={(e) => toggleWatched(e, movie)}
                          className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all hover:scale-110 backdrop-blur-md border shadow-lg ${
                            isWatched
                              ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300'
                              : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                          }`}
                          title={isWatched ? 'Mark as Unwatched' : 'Mark as Watched'}
                        >
                          {isWatched ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title Below (Always Visible) */}
                <p className="text-white text-sm font-medium mt-2 line-clamp-2 px-1">
                  {movie.title}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
