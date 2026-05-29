// src/app/pages/discover/components/QuestionSlot.jsx
import { AnimatePresence, motion } from 'framer-motion'

// === ANIMATION VARIANTS ===

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

// === VIBE CARD ===
// Unselected: neutral glass (matching landing/onboarding pill tokens).
// Selected: brand gradient from-purple-500 to-pink-500 (exact landing token).

/**
 * @param {{ opt: Object, isSelected: boolean, onSelect: () => void }} props
 */
function VibeCard({ opt, isSelected, onSelect }) {
  return (
    <motion.button
      type="button"
      variants={cardVariant}
      onClick={onSelect}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      aria-pressed={isSelected}
      className={`
        relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-200 border
        ${isSelected
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-transparent shadow-lg shadow-purple-500/20 scale-[1.02]'
          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
        }
      `}
    >
      <span className={`relative block text-lg font-semibold tracking-tight ${isSelected ? 'text-white' : 'text-white/80'}`}>
        {opt.label}
      </span>
      {opt.hint && (
        <span className={`relative block text-[10px] uppercase tracking-wider mt-1 ${isSelected ? 'text-white/60' : 'text-white/40'}`}>
          {opt.hint}
        </span>
      )}
    </motion.button>
  )
}

// === QUESTION SLOT ===

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
        {/* Question prompt — matches landing headline weight/tracking */}
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-[1.05] mb-10">
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
                    rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 border
                    ${isSelected
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-transparent text-white shadow-lg shadow-purple-500/20'
                      : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20 hover:text-white'
                    }
                  `}
                >
                  <span>{opt.label}</span>
                  {opt.hint && (
                    <span className={`ml-2 text-[10px] ${isSelected ? 'text-white/60' : 'text-white/30'}`}>
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
