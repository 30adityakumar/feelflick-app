import { motion, useReducedMotion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { tmdbImg } from '@/shared/api/tmdb'
import { MOODS, GENRES, SENTIMENT_RATINGS } from '../data'
import AmbientGlow from './AmbientGlow'

// === Celebration reveal ====================================================
// Multi-stage immersive reveal that plays after the last rating commits.
// Designed for calm: gentle easeOut curves, generous overlap between stages,
// spring physics on the entrances, subtle breathing motion on landed elements.
// Sentence-case body text + restraint on all-caps for dyslexic readers.
// AmbientGlow inherits the user's mood picks so the palette is personal.
//
// Stages (timeline in seconds from mount; durations overlap by design):
//   0.0  Sparkles icon eases in + slow rotation
//   0.4  Brand wordmark fades up — small, warm
//   1.2  Mood pills spring in (stagger)
//   2.4  Stats line eases in
//   3.4  Poster mosaic — gentle cascade with spring landing
//   5.5  "Tonight is yours." editorial close
//   7.6  Coaching beat — cold-start expectation-setting + Mark Watched hint
//        (Stage 5; held until fade-out at ~12s so it has reading time before
//         /discover takes over — also smooths the transition seam.)
//
// `prefers-reduced-motion` users get a static-but-staggered version:
// elements still fade in (no movement) and particles are suppressed.
const EASE = [0.16, 1, 0.3, 1]                          // quartOut — long settle, no overshoot
const SPRING = { type: 'spring', stiffness: 70, damping: 18, mass: 0.9 }

export default function CelebrationReveal({ moods, selectedGenres, favoriteMovies, ratings, fadingOut = false }) {
  const reduced = useReducedMotion()

  // Selected mood objects (RGB triplets, labels).
  const selectedMoods = (moods || [])
    .map(key => MOODS.find(m => m.key === key))
    .filter(Boolean)

  // Genre labels in the user's selected order.
  const selectedGenreLabels = (selectedGenres || [])
    .map(id => GENRES.find(g => g.id === id)?.name)
    .filter(Boolean)

  // Sentiment breakdown (loved/liked counts).
  const ratingValues = Object.values(ratings || {})
  const lovedCount = ratingValues.filter(r => r === SENTIMENT_RATINGS.loved).length
  const likedCount = ratingValues.filter(r => r === SENTIMENT_RATINGS.liked).length
  const filmCount  = (favoriteMovies || []).length

  // Posters from their picks (truncate to 5 even if more exist).
  const posterFilms = (favoriteMovies || []).slice(0, 5)

  return (
    <div className="onboarding fixed inset-0 z-9999 flex flex-col items-center justify-center bg-black overflow-hidden">
      {/* Slow, deep ambient glow — mood-tinted */}
      <AmbientGlow moods={moods} />

      {/* Soft grain (very subtle, helps the void feel like a screen) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
          backgroundSize: '4px 4px',
        }}
      />

      {/* Drifting particles — suppressed for reduced-motion. Also fades to 0
         alongside the main content during fade-out, so they don't pop. */}
      {!reduced && (
        <motion.div
          className="absolute inset-0 z-0"
          aria-hidden="true"
          initial={false}
          animate={{ opacity: fadingOut ? 0 : 1 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <CelebrationParticles moods={selectedMoods} />
        </motion.div>
      )}

      {/* Background "breathing" — slow scale on the whole stage. Gentle enough
         to feel like ambient life, not motion. Skipped for reduced-motion.
         When fadingOut, the entire content tweens to opacity 0 over 900ms;
         the black backdrop stays so the screen calmly goes dark before
         navigate fires (/discover's own overlay then fades up over 1.4s to
         reveal the page). Read together, ~2.3s of cinematic darkness. */}
      <motion.div
        className="relative z-10 flex w-full max-w-2xl flex-col items-center px-6 text-center"
        role="status"
        aria-live="polite"
        initial={false}
        animate={
          fadingOut
            ? { opacity: 0, scale: 1 }
            : reduced
              ? { opacity: 1 }
              : { opacity: 1, scale: [1, 1.012, 1] }
        }
        transition={
          fadingOut
            ? { duration: 0.9, ease: EASE }
            : reduced
              ? { duration: 0 }
              : { duration: 8, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        {/* Sparkles + kicker — Stage 0 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduced ? 0.4 : 1.0, ease: EASE }}
          className="flex flex-col items-center"
        >
          {/* Slow rotation + breath on the sparkles */}
          <motion.div
            animate={reduced ? undefined : { rotate: 360 }}
            transition={reduced ? undefined : { duration: 22, repeat: Infinity, ease: 'linear' }}
          >
            <motion.div
              animate={reduced ? undefined : { scale: [1, 1.08, 1] }}
              transition={reduced ? undefined : { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="h-10 w-10" style={{ color: 'rgb(192, 132, 252)' }} aria-hidden="true" />
            </motion.div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 0.85, y: 0 }}
            transition={{ duration: reduced ? 0.4 : 0.9, delay: 0.4, ease: EASE }}
            className="ob-display mt-6 text-[11px] font-semibold uppercase tracking-[0.32em] text-purple-200/85"
          >
            Profile tuned · Edition №001
          </motion.p>
        </motion.div>

        {/* Mood pills — Stage 1, spring in with stagger */}
        {selectedMoods.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { delayChildren: 1.2, staggerChildren: 0.22 } } }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            {selectedMoods.map((m) => (
              <motion.span
                key={m.key}
                variants={{
                  hidden: { opacity: 0, y: 14, scale: 0.85 },
                  visible: { opacity: 1, y: 0, scale: 1 },
                }}
                transition={reduced ? { duration: 0.4, ease: EASE } : SPRING}
                className="ob-display rounded-full px-5 py-2 text-[14px] font-semibold tracking-[0.04em] text-white"
                style={{
                  background: `rgba(${m.rgb}, 0.18)`,
                  border: `1px solid rgba(${m.rgb}, 0.55)`,
                  boxShadow: `0 0 22px rgba(${m.rgb}, 0.30), inset 0 0 0 1px rgba(${m.rgb}, 0.1)`,
                }}
              >
                {/* Breathing tint — very subtle pulse keeps the pill alive */}
                <motion.span
                  className="block"
                  animate={reduced ? undefined : { opacity: [1, 0.78, 1] }}
                  transition={reduced ? undefined : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {m.label}
                </motion.span>
              </motion.span>
            ))}
          </motion.div>
        )}

        {/* Stats line — Stage 2 — sentence case, easier to read */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 0.72, y: 0 }}
          transition={{ duration: reduced ? 0.4 : 0.9, delay: 2.4, ease: EASE }}
          className="mt-6 text-[13px] tracking-[0.02em] text-white/65"
        >
          {filmCount} film{filmCount === 1 ? '' : 's'}
          {selectedGenreLabels.length > 0 && ` · ${selectedGenreLabels.length} genre${selectedGenreLabels.length === 1 ? '' : 's'}`}
          {lovedCount > 0 && ` · ${lovedCount} loved`}
          {likedCount > 0 && ` · ${likedCount} liked`}
        </motion.p>

        {/* Poster mosaic — Stage 3, spring landing with gentle float */}
        {posterFilms.length > 0 && (
          <div className="mt-10 w-full">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.55, y: 0 }}
              transition={{ duration: reduced ? 0.4 : 0.9, delay: 3.0, ease: EASE }}
              className="mb-5 text-[12px] tracking-[0.02em] text-white/55"
            >
              From the films you’ve loved
            </motion.p>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { delayChildren: 3.4, staggerChildren: 0.18 } } }}
              className="flex items-end justify-center gap-2.5 sm:gap-3.5"
            >
              {posterFilms.map((film, i) => {
                const rating = ratings?.[film.id]
                const wasLoved = rating === SENTIMENT_RATINGS.loved
                // Slight rotation per poster — gives a hand-laid-out feel.
                const rotate = (i - (posterFilms.length - 1) / 2) * 3.2
                return (
                  <motion.div
                    key={film.id}
                    variants={{
                      hidden: { opacity: 0, y: 36, scale: 0.85, rotate: rotate * 0.4 },
                      visible: { opacity: 1, y: 0, scale: 1, rotate },
                    }}
                    transition={reduced ? { duration: 0.4, ease: EASE } : { ...SPRING, stiffness: 60, damping: 16 }}
                    className="relative h-28 w-[68px] flex-none overflow-hidden rounded-xl shadow-[0_12px_28px_rgba(0,0,0,0.55)] ring-1 ring-white/10 sm:h-36 sm:w-24"
                    style={{ originY: 1 }}
                  >
                    {/* Gentle float after landing — feels like the posters are breathing */}
                    <motion.div
                      className="h-full w-full"
                      animate={reduced ? undefined : { y: [0, -3, 0] }}
                      transition={reduced ? undefined : {
                        duration: 5 + i * 0.4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 3.4 + i * 0.18 + 0.6,
                      }}
                    >
                      {film.poster_path ? (
                        <img
                          src={tmdbImg(film.poster_path, 'w185')}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-white/4 text-[10px] text-white/40">
                          {film.title?.slice(0, 12) ?? ''}
                        </div>
                      )}
                    </motion.div>
                    {/* Pink heart for loved films — appears after the poster lands */}
                    {wasLoved && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: 3.4 + i * 0.18 + 0.55,
                          duration: reduced ? 0.3 : 0.6,
                          ease: EASE,
                        }}
                        className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-pink-500/95 text-[10px] text-white shadow-[0_0_14px_rgba(236,72,153,0.7)]"
                        aria-hidden="true"
                      >
                        ♥
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        )}

        {/* Editorial close — Stage 4 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.5 : 1.2, delay: 5.5, ease: EASE }}
          className="mt-12"
        >
          <h1
            className="ob-display text-4xl font-normal leading-[1.05] text-white sm:text-5xl md:text-6xl"
            style={{ textWrap: 'balance', letterSpacing: '-0.02em' }}
          >
            Tonight is{' '}
            <em className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text italic text-transparent">
              yours.
            </em>
          </h1>
        </motion.div>

        {/* Coaching — Stage 5. The lead-out beat before /discover takes
           over. Sets cold-start expectations (engine will surface films
           you already know) and frames "Mark Watched" as the corrective
           signal that sharpens future picks. Held for ~4s before
           fade-out so the message has reading time + the seam to
           /discover feels guided rather than abrupt. Replaces the older
           "Opening your first edition…" stage — the coaching IS the
           lead-out now. */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.5 : 1.4, delay: 7.6, ease: EASE }}
          className="mt-10 max-w-[460px]"
        >
          <p className="ob-display text-[10px] font-semibold uppercase tracking-[0.32em] text-purple-200/65">
            <span
              aria-hidden="true"
              className="mr-2 inline-block h-px w-4 align-middle"
              style={{ background: 'rgba(192,132,252,0.55)' }}
            />
            One last thing
          </p>
          <p
            className="mt-5 text-[15px] leading-[1.65] text-white/72"
            style={{ textWrap: 'pretty' }}
          >
            You&rsquo;ll see films you already know &mdash; that&rsquo;s the engine reaching. Tap{' '}
            <em className="not-italic font-semibold text-purple-100">Mark Watched</em>{' '}
            on any you&rsquo;ve seen, and FeelFlick sharpens by tomorrow.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

// === Celebration particles ================================================
// 14 drifting points tinted by the user's selected mood colours. Slow upward
// drift with easeInOut curve — feels like dust in light rather than linear
// flecks. Suppressed entirely for prefers-reduced-motion.
function CelebrationParticles({ moods }) {
  const rgbList = (moods || []).map(m => m.rgb)
  const fallback = ['192, 132, 252', '236, 72, 153']
  const palette = rgbList.length > 0 ? rgbList : fallback
  // Deterministic layout per mount — keys / positions stable from index.
  const points = Array.from({ length: 14 }, (_, i) => ({
    i,
    x: ((i * 73) % 100),
    y: 70 + ((i * 41) % 30),
    size: 2 + (i % 3),
    rgb: palette[i % palette.length],
    duration: 12 + (i % 5) * 2.4,        // 12-21s — much slower than before
    delay: (i * 0.42) % 6,
  }))
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      {points.map(p => (
        <motion.span
          key={p.i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `rgba(${p.rgb}, 0.85)`,
            boxShadow: `0 0 10px rgba(${p.rgb}, 0.6)`,
          }}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 0.7, 0], y: -360 }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
