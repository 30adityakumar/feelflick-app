// src/features/landing/sections/CinematicDNASection.jsx
import { motion } from 'framer-motion'

// === CONSTANTS ===
// All data is hardcoded — NO API calls. This is a simulated profile
// for a fictional user (Sarah K.) chosen to represent eclectic,
// quality-focused taste that FeelFlick is built for.

const GENRES = [
  {
    label: 'Psychological Thriller',
    pct: 84,
    colorFrom: 'from-purple-500',
    colorTo: 'to-pink-500',
  },
  {
    label: 'Sci-Fi Drama',
    pct: 71,
    colorFrom: 'from-blue-500',
    colorTo: 'to-purple-500',
  },
  {
    label: 'Character Study',
    pct: 63,
    colorFrom: 'from-teal-400',
    colorTo: 'to-cyan-500',
  },
]

const DIRECTORS = ['Denis Villeneuve', 'Bong Joon-ho', 'Greta Gerwig']

const TASTE_SUMMARY = 'Gravitates toward films that unsettle — psychological tension, moral complexity, directors who trust the audience.'

const RECENTLY_WATCHED = [
  { title: 'Dune',                              poster: '/gDzOcq0pfeCeqMBwKIJlSmQpjkZ.jpg' },
  { title: 'Parasite',                          poster: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg' },
  { title: 'Spirited Away',                     poster: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg' },
  { title: 'Everything Everywhere All at Once', poster: '/u68AjlvlutfEIcpmbYpKcdi09ut.jpg' },
  { title: 'Moonlight',                         poster: '/qLnfEmPrDjJfPyyddLJPkXmshkp.jpg' },
  { title: 'Amélie',                            poster: '/nSxDa3M9aMvGVLoItzWTepQ5h5d.jpg' },
]

const vp = { once: true, margin: '-60px' }

// Checked once at module load — stable for the session. Same pattern as MoodShowcaseSection.
const prefersReducedMotion =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

// === SUB-COMPONENTS ===

/**
 * Animated genre preference bar.
 * Bar width animates from 0% to target on scroll-into-view.
 * Instantly renders at full width when prefers-reduced-motion is set.
 * @param {{ genre: { label: string, pct: number, colorFrom: string, colorTo: string }, delay: number }} props
 */
function GenreBar({ genre, delay }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium text-white/60">{genre.label}</span>
        <span className="text-[11px] font-medium tabular-nums text-white/40">{genre.pct}%</span>
      </div>
      {/* role="meter" exposes percentage semantics to assistive tech */}
      <div
        className="relative h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
        role="meter"
        aria-valuenow={genre.pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${genre.label} preference`}
      >
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${genre.colorFrom} ${genre.colorTo}`}
          style={prefersReducedMotion ? { width: `${genre.pct}%` } : undefined}
          {...(!prefersReducedMotion && {
            initial: { width: '0%' },
            whileInView: { width: `${genre.pct}%` },
            viewport: vp,
            transition: { type: 'spring', stiffness: 50, damping: 15, delay },
          })}
        />
      </div>
    </div>
  )
}

// === MAIN COMPONENT ===

/**
 * CinematicDNASection — identity layer of the FeelFlick landing page.
 *
 * Simulates a real user taste profile so visitors think "I want to see mine."
 * NOTE: "47 films watched" and "Member since March 2026" belong to the
 * fictional profile of Sarah K. — they are NOT claims about real FeelFlick users.
 */
export default function CinematicDNASection() {
  return (
    <section
      id="cinematic-dna"
      className="relative bg-black overflow-hidden"
      aria-labelledby="dna-heading"
    >
      {/* Top border */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.2) 50%, transparent 100%)' }}
        aria-hidden="true"
      />

      {/* Orb A — large bloom behind the card (right side) */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-10%', right: '-5%',
          width: '55%', height: '120%',
          background: 'radial-gradient(ellipse 70% 60% at 70% 45%, rgba(88,28,135,0.22) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Orb B — softer bloom behind the copy block (left side) */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '10%', left: '-8%',
          width: '45%', height: '80%',
          background: 'radial-gradient(ellipse 60% 50% at 30% 50%, rgba(88,28,135,0.10) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />

      {/* Diagonal tint — ties both orbs into one cohesive atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(88,28,135,0.04) 0%, transparent 50%, rgba(168,85,247,0.04) 100%)' }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-14">

          {/* ── LEFT: COPY BLOCK ──────────────────────────────────────────────── */}
          <div className="lg:w-[45%] flex-shrink-0">

            <motion.p
              className="text-xs font-semibold uppercase tracking-widest text-purple-400/60 mb-3"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
            >
              Cinematic DNA
            </motion.p>

            <motion.h2
              id="dna-heading"
              className="font-black tracking-tight leading-[1.05] text-white mb-4"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)' }}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: prefersReducedMotion ? 0 : 0.45, delay: prefersReducedMotion ? 0 : 0.1 }}
            >
              Your taste,<br />made visible.
            </motion.h2>

            <motion.p
              className="text-sm sm:text-base text-white/50 leading-relaxed mb-3 max-w-md"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: prefersReducedMotion ? 0 : 0.45, delay: prefersReducedMotion ? 0 : 0.2 }}
            >
              Every film you watch builds your Cinematic DNA — a living portrait of your genres, directors, mood patterns, and the stories that stay with you.
            </motion.p>

            <motion.p
              className="text-sm sm:text-base text-white/50 leading-relaxed max-w-md"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: prefersReducedMotion ? 0 : 0.4, delay: prefersReducedMotion ? 0 : 0.3 }}
            >
              It&apos;s not a hidden algorithm. It&apos;s something you can see, share, and grow — film by film.
            </motion.p>

          </div>

          {/* ── RIGHT: PROFILE CARD ──────────────────────────────────────────── */}
          <div className="lg:w-[55%] relative">

            {/* Soft ambient glow behind the card — offset so it bleeds from bottom-right */}
            <div
              className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(88,28,135,0.20) 0%, transparent 70%)',
                filter: 'var(--blur-2xl)',
              }}
              aria-hidden="true"
            />

            <motion.div
              className="relative rounded-2xl border p-4 sm:p-5"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                borderColor: 'rgba(255,255,255,0.08)',
              }}
              whileHover={prefersReducedMotion ? undefined : {
                scale: 1.01,
                borderColor: 'rgba(255,255,255,0.12)',
                transition: { duration: 0.3 },
              }}
              {...(!prefersReducedMotion && {
                initial: { opacity: 0, y: 30 },
                whileInView: { opacity: 1, y: 0 },
                viewport: vp,
                transition: { duration: 0.6, delay: 0.2 },
              })}
            >

              {/* === A: PROFILE HEADER === */}
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white select-none"
                  style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.85), rgba(236,72,153,0.85))' }}
                  aria-hidden="true"
                >
                  SK
                </div>
                <div>
                  <p className="text-base font-semibold text-white leading-none mb-1">Sarah K.</p>
                  <p className="text-xs text-white/40 italic">Cries at Pixar. Won&apos;t admit it.</p>
                </div>
              </div>

              {/* === B: TOP GENRES === */}
              <div className="mb-4 sm:mb-5">
                <p className="text-[10px] uppercase tracking-widest text-white/35 mb-2 sm:mb-3">Top genres</p>
                <div className="space-y-2 sm:space-y-3">
                  {GENRES.map((genre, i) => (
                    <GenreBar
                      key={genre.label}
                      genre={genre}
                      delay={prefersReducedMotion ? 0 : i * 0.15}
                    />
                  ))}
                </div>
              </div>

              {/* === C: TOP DIRECTORS === */}
              <div className="mb-4 sm:mb-5">
                <p className="text-[10px] uppercase tracking-widest text-white/35 mb-2">Top directors</p>
                <div className="flex flex-wrap gap-2" role="list" aria-label="Top directors">
                  {DIRECTORS.map((name) => (
                    <span
                      key={name}
                      role="listitem"
                      className="text-[11px] font-medium text-white/50 bg-white/[0.06] rounded-full px-3 py-1"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              {/* === H: TASTE SUMMARY === */}
              <div className="mb-4 sm:mb-5">
                <p className="text-[10px] uppercase tracking-widest text-white/35 mb-2">Taste summary</p>
                <p className="text-[11px] leading-relaxed text-white/40 italic">
                  &ldquo;{TASTE_SUMMARY}&rdquo;
                </p>
              </div>

              {/* === E: RECENTLY WATCHED === */}
              <div className="mb-4 sm:mb-5">
                <p className="text-[10px] uppercase tracking-widest text-white/35 mb-2.5">Recently watched</p>
                {/* grid-cols-4 fills available card width at every viewport — no fixed poster widths */}
                <div className="grid grid-cols-4 gap-2 sm:gap-3" role="list" aria-label="Recently watched films">
                  {RECENTLY_WATCHED.slice(0, 4).map((film) => (
                    <div
                      key={film.title}
                      role="listitem"
                      className="w-full rounded-xl overflow-hidden ring-1 ring-white/[0.08] transition-all duration-200 hover:scale-105 hover:ring-white/20 hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                      style={{ aspectRatio: '2/3', background: 'rgba(255,255,255,0.04)' }}
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/w185${film.poster}`}
                        alt={`${film.title} poster`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>


            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}
