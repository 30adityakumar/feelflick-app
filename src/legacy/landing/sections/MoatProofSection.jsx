// src/features/landing/sections/MoatProofSection.jsx
import { motion } from 'framer-motion'

const vp = { once: true, margin: '-60px' }

const prefersReducedMotion =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

/**
 * MoatProofSection — Apple-quiet two-line proof band.
 *
 * No eyebrow, no headline, no bullet list. Just two declarative
 * statements that separate FeelFlick from algorithmic services.
 */
export default function MoatProofSection() {
  return (
    <section
      id="moat-proof"
      className="relative bg-black"
      aria-label="What makes FeelFlick different"
    >
      {/* 1px purple→pink gradient top border */}
      <div
        className="max-w-24 mx-auto mb-12 h-px"
        style={{ background: 'linear-gradient(90deg, rgba(168,85,247,0.6) 0%, rgba(236,72,153,0.6) 100%)' }}
        aria-hidden="true"
      />

      <div className="max-w-4xl mx-auto px-6 py-16 sm:py-20 text-center">

        <motion.p
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ duration: prefersReducedMotion ? 0 : 0.45 }}
        >
          Every film is hand-scored on 20 dimensions.
        </motion.p>

        <motion.p
          className="text-base sm:text-lg text-white/50 mt-3"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ duration: prefersReducedMotion ? 0 : 0.4, delay: prefersReducedMotion ? 0 : 0.12 }}
        >
          No autoplay queue. No filler.
        </motion.p>

      </div>
    </section>
  )
}
