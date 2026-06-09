// src/features/movie/MovieDetail.jsx
// FeelFlick — Movie Detail (the "Film File" editorial direction). Route: /movie/:id.
//
// Per-id TMDB + Supabase fetch lives in ./useMovieData. Mood Radar, Why-for-you,
// Friends Loved, and Taste Twin derive dynamically for every film. The case leads
// via PrimaryCaseCard (ff_take → adaptive "why this fits you" → honest standalone);
// generated quotes render as ViewerNotes (honestly framed, not real reviews).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'

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
  ScrollProgress, FilmGrain, MovieHero, StickyActionBar, Synopsis,
} from './sections-top'
import AccessibleMediaDialog from './components/AccessibleMediaDialog'
import DecisionEvidence from './components/DecisionEvidence'
import FilmFileDisclosure from './components/FilmFileDisclosure'
import SocialContext from './components/SocialContext'
import ExplorationTail from './components/ExplorationTail'
import PrimaryCaseCard from './PrimaryCaseCard'
import {
  CastSection, VideosSection, ProvidersSection,
  TimelineSection, YourTake, DetailsSection, MovieFooter,
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
    // check constraint allows.
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
  // `critic_quotes` is the (legacy) overlay column name; rendered honestly as
  // generated "Viewer notes", NOT real critic reviews (see ViewerNotes.jsx).
  const viewerNotes = overlay?.critic_quotes ?? null

  // `selectedVideo` is null when the modal should play the canonical main
  // trailer (hero CTA, sticky bar). Featurette tiles pass their own clip in
  // so the modal honestly plays what was clicked.
  const [trailerOpen, setTrailerOpen] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [hoveredReason, setHoveredReason] = useState(null)
  const [hoveredAxis, setHoveredAxis] = useState(null)

  // F5.4 — one Film File-owned polite live region for concise action outcomes.
  const reduced = useReducedMotion()
  const [announcement, setAnnouncement] = useState('')
  const announce = useCallback((msg) => setAnnouncement(msg), [])

  // F5.4 settlement model (mirrors Home F4.3). The shared status hook flips state
  // optimistically and reverts on failure WITHOUT returning a result, so we observe
  // each `loading.{watched,watchlist}` true→false transition and compare the settled
  // state against the intent the user clicked. An intent ref (set only on a real
  // click) guards against the first-render DB sync being mistaken for a user op.
  const yourTakeRef = useRef(null)
  const watchedIntentRef = useRef(null)
  const watchlistIntentRef = useRef(null)
  const prevWatchedLoadingRef = useRef(false)
  const prevWatchlistLoadingRef = useRef(false)
  const confettiTimerRef = useRef(null)
  const [celebrate, setCelebrate] = useState(false)
  useEffect(() => () => { if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current) }, [])

  const handleMarkWatched = useCallback(() => {
    if (actionLoading.watched) return
    watchedIntentRef.current = !isWatched   // the value the user intends to settle to
    toggleWatched()
  }, [actionLoading.watched, isWatched, toggleWatched])

  const handleToggleWatchlist = useCallback(() => {
    if (actionLoading.watchlist) return
    watchlistIntentRef.current = !isInWatchlist
    toggleWatchlist()
  }, [actionLoading.watchlist, isInWatchlist, toggleWatchlist])

  // Mark Watched: announce / unlock / scroll / celebrate ONLY on settled success.
  useEffect(() => {
    const settled = prevWatchedLoadingRef.current && !actionLoading.watched
    prevWatchedLoadingRef.current = actionLoading.watched
    if (!settled || watchedIntentRef.current === null) return
    const intent = watchedIntentRef.current
    watchedIntentRef.current = null
    if (isWatched !== intent) { announce('Could not update watched status. Try again.'); return }
    if (intent) {
      announce(`Marked ${movieTitle} as watched. Your Take is now available.`)
      if (!reduced) {
        setCelebrate(true)
        if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current)
        confettiTimerRef.current = setTimeout(() => setCelebrate(false), 1800)
      }
      yourTakeRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
    } else {
      announce(`Removed watched status for ${movieTitle}.`)
    }
  }, [actionLoading.watched, isWatched, reduced, movieTitle, announce])

  // Save: announce success / removal / failure ONLY on settlement.
  useEffect(() => {
    const settled = prevWatchlistLoadingRef.current && !actionLoading.watchlist
    prevWatchlistLoadingRef.current = actionLoading.watchlist
    if (!settled || watchlistIntentRef.current === null) return
    const intent = watchlistIntentRef.current
    watchlistIntentRef.current = null
    if (isInWatchlist !== intent) { announce('Could not update saved films. Try again.'); return }
    announce(intent ? `Saved ${movieTitle} for later.` : `Removed ${movieTitle} from saved films.`)
  }, [actionLoading.watchlist, isInWatchlist, movieTitle, announce])

  const onRatingSaved = useCallback(() => announce(`Your take on ${movieTitle} was saved.`), [announce, movieTitle])
  const onRatingError = useCallback(() => announce('Could not save your take. Try again.'), [announce])

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
    // Analytics first + non-blocking (unchanged event/metadata). The canonical clean
    // Film File URL is shared/copied — never the raw location (no query/auth material).
    if (internalId) trackShare(internalId, 'movie_detail_v2')
    if (navigator.share && mv) {
      try {
        await navigator.share({ title: mv.title, text: mv.tagline || mv.overview, url: movieUrl })
        announce(`Shared ${movieTitle}.`)
      } catch (err) {
        // user cancelled (AbortError) → silent; never claim success on real failure.
        if (err?.name !== 'AbortError') announce('Could not share this film.')
      }
      return
    }
    // No native share → clipboard fallback.
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(movieUrl)
        announce(`Link copied for ${movieTitle}.`)
      } else {
        announce('Could not share this film.')
      }
    } catch {
      announce('Could not share this film.')
    }
  }, [internalId, mv, movieUrl, movieTitle, announce])

  if (loading) return <PageSkeleton />
  if (error || !mv) return <PageError error={error} onBack={handleBack} />

  // F5.5 — gate the collapsed Film Details disclosure. TimelineSection self-hides
  // when there's no release date / languages; DetailsSection always renders, so it
  // is gated here. The disclosure shows only when at least one has content.
  const hasTimeline = Boolean(mv.releaseDate) || (Array.isArray(mv.languages) && mv.languages.length > 0)
  const hasDetails = Boolean(
    mv.runtime || mv.releaseDate || mv.certification ||
    (mv.budget && mv.budget !== '—') || (mv.revenue && mv.revenue !== '—') ||
    (mv.language && mv.language !== '—') ||
    (mv.director && mv.director !== '—') || (mv.writer && mv.writer !== '—'),
  )
  const hasFilmDetails = hasTimeline || hasDetails

  return (
    <MovieDataProvider value={data}>
      <div className="ff-movie" style={{
        minHeight: '100vh', background: '#06060a', color: '#FAFAFA',
        fontFamily: 'Inter, sans-serif', overflow: 'hidden', position: 'relative',
      }}>
        <ScrollProgress />
        <FilmGrain />
        <AccessibleMediaDialog
          open={trailerOpen}
          onClose={() => setTrailerOpen(false)}
          youtubeKey={selectedVideo?.key || mv.trailerYouTubeId}
          title={selectedVideo?.title
            ? `${mv.title} · ${selectedVideo.title}`
            : `${mv.title} · Official Trailer`}
        />

        {/* One Film File-owned polite live region for action outcomes. */}
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {announcement}
        </div>

        <div style={{ maxWidth: 1440, margin: '0 auto' }}>
          <MovieHero
            onPlayTrailer={handlePlayTrailer}
            onBack={handleBack}
            onShare={handleShare}
            isInWatchlist={isInWatchlist}
            isWatched={isWatched}
            onToggleWatchlist={handleToggleWatchlist}
            onToggleWatched={handleMarkWatched}
            loading={actionLoading}
            canAct={Boolean(user)}
            celebrate={celebrate}
          />

          {/* The case leads: one consolidated, tier-aware statement of why this
              film was surfaced (ff_take → adaptive "why this fits you" → honest
              standalone), before the Why-for-you signal cards expand it. */}
          <PrimaryCaseCard
            ffTake={ffTake}
            whyHeader={whyHeader}
            matchPct={mv.ffMatch}
            moodTags={filmDbRow?.mood_tags}
            fitProfile={filmDbRow?.fit_profile}
            signedIn={Boolean(user)}
          />

          {/* F5.5 decision zone: what is it about (synopsis) + where can I watch
              (providers) come right after the case — before any analysis or
              reflection. The watched-success scroll target (yourTakeRef) is kept
              stable on the YourTake wrapper. */}
          <Synopsis />

          <ProvidersSection />

          {/* Decide → act → reflect. Compact until watched (no rating controls
              interrupting the decision); full reflection form once watched. */}
          <div ref={yourTakeRef}>
            <YourTake isWatched={isWatched} userId={user?.id} internalId={internalId} onSaved={onRatingSaved} onError={onRatingError} />
          </div>

          {/* Go deeper: the supporting recommendation evidence (Why For You + the
              generated mood profile + the generated impressions), collapsed by
              default so the decision path stays short. Self-hides when empty. */}
          <DecisionEvidence
            whyHeader={whyHeader}
            whyReasons={whyReasons}
            onHoverReason={setHoveredReason}
            highlightReasonId={highlightReasonId}
            radarAxes={radarAxes}
            highlightMood={highlightMood}
            onHoverAxis={setHoveredAxis}
            viewerNotes={viewerNotes}
          />

          <VideosSection onPlayVideo={handlePlayVideo} />

          {/* Cast is factual film information — it leads the lower tail, before the
              optional social + exploration disclosures. */}
          <CastSection />

          {/* F5.6: one restrained social-proof disclosure (Friends + anonymised
              Taste Twin) + one restrained exploration disclosure (similar + director),
              replacing the four old full-page tail sections. Both self-hide empty. */}
          <SocialContext friends={friends} twin={twin} />
          <ExplorationTail
            similar={data.similar}
            directorFilms={data.dirShelf}
            directorName={mv.director}
            directorId={mv.directorId}
            onOpenMovie={goToMovie}
          />

          {/* Collapsed reference: release history + production facts, behind one
              disclosure. Renders only when there is something to show. */}
          {hasFilmDetails && (
            <FilmFileDisclosure
              className="ff-movie-film-details"
              heading="Film details"
              copy="Release history, production facts, and additional information."
              defaultOpen={false}
            >
              <TimelineSection />
              {hasDetails && <DetailsSection />}
            </FilmFileDisclosure>
          )}
          <MovieFooter onBackToBriefing={() => navigate('/home')} />
        </div>

        <StickyActionBar
          onPlayTrailer={handlePlayTrailer}
          onBack={handleBack}
          onToggleWatchlist={handleToggleWatchlist}
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
    <div className="ff-movie" style={{
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
    <div className="ff-movie" style={{
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
