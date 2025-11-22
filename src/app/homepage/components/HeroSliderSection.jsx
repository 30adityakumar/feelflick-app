// src/app/home/HeroSliderSection.jsx
import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Play, Plus, Check } from 'lucide-react'

// --- OPTIMIZATION: Use a more reasonable image size ---
const tmdbImg = (p, size = 'w1280') => p ? `https://image.tmdb.org/t/p/${size}${p}` : ''

// --- OPTIMIZATION: Preloader Hook ---
function useImagePreloader(urls) {
  useEffect(() => {
    if (!urls || urls.length === 0) return
    urls.forEach(url => {
      if (!url) return
      const img = new Image()
      img.src = url
    })
  }, [urls])
}

export default function HeroSliderSection({ user, genres }) {
  const [movies, setMovies] = useState([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [watchlistTmdbIds, setWatchlistTmdbIds] = useState(new Set())

  // Memoize the top 5 movies to prevent re-filtering on every render
  const topMovies = useMemo(() => movies.slice(0, 5), [movies])
  
  // --- OPTIMIZATION: Preload the next movie's backdrop ---
  useImagePreloader([
    topMovies[(current + 1) % topMovies.length]?.backdrop_path 
      ? tmdbImg(topMovies[(current + 1) % topMovies.length].backdrop_path) 
      : null
  ].filter(Boolean))

  // Fetch trending movies
  useEffect(() => {
    let active = true
    async function fetchTrending() {
      setLoading(true)
      try {
        const url = `https://api.themoviedb.org/3/trending/movie/day?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US`
        const res = await fetch(url)
        const data = await res.json()

        if (active) {
          // Filter out movies without backdrops to ensure a good visual experience
          const validMovies = data.results?.filter(m => m.backdrop_path) || []
          setMovies(validMovies)
        }
      } catch (error) {
        console.error('Error fetching trending movies:', error)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchTrending()
    return () => { active = false }
  }, [])

  // Sync watchlist status
  useEffect(() => {
    if (!user || topMovies.length === 0) return
    
    let active = true
    async function syncWatchlist() {
      const tmdbIds = topMovies.map(m => m.id)
      const { data: moviesData } = await supabase
        .from('movies')
        .select('id, tmdb_id')
        .in('tmdb_id', tmdbIds)

      if (!moviesData) return
      const tmdbToInternalId = moviesData.reduce((acc, m) => ({ ...acc, [m.tmdb_id]: m.id }), {})
      const internalIds = Object.values(tmdbToInternalId)

      const { data: wl } = await supabase
        .from('user_watchlist')
        .select('movie_id')
        .eq('user_id', user.id)
        .in('movie_id', internalIds)
      
      if (!active) return

      const watchlistTmdb = new Set()
      wl?.forEach(w => {
        const tmdbId = Object.keys(tmdbToInternalId).find(key => tmdbToInternalId[key] === w.movie_id)
        if (tmdbId) watchlistTmdb.add(Number(tmdbId))
      })
      setWatchlistTmdbIds(watchlistTmdb)
    }
    
    syncWatchlist()
    return () => { active = false }
  }, [user, topMovies])

  // Auto-play timer
  useEffect(() => {
    if (!topMovies.length || loading) return
    const timer = setInterval(() => {
      setCurrent(prev => (prev === topMovies.length - 1 ? 0 : prev + 1))
    }, 8000)
    return () => clearInterval(timer)
  }, [topMovies, loading])

  // Navigation handlers
  const prev = () => setCurrent(c => (c === 0 ? topMovies.length - 1 : c - 1))
  const next = () => setCurrent(c => (c === topMovies.length - 1 ? 0 : c + 1))

  const activeMovie = topMovies[current]

  const toggleWatchlist = async (e) => {
    e.stopPropagation()
    if (!user || !activeMovie) return
    
    const internalId = await ensureMovieInDb(activeMovie)
    if (!internalId) return
    
    if (watchlistTmdbIds.has(activeMovie.id)) {
      setWatchlistTmdbIds(prev => { const n = new Set(prev); n.delete(activeMovie.id); return n })
      await supabase.from('user_watchlist').delete().match({ user_id: user.id, movie_id: internalId })
    } else {
      setWatchlistTmdbIds(prev => new Set(prev).add(activeMovie.id))
      await supabase.from('user_watchlist').upsert({ user_id: user.id, movie_id: internalId, status: 'want_to_watch' })
    }
  }

  async function ensureMovieInDb(movie) {
    const { data } = await supabase
      .from('movies')
      .upsert({ tmdb_id: movie.id, title: movie.title, poster_path: movie.poster_path }, { onConflict: 'tmdb_id' })
      .select('id')
      .single()
    return data?.id
  }

  if (loading || !activeMovie) {
    return (
      <div className="relative h-screen min-h-[700px] w-full bg-black">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
        <div className="h-full w-full animate-pulse bg-white/5" />
      </div>
    )
  }

  return (
    <div className="relative h-screen min-h-[700px] w-full text-white overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        >
          {/* --- OPTIMIZATION: Prioritize loading the first image --- */}
          <img
            src={tmdbImg(activeMovie.backdrop_path)}
            alt={activeMovie.title}
            className="h-full w-full object-cover"
            loading={current === 0 ? "eager" : "lazy"}
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative h-full flex flex-col justify-end z-20 pb-20 md:pb-24">
        <div className="mx-auto max-w-7xl w-full px-4 md:px-8 lg:px-12">
          <motion.div
            key={current}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black max-w-2xl mb-4 leading-tight">
              {activeMovie.title}
            </h1>
            
            {/* Meta */}
            <div className="flex items-center gap-4 text-sm md:text-base text-white/80 mb-6">
              <span>{activeMovie.release_date.substring(0, 4)}</span>
              <span className="flex items-center gap-1.5">
                <span className="text-yellow-400">★</span>
                {activeMovie.vote_average.toFixed(1)}
              </span>
              <div className="flex gap-2">
                {activeMovie.genre_ids.slice(0, 2).map(id => (
                  <span key={id} className="px-2.5 py-1 rounded-full bg-white/10 text-white/70 text-xs font-semibold backdrop-blur-sm">
                    {genres[id]}
                  </span>
                ))}
              </div>
            </div>

            {/* Overview */}
            <p className="max-w-xl text-white/80 text-sm md:text-base leading-relaxed line-clamp-3 mb-8">
              {activeMovie.overview}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                to={`/movie/${activeMovie.id}`}
                className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold transition-all hover:scale-105 active:scale-95"
              >
                <Play className="h-5 w-5 fill-current" />
                <span>Details</span>
              </Link>
              {user && (
                <button
                  onClick={toggleWatchlist}
                  className={`flex items-center justify-center h-12 w-12 rounded-lg transition-all hover:scale-110 backdrop-blur-md border shadow-lg ${
                    watchlistTmdbIds.has(activeMovie.id)
                      ? 'bg-purple-500/30 border-purple-400 text-purple-300'
                      : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                  }`}
                >
                  {watchlistTmdbIds.has(activeMovie.id) ? <Check className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Slider Controls */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
        <button onClick={prev} className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        {topMovies.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              current === i ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
        <button onClick={next} className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
