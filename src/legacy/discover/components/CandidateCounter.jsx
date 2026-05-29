// src/app/pages/discover/components/CandidateCounter.jsx
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Animated candidate pool counter shown between PinnedBrief and QuestionSlot.
 * Number tweens on change; a purple glow flashes when count drops >10%.
 *
 * @param {{ count: number, previousCount: number, loading: boolean }} props
 */
export default function CandidateCounter({ count, previousCount, loading }) {
  const dropPercent = previousCount > 0
    ? (previousCount - count) / previousCount
    : 0
  const showGlow = dropPercent > 0.1

  return (
    <div className="py-8 flex items-baseline justify-center gap-3">
      <div className="relative">
        {/* Glow flash on significant drop */}
        <AnimatePresence>
          {showGlow && (
            <motion.div
              key={`glow-${count}`}
              initial={{ opacity: 0.6, scale: 1 }}
              animate={{ opacity: 0, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute inset-0 rounded-xl"
              style={{
                background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.span
            key={count}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: loading ? 0.5 : 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="text-5xl sm:text-6xl font-light tabular-nums text-white tracking-tight relative"
          >
            {count.toLocaleString()}
          </motion.span>
        </AnimatePresence>
      </div>

      <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
        films match
      </span>
    </div>
  )
}
