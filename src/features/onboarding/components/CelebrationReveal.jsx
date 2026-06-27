import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { tmdbImg } from '@/shared/api/tmdb'
import { MOODS } from '../data'
import AmbientGlow from './AmbientGlow'

// One concise completion sentence for the dedicated sr-only live region — folds
// in an aggregate film reference when titles exist, never a long poster list or
// a count tally. (Visible stages are NOT a live region; this is the only one.)
function buildAnnouncement(titles) {
  if (titles.length === 0) return 'Your taste is tuned. Opening your first picks.'
  if (titles.length === 1) return `Your taste is tuned with ${titles[0]}. Opening your first picks.`
  if (titles.length === 2) return `Your taste is tuned with ${titles[0]} and ${titles[1]}. Opening your first picks.`
  return `Your taste is tuned with ${titles[0]}, ${titles[1]}, and more. Opening your first picks.`
}

// One honest, sentence-case taste line built from the captured signals — no count
// receipt, no percentages, no inference, no dashboard vocabulary. Degrades
// gracefully when optional data is sparse (no broken punctuation).
function buildTasteLine({ hasMoods, hasGenres, hasRatings, hasFilms }) {
  const parts = []
  if (hasMoods) parts.push('your moods')
  if (hasGenres) parts.push('your genres')
  if (hasRatings) parts.push('how those films landed')
  else if (hasFilms) parts.push('the films you chose')
  if (parts.length === 0) return 'Your first signals are in.'
  const list = parts.length === 1
    ? parts[0]
    : `${parts.slice(0, -1).join(', ')}${parts.length > 2 ? ',' : ''} and ${parts[parts.length - 1]}`
  return `Your first signals are in — ${list}.`
}

// === Celebration reveal ====================================================
// The final onboarding surface + ~12s write-cover before /discover. A calm,
// personal editorial reveal — mood atmosphere → your mood pills → a taste line →
// your poster mosaic → "Tonight is yours." → one coaching beat. NO infinite
// motion: every entrance resolves once and then settles. AmbientGlow + static
// grain are the only ambient layers. The frozen 12s hold + 900ms fade-out are
// owned upstream by Onboarding.jsx; this component only reads `fadingOut`.
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
// Settles ~7s, then holds for ~5s reading time until the upstream fade at ~12s.
const EASE = [0.16, 1, 0.3, 1]                          // quartOut — long settle, no overshoot
const SPRING = { type: 'spring', stiffness: 70, damping: 18, mass: 0.9 }

