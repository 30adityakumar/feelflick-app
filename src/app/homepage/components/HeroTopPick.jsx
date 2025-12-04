// src/app/homepage/components/HeroTopPick.jsx
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Loader2,
  Play,
  Sparkles,
  Check,
  Eye,
  EyeOff,
  Bookmark,
  ChevronRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { tmdbImg } from '@/shared/api/tmdb'
import { useTopPick } from '@/shared/hooks/useRecommendations'
import { supabase } from '@/shared/lib/supabase/client'
import { useUserMovieStatus } from '@/shared/hooks/useUserMovieStatus'

// Minimal tooltip for icon buttons
function Tooltip({ children, label }) {
  const [visible, setVisible] = useState(false)
  const timeout = useRef(null)

  return (
    <div
      className="relative"
      onMouseEnter={() => { timeout.current = setTimeout(() => setVisible(true), 500) }}
      onMouseLeave={() => { clearTimeout(timeout.current); setVisible(false) }}
    >
      {children}
      <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md bg-black/95 border border-white/10 text-[11px] text-white font-medium whitespace-nowrap pointer-events-none transition-all duration-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
        {label}
      </div>
    </div>
  )
}

export default function HeroTopPick() {
  const { data: movie, loading, error } = useTopPick()
  const navigate = useNavigate()
  const [posterLoaded, setPosterLoaded] = useState(false)
  const [backdropLoaded, setBackdropLoaded] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [user, setUser] = useState(null)

  // Auth
  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (mounted) setUser(u)
    })
    return () => { mounted = false }
  }, [])

  // Reset on movie change
  useEffect(() => {
    setPosterLoaded(false)
    setBackdropLoaded(false)
    setRevealed(false)
  }, [movie?.id])

  // Staggered reveal
  useEffect(() => {
    if (posterLoaded || backdropLoaded) {
      const t = setTimeout(() => setRevealed(true), 100)
      return () => clearTimeout(t)
    }
  }, [posterLoaded, backdropLoaded])

  const {
    isInWatchlist,
    isWatched,
    loading: actionLoading,
    toggleWatchlist,
    toggleWatched
  } = useUserMovieStatus({ user, movie, source: 'hero_top_pick' })

  const goToDetails = useCallback(() => {
    if (movie?.id) navigate(`/movie/${movie.id}`)
  }, [movie?.id, navigate])

  const playTrailer = useCallback(() => {
    if (movie?.trailer_url) window.open(movie.trailer_url, '_blank', 'noopener')
  }, [movie?.trailer_url])

  // Loading state
  if (loading) {
    return (
      <section className="relative w-full h-[75vh] min-h-[500px] max-h-[800px] bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/30 via-black to-black" />
        <div className="relative z-10 h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 flex items-end pb-12 lg:pb-16">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 w-full">
            <div className="hidden sm:block w-[200px] lg:w-[260px] flex-shrink-0">
              <div className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />
            </div>
            <div className="flex-1 space-y-4 pb-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                <span className="text-white/40 text-xs font-medium tracking-wide">Finding your perfect match...</span>
              </div>
              <div className="h-10 lg:h-14 w-2/3 bg-white/5 rounded animate-pulse" />
              <div className="h-4 w-1/3 bg-white/5 rounded animate-pulse" />
              <div className="h-16 w-full max-w-xl bg-white/5 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error || !movie) return null

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
  const hours = movie.runtime ? Math.floor(movie.runtime / 60) : 0
  const mins = movie.runtime ? movie.runtime % 60 : 0


  return (
    <section className="relative w-full h-[75vh] min-h-[500px] max-h-[800px] overflow-hidden bg-black">
      {/* === BACKDROP === */}
      <div className="absolute inset-0">
        {/* Blur placeholder */}
        <div
          className={`absolute inset-0 scale-110 transition-opacity duration-1000 ${backdropLoaded ? 'opacity-0' : 'opacity-100'}`}
          style={{
          backgroundImage: movie.backdrop_path ? `url(${tmdbImg(movie.backdrop_path, 'w300')})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: '70% 20%',
          filter: 'blur(30px) saturate(1.2)'
        }}
        />
        
        {/* Full backdrop */}
        {movie.backdrop_path && (
          <img
            src={tmdbImg(movie.backdrop_path, 'original')}
            alt=""
            aria-hidden="true"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              backdropLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              objectPosition: '70% 20%' // shift focus to the right; tweak this if needed
            }}
            onLoad={() => setBackdropLoaded(true)}
          />
        )}


        {/* Cinematic gradients - Netflix/Apple style */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_80%,rgba(0,0,0,0.9),transparent)]" />
        
        {/* Subtle color wash */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/10 via-transparent to-rose-950/10 mix-blend-overlay" />
        
        {/* Film grain texture */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />
      </div>

      {/* === CONTENT === */}
      <div className="relative z-10 h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 flex items-end pb-10 sm:pb-12 lg:pb-14">
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 lg:gap-10 w-full">
          
          {/* Poster - Hidden on mobile, elegant on larger screens */}
          <div
              className={`hidden sm:block flex-shrink-0 transition-all duration-700 ease-out ${
                revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >



            <button
              onClick={goToDetails}
              className="group relative w-[180px] lg:w-[240px] xl:w-[260px] rounded-lg overflow-hidden shadow-2xl shadow-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-4 focus-visible:ring-offset-black transition-transform duration-500 hover:scale-[1.02]"
              aria-label={`View ${movie.title}`}
            >
              <div className="aspect-[2/3] bg-neutral-900">
                {/* Poster blur placeholder */}
                {!posterLoaded && (
                  <div
                    className="absolute inset-0 scale-105"
                    style={{
                      backgroundImage: movie.poster_path ? `url(${tmdbImg(movie.poster_path, 'w92')})` : undefined,
                      backgroundSize: 'cover',
                      filter: 'blur(8px)'
                    }}
                  />
                )}
                <img
                  src={tmdbImg(movie.poster_path || movie.backdrop_path, 'w500')}
                  alt={movie.title}
                  className={`w-full h-full object-cover transition-all duration-700 ${posterLoaded ? 'opacity-100' : 'opacity-0'} group-hover:scale-105`}
                  onLoad={() => setPosterLoaded(true)}
                />
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">View Details</span>
                </div>
              </div>
            </button>
            
            {/* Provider badge */}
            {movie.providers?.flatrate?.[0] && (
              <div className={`mt-3 flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] transition-all duration-700 delay-100 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <img
                  src={`https://image.tmdb.org/t/p/w92${movie.providers.flatrate[0].logo_path}`}
                  alt=""
                  className="h-8 w-8 rounded object-cover"
                />
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-widest text-white/30 font-medium">Streaming on</p>
                  <p className="text-xs text-white/80 font-semibold truncate">{movie.providers.flatrate[0].provider_name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 flex flex-col justify-end">
            {/* Label */}
            <div className={`flex items-center gap-2 mb-3 sm:mb-4 transition-all duration-500 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Sparkles className="h-3 w-3 text-purple-400" />
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] text-purple-400/90">
                Tonight's Top Pick
              </span>
            </div>

            {/* Title */}
            <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[3.5rem] font-black text-white leading-[1.1] mb-3 sm:mb-4 transition-all duration-700 delay-75 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              {movie.title}
            </h1>

            {/* Metadata pills */}
            <div className={`flex flex-wrap items-center gap-2 sm:gap-2.5 mb-4 sm:mb-5 transition-all duration-700 delay-100 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              
              {movie.certification && (
                <span className="px-2 py-1 rounded bg-white/10 text-[11px] font-bold text-white/90 backdrop-blur-sm">
                  {movie.certification}
                </span>
              )}
              
              {year && (
                <span className="text-xs text-white/50 font-medium">{year}</span>
              )}
              
              {movie.genres?.slice(0, 2).map((g, i) => (
                <span key={g.id} className="text-xs text-white/50 font-medium">
                  {i > 0 || year ? <span className="mr-2 text-white/20">•</span> : null}
                  {g.name}
                </span>
              ))}
              
              {movie.runtime > 0 && (
                <span className="text-xs text-white/50 font-medium">
                  <span className="mr-2 text-white/20">•</span>
                  {hours > 0 && `${hours}h `}{mins}m
                </span>
              )}

              {/* Mood match */}
              {movie.mood_match_percent && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/20">
                  <span className="text-[10px] text-emerald-400/80 font-medium">Vibe Match</span>
                  <span className="text-xs font-bold text-emerald-400">{movie.mood_match_percent}%</span>
                </div>
              )}
            </div>

            {/* Overview */}
            {movie.overview && (
              <p className={`text-sm sm:text-[15px] text-white/60 leading-relaxed max-w-xl mb-5 sm:mb-6 line-clamp-2 sm:line-clamp-3 transition-all duration-700 delay-150 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {movie.overview}
              </p>
            )}

            {/* Actions */}
            <div className={`flex flex-wrap items-center gap-2.5 sm:gap-3 transition-all duration-700 delay-200 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {/* Primary: View Details */}
              <button
                onClick={goToDetails}
                className="group inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white text-black font-semibold text-sm transition-all duration-300 hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <span>View Details</span>
                <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>

              {/* Secondary: Trailer */}
              {movie.trailer_url && (
                <button
                  onClick={playTrailer}
                  className="group inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 hover:border-white/20 text-white font-semibold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Trailer</span>
                </button>
              )}

              {/* Icon actions - Watchlist & Watched */}
              {user && (
                <div className="flex items-center gap-2 ml-1">
                  <Tooltip label={isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}>
                    <button
                      onClick={toggleWatchlist}
                      disabled={actionLoading.watchlist}
                      className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full border backdrop-blur-sm transition-all duration-300 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 ${
                        isInWatchlist
                          ? 'bg-purple-500/30 border-purple-400/50 text-purple-300 focus-visible:ring-purple-400'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white focus-visible:ring-white/50'
                      }`}
                    >
                      {actionLoading.watchlist ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isInWatchlist ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </button>
                  </Tooltip>

                  <Tooltip label={isWatched ? 'Watched' : 'Mark Watched'}>
                    <button
                      onClick={toggleWatched}
                      disabled={actionLoading.watched}
                      className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full border backdrop-blur-sm transition-all duration-300 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 ${
                        isWatched
                          ? 'bg-emerald-500/30 border-emerald-400/50 text-emerald-300 focus-visible:ring-emerald-400'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white focus-visible:ring-white/50'
                      }`}
                    >
                      {actionLoading.watched ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isWatched ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>

            {/* Director - subtle */}
            {movie.director && (
              <p className={`mt-4 sm:mt-5 text-xs text-white/40 transition-all duration-700 delay-300 ${revealed ? 'opacity-100' : 'opacity-0'}`}>
                Directed by <span className="text-white/60 font-medium">{movie.director.name}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom fade for seamless transition to content below */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </section>
  )
}