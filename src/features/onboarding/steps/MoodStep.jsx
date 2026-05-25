// src/features/onboarding/steps/MoodStep.jsx
// NEW step 1 (mood baseline). Tile picker, 2-3 selections, with a pulsing orb in each tile.

import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

import Button from '@/shared/ui/Button'
import { MOODS, MIN_MOODS, MAX_MOODS } from '../data'

export default function MoodStep({ moods, setMoods, onNext, firstName }) {
  const count = moods.length
  const canContinue = count >= MIN_MOODS

  function toggle(key) {
    setMoods(prev => {
      if (prev.includes(key)) return prev.filter(x => x !== key)
      if (prev.length >= MAX_MOODS) return prev
      return [...prev, key]
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none px-5 pt-5 pb-4 sm:px-6 sm:pt-8 sm:pb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-purple-400/85 mb-2.5 sm:mb-3">
          {firstName ? `Hey ${firstName} —` : 'Mood baseline · 1 of 4'}
        </p>
        <h2
          className="ob-display text-[32px] sm:text-4xl md:text-5xl font-extrabold text-white leading-[1.05]"
          style={{ textWrap: 'balance' }}
        >
          The vibe you{' '}
          <em className="not-italic bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent italic">
            live in.
          </em>
        </h2>
        <p className="text-[13px] sm:text-sm md:text-[15px] text-white/55 mt-2 sm:mt-3 leading-relaxed max-w-xl">
          Pick {MIN_MOODS}–{MAX_MOODS} moods you actually find yourself in. We&apos;ll calibrate from
          here — and the screen will respond as you choose.
        </p>
      </div>

      {/* Mood tiles. WHY: inner py-2 + px-1 creates the buffer needed for the
         selected-tile glow/border to render fully — without it, the parent's
         overflow-y-auto implicitly clips the box-shadow on the top/left edges. */}
      <div className="ob-scroll flex-1 min-h-0 overflow-y-auto px-5 pb-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 max-w-3xl mx-auto px-1 py-2">
          {MOODS.map(m => {
            const on = moods.includes(m.key)
            return (
              <motion.button
                key={m.key}
                type="button"
                onClick={() => toggle(m.key)}
                whileTap={{ scale: 0.97 }}
                aria-pressed={on}
                className="relative text-left p-4 sm:p-5 rounded-2xl overflow-hidden cursor-pointer transition-all"
                style={{
                  background: on ? `rgba(${m.rgb}, 0.16)` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${on ? `rgba(${m.rgb}, 0.55)` : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: on
                    ? `0 0 16px rgba(${m.rgb}, 0.32), inset 0 0 0 1px rgba(${m.rgb}, 0.1)`
                    : 'none',
                  transform: on ? 'translateY(-2px)' : 'translateY(0)',
                }}
              >
                {/* Pulsing orb */}
                <div
                  aria-hidden="true"
                  className="absolute -top-5 -right-5 w-20 h-20 rounded-full"
                  style={{
                    background: `radial-gradient(circle, rgba(${m.rgb}, ${on ? 0.45 : 0.18}), transparent 70%)`,
                    filter: 'blur(12px)',
                    transition: 'all 0.6s ease',
                  }}
                />
                <div className="relative flex items-center justify-between mb-1.5">
                  <span className="ob-display text-lg font-bold text-white">{m.label}</span>
                  {on && (
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-black font-extrabold text-[11px]"
                      style={{ background: `rgb(${m.rgb})` }}
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  )}
                </div>
                <p className="relative text-[12.5px] text-white/60 leading-snug">{m.desc}</p>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-none px-5 pb-6 pt-3 sm:px-6 sm:pb-8 sm:pt-4 border-t border-white/[0.06]">
        <div className="max-w-sm mx-auto flex flex-col items-center gap-3">
          <p
            className={`text-xs font-medium transition-colors ${
              canContinue ? 'text-purple-400' : 'text-white/30'
            }`}
          >
            {count === 0
              ? `Pick at least ${MIN_MOODS} mood${MIN_MOODS === 1 ? '' : 's'} to continue`
              : count < MIN_MOODS
              ? `${count} selected — pick ${MIN_MOODS - count} more`
              : `${count} selected ✓`}
          </p>
          <Button variant="primary" size="lg" onClick={onNext} disabled={!canContinue} fullWidth>
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
