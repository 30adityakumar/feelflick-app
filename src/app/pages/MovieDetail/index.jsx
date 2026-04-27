// src/app/pages/MovieDetail/index.jsx
import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import {
  Play, Bookmark, Check, Clock, Share2,
  Eye, EyeOff, Heart, ChevronLeft, ListPlus, X,
} from 'lucide-react'

import RecommendationFeedback from '@/shared/components/RecommendationFeedback'
import { useUserMovieStatus } from '@/shared/hooks/useUserMovieStatus'
import DatabaseValidationPanel from '@/shared/components/DatabaseValidationPanel'
import MovieSentimentWidget from '@/shared/components/MovieSentimentWidget'
import { useMovieRating } from '@/shared/hooks/useMovieRating'
import { usePageView } from '@/shared/hooks/useInteractionTracking'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { trackTrailerPlay, trackShare } from '@/shared/services/interactions'
import { track } from '@/shared/services/analytics'
import { invalidatePersonalCache } from '@/shared/services/personalRating'
import { fetchJson, getMovieDetails } from '@/shared/api/tmdb'

import { IMG, formatRuntime, yearOf } from './utils'
import MovieCast from './MovieCast'
import MovieVideos from './MovieVideos'
import MovieSimilar from './MovieSimilar'
import { WhereToWatch, MovieDetails, ProductionCompanies, CollectionCard } from './MovieSidebar'
import { motion, AnimatePresence } from 'framer-motion'
import StarRating from '@/shared/components/StarRating'
import FFRatingHero from './FFRatingHero'
import RatingBreakdown from './RatingBreakdown'
import MoodChips from './MoodChips'
import AddToListModal from '@/app/pages/lists/AddToListModal'
import ToastNotification from '@/components/ToastNotification'

// === QUICK-RATE PROMPT ===

// Purely presentational — no hooks, no timers. All state lives in MovieDetail.
// Uses StarRating in compact mode (5 half-step stars, no label).
function QuickRatePrompt({ onRate, onDismiss, saved }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => e.stopPropagation()}
      className="relative overflow-hidden inline-flex flex-col items-center gap-1 rounded-lg bg-white/8 backdrop-blur-sm border border-white/14 px-3 py-1.5"
    >
      {saved ? (
        <span className="text-xs text-white/60 py-0.5">Saved ✓</span>
      ) : (
        <>
          <span className="text-xs text-white/60">How was it?</span>
          <StarRating
            value={0}
            onChange={onRate}
            size="sm"
            showLabel={false}
            showClearButton={false}
          />
        </>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="absolute top-1 right-1 text-white/20 hover:text-white/60 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
      {/* Progress bar depletes over 4s via Framer Motion — declarative, no JS timer */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
        <motion.div
          className="h-full bg-white/60"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 4, ease: 'linear' }}
        />
      </div>
    </motion.div>
  )
}

