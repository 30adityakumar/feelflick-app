// src/app/pages/discover/components/AIBar.jsx
import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { useNLMoodParse } from '@/shared/hooks/useNLMoodParse'

/**
 * Fixed bottom bar for free-text AI input during the brief flow.
 * Text is parsed for tag hints, then added as a note to the brief.
 *
 * @param {{ addNote: (text: string) => void }} props
 */
export default function AIBar({ addNote }) {
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState(null)
  const confirmTimerRef = useRef(null)
  const { parse } = useNLMoodParse()

  const submit = useCallback(async () => {
    const text = value.trim()
    if (!text || submitting) return

    setSubmitting(true)
    try {
      // Attempt to parse — result is used internally by the recommendation engine
      // when the brief is submitted. Even if parse fails, we still add the raw note.
      await parse('', text)
    } catch {
      // Silently continue — never block the note from being added
    }

    addNote(text)
    setValue('')
    setSubmitting(false)

    // Show confirmation
    clearTimeout(confirmTimerRef.current)
    setConfirmation('Added to your brief')
    confirmTimerRef.current = setTimeout(() => setConfirmation(null), 2000)
  }, [value, submitting, parse, addNote])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && value.trim() && !submitting) {
      e.preventDefault()
      submit()
    }
  }

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

      {/* Confirmation fade */}
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
