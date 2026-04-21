// src/features/landing/sections/MoodShowcaseSection.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

// === CONSTANTS ===

const SHOWCASE_MOODS = [
  {
    id: 'nostalgic', emoji: '🌅', label: 'Nostalgic',
    color: '#DEB887',
    description: 'Films that take you back',
    films: [
      { title: 'Amélie',        year: 2001, poster: '/nSxDa3M9aMvGVLoItzWTepQ5h5d.jpg', match: 96 },
      { title: 'La La Land',    year: 2016, poster: '/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg', match: 93 },
      { title: 'Spirited Away', year: 2001, poster: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', match: 91 },
    ],
  },
  {
    id: 'tense', emoji: '⚡', label: 'Tense',
    color: '#6C7BB3',
    description: 'Edge-of-your-seat gripping',
    films: [
      { title: 'Parasite',   year: 2019, poster: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', match: 97 },
      { title: 'Get Out',    year: 2017, poster: '/mE24wUCfjK8AoBBjaMjho7Rczr7.jpg', match: 94 },
      { title: 'Hereditary', year: 2018, poster: '/hjlZSXM86wJrfCv5VKfR5DI2VeU.jpg', match: 92 },
    ],
  },
  {
    id: 'euphoric', emoji: '✨', label: 'Euphoric',
    color: '#FFD93D',
    description: 'Pure joy and wonder',
    films: [
      { title: 'Everything Everywhere', year: 2022, poster: '/u68AjlvlutfEIcpmbYpKcdi09ut.jpg', match: 97 },
      { title: 'La La Land',            year: 2016, poster: '/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg', match: 94 },
      { title: 'Coco',                  year: 2017, poster: '/6Ryitt95xrO8KXuqRGm1fUuNwqF.jpg', match: 91 },
    ],
  },
  {
    id: 'curious', emoji: '🔭', label: 'Curious',
    color: '#4ECDC4',
    description: 'Mind-expanding and thought-provoking',
    films: [
      { title: 'Interstellar',          year: 2014, poster: '/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg', match: 95 },
      { title: "Pan's Labyrinth",       year: 2006, poster: '/z7xXihu5wHuSMWymq5VAulPVuvg.jpg', match: 92 },
      { title: 'Everything Everywhere', year: 2022, poster: '/u68AjlvlutfEIcpmbYpKcdi09ut.jpg', match: 88 },
    ],
  },
]

// Reduced-motion preference — checked once at module load, stable for the session
const prefersReducedMotion = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false

/**
 * Converts a 6-digit hex color to rgba with the given alpha (0–1).
 * @param {string} hex - e.g. '#DEB887'
 * @param {number} alpha - opacity, 0–1
 * @returns {string} CSS rgba() string
 */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// === SUB-COMPONENTS ===

/**
 * Horizontal mood pill selector — single scrolling row, clear active/inactive hierarchy.
 * @param {{ moods: object[], activeId: string|null, onSelect: (id: string) => void }} props
 */
function MoodSelector({ moods, activeId, onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.38, delay: prefersReducedMotion ? 0 : 0.1 }}
      className="mb-4"
    >
      <div
        role="tablist"
        aria-label="Choose a mood"
        className="flex flex-wrap gap-2.5"
      >
        {moods.map((mood) => {
          const isActive = activeId === mood.id
          return (
            <motion.button
              key={mood.id}
              role="tab"
              aria-selected={isActive}
              aria-controls="mood-results"
              onClick={() => onSelect(mood.id)}
              animate={{ scale: isActive ? 1.06 : 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40${moods.indexOf(mood) === 3 ? ' hidden sm:inline-flex' : ''}`}
              style={isActive ? {
                border: `1px solid ${hexToRgba(mood.color, 0.65)}`,
                backgroundColor: hexToRgba(mood.color, 0.16),
                color: hexToRgba(mood.color, 1),
                boxShadow: `0 0 20px ${hexToRgba(mood.color, 0.30)}, inset 0 1px 0 ${hexToRgba(mood.color, 0.2)}`,
                transition: 'background-color 280ms ease, border-color 280ms ease, box-shadow 280ms ease, color 280ms ease',
              } : {
                border: '1px solid rgba(255,255,255,0.08)',
                backgroundColor: 'rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.28)',
                transition: 'background-color 280ms ease, border-color 280ms ease, color 280ms ease',
              }}
            >
              <span aria-hidden="true">{mood.emoji}</span>
              {mood.label}
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}

/**
 * A single movie poster card with premium match badge.
 * @param {{ film: object, accentColor: string, isPrimary: boolean }} props
 */
function FilmCard({ film, accentColor, isPrimary }) {
  return (
    <div className="group">
      {/* Poster */}
      <div
        className="relative rounded-xl overflow-hidden aspect-[2/3] bg-neutral-900 transition-all duration-200 ease-out group-hover:scale-[1.03] group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.65)]"
        style={{
          boxShadow: isPrimary
            ? `0 0 0 1px ${hexToRgba(accentColor, 0.40)}, 0 8px 32px ${hexToRgba(accentColor, 0.18)}`
            : '0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        {/* Match badge — "X% you" brand voice */}
        <motion.div
          className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-md text-[9px] font-semibold tracking-wide leading-none"
          style={{
            background: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.25)}, ${hexToRgba(accentColor, 0.12)})`,
            border: `1px solid ${hexToRgba(accentColor, 0.30)}`,
          }}
          aria-label={`${film.match}% match`}
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <span style={{ color: accentColor }}>{film.match}%</span>
          <span className="text-white/40 font-normal">you</span>
        </motion.div>
        <img
          src={`https://image.tmdb.org/t/p/w500${film.poster}`}
          alt={`${film.title} poster`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      {/* Film info */}
      <div className="mt-2 px-0.5">
        <p className="text-[13px] font-semibold text-white truncate leading-tight">{film.title}</p>
        <p className="text-[11px] text-white/40 mt-0.5 font-mono">{film.year}</p>
      </div>
    </div>
  )
}

// === MAIN COMPONENT ===

/**
 * MoodShowcaseSection — "play first, profile second" activation section.
 *
 * Visitor taps a mood pill → sees 4 real film picks → no account required.
 * This is the primary conversion demonstration on the landing page.
 */
export default function MoodShowcaseSection() {
  const [activeId, setActiveId] = useState(null)

  // Auto-select 'nostalgic' after 2s to demonstrate the interaction.
  // Only fires if the user hasn't already tapped a pill.
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveId((prev) => (prev === null ? 'nostalgic' : prev))
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  const activeMood = SHOWCASE_MOODS.find((m) => m.id === activeId) ?? null

  return (
    <section
      id="mood-demo"
      className="relative bg-black overflow-hidden"
      aria-labelledby="mood-demo-heading"
    >
      {/* Top border — mood-reactive gradient line */}
      <motion.div
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        animate={{
          background: activeMood
            ? `linear-gradient(90deg, transparent 0%, ${hexToRgba(activeMood.color, 0.45)} 50%, transparent 100%)`
            : 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.2) 50%, transparent 100%)',
        }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: 'easeInOut' }}
        aria-hidden="true"
      />

      {/* Atmospheric word — ghost layer, not a design element */}
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
        style={{ filter: 'blur(2px)' }}
        aria-hidden="true"
      >
        <span className="font-black text-[20vw] bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent opacity-[0.04] select-none leading-none">
          TONIGHT
        </span>
      </div>

      {/* Layer A — static base purple atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(88,28,135,0.12) 0%, transparent 65%)' }}
        aria-hidden="true"
      />

      {/* Layer B — mood color bloom, keyed for proper exit */}
      <AnimatePresence>
        {activeMood && (
          <motion.div
            key={activeMood.id}
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: 'easeInOut' }}
            style={{
              background: `radial-gradient(ellipse 75% 55% at 50% 60%, ${hexToRgba(activeMood.color, 0.18)} 0%, transparent 70%)`,
            }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Layer C — edge vignette accent */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: activeMood ? 1 : 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 1, ease: 'easeInOut' }}
        style={{
          background: activeMood
            ? `linear-gradient(90deg, ${hexToRgba(activeMood.color, 0.08)} 0%, transparent 25%, transparent 75%, ${hexToRgba(activeMood.color, 0.06)} 100%)`
            : undefined,
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-[5.7rem] sm:py-[8.16rem]">

        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-14">

          {/* === LEFT: COPY === */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.45 }}
            className="lg:w-[40%] flex-shrink-0 mb-10 lg:mb-0 lg:self-stretch lg:flex lg:flex-col lg:justify-between"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-400/60 mb-4">
                Discovery
              </p>
              <h2
                id="mood-demo-heading"
                className="font-black tracking-tight leading-[1.05] text-white mb-5"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)' }}
              >
                The right film in under a minute.
              </h2>
              <p className="text-sm sm:text-base text-white/60 leading-relaxed">
                Tell it how you feel. It finds the right film — matched to your mood, taste, and personal history. Not what&apos;s trending.
              </p>
            </div>

            {/* Footer link — desktop, pinned to bottom via justify-between */}
            <div className="hidden lg:block mt-10">
              <Link
                to="/discover"
                className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white/90 transition-colors duration-200"
                aria-label="See all moods and film picks"
              >
                See all moods
                <motion.span
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  aria-hidden="true"
                >
                  →
                </motion.span>
              </Link>
            </div>
          </motion.div>

          {/* === RIGHT: INTERACTIVE === */}
          <div className="lg:w-[60%] min-w-0">

            {/* Mood selector */}
            <MoodSelector
              moods={SHOWCASE_MOODS}
              activeId={activeId}
              onSelect={setActiveId}
            />

            {/* Mood name typography — the "spell named" moment */}
            <AnimatePresence mode="wait">
              {activeMood && (
                <motion.div
                  key={`label-${activeMood.id}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: [0.22, 0.61, 0.36, 1] }}
                  className="flex items-baseline gap-2.5 mb-4"
                >
                  <span
                    className="text-xl sm:text-2xl font-black tracking-tight leading-none"
                    style={{ color: activeMood.color }}
                  >
                    {activeMood.label}
                  </span>
                  <span className="text-white/20 text-base">—</span>
                  <span className="text-sm text-white/60 leading-none">{activeMood.description}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Film cards — exit up, enter from below for a "swapping" feel */}
            <AnimatePresence mode="wait">
              {activeMood && (
                <motion.div
                  key={activeMood.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.22, ease: 'easeInOut' }}
                  id="mood-results"
                  role="tabpanel"
                  aria-label={`Film recommendations for ${activeMood.label}`}
                  aria-live="polite"
                >
                  <div className="grid grid-cols-3 gap-4">
                    {activeMood.films.map((film, i) => (
                      <motion.div
                        key={`${activeMood.id}-${film.title}`}
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={prefersReducedMotion ? { duration: 0 } : {
                          duration: 0.38,
                          delay: i * 0.07,
                          ease: [0.22, 0.61, 0.36, 1],
                        }}
                      >
                        <FilmCard
                          film={film}
                          accentColor={activeMood.color}
                          isPrimary={i === 0}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* Footer link — mobile only */}
        <div className="lg:hidden mt-10">
          <Link
            to="/discover"
            className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white/80 transition-colors duration-200"
            aria-label="See all moods and film picks"
          >
            See all moods →
          </Link>
        </div>

      </div>
    </section>
  )
}
