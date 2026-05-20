// src/features/landing/sections/ItLearnsYouSection.jsx
import { motion } from 'framer-motion'

// === CONSTANTS ===
// WHY: Get Out chosen as the recommendation — confirmed working TMDB poster path
// (/mE24wUCfjK8AoBBjaMjho7Rczr7.jpg is already loaded in HeroSection and MoodShowcase),
// and thematically strong: Parasite → Get Out is a genuine "social horror that
// dissects class" pairing a good engine would actually surface.

const SOURCE_FILM = {
  title: 'Parasite',
  poster: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
}

const RECOMMENDED_FILM = {
  title: 'Get Out',
  year: 2017,
  genres: 'Horror · Thriller',
  poster: '/mE24wUCfjK8AoBBjaMjho7Rczr7.jpg',
  match: 94,
  reason: "Social horror that crawls under your skin — same tension, different nightmare.",
}

const vp = { once: true, margin: '-60px' }

// Checked once at module load — stable for the session.
const prefersReducedMotion =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

// === MAIN COMPONENT ===

/**
 * ItLearnsYouSection — retention pitch for the FeelFlick landing page.
 *
 * Demonstrates the recommendation engine's "Because you loved X" output
 * to show visitors that quality improves the more they use FeelFlick.
 * All data is hardcoded — no API calls.
 */
export default function ItLearnsYouSection() {
  return (
    <section
      id="it-learns"
      className="relative bg-black overflow-hidden"
      aria-labelledby="learns-heading"
    >
      {/* Top border */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.2) 50%, transparent 100%)' }}
        aria-hidden="true"
      />

      {/* Orb A — right-leaning to frame the card */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 65% 50%, rgba(88,28,135,0.12) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      {/* Orb B — softer bloom behind the copy block (left side) */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '10%', left: '-8%',
          width: '45%', height: '80%',
          background: 'radial-gradient(ellipse 60% 50% at 30% 50%, rgba(88,28,135,0.08) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-16">
        <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-14">

          {/* ── LEFT: COPY BLOCK ──────────────────────────────────────────── */}
          <div className="lg:w-1/2 flex-shrink-0">

            <motion.p
              className="text-xs font-semibold uppercase tracking-widest text-purple-400/60 mb-2"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
            >
              Learns You
            </motion.p>

            <motion.h2
              id="learns-heading"
              className="font-black tracking-tight leading-[1.05] text-white mb-3"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)' }}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: prefersReducedMotion ? 0 : 0.45, delay: prefersReducedMotion ? 0 : 0.1 }}
            >
              It gets better<br />at getting you.
            </motion.h2>

            <motion.p
              className="text-sm sm:text-base text-white/60 leading-relaxed max-w-md"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: prefersReducedMotion ? 0 : 0.45, delay: prefersReducedMotion ? 0 : 0.2 }}
            >
              Five films in, it&apos;s decent. Fifty films in, it starts to feel uncanny. Every watch, rating, and skip makes the next pick sharper.
            </motion.p>

          </div>

          {/* ── RIGHT: RECOMMENDATION CARD ────────────────────────────────── */}
          <div className="lg:w-1/2 relative">

            {/* Soft ambient glow behind the card */}
            <div
              className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(88,28,135,0.22) 0%, transparent 70%)',
                filter: 'blur(36px)',
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
                initial: { opacity: 0, y: 24 },
                whileInView: { opacity: 1, y: 0 },
                viewport: vp,
                transition: { duration: 0.5, delay: 0.2 },
              })}
            >

              {/* Source row: tiny Parasite thumbnail + "Because you loved" label */}
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="flex-shrink-0 w-8 rounded-md overflow-hidden ring-1 ring-white/[0.06]"
                  style={{ aspectRatio: '2/3', background: 'rgba(255,255,255,0.04)' }}
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w154${SOURCE_FILM.poster}`}
                    alt={`${SOURCE_FILM.title} poster`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="text-xs text-white/40">
                  Because you loved{' '}
                  <span className="text-white/60 font-medium">{SOURCE_FILM.title}</span>
                </p>
              </div>

              {/* Connector — thin vertical line descending to the recommendation */}
              <div className="flex items-center ml-4 mb-3" aria-hidden="true">
                <div
                  className="w-px h-5"
                  style={{ background: 'rgba(255,255,255,0.10)' }}
                />
              </div>

              {/* Recommended film: poster left, info right */}
              <div className="flex gap-4">
                <div
                  className="flex-shrink-0 w-16 rounded-xl overflow-hidden ring-1 ring-white/[0.06]"
                  style={{ aspectRatio: '2/3', background: 'rgba(255,255,255,0.04)' }}
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w185${RECOMMENDED_FILM.poster}`}
                    alt={`${RECOMMENDED_FILM.title} poster`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-base font-semibold text-white">{RECOMMENDED_FILM.title}</p>
                    {/* Match badge — style matches MoodShowcaseSection match badges */}
                    <span
                      className="flex-shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(168,85,247,0.15)', color: 'rgba(192,132,252,1)' }}
                      aria-label={`${RECOMMENDED_FILM.match}% match`}
                    >
                      {RECOMMENDED_FILM.match}%
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mb-3">
                    {RECOMMENDED_FILM.year} · {RECOMMENDED_FILM.genres}
                  </p>
                  <p className="text-xs text-white/20 italic">{RECOMMENDED_FILM.reason}</p>
                </div>
              </div>

            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}
