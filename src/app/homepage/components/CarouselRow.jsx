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
  const scrollContainerRef = useRef(null)
  const hoverTimeoutRef = useRef(null)
  const nav = useNavigate()

  // Fetch current user on mount
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    })()
  }, [])

  // Fetch genres map once
  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${import.meta.env.VITE_TMDB_API_KEY}`)
      .then(res => res.json())
      .then(data => {
        const genreMap = {}
        data.genres?.forEach(g => { genreMap[g.id] = g.name })
        setGenres(genreMap)
      })
      .catch(console.error)
  }, [])

  // Fetch movies and sync user statuses when category changes
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

  // Scroll carousel horizontally
  const scroll = (direction) => {
    const container = scrollContainerRef.current
    if (!container) return
    const scrollAmount = container.clientWidth * 0.75
    const newPosition = direction === 'left'
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min(container.scrollWidth - container.clientWidth, scrollPosition + scrollAmount)
    container.scrollTo({ left: newPosition, behavior: 'smooth' })
    setScrollPosition(newPosition)
  }

  const handleScroll = () => {
    if (scrollContainerRef.current) setScrollPosition(scrollContainerRef.current.scrollLeft)
  }

  // Ensure movie exists in DB for tracking
  const ensureMovieInDb = async (movie) => {
    await supabase.from('movies').upsert({
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

  // Toggle movie in user watchlist
  const toggleWatchlist = async (e, movie) => {
    e.stopPropagation()
    if (!user) return
    const tmdbId = movie.id
    const isInWatchlist = watchlistTmdbIds.has(tmdbId)

    if (isInWatchlist) {
      setWatchlistTmdbIds(prev => {
        const n = new Set(prev)
        n.delete(tmdbId)
        return n
      })
      await supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', tmdbId)
    } else {
      setWatchlistTmdbIds(prev => new Set(prev).add(tmdbId))
      setWatchedTmdbIds(prev => {
        const n = new Set(prev)
        n.delete(tmdbId)
        return n
      })
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

  // Toggle movie watched status
  const toggleWatched = async (e, movie) => {
    e.stopPropagation()
    if (!user) return
    const tmdbId = movie.id
    const isWatched = watchedTmdbIds.has(tmdbId)

    if (isWatched) {
      setWatchedTmdbIds(prev => {
        const n = new Set(prev)
        n.delete(tmdbId)
        return n
      })
      await supabase.from('movies_watched').delete().eq('user_id', user.id).eq('movie_id', tmdbId)
    } else {
      setWatchedTmdbIds(prev => new Set(prev).add(tmdbId))
      setWatchlistTmdbIds(prev => {
        const n = new Set(prev)
        n.delete(tmdbId)
        return n
      })
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

  // Hover handlers with delay for smooth UX
  const handleMouseEnter = (movie) => {
    clearTimeout(hoverTimeoutRef.current)
    hoverTimeoutRef.current = setTimeout(() => setHoveredMovie(movie.id), 300)
  }
  const handleMouseLeave = () => {
    clearTimeout(hoverTimeoutRef.current)
    hoverTimeoutRef.current = setTimeout(() => setHoveredMovie(null), 200)
  }

  const canScrollLeft = scrollPosition > 0
  const canScrollRight = scrollContainerRef.current
    ? scrollPosition < scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth - 10
    : false

  if (!movies.length) return null

  return (
    <section aria-label={title} className="relative mb-6 md:mb-8 lg:mb-10">
      {/* Section Title */}
      <h2 className="text-white text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        {title}
      </h2>

      {/* Carousel Container */}
      <div className="relative group" tabIndex={-1}>
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            aria-label={`Scroll ${title} left`}
            className="absolute left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 backdrop-blur-sm shadow-xl"
            type="button"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
          </button>
        )}

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            aria-label={`Scroll ${title} right`}
            className="absolute right-1 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 backdrop-blur-sm shadow-xl"
            type="button"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
          </button>
        )}

        {/* Movies Scroll Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 overflow-x-scroll scrollbar-hide px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 md:py-10 lg:py-12 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          tabIndex={0}
          role="list"
          aria-label={`${title} movies`}
        >
          {movies.map((movie) => {
            const isInWatchlist = watchlistTmdbIds.has(movie.id)
            const isWatched = watchedTmdbIds.has(movie.id)
            const isHovered = hoveredMovie === movie.id
            const movieGenres = movie.genre_ids?.slice(0, 3).map(id => genres[id]).filter(Boolean) || []

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
                tabIndex={0}
                aria-label={`${movie.title}. Released in ${movie.release_date ? new Date(movie.release_date).getFullYear() : 'unknown year'}. Rated ${movie.vote_average > 0 ? movie.vote_average.toFixed(1) : 'N/A'}.`}
                onFocus={() => handleMouseEnter(movie)}
                onBlur={handleMouseLeave}
                role="listitem"
              >
                <div
                  className={`relative bg-neutral-900 rounded-lg overflow-hidden shadow-2xl cursor-pointer transition-shadow duration-300 focus-within:ring-4 focus-within:ring-purple-600`}
                  onClick={() => nav(`/movie/${movie.id}`)}
                >
                  <div className="relative aspect-[2/3] overflow-hidden">
                    <img
                      src={tmdbImg(movie.poster_path)}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      draggable={false}
                    />

                    {/* Vote Average Badge */}
                    {movie.vote_average > 0 && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-br from-purple-500/95 to-pink-500/95 backdrop-blur-sm shadow-lg text-xs font-bold text-white select-none" aria-label={`Rating: ${movie.vote_average.toFixed(1)} stars`}>
                        <span aria-hidden="true">★</span>
                        {movie.vote_average.toFixed(1)}
                      </div>
                    )}
                  </div>

                  {/* Hover Expanded Info */}
                  {isHovered && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-transparent flex flex-col justify-end p-3 md:p-4 text-white select-none z-50">
                      <h3 className="text-sm md:text-base font-bold line-clamp-2 mb-2">{movie.title}</h3>

                      <div className="flex items-center gap-2 mb-2 text-xs text-white/80">
                        {movie.release_date && <span className="font-medium">{new Date(movie.release_date).getFullYear()}</span>}
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
                            <span key={genre} className="px-1.5 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-medium backdrop-blur-sm">
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

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            nav(`/movie/${movie.id}`)
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold transition-all hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-500"
                          type="button"
                          aria-label={`View details about ${movie.title}`}
                        >
                          <Info className="h-3 w-3" />
                          <span>Details</span>
                        </button>

                        {user && (
                          <>
                            <button
                              onClick={(e) => toggleWatchlist(e, movie)}
                              className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all hover:scale-110 backdrop-blur-md border shadow-lg focus:outline-none focus:ring-2 ${
                                isInWatchlist
                                  ? 'bg-purple-500/30 border-purple-400 text-purple-300 focus:ring-purple-300'
                                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white focus:ring-white'
                              }`}
                              type="button"
                              aria-pressed={isInWatchlist}
                              aria-label={isInWatchlist ? `Remove ${movie.title} from Watchlist` : `Add ${movie.title} to Watchlist`}
                              title={isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                            >
                              {isInWatchlist ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                            </button>

                            <button
                              onClick={(e) => toggleWatched(e, movie)}
                              className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all hover:scale-110 backdrop-blur-md border shadow-lg focus:outline-none focus:ring-2 ${
                                isWatched
                                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 focus:ring-emerald-300'
                                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white focus:ring-white'
                              }`}
                              type="button"
                              aria-pressed={isWatched}
                              aria-label={isWatched ? `Mark ${movie.title} as Unwatched` : `Mark ${movie.title} as Watched`}
                              title={isWatched ? 'Mark as Unwatched' : 'Mark as Watched'}
                            >
                              {isWatched ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
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
