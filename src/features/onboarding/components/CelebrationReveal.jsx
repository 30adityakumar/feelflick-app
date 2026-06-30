import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

import { tmdbImg } from '@/shared/api/tmdb'
import { MOODS } from '../data'

function buildAnnouncement(titles) {
  if (titles.length === 0) return 'Your taste is tuned. Opening your first picks.'
  if (titles.length === 1) return `Your taste is tuned with ${titles[0]}. Opening your first picks.`
  if (titles.length === 2) return `Your taste is tuned with ${titles[0]} and ${titles[1]}. Opening your first picks.`
  return `Your taste is tuned with ${titles[0]}, ${titles[1]}, and more. Opening your first picks.`
}

function buildTasteLine({ moods, genres, ratings, films }) {
  const parts = []
  if (moods.length) parts.push('your moods')
  if (genres.length) parts.push('your genres')
  if (Object.keys(ratings).length) parts.push('how those films landed')
  else if (films.length) parts.push('the films you chose')
  if (!parts.length) return 'Your first signals are in.'
  const list = parts.length === 1
    ? parts[0]
    : `${parts.slice(0, -1).join(', ')}${parts.length > 2 ? ',' : ''} and ${parts.at(-1)}`
  return `Your first signals are in — ${list}.`
}

// === Celebration reveal ====================================================
// The final onboarding surface — a write-cover before /home. A calm, personal
// editorial reveal — mood atmosphere → your mood pills → a taste line → your
// poster mosaic → "Tonight is yours." → one coaching beat. NO infinite motion:
// every entrance resolves once and then settles. AmbientGlow + static grain are
// the only ambient layers.
//
// Timing is owned upstream by Onboarding.jsx: it holds for an ADAPTIVE floor
// (max(floor, setup work); floor 8s, 2s under reduced motion) — not a fixed clock
// — then runs the 900ms fade-out via `fadingOut`. This component also reads
// `ready`/`onEnter` to render the optional "See your picks" skip once setup
// resolves, so the user can leave before the floor.
//
// Internal stage timeline (NORMAL motion, seconds from mount; every delay
// collapses to 0 under prefers-reduced-motion, F2.20):
//   0.4  "Your taste, tuned" kicker
//   1.1  mood pills (stagger)
//   2.0  taste line
//   2.6  poster caption
//   3.0  poster mosaic (stagger)
//   4.9  "Tonight is yours."
//   6.3  coaching beat ("Next up")
// Settles ~7.7s.
const EASE = [0.16, 1, 0.3, 1]                          // quartOut — long settle, no overshoot

export default function CelebrationReveal({ moods, selectedGenres, favoriteMovies, ratings, fadingOut = false, ready = false, onEnter = () => {} }) {
  const reduced = useReducedMotion()
  const selectedMoods = moods.map(key => MOODS.find(mood => mood.key === key)).filter(Boolean)
  const posterFilms = favoriteMovies.slice(0, 5)
  const tasteLine = buildTasteLine({ moods, genres: selectedGenres, ratings, films: posterFilms })
  const announcementText = buildAnnouncement(posterFilms.map(film => film.title).filter(Boolean))
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => setAnnouncement(announcementText), [announcementText])

  return (
    <div className="onboarding ob-celebration-root">
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
      <div aria-hidden="true" className="ob-celebration-atmosphere" />
      <div aria-hidden="true" className="ob-grain" />

      <motion.div
        className="ob-celebration-content"
        initial={false}
        animate={{ opacity: fadingOut ? 0 : 1 }}
        transition={{ duration: fadingOut ? 0.9 : 0, ease: EASE }}
      >
        <motion.p
          className="ob-eyebrow inline-flex items-center text-[var(--color-brand-accent-text,#ed7a87)]"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 0.9, y: 0 }}
          transition={{ duration: reduced ? 0.4 : 0.9, delay: reduced ? 0 : 0.4, ease: EASE }}
        >
          <span
            aria-hidden="true"
            className="mr-2.5 inline-block h-px w-5 align-middle"
            style={{ background: 'rgba(229,99,111,0.5)' }}
          />
          Your taste, tuned
        </motion.p>

        {selectedMoods.length > 0 && (
          <motion.div className="ob-celebration-moods" initial="hidden" animate="visible" variants={{ visible: { transition: { delayChildren: reduced ? 0 : 0.55, staggerChildren: reduced ? 0 : 0.1 } } }}>
            {selectedMoods.map(mood => (
              <motion.span key={mood.key} style={{ '--mood-rgb': mood.rgb }} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
                {mood.label}
              </motion.span>
            ))}
          </motion.div>
        )}

        <motion.p className="ob-celebration-taste-line" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: reduced ? 0 : 0.9, ease: EASE }}>
          {tasteLine}
        </motion.p>

        {posterFilms.length > 0 && (
          <div className="ob-celebration-picks">
            <p>From your picks</p>
            <div className="ob-celebration-posters">
              {posterFilms.map((film, index) => (
                <motion.div key={film.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, rotate: (index - 2) * 2.5 }} transition={{ duration: 0.5, delay: reduced ? 0 : 1.05 + index * 0.08, ease: EASE }}>
                  {film.poster_path ? <img src={tmdbImg(film.poster_path, 'w185')} alt="" loading="lazy" /> : <span>{film.title?.slice(0, 14) ?? ''}</span>}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Editorial apex — the sole h1, kept verbatim */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.5 : 1.2, delay: reduced ? 0 : 4.9, ease: EASE }}
          className="mt-9 sm:mt-12"
        >
          <h1
            className="ob-display text-4xl font-normal leading-[1.05] text-white sm:text-5xl md:text-6xl"
            style={{ textWrap: 'balance', letterSpacing: '-0.02em' }}
          >
            Tonight is{' '}
            <em className="italic text-[var(--color-brand-accent-text,#ed7a87)]">
              yours.
            </em>
          </h1>
        </motion.div>

        {/* Coaching — the lead-out beat, accurate to what /home opens with
           (your personalized picks for tonight, seeded by the onboarding signals).
           No watch-logging or next-day-cadence promise. Held for reading time before fade. */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: reduced ? 0 : 2.25, ease: EASE }}
        >
          <p className="ob-eyebrow inline-flex items-center text-[var(--color-brand-accent-text,#ed7a87)]">
            <span
              aria-hidden="true"
              className="mr-2.5 inline-block h-px w-5 align-middle"
              style={{ background: 'rgba(229,99,111,0.5)' }}
            />
            Next up
          </p>
          <p
            className="mt-4 text-[14px] leading-[1.6] text-white/72 sm:mt-5 sm:text-[15px]"
            style={{ textWrap: 'pretty' }}
          >
            Your taste is in. Up next, your picks for tonight &mdash; shaped by everything you just shared.
          </p>
        </motion.div>

        {/* Skip / enter — appears once setup is ready (writes + home prefetch done), so the
           user can leave for /home immediately instead of waiting out the reveal. If they
           don't, Onboarding auto-advances at the floor. */}
        {ready && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.3 : 0.6, ease: EASE }}
            className="mt-9 sm:mt-11"
          >
            <button
              type="button"
              onClick={onEnter}
              className="ob-focus inline-flex items-center gap-2 rounded-xl border border-transparent bg-[var(--color-action-primary-fill,#f0ece4)] px-6 h-11 text-sm font-semibold text-[var(--color-action-primary-text,#0f1010)] transition-opacity duration-200 hover:opacity-90"
            >
              See your picks
              <span aria-hidden="true">&rarr;</span>
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
