// src/app/pages/discover/components/AIBar.jsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { useNLMoodParse } from '@/shared/hooks/useNLMoodParse'

const PLACEHOLDER_LINES = [
  'A mind-bending sci-fi...',
  'A cozy Sunday afternoon film...',
  'A revenge thriller with style...',
  'Something like Amélie but darker...',
  'A film that makes me feel hopeful...',
]

/**
 * Animated placeholder that cycles through example prompts.
 * @param {{ active: boolean }} props
 */
function AnimatedPlaceholder({ active }) {
  const [lineIdx, setLineIdx] = useState(0)

  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => {
      setLineIdx((i) => (i + 1) % PLACEHOLDER_LINES.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [active])

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={lineIdx}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 0.4, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.3 }}
        className="pointer-events-none absolute inset-0 flex items-center text-white/40"
      >
        {PLACEHOLDER_LINES[lineIdx]}
      </motion.span>
    </AnimatePresence>
  )
}

/**
 * AI free-text input. Renders in two modes:
 * - **Prominent** (inline=true): large card above questions on first render
 * - **Compact** (inline=false): fixed bottom bar during brief flow
 *
 * @param {{ addNote: (text: string) => void, onSubmitDirect?: (text: string) => void,
 *           inline?: boolean }} props
 */
export default function AIBar({ addNote, onSubmitDirect, inline = false }) {
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState(null)
  const confirmTimerRef = useRef(null)
  const inputRef = useRef(null)
  const { parse } = useNLMoodParse()

  const submit = useCallback(async () => {
    const text = value.trim()
    if (!text || submitting) return

    setSubmitting(true)
    try {
      await parse('', text)
    } catch {
      // Silently continue
    }

    if (onSubmitDirect) {
      onSubmitDirect(text)
    } else {
      addNote(text)
    }

    setValue('')
    setSubmitting(false)

    clearTimeout(confirmTimerRef.current)
    setConfirmation(onSubmitDirect ? 'Finding your films...' : 'Added to your brief')
    confirmTimerRef.current = setTimeout(() => setConfirmation(null), 2000)
  }, [value, submitting, parse, addNote, onSubmitDirect])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && value.trim() && !submitting) {
      e.preventDefault()
      submit()
    }
  }

  // === INLINE / PROMINENT MODE ===
  if (inline) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 mb-6"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-purple-400/60 mb-3">
          Or describe it in your own words
        </p>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Describe the kind of film you want"
            className="w-full bg-transparent border-0 outline-none text-xl text-white placeholder:text-white/30 py-2"
          />
          {!value && <AnimatedPlaceholder active />}
        </div>
        <div className="flex items-center justify-between mt-3">
          <AnimatePresence>
            {confirmation && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-purple-300/80"
              >
                {confirmation}
              </motion.span>
            )}
          </AnimatePresence>
          <button
            type="button"
            disabled={!value.trim() || submitting}
            onClick={submit}
            className="text-sm font-medium text-purple-300 hover:text-purple-200 disabled:text-white/20 transition-colors"
          >
            {submitting ? 'Parsing...' : 'Go'}
          </button>
        </div>
      </motion.div>
    )
  }

  // === COMPACT / BOTTOM BAR MODE ===
  return (
    <div className="fixed bottom-0 inset-x-0 border-t border-white/10 bg-black/80 backdrop-blur-md z-40">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-purple-400/60 whitespace-nowrap">
          Tell me
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="something specific on your mind..."
          aria-label="Add a note to your mood brief"
          className="flex-1 bg-transparent border-0 outline-none text-sm text-white placeholder:text-white/40"
        />
        <button
          type="button"
          disabled={!value.trim() || submitting}
          onClick={submit}
          className="text-xs text-purple-300 hover:text-purple-200 disabled:text-white/20 transition-colors"
        >
          {submitting ? 'parsing...' : 'add'}
        </button>
      </div>

      <AnimatePresence>
        {confirmation && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute -top-8 inset-x-0 flex justify-center pointer-events-none"
          >
            <span className="text-xs text-purple-300/80 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
              {confirmation}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