export default function CelebrationReveal({ moods, selectedGenres, favoriteMovies, ratings, fadingOut = false }) {
  const reduced = useReducedMotion()

  // Selected mood objects (RGB triplets, labels).
  const selectedMoods = (moods || [])
    .map(key => MOODS.find(m => m.key === key))
    .filter(Boolean)

  // Posters from their picks (truncate to 5 even if more exist).
  const posterFilms = (favoriteMovies || []).slice(0, 5)

  // Honest taste line from the captured signals (no counts).
  const tasteLine = buildTasteLine({
    hasMoods: selectedMoods.length > 0,
    hasGenres: (selectedGenres || []).length > 0,
    hasRatings: Object.keys(ratings || {}).length > 0,
    hasFilms: (favoriteMovies || []).length > 0,
  })

  // Single, concise completion announcement. Empty on first render, then set
  // ONCE after mount so assistive tech hears a real content change ("" → text)
  // rather than reading the visible multi-stage choreography piece by piece.
  const announcementText = buildAnnouncement(
    posterFilms.map(f => f.title).filter(Boolean)
  )
  const [announcement, setAnnouncement] = useState('')
  useEffect(() => {
    setAnnouncement(announcementText)
  }, [announcementText])

  return (
    <div className="onboarding fixed inset-0 z-9999 overflow-x-hidden overflow-y-auto bg-black">
      {/* The ONLY live region — one concise polite+atomic completion status. */}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      {/* Slow, deep ambient glow — mood-tinted. The sole ambient layer. */}
      <AmbientGlow moods={moods} />

      {/* Soft grain (very subtle, helps the void feel like a screen) — static. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
          backgroundSize: '4px 4px',
        }}
      />

      {/* Content — settled (no breathing loop). When fadingOut, the whole stage
         tweens to opacity 0 over 900ms (hard-matched to Onboarding.jsx's fade
         wait); the black backdrop stays so the screen calmly goes dark before
         navigate fires. Scroll-safe on short viewports (no horizontal scroll). */}
      <motion.div
        className="ff-cel-content relative z-10 mx-auto flex min-h-full w-full max-w-2xl flex-col items-center justify-center px-6 text-center"
        initial={false}
        animate={{ opacity: fadingOut ? 0 : 1 }}
        transition={{ duration: fadingOut ? 0.9 : 0, ease: EASE }}
      >
        {/* Kicker — quiet editorial eyebrow (replaces the old icon + edition mark) */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 0.9, y: 0 }}
          transition={{ duration: reduced ? 0.4 : 0.9, delay: reduced ? 0 : 0.4, ease: EASE }}
          className="ob-eyebrow inline-flex items-center text-[var(--color-brand-accent-text,#ed7a87)]"
        >
          <span
            aria-hidden="true"
            className="mr-2.5 inline-block h-px w-5 align-middle"
            style={{ background: 'rgba(229,99,111,0.5)' }}
          />
          Your taste, tuned
        </motion.p>

        {/* Mood pills — settle once, no breathing loop */}
        {selectedMoods.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { delayChildren: reduced ? 0 : 1.1, staggerChildren: reduced ? 0 : 0.22 } } }}
            className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:mt-9 sm:gap-3"
          >
            {selectedMoods.map((m) => (
              <motion.span
                key={m.key}
                variants={{
                  hidden: { opacity: 0, y: 14, scale: 0.85 },
                  visible: { opacity: 1, y: 0, scale: 1 },
                }}
                transition={reduced ? { duration: 0.4, ease: EASE } : SPRING}
                className="ob-display rounded-full px-4 py-2 text-[13px] font-semibold tracking-[0.04em] text-white sm:px-5 sm:text-[14px]"
                style={{
                  background: `rgba(${m.rgb}, 0.18)`,
                  border: `1px solid rgba(${m.rgb}, 0.55)`,
                  boxShadow: `0 0 22px rgba(${m.rgb}, 0.30), inset 0 0 0 1px rgba(${m.rgb}, 0.1)`,
                }}
              >
                {m.label}
              </motion.span>
            ))}
          </motion.div>
        )}

        {/* Taste line — one honest sentence (replaces the count receipt) */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 0.72, y: 0 }}
          transition={{ duration: reduced ? 0.4 : 0.9, delay: reduced ? 0 : 2.0, ease: EASE }}
          className="mt-5 max-w-md text-[13px] leading-relaxed tracking-[0.01em] text-white/65 sm:mt-6 sm:text-sm"
          style={{ textWrap: 'pretty' }}
        >
          {tasteLine}
        </motion.p>

        {/* Poster mosaic — the celebration's main visual payoff. Each poster
           lands once and stays still (no float, no heart badge). */}
        {posterFilms.length > 0 && (
          <div className="mt-7 w-full sm:mt-10">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.55, y: 0 }}
              transition={{ duration: reduced ? 0.4 : 0.9, delay: reduced ? 0 : 2.6, ease: EASE }}
              className="mb-4 text-[12px] tracking-[0.02em] text-white/55 sm:mb-5"
            >
              From your picks
            </motion.p>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { delayChildren: reduced ? 0 : 3.0, staggerChildren: reduced ? 0 : 0.18 } } }}
              className="flex items-end justify-center gap-2 sm:gap-3.5"
            >
              {posterFilms.map((film, i) => {
                // Subtle hand-laid-out rotation, fanned around centre.
                const rotate = (i - (posterFilms.length - 1) / 2) * 3.2
                return (
                  <motion.div
                    key={film.id}
                    variants={{
                      hidden: { opacity: 0, y: 36, scale: 0.85, rotate: rotate * 0.4 },
                      visible: { opacity: 1, y: 0, scale: 1, rotate },
                    }}
                    transition={reduced ? { duration: 0.4, ease: EASE } : { ...SPRING, stiffness: 60, damping: 16 }}
                    className="ff-cel-poster relative h-[78px] w-[52px] flex-none overflow-hidden rounded-xl shadow-[0_12px_28px_rgba(0,0,0,0.55)] ring-1 ring-white/10 sm:h-36 sm:w-24"
                    style={{ originY: 1 }}
                  >
                    {film.poster_path ? (
                      <img
                        src={tmdbImg(film.poster_path, 'w185')}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-white/4 px-1 text-center text-[10px] leading-tight text-white/40">
                        {film.title?.slice(0, 14) ?? ''}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
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

        {/* Coaching — the lead-out beat, accurate to what /discover opens with
           (re-asks the night's mood, then reveals one cased pick). No Mark
           Watched / next-day-cadence promise. Held for reading time before fade. */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.5 : 1.4, delay: reduced ? 0 : 6.3, ease: EASE }}
          className="mt-8 max-w-[460px] sm:mt-10"
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
            Tell us how tonight feels. A few quick questions, then one film for your night &mdash; with the case for why it fits.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
