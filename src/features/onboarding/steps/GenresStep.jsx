// src/features/onboarding/steps/GenresStep.jsx
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

import Button from '@/shared/ui/Button'

// === GENRE DEFINITIONS ===

export const GENRES = [
  { id: 28,    name: 'Action',      dbName: 'Action'           },
  { id: 12,    name: 'Adventure',   dbName: 'Adventure'        },
  { id: 16,    name: 'Animation',   dbName: 'Animation'        },
  { id: 35,    name: 'Comedy',      dbName: 'Comedy'           },
  { id: 80,    name: 'Crime',       dbName: 'Crime'            },
  { id: 99,    name: 'Documentary', dbName: 'Documentary'      },
  { id: 18,    name: 'Drama',       dbName: 'Drama'            },
  { id: 10751, name: 'Family',      dbName: 'Family'           },
  { id: 14,    name: 'Fantasy',     dbName: 'Fantasy'          },
  { id: 36,    name: 'History',     dbName: 'History'          },
  { id: 27,    name: 'Horror',      dbName: 'Horror'           },
  { id: 10402, name: 'Music',       dbName: 'Music'            },
  { id: 9648,  name: 'Mystery',     dbName: 'Mystery'          },
  { id: 10749, name: 'Romance',     dbName: 'Romance'          },
  { id: 878,   name: 'Sci-Fi',      dbName: 'Science Fiction'  },
  { id: 53,    name: 'Thriller',    dbName: 'Thriller'         },
]

const MIN_GENRES = 3

// === ANIMATION VARIANTS ===

const containerVariants = {
  visible: { transition: { staggerChildren: 0.03 } },
}

const pillVariants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
}

// === GENRE PILL ===

function GenrePill({ genre, isSelected, onClick }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.button
      type="button"
      onClick={onClick}
      variants={prefersReducedMotion ? undefined : pillVariants}
      whileTap={{ scale: 0.95 }}
      animate={isSelected ? { scale: 1.05 } : { scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      aria-pressed={isSelected}
      aria-label={genre.name}
      className={`w-full rounded-full px-6 py-3 text-sm font-semibold transition-all duration-150 border focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
        isSelected
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-transparent text-white shadow-lg shadow-purple-500/20'
          : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
      }`}
    >
      {genre.name}
    </motion.button>
  )
}

// === MAIN COMPONENT ===

/**
 * Onboarding step 1: genre selection.
 * @param {{ selectedGenres: number[], toggleGenre: (id: number) => void, onNext: () => void, firstName: string | null }} props
 */
export default function GenresStep({ selectedGenres, toggleGenre, onNext, firstName }) {
  const prefersReducedMotion = useReducedMotion()
  const count = selectedGenres.length
  const canContinue = count >= MIN_GENRES

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none px-6 pt-8 pb-5">
        {firstName && (
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400/60 mb-3">
            Hey {firstName} —
          </p>
        )}
        <h2 className="text-5xl font-black tracking-tight text-white leading-[1.05]">
          What draws you in?
        </h2>
        <p className="text-base text-white/60 mt-2 leading-relaxed">
          Pick 3 or more genres you actually watch.
        </p>
      </div>

      {/* Genre pills */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto pb-4"
          variants={prefersReducedMotion ? undefined : containerVariants}
          initial={prefersReducedMotion ? false : 'hidden'}
          animate="visible"
        >
          {GENRES.map((g) => (
            <GenrePill
              key={g.id}
              genre={g}
              isSelected={selectedGenres.includes(g.id)}
              onClick={() => toggleGenre(g.id)}
            />
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="flex-none px-6 pb-8 pt-4 border-t border-white/[0.06]">
        <div className="max-w-sm mx-auto flex flex-col items-center gap-3">
          <p className={`text-xs font-medium transition-colors duration-200 ${
            canContinue ? 'text-purple-400' : 'text-white/30'
          }`}>
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
