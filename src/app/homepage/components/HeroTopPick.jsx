// src/app/homepage/components/HeroTopPick.jsx
import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Loader2,
  Play,
  Check,
  Eye,
  EyeOff,
  Plus,
  ChevronRight,
  SkipForward,
  Sparkles,
} from 'lucide-react'

import { fetchJson, tmdbImg } from '@/shared/api/tmdb'
import { useTopPick } from '@/shared/hooks/useRecommendations'
import { supabase } from '@/shared/lib/supabase/client'
import { useUserMovieStatus } from '@/shared/hooks/useUserMovieStatus'
import { updateImpression } from '@/shared/services/recommendations'

// ============================================================================
// LANGUAGE DISPLAY
// ============================================================================

const LANGUAGE_LABELS = {
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  ml: 'Malayalam',
  kn: 'Kannada',
  ko: 'Korean',
  ja: 'Japanese',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  zh: 'Mandarin',
  ru: 'Russian',
  ar: 'Arabic',
  tr: 'Turkish',
  pl: 'Polish',
  th: 'Thai',
  sv: 'Swedish',
  da: 'Danish',
  no: 'Norwegian',
  fi: 'Finnish',
  nl: 'Dutch',
  he: 'Hebrew',
  id: 'Indonesian',
  ms: 'Malay',
  bn: 'Bengali',
  pa: 'Punjabi',
  mr: 'Marathi',
  gu: 'Gujarati',
}

function LanguageBadge({ lang }) {
  if (!lang || lang === 'en') return null
  const label = LANGUAGE_LABELS[lang] || lang.toUpperCase()
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-white/10 text-white/60 border border-white/10">
      {label}
    </span>
  )
}

// ============================================================================
// PICK REASON — prominent, above the title
// ============================================================================

