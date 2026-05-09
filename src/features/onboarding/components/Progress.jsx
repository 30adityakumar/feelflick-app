// src/features/onboarding/components/Progress.jsx
// 4-segment progress bar with FEELFLICK wordmark + step counter.

import { motion } from 'framer-motion'

const TOTAL = 4

export default function Progress({ step }) {
  return (
    <div className="flex-none px-6 pt-6 pb-1 flex items-center gap-4">
      <span className="ob-display text-[15px] font-extrabold tracking-[0.02em] bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
        FEELFLICK
      </span>
      <div className="flex-1 flex items-center gap-1.5">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div key={i} className="h-[3px] flex-1 rounded-full bg-white/[0.08] overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: i <= step ? 1 : 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          </div>
        ))}
      </div>
      <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">
        {String(step + 1).padStart(2, '0')} / 0{TOTAL}
      </span>
    </div>
  )
}
