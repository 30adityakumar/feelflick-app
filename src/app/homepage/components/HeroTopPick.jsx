// src/app/homepage/components/HeroTopPick.jsx
import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Loader2,
  Play,
  Check,
  Eye,
  EyeOff,
  Bookmark,
  ChevronRight,
  Star,
  RefreshCw,
} from 'lucide-react'

import { fetchJson, tmdbImg } from '@/shared/api/tmdb'
import { useTopPick } from '@/shared/hooks/useRecommendations'
import { supabase } from '@/shared/lib/supabase/client'
import { useUserMovieStatus } from '@/shared/hooks/useUserMovieStatus'
import { updateImpression } from '@/shared/services/recommendations'

function Tooltip({ children, label }) {
  const [visible, setVisible] = useState(false)
  const timeout = useRef(null)

  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current)
    }
  }, [])

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        timeout.current = setTimeout(() => setVisible(true), 500)
      }}
      onMouseLeave={() => {
        if (timeout.current) clearTimeout(timeout.current)
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

/**
 * HeroTopPick
 *
 * Key production improvements vs current:
 * - Supports `preloadedData` as an instant paint while hook hydrates.
 * - Emits `onHeroMovie` callback when the hero movie changes (so HomePage can exclude it from rows without re-fetching).
 * - Removes console noise and cleans up timers.
 * - Uses AbortController for providers fetch.
 */
export default function HeroTopPick({
  userId: userIdProp = null,
  preloadedData = null,
  preloadedUser = null,
  onHeroMovie = null, // (payload) => void
} = {}) {
  const navigate = useNavigate()
  const location = useLocation()

  const [skippedTmdbIds, setSkippedTmdbIds] = useState([])
  const [posterLoaded, setPosterLoaded] = useState(false)
  const [backdropLoaded, setBackdropLoaded] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [providers, setProviders] = useState(null)

  // User identity is provided by PostAuthGate via HomePage (preferred).
  const user = preloadedUser ?? (userIdProp ? { id: userIdProp } : null)
  const userId = user?.id ?? null

  // Avoid duplicate refetches when we add exclusions.
  const loadingRef = useRef(false)
  const refetchTimerRef = useRef(null)

  // Prevent emitting the same hero movie multiple times.
  const lastEmittedHeroIdRef = useRef(null)

  // Always keep the hook enabled. Prefer userId passed from HomePage so this fetch starts immediately.
  const { data: hookMovie, loading, error, refetch } = useTopPick({
    enabled: true,
    userId,
    excludeTmdbIds: skippedTmdbIds,
  })

  // Preloaded paints immediately; hook result takes precedence once available.
  const movie = hookMovie ?? preloadedData

  useEffect(() => {
    loadingRef.current = loading
  }, [loading])

  useEffect(() => {
    return () => {
      if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current)
    }
  }, [])

  const scheduleRefetchIfIdle = useCallback(
    (delay = 90) => {
      if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current)
      refetchTimerRef.current = setTimeout(() => {
        if (!loadingRef.current) refetch()
      }, delay)
    },
    [refetch]
  )

  // Reset on navigation
  const locationKey = location.key
  useEffect(() => {
    setSkippedTmdbIds([])
    setIsRefreshing(false)
  }, [locationKey])

  // Reset visual state when movie changes
  useEffect(() => {
    if (!movie?.id) return
    setPosterLoaded(false)
    setBackdropLoaded(false)
    setRevealed(false)
    setProviders(null)
  }, [movie?.id])

  // Inform parent whenever hero changes (used to exclude hero from other rows without extra fetches)
  useEffect(() => {
    if (!movie?.id) return
    if (lastEmittedHeroIdRef.current === movie.id) return

    lastEmittedHeroIdRef.current = movie.id
    onHeroMovie?.({
      internalId: movie.id,
      tmdbId: movie.tmdb_id ?? null,
      movie,
    })
  }, [movie?.id, movie?.tmdb_id, onHeroMovie]) // eslint-disable-line react-hooks/exhaustive-deps

  // Clear refreshing state when new data arrives after refetch
  useEffect(() => {
    if (!loading && movie && isRefreshing) {
      setIsRefreshing(false)
    }
  }, [loading, movie, isRefreshing])

  // PROGRESSIVE REVEAL: show content quickly, images can lag
  useEffect(() => {
    if (!movie) return

    let revealTimeout
    let forceRevealTimeout

    // If either image loads, reveal quickly
    if (posterLoaded || backdropLoaded) {
      revealTimeout = setTimeout(() => setRevealed(true), 100)
    }

    // Force reveal after 250ms even if images haven't loaded
    forceRevealTimeout = setTimeout(() => {
      setRevealed(true)
      // Mark as "loaded" to prevent flicker if images come in late
      if (!posterLoaded) setPosterLoaded(true)
      if (!backdropLoaded) setBackdropLoaded(true)
    }, 250)

    return () => {
      clearTimeout(revealTimeout)
      clearTimeout(forceRevealTimeout)
    }
  }, [posterLoaded, backdropLoaded, movie])

  // Fetch watch providers (abortable)
  useEffect(() => {
    const tmdbId = movie?.tmdb_id
    if (!tmdbId || !revealed) {
      setProviders(null)
      return
    }

    const controller = new AbortController()
    let idleId = null
    let timeoutId = null

    async function loadProviders() {
      try {
        const data = await fetchJson(`/movie/${tmdbId}/watch/providers`, {
          signal: controller.signal,
        })
        const regionData = data?.results?.CA || data?.results?.US || null
        setProviders(regionData)
      } catch (err) {
        if (err?.name === 'AbortError') return
        console.error('Error fetching watch providers', err)
        setProviders(null)
      }
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(() => {
        loadProviders()
      }, { timeout: 1200 })
    } else {
      timeoutId = setTimeout(() => {
        loadProviders()
      }, 320)
    }

    return () => {
      controller.abort()
      if (idleId && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [movie?.tmdb_id, revealed])

  // User movie status
  const {
    isInWatchlist,
    isWatched,
    loading: actionLoading,
    toggleWatchlist,
    toggleWatched,
  } = useUserMovieStatus({
    user,
    movie,
    internalMovieId: movie?.id,
    source: 'hero_top_pick',
  })

  // Track interactions
  const prevWatchlistRef = useRef(isInWatchlist)
  const prevWatchedRef = useRef(isWatched)

  useEffect(() => {
    if (!userId || !movie?.id) return

    if (isInWatchlist && !prevWatchlistRef.current) {
      updateImpression(userId, movie.id, 'hero', { added_to_watchlist: true })
    }

    // When marked watched, advance immediately to a new pick.
    if (isWatched && !prevWatchedRef.current) {
      updateImpression(userId, movie.id, 'hero', { marked_watched: true })

      const tmdbId = movie.tmdb_id
      setIsRefreshing(true)
      if (tmdbId) {
        setSkippedTmdbIds((prev) => (prev.includes(tmdbId) ? prev : [...prev, tmdbId]))
      }
      scheduleRefetchIfIdle(140)
    }

    prevWatchlistRef.current = isInWatchlist
    prevWatchedRef.current = isWatched
  }, [isInWatchlist, isWatched, userId, movie?.id, movie?.tmdb_id, scheduleRefetchIfIdle])

  const goToDetails = useCallback(() => {
    const tmdbId = movie?.tmdb_id
    if (!tmdbId) {
      console.warn('[HeroTopPick] Missing tmdb_id; cannot navigate', movie)
      return
    }

    if (userId && movie?.id) {
      updateImpression(userId, movie.id, 'hero', {
        clicked: true,
        clicked_at: new Date().toISOString(),
      })
    }

    navigate(`/movie/${tmdbId}`)
  }, [movie, navigate, userId])

  const playTrailer = useCallback(() => {
    if (movie?.trailer_url) {
      window.open(movie.trailer_url, '_blank', 'noopener')
    }
  }, [movie?.trailer_url])

  const logFeedback = useCallback(
    async ({ feedbackType, feedbackValue = null }) => {
      if (!userId || !movie) return
      const tmdbId = movie.tmdb_id
      if (!tmdbId) return

      const payload = {
        user_id: userId,
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
    [userId, movie, skippedTmdbIds]
  )

  const handleShowAnother = useCallback(() => {
    if (!movie || isRefreshing) return

    const tmdbId = movie.tmdb_id
    setIsRefreshing(true)

    if (userId && movie.id) {
      updateImpression(userId, movie.id, 'hero', { skipped: true })
    }

    logFeedback({ feedbackType: 'hero_skip_not_tonight' })

    if (tmdbId) {
      setSkippedTmdbIds((prev) => (prev.includes(tmdbId) ? prev : [...prev, tmdbId]))
    }

    scheduleRefetchIfIdle(120)
  }, [movie, isRefreshing, userId, logFeedback, scheduleRefetchIfIdle])

  // Loading state (only when nothing to render)
  if (loading && !movie) {
    return (
      <section className="relative w-full h-[75vh] min-h-[500px] max-h-[800px] overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/30 via-black to-black" />
        <div className="absolute bottom-0 left-0 right-0 h-2/3 pointer-events-none" style={{ background: 'radial-gradient(ellipse 65% 55% at 15% 100%, rgba(88,28,135,0.18) 0%, transparent 70%)' }} />
        <div className="relative z-10 h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 flex items-end pb-12 lg:pb-16">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 w-full">
            <div className="hidden sm:block w-[200px] lg:w-[260px] flex-shrink-0">
              <div className="aspect-[2/3] rounded-xl bg-purple-500/5 animate-pulse" />
            </div>
            <div className="flex-1 space-y-4 pb-2">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(168,85,247,0.2)" strokeWidth="3" />
                  <path d="M21 12a9 9 0 0 0-9-9v9z" fill="rgb(168,85,247)" />
                </svg>
                <span className="text-white/35 text-xs font-medium tracking-wide">
                  Finding something you&apos;ll love…
                </span>
              </div>
              <div className="h-10 lg:h-14 w-2/3 bg-purple-500/5 rounded-xl animate-pulse" />
              <div className="h-4 w-1/3 bg-white/5 rounded-lg animate-pulse" />
              <div className="h-16 w-full max-w-xl bg-white/5 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Production-friendly: keep the last preloaded movie if hook errors
  if (!movie) return null
  if (error && !hookMovie && !preloadedData) return null

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
  const hours = movie.runtime ? Math.floor(movie.runtime / 60) : 0
  const mins = movie.runtime ? movie.runtime % 60 : 0
  const rating = typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : null
  const desktopBackdropStart = '25%'
  const desktopBackdropFocus = '65% 35%'

  return (
    <section className="relative w-full h-[75vh] min-h-[500px] max-h-[800px] overflow-hidden bg-black">
      {/* Refreshing overlay */}
      {isRefreshing && (
        <div
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fadeIn"
          style={{ animationDuration: '0.15s' }}
        >
          <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-black/80 border border-white/10">
            <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
            <span className="text-white/90 text-sm font-medium">Loading next pick...</span>
          </div>
        </div>
      )}

      {/* === BACKDROP === */}
      <div className="absolute inset-0">
        <div className="absolute inset-y-0 left-0 hidden md:block md:w-[25%] bg-black" />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 hidden md:block"
          style={{
            width: '38%',
            background:
              'radial-gradient(120% 100% at 82% 50%, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 22%, rgba(0,0,0,0) 62%)',
          }}
        />

        <div className="absolute inset-y-0 left-0 right-0 overflow-hidden md:left-[25%]">
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${
              backdropLoaded ? 'opacity-0' : 'opacity-100'
            }`}
            style={{
              backgroundImage: movie.backdrop_path ? `url(${tmdbImg(movie.backdrop_path, 'w92')})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: desktopBackdropFocus,
              filter: 'blur(30px) saturate(1.2)',
            }}
          />

          {movie.backdrop_path && (
            <img
              src={tmdbImg(movie.backdrop_path, 'original')}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                backdropLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ objectPosition: desktopBackdropFocus }}
              onLoad={() => setBackdropLoaded(true)}
              loading="eager"
              fetchPriority="high"
            />
          )}

          {/* Keep the image moody without crushing detail. */}
          <div className="absolute inset-0 bg-black/18" />
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-[22%]"
            style={{
              background:
                'linear-gradient(90deg, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.88) 28%, rgba(0,0,0,0.58) 56%, rgba(0,0,0,0.18) 82%, rgba(0,0,0,0) 100%)',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(110% 84% at 70% 36%, rgba(0,0,0,0) 32%, rgba(0,0,0,0.18) 68%, rgba(0,0,0,0.36) 100%)',
            }}
          />
        </div>

        {/* Bottom fade — text lives here */}
        <div className="absolute bottom-0 inset-x-0 h-[52%] bg-gradient-to-t from-black via-black/60 to-transparent" />
        {/* Global readability falloff plus a hard desktop seam where the backdrop begins. */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/44 via-black/10 to-transparent" />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 hidden md:block"
          style={{
            width: '36%',
            background:
              'linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.98) 42%, rgba(0,0,0,0.82) 64%, rgba(0,0,0,0.38) 84%, rgba(0,0,0,0) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 hidden md:block"
          style={{
            left: `calc(${desktopBackdropStart} - 2px)`,
            width: '14vw',
            maxWidth: '220px',
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.58) 38%, rgba(0,0,0,0.18) 72%, rgba(0,0,0,0) 100%)',
            filter: 'blur(12px)',
          }}
        />
        {/* FeelFlick purple glow — bottom left */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2/3 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 65% 55% at 15% 100%, rgba(88,28,135,0.22) 0%, transparent 70%)' }}
        />

        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* === CONTENT === */}
      <div
        className="relative z-10 h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 flex items-end pb-4 sm:pb-6 lg:pb-10"
        // Keep hero content clear of the fixed header/gradient; header writes --hdr-h on <html>.
        style={{ paddingTop: 'calc(var(--hdr-h, 64px) + 8px)' }}
      >
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
              className="group relative w-[180px] lg:w-[240px] xl:w-[260px] rounded-xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/12 hover:ring-purple-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 focus-visible:ring-offset-4 focus-visible:ring-offset-black transition-all duration-500 hover:scale-[1.02]"
              aria-label={`View ${movie.title}`}
            >
              <div className="aspect-[2/3] bg-neutral-900">
                {!posterLoaded && (
                  <div
                    className="absolute inset-0 scale-105"
                    style={{
                      backgroundImage: movie.poster_path ? `url(${tmdbImg(movie.poster_path, 'w92')})` : undefined,
                      backgroundSize: 'cover',
                      filter: 'blur(8px)',
                    }}
                  />
                )}
                <img
                  src={tmdbImg(movie.poster_path || movie.backdrop_path, 'w342')}
                  alt={movie.title}
                  className={`w-full h-full object-cover transition-all duration-500 ${
                    posterLoaded ? 'opacity-100' : 'opacity-0'
                  } group-hover:scale-105`}
                  onLoad={() => setPosterLoaded(true)}
                  loading="eager"
                  fetchPriority="high"
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
                  <p className="text-[9px] uppercase tracking-widest text-white/30 font-medium">Streaming on</p>
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
              {year && <span className="text-xs text-white/60 font-medium">{year}</span>}

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
                  <span key={g.id || g.name || idx} className="inline-flex items-center text-xs text-white/60 font-medium">
                    <span className="mx-1 text-white/25">•</span>
                    {g.name || g}
                  </span>
                ))}

              {movie._pickReason?.label && (
                <div className="ml-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/20">
                  <span className="text-xs text-purple-300 font-medium">{movie._pickReason.label}</span>
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
                Directed by <span className="text-white/60 font-medium">{movie.director.name}</span>
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
                  className="group inline-flex items-center gap-1.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
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
                            ? 'bg-purple-500/30 border-purple-400/50 text-purple-300 focus-visible:ring-purple-400'
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
                    disabled={isRefreshing || (loading && !movie)}
                    className="h-10 w-10 sm:h-11 sm:w-11 rounded-full border backdrop-blur-sm transition-all duration-300 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white focus-visible:ring-white/50"
                  >
                    {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}
