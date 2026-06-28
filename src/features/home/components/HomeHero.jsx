// src/features/home/components/HomeHero.jsx
// The redesigned Home hero: a contained editorial cinematic backdrop with a small,
// bounded carousel of personally-grounded standout picks (≤3). Every hero film
// MUST carry a specific, grounded reason — generic "Picked for you" candidates
// are filtered out upstream in Home, never shown here.
//
// Behaviour preserved verbatim from the retired Briefing slide (so the redesign
// is a presentation change, not a behaviour change):
//   • Open Film File   → recordRecommendationOutcome('clicked') then /movie/:tmdbId
//   • Save             → useUserMovieStatus.toggleWatchlist (optimistic + revert)
//   • Mark Watched     → useUserMovieStatus.toggleWatched (write-gated advance)
//   • Not tonight      → updateImpression(...,'skipped') + trackInteraction('dismiss'),
//                        then advance to the next standout (session-hidden)
//   • per-active-film 'hero' surface impression + a polite SR live region.
//
// A contained editorial "stage": it starts cleanly below the fixed header and is
// inset/bounded like the rows below. Content anchors bottom-LEFT over a scrim on
// every device (artwork stays clean top-right on desktop); swipe + dots move
// between standouts. Reduced motion → instant updates (CSS-gated).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, SkipForward, Bookmark, Check, Eye } from 'lucide-react'

import Button from '@/shared/ui/Button'
import { useUserMovieStatus } from '@/shared/hooks/useUserMovieStatus'
import { updateImpression, logSurfaceImpressions } from '@/shared/services/recommendations'
import { recordRecommendationOutcome } from '@/shared/services/recommendationOutcomes'
import { trackInteraction } from '@/shared/services/interactions'
import { backdropImg, backdropSrcSet } from '@/shared/api/tmdb'
import HomeHeroControls from './HomeHeroControls'

const SWIPE_MIN = 46

