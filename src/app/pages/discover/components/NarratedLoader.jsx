// src/app/pages/discover/components/NarratedLoader.jsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const LINE_MIN_MS = 400
const TOTAL_ESTIMATED_MS = 3000

/**
 * Builds the 5-line narration script from the brief context.
 *
 * @param {{ totalCount: number, tagDim: number, hasTasteProfile: boolean }} ctx
 * @returns {string[]}
 */
function buildLines({ totalCount, tagDim, hasTasteProfile }) {
  const lines = [
    `Opening the vault of ${totalCount.toLocaleString()} films...`,
    'Matching against your brief...',
    `Weighing ${tagDim} tag dimensions...`,
  ]
  if (hasTasteProfile) {
    lines.push('Cross-referencing your taste fingerprint...')
  }
  lines.push('Surfacing 10 picks tuned for tonight.')
  return lines
}

/**
 * Narrated loading screen. Shows milestone lines one at a time while
 * results fetch in the background. No spinners.
 *
 * @param {{ totalCount: number, tagDim: number, hasTasteProfile: boolean,
 *           resultsReady: boolean, onComplete: () => void }} props
 */
export default function NarratedLoader({ totalCount, tagDim, hasTasteProfile, resultsReady, onComplete }) {
  const lines = useRef(
    buildLines({
      totalCount: totalCount || 4200,
      tagDim: tagDim || 45,
      hasTasteProfile: hasTasteProfile ?? false,
    }),
  ).current

  const [currentIndex, setCurrentIndex] = useState(0)
  const timerRef = useRef(null)
  const completedRef = useRef(false)

  const totalLines = lines.length

  // Advance lines on a timer
  const advanceLine = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev + 1
      if (next >= totalLines) return prev // Stay on last line
      return next
    })
  }, [totalLines])

  useEffect(() => {
    if (currentIndex >= totalLines - 1) return // On last line, stop timer

    timerRef.current = setTimeout(advanceLine, LINE_MIN_MS)
    return () => clearTimeout(timerRef.current)
  }, [currentIndex, advanceLine, totalLines])

  // Complete when results ready AND we've shown the last line for at least LINE_MIN_MS
  useEffect(() => {
    if (!resultsReady || completedRef.current) return

    if (currentIndex >= totalLines - 1) {
      // On last line — wait LINE_MIN_MS then complete
      const t = setTimeout(() => {
        completedRef.current = true
        onComplete()
      }, LINE_MIN_MS)
      return () => clearTimeout(t)
    }
    // Not on last line yet — fast-forward remaining lines
    // The timer-based advance will eventually reach the last line
  }, [resultsReady, currentIndex, totalLines, onComplete])

  const progressDuration = TOTAL_ESTIMATED_MS / 1000

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <AnimatePresence mode="wait">
        <motion.p
          key={currentIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4 }}
          className="text-lg sm:text-xl font-light text-white/80 text-center max-w-xl px-6"
        >
          {lines[currentIndex]}
        </motion.p>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="mt-4 h-[2px] w-32 bg-white/10 overflow-hidden rounded-full">
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
