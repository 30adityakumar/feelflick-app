// src/features/onboarding/steps/RatingStep.jsx
// Step 4 — the verdict. A calm single-poster card with editorial verdict controls
// (Okay / Liked / Loved) as the primary, tap-first interaction; swipe is a quiet
// optional shortcut (right→Loved, up→Liked, left→Okay). Counter syncs on commit.

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  useReducedMotion,
} from 'framer-motion'
import { ChevronLeft, Sparkles } from 'lucide-react'

import { tmdbImg } from '@/shared/api/tmdb'
import { SENTIMENT_RATINGS } from '@/features/onboarding/data'

// Ascending editorial verdicts — Okay → Liked → Loved (left to right). Keys must
// match SENTIMENT_RATINGS; `rgb` drives each tier's tint/border/elevation, with
// Loved as the gentle brand apex.
const SENTIMENTS = [
  { key: 'okay',  label: 'Okay',  rgb: '150, 150, 162' },
  { key: 'liked', label: 'Liked', rgb: '168, 85, 247' },
  { key: 'loved', label: 'Loved', rgb: '236, 72, 153' },
]

const ratingToSentiment = (rating) => {
  if (rating === SENTIMENT_RATINGS.loved) return 'loved'
  if (rating === SENTIMENT_RATINGS.liked) return 'liked'
  if (rating === SENTIMENT_RATINGS.okay)  return 'okay'
  return null
}

const ADVANCE_DELAY_MS = 280
// Pixels the card must travel before a swipe commits a rating.
const SWIPE_THRESHOLD = 110

