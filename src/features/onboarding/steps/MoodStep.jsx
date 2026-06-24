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
          What feelings do you <em>return to?</em>
        </StepHeader>
      }
      footer={
        <StepFooter
          status={
            count === 0
              ? `Choose at least ${MIN_MOODS} mood${MIN_MOODS === 1 ? '' : 's'}`
              : count < MIN_MOODS
                ? `${count} selected — choose ${MIN_MOODS - count} more`
                : maxReached
                  ? `${count} selected — that is your maximum`
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
                className={`ob-mood-choice${selected ? ' is-selected' : ''}${dimmed ? ' is-dimmed' : ''}`}
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
