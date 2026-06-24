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
import { ThoughtfulRoot, PageDepth } from '@/shared/ui/thoughtful-seatmate'

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
import ExplorationTail from './components/ExplorationTail'
import MovieChapterNav from './components/MovieChapterNav'
import SpoilerBoundary from './components/SpoilerBoundary'
import PostWatchPortrait from './components/PostWatchPortrait'
import MovieActionBar from './components/MovieActionBar'
import { deriveRelationshipState, spoilerUnlocked } from './derive/movieRelationshipState'
import { classifyMovieRouteState } from './derive/movieRouteState'
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

  // §13 relationship-state authority — derived from auth + PERSISTED watched status.
  // The spoiler gate uses the SETTLED watched state (isWatched AND no in-flight watched
  // op), never the optimistic flip, so spoiler content can never appear before a Mark
  // Watched write settles successfully, and a failed write keeps it hidden (§29).
  const signedIn = Boolean(user)
  const watchedSettled = isWatched && !actionLoading.watched
  const relState = deriveRelationshipState({ signedIn, isWatched: watchedSettled })
  const unlocked = spoilerUnlocked(relState)

  const { fingerprint } = useTasteFingerprint(user?.id)
  const { count: directorCount } = useDirectorAffinity(user?.id, mv?.director)
  // §18 — friend + twin note TEXT is only fetched/rendered once spoiler content is
  // unlocked (settled watched). Pre-watch these hooks are disabled and return empty.
  const { friends } = useFriendsLoved(user?.id, internalId, unlocked)
  const { twin } = useTasteTwin(user?.id, internalId, unlocked)

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
  const watchedIntentRef = useRef(null)
  const watchlistIntentRef = useRef(null)
  const prevWatchedLoadingRef = useRef(false)
  const prevWatchlistLoadingRef = useRef(false)

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

  // Mark Watched: announce + reveal/scroll/focus the post-watch chapter ONLY on
  // settled success (§29). No confetti — the restrained acknowledgement is the
  // chapter appearing + a polite announcement; instant scroll under reduced motion.
  // A failed write keeps spoiler content hidden and announces the failure.
  useEffect(() => {
    const settled = prevWatchedLoadingRef.current && !actionLoading.watched
    prevWatchedLoadingRef.current = actionLoading.watched
    if (!settled || watchedIntentRef.current === null) return
    const intent = watchedIntentRef.current
    watchedIntentRef.current = null
    if (isWatched !== intent) { announce('Could not update watched status. Try again.'); return }
    if (intent) {
      announce(`Marked ${movieTitle} as watched. The post-watch chapter is now available.`)
      // The chapter is mounted by the time this passive effect runs (the settled
      // render committed it). Scroll + focus it; instant scroll under reduced motion.
      const el = document.getElementById('after-watching')
      if (el) {
        el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
        el.focus?.({ preventScroll: true })
      }
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
  if (error || !mv) {
    // F5.7: classify into safe, user-facing copy — never the raw error.
    const routeState = classifyMovieRouteState({ routeId: id, hasMovie: Boolean(mv), error })
    return <PageError routeState={routeState} onBack={handleBack} onHome={() => navigate('/home')} />
  }

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

  // §27 chapter list. "After watching" is added ONLY when unlocked, so its link
  // never exists in the accessibility tree before settled Watched (§15).
  const chapters = [
    { id: 'overview', label: 'Overview' },
    { id: 'experience', label: 'Experience' },
    { id: 'cast', label: 'Cast' },
    { id: 'more', label: 'More' },
    ...(unlocked ? [{ id: 'after-watching', label: 'After watching' }] : []),
  ]

  return (
    <MovieDataProvider value={data}>
      {/* Stage 3 — Thoughtful Seatmate: the Film File body activates the foundation
          LOCALLY (scoped .ts-root, never global) and paints the neutral near-black→
          warm-graphite page canvas with <PageDepth> (replacing the prior flat
          #06060a). Inter only; projection-ivory text. */}
      <ThoughtfulRoot>
      <PageDepth depth="radial" className="ff-movie" style={{
        minHeight: '100vh', color: 'var(--ts-text-primary, #f3ecdf)',
        fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', position: 'relative',
      }}>
        {/* F5.7: first focusable element — lets keyboard users skip the cinematic
            Hero controls and jump straight into the decision dossier. */}
        <a href="#film-file-content" className="ff-movie-skip-link">Skip to Film File content</a>
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
            canAct={signedIn}
          />

          {/* §27 route-owned chapter navigation. Sticky below the AppShell header;
              the "After watching" link only exists once unlocked. */}
          <MovieChapterNav chapters={chapters} />

          {/* §5: AppShell owns the only page <main>. This is a labelled REGION
              (not a second main landmark) and the skip-link / focus target. The
              explicit role is intentional per spec. */}
          {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
          <section id="film-file-content" role="region" aria-label="Film File" tabIndex={-1}>
            {/* Overview: the case leads, then the decision zone (synopsis + where
                to watch) — spoiler-safe, before any reflection. */}
            <div id="overview" className="ff-movie-chapter-anchor" tabIndex={-1}>
              <PrimaryCaseCard
                ffTake={ffTake}
                whyHeader={whyHeader}
                matchPct={mv.ffMatch}
                moodTags={filmDbRow?.mood_tags}
                fitProfile={filmDbRow?.fit_profile}
                signedIn={signedIn}
              />
              <Synopsis />
              <ProvidersSection />
            </div>

            {/* Compact-until-watched Your Take state (full reflection once watched). */}
            <YourTake isWatched={watchedSettled} userId={user?.id} internalId={internalId} onSaved={onRatingSaved} onError={onRatingError} />

            {/* Experience profile: Why-for-you + generated mood profile. Generated
                viewer IMPRESSIONS are NOT shown here — they are watched-gated and
                render inside the post-watch chapter (§19). */}
            <div id="experience" className="ff-movie-chapter-anchor" tabIndex={-1}>
              <DecisionEvidence
                whyHeader={whyHeader}
                whyReasons={whyReasons}
                onHoverReason={setHoveredReason}
                highlightReasonId={highlightReasonId}
                radarAxes={radarAxes}
                highlightMood={highlightMood}
                onHoverAxis={setHoveredAxis}
                viewerNotes={null}
              />
            </div>

            <VideosSection onPlayVideo={handlePlayVideo} />

            {/* Cast — factual film information. */}
            <div id="cast" className="ff-movie-chapter-anchor" tabIndex={-1}>
              <CastSection />
            </div>

            {/* More: continuation paths (similar + director). Social proof is NOT
                here pre-watch — it is watched-gated inside the post-watch chapter. */}
            <div id="more" className="ff-movie-chapter-anchor" tabIndex={-1}>
              <ExplorationTail
                similar={data.similar}
                directorFilms={data.dirShelf}
                directorName={mv.director}
                directorId={mv.directorId}
                onOpenMovie={goToMovie}
              />
            </div>

            {/* Collapsed reference: release history + production facts. */}
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

            {/* §15/§16/§17: spoiler boundary while locked; the watched-only chapter
                (Parasite curated portrait OR honest generic state + watched-gated
                impressions + social notes) once unlocked. The locked branch never
                mounts any spoiler content. */}
            {unlocked
              ? (
                <PostWatchPortrait
                  mvId={mv.id}
                  viewerNotes={viewerNotes}
                  friends={friends}
                  twin={twin}
                />
                )
              : <SpoilerBoundary signedIn={signedIn} />}

            <MovieFooter onBackToBriefing={() => navigate('/home')} />
          </section>
        </div>

        <StickyActionBar
          onPlayTrailer={handlePlayTrailer}
          onBack={handleBack}
          onToggleWatchlist={handleToggleWatchlist}
          isInWatchlist={isInWatchlist}
          loading={actionLoading}
          canAct={signedIn}
        />

        {/* §28 one mobile-only action bar, positioned above the AppShell BottomNav.
            Same action authority as the Hero / desktop sticky rail. */}
        <MovieActionBar
          onPlayTrailer={handlePlayTrailer}
          isInWatchlist={isInWatchlist}
          isWatched={isWatched}
          onToggleWatchlist={handleToggleWatchlist}
          onToggleWatched={handleMarkWatched}
          loading={actionLoading}
          canAct={signedIn}
        />
      </PageDepth>
      </ThoughtfulRoot>
    </MovieDataProvider>
  )
}

function PageSkeleton() {
  const pulse = { background: 'rgba(255,255,255,0.04)' };
  return (
    <ThoughtfulRoot>
    <PageDepth
      depth="radial"
      className="ff-movie"
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{ minHeight: '100vh', color: 'var(--ts-text-primary, #f3ecdf)', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}
    >
      <span className="sr-only">Loading Film File…</span>
      <div aria-hidden="true" style={{ maxWidth: 1440, margin: '0 auto' }}>
        <div style={{ position:'relative', minHeight: 760, padding:'140px 88px 64px', display:'grid', gridTemplateColumns:'auto 1fr', gap:64, alignItems:'flex-end' }}>
          <div className="animate-pulse" style={{ ...pulse, width:300, aspectRatio:'2/3', borderRadius:8 }} />
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div className="animate-pulse" style={{ background:'rgba(255,255,255,0.08)', height:14, width:180, borderRadius:999 }} />
            <div className="animate-pulse" style={{ ...pulse, height:80, width:'70%', borderRadius:8 }} />
            <div className="animate-pulse" style={{ ...pulse, height:16, width:'40%', borderRadius:999 }} />
            <div className="animate-pulse" style={{ ...pulse, height:14, width:'55%', borderRadius:999 }} />
            <div style={{ display:'flex', gap:12, marginTop:16 }}>
              <div className="animate-pulse" style={{ background:'rgba(255,255,255,0.10)', height:48, width:160, borderRadius:8 }} />
              <div className="animate-pulse" style={{ ...pulse, height:48, width:160, borderRadius:8 }} />
              <div className="animate-pulse" style={{ ...pulse, height:48, width:120, borderRadius:8 }} />
            </div>
          </div>
        </div>
      </div>
      </PageDepth>
    </ThoughtfulRoot>
  );
}

function PageError({ routeState, onBack, onHome }) {
  // F5.7: copy comes ONLY from the safe route classifier — no raw error text,
  // endpoints, or status messages reach the user.
  const { eyebrow, title, message } = routeState;
  return (
    <ThoughtfulRoot>
    <PageDepth depth="radial" className="ff-movie" style={{
      minHeight: '100vh', color: 'var(--ts-text-primary, #f3ecdf)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div role="alert" style={{ textAlign: 'center', maxWidth: 520 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--ts-text-secondary, #beb8ad)', marginBottom: 18 }}>
          {eyebrow}
        </div>
        <h1 style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 'clamp(30px, 6vw, 48px)', fontWeight: 600, color: 'var(--ts-text-primary, #f3ecdf)', margin: '0 0 18px 0', letterSpacing: '-0.025em', textWrap: 'balance' }}>
          {title}
        </h1>
        <p style={{ margin: '0 0 28px 0', color: 'var(--ts-text-muted, #8d887f)', fontSize: 15, lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onBack}
            className="ff-movie-error-btn"
            style={{ minHeight: 44, padding: '12px 22px', borderRadius: 4, background: 'var(--ts-action-primary-fill, #efe7d7)', color: 'var(--ts-action-primary-text, #221b13)', border: 'none', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, fontWeight: 600 }}
          >
            Go back
          </button>
          <button
            type="button"
            onClick={onHome}
            className="ff-movie-error-btn"
            style={{ minHeight: 44, padding: '12px 22px', borderRadius: 4, background: 'transparent', color: 'var(--ts-text-secondary, #beb8ad)', border: '1px solid var(--ts-border-strong, #46423d)', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, fontWeight: 600 }}
          >
            Go to Home
          </button>
        </div>
      </div>
      </PageDepth>
    </ThoughtfulRoot>
  );
}
