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
    setMoods(previous => {
      if (previous.includes(key)) return previous.filter(value => value !== key)
      if (previous.length >= MAX_MOODS) return previous
      return [...previous, key]
    })
  }

  return (
    <StepShell
      header={
        <StepHeader
          kicker={`${firstName ? `Hey ${firstName} — ` : ''}start with instinct · 1 of 4`}
          subcopy={<>Choose {MIN_MOODS}–{MAX_MOODS} emotional territories you genuinely enjoy in films. This is not tonight&apos;s mood; it is the kind of experience you often want cinema to create.</>}
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
              ? `Choose at least ${MIN_MOODS} mood${MIN_MOODS === 1 ? '' : 's'}`
              : count < MIN_MOODS
                ? `${count} selected — choose ${MIN_MOODS - count} more`
                : maxReached
                  ? `${count} selected — that's your max`
                  : `${count} selected`
          }
          onContinue={onNext}
          disabled={!canContinue}
        />
      }
    >
      <div className="ob-step-scroll">
        <p className="sr-only" aria-live="polite">
          {maxReached ? `You have selected the maximum of ${MAX_MOODS} moods. Unpick one to choose another.` : ''}
        </p>
        <div className="ob-mood-grid" role="group" aria-label="Emotional territories">
          {MOODS.map(mood => {
            const selected = moods.includes(mood.key)
            const dimmed = maxReached && !selected

            return (
              <motion.button
                key={mood.key}
                type="button"
                onClick={() => toggle(mood.key)}
                whileTap={reduced ? undefined : { scale: 0.98 }}
                aria-pressed={selected}
                aria-disabled={dimmed || undefined}
                className={`ob-focus relative text-left p-4 sm:p-5 rounded-2xl overflow-hidden transition-all ${dimmed ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                style={{
                  '--mood-rgb': mood.rgb,
                  background: selected ? `rgba(${mood.rgb}, 0.11)` : undefined,
                  borderColor: selected ? `rgba(${mood.rgb}, 0.58)` : undefined,
                }}
              >
                <span className={`ob-mood-orb${selected && !reduced ? ' ob-orb-breathe' : ''}`} aria-hidden="true" />
                <strong>{mood.label}</strong>
                <span>{mood.desc}</span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </StepShell>
  )
}
