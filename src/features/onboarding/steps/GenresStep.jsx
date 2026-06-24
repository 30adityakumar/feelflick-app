import { motion, useReducedMotion } from 'framer-motion'

import { GENRES } from '@/features/onboarding/data'
import StepShell from '../components/StepShell'
import StepHeader from '../components/StepHeader'
import StepFooter from '../components/StepFooter'

const MIN_GENRES = 1
const containerVariants = { visible: { transition: { staggerChildren: 0.022 } } }
const tileVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
}

function GenreChoice({ genre, selected, onClick }) {
  const reduced = useReducedMotion()

  return (
    <motion.button
      type="button"
      onClick={onClick}
      variants={reduced ? undefined : tileVariants}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      aria-pressed={selected}
      className={`ob-genre-choice${selected ? ' is-selected' : ''}`}
    >
      {genre.name}
    </motion.button>
  )
}

export default function GenresStep({ selectedGenres, toggleGenre, onBack, onNext }) {
  const reduced = useReducedMotion()
  const count = selectedGenres.length
  const canContinue = count >= MIN_GENRES

  return (
    <StepShell
      header={
        <StepHeader
          onBack={onBack}
          kicker="Set the territory · 2 of 4"
          subcopy={<>Pick at least {MIN_GENRES} familiar territory. It guides the opening search, not the boundaries of your taste.</>}
        >
          Where should we <em>reach first?</em>
        </StepHeader>
      }
      footer={
        <StepFooter
          status={count === 0 ? 'Select at least 1 to continue' : `${count} selected`}
          onContinue={onNext}
          disabled={!canContinue}
        />
      }
    >
      <div className="ob-step-scroll">
        <motion.div
          className="ob-genre-grid"
          variants={reduced ? undefined : containerVariants}
          initial={reduced ? false : 'hidden'}
          animate="visible"
          role="group"
          aria-label="Genre territories"
        >
          {GENRES.map(genre => (
            <GenreChoice
              key={genre.id}
              genre={genre}
              selected={selectedGenres.includes(genre.id)}
              onClick={() => toggleGenre(genre.id)}
            />
          ))}
        </motion.div>
      </div>
    </StepShell>
  )
}