function formatRuntime(min) {
  const n = Number(min)
  if (!n || n <= 0) return null
  const h = Math.floor(n / 60)
  const m = n % 60
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

function yearOf(film) {
  if (film?.release_year) return film.release_year
  if (film?.release_date) return new Date(film.release_date).getFullYear()
  return ''
}

// Display the spoken language only when it's NOT English (English is the implicit
// default, so showing it would be noise). Maps the ISO-639-1 code to a readable
// name ('fr' → 'French'); falls back to the upper-cased code if Intl can't resolve it.
function languageLabel(film) {
  const code = film?.original_language
  if (!code || code === 'en') return null
  try {
    const name = new Intl.DisplayNames(['en'], { type: 'language' }).of(code)
    if (name && name.toLowerCase() !== code.toLowerCase()) return name
  } catch { /* Intl.DisplayNames unavailable — fall through to the code */ }
  return code.toUpperCase()
}

// === One hero standout — owns its save/watched writes + optimistic-revert =====
function HomeHeroSlide({ film, user, onOpen, onSkip, onMarkedWatched, announce }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const statusMovie = useMemo(() => film, [film?.id, film?.tmdb_id])
  const {
    isInWatchlist, isWatched, loading: statusLoading, toggleWatchlist, toggleWatched, internalId,
  } = useUserMovieStatus({ user, movie: statusMovie, internalMovieId: film?.id, source: 'carousel_row' })

  const [watchedState, setWatchedState] = useState('idle') // idle | saving | watched | error
  const [saveState, setSaveState] = useState('idle')       // idle | saving | error
  const watchPendingRef = useRef(false)
  const savePendingRef = useRef(null)                      // null | 'add' | 'remove'
  const advanceTimerRef = useRef(null)
  useEffect(() => () => { if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current) }, [])

  // Mark Watched — do NOT advance until the user_history write succeeds.
  const handleMarkWatched = useCallback(() => {
    if (!film?.id || !internalId || statusLoading.watched || watchedState === 'saving' || isWatched) return
    watchPendingRef.current = true
    setWatchedState('saving')
    toggleWatched()
  }, [film?.id, internalId, statusLoading.watched, watchedState, isWatched, toggleWatched])

  useEffect(() => {
    if (!watchPendingRef.current || statusLoading.watched) return
    watchPendingRef.current = false
    const filmId = film?.id
    if (isWatched) {
      setWatchedState('watched')
      advanceTimerRef.current = setTimeout(() => { onMarkedWatched?.(filmId); advanceTimerRef.current = null }, 600)
    } else {
      setWatchedState('error')
      announce?.('Could not mark watched. Try again.')
    }
  }, [statusLoading.watched, isWatched, film?.id, onMarkedWatched, announce])

  // Save — optimistic toggle, surface success / failure once the write settles.
  const handleSave = useCallback(() => {
    if (!film?.id || !internalId || statusLoading.watchlist || saveState === 'saving') return
    savePendingRef.current = isInWatchlist ? 'remove' : 'add'
    setSaveState('saving')
    toggleWatchlist()
  }, [film?.id, internalId, statusLoading.watchlist, saveState, isInWatchlist, toggleWatchlist])

  useEffect(() => {
    if (savePendingRef.current == null || statusLoading.watchlist) return
    const intent = savePendingRef.current
    savePendingRef.current = null
    if (intent === 'add') {
      if (isInWatchlist) { setSaveState('idle'); announce?.('Saved for later.') }
      else { setSaveState('error'); announce?.('Could not save. Try again.') }
    } else if (isInWatchlist) {
      setSaveState('error'); announce?.('Could not save. Try again.')
    } else {
      setSaveState('idle')
    }
  }, [statusLoading.watchlist, isInWatchlist, announce])

  if (!film) return null
  const reason = film._reason?.text
  const meta = [yearOf(film), film.primary_genre || null, formatRuntime(film.runtime), languageLabel(film)].filter(Boolean)
  // Title-length class drives desktop font-size tiers so long titles scale down
  // gracefully without truncation or layout disruption.
  const titleLen = (film.title || '').length
  const titleSizeClass = titleLen <= 20 ? 'title-s' : titleLen <= 35 ? 'title-m' : 'title-l'

  return (
    <div className="ff-hero__panel">
      <div className="ff-hero__kicker">Top pick for you</div>
      <h2 className={`ff-hero__title ${titleSizeClass}`}>{film.title}</h2>
      {meta.length > 0 ? (
        <div className="ff-hero__meta">
          {meta.map((bit, i) => (
            <span key={i}>{i > 0 ? <i aria-hidden="true" /> : null}<span>{bit}</span></span>
          ))}
        </div>
      ) : null}
      {reason ? <p className="ff-hero__reason">{reason}</p> : null}

      <div className="ff-hero__actions">
        <Button variant="primary" size="md" className="ff-hero__primary" onClick={() => onOpen(film)}>
          <span>Open Film File</span>
          <ChevronRight className="h-[15px] w-[15px]" aria-hidden="true" />
        </Button>

        <button
          type="button"
          className={`ff-hero__icon${isInWatchlist ? ' is-active' : ''}`}
          aria-label={isInWatchlist ? `Remove ${film.title} from watchlist` : `Add ${film.title} to watchlist`}
          aria-pressed={isInWatchlist}
          title={saveState === 'error' ? 'Couldn’t save — tap to retry' : isInWatchlist ? 'Saved to watchlist' : 'Save to watchlist'}
          disabled={saveState === 'saving'}
          onClick={handleSave}
        >
          <Bookmark className="h-[18px] w-[18px]" fill={isInWatchlist ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>

        <button
          type="button"
          className={`ff-hero__icon${isWatched ? ' is-active' : ''}`}
          aria-label={isWatched ? `${film.title} marked as watched` : `Mark ${film.title} as already watched`}
          aria-pressed={isWatched}
          title={watchedState === 'error' ? 'Couldn’t mark watched — tap to retry' : isWatched ? 'Watched' : 'Already watched'}
          disabled={watchedState === 'saving' || isWatched}
          onClick={handleMarkWatched}
        >
          {isWatched ? <Check className="h-[18px] w-[18px]" aria-hidden="true" /> : <Eye className="h-[18px] w-[18px]" aria-hidden="true" />}
        </button>

        <button type="button" className="ff-hero__ghost ff-hero__skip" aria-label={`Not tonight — skip ${film.title}`} onClick={() => onSkip(film)}>
          <SkipForward className="h-[16px] w-[16px]" aria-hidden="true" />
          <span>Not tonight</span>
        </button>
      </div>
    </div>
  )
}

export default function HomeHero({ films, user }) {
  const navigate = useNavigate()
  const [hiddenIds, setHiddenIds] = useState(() => new Set())
  const [index, setIndex] = useState(0)
  const [statusMsg, setStatusMsg] = useState('')
  const announce = useCallback((msg) => setStatusMsg(msg), [])
  const pickActionRef = useRef('initial') // 'initial' | 'skip' | 'watched'
  const touchRef = useRef({ x: null, y: null })

  const visible = useMemo(() => (films || []).filter(f => f && !hiddenIds.has(f.id)), [films, hiddenIds])
  const safeIndex = visible.length ? Math.min(index, visible.length - 1) : 0
  const active = visible[safeIndex] || null

  // Keep index in range when the visible set shrinks (skip / watched).
  useEffect(() => { if (index > Math.max(0, visible.length - 1)) setIndex(Math.max(0, visible.length - 1)) }, [visible.length, index])

  const goTo = useCallback((i) => {
    pickActionRef.current = 'nav'
    setIndex(((i % visible.length) + visible.length) % visible.length)
  }, [visible.length])
  const next = useCallback(() => goTo(safeIndex + 1), [goTo, safeIndex])
  const prev = useCallback(() => goTo(safeIndex - 1), [goTo, safeIndex])

  const hide = useCallback((id) => setHiddenIds(prev => { const n = new Set(prev); n.add(id); return n }), [])

  const handleOpen = useCallback((film) => {
    if (user?.id && film?.id) {
      recordRecommendationOutcome({ userId: user.id, movieId: film.id, action: 'clicked' }).catch(() => { /* best-effort */ })
    }
    if (film?.tmdbId || film?.tmdb_id) navigate(`/movie/${film.tmdbId ?? film.tmdb_id}`)
  }, [user?.id, navigate])

  const handleSkip = useCallback((film) => {
    if (!film?.id) return
    pickActionRef.current = 'skip'
    if (user?.id) updateImpression(user.id, film.id, 'skipped').catch(() => { /* non-fatal learning signal */ })
    trackInteraction('dismiss', { movieId: film.id, source: 'home_hero', metadata: { action: 'skip' } }).catch(() => {})
    hide(film.id)
  }, [user?.id, hide])

  const handleMarkedWatched = useCallback((id) => {
    if (id == null) return
    pickActionRef.current = 'watched'
    hide(id)
  }, [hide])

  // Per-active-film 'hero' surface impression (per-day-deduped by the table key).
  const activeId = active?.id
  const activeReason = active?._reason?.text
  useEffect(() => {
    if (!user?.id || activeId == null) return
    logSurfaceImpressions({
      userId: user.id,
      films: [{ id: activeId }],
      placement: 'hero',
      pickReasonType: 'home_hero',
      pickReasonLabel: activeReason || 'Top pick for you',
    }).catch(() => { /* best-effort */ })
  }, [user?.id, activeId, activeReason])

  // Announce active-film changes (wording shaped by the last action).
  const activeTitle = active?.title
  useEffect(() => {
    if (activeId == null || !activeTitle) { pickActionRef.current = 'initial'; return }
    const reason = pickActionRef.current
    pickActionRef.current = 'initial'
    if (reason === 'skip') announce(`Next pick: ${activeTitle}.`)
    else if (reason === 'watched') announce(`Marked watched. Next pick: ${activeTitle}.`)
    else if (reason === 'nav') announce(`${activeTitle}.`)
    else announce(`Top pick for you: ${activeTitle}.`)
  }, [activeId, activeTitle, announce])

  const onTouchStart = useCallback((e) => {
    const t = e.changedTouches[0]; touchRef.current = { x: t.clientX, y: t.clientY }
  }, [])
  const onTouchEnd = useCallback((e) => {
    const { x, y } = touchRef.current
    if (x == null) return
    const t = e.changedTouches[0]
    const dx = t.clientX - x, dy = t.clientY - y
    touchRef.current = { x: null, y: null }
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) <= Math.abs(dy)) return
    if (dx < 0) next(); else prev()
  }, [next, prev])

  if (!active) return null

  return (
    // Keyboard navigation is provided by the labelled prev/next arrow buttons
    // (HomeHeroControls); the touch handlers add swipe on mobile only.
    <section
      className="ff-hero"
      aria-roledescription="carousel"
      aria-label="Top picks for you"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="ff-hero__media" aria-hidden="true">
        <img
          key={active.id}
          className="ff-hero__img"
          src={backdropImg(active.backdrop_path, 'w1280')}
          srcSet={backdropSrcSet(active.backdrop_path)}
          sizes="100vw"
          alt=""
          fetchPriority="high"
        />
      </div>
      <div className="ff-hero__scrim" aria-hidden="true" />

      <div className="ff-hero__content">
        <HomeHeroSlide
          key={active.id}
          film={active}
          user={user}
          onOpen={handleOpen}
          onSkip={handleSkip}
          onMarkedWatched={handleMarkedWatched}
          announce={announce}
        />
      </div>

      <HomeHeroControls count={visible.length} index={safeIndex} onPrev={prev} onNext={next} onGoTo={goTo} />

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{statusMsg}</div>
    </section>
  )
}
