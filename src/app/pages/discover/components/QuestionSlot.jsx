// src/app/pages/discover/components/QuestionSlot.jsx
import { motion } from 'framer-motion'

const PILL_DEFAULT = 'rounded-full border border-white/20 bg-white/[0.02] px-5 py-2.5 text-sm text-white/80 hover:border-white/40 hover:text-white transition-colors'
const PILL_SELECTED = 'rounded-full border border-transparent bg-gradient-to-r from-purple-500/20 to-pink-500/10 px-5 py-2.5 text-sm text-white ring-1 ring-purple-400/50'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const pillVariant = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

/**
 * Renders the currently active question with selectable pill options.
 *
 * @param {{ question: import('../questions').Question, currentValue: any,
 *           onAnswer: (questionId: string, value: any) => void }} props
 */
export default function QuestionSlot({ question, currentValue, onAnswer }) {
  // Feeling question renders as a 3-column grid instead of inline wrap
  const isFeeling = question.id === 'feeling'

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="py-12"
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-400/60 mb-4">
        {question.label}
      </p>
      <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white mb-10">
        {question.prompt}
      </h2>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className={isFeeling ? 'grid grid-cols-2 sm:grid-cols-3 gap-2' : 'flex flex-wrap gap-2'}
      >
        {question.options.map((opt) => {
          const isSelected = currentValue === opt.value

          return (
            <motion.button
              key={opt.value}
              type="button"
              variants={pillVariant}
              onClick={() => onAnswer(question.id, opt.value)}
              aria-pressed={isSelected}
              className={isSelected ? PILL_SELECTED : PILL_DEFAULT}
            >
              <span>{opt.label}</span>
              {opt.hint && (
                <span className="text-[10px] text-white/40 ml-2">{opt.hint}</span>
              )}
            </motion.button>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