export default function RatingStep({ favoriteMovies, ratings, onRate, onBack, onFinish, error }) {
  const reduced = useReducedMotion()
  const films = useMemo(() => favoriteMovies ?? [], [favoriteMovies])
  const [idx, setIdx] = useState(0)
  // Tracks which direction the card should fly out in (right/left/up = swipe;
  // null = button-tap, uses the default upward fade).
  const [exitDirection, setExitDirection] = useState(null)
  // Live hint while the user is mid-drag — used to highlight the matching
  // sentiment button. Set by SwipeableFilmCard's motion value subscription.
  const [dragHint, setDragHint] = useState(null)
  const advanceTimerRef = useRef(null)
  const isAdvancingRef = useRef(false)
  const allRated = idx >= films.length
  const current = films[idx]
  const remaining = Math.max(0, films.length - idx)

  // WHY: clear pending advance on unmount so a late timer can't fire setIdx
  // against a stale closure.
  useEffect(() => () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
  }, [])

  // Reset exit direction + drag hint when a fresh card mounts.
  useEffect(() => {
    setExitDirection(null)
    setDragHint(null)
  }, [idx])

  // Auto-fire onFinish the moment the last rating commits — gives the user a
  // ~700ms beat to see the card fly out before the celebration takes over.
  // The intermediate "Nice — all rated" button used to gate this; we removed
  // it to keep the momentum of the swipe → reveal flow.
  useEffect(() => {
    if (!allRated || !onFinish) return
    const t = window.setTimeout(() => { onFinish() }, 700)
    return () => clearTimeout(t)
  }, [allRated, onFinish])

  // Shared commit path for both button taps and swipe gestures. Counter syncs
  // immediately (setIdx fires synchronously) so "X to go" reflects the commit
  // the user just made. The 280ms guard window only blocks rapid double-taps
  // — it no longer gates the visual advance.
  const commitRate = (sentiment, direction = null) => {
    if (!current || isAdvancingRef.current) return
    isAdvancingRef.current = true
    if (direction) setExitDirection(direction)
    onRate(current, sentiment)
    setIdx((i) => Math.min(i + 1, films.length))
    advanceTimerRef.current = window.setTimeout(() => {
      isAdvancingRef.current = false
    }, ADVANCE_DELAY_MS)
  }

  const handleRate = (sentiment) => commitRate(sentiment, null)
  const handleSwipe = (sentiment, direction) => commitRate(sentiment, direction)

  const handleSkip = () => {
    if (isAdvancingRef.current) return
    setIdx((i) => Math.min(i + 1, films.length))
  }

  // Keyboard parity for the swipe directions. Fires ONLY when the rating-stage
  // region itself owns focus (never from a button/link/interactive descendant),
  // and routes through the SAME commitRate + guard as tap/swipe — the frozen
  // right→loved / up→liked / left→okay mapping, no duplication.
  const handleStageKeyDown = (e) => {
    if (e.target !== e.currentTarget) return
    if (allRated || !current || isAdvancingRef.current) return
    let sentiment = null
    let direction = null
    if (e.key === 'ArrowRight') { sentiment = 'loved'; direction = 'right' }
    else if (e.key === 'ArrowUp') { sentiment = 'liked'; direction = 'up' }
    else if (e.key === 'ArrowLeft') { sentiment = 'okay'; direction = 'left' }
    else return
    e.preventDefault()
    commitRate(sentiment, direction)
  }

  // The sole detailed film-progress announcement (DnaRail suppresses its tally
  // on Step 4). Derived only from existing current/remaining/allRated — no new
  // progression state, no second visible counter.
  const liveMessage = allRated
    ? 'All rated — building your picks'
    : current
      ? `Now rating ${current.title} — ${remaining} to go`
      : ''

  // Focus/keyboard wiring for the active card; absent once allRated so the stage
  // stops being a tab stop during the celebration handoff.
  const stageProps = !allRated && current
    ? {
        tabIndex: 0,
        role: 'group',
        'aria-label': `Rate ${current.title}`,
        'aria-describedby': 'rating-kbd-help',
        onKeyDown: handleStageKeyDown,
      }
    : {}

  return (
    <div className="flex h-full flex-col">
      {/* Sole detailed film-progress announcement (sr-only). */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>
      <span id="rating-kbd-help" className="sr-only">
        Use the verdict buttons below, or press Left for Okay, Up for Liked, and Right for Loved.
      </span>
      <div className="flex-none px-5 pb-3 pt-5 sm:px-6 sm:pb-4 sm:pt-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-3 flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/70 sm:mb-4 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <p className="ob-eyebrow text-white/55 mb-2.5 sm:mb-3">
          The verdict · 4 of 4 · {allRated ? 'all done' : `${remaining} to go`}
        </p>
        <h2
          className="ob-headline text-white"
          style={{ textWrap: 'balance' }}
        >
          {allRated ? (
            <>
              Nice — all{' '}
              <em className="italic font-light text-purple-300">
                rated.
              </em>
            </>
          ) : (
            <>
              How did this one{' '}
              <em className="italic font-light text-purple-300">
                land?
              </em>
            </>
          )}
        </h2>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-white/55 sm:mt-3 sm:text-sm md:text-[15px]">
          {allRated
            ? 'That’s all of them. Building your first picks…'
            : reduced
              ? "Choose one. We'll move on automatically."
              : 'Choose your verdict below. Swipe is optional.'}
        </p>
      </div>

      {/* Card area — shrinks if viewport is short so the SentimentRow below
         stays in view. No inner overflow container (previous version clipped
         the sentiment buttons on phones + tablets). */}
      <div className="min-h-0 flex-1 px-5 pb-2 sm:px-6">
        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mx-auto flex h-full w-full max-w-md items-center justify-center">
          <div
            {...stageProps}
            className="relative h-full max-h-full aspect-2/3 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <AnimatePresence mode="wait" initial={false}>
              {allRated ? (
                // Brief placeholder while the Onboarding container's full
                // celebration screen mounts. The useEffect above auto-fires
                // onFinish() within 700ms, so this state is fleeting.
                <motion.div
                  key="handoff"
                  aria-hidden="true"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid h-full place-items-center"
                >
                  <Sparkles className="h-10 w-10 text-purple-400/70 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
                </motion.div>
              ) : (
                <SwipeableFilmCard
                  key={current.id}
                  movie={current}
                  reduced={reduced}
                  exitDirection={exitDirection}
                  onSwipe={handleSwipe}
                  onDragHintChange={setDragHint}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer — sentiment row + skip when rating. Hidden when all rated;
         the Onboarding container's celebration screen takes over. */}
      {!allRated && (
        <div className="flex-none border-t border-white/6 px-5 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-5">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
            <SentimentRow
              active={ratingToSentiment(ratings[current?.id])}
              dragHint={dragHint}
              onRate={handleRate}
              reduced={reduced}
            />
            <button
              type="button"
              onClick={handleSkip}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full px-4 text-sm font-medium text-white/50 transition-colors hover:text-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// === Swipeable film card ==================================================
// Wraps FilmCard in a draggable motion.div — the optional swipe shortcut behind
// the editorial verdict controls. Tracks x/y motion values for a restrained
// cinematic tilt and commits a rating when the drag passes SWIPE_THRESHOLD.
//
// Mapping (Step 3 framed these films as loved anchors):
//   swipe right → 'loved'
//   swipe up    → 'liked'
//   swipe left  → 'okay'
//
// Calls `onDragHintChange` whenever the drag direction crosses a threshold so
// the parent can highlight the matching verdict control.
function SwipeableFilmCard({ movie, reduced, exitDirection, onSwipe, onDragHintChange }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  // Restrained cinematic tilt in the drag direction (subtle, not a card-fling).
  const rotate = useTransform(x, [-260, 260], [-6, 6])

  const exitVariant =
    exitDirection === 'right' ? { x: 600, opacity: 0, rotate: 24 } :
    exitDirection === 'left'  ? { x: -600, opacity: 0, rotate: -24 } :
    exitDirection === 'up'    ? { y: -500, opacity: 0 } :
    reduced ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.98 }

  const handleDragEnd = (_e, info) => {
    const dx = info.offset.x
    const dy = info.offset.y
    // Up takes priority over horizontal when both pass the threshold and y is
    // larger in magnitude — matches the natural "fling up" gesture.
    if (dy < -SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      onSwipe('liked', 'up')
    } else if (dx > SWIPE_THRESHOLD) {
      onSwipe('loved', 'right')
    } else if (dx < -SWIPE_THRESHOLD) {
      onSwipe('okay', 'left')
    } else {
      // Snap-back — clear any lingering hint.
      onDragHintChange?.(null)
    }
  }

  // Update the parent's dragHint only when the drag direction crosses a
  // threshold (not on every pixel) so we don't trigger re-render storms.
  const hintRef = useRef(null)
  const updateHint = (xv, yv) => {
    let hint = null
    const ax = Math.abs(xv)
    const ay = Math.abs(yv)
    if (yv < -40 && ay > ax) hint = 'liked'        // up
    else if (xv > 40) hint = 'loved'               // right
    else if (xv < -40) hint = 'okay'               // left
    if (hint !== hintRef.current) {
      hintRef.current = hint
      onDragHintChange?.(hint)
    }
  }
  useMotionValueEvent(x, 'change', (latest) => updateHint(latest, y.get()))
  useMotionValueEvent(y, 'change', (latest) => updateHint(x.get(), latest))

  return (
    <motion.div
      drag={reduced ? false : true}
      dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
      dragElastic={0.85}
      onDragEnd={handleDragEnd}
      style={{ x, y, rotate, cursor: reduced ? 'default' : 'grab' }}
      initial={reduced ? false : { opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={exitVariant}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileDrag={{ cursor: 'grabbing' }}
      className="relative h-full w-full touch-none select-none"
    >
      <FilmCard movie={movie} />
    </motion.div>
  )
}

// === Film card ============================================================
// Uses the portrait poster (poster_path) as the primary image so the iconic
// film art shows fully. Backdrop is the fallback when no poster exists.
// Bottom gradient is lighter than the backdrop variant so the poster's own
// title typography stays legible underneath the FeelFlick title overlay.
function FilmCard({ movie }) {
  const [loaded, setLoaded] = useState(false)
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
      {!loaded && <div className="absolute inset-0 animate-pulse bg-white/4 motion-reduce:animate-none" />}
      <img
        src={tmdbImg(movie.poster_path || movie.backdrop_path, 'w780')}
        alt=""
        loading="lazy"
        draggable={false}
        onLoad={() => setLoaded(true)}
        className={`pointer-events-none block h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-black/90 via-black/50 to-transparent" />
      <div className="pointer-events-none absolute inset-x-5 bottom-4">
        <div className="ob-display text-xl font-medium tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] sm:text-2xl">
          {movie.title}
        </div>
        {year && <div className="text-xs text-white/75 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">{year}</div>}
      </div>
    </div>
  )
}

// === Verdict controls =====================================================
// Three word-led editorial controls (Okay / Liked / Loved) — the primary,
// tap-first interaction. Equal footprint for mobile stability; Loved is the
// gentle apex via tone / weight / elevation, not size. `dragHint` highlights the
// matching control while the optional swipe is mid-gesture; aria-pressed marks
// the committed verdict.
function SentimentRow({ active, dragHint, onRate, reduced }) {
  return (
    <div className="grid w-full grid-cols-3 gap-2 sm:gap-3">
      {SENTIMENTS.map((s) => {
        const on = active === s.key || dragHint === s.key
        const apex = s.key === 'loved'
        return (
          <motion.button
            key={s.key}
            type="button"
            onClick={() => onRate(s.key)}
            aria-pressed={active === s.key}
            aria-label={s.label}
            whileTap={reduced ? undefined : { scale: 0.97 }}
            animate={dragHint === s.key ? { scale: 1.03 } : { scale: 1 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={`min-h-[48px] rounded-xl px-2 text-center text-sm tracking-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
              apex ? 'font-semibold text-white' : `font-medium ${on ? 'text-white' : 'text-white/75'}`
            }`}
            style={{
              background: on ? `rgba(${s.rgb}, ${apex ? 0.22 : 0.16})` : `rgba(${s.rgb}, ${apex ? 0.1 : 0.05})`,
              border: `1px solid rgba(${s.rgb}, ${on ? (apex ? 0.75 : 0.55) : (apex ? 0.4 : 0.2)})`,
              boxShadow: apex
                ? (on ? `0 10px 26px rgba(${s.rgb}, 0.3)` : `0 6px 16px rgba(${s.rgb}, 0.18)`)
                : 'none',
            }}
          >
            {s.label}
          </motion.button>
        )
      })}
    </div>
  )
}