function PickReasonBadge({ reason }) {
  if (!reason?.label || reason.type === 'default') return null

  const isSeedReason = reason.type === 'seed_embedding' || reason.type === 'seed_similarity' || reason.type === 'seed_similar'
  const isDirector = reason.type === 'director_affinity'
  const isActor = reason.type === 'actor_affinity'

  if (isSeedReason || isDirector || isActor) {
    return (
      <div className="flex items-center gap-1.5 mb-3">
        <Sparkles className="h-3 w-3 text-purple-400 flex-shrink-0" />
        <span className="text-xs font-medium text-purple-300">{reason.label}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 mb-3">
      <div className="h-1 w-1 rounded-full bg-purple-400 flex-shrink-0" />
      <span className="text-xs font-medium text-white/50">{reason.label}</span>
    </div>
  )
}

// ============================================================================
// TOOLTIP
// ============================================================================

function Tooltip({ children, label }) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
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

// ============================================================================
// STREAMING BADGE — works on all screen sizes
// ============================================================================

function StreamingBadge({ providers, revealed }) {
  const provider = providers?.flatrate?.[0] ?? providers?.rent?.[0] ?? providers?.buy?.[0]
  if (!provider) return null

  const isRentOrBuy = !providers?.flatrate?.[0]
  const label = isRentOrBuy ? (providers?.rent?.[0] ? 'Rent on' : 'Buy on') : 'Streaming on'

  return (
    <div
      className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] transition-all duration-500 delay-100 ${
        revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <img
        src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
        alt={provider.provider_name}
        className="h-8 w-8 rounded object-cover"
      />
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-widest text-white/30 font-medium leading-none mb-0.5">{label}</p>
        <p className="text-xs text-white/80 font-semibold truncate leading-none">{provider.provider_name}</p>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function HeroTopPick({
  userId: userIdProp = null,
  preloadedData = null,
  preloadedUser = null,
  onHeroMovie = null,
} = {}) {
  const navigate = useNavigate()
  const location = useLocation()

  const [skippedTmdbIds, setSkippedTmdbIds] = useState([])
  const [skippedGenreIds, setSkippedGenreIds] = useState([])
  const [posterLoaded, setPosterLoaded] = useState(false)
  const [backdropLoaded, setBackdropLoaded] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [providers, setProviders] = useState(null)

  const user = preloadedUser ?? (userIdProp ? { id: userIdProp } : null)
  const userId = user?.id ?? null

  const loadingRef = useRef(false)
  const refetchTimerRef = useRef(null)
  const lastEmittedHeroIdRef = useRef(null)

  const { data: hookMovie, loading, error, refetch } = useTopPick({
    enabled: true,
    userId,
    excludeTmdbIds: skippedTmdbIds,
    penalizedGenreIds: skippedGenreIds,
  })

  const movie = hookMovie ?? preloadedData

  useEffect(() => { loadingRef.current = loading }, [loading])

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

  // Reset session-only state on navigation
  const locationKey = location.key
  useEffect(() => {
    setSkippedTmdbIds([])
    setSkippedGenreIds([])
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

  // Inform parent whenever hero changes
  useEffect(() => {
    if (!movie?.id) return
    if (lastEmittedHeroIdRef.current === movie.id) return
    lastEmittedHeroIdRef.current = movie.id
    onHeroMovie?.({ internalId: movie.id, tmdbId: movie.tmdb_id ?? null, movie })
  }, [movie?.id, movie?.tmdb_id, onHeroMovie]) // eslint-disable-line react-hooks/exhaustive-deps

  // Clear refreshing state when new data arrives
  useEffect(() => {
    if (!loading && movie && isRefreshing) setIsRefreshing(false)
  }, [loading, movie, isRefreshing])

  // Progressive reveal
  useEffect(() => {
    if (!movie) return
    let revealTimeout
    let forceRevealTimeout

    if (posterLoaded || backdropLoaded) {
      revealTimeout = setTimeout(() => setRevealed(true), 100)
    }
    forceRevealTimeout = setTimeout(() => {
      setRevealed(true)
      if (!posterLoaded) setPosterLoaded(true)
      if (!backdropLoaded) setBackdropLoaded(true)
    }, 250)

    return () => {
      clearTimeout(revealTimeout)
      clearTimeout(forceRevealTimeout)
    }
  }, [posterLoaded, backdropLoaded, movie])

  // Fetch watch providers (abortable, idle-deferred)
  useEffect(() => {
    const tmdbId = movie?.tmdb_id
    if (!tmdbId || !revealed) { setProviders(null); return }

    const controller = new AbortController()
    let idleId = null
    let timeoutId = null

    async function loadProviders() {
      try {
        const data = await fetchJson(`/movie/${tmdbId}/watch/providers`, { signal: controller.signal })
        const regionData = data?.results?.CA || data?.results?.US || data?.results?.IN || null
        setProviders(regionData)
      } catch (err) {
        if (err?.name === 'AbortError') return
        setProviders(null)
      }
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(() => loadProviders(), { timeout: 1200 })
    } else {
      timeoutId = setTimeout(loadProviders, 320)
    }

    return () => {
      controller.abort()
      if (idleId && typeof window !== 'undefined' && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleId)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [movie?.tmdb_id, revealed])

  // User movie status
  const { isInWatchlist, isWatched, loading: actionLoading, toggleWatchlist, toggleWatched } =
    useUserMovieStatus({ user, movie, internalMovieId: movie?.id, source: 'hero_top_pick' })

  // Track watchlist / watched transitions
  const prevWatchlistRef = useRef(isInWatchlist)
  const prevWatchedRef = useRef(isWatched)

  useEffect(() => {
    if (!userId || !movie?.id) return

    if (isInWatchlist && !prevWatchlistRef.current) {
      updateImpression(userId, movie.id, 'hero', { added_to_watchlist: true })
    }

    if (isWatched && !prevWatchedRef.current) {
      updateImpression(userId, movie.id, 'hero', { marked_watched: true })
      const tmdbId = movie.tmdb_id
      setIsRefreshing(true)
      if (tmdbId) setSkippedTmdbIds((prev) => (prev.includes(tmdbId) ? prev : [...prev, tmdbId]))
      scheduleRefetchIfIdle(140)
    }

    prevWatchlistRef.current = isInWatchlist
    prevWatchedRef.current = isWatched
  }, [isInWatchlist, isWatched, userId, movie?.id, movie?.tmdb_id, scheduleRefetchIfIdle])

  const goToDetails = useCallback(() => {
    const tmdbId = movie?.tmdb_id
    if (!tmdbId) return
    if (userId && movie?.id) updateImpression(userId, movie.id, 'hero', { clicked: true })
    navigate(`/movie/${tmdbId}`)
  }, [movie, navigate, userId])

  const playTrailer = useCallback(() => {
    if (!movie?.trailer_url) return
    // Track trailer play as a strong interest signal
    if (userId && movie?.id) {
      updateImpression(userId, movie.id, 'hero', { trailer_played: true })
    }
    window.open(movie.trailer_url, '_blank', 'noopener')
  }, [movie, userId])

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
          pick_reason_type: movie._pickReason?.type ?? null,
        },
      }

      const { error: insertError } = await supabase
        .from('user_movie_feedback')
        .insert(payload)
        .select('id')
        .maybeSingle()

      if (insertError) console.error('[HeroTopPick] feedback insert error', insertError)
    },
    [userId, movie, skippedTmdbIds]
  )

  const handleShowAnother = useCallback(() => {
    if (!movie || isRefreshing) return

    const tmdbId = movie.tmdb_id
    setIsRefreshing(true)

    if (userId && movie.id) updateImpression(userId, movie.id, 'hero', { skipped: true })

    logFeedback({ feedbackType: 'hero_skip_not_today' })

    if (tmdbId) setSkippedTmdbIds((prev) => (prev.includes(tmdbId) ? prev : [...prev, tmdbId]))

    // Session genre penalty
    const genreIds = (movie.genres || [])
      .map((g) => (typeof g === 'object' ? g.id : g))
      .filter((id) => typeof id === 'number' && Number.isFinite(id))
    if (genreIds.length > 0) {
      setSkippedGenreIds((prev) => [...new Set([...prev, ...genreIds])])
    }

    scheduleRefetchIfIdle(120)
  }, [movie, isRefreshing, userId, logFeedback, scheduleRefetchIfIdle])

  // ── Loading skeleton ────────────────────────────────────────────────────────

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
                <span className="text-white/35 text-xs font-medium tracking-wide">Finding something you&apos;ll love…</span>
              </div>
              <div className="h-3 w-32 bg-purple-500/10 rounded animate-pulse" />
              <div className="h-10 lg:h-14 w-2/3 bg-purple-500/5 rounded-xl animate-pulse" />
              <div className="h-4 w-1/3 bg-white/5 rounded-lg animate-pulse" />
              <div className="h-16 w-full max-w-xl bg-white/5 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!movie) return null
  if (error && !hookMovie && !preloadedData) return null

  // ── Derived display values ──────────────────────────────────────────────────

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
  const hours = movie.runtime ? Math.floor(movie.runtime / 60) : 0
  const mins = movie.runtime ? movie.runtime % 60 : 0
  // FeelFlick rating takes priority over raw TMDB vote_average
  const ffRating = movie.ff_final_rating ?? movie.ff_rating
  const displayRating = ffRating != null ? Number(ffRating).toFixed(1) : null

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
            <span className="text-white/90 text-sm font-medium">Finding your next pick…</span>
          </div>
        </div>
      )}

      {/* ── Backdrop ── */}
      <div className="absolute inset-0">
        <div className="absolute inset-y-0 left-0 hidden md:block md:w-[25%] bg-black" />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 hidden md:block"
          style={{ width: '38%', background: 'radial-gradient(120% 100% at 82% 50%, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 22%, rgba(0,0,0,0) 62%)' }}
        />

        <div className="absolute inset-y-0 left-0 right-0 overflow-hidden md:left-[25%]">
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${backdropLoaded ? 'opacity-0' : 'opacity-100'}`}
            style={{
              backgroundImage: movie.backdrop_path ? `url(${tmdbImg(movie.backdrop_path, 'w92')})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: '50% 35%',
              filter: 'blur(30px) saturate(1.2)',
            }}
          />
          {movie.backdrop_path && (
            <img
              src={tmdbImg(movie.backdrop_path, 'original')}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 h-full w-full object-cover object-[50%_35%] sm:object-[65%_35%] transition-opacity duration-700 ${backdropLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setBackdropLoaded(true)}
              loading="eager"
              fetchPriority="high"
            />
          )}
          <div className="absolute inset-0 bg-black/35" />
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-[22%] hidden sm:block"
            style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.88) 28%, rgba(0,0,0,0.58) 56%, rgba(0,0,0,0.18) 82%, rgba(0,0,0,0) 100%)' }}
          />
          <div
            className="pointer-events-none absolute inset-0 hidden sm:block"
            style={{ background: 'radial-gradient(110% 84% at 70% 36%, rgba(0,0,0,0) 32%, rgba(0,0,0,0.18) 68%, rgba(0,0,0,0.36) 100%)' }}
          />
        </div>

        <div className="absolute bottom-0 inset-x-0 h-[65%] bg-gradient-to-t from-black via-black/75 to-transparent" />
        <div className="absolute inset-0 hidden sm:block bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 hidden md:block"
          style={{ width: '36%', background: 'linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.98) 42%, rgba(0,0,0,0.82) 64%, rgba(0,0,0,0.38) 84%, rgba(0,0,0,0) 100%)' }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 hidden md:block"
          style={{
            left: 'calc(25% - 2px)', width: '14vw', maxWidth: '220px',
            background: 'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.58) 38%, rgba(0,0,0,0.18) 72%, rgba(0,0,0,0) 100%)',
            filter: 'blur(12px)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-2/3 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 65% 55% at 15% 100%, rgba(88,28,135,0.22) 0%, transparent 70%)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
        />
      </div>

      {/* ── Content ── */}
      <div
        className="relative z-10 h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 flex items-end pb-4 sm:pb-6 lg:pb-10"
        style={{ paddingTop: 'calc(var(--hdr-h, 64px) + 8px)' }}
      >
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 lg:gap-10 w-full items-end">
          <div className="absolute inset-0 bg-gradient-radial from-white/5 via-transparent to-transparent blur-2xl" />

          {/* ── Poster (desktop only) ── */}
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
                  className={`w-full h-full object-cover transition-all duration-500 ${posterLoaded ? 'opacity-100' : 'opacity-0'} group-hover:scale-105`}
                  onLoad={() => setPosterLoaded(true)}
                  loading="eager"
                  fetchPriority="high"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">View details</span>
                </div>
              </div>
            </button>

            {/* Streaming badge — desktop only, matches poster width */}
            <div className="mt-2 hidden sm:block w-[180px] lg:w-[240px] xl:w-[260px]">
              <StreamingBadge providers={providers} revealed={revealed} />
            </div>
          </div>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0 flex flex-col justify-end">

            {/* Pick reason — prominent, above title */}
            <div className={`transition-all duration-500 delay-50 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <PickReasonBadge reason={movie._pickReason} />
            </div>

            {/* Title */}
            <h1
              className={`text-3xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[3.5rem] font-black text-white leading-[1.1] mb-3 sm:mb-4 transition-all duration-500 delay-75 ${
                revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              {movie.title}
            </h1>

            {/* Meta rows */}
            <div
              className={`flex flex-col gap-1.5 mb-4 sm:mb-5 transition-all duration-500 delay-100 ${
                revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              {/* Row 1: year · rating · runtime · language */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {year && <span className="text-xs text-white/50 font-medium">{year}</span>}

                {displayRating && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-300/90">
                    {year && <span className="text-white/20">·</span>}
                    <span>★ {displayRating}</span>
                    <span className="text-white/25 font-normal text-[10px]">FF</span>
                  </span>
                )}

                {movie.runtime > 0 && (
                  <span className="text-xs text-white/50 font-medium">
                    <span className="mr-1.5 text-white/20">·</span>
                    {hours > 0 && `${hours}h `}{mins}m
                  </span>
                )}

                <LanguageBadge lang={movie.original_language} />
              </div>

              {/* Row 2: genres */}
              {Array.isArray(movie.genres) && movie.genres.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {movie.genres.slice(0, 3).map((g, idx) => (
                    <span key={g.id || g.name || idx} className="inline-flex items-center text-xs text-white/35 font-medium">
                      {idx > 0 && <span className="mr-1.5 text-white/15">·</span>}
                      {g.name || g}
                    </span>
                  ))}
                </div>
              )}

              {/* Row 3: director */}
              {movie.director_name && (
                <div>
                  <span className="text-xs text-white/30 font-medium">Directed by {movie.director_name}</span>
                </div>
              )}
            </div>

            {/* Overview */}
            {movie.overview && (
              <p
                className={`text-sm sm:text-[15px] text-white/55 leading-relaxed max-w-xl line-clamp-2 sm:line-clamp-3 mb-5 sm:mb-6 transition-all duration-500 delay-150 ${
                  revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                {movie.overview}
              </p>
            )}

            {/* Actions */}
            <div
              className={`flex flex-wrap items-center gap-2.5 sm:gap-3 transition-all duration-500 delay-200 ${
                revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              {/* Primary CTA */}
              <button
                onClick={goToDetails}
                className="group inline-flex items-center gap-1.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <span>View details</span>
                <ChevronRight className="h-4 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>

              {/* Trailer */}
              {movie.trailer_url && (
                <button
                  onClick={playTrailer}
                  className="group inline-flex items-center gap-1.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 hover:border-white/20 text-white font-semibold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <Play className="h-4 w-3 fill-current" />
                  <span>Trailer</span>
                </button>
              )}

              {/* Watchlist + Watched icon buttons */}
              {user && (
                <div className="flex items-center gap-2">
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
                      {actionLoading.watchlist ? <Loader2 className="h-4 w-4 animate-spin" /> : isInWatchlist ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </button>
                  </Tooltip>

                  <Tooltip label={isWatched ? 'Watched' : 'Mark as watched'}>
                    <button
                      onClick={toggleWatched}
                      disabled={actionLoading.watched}
                      className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full border backdrop-blur-sm transition-all duration-300 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 ${
                        isWatched
                          ? 'bg-purple-500/30 border-purple-400/50 text-purple-300 focus-visible:ring-purple-400'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white focus-visible:ring-white/50'
                      }`}
                    >
                      {actionLoading.watched ? <Loader2 className="h-4 w-4 animate-spin" /> : isWatched ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </Tooltip>
                </div>
              )}

              {/* Not today */}
              <button
                onClick={handleShowAnother}
                disabled={isRefreshing || (loading && !movie)}
                aria-label="Skip — not today"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-white/[0.08] hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.08] text-white/40 hover:text-white/70 text-xs font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                {isRefreshing
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <SkipForward className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Not today</span>
              </button>
            </div>

          </div>
        </div>
      </div>

    </section>
  )
}
