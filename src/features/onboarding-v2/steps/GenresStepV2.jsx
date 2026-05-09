// src/features/onboarding-v2/steps/GenresStepV2.jsx
// Restyled genre picker — gradient outline tiles. Reuses GENRES export from the legacy step.

import { motion, useReducedMotion } from 'framer-motion'
import { ChevronRight, ChevronLeft } from 'lucide-react'

import Button from '@/shared/ui/Button'
import { GENRES } from '@/features/onboarding/steps/GenresStep'

const MIN_GENRES = 3

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
          ? 'bg-gradient-to-br from-purple-500/[0.18] to-pink-500/[0.12] border-purple-400/50 shadow-[0_4px_16px_rgba(168,85,247,0.16)]'
          : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.16]'
      }`}
    >
      <div className="ob-display text-[15px] font-bold text-white mb-0.5">{genre.name}</div>
    </motion.button>
  )
}

export default function GenresStepV2({ selectedGenres, toggleGenre, onBack, onNext }) {
  const reduced = useReducedMotion()
  const count = selectedGenres.length
  const canContinue = count >= MIN_GENRES

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none px-6 pt-6 pb-5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-purple-400/85 mb-3">
          Genres · 2 of 4
        </p>
        <h2 className="ob-display text-5xl font-extrabold text-white leading-[1.05]">
          Which{' '}
          <em className="not-italic bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent italic">
            territories
          </em>
          {' '}do you live in?
        </h2>
        <p className="text-base text-white/55 mt-3 leading-relaxed max-w-xl">
          Pick at least {MIN_GENRES}. You can always add more later.
        </p>
      </div>

      <div className="ob-scroll flex-1 min-h-0 overflow-y-auto px-6 pb-4">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-3xl mx-auto"
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

      <div className="flex-none px-6 pb-8 pt-4 border-t border-white/[0.06]">
        <div className="max-w-sm mx-auto flex flex-col items-center gap-3">
          <p className={`text-xs font-medium transition-colors ${canContinue ? 'text-purple-400' : 'text-white/30'}`}>
            {count === 0
              ? `Select at least ${MIN_GENRES} to continue`
              : count < MIN_GENRES
              ? `${count} selected — pick ${MIN_GENRES - count} more`
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
