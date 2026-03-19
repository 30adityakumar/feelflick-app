// src/app/pages/MovieDetail/index.jsx
import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import {
  Play,
  Bookmark,
  Check,
  Star,
  Clock,
  Calendar,
  Share2,
  Eye,
  EyeOff,
  Plus,
  Heart,
} from 'lucide-react'

import RecommendationFeedback from '@/shared/components/RecommendationFeedback'
import { useUserMovieStatus } from '@/shared/hooks/useUserMovieStatus'
import DatabaseValidationPanel from '@/shared/components/DatabaseValidationPanel'
import MovieRatingWidget from '@/shared/components/MovieRatingWidget'
import MovieSentimentWidget from '@/shared/components/MovieSentimentWidget'
import { usePageView } from '@/shared/hooks/useInteractionTracking'
import { trackTrailerPlay, trackShare } from '@/shared/services/interactions'

import { IMG, TMDB, formatRuntime, yearOf } from './utils'
import MovieCast from './MovieCast'
import MovieVideos from './MovieVideos'
import MovieImages from './MovieImages'
import MovieSimilar from './MovieSimilar'
import {
  WhereToWatch,
  MovieDetails,
  ProductionCompanies,
  KeywordsSection,
  CollectionCard,
} from './MovieSidebar'

export default function MovieDetail() {
  const { id } = useParams()
  const location = useLocation()
  const { sessionId, movieId } = location.state || {}
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [movie, setMovie] = useState(null)
  const [credits, setCredits] = useState({ cast: [], crew: [] })
  const [videos, setVideos] = useState([])
  const [recs, setRecs] = useState([])
  const [providers, setProviders] = useState({ flatrate: [], rent: [], buy: [], link: '' })
  const [images, setImages] = useState({ backdrops: [] })
  const [keywords, setKeywords] = useState([])
  const [certification, setCertification] = useState('')
  const [user, setUser] = useState(null)
  const [internalMovieId, setInternalMovieId] = useState(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  usePageView(internalMovieId, 'movie_detail')

  useEffect(() => {
    const startTime = Date.now()
    return () => {
      const duration = Date.now() - startTime
      console.log(`[MovieDetail] User spent ${Math.round(duration / 1000)}s on page`)
    }
  }, [internalMovieId])

  // Auth
  useEffect(() => {
    let unsub
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ?? null)
    )
    unsub = data?.subscription?.unsubscribe
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  // TMDB data
  useEffect(() => {
    let abort = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (!TMDB.key) throw new Error('TMDB key missing')
        const [d, c, v, r, i, k, rel] = await Promise.all([
          fetch(`${TMDB.base}/movie/${id}?api_key=${TMDB.key}&language=en-US`).then((r) => r.json()),
          fetch(`${TMDB.base}/movie/${id}/credits?api_key=${TMDB.key}&language=en-US`).then((r) => r.json()),
          fetch(`${TMDB.base}/movie/${id}/videos?api_key=${TMDB.key}&language=en-US`).then((r) => r.json()),
          fetch(`${TMDB.base}/movie/${id}/recommendations?api_key=${TMDB.key}&language=en-US&page=1`).then((r) => r.json()),
          fetch(`${TMDB.base}/movie/${id}/images?api_key=${TMDB.key}`).then((r) => r.json()),
          fetch(`${TMDB.base}/movie/${id}/keywords?api_key=${TMDB.key}`).then((r) => r.json()),
          fetch(`${TMDB.base}/movie/${id}/release_dates?api_key=${TMDB.key}`).then((r) => r.json()),
        ])

        if (abort) return
        if (d?.success === false || d?.status_code)
          throw new Error(d?.status_message || 'Failed to load')

        setMovie(d)
        setCredits({ cast: c?.cast?.slice(0, 10) || [], crew: c?.crew || [] })
        setVideos(v?.results || [])
        setRecs(r?.results?.slice(0, 12) || [])
        setImages({ backdrops: i?.backdrops?.slice(0, 6) || [] })
        setKeywords(k?.keywords?.slice(0, 12) || [])

        const usCert =
          rel?.results
            ?.find((r) => r.iso_3166_1 === 'US')
            ?.release_dates?.[0]?.certification || ''
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
        if (!TMDB.key) return
        const res = await fetch(`${TMDB.base}/movie/${id}/watch/providers?api_key=${TMDB.key}`)
        const json = await res.json()
        const area = json?.results?.['US'] || null
        if (!active) return

        if (area) {
          const pick = (k) => (area[k] || []).slice(0, 6)
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
    isInWatchlist,
    isWatched,
    loading: actionLoading,
    toggleWatchlist: rawToggleWatchlist,
    toggleWatched: rawToggleWatched,
    internalId,
  } = useUserMovieStatus({ user, movie, source: 'movie_detail' })

  useEffect(() => {
    if (internalId) setInternalMovieId(internalId)
  }, [internalId])

  useEffect(() => {
    const handleFeedbackPrompt = (e) => {
      const { internalMovieId: eventInternalId, tmdbId } = e.detail
      const tmdbMatches = tmdbId && String(tmdbId) === String(id)
      const internalMatches = eventInternalId && eventInternalId === internalMovieId
      if (tmdbMatches || internalMatches) setShowFeedbackModal(true)
    }
    window.addEventListener('prompt-movie-feedback', handleFeedbackPrompt)
    return () => window.removeEventListener('prompt-movie-feedback', handleFeedbackPrompt)
  }, [id, internalMovieId])

  const mutating = actionLoading.watchlist || actionLoading.watched

  const ytTrailer = useMemo(() => {
    const t = videos.find((v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
    return t ? `https://www.youtube.com/watch?v=${t.key}` : null
  }, [videos])

  const director = useMemo(() => credits.crew?.find((c) => c.job === 'Director'), [credits])

  async function ensureAuthed() {
    if (user?.id) return true
    navigate('/auth', { replace: true, state: { from: `/movie/${id}` } })
    return false
  }

  const handleToggleWatchlist = useCallback(async () => {
    const ok = await ensureAuthed()
    if (!ok) return
    await rawToggleWatchlist()
  }, [ensureAuthed, rawToggleWatchlist])

  const handleToggleWatched = useCallback(async () => {
    const ok = await ensureAuthed()
    if (!ok) return
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
      } catch {}
    }
  }, [internalMovieId, movie])

  const handleOpenFeedback = useCallback(() => {
    if (!user) {
      navigate('/auth', { replace: true, state: { from: `/movie/${id}` } })
      return
    }
    setShowFeedbackModal(true)
  }, [user, navigate, id])

  const rating  = movie?.vote_average ? Math.round(movie.vote_average * 10) / 10 : null
  const year    = yearOf(movie?.release_date)
  const runtime = formatRuntime(movie?.runtime)

  return (
    <div className="relative bg-black text-white min-h-screen pb-20 md:pb-8">
      {sessionId && movieId && (
        <RecommendationFeedback sessionId={sessionId} movieId={movieId} />
      )}

      {/* Hero Section */}
      <div className="relative w-full">
        <div className="relative h-[70vh] md:h-[75vh]">
          <div className="absolute inset-0">
            {movie?.backdrop_path ? (
              <img
                src={IMG.backdrop(movie.backdrop_path)}
                alt=""
                className="w-full h-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="w-full h-full bg-neutral-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 md:via-black/40 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black to-transparent" />
          </div>

          <div className="absolute inset-0 flex flex-col justify-end pb-6 md:pb-10 pt-20 md:pt-24">
            <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 w-full">
              <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-4 md:gap-6 items-end max-w-6xl">
                {/* Poster */}
                <div className="hidden md:block">
                  <div className="overflow-hidden rounded-md ring-2 ring-white/20 shadow-2xl">
                    {movie?.poster_path ? (
                      <img
                        src={IMG.poster(movie.poster_path)}
                        alt={movie?.title}
                        className="h-[260px] w-[173px] lg:h-[300px] lg:w-[200px] object-cover loading-eager"
                      />
                    ) : (
                      <div className="h-[260px] w-[173px] lg:h-[300px] lg:w-[200px] grid place-items-center bg-white/5 text-white/40 text-xs">
                        No poster
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="max-w-3xl space-y-2">
                  {loading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-10 w-3/4 rounded bg-white/20" />
                      <div className="h-5 w-1/2 rounded bg-white/15" />
                    </div>
                  ) : error ? (
                    <div className="rounded-lg bg-red-500/10 p-3 text-red-300 text-sm">{error}</div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-tight drop-shadow-2xl">
                          {movie?.title}
                        </h1>
                        {isInWatchlist && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-[10px] font-bold text-purple-300">
                            <Bookmark className="h-3 w-3" /> Watchlist
                          </span>
                        )}
                        {isWatched && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-[10px] font-bold text-green-300">
                            <Check className="h-3 w-3" /> Watched
                          </span>
                        )}
                      </div>

                      {movie?.tagline && (
                        <p className="text-sm text-white/70 italic leading-tight">{movie.tagline}</p>
                      )}
                      {director && (
                        <p className="text-xs text-white/80">
                          Directed by{' '}
                          <span className="font-semibold text-white/95">{director.name}</span>
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {rating && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30">
                            <Star className="h-3 w-3 fill-current text-purple-400" />
                            <span className="text-purple-300 font-bold">{rating}</span>
                          </div>
                        )}
                        {certification && (
                          <span className="px-2 py-0.5 rounded border border-white/30 text-white/90 font-bold">
                            {certification}
                          </span>
                        )}
                        {year && (
                          <span className="inline-flex items-center gap-1 text-white/80 font-medium">
                            <Calendar className="h-3 w-3" /> {year}
                          </span>
                        )}
                        {runtime && (
                          <span className="inline-flex items-center gap-1 text-white/80 font-medium">
                            <Clock className="h-3 w-3" /> {runtime}
                          </span>
                        )}
                      </div>

                      {movie?.genres?.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {movie.genres.slice(0, 4).map((g) => (
                            <span
                              key={g.id}
                              className="px-2 py-0.5 rounded bg-white/10 text-white/70 text-[11px] font-medium"
                            >
                              {g.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {movie?.overview && (
                        <p className="hidden md:block text-sm text-white/90 leading-relaxed line-clamp-2 max-w-2xl drop-shadow-lg">
                          {movie.overview}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {ytTrailer && (
                          <a
                            href={ytTrailer}
                            target="_blank"
                            rel="noreferrer"
                            onClick={handleTrailerClick}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-5 py-2 text-sm font-bold text-white shadow-xl transition-all active:scale-95"
                          >
                            <Play className="h-4 w-4 fill-current" /> Trailer
                          </a>
                        )}

                        <button
                          disabled={mutating}
                          onClick={handleToggleWatchlist}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 backdrop-blur border shadow-lg ${
                            isInWatchlist
                              ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                              : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                          }`}
                        >
                          {isInWatchlist ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                          <span className="hidden xs:inline">
                            {isInWatchlist ? 'In Watchlist' : 'Watchlist'}
                          </span>
                        </button>

                        <button
                          disabled={mutating}
                          onClick={handleToggleWatched}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 backdrop-blur border shadow-lg ${
                            isWatched
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                          }`}
                        >
                          {isWatched ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          <span className="hidden xs:inline">
                            {isWatched ? 'Watched' : 'Mark Watched'}
                          </span>
                        </button>

                        {isWatched && (
                          <button
                            onClick={handleOpenFeedback}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 px-4 py-2 text-sm font-bold text-purple-300 hover:from-purple-500/30 hover:to-pink-500/30 transition-all active:scale-95"
                          >
                            <Heart className="h-4 w-4" />
                            <span className="hidden xs:inline">Rate Experience</span>
                          </button>
                        )}

                        <button
                          onClick={handleShare}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 backdrop-blur px-3 py-2 text-sm font-bold hover:bg-white/20 transition-all active:scale-95 border border-white/20"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                      </div>

                      {internalMovieId && (
                        <div className="pt-3 border-t border-white/10">
                          <MovieRatingWidget user={user} movieInternalId={internalMovieId} size="md" showLabel />
                        </div>
                      )}
                      {!internalMovieId && user && (
                        <div className="pt-3 border-t border-white/10">
                          <div className="flex items-center gap-2 text-sm text-white/50">
                            <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white/60 rounded-full" />
                            <span>Loading rating...</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="relative mt-4 md:-mt-8 z-30">
        <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] xl:grid-cols-[1fr,340px] gap-6">
            {/* Main Content */}
            <div className="space-y-6 min-w-0">
              {movie?.overview && (
                <div className="md:hidden rounded-lg bg-white/5 backdrop-blur border border-white/10 p-4">
                  <h2 className="text-base font-bold mb-2">Overview</h2>
                  <p className="text-sm text-white/85 leading-relaxed">{movie.overview}</p>
                </div>
              )}

              <div className="lg:hidden">
                <WhereToWatch providers={providers} />
              </div>

              <MovieCast cast={credits.cast} />
              <MovieVideos videos={videos} internalMovieId={internalMovieId} />
              <MovieImages images={images.backdrops} />
              <MovieSimilar title="You Might Also Like" items={recs} />
            </div>

            {/* Sidebar — Desktop */}
            <div className="hidden lg:block space-y-4 lg:sticky lg:top-20 lg:self-start">
              <WhereToWatch providers={providers} />
              <MovieDetails movie={movie} />
              {movie?.production_companies?.length > 0 && (
                <ProductionCompanies companies={movie.production_companies} />
              )}
              {keywords?.length > 0 && <KeywordsSection keywords={keywords} />}
              {movie?.belongs_to_collection && (
                <CollectionCard collection={movie.belongs_to_collection} />
              )}
            </div>
          </div>
        </div>
      </div>

      {showFeedbackModal && movie && (
        <MovieSentimentWidget user={user} movie={movie} onClose={() => setShowFeedbackModal(false)} />
      )}

      {process.env.NODE_ENV === 'development' && movie?.id && (
        <DatabaseValidationPanel movieId={movie.id} internalMovieId={internalMovieId} />
      )}
    </div>
  )
}