export default function MovieDetail() {
  const { id } = useParams()
  const location = useLocation()
  const { sessionId, movieId } = location.state || {}
  const navigate = useNavigate()

  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [movie, setMovie]             = useState(null)
  const [credits, setCredits]         = useState({ cast: [], crew: [] })
  const [videos, setVideos]           = useState([])
  const [recs, setRecs]               = useState([])
  const [providers, setProviders]     = useState({ flatrate: [], rent: [], buy: [], link: '' })
  const [certification, setCertification] = useState('')
  const [internalMovieId, setInternalMovieId] = useState(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [userFeedback, setUserFeedback] = useState(null)
  const [internalMovieData, setInternalMovieData] = useState(null)
  const [showAddToList, setShowAddToList] = useState(false)
  const [showQuickRate, setShowQuickRate] = useState(false)
  const [quickRateSaved, setQuickRateSaved] = useState(false)
  const [showProfileToast, setShowProfileToast] = useState(false)
  const showQuickRateRef = useRef(false)
  showQuickRateRef.current = showQuickRate  // latest-value ref — always in sync with current render
  const { user } = useAuthSession()

  usePageView(internalMovieId, 'movie_detail')

  // Track PostHog event once per movie load
  useEffect(() => {
    if (!movie) return
    track('movie_detail_viewed', {
      movie_id: movie.id,
      movie_title: movie.title,
    })
  }, [movie?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const startTime = Date.now()
    return () => {
      console.log(`[MovieDetail] User spent ${Math.round((Date.now() - startTime) / 1000)}s on page`)
    }
  }, [internalMovieId])

  // TMDB data
  useEffect(() => {
    let abort = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [d, rel] = await Promise.all([
          getMovieDetails(id, {
            append: 'videos,recommendations,credits,keywords',
          }),
          fetchJson(`/movie/${id}/release_dates`),
        ])
        if (abort) return
        if (d?.success === false || d?.status_code) throw new Error(d?.status_message || 'Failed to load')
        setMovie(d)
        setCredits({ cast: d?.credits?.cast?.slice(0, 10) || [], crew: d?.credits?.crew || [] })
        setVideos(d?.videos?.results || [])
        setRecs(d?.recommendations?.results?.slice(0, 12) || [])
        const usCert = rel?.results?.find(r => r.iso_3166_1 === 'US')?.release_dates?.[0]?.certification || ''
        setCertification(usCert)
      } catch (e) {
        if (!abort) setError(e?.message || 'Could not load movie.')
      } finally {
        if (!abort) setLoading(false)
      }
    }
    load()
    return () => { abort = true }
  }, [id])

  // Providers
  useEffect(() => {
    let active = true
    async function loadProviders() {
      try {
        const json = await fetchJson(`/movie/${id}/watch/providers`)
        const area = json?.results?.['US'] || null
        if (!active) return
        if (area) {
          const pick = k => (area[k] || []).slice(0, 6)
          setProviders({ flatrate: pick('flatrate'), rent: pick('rent'), buy: pick('buy'), link: area.link })
        } else {
          setProviders({ flatrate: [], rent: [], buy: [], link: '' })
        }
      } catch {
        if (active) setProviders({ flatrate: [], rent: [], buy: [], link: '' })
      }
    }
    loadProviders()
    return () => { active = false }
  }, [id])

  const {
    isInWatchlist, isWatched,
    loading: actionLoading,
    toggleWatchlist: rawToggleWatchlist,
    toggleWatched: rawToggleWatched,
    internalId,
  } = useUserMovieStatus({ user, movie, source: 'movie_detail' })

  useEffect(() => { if (internalId) setInternalMovieId(internalId) }, [internalId])

  useEffect(() => {
    const handleFeedbackPrompt = e => {
      if (showQuickRateRef.current) return
      const { internalMovieId: eid, tmdbId } = e.detail
      if ((tmdbId && String(tmdbId) === String(id)) || (eid && eid === internalMovieId))
        setShowFeedbackModal(true)
    }
    window.addEventListener('prompt-movie-feedback', handleFeedbackPrompt)
    return () => window.removeEventListener('prompt-movie-feedback', handleFeedbackPrompt)
  }, [id, internalMovieId])

  // Authoritative 4s auto-dismiss timer for QuickRatePrompt — lives in parent so
  // component remounts can never reset it. Also resets quickRateSaved on any dismiss.
  useEffect(() => {
    if (!showQuickRate) {
      setQuickRateSaved(false)
      return
    }
    const id = setTimeout(() => {
      showQuickRateRef.current = false
      setShowQuickRate(false)
    }, 4000)
    return () => clearTimeout(id)
  }, [showQuickRate])

  const { rating: userRating, reviewText: userReview, loading: ratingLoading } = useMovieRating(internalMovieId, user?.id)

  // Sentiment + tags
  useEffect(() => {
    if (!user?.id || !internalMovieId) return
    let active = true
    ;(async () => {
      const { data } = await supabase
        .from('user_movie_feedback')
        .select('sentiment, viewing_context_tags, what_stood_out')
        .eq('user_id', user.id)
        .eq('movie_id', internalMovieId)
        .maybeSingle()
      if (active) setUserFeedback(data ?? null)
    })()
    return () => { active = false }
  }, [user?.id, internalMovieId])


  // DB movie row for ff_* rating columns (used by FFRatingHero + RatingBreakdown)
  useEffect(() => {
    if (!internalMovieId) return
    let active = true
    ;(async () => {
      const { data } = await supabase
        .from('movies')
        .select('id, tmdb_id, ff_critic_rating, ff_critic_confidence, ff_audience_rating, ff_audience_confidence, ff_community_rating, ff_community_confidence, ff_community_votes, ff_rating_genre_normalized, primary_genre, mood_tags, tone_tags, fit_profile')
        .eq('id', internalMovieId)
        .maybeSingle()
      if (active && data) setInternalMovieData(data)
    })()
    return () => { active = false }
  }, [internalMovieId])

  const mutating = actionLoading.watchlist || actionLoading.watched

  const ytTrailer = useMemo(() => {
    const t = videos.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
    return t ? `https://www.youtube.com/watch?v=${t.key}` : null
  }, [videos])

  const director = useMemo(() => credits.crew?.find(c => c.job === 'Director'), [credits])
  const writer   = useMemo(() => credits.crew?.find(c => c.job === 'Screenplay' || c.job === 'Writer' || c.job === 'Story'), [credits])

  const ensureAuthed = useCallback(async () => {
    if (user?.id) return true
    navigate('/auth', { replace: true, state: { from: `/movie/${id}` } })
    return false
  }, [user?.id, navigate, id])

  const handleToggleWatchlist = useCallback(async () => {
    if (!await ensureAuthed()) return
    await rawToggleWatchlist()
  }, [ensureAuthed, rawToggleWatchlist])

  const handleToggleWatched = useCallback(async () => {
    if (!await ensureAuthed()) return
    const wasWatched = isWatched
    await rawToggleWatched()
    if (user?.id) invalidatePersonalCache(user.id).catch(() => {})

    if (!wasWatched) {
      // Build 1: quick-rate prompt (only if movie not already rated)
      if (!userRating) {
        showQuickRateRef.current = true
        setShowQuickRate(true)
      }

      // Build 2: activation toast after 5th watch
      if (user?.id) {
        const { count } = await supabase
          .from('user_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
        if (count === 5 && !localStorage.getItem('ff_profile_toast_shown')) {
          localStorage.setItem('ff_profile_toast_shown', '1')
          setShowProfileToast(true)
        }
      }
    }
  }, [ensureAuthed, rawToggleWatched, isWatched, userRating, user?.id])

  const handleQuickRate = useCallback(async (starValue) => {
    setQuickRateSaved(true)
    try {
      await supabase.from('user_ratings').upsert(
        { user_id: user?.id, movie_id: internalMovieId, rating: starValue, review_text: null },
        { onConflict: 'user_id,movie_id' }
      )
      if (user?.id) invalidatePersonalCache(user.id).catch(() => {})
    } catch (err) {
      console.error('[MovieDetail] quick rate error:', err)
    }
    setTimeout(() => {
      setShowQuickRate(false)
      setQuickRateSaved(false)
    }, 1000)
  }, [user?.id, internalMovieId])

  const handleTrailerClick = useCallback(() => {
    if (internalMovieId) trackTrailerPlay(internalMovieId, 'movie_detail')
  }, [internalMovieId])

  const handleShare = useCallback(async () => {
    if (internalMovieId) trackShare(internalMovieId, 'movie_detail')
    if (navigator.share) {
      try {
        await navigator.share({ title: movie?.title, text: movie?.overview, url: window.location.href })
      } catch {
        return
      }
    }
  }, [internalMovieId, movie])

  const handleOpenFeedback = useCallback(() => {
    if (!user) { navigate('/auth', { replace: true, state: { from: `/movie/${id}` } }); return }
    setShowFeedbackModal(true)
  }, [user, navigate, id])

  const year       = yearOf(movie?.release_date)
  const runtime    = formatRuntime(movie?.runtime)

  const movieTitle = movie?.title
  const movieYear = movie?.release_date
    ? new Date(movie.release_date).getFullYear()
    : null
  const pageTitle = movieTitle
    ? `${movieTitle}${movieYear ? ` (${movieYear})` : ''} — FeelFlick`
    : null
  const pageDesc = movie?.overview
    ? `${movie.overview.slice(0, 150).trim()}… Discover ${movieTitle} and more on FeelFlick.`
    : null
  const pageImage = movie?.poster_path
    ? `https://image.tmdb.org/t/p/w1280${movie.poster_path}`
    : null
  const pageUrl = movie?.id
    ? `https://app.feelflick.com/movie/${movie.id}`
    : null

  usePageMeta({
    title: pageTitle,
    description: pageDesc,
    image: pageImage,
    url: pageUrl,
  })

  // ── Sentiment map (reused in Your Take card) ─────────────────
  const SENTIMENT_MAP = {
    loved:    { label: 'Loved it',    cls: 'bg-gradient-to-r from-purple-500/15 to-pink-500/10 border-purple-500/30 text-purple-300' },
    liked:    { label: 'Liked it',    cls: 'bg-purple-500/10 border-purple-500/20 text-purple-300' },
    meh:      { label: 'It was ok',   cls: 'bg-white/5 border-white/10 text-white/60' },
    disliked: { label: "Didn't like", cls: 'bg-white/5 border-white/8 text-white/40' },
    hated:    { label: 'Hated it',    cls: 'bg-red-500/10 border-red-500/20 text-red-400' },
  }

  return (
    <div className="relative bg-black text-white min-h-screen pb-24 md:pb-10">

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 35% at 50% 0%, rgba(88,28,135,0.1) 0%, transparent 65%)' }} />
      </div>

      {sessionId && movieId && <RecommendationFeedback sessionId={sessionId} movieId={movieId} />}

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative w-full">
        <div className="relative h-[64vh] md:h-[74vh]">

          {/* Backdrop */}
          <div className="absolute inset-0">
            {movie?.backdrop_path
              ? <img src={IMG.backdrop(movie.backdrop_path)} alt="" className="w-full h-full object-cover object-[50%_55%]" loading="eager" />
              : <div className="w-full h-full bg-neutral-900" />
            }
            {/* Top vignette: subtle, header area only */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/55 to-transparent" />
            {/* Bottom fade: 70% height, text lives here */}
            <div className="absolute bottom-0 inset-x-0 h-[70%] bg-gradient-to-t from-black via-black/78 to-transparent" />
            {/* Left fade: readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/15 to-transparent" />
          </div>

          {/* FeelFlick purple glow at bottom-left */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 70% 60% at 20% 100%, rgba(88,28,135,0.2) 0%, transparent 70%)' }}
          />

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="absolute z-20 flex items-center gap-1 text-xs font-semibold text-white/40 hover:text-white/90 transition-colors bg-black/35 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/8 hover:border-white/20"
            style={{ top: 'calc(var(--hdr-h, 64px) + 12px)', left: '1rem' }}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>

          {/* Hero content — anchored to bottom */}
          <div
            className="absolute inset-0 flex flex-col justify-end pb-5 md:pb-8"
            style={{ paddingTop: 'var(--hdr-h, 64px)' }}
          >
            <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 w-full">
              <div className="flex gap-3 sm:gap-5 md:gap-6 items-end max-w-5xl">

                {/* Poster — all screen sizes */}
                <div className="flex-shrink-0">
                  <div className="overflow-hidden rounded-xl ring-1 ring-white/12 shadow-2xl">
                    {movie?.poster_path ? (
                      <img
                        src={IMG.poster(movie.poster_path)}
                        alt={movie?.title}
                        className="h-[120px] w-[80px] sm:h-[160px] sm:w-[107px] md:h-[230px] md:w-[153px] lg:h-[270px] lg:w-[180px] object-cover"
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                      />
                    ) : (
                      <div className="h-[120px] w-[80px] sm:h-[160px] sm:w-[107px] md:h-[230px] md:w-[153px] lg:h-[270px] lg:w-[180px] grid place-items-center bg-white/5 text-white/20 text-xs">
                        No poster
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-2 md:space-y-2.5">
                  {loading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-7 w-3/4 rounded bg-white/20" />
                      <div className="h-4 w-1/2 rounded bg-white/20" />
                    </div>
                  ) : error ? (
                    <div className="rounded-lg bg-red-500/10 p-3 text-red-300 text-sm">{error}</div>
                  ) : (
                    <>
                      {/* Title */}
                      <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight tracking-tight drop-shadow-2xl">
                        {movie?.title}
                      </h1>

                      {/* Tagline */}
                      {movie?.tagline && (
                        <p className="hidden sm:block text-xs sm:text-sm text-white/60 italic leading-tight">{movie.tagline}</p>
                      )}

                      {/* Credits */}
                      {(director || writer) && (
                        <p className="hidden sm:block text-xs text-white/60">
                          {director && <>Directed by <span className="text-white/80 font-semibold">{director.name}</span></>}
                          {director && writer && <span className="text-white/20 mx-1">·</span>}
                          {writer && <>Written by <span className="text-white/80 font-semibold">{writer.name}</span></>}
                        </p>
                      )}

                      {/* FF Rating — hero-level */}
                      <FFRatingHero internalMovie={internalMovieData} />

                      {/* Meta chips */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        {certification && (
                          <span className="px-2 py-0.5 rounded-md border border-white/20 text-white/60 font-semibold text-[11px]">
                            {certification}
                          </span>
                        )}
                        {year && <span className="text-white/60">{year}</span>}
                        {runtime && (
                          <span className="inline-flex items-center gap-1 text-white/60">
                            <Clock className="h-3 w-3" />{runtime}
                          </span>
                        )}
                      </div>

                      {/* Genre pills — sm+ */}
                      {movie?.genres?.length > 0 && (
                        <div className="hidden sm:flex flex-wrap gap-1.5">
                          {movie.genres.slice(0, 4).map(g => (
                            <span key={g.id} className="px-2 py-0.5 rounded-full bg-white/[0.07] border border-white/10 text-white/60 text-[11px] font-medium">
                              {g.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Mood / tone / fit-profile chips */}
                      <MoodChips movie={internalMovieData} />

                      {/* Overview — md+, 3 lines */}
                      {movie?.overview && (
                        <p className="hidden md:block text-sm text-white/78 leading-relaxed line-clamp-3 max-w-xl drop-shadow-lg">
                          {movie.overview}
                        </p>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {ytTrailer && (
                          <a
                            href={ytTrailer}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Watch ${movie?.title} trailer on YouTube`}
                            onClick={handleTrailerClick}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all active:scale-95"
                          >
                            <Play className="h-4 w-4 fill-current" />
                            <span className="hidden sm:inline">Trailer</span>
                          </a>
                        )}

                        <button
                          disabled={mutating}
                          onClick={handleToggleWatchlist}
                          aria-label={isInWatchlist ? 'Remove from watchlist' : 'Save to watchlist'}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 sm:px-4 py-2 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 backdrop-blur-sm border ${
                            isInWatchlist
                              ? 'bg-purple-500/20 border-purple-500/55 text-purple-300'
                              : 'bg-white/8 hover:bg-white/14 border-white/14 text-white'
                          }`}
                        >
                          {isInWatchlist
                            ? <><Check className="h-4 w-4" /><span className="hidden sm:inline">Saved</span></>
                            : <><Bookmark className="h-4 w-4" /><span className="hidden sm:inline">Watchlist</span></>
                          }
                        </button>

                        <>
                          {showQuickRate && (
                            <QuickRatePrompt
                              onRate={handleQuickRate}
                              onDismiss={() => {
                                showQuickRateRef.current = false
                                setShowQuickRate(false)
                              }}
                              saved={quickRateSaved}
                            />
                          )}
                          <button
                            style={showQuickRate ? { display: 'none', pointerEvents: 'none' } : undefined}
                            disabled={mutating}
                            onClick={handleToggleWatched}
                            aria-label={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 sm:px-4 py-2 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 backdrop-blur-sm border ${
                              isWatched
                                ? 'bg-purple-500/20 border-purple-500/45 text-purple-300'
                                : 'bg-white/8 hover:bg-white/14 border-white/14 text-white'
                            }`}
                          >
                            {isWatched
                              ? <><Eye className="h-4 w-4" /><span className="hidden sm:inline">Watched</span></>
                              : <><EyeOff className="h-4 w-4" /><span className="hidden sm:inline">Mark Watched</span></>
                            }
                          </button>
                        </>

                        {user && internalMovieId && (
                          <button
                            type="button"
                            onClick={() => setShowAddToList(true)}
                            aria-label="Add to list"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white/8 hover:bg-white/14 backdrop-blur-sm px-3 sm:px-4 py-2 text-sm font-bold transition-all active:scale-95 border border-white/14 text-white"
                          >
                            <ListPlus className="h-4 w-4" />
                            <span className="hidden sm:inline">List</span>
                          </button>
                        )}

                        <button
                          onClick={handleShare}
                          aria-label="Share"
                          className="inline-flex items-center rounded-lg bg-white/8 hover:bg-white/14 backdrop-blur-sm px-3 py-2 transition-all active:scale-95 border border-white/14"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      <div className="relative mt-4 md:-mt-6 z-30">
        <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] xl:grid-cols-[1fr,340px] gap-6">

            {/* ── Main column ───────────────────────────────── */}
            <div className="space-y-5 min-w-0">

              {/* Mobile: overview + credits */}
              {!loading && (movie?.overview || director || writer) && (
                <div className="md:hidden rounded-2xl border border-white/8 bg-white/[0.03] p-5 space-y-3">
                  {movie?.genres?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {movie.genres.slice(0, 4).map(g => (
                        <span key={g.id} className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/8 text-white/60 text-[11px]">
                          {g.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {(director || writer) && (
                    <div>
                      {director && (
                        <p className="text-xs text-white/40">
                          Directed by <span className="text-white/80 font-semibold">{director.name}</span>
                        </p>
                      )}
                      {writer && (
                        <p className="text-xs text-white/40 mt-1">
                          Written by <span className="text-white/80 font-semibold">{writer.name}</span>
                        </p>
                      )}
                    </div>
                  )}
                  {movie?.overview && (
                    <p className="text-sm text-white/78 leading-relaxed">{movie.overview}</p>
                  )}
                </div>
              )}

              {/* Mobile: where to watch */}
              <div className="lg:hidden">
                <WhereToWatch providers={providers} />
              </div>

              {/* ── Your Take (gated on watched) ─────────────── */}
              {user && (
                isWatched ? (
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Your Take</p>
                      <button
                        onClick={handleOpenFeedback}
                        className="text-xs text-purple-400/65 hover:text-purple-300 transition-colors"
                      >
                        {userRating > 0 || userFeedback?.sentiment ? 'Edit' : 'Rate & review'}
                      </button>
                    </div>

                    {ratingLoading ? (
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="rgba(168,85,247,0.2)" strokeWidth="3" />
                          <path d="M21 12a9 9 0 0 0-9-9v9z" fill="rgb(168,85,247)" />
                        </svg>
                        <span className="text-sm text-white/20">Loading…</span>
                      </div>
                    ) : (userRating > 0 || userFeedback?.sentiment || userReview) ? (
                      <div className="space-y-3">
                        {userRating > 0 && (
                          <div className="flex items-center gap-3">
                            <StarRating value={userRating} readonly size="sm" showLabel showClearButton={false} />
                          </div>
                        )}
                        {userFeedback?.sentiment && (() => {
                          const s = SENTIMENT_MAP[userFeedback.sentiment]
                          return s ? (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${s.cls}`}>
                              {s.label}
                            </span>
                          ) : null
                        })()}
                        {userReview && (
                          <p className="text-sm text-white/60 leading-relaxed border-l-2 border-purple-500/30 pl-3 italic">
                            &ldquo;{userReview}&rdquo;
                          </p>
                        )}
                        {(userFeedback?.what_stood_out?.length > 0 || userFeedback?.viewing_context_tags?.length > 0) && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {[...(userFeedback.viewing_context_tags || []), ...(userFeedback.what_stood_out || [])].map(tag => (
                              <span key={tag} className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/8 text-[11px] text-white/40">
                                {tag.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={handleOpenFeedback}
                        className="flex items-center gap-2 text-sm text-white/20 hover:text-purple-400 transition-colors"
                      >
                        <Heart className="h-4 w-4" />
                        Rate this film + share your thoughts
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/5 bg-white/[0.012] p-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-white/22">Rate this film</p>
                      <p className="text-xs text-white/14 mt-0.5">Mark as watched to leave a rating</p>
                    </div>
                    <div className="flex gap-0.5 opacity-[0.06] pointer-events-none select-none" aria-hidden>
                      {Array.from({ length: 5 }, (_, i) => (
                        <svg key={i} className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                )
              )}

              <RatingBreakdown movie={internalMovieData} />

              <MovieCast cast={credits.cast} />
              <MovieVideos videos={videos} internalMovieId={internalMovieId} />
              <MovieSimilar title="More like this" items={recs} />
            </div>

            {/* ── Sidebar — Desktop only ────────────────────── */}
            <div className="hidden lg:block space-y-4 lg:sticky lg:top-20 lg:self-start">
              <WhereToWatch providers={providers} />
              <MovieDetails movie={movie} />
              {movie?.production_companies?.length > 0 && (
                <ProductionCompanies companies={movie.production_companies} />
              )}
              {movie?.belongs_to_collection && (
                <CollectionCard collection={movie.belongs_to_collection} />
              )}
            </div>
          </div>
        </div>
      </div>

      {showAddToList && user && internalMovieId && (
        <AddToListModal
          movieId={internalMovieId}
          movieTitle={movie?.title || 'Untitled'}
          userId={user.id}
          onClose={() => setShowAddToList(false)}
        />
      )}

      {showFeedbackModal && movie && (
        <MovieSentimentWidget
          user={user}
          movie={movie}
          internalMovieId={internalMovieId}
          initialRating={userRating}
          initialReview={userReview}
          initialSentiment={userFeedback?.sentiment ?? null}
          initialViewingContext={userFeedback?.viewing_context_tags ?? []}
          initialWhatStoodOut={userFeedback?.what_stood_out ?? []}
          onClose={() => setShowFeedbackModal(false)}
          onSaved={({ sentiment, viewingContextTags, whatStoodOut }) => {
            setUserFeedback(prev => ({
              ...prev,
              sentiment: sentiment ?? prev?.sentiment,
              viewing_context_tags: viewingContextTags ?? prev?.viewing_context_tags,
              what_stood_out: whatStoodOut ?? prev?.what_stood_out,
            }))
          }}
        />
      )}

      <AnimatePresence>
        {showProfileToast && (
          <ToastNotification
            message="Your cinematic DNA is taking shape"
            subtext="You've watched 5 films — see what FeelFlick has learned about you."
            ctaLabel="See my taste profile →"
            ctaHref="/profile"
            onDismiss={() => setShowProfileToast(false)}
            duration={8000}
          />
        )}
      </AnimatePresence>

      {import.meta.env.DEV && movie?.id && (
        <DatabaseValidationPanel movieId={movie.id} internalMovieId={internalMovieId} />
      )}
    </div>
  )
}
