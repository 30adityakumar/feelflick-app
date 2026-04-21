// src/app/pages/discover/components/QuestionSlot.jsx
import { AnimatePresence, motion } from 'framer-motion'

// === Vibe card gradient map ===
const VIBE_GRADIENTS = {
  curious_sharp:   'from-orange-500/20 to-red-600/10',
  curious_warm:    'from-amber-400/20 to-orange-500/10',
  cozy_warm:       'from-rose-400/20 to-amber-400/10',
  adventurous_any: 'from-cyan-400/20 to-blue-600/10',
  dark_sharp:      'from-indigo-600/25 to-slate-900/20',
  heartbroken_bs:  'from-pink-500/20 to-purple-600/10',
  silly_warm:      'from-lime-400/20 to-emerald-500/10',
  inspired_warm:   'from-yellow-400/20 to-orange-400/10',
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const cardVariant = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } },
}

const pillVariant = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
}

/**
 * Renders a single vibe card with ambient gradient background.
 *
 * @param {{ opt: Object, isSelected: boolean, onSelect: () => void }} props
 */
function VibeCard({ opt, isSelected, onSelect }) {
  const gradient = VIBE_GRADIENTS[opt.value] || 'from-purple-500/15 to-pink-500/10'

  return (
    <motion.button
      type="button"
      variants={cardVariant}
      onClick={onSelect}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      aria-pressed={isSelected}
      className={`
        relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-200
        bg-gradient-to-br ${gradient}
        ${isSelected
          ? 'ring-2 ring-purple-400 shadow-lg shadow-purple-500/20 scale-[1.02]'
          : 'ring-1 ring-white/[0.08] hover:ring-white/20'
        }
      `}
    >
      {/* Ambient glow on selection */}
      {isSelected && (
        <motion.div
          layoutId="vibe-glow"
          className="absolute inset-0 bg-gradient-to-br from-purple-500/15 to-pink-500/10"
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        />
      )}
      <span
        className={`relative block text-lg font-semibold tracking-tight ${isSelected ? 'text-white' : 'text-white/90'}`}
        style={{ fontFamily: 'var(--font-display, serif)' }}
      >
        {opt.label}
      </span>
      {opt.hint && (
        <span className="relative block text-[10px] uppercase tracking-wider text-white/40 mt-1">
          {opt.hint}
        </span>
      )}
    </motion.button>
  )
}

/**
 * Renders the currently active question with animated options.
 * Vibe question renders as a 2x4 card grid. Others render as pill buttons.
 *
 * @param {{ question: import('../questions').Question, currentValue: any,
 *           onAnswer: (questionId: string, value: any) => void }} props
 */
export default function QuestionSlot({ question, currentValue, onAnswer }) {
  const isVibe = question.id === 'vibe'

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="py-10"
      >
        {/* Question prompt */}
        <h2
          className="text-4xl sm:text-5xl font-bold tracking-tight mb-10 bg-gradient-to-r from-white via-white/90 to-purple-200 bg-clip-text text-transparent"
          style={{ fontFamily: 'var(--font-display, serif)' }}
        >
          {question.prompt}
        </h2>

        {/* Options */}
        {isVibe ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {question.options.map((opt) => (
              <VibeCard
                key={opt.value}
                opt={opt}
                isSelected={currentValue === opt.value}
                onSelect={() => onAnswer(question.id, opt.value)}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-wrap gap-3"
          >
            {question.options.map((opt) => {
              const isSelected = currentValue === opt.value

              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  variants={pillVariant}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onAnswer(question.id, opt.value)}
                  aria-pressed={isSelected}
                  className={`
                    rounded-full px-6 py-3 text-sm font-medium transition-all duration-200
                    ${isSelected
                      ? 'bg-gradient-to-r from-purple-500/25 to-pink-500/15 text-white ring-2 ring-purple-400/60 shadow-lg shadow-purple-500/10'
                      : 'bg-white/[0.04] ring-1 ring-white/[0.1] text-white/80 hover:ring-white/25 hover:bg-white/[0.06] hover:text-white'
                    }
                  `}
                >
                  <span>{opt.label}</span>
                  {opt.hint && (
                    <span className={`ml-2 text-[10px] ${isSelected ? 'text-white/50' : 'text-white/30'}`}>
                      {opt.hint}
                    </span>
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
