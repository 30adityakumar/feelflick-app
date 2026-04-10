// src/app/pages/MovieDetail/index.jsx
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import {
  Play, Bookmark, Check, Star, Clock, Share2,
  Eye, EyeOff, Heart, ChevronLeft,
} from 'lucide-react'

import RecommendationFeedback from '@/shared/components/RecommendationFeedback'
import { useUserMovieStatus } from '@/shared/hooks/useUserMovieStatus'
import DatabaseValidationPanel from '@/shared/components/DatabaseValidationPanel'
import MovieSentimentWidget from '@/shared/components/MovieSentimentWidget'
import { useMovieRating } from '@/shared/hooks/useMovieRating'
import { usePageView } from '@/shared/hooks/useInteractionTracking'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { trackTrailerPlay, trackShare } from '@/shared/services/interactions'
import { fetchJson, getMovieDetails } from '@/shared/api/tmdb'

import { IMG, formatRuntime, yearOf } from './utils'
import MovieCast from './MovieCast'
import MovieVideos from './MovieVideos'
import MovieImages from './MovieImages'
import MovieSimilar from './MovieSimilar'
import { WhereToWatch, MovieDetails, ProductionCompanies, CollectionCard } from './MovieSidebar'

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
  const [images, setImages]           = useState({ backdrops: [] })
  const [certification, setCertification] = useState('')
  const [internalMovieId, setInternalMovieId] = useState(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [userFeedback, setUserFeedback] = useState(null)
  const [movieMoods, setMovieMoods]   = useState([])
  const { user } = useAuthSession()

  usePageView(internalMovieId, 'movie_detail')

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
            append: 'videos,images,recommendations,credits,keywords',
          }),
          fetchJson(`/movie/${id}/release_dates`),
        ])
        if (abort) return
        if (d?.success === false || d?.status_code) throw new Error(d?.status_message || 'Failed to load')
        setMovie(d)
        setCredits({ cast: d?.credits?.cast?.slice(0, 10) || [], crew: d?.credits?.crew || [] })
        setVideos(d?.videos?.results || [])
        setRecs(d?.recommendations?.results?.slice(0, 12) || [])
        setImages({ backdrops: d?.images?.backdrops?.slice(0, 6) || [] })
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
      const { internalMovieId: eid, tmdbId } = e.detail
      if ((tmdbId && String(tmdbId) === String(id)) || (eid && eid === internalMovieId))
        setShowFeedbackModal(true)
    }
    window.addEventListener('prompt-movie-feedback', handleFeedbackPrompt)
    return () => window.removeEventListener('prompt-movie-feedback', handleFeedbackPrompt)
  }, [id, internalMovieId])

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

  // Mood scores — FeelFlick DNA
  useEffect(() => {
    if (!internalMovieId) return
    let active = true
    ;(async () => {
      const { data } = await supabase
        .from('movie_mood_scores')
        .select('score, moods(name, emoji)')
        .eq('movie_id', internalMovieId)
        .order('score', { ascending: false })
        .limit(4)
      if (active && data) setMovieMoods(data.filter(d => d.moods && d.score > 0.4))
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
    await rawToggleWatched()
  }, [ensureAuthed, rawToggleWatched])

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

  const tmdbRating = movie?.vote_average ? Math.round(movie.vote_average * 10) / 10 : null
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
    ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
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

  // ── Mood pills (reused in hero + mobile content) ─────────────
  const MoodPills = () => movieMoods.length > 0 ? (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Perfect for</span>
      {movieMoods.map(({ moods: mood }) => (
        <span
          key={mood.name}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/15 to-pink-500/10 border border-purple-500/25 text-xs font-medium text-purple-200"
        >
          {mood.emoji && <span aria-hidden>{mood.emoji}</span>}
          {mood.name}
        </span>
      ))}
    </div>
  ) : null

  // ── Sentiment map (reused in Your Take card) ─────────────────
  const SENTIMENT_MAP = {
    loved:    { label: 'Loved it',    cls: 'bg-gradient-to-r from-purple-500/15 to-pink-500/10 border-purple-500/30 text-purple-300' },
    liked:    { label: 'Liked it',    cls: 'bg-purple-500/10 border-purple-500/20 text-purple-300' },
    meh:      { label: 'It was ok',   cls: 'bg-white/5 border-white/10 text-white/50' },
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
              ? <img src={IMG.backdrop(movie.backdrop_path)} alt="" className="w-full h-full object-cover" loading="eager" />
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
            className="absolute z-20 flex items-center gap-1 text-xs font-semibold text-white/45 hover:text-white/90 transition-colors bg-black/35 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/8 hover:border-white/20"
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
                      <div className="h-[120px] w-[80px] sm:h-[160px] sm:w-[107px] md:h-[230px] md:w-[153px] lg:h-[270px] lg:w-[180px] grid place-items-center bg-white/5 text-white/25 text-xs">
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
                      <div className="h-4 w-1/2 rounded bg-white/15" />
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
                        <p className="hidden sm:block text-xs sm:text-sm text-white/50 italic leading-tight">{movie.tagline}</p>
                      )}

                      {/* Credits */}
                      {(director || writer) && (
                        <p className="hidden sm:block text-xs text-white/55">
                          {director && <>Directed by <span className="text-white/85 font-semibold">{director.name}</span></>}
                          {director && writer && <span className="text-white/20 mx-1">·</span>}
                          {writer && <>Written by <span className="text-white/85 font-semibold">{writer.name}</span></>}
                        </p>
                      )}

                      {/* Meta chips */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        {tmdbRating && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 border border-white/12">
                            <Star className="h-3 w-3 fill-current text-yellow-400" />
                            <span className="text-white/80 font-bold">{tmdbRating}</span>
                          </div>
                        )}
                        {certification && (
                          <span className="px-2 py-0.5 rounded-md border border-white/20 text-white/60 font-semibold text-[11px]">
                            {certification}
                          </span>
                        )}
                        {year && <span className="text-white/55">{year}</span>}
                        {runtime && (
                          <span className="inline-flex items-center gap-1 text-white/55">
                            <Clock className="h-3 w-3" />{runtime}
                          </span>
                        )}
                      </div>

                      {/* Genre pills — sm+ */}
                      {movie?.genres?.length > 0 && (
                        <div className="hidden sm:flex flex-wrap gap-1.5">
                          {movie.genres.slice(0, 4).map(g => (
                            <span key={g.id} className="px-2 py-0.5 rounded-full bg-white/[0.07] border border-white/10 text-white/55 text-[11px] font-medium">
                              {g.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Overview — md+, 3 lines */}
                      {movie?.overview && (
                        <p className="hidden md:block text-sm text-white/78 leading-relaxed line-clamp-3 max-w-xl drop-shadow-lg">
                          {movie.overview}
                        </p>
                      )}

                      {/* Mood tags — FeelFlick DNA — sm+ */}
                      <div className="hidden sm:block"><MoodPills /></div>

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

                        <button
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

              {/* Mobile: overview */}
              {!loading && movie?.overview && (
                <div className="md:hidden rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                  <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-2">Overview</p>
                  {movie.genres?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {movie.genres.slice(0, 4).map(g => (
                        <span key={g.id} className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/8 text-white/50 text-[11px]">
                          {g.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-white/78 leading-relaxed">{movie.overview}</p>
                </div>
              )}

              {/* Mobile: credits */}
              {(director || writer) && (
                <div className="sm:hidden rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4">
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

              {/* Mobile: mood tags */}
              {movieMoods.length > 0 && (
                <div className="sm:hidden">
                  <MoodPills />
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
                      <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Your Take</p>
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
                        <span className="text-sm text-white/25">Loading…</span>
                      </div>
                    ) : (userRating > 0 || userFeedback?.sentiment || userReview) ? (
                      <div className="space-y-3">
                        {userRating > 0 && (
                          <div className="flex items-center gap-3">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 10 }, (_, i) => (
                                <svg key={i} className={`h-4 w-4 ${i < userRating ? 'text-yellow-400' : 'text-white/10'}`} fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-sm font-bold text-white tabular-nums">
                              {userRating}<span className="text-white/30 font-normal">/10</span>
                            </span>
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
                              <span key={tag} className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/8 text-[11px] text-white/35">
                                {tag.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={handleOpenFeedback}
                        className="flex items-center gap-2 text-sm text-white/25 hover:text-purple-400 transition-colors"
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

              <MovieCast cast={credits.cast} />
              <MovieVideos videos={videos} internalMovieId={internalMovieId} />
              <MovieImages images={images.backdrops} />
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

      {import.meta.env.DEV && movie?.id && (
        <DatabaseValidationPanel movieId={movie.id} internalMovieId={internalMovieId} />
      )}
    </div>
  )
}
