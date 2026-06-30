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

function GenreChoice({ genre, isSelected, onClick }) {
  const reduced = useReducedMotion()

  return (
    <motion.button
      type="button"
      onClick={onClick}
      variants={reduced ? undefined : tileVariants}
      whileTap={reduced ? undefined : { scale: 0.96 }}
      aria-pressed={isSelected}
      className={`ob-focus text-left rounded-2xl px-4 py-3.5 min-h-[44px] border transition-all ${
        isSelected
          ? 'bg-white/[0.10] border-white/45 shadow-[0_4px_16px_rgba(0,0,0,0.25),inset_0_0_0_1px_rgba(245,242,235,0.22)]'
          : 'bg-white/[0.05] border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-white/[0.08] hover:border-white/20'
      }`}
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
          Which{' '}
          <em className="italic font-light text-[var(--color-brand-accent-text,#ed7a87)]">
            territories
          </em>
          {' '}do you live in?
        </StepHeader>
      }
      footer={
        <StepFooter
          statusClassName={`text-xs font-medium transition-colors ${canContinue ? 'text-[var(--color-text-secondary,#c9c5bc)]' : 'text-white/30'}`}
          status={
            count === 0
              ? `Select at least ${MIN_GENRES} to continue`
              : count < MIN_GENRES
              ? `${count} selected — pick ${MIN_GENRES - count} more`
              : `${count} selected ✓`
          }
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
              isSelected={selectedGenres.includes(genre.id)}
              onClick={() => toggleGenre(genre.id)}
            />
          ))}
        </motion.div>
      </div>
    </StepShell>
  )
}
