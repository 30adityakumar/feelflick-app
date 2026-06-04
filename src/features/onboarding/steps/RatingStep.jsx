// src/features/onboarding/steps/RatingStep.jsx
// Tinder-style swipeable card: drag right = Loved, left = Meh, up = Liked.
// Buttons remain as accessible fallback. Counter syncs immediately on commit;
// the next card peeks behind the current one for stack depth.

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

// Order matches the prototype: Meh → Liked → Loved (left to right, ramping up).
// Keys must match SENTIMENT_RATINGS in the legacy module.
const SENTIMENTS = [
  { key: 'okay',  label: 'Meh',   symbol: '✕', tint: '120, 120, 130' },
  { key: 'liked', label: 'Liked', symbol: '✓', tint: '168, 85, 247' },
  { key: 'loved', label: 'Loved', symbol: '♥', tint: '236, 72, 153' },
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

  return (
    <div className="flex h-full flex-col">
      <div className="flex-none px-5 pb-3 pt-5 sm:px-6 sm:pb-4 sm:pt-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-3 flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/70 sm:mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-purple-400/85 sm:mb-3">
          Rate · 4 of 4 · {allRated ? 'all done' : `${remaining} to go`}
        </p>
        <h2
          className="ob-display text-[30px] font-normal leading-[1.05] text-white sm:text-4xl md:text-5xl"
          style={{ textWrap: 'balance' }}
        >
          {allRated ? (
            <>
              Nice — all{' '}
              <em className="bg-linear-to-r from-purple-500 to-pink-500 bg-clip-text italic text-transparent">
                rated.
              </em>
            </>
          ) : (
            <>
              How did this one{' '}
              <em className="bg-linear-to-r from-purple-500 to-pink-500 bg-clip-text italic text-transparent">
                land?
              </em>
            </>
          )}
        </h2>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-white/55 sm:mt-3 sm:text-sm md:text-[15px]">
          {allRated
            ? 'That’s all of them. Building your first picks…'
            : reduced
              ? "Tap one. We'll move on automatically."
              : 'Swipe right to love, left to pass, up to like. Or tap.'}
        </p>
      </div>

      {/* Card area — shrinks if viewport is short so the SentimentRow below
         stays in view. No inner overflow container (previous version clipped
         the sentiment buttons on phones + tablets). */}
      <div className="min-h-0 flex-1 px-5 pb-2 sm:px-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mx-auto flex h-full w-full max-w-md items-center justify-center">
          <div className="relative h-full max-h-full aspect-2/3">
            {/* Background card peek — next film sits behind the current one
               for stack depth (Tinder convention). Static / non-interactive.
               Skipped when on the last card or when all rated. */}
            {!allRated && films[idx + 1] && (
              <div
                key={`bg-${films[idx + 1].id}`}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  transform: 'translateY(10px) scale(0.94)',
                  opacity: 0.45,
                  transformOrigin: 'center top',
                }}
              >
                <FilmCard movie={films[idx + 1]} />
              </div>
            )}

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
                  <Sparkles className="h-10 w-10 text-purple-400/70 animate-pulse" aria-hidden="true" />
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
              className="rounded-full px-5 py-2 text-sm font-medium text-white/55 transition-colors hover:text-white/85"
            >
              Skip this one →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// === Swipeable film card ==================================================
// Wraps FilmCard in a draggable motion.div. Tracks x/y motion values to
// animate rotation, fade in directional "stamps" (MEH/LIKED/LOVED), and
// commit a rating when the drag passes SWIPE_THRESHOLD in any direction.
//
// Mapping (Step 3 already framed these films as "loved"):
//   swipe right → 'loved'
//   swipe up    → 'liked'
//   swipe left  → 'okay'
//
// Calls `onDragHintChange` whenever the drag direction crosses a threshold
// (in/out of right / left / up zones) so the parent can highlight the
// matching sentiment button.
function SwipeableFilmCard({ movie, reduced, exitDirection, onSwipe, onDragHintChange }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  // Mild rotation in the swipe direction — Tinder signature feel.
  const rotate = useTransform(x, [-260, 260], [-14, 14])

  // Directional stamp opacities — fade in as the drag passes ~40px in that
  // direction, fully visible by SWIPE_THRESHOLD-ish.
  const mehOpacity = useTransform(x, [-130, -40], [1, 0])
  const lovedOpacity = useTransform(x, [40, 130], [0, 1])  // right
  const likedOpacity = useTransform(y, [-130, -40], [1, 0]) // up

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

      {/* Directional stamps — appear over the poster as the user drags. */}
      <Stamp opacity={mehOpacity}   position="top-left"      rotate="-rotate-12" borderClass="border-white/60"    textClass="text-white/85"    label="Meh" />
      <Stamp opacity={lovedOpacity} position="top-right"     rotate="rotate-12"  borderClass="border-pink-400"    textClass="text-pink-300"    label="Loved" />
      <Stamp opacity={likedOpacity} position="bottom-center" rotate=""           borderClass="border-purple-400"  textClass="text-purple-300"  label="Liked" />
    </motion.div>
  )
}

function Stamp({ opacity, position, rotate, borderClass, textClass, label }) {
  const positionClass =
    position === 'top-left' ? 'top-5 left-5' :
    position === 'top-right' ? 'top-5 right-5' :
    'bottom-5 left-1/2 -translate-x-1/2'
  return (
    <motion.div
      style={{ opacity }}
      aria-hidden="true"
      className={`pointer-events-none absolute ${positionClass} px-3 py-1.5 rounded-md border-[3px] ${borderClass} ${textClass} font-extrabold text-sm uppercase tracking-[0.18em] ${rotate} bg-black/40 backdrop-blur-sm`}
    >
      {label}
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
      {!loaded && <div className="absolute inset-0 animate-pulse bg-white/4" />}
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
        <div className="ob-display text-xl font-semibold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] sm:text-2xl">
          {movie.title}
        </div>
        {year && <div className="text-xs text-white/75 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">{year}</div>}
      </div>
    </div>
  )
}

// === Sentiment buttons ====================================================
// Buttons mirror the swipe gestures and stay accessible as a tap fallback.
// `dragHint` lets the matching button glow while the user is mid-drag so the
// visual response is unified across both input modes.
function SentimentRow({ active, dragHint, onRate, reduced }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center gap-4">
        {SENTIMENTS.map((s) => {
          const on = active === s.key || dragHint === s.key
          return (
            <motion.button
              key={s.key}
              type="button"
              onClick={() => onRate(s.key)}
              aria-pressed={active === s.key}
              aria-label={s.label}
              whileTap={reduced ? undefined : { scale: 0.92 }}
              animate={dragHint === s.key ? { scale: 1.08 } : { scale: 1 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="grid h-16 w-16 place-items-center rounded-full text-2xl text-white transition-shadow"
              style={{
                background: on ? `rgba(${s.tint}, 0.32)` : `rgba(${s.tint}, 0.12)`,
                border: `1.5px solid rgba(${s.tint}, ${on ? 0.85 : 0.5})`,
                boxShadow: on
                  ? `0 12px 28px rgba(${s.tint}, 0.35)`
                  : `0 8px 20px rgba(${s.tint}, 0.18)`,
              }}
            >
              <span aria-hidden="true">{s.symbol}</span>
            </motion.button>
          )
        })}
      </div>
      <div className="mt-2 flex items-center justify-center gap-4">
        {SENTIMENTS.map((s) => (
          <span
            key={s.key}
            className={`w-16 text-center text-[11px] font-semibold transition-colors ${
              dragHint === s.key ? 'text-white' : 'text-white/55'
            }`}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}
