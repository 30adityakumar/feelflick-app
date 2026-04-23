// src/features/landing/sections/MoatProofSection.jsx
import { motion } from 'framer-motion'

const vp = { once: true, margin: '-60px' }

const prefersReducedMotion =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

const PROOF_POINTS = [
  'Every film is hand-scored on 15 dimensions.',
  'No autoplay queue. No filler.',
  'Mood-matched, not popularity-ranked.',
]

/**
 * MoatProofSection — thin proof band between social and FAQ sections.
 *
 * Apple-quiet: no illustrations, no icons, no hero imagery.
 * Three short factual statements that separate FeelFlick from algorithmic services.
 */
export default function MoatProofSection() {
  return (
    <section
      id="moat-proof"
      className="relative bg-black overflow-hidden"
      aria-labelledby="moat-proof-heading"
    >
      {/* Top border */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.2) 50%, transparent 100%)' }}
        aria-hidden="true"
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 text-center">

        <motion.p
          className="text-xs font-semibold uppercase tracking-widest text-purple-400/60 mb-4"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
        >
          Why it works
        </motion.p>

        <motion.h2
          id="moat-proof-heading"
          className="sr-only"
        >
          What makes FeelFlick different
        </motion.h2>

        <ul className="flex flex-col sm:flex-row sm:justify-center sm:divide-x sm:divide-white/[0.06] gap-5 sm:gap-0">
          {PROOF_POINTS.map((point, i) => (
            <motion.li
              key={point}
              className="sm:px-8 text-sm sm:text-base text-white/60 leading-relaxed"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: prefersReducedMotion ? 0 : 0.4, delay: prefersReducedMotion ? 0 : i * 0.1 }}
            >
              {point}
            </motion.li>
          ))}
        </ul>

      </div>
    </section>
  )
}
