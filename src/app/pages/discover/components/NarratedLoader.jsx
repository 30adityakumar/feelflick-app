// src/app/pages/discover/components/NarratedLoader.jsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const LINES = [
  'Matching your taste…',
  'Scoring 6,000 films…',
  'Finding your top picks…',
]

const LINE_INTERVAL_MS = 1200
const MIN_LAST_LINE_MS = 600

/**
 * Narrated loading screen. Shows 3 rotating messages while results
 * fetch in the background. No spinners — animated progress bar only.
 *
 * Completes when any terminal condition becomes true: results arrived,
 * an error occurred, or the pool returned zero results (exhausted).
 *
 * @param {{
 *   resultsReady: boolean,
 *   errorReady: boolean,
 *   exhausted: boolean,
 *   onComplete: () => void
 * }} props
 */
export default function NarratedLoader({ resultsReady, errorReady, exhausted, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const completedRef = useRef(false)

  const isTerminal = resultsReady || errorReady || exhausted

  // Rotate through messages
  useEffect(() => {
    if (currentIndex >= LINES.length - 1) return

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, LINES.length - 1))
    }, LINE_INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [currentIndex])

  // Complete when any terminal condition is true AND we've shown the last line briefly
  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }, [onComplete])

  useEffect(() => {
    if (!isTerminal || completedRef.current) return

    if (currentIndex >= LINES.length - 1) {
      const t = setTimeout(handleComplete, MIN_LAST_LINE_MS)
      return () => clearTimeout(t)
    }
  }, [isTerminal, currentIndex, handleComplete])

  // Force-complete fallback: fires after all lines + 4s buffer
  useEffect(() => {
    const maxWait = LINE_INTERVAL_MS * LINES.length + 4000
    const t = setTimeout(() => {
      if (!completedRef.current && isTerminal) {
        completedRef.current = true
        onComplete()
      }
    }, maxWait)
    return () => clearTimeout(t)
  }, [isTerminal, onComplete])

  const progressDuration = (LINE_INTERVAL_MS * LINES.length) / 1000

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
      <AnimatePresence mode="wait">
        <motion.p
          key={currentIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4 }}
          className="text-lg sm:text-xl text-white/60 text-center max-w-xl px-6"
        >
          {LINES[currentIndex]}
        </motion.p>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="h-[2px] w-40 bg-white/10 overflow-hidden rounded-full">
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '0%' }}
          transition={{ duration: progressDuration, ease: 'linear' }}
          className="h-full w-full bg-gradient-to-r from-purple-500 to-pink-500"
        />
      </div>
    </div>
  )
}
