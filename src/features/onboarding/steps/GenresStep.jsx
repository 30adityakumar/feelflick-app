// src/features/onboarding/steps/GenresStep.jsx
// Restyled genre picker — gradient outline tiles.

import { motion, useReducedMotion } from 'framer-motion'

import { GENRES } from '@/features/onboarding/data'
import StepShell from '../components/StepShell'
import StepHeader from '../components/StepHeader'
import StepFooter from '../components/StepFooter'

const MIN_GENRES = 1

const containerVariants = { visible: { transition: { staggerChildren: 0.025 } } }
const tileVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
}

function GenreTile({ genre, isSelected, onClick }) {
  const reduced = useReducedMotion()
  return (
    <motion.button
      type="button"
      onClick={onClick}
      variants={reduced ? undefined : tileVariants}
      whileTap={{ scale: 0.96 }}
      aria-pressed={isSelected}
      className={`text-left rounded-2xl px-4 py-3.5 border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
        isSelected
          ? 'bg-linear-to-br from-purple-500/18 to-pink-500/12 border-purple-400/50 shadow-[0_4px_16px_rgba(168,85,247,0.16)]'
          : 'bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/16'
      }`}
    >
      <div className="ob-display text-[15px] font-bold text-white mb-0.5">{genre.name}</div>
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
          className="flex-none px-5 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-5"
          onBack={onBack}
          kicker="The territories · 2 of 4"
          subcopy={<>Pick at least {MIN_GENRES} — this steers what we reach for first. Nothing&apos;s
          locked in; you can always add more later.</>}
          subcopyClassName="text-[13px] sm:text-sm md:text-[15px] text-white/55 mt-2 sm:mt-3 leading-relaxed max-w-xl"
        >
          Which{' '}
          <em className="italic font-light text-purple-300">
            territories
          </em>
          {' '}do you live in?
        </StepHeader>
      }
      footer={
        <StepFooter
          statusClassName={`text-xs font-medium transition-colors ${canContinue ? 'text-purple-400' : 'text-white/30'}`}
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
      <div className="ob-scroll flex-1 min-h-0 overflow-y-auto px-5 pb-4 sm:px-6">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 max-w-3xl mx-auto px-1 py-2"
          variants={reduced ? undefined : containerVariants}
          initial={reduced ? false : 'hidden'}
          animate="visible"
        >
          {GENRES.map(g => (
            <GenreTile
              key={g.id}
              genre={g}
              isSelected={selectedGenres.includes(g.id)}
              onClick={() => toggleGenre(g.id)}
            />
          ))}
        </motion.div>
      </div>
    </StepShell>
  )
}
