// src/features/movie-v2/MovieDetail.jsx
// FeelFlick — Movie Detail v2 ("Film File" editorial direction).
// Route: /movie-v2/:id (parallel to existing /movie/:id)
//
// Per-id TMDB + Supabase fetch lives in ./useMovieData. PR 1 makes Mood Radar,
// Why-for-you, Friends Loved, Taste Twin dynamic for every film from existing
// data. TheTake + CriticQuotes remain Parasite-only until PR 4 (LLM endpoint).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { useUserMovieStatus } from '@/shared/hooks/useUserMovieStatus'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { trackShare, trackTrailerPlay } from '@/shared/services/interactions'

import { deriveWhyHeader, deriveWhyReasons } from './derive/whyForYou'
import { useTasteFingerprint } from './hooks/useTasteFingerprint'
import { useDirectorAffinity } from './hooks/useDirectorAffinity'
import { useFriendsLoved } from './hooks/useFriendsLoved'
import { useTasteTwin } from './hooks/useTasteTwin'

import {
  ScrollProgress, FilmGrain, TrailerModal, MovieHero, StickyActionBar,
  WhyForYou, Synopsis, MoodRadar, TheTake, CriticQuotes,
} from './sections-top'
import {
  CastSection, VideosSection, ProvidersSection, PairsWith,
  FriendsLoved, TasteTwinReview, TimelineSection, DirectorShelf,
  YourTake, DetailsSection, MovieFooter,
} from './sections-bottom'
import { MovieDataProvider, useMovieDataFetch } from './useMovieData'
import './movie.css'

