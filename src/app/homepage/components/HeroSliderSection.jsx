// src/app/homepage/components/HeroSliderSection.jsx
import { useEffect, useState, useCallback } from 'react'
import { Loader2, Info, Plus, Check, Eye, EyeOff, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { tmdbImg } from '@/shared/api/tmdb'
import { useTopPick } from '@/shared/hooks/useRecommendations'
import { supabase } from '@/shared/lib/supabase/client'

export default function HeroTopPick() {
  const { data: movie, loading, error } = useTopPick()
  const navigate = useNavigate()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [user, setUser] = useState(null)
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [isWatched, setIsWatched] = useState(false)
  const [providers, setProviders] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (mounted) setUser(currentUser)
      } catch (err) {
        console.error('[HeroTopPick] User fetch error:', err)
      }
    })()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    setImageLoaded(false)
  }, [movie?.id])

  useEffect(() => {
    let mounted = true
    
    async function fetchProviders() {
      if (!movie?.id) return
      
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${movie.id}/watch/providers?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
        )
        const data = await res.json()
        const us = data?.results?.US
        
        if (mounted && us) {
          setProviders({
            streaming: us.flatrate?.[0] || null,
            link: us.link || null
          })
        }
      } catch (err) {
        console.error('[HeroTopPick] Providers fetch error:', err)
      }
    }
    
    fetchProviders()
    return () => { mounted = false }
  }, [movie?.id])

  useEffect(() => {
    let mounted = true
    
    async function syncStatus() {
      if (!user?.id || !movie?.id) return
      
      try {
        const [wlRes, whRes] = await Promise.all([
          supabase
            .from('user_watchlist')
            .select('movie_id, movies!inner(tmdb_id)')
            .eq('user_id', user.id)
            .eq('movies.tmdb_id', movie.id)
            .maybeSingle(),
          supabase
            .from('user_history')
            .select('movie_id, movies!inner(tmdb_id)')
            .eq('user_id', user.id)
            .eq('movies.tmdb_id', movie.id)
            .maybeSingle()
        ])

        if (mounted) {
          setIsInWatchlist(!!wlRes.data)
          setIsWatched(!!whRes.data)
        }
      } catch (err) {
        console.error('[HeroTopPick] Status sync error:', err)
      }
    }
    
    syncStatus()

    if (!user?.id) return

    const watchlistChannel = supabase
      .channel('herotoppick_watchlist')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_watchlist',
        filter: `user_id=eq.${user.id}`
      }, syncStatus)
      .subscribe()

    const historyChannel = supabase
      .channel('herotoppick_history')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_history',
        filter: `user_id=eq.${user.id}`
      }, syncStatus)
      .subscribe()

    return () => {
      supabase.removeChannel(watchlistChannel)
      supabase.removeChannel(historyChannel)
      mounted = false
    }
  }, [user?.id, movie?.id])

  const ensureMovieInDb = useCallback(async () => {
    if (!movie) return null
    
    try {
      const { data: existing } = await supabase
        .from('movies')
        .select('id')
        .eq('tmdb_id', movie.id)
        .maybeSingle()
      
      if (existing) return existing.id

      const { data: inserted, error } = await supabase
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
        .select('id')
        .single()

      if (error) {
        console.error('[HeroTopPick] Movie upsert error:', error)
        return null
      }

      return inserted.id
    } catch (err) {
      console.error('[HeroTopPick] ensureMovieInDb error:', err)
      return null
    }
  }, [movie])

  const toggleWatchlist = useCallback(async () => {
    if (!user || !movie) return
    
    const wasInWatchlist = isInWatchlist

    if (wasInWatchlist) {
      setIsInWatchlist(false)
      
      const internalMovieId = await ensureMovieInDb()
      if (internalMovieId) {
        await supabase
          .from('user_watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', internalMovieId)
      }
    } else {
      setIsInWatchlist(true)
      setIsWatched(false)
      
      const internalMovieId = await ensureMovieInDb()
      if (internalMovieId) {
        await supabase
          .from('user_watchlist')
          .upsert({
            user_id: user.id,
            movie_id: internalMovieId,
            added_at: new Date().toISOString(),
            status: 'want_to_watch',
            added_from_recommendation: true,
            mood_session_id: null,
            source: 'hero_top_pick'
          }, { onConflict: 'user_id,movie_id' })

        await supabase
          .from('user_history')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', internalMovieId)
      }
    }
  }, [user, movie, isInWatchlist, ensureMovieInDb])

  const toggleWatched = useCallback(async () => {
    if (!user || !movie) return

    if (isWatched) {
      setIsWatched(false)
      
      const internalMovieId = await ensureMovieInDb()
      if (internalMovieId) {
        await supabase
          .from('user_history')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', internalMovieId)
      }
    } else {
      setIsWatched(true)
      setIsInWatchlist(false)
      
      const internalMovieId = await ensureMovieInDb()
      if (internalMovieId) {
        await supabase.from('user_history').insert({
          user_id: user.id,
          movie_id: internalMovieId,
          watched_at: new Date().toISOString(),
          source: 'hero_top_pick',
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
  }, [user, movie, isWatched, ensureMovieInDb])

  const handleClick = useCallback(() => {
    navigate(`/movie/${movie.id}`)
  }, [movie?.id, navigate])

  if (loading) {
    return (
      <section className="relative px-4 sm:px-6 lg:px-12 mt-12 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
            <span className="text-white/60 text-sm font-medium">Finding your perfect match...</span>
          </div>
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            <div className="w-full max-w-[280px] sm:max-w-[320px] lg:w-[320px] aspect-[2/3] bg-white/5 rounded-lg animate-pulse" />
            <div className="flex-1 space-y-4">
              <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
              <div className="h-12 w-3/4 bg-white/5 rounded animate-pulse" />
              <div className="h-20 w-full bg-white/5 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error || !movie) return null

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
  const rating = movie.vote_average > 0 ? movie.vote_average : 0
  const ratingPercent = Math.round(rating * 10)
  const circumference = 2 * Math.PI * 24

  return (
    <section className="relative px-4 sm:px-6 lg:px-12 mt-12 mb-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-pink-900/10 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
            Tonight's Top Pick For You
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          <div className="flex flex-col">
            <button
              onClick={handleClick}
              className="group relative w-full max-w-[280px] sm:max-w-[320px] lg:w-[320px] flex-shrink-0 rounded-lg overflow-hidden focus:outline-none focus:ring-4 focus:ring-purple-500/50 transition-all mb-4"
              aria-label={`View details for ${movie.title}`}
            >
              <div className="aspect-[2/3] bg-neutral-900 relative">
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-pink-900/20 animate-pulse" />
                )}
                <img
                  src={tmdbImg(movie.poster_path || movie.backdrop_path, 'w500')}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="eager"
                  onLoad={() => setImageLoaded(true)}
                  style={{ opacity: imageLoaded ? 1 : 0 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="h-16 w-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-2xl">
                    <Info className="h-7 w-7 text-black" />
                  </div>
                </div>
              </div>
            </button>

            {providers?.streaming && (
              
                href={providers.link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full max-w-[280px] sm:max-w-[320px] lg:w-[320px] flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1a2332] hover:bg-[#243142] border border-white/10 transition-colors group"
              >
                <img 
                  src={`https://image.tmdb.org/t/p/w92${providers.streaming.logo_path}`}
                  alt={providers.streaming.provider_name}
                  className="h-10 w-10 rounded object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/50 font-medium mb-0.5">Now Streaming</p>
                  <p className="text-sm text-white font-bold group-hover:text-purple-400 transition-colors">Watch Now</p>
                </div>
              </a>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center min-w-0">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 leading-[1.1]">
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-sm text-white/70 mb-5">
              {movie.certification && (
                <span className="px-2 py-0.5 rounded border border-white/30 text-xs font-bold text-white/90">
                  {movie.certification}
                </span>
              )}
              {year && (
                <span className="font-medium">{year}</span>
              )}
              {movie.genres?.slice(0, 3).map((genre, idx) => (
                <span key={genre.id} className="flex items-center gap-2">
                  {idx > 0 && <span className="text-white/40">•</span>}
                  <span>{genre.name}</span>
                </span>
              ))}
              {movie.runtime && (
                <>
                  <span className="text-white/40">•</span>
                  <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-6 mb-5">
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="24"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      className="text-white/10"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="24"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference * (1 - rating / 10)}
                      className="text-emerald-400 transition-all duration-1000"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-base">
                      {ratingPercent}
                      <sup className="text-[10px]">%</sup>
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-white text-xs font-bold leading-tight">User</p>
                  <p className="text-white text-xs font-bold leading-tight">Score</p>
                </div>
              </div>

              {movie.mood_match_percent && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30">
                  <div>
                    <p className="text-xs text-white/70 leading-tight">Your Vibe</p>
                    <p className="text-sm font-black text-emerald-400">{movie.mood_match_percent}%</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-5">
              <button
                onClick={handleClick}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-500/30 shadow-2xl shadow-purple-900/40 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              >
                <Info className="h-4 w-4" />
                <span>View Details</span>
              </button>

              {user && (
                <>
                  <div className="relative group/tooltip">
                    <button
                      onClick={toggleWatchlist}
                      className={`inline-flex items-center justify-center h-12 w-12 rounded-lg text-white transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-white/20 backdrop-blur-md border shadow-xl ${
                        isInWatchlist
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-white/10 hover:bg-white/20 border-white/20'
                      }`}
                    >
                      {isInWatchlist ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    </button>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-black/80 rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                    </span>
                  </div>

                  <div className="relative group/tooltip">
                    <button
                      onClick={toggleWatched}
                      className={`inline-flex items-center justify-center h-12 w-12 rounded-lg text-white transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-white/20 backdrop-blur-md border shadow-xl ${
                        isWatched
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-white/10 hover:bg-white/20 border-white/20'
                      }`}
                    >
                      {isWatched ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </button>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-black/80 rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {isWatched ? 'Mark as Unwatched' : 'Already Watched'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {movie.tagline && (
              <p className="text-white/50 italic text-sm mb-5 font-medium">
                {movie.tagline}
              </p>
            )}

            <div className="mb-5">
              <h2 className="text-white font-bold text-lg mb-2">Overview</h2>
              {movie.overview && (
                <p className="text-base text-white/80 leading-relaxed">
                  {movie.overview}
                </p>
              )}
            </div>

            {movie.director && (
              <div>
                <h3 className="text-white font-bold text-base">{movie.director.name}</h3>
                <p className="text-white/60 text-sm">Director{movie.director.roles?.includes('Writer') ? ', Writer' : ''}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}