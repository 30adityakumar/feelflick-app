// src/features/onboarding/steps/MoodStep.jsx
// Step 1 (mood baseline). Tile picker, up to MAX_MOODS selections. A selected
// tile "settles" into the atmosphere (accent ring + glow + lift, no checkbox),
// and its mood orb breathes slowly when motion is allowed.

import { motion, useReducedMotion } from 'framer-motion'

import { MOODS, MIN_MOODS, MAX_MOODS } from '../data'
import StepShell from '../components/StepShell'
import StepHeader from '../components/StepHeader'
import StepFooter from '../components/StepFooter'

export default function MoodStep({ moods, setMoods, onNext, firstName }) {
  const reduced = useReducedMotion()
  const count = moods.length
  const canContinue = count >= MIN_MOODS
  const maxReached = count >= MAX_MOODS

  function toggle(key) {
    setMoods(prev => {
      if (prev.includes(key)) return prev.filter(x => x !== key)
      if (prev.length >= MAX_MOODS) return prev
      return [...prev, key]
    })
  }

  return (
    <StepShell
      header={
        <StepHeader
          className="flex-none px-5 pt-5 pb-4 sm:px-6 sm:pt-8 sm:pb-5"
          kicker={firstName ? `Hey ${firstName} —` : 'The vibe · 1 of 4'}
          subcopy={<>Pick {MIN_MOODS}–{MAX_MOODS} moods you actually find yourself in. We&apos;ll calibrate from
          here — and the screen will respond as you choose.</>}
          subcopyClassName="text-[13px] sm:text-sm md:text-[15px] text-white/55 mt-2 sm:mt-3 leading-relaxed max-w-xl"
        >
          The vibe you{' '}
          <em className="italic font-light text-[var(--color-brand-accent-text,#ed7a87)]">
            live in.
          </em>
        </StepHeader>
      }
      footer={
        <StepFooter
          statusClassName={`text-xs font-medium transition-colors ${canContinue ? 'text-[var(--color-text-secondary,#c9c5bc)]' : 'text-white/30'}`}
          status={
            count === 0
              ? `Pick at least ${MIN_MOODS} mood${MIN_MOODS === 1 ? '' : 's'} to continue`
              : count < MIN_MOODS
              ? `${count} selected — pick ${MIN_MOODS - count} more`
              : maxReached
              ? `${count} selected — that's your max`
              : `${count} selected ✓`
          }
          onContinue={onNext}
          disabled={!canContinue}
        />
      }
    >
      {/* Mood tiles. WHY: inner py-2 + px-1 creates the buffer needed for the
         selected-tile glow/border to render fully — without it, the parent's
         overflow-y-auto implicitly clips the box-shadow on the top/left edges. */}
      <div className="ob-scroll flex-1 min-h-0 overflow-y-auto px-5 pb-4 sm:px-6">
        {/* Calm, screen-reader-only feedback when the selection cap is reached. */}
        <p className="sr-only" aria-live="polite">
          {maxReached ? `You've selected the maximum of ${MAX_MOODS} moods. Unpick one to choose a different mood.` : ''}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 max-w-3xl mx-auto px-1 py-2" role="group" aria-label="Moods">
          {MOODS.map(m => {
            const on = moods.includes(m.key)
            const dimmed = maxReached && !on
            return (
              <motion.button
                key={m.key}
                type="button"
                onClick={() => toggle(m.key)}
                whileTap={reduced ? undefined : { scale: 0.97 }}
                aria-pressed={on}
                aria-disabled={dimmed || undefined}
                className={`ob-focus relative text-left p-4 sm:p-5 rounded-2xl overflow-hidden transition-all ${dimmed ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                style={{
                  background: on ? `rgba(${m.rgb}, 0.16)` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${on ? `rgba(${m.rgb}, 0.6)` : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: on
                    ? `0 0 20px rgba(${m.rgb}, 0.30), inset 0 0 0 1px rgba(${m.rgb}, 0.45)`
                    : 'none',
                  transform: on ? 'translateY(-2px)' : 'translateY(0)',
                  opacity: dimmed ? 0.45 : 1,
                }}
              >
                {/* Mood orb — breathes slowly only when selected + motion is allowed
                   (the .ob-orb-breathe animation collapses under the global
                   prefers-reduced-motion reset; the class is also gated here). */}
                <div
                  aria-hidden="true"
                  className={`absolute -top-5 -right-5 w-20 h-20 rounded-full${on && !reduced ? ' ob-orb-breathe' : ''}`}
                  style={{
                    background: `radial-gradient(circle, rgba(${m.rgb}, ${on ? 0.45 : 0.18}), transparent 70%)`,
                    filter: 'blur(12px)',
                    transition: 'background 0.6s ease',
                  }}
                />
                <div className="relative mb-1.5">
                  <span className="ob-display text-lg font-bold text-white">{m.label}</span>
                </div>
                <p className="relative text-[12.5px] text-white/60 leading-snug">{m.desc}</p>
              </motion.button>
            )
          })}
        </div>
      </div>
    </StepShell>
  )
}