export default function MovieDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthSession()

  const data = useMovieDataFetch(id)
  const { mv, filmDbRow, moodAxes, overlay, loading, error } = data

  const movieTitle = mv?.title
  const movieYear = mv?.year ? ` (${mv.year})` : ''
  const movieUrl = `https://app.feelflick.com/movie/${id}`
  // schema.org/Movie structured data → rich Google results for film pages.
  const movieJsonLd = mv
    ? {
        '@context': 'https://schema.org',
        '@type': 'Movie',
        name: mv.title,
        url: movieUrl,
        ...(mv.overview ? { description: mv.overview } : {}),
        ...(mv.poster || mv.backdrop ? { image: mv.poster || mv.backdrop } : {}),
        ...(mv.genres?.length ? { genre: mv.genres } : {}),
        ...(mv.director && mv.director !== '—'
          ? { director: { '@type': 'Person', name: mv.director } }
          : {}),
        ...(mv.runtime ? { duration: `PT${mv.runtime}M` } : {}),
        ...(mv.year ? { datePublished: String(mv.year) } : {}),
      }
    : null
  usePageMeta({
    title: movieTitle ? `${movieTitle}${movieYear} — FeelFlick` : 'Movie — FeelFlick',
    description: mv?.tagline || mv?.overview || undefined,
    image: mv?.backdrop || undefined,
    url: movieUrl,
    jsonLd: movieJsonLd,
  })

  const {
    isInWatchlist, isWatched, loading: actionLoading,
    toggleWatchlist, toggleWatched, internalId,
  } = useUserMovieStatus({
    user,
    movie: mv ? { id: mv.id, title: mv.title, poster_path: null, overview: mv.overview } : null,
    // 'movie_detail' is the canonical source string the user_watchlist.source
    // check constraint allows. The folder is named -v2 internally but the DB
    // doesn't care which version of the UI surface logged the action.
    source: 'movie_detail',
  })

  const { fingerprint } = useTasteFingerprint(user?.id)
  const { count: directorCount } = useDirectorAffinity(user?.id, mv?.director)
  const { friends } = useFriendsLoved(user?.id, internalId)
  const { twin } = useTasteTwin(user?.id, internalId)

  const derivedReasons = useMemo(() => deriveWhyReasons({
    mv, filmDbRow, fingerprint, directorCount,
  }), [mv, filmDbRow, fingerprint, directorCount])

  const derivedHeader = useMemo(
    () => deriveWhyHeader({ fingerprint, signedIn: Boolean(user) }),
    [fingerprint, user]
  )

  // Curated overlay wins when set; dynamic derive backstops otherwise.
  const whyReasons = overlay?.why_for_you?.reasons ?? derivedReasons
  const whyHeader = {
    eyebrow:   overlay?.why_for_you?.eyebrow   ?? derivedHeader.eyebrow,
    headline:  overlay?.why_for_you?.headline  ?? derivedHeader.headline,
    rationale: overlay?.why_for_you?.rationale ?? derivedHeader.rationale,
  }
  const radarAxes = overlay?.mood_fingerprint ?? moodAxes
  const ffTake = overlay?.ff_take ?? null
  const criticQuotes = overlay?.critic_quotes ?? null

  // `selectedVideo` is null when the modal should play the canonical main
  // trailer (hero CTA, sticky bar). Featurette tiles pass their own clip in
  // so the modal honestly plays what was clicked.
  const [trailerOpen, setTrailerOpen] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [hoveredReason, setHoveredReason] = useState(null)
  const [hoveredAxis, setHoveredAxis] = useState(null)

  // When Mark Watched flips from false → true, gently scroll the YourTake
  // card into view so the rating UI is the obvious next thing. We skip the
  // scroll on initial mount (e.g. opening an already-watched film) so we
  // only react to in-session transitions.
  const yourTakeRef = useRef(null)
  const prevWatchedRef = useRef(isWatched)
  useEffect(() => {
    const wasWatched = prevWatchedRef.current
    if (!wasWatched && isWatched && yourTakeRef.current) {
      yourTakeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    prevWatchedRef.current = isWatched
  }, [isWatched])

  // Two-way mood ↔ Why card highlight, now keyed off dynamic whyReasons.
  const reasonMood = whyReasons.find(r => r.id === hoveredReason)?.moodKey ?? null
  const highlightMood = reasonMood ?? hoveredAxis
  const highlightReasonId = hoveredReason
    ?? whyReasons.find(r => r.moodKey === hoveredAxis)?.id
    ?? null

  const goToMovie = useCallback((tmdbId) => {
    if (tmdbId) navigate(`/movie/${tmdbId}`)
  }, [navigate])

  const handlePlayTrailer = useCallback(() => {
    if (internalId) trackTrailerPlay(internalId, 'movie_detail_v2')
    setSelectedVideo(null)
    setTrailerOpen(true)
  }, [internalId])

  // Featurette tile click — open the modal with this specific clip rather
  // than the main trailer. `video` is the shape mapped in useMovieData
  // ({ id: youtubeKey, title, kind, thumb }).
  const handlePlayVideo = useCallback((video) => {
    if (!video?.id) return
    if (internalId) trackTrailerPlay(internalId, 'movie_detail_v2')
    setSelectedVideo({ key: video.id, title: video.title })
    setTrailerOpen(true)
  }, [internalId])

  const handleBack = useCallback(() => navigate(-1), [navigate])

  const handleShare = useCallback(async () => {
    if (internalId) trackShare(internalId, 'movie_detail_v2')
    if (navigator.share && mv) {
      try {
        await navigator.share({
          title: mv.title,
          text: mv.tagline || mv.overview,
          url: window.location.href,
        })
      } catch {
        // user cancelled — silent
      }
    }
  }, [internalId, mv])

  if (loading) return <PageSkeleton />
  if (error || !mv) return <PageError error={error} onBack={handleBack} />

  return (
    <MovieDataProvider value={data}>
      <div className="ff-movie-v2" style={{
        minHeight: '100vh', background: '#06060a', color: '#FAFAFA',
        fontFamily: 'Inter, sans-serif', overflow: 'hidden', position: 'relative',
      }}>
        <ScrollProgress />
        <FilmGrain />
        <TrailerModal
          open={trailerOpen}
          onClose={() => setTrailerOpen(false)}
          videoKey={selectedVideo?.key}
          videoTitle={selectedVideo?.title}
        />

        <div style={{ maxWidth: 1440, margin: '0 auto' }}>
          <MovieHero
            onPlayTrailer={handlePlayTrailer}
            onBack={handleBack}
            onShare={handleShare}
            isInWatchlist={isInWatchlist}
            isWatched={isWatched}
            onToggleWatchlist={toggleWatchlist}
            onToggleWatched={toggleWatched}
            loading={actionLoading}
            canAct={Boolean(user)}
          />

          <WhyForYou
            eyebrow={whyHeader.eyebrow}
            headline={whyHeader.headline}
            rationale={whyHeader.rationale}
            reasons={whyReasons}
            onHoverReason={setHoveredReason}
            highlightReasonId={highlightReasonId}
          />

          {/* Decide → confirm → act → reflect.
              YourTake sits high so a watched user can rate the moment they
              land. When unwatched, the locked card stays small and nudges
              them to mark watched — a quiet inline prompt, not a billboard. */}
          <div ref={yourTakeRef}>
            <YourTake isWatched={isWatched} userId={user?.id} internalId={internalId} />
          </div>

          <TheTake take={ffTake} />
          <CriticQuotes quotes={criticQuotes} />

          <MoodRadar
            axes={radarAxes}
            highlightMood={highlightMood}
            onHoverAxis={setHoveredAxis}
          />

          <Synopsis />

          <ProvidersSection />
          <VideosSection onPlayVideo={handlePlayVideo} />

          <FriendsLoved friends={friends} />
          <TasteTwinReview twin={twin} />

          <PairsWith goToMovie={goToMovie} />
          <CastSection />
          <DirectorShelf goToMovie={goToMovie} />

          <TimelineSection />
          <DetailsSection />
          <MovieFooter onBackToBriefing={() => navigate('/home')} />
        </div>

        <StickyActionBar
          onPlayTrailer={handlePlayTrailer}
          onBack={handleBack}
          onToggleWatchlist={toggleWatchlist}
          isInWatchlist={isInWatchlist}
          loading={actionLoading}
          canAct={Boolean(user)}
        />
      </div>
    </MovieDataProvider>
  )
}

