// src/features/onboarding/components/Progress.jsx
// Persistent onboarding identity + progress lockup: the FEELFLICK wordmark
// (matching the canonical landing Wordmark spec — Outfit 600, +0.04em tracking,
// brand gradient) + one continuous editorial progress rail + a step counter.

import { motion, useReducedMotion } from 'framer-motion'

const TOTAL = 4

export default function Progress({ step }) {
  const reduced = useReducedMotion()
  const current = step + 1            // 1..TOTAL
  const fraction = current / TOTAL    // 0.25..1 — honestly represents 4 steps

  return (
    <div className="flex-none px-5 pt-4 pb-1 sm:px-6 sm:pt-6 flex items-center gap-3 sm:gap-4">
      {/* Wordmark — canonical landing spec (no font-extrabold / font-black).
          Inline letterSpacing overrides .ob-display's -0.02em. */}
      <span
        className="ob-display text-[13px] sm:text-[15px] font-semibold bg-linear-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent"
        style={{ letterSpacing: '0.04em' }}
      >
        FEELFLICK
      </span>

      {/* One continuous editorial hairline rail with a single brand-gradient fill. */}
      <div
        className="flex-1 h-[3px] rounded-full bg-white/8 overflow-hidden"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={TOTAL}
        aria-valuenow={current}
        aria-label="Onboarding progress"
      >
        <motion.div
          className="h-full rounded-full bg-linear-to-r from-purple-600 to-pink-500"
          initial={false}
          animate={{ width: `${fraction * 100}%` }}
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>

      <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-white/55">
        {String(current).padStart(2, '0')} / 0{TOTAL}
      </span>
    </div>
  )
}
