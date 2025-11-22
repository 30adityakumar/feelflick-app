// src/app/homepage/components/CarouselRow.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Check, Eye } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase/client'

const img = (p, s = 'w500') => p ? `https://image.tmdb.org/t/p/${s}${p}` : '/placeholder-movie.png'

export default function CarouselRow({ title, tmdbCategory = 'popular', rowId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  
  // User State
  const [user, setUser] = useState(null)
  const [watchlistTmdbIds, setWatchlistTmdbIds] = useState(new Set())
  const [watchedTmdbIds, setWatchedTmdbIds] = useState(new Set())
  
  const railRef = useRef(null)
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
    setLoading(true)
    fetch(
      `https://api.themoviedb.org/3/movie/${tmdbCategory}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US&page=1`
    )
      .then(r => r.json())
      .then(async j => {
        const movies = j?.results?.slice(0, 20) ?? []
        setItems(movies)

        // Sync status if user is logged in
        const { data: { user } } = await supabase.auth.getUser()
        if (user && movies.length > 0) {
          const tmdbIds = movies.map(m => m.id)

          // Check Watchlist
          const { data: wl } = await supabase
            .from('user_watchlist')
            .select('movie_id')
            .eq('user_id', user.id)
            .in('movie_id', tmdbIds)
          if (wl) setWatchlistTmdbIds(new Set(wl.map(w => w.movie_id)))

          // Check History
          const { data: wh } = await supabase
            .from('movies_watched')
            .select('movie_id')
            .eq('user_id', user.id)
            .in('movie_id', tmdbIds)
          if (wh) setWatchedTmdbIds(new Set(wh.map(w => w.movie_id)))
        }

        setLoading(false)
      })
      .catch(() => {
        setItems([])
        setLoading(false)
      })
  }, [tmdbCategory])

  const scroll = dir => {
    const rail = railRef.current
    if (!rail) return
    const scrollAmount = rail.clientWidth * 0.75
    rail.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
  }

  const handleScroll = () => {
    const rail = railRef.current
    if (!rail) return
    setShowLeftArrow(rail.scrollLeft > 10)
    setShowRightArrow(rail.scrollLeft < rail.scrollWidth - rail.clientWidth - 10)
  }

  useEffect(() => {
    const rail = railRef.current
    if (rail) {
      rail.addEventListener('scroll', handleScroll)
      handleScroll()
      return () => rail.removeEventListener('scroll', handleScroll)
    }
  }, [items])

  // Helper: Ensure movie in DB
  const ensureMovieInDb = async movie => {
    await supabase.from('movies').upsert({
      tmdb_id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      release_date: movie.release_date || null,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      popularity: movie.popularity,
      original_language: movie.original_language,
      overview: movie.overview
    }, { onConflict: 'tmdb_id' })
  }

  // Toggle Watchlist
  const toggleWatchlist = async (movie, e) => {
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
        supabase.from('user_watchlist').upsert({ user_id: user.id, movie_id: tmdbId, added_at: new Date().toISOString(), status: 'want_to_watch' }, { onConflict: 'user_id,movie_id' }),
        supabase.from('movies_watched').delete().eq('user_id', user.id).eq('movie_id', tmdbId)
      ])
    }
  }

  const skeletons = Array.from({ length: 6 }).map((_, idx) => (
    <div key={idx} className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]">
      <div className="aspect-[2/3] rounded-lg bg-white/10 animate-pulse" />
    </div>
  ))

  return (
    <section className="relative w-full py-4 md:py-6 px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <h2 className="text-lg md:text-xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {title}
        </h2>
      </div>

      {/* Carousel Container */}
      <div className="relative group/carousel">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-30 items-center justify-center h-24 w-10 bg-gradient-to-r from-black via-black/90 to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:scale-110 active:scale-95"
            aria-label="Scroll left"
          >
            <div className="h-10 w-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-purple-600 hover:border-purple-500 transition-all">
              <ChevronLeft className="h-6 w-6" />
            </div>
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-30 items-center justify-center h-24 w-10 bg-gradient-to-l from-black via-black/90 to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:scale-110 active:scale-95"
            aria-label="Scroll right"
          >
            <div className="h-10 w-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-purple-600 hover:border-purple-500 transition-all">
              <ChevronRight className="h-6 w-6" />
            </div>
          </button>
        )}

        {/* Rail */}
        <div
          ref={railRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loading ? (
            skeletons
          ) : items.length === 0 ? (
            <div className="w-full py-8 text-center text-white/60 text-sm">No movies found</div>
          ) : (
            items.map(movie => {
              const isInWatchlist = watchlistTmdbIds.has(movie.id)
              const isWatched = watchedTmdbIds.has(movie.id)

              return (
                <div key={movie.id} className="group/card relative flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]">
                  <button
                    onClick={() => nav(`/movie/${movie.id}`)}
                    className="relative block w-full aspect-[2/3] rounded-lg overflow-hidden bg-white/5 transition-all duration-200 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 active:scale-100"
                  >
                    <img
                      src={img(movie.poster_path)}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-200" />

                    {/* Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-2 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-200">
                      <h3 className="text-xs font-bold text-white leading-tight line-clamp-2 mb-1">
                        {movie.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/90">
                        {movie.release_date && (
                          <span>{new Date(movie.release_date).getFullYear()}</span>
                        )}
                        {movie.vote_average > 0 && (
                          <span className="flex items-center gap-0.5">
                            <span className="text-yellow-400">★</span>
                            {movie.vote_average.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badges (Top Right) */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                      {isWatched && (
                        <div className="h-6 w-6 rounded-full bg-emerald-500/90 backdrop-blur-sm flex items-center justify-center">
                          <Eye className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                      {isInWatchlist && (
                        <div className="h-6 w-6 rounded-full bg-purple-500/90 backdrop-blur-sm flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Quick Add to Watchlist Button */}
                  {user && !isWatched && (
                    <button
                      onClick={(e) => toggleWatchlist(movie, e)}
                      className={`absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 h-7 w-7 rounded-full backdrop-blur-md border shadow-lg flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all hover:scale-110 active:scale-95 ${
                        isInWatchlist
                          ? 'bg-purple-500/90 border-purple-400 text-white'
                          : 'bg-black/80 border-white/20 text-white/80 hover:bg-purple-600 hover:border-purple-500'
                      }`}
                      title={isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                    >
                      {isInWatchlist ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}
