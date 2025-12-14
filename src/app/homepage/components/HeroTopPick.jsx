// src/app/homepage/components/HeroTopPick.jsx
import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Loader2,
  Play,
  Check,
  Eye,
  EyeOff,
  Bookmark,
  ChevronRight,
  Star
} from 'lucide-react'
import { RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { tmdbImg } from '@/shared/api/tmdb'
import { useTopPick } from '@/shared/hooks/useRecommendations'
import { supabase } from '@/shared/lib/supabase/client'
import { useUserMovieStatus } from '@/shared/hooks/useUserMovieStatus'
import { updateImpression } from '@/shared/services/recommendations'

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY

function Tooltip({ children, label }) {
  const [visible, setVisible] = useState(false)
  const timeout = useRef(null)

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        timeout.current = setTimeout(() => setVisible(true), 500)
      }}
      onMouseLeave={() => {
        clearTimeout(timeout.current)
        setVisible(false)
      }}
    >
      {children}
      <div
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md bg-black/95 border border-white/10 text-[11px] text-white font-medium whitespace-nowrap pointer-events-none transition-all duration-200 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
        }`}
      >
        {label}
      </div>
    </div>
  )
}

export default function HeroTopPick() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [skippedTmdbIds, setSkippedTmdbIds] = useState([])
  const [posterLoaded, setPosterLoaded] = useState(false)
  const [backdropLoaded, setBackdropLoaded] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [user, setUser] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [providers, setProviders] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Single source of truth - always enabled
  const {
    data: movie,
    loading,
    error,
    refetch
  } = useTopPick({
    enabled: true,
    excludeTmdbIds: skippedTmdbIds,
  })

  // Reset on navigation
  const locationKey = location.key
  useEffect(() => {
    setSkippedTmdbIds([])
    setRefreshKey(0)
    setIsRefreshing(false)
  }, [locationKey])

  // Auth
  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (mounted) setUser(u)
    })
    return () => {
      mounted = false
    }
  }, [])

  // Reset visual state when movie changes
  // Clear refreshing state when new data arrives after refetch
  useEffect(() => {
    if (!loading && movie && isRefreshing) {
      // Clear immediately when new movie arrives
      setIsRefreshing(false)
    }
  }, [loading, movie, isRefreshing])

  // Preload next movie's backdrop for instant display
  useEffect(() => {
    if (!movie?.backdrop_path) return
    
    const img = new Image()
    img.src = tmdbImg(movie.backdrop_path, 'w1280')
  }, [movie?.backdrop_path])

  // PROGRESSIVE REVEAL: Show content quickly, images can lag
  useEffect(() => {
    if (!movie) return

    // Strategy: Reveal after 500ms OR when images load (whichever comes first)
    let revealTimeout
    let forceRevealTimeout

    // If either image loads, reveal immediately
    if (posterLoaded || backdropLoaded) {
      revealTimeout = setTimeout(() => setRevealed(true), 100)
    }

    // Force reveal after 500ms even if images haven't loaded
    // This ensures content appears quickly
    forceRevealTimeout = setTimeout(() => {
      if (!revealed) {
        console.log('[HeroTopPick] Force revealing content after 500ms')
        setRevealed(true)
        // Mark as "loaded" to prevent flicker
        if (!posterLoaded) setPosterLoaded(true)
        if (!backdropLoaded) setBackdropLoaded(true)
      }
    }, 500)

    return () => {
      clearTimeout(revealTimeout)
      clearTimeout(forceRevealTimeout)
    }
  }, [posterLoaded, backdropLoaded, revealed, movie])

  // Fetch watch providers
  useEffect(() => {
    const tmdbId = movie?.tmdb_id || movie?.id
    if (!tmdbId || !TMDB_API_KEY) {
      setProviders(null)
      return
    }

    let cancelled = false

    async function loadProviders() {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`
        )

        if (!res.ok) {
          if (!cancelled) setProviders(null)
          return
        }

        const data = await res.json()
        const regionData = data?.results?.CA || data?.results?.US || null

        if (!cancelled) setProviders(regionData)
      } catch (err) {
        console.error('Error fetching watch providers', err)
        if (!cancelled) setProviders(null)
      }
    }

    loadProviders()
    return () => {
      cancelled = true
    }
  }, [movie?.id, movie?.tmdb_id])

  // User movie status
  const {
    isInWatchlist,
    isWatched,
    loading: actionLoading,
    toggleWatchlist,
    toggleWatched
  } = useUserMovieStatus({ 
    user, 
    movie,
    internalMovieId: movie?.id,
    source: 'hero_top_pick' 
  })

  // Track interactions
  const prevWatchlistRef = useRef(isInWatchlist)
  const prevWatchedRef = useRef(isWatched)
  
  useEffect(() => {
  if (!user?.id || !movie?.id) return
  
  if (isInWatchlist && !prevWatchlistRef.current) {
    updateImpression(user.id, movie.id, 'hero', {
      added_to_watchlist: true
    })
  }
  
  // CRITICAL: Set refreshing BEFORE watched state can render
  if (isWatched && !prevWatchedRef.current) {
    updateImpression(user.id, movie.id, 'hero', {
      marked_watched: true
    })
    
    // Immediately set refreshing to prevent watched state from rendering
    setIsRefreshing(true)
    setRefreshKey(k => k + 1)
    
    // Then trigger refetch after cache clears
    setTimeout(() => {
      refetch()
    }, 300)
  }
  
  prevWatchlistRef.current = isInWatchlist
  prevWatchedRef.current = isWatched
}, [isInWatchlist, isWatched, user?.id, movie?.id, refetch])


  const goToDetails = useCallback(() => {
    const tmdbId = movie?.tmdb_id ?? movie?.id
    
    if (user?.id && movie?.id) {
      updateImpression(user.id, movie.id, 'hero', {
        clicked: true,
        clicked_at: new Date().toISOString()
      })
    }
    
    if (tmdbId) {
      navigate(`/movie/${tmdbId}`)
    }
  }, [movie?.tmdb_id, movie?.id, navigate, user?.id, movie])

  const playTrailer = useCallback(() => {
    if (movie?.trailer_url) {
      window.open(movie.trailer_url, '_blank', 'noopener')
    }
  }, [movie?.trailer_url])

  const logFeedback = useCallback(
    async ({ feedbackType, feedbackValue = null }) => {
      if (!user || !movie) return

      const tmdbId = movie.tmdb_id || movie.id
      if (!tmdbId) return

      const payload = {
        user_id: user.id,
        tmdb_id: tmdbId,
        feedback_type: feedbackType,
        feedback_value: feedbackValue,
        page: 'home',
        placement: 'hero_top_pick',
        position: 0,
        mood_id: null,
        viewing_context: null,
        experience_type: null,
        algo_version: 'hero_v1',
        recommendation_score: movie.recommendation_score ?? null,
        reason_seed_tmdb_id: movie.reason_seed_tmdb_id ?? null,
        session_id: null,
        experiment_key: null,
        experiment_variant: null,
        meta: {
          source: 'hero_top_pick',
          vote_average: movie.vote_average ?? null,
          runtime: movie.runtime ?? null,
          skipped_tmdb_ids: skippedTmdbIds,
        },
      }

      const { error: insertError } = await supabase
        .from('user_movie_feedback')
        .insert(payload)
        .select('id')
        .maybeSingle()

      if (insertError) {
        console.error('[HeroTopPick] feedback insert error', insertError)
      }
    },
    [user, movie, skippedTmdbIds]
  )

  const handleShowAnother = useCallback(() => {
  if (!movie || isRefreshing) return

  const tmdbId = movie.tmdb_id || movie.id
  if (!tmdbId) return

  if (user?.id && movie?.id) {
    updateImpression(user.id, movie.id, 'hero', {
      skipped: true
    })
  }

  setSkippedTmdbIds((prev) => {
    const n = Number(tmdbId)
    if (prev.includes(n)) return prev
    return [...prev, n]
  })

  if (user) {
    logFeedback({ feedbackType: 'hero_skip_not_tonight' })
  }

  // Inline the refresh logic
  setIsRefreshing(true)
  setRefreshKey(k => k + 1)
  
  setTimeout(() => {
    refetch()
  }, 200)
}, [movie, isRefreshing, user, logFeedback, refetch])

  // Loading state
  if (loading && !movie) {
    return (
      <section className="relative w-full h-[75vh] min-h-[500px] max-h-[800px] overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/30 via-black to-black" />
        <div className="relative z-10 h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 flex items-end pb-12 lg:pb-16">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 w-full">
            <div className="hidden sm:block w-[200px] lg:w-[260px] flex-shrink-0">
              <div className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />
            </div>
            <div className="flex-1 space-y-4 pb-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                <span className="text-white/40 text-xs font-medium tracking-wide">
                  Finding something you&apos;ll love...
                </span>
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
  const rating = typeof movie.vote_average === 'number'
    ? movie.vote_average.toFixed(1)
    : null

  return (
    <section className="relative w-full h-[75vh] min-h-[500px] max-h-[800px] overflow-hidden bg-black">
      {/* Refreshing overlay */}
      {isRefreshing && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fadeIn" style={{ animationDuration: '0.15s' }}>
          <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-black/80 border border-white/10">
            <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
            <span className="text-white/90 text-sm font-medium">Loading next pick...</span>
          </div>
        </div>
      )}

      {/* === BACKDROP === */}
      <div className="absolute inset-0">
        {/* Blur placeholder - always visible during load */}
        <div
          className={`absolute inset-0 scale-110 transition-opacity duration-700 ${
            backdropLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            backgroundImage: movie.backdrop_path
              ? `url(${tmdbImg(movie.backdrop_path, 'w300')})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center 45%',
            filter: 'blur(30px) saturate(1.2)'
          }}
        />
        
        <div className="absolute top-0 left-0 right-0 h-16 sm:h-20 bg-gradient-to-b from-black/95 via-black/20 to-transparent z-10" />

        {/* OPTIMIZED: Use w1280 instead of 'original' - 5x smaller file size */}
        {movie.backdrop_path && (
          <img
            src={tmdbImg(movie.backdrop_path, 'w1280')}
            alt=""
            aria-hidden="true"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              backdropLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ objectPosition: 'center 45%' }}
            onLoad={() => setBackdropLoaded(true)}
            loading="eager"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 sm:from-black via-black/25 sm:via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_80%,rgba(0,0,0,0.6),transparent)] sm:bg-[radial-gradient(ellipse_80%_50%_at_20%_80%,rgba(0,0,0,0.9),transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/10 via-transparent to-rose-950/10 mix-blend-overlay" />

        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")"
          }}
        />
      </div>

      {/* === CONTENT === */}
      <div className="relative z-10 h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 flex items-end pb-4 sm:pb-6 lg:pb-10">
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 lg:gap-10 w-full items-end">
          <div className="absolute inset-0 bg-gradient-radial from-white/5 via-transparent to-transparent blur-2xl" />

          {/* Poster */}
          <div
            className={`hidden sm:block flex-shrink-0 self-end transition-all duration-500 ease-out ${
              revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <button
              onClick={goToDetails}
              className="group relative w-[180px] lg:w-[240px] xl:w-[260px] rounded-lg overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/15 hover:ring-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-4 focus-visible:ring-offset-black transition-transform duration-500 hover:scale-[1.02]"
              aria-label={`View ${movie.title}`}
            >
              <div className="aspect-[2/3] bg-neutral-900">
                {!posterLoaded && (
                  <div
                    className="absolute inset-0 scale-105"
                    style={{
                      backgroundImage: movie.poster_path
                        ? `url(${tmdbImg(movie.poster_path, 'w92')})`
                        : undefined,
                      backgroundSize: 'cover',
                      filter: 'blur(8px)'
                    }}
                  />
                )}
                <img
                  src={tmdbImg(movie.poster_path || movie.backdrop_path, 'w500')}
                  alt={movie.title}
                  className={`w-full h-full object-cover transition-all duration-500 ${
                    posterLoaded ? 'opacity-100' : 'opacity-0'
                  } group-hover:scale-105`}
                  onLoad={() => setPosterLoaded(true)}
                  loading="eager"
                />

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">View details</span>
                </div>
              </div>
            </button>

            {providers?.flatrate?.[0] && (
              <div
                className={`mt-2 flex items-end gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] transition-all duration-500 delay-100 ${
                  revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <img
                  src={`https://image.tmdb.org/t/p/w92${providers.flatrate[0].logo_path}`}
                  alt={providers.flatrate[0].provider_name}
                  className="h-8 w-8 rounded object-cover"
                />
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-widest text-white/30 font-medium">
                    Streaming on
                  </p>
                  <p className="text-xs text-white/80 font-semibold truncate">
                    {providers.flatrate[0].provider_name}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 flex flex-col justify-end">
            <h1
              className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[3.5rem] font-black text-white leading-[1.1] mb-3 sm:mb-4 transition-all duration-500 delay-75 ${
                revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              {movie.title}
            </h1>

            <div
              className={`flex flex-wrap items-center gap-2 sm:gap-2.5 mb-4 sm:mb-5 transition-all duration-500 delay-100 ${
                revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              {year && (
                <span className="text-xs text-white/60 font-medium">
                  {year}
                </span>
              )}

              {rating && (
                <span className="inline-flex items-center gap-1 text-xs text-white/80 font-medium">
                  {year && <span className="text-white/25">•</span>}
                  <Star className="h-3 w-3 fill-current text-yellow-300" />
                  <span>{rating}</span>
                </span>
              )}

              {movie.runtime > 0 && (
                <span className="text-xs text-white/60 font-medium">
                  {(year || rating) && <span className="mr-2 text-white/25">•</span>}
                  {hours > 0 && `${hours}h `}
                  {mins}m
                </span>
              )}

              {Array.isArray(movie.genres) &&
                movie.genres.slice(0, 2).map((g, idx) => (
                  <span
                    key={g.id || g.name || idx}
                    className="inline-flex items-center text-xs text-white/60 font-medium"
                  >
                    <span className="mx-1 text-white/25">•</span>
                    {g.name || g}
                  </span>
                ))}

              {movie._pickReason?.label && (
                <div className="ml-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/20">
                  <span className="text-xs text-purple-300 font-medium">
                    {movie._pickReason.label}
                  </span>
                </div>
              )}
            </div>

            {movie.overview && (
              <p
                className={`text-sm sm:text-[15px] text-white/60 leading-relaxed max-w-xl line-clamp-2 sm:line-clamp-3 transition-all duration-500 delay-150 ${
                  revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                {movie.overview}
              </p>
            )}

            {movie.director && (
              <p
                className={`mt-4 sm:mt-5 text-xs max-w-xl mb-5 sm:mb-6 text-white/40 transition-all duration-500 delay-200 ${
                  revealed ? 'opacity-100' : 'opacity-0'
                }`}
              >
                Directed by{' '}
                <span className="text-white/60 font-medium">{movie.director.name}</span>
              </p>
            )}

            <div
              className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between transition-all duration-500 delay-200 ${
                revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <button
                  onClick={goToDetails}
                  className="group inline-flex items-center gap-1.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white text-black font-semibold text-sm transition-all duration-300 hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <span>View details</span>
                  <ChevronRight className="h-4 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                </button>

                {movie.trailer_url && (
                  <button
                    onClick={playTrailer}
                    className="group inline-flex items-center gap-1.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 hover:border-white/20 text-white font-semibold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    <Play className="h-4 w-3 fill-current" />
                    <span>Trailer</span>
                  </button>
                )}

                {user && (
                  <div className="flex items-center gap-2 ml-1">
                    <Tooltip label={isInWatchlist ? 'In watchlist' : 'Add to watchlist'}>
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

                    <Tooltip label={isWatched ? 'Watched' : 'Mark watched'}>
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
              
                <Tooltip label="Show another pick">
                  <button
                    onClick={handleShowAnother}
                    disabled={isRefreshing || loading}
                    className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full border backdrop-blur-sm transition-all duration-300 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white focus-visible:ring-white/50`}
                  >
                    {isRefreshing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-32 sm:h-36 bg-gradient-to-t from-black/90 to-transparent md:from-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-40 sm:h-48 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none" />
    </section>
  )
}