function PageSkeleton() {
  const pulse = { background: 'rgba(255,255,255,0.04)' };
  return (
    <div className="ff-movie-v2" style={{
      minHeight: '100vh', background: '#06060a', color: '#FAFAFA',
      fontFamily: 'Inter, sans-serif', overflow: 'hidden',
    }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <div style={{ position:'relative', minHeight: 760, padding:'140px 88px 64px', display:'grid', gridTemplateColumns:'auto 1fr', gap:64, alignItems:'flex-end' }}>
          <div className="animate-pulse" style={{ ...pulse, width:300, aspectRatio:'2/3', borderRadius:8 }} />
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div className="animate-pulse" style={{ background:'rgba(167,139,250,0.10)', height:14, width:180, borderRadius:999 }} />
            <div className="animate-pulse" style={{ ...pulse, height:80, width:'70%', borderRadius:8 }} />
            <div className="animate-pulse" style={{ ...pulse, height:16, width:'40%', borderRadius:999 }} />
            <div className="animate-pulse" style={{ ...pulse, height:14, width:'55%', borderRadius:999 }} />
            <div style={{ display:'flex', gap:12, marginTop:16 }}>
              <div className="animate-pulse" style={{ background:'rgba(167,139,250,0.18)', height:48, width:160, borderRadius:8 }} />
              <div className="animate-pulse" style={{ ...pulse, height:48, width:160, borderRadius:8 }} />
              <div className="animate-pulse" style={{ ...pulse, height:48, width:120, borderRadius:8 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageError({ error, onBack }) {
  return (
    <div className="ff-movie-v2" style={{
      minHeight: '100vh', background: '#06060a', color: '#FAFAFA',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#A78BFA', marginBottom: 18 }}>
          404 · Film File Not Found
        </div>
        <h1 style={{ fontFamily: 'Outfit, Inter, sans-serif', fontSize: 48, fontWeight: 500, color: '#FAFAFA', margin: '0 0 18px 0', letterSpacing: '-0.025em' }}>
          Couldn’t find that movie.
        </h1>
        <p style={{ margin: '0 0 28px 0', color: 'rgba(250,250,250,0.6)', fontSize: 15, lineHeight: 1.6 }}>
          {error || 'It may not exist or TMDB couldn’t reach it.'}
        </p>
        <button
          onClick={onBack}
          style={{
            padding: '12px 22px', borderRadius: 999,
            background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
            color: '#fff', border: 'none', cursor: 'pointer',
            fontFamily: 'Outfit', fontSize: 14, fontWeight: 600,
          }}
        >
          Go back
        </button>
      </div>
    </div>
  );
}
