// src/features/onboarding-v2/steps/RatingStepV2.jsx
// One card at a time, auto-advance after rating, "all done" celebration.
// Apple Music × Tinder × Letterboxd feel — single film in focus, three big
// sentiment buttons, swipe-y card entrance.

import { useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronLeft, Sparkles } from 'lucide-react'

import { tmdbImg } from '@/shared/api/tmdb'
import Button from '@/shared/ui/Button'
import { SENTIMENT_RATINGS } from '@/features/onboarding-v2/data'

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

export default function RatingStepV2({ favoriteMovies, ratings, onRate, onBack, onFinish, loading, error }) {
  const reduced = useReducedMotion()
  const films = useMemo(() => favoriteMovies ?? [], [favoriteMovies])
  const [idx, setIdx] = useState(0)
  const allRated = idx >= films.length
  const current = films[idx]
  const remaining = Math.max(0, films.length - idx)
  const ratedCount = Object.keys(ratings).length

  const handleRate = (sentiment) => {
    if (!current) return
    onRate(current, sentiment)
    // Auto-advance — short pause so the user sees their choice register.
    window.setTimeout(() => setIdx((i) => Math.min(i + 1, films.length)), ADVANCE_DELAY_MS)
  }

  const handleSkip = () => setIdx((i) => Math.min(i + 1, films.length))

  return (
    <div className="flex h-full flex-col">
      <div className="flex-none px-6 pb-4 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/70"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-purple-400/85">
          Rate · 4 of 4 · {allRated ? 'all done' : `${remaining} to go`}
        </p>
        <h2 className="ob-display text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl">
          {allRated ? (
            <>
              Nice — all{' '}
              <em className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text not-italic italic text-transparent">
                rated.
              </em>
            </>
          ) : (
            <>
              How did this one{' '}
              <em className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text not-italic italic text-transparent">
                land?
              </em>
            </>
          )}
        </h2>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-white/55">
          {allRated
            ? 'Tap the button below to lock it in and head home.'
            : "Tap one. We'll move on automatically."}
        </p>
      </div>

      <div className="ob-scroll min-h-0 flex-1 overflow-y-auto px-6 pb-4">
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mx-auto w-full max-w-md">
          <AnimatePresence mode="wait" initial={false}>
            {allRated ? (
              <motion.div
                key="celebrate"
                initial={reduced ? false : { opacity: 0, scale: 0.96, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="grid place-items-center py-10 text-center"
              >
                <Sparkles className="mb-3 h-12 w-12 text-purple-400" aria-hidden="true" />
                <p className="text-sm text-white/60">
                  {ratedCount} rated. Calibration locked.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={current.id}
                initial={reduced ? false : { opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <FilmCard movie={current} />
                <SentimentRow
                  active={ratingToSentiment(ratings[current.id])}
                  onRate={handleRate}
                  reduced={reduced}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-none border-t border-white/[0.06] px-6 pb-8 pt-4">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
          {allRated ? (
            <Button
              variant="primary"
              size="lg"
              onClick={onFinish}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Building your profile…' : 'Take me home →'}
            </Button>
          ) : (
            <button
              type="button"
              onClick={handleSkip}
              className="rounded-full px-5 py-2 text-sm font-medium text-white/55 transition-colors hover:text-white/85"
            >
              Skip this one →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// === Film card ============================================================
function FilmCard({ movie }) {
  const [loaded, setLoaded] = useState(false)
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)]" style={{ aspectRatio: '5 / 4' }}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-white/[0.04]" />}
      <img
        src={tmdbImg(movie.backdrop_path || movie.poster_path, 'w780')}
        alt=""
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`block h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/85" />
      <div className="absolute inset-x-5 bottom-4">
        <div className="ob-display text-2xl font-extrabold tracking-tight text-white">
          {movie.title}
        </div>
        {year && <div className="text-xs text-white/65">{year}</div>}
      </div>
    </div>
  )
}

// === Sentiment buttons ====================================================
function SentimentRow({ active, onRate, reduced }) {
  return (
    <>
      <div className="mt-5 flex items-center justify-center gap-4">
        {SENTIMENTS.map((s) => {
          const on = active === s.key
          return (
            <motion.button
              key={s.key}
              type="button"
              onClick={() => onRate(s.key)}
              aria-pressed={on}
              aria-label={s.label}
              whileTap={reduced ? undefined : { scale: 0.92 }}
              className="grid h-16 w-16 place-items-center rounded-full text-2xl text-white transition-shadow"
              style={{
                // WHY: per-sentiment tint is data-driven (rgb triplet → rgba shades).
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
            className="w-16 text-center text-[11px] font-semibold text-white/55"
          >
            {s.label}
          </span>
        ))}
      </div>
    </>
  )
}
