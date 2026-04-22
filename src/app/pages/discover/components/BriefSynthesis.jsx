// src/app/pages/discover/components/BriefSynthesis.jsx
import { motion } from 'framer-motion'

import { QUESTION_SET } from '@/app/pages/discover/questions'

const VIBE_LABELS = Object.fromEntries(
  (QUESTION_SET.find(q => q.id === 'vibe')?.options || []).map(o => [o.value, o.label.toLowerCase()])
)
const ATTENTION_LABELS = { lean_in: 'lean-in', lean_back: 'lean-back' }
const TIME_LABELS = { short: 'under 90 minutes', medium: '90\u2013150 minute', long: '2.5-hour' }
const COMPANY_LABELS = { alone: 'solo viewing', partner: 'two', friends: 'friends', family: 'family' }

/**
 * Builds a one-sentence synthesis from brief answers.
 * Uses the 4-question brief: vibe, attention, time, company.
 *
 * @param {Record<string, any>} answers
 * @param {string[]} notes
 * @returns {string}
 */
export function buildSynthesis(answers, notes = []) {
  const parts = []

  // Vibe (primary mood descriptor)
  const vibe = VIBE_LABELS[answers.vibe]
  if (vibe) parts.push(vibe)

  // Attention
  const attention = ATTENTION_LABELS[answers.attention]
  if (attention) parts.push(attention)

  // Time (omit if 'any')
  const time = TIME_LABELS[answers.time]
  if (time) parts.push(time)

  // Assemble: "A {vibe}, {attention}, {time} pick for {company}"
  const descriptor = parts.length > 0 ? parts.join(', ') : 'open-minded'
  const company = COMPANY_LABELS[answers.company] ?? 'solo viewing'

  let sentence = `A ${descriptor} pick for ${company}.`

  // Notes
  if (notes.length > 0) {
    sentence += ` With notes: \u201C${notes[0]}\u201D`
  }

  return sentence
}

/**
 * One-sentence summary of the brief displayed at the top of results.
 *
 * @param {{ answers: Record<string, any>, notes?: string[] }} props
 */
export default function BriefSynthesis({ answers, notes }) {
  const synthesis = buildSynthesis(answers, notes)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="max-w-2xl mx-auto px-4 sm:px-6 pt-10 pb-6 text-center"
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-400/60 mb-3">
        Your brief
      </p>
      <h1 className="text-xl sm:text-2xl font-semibold tracking-tight leading-snug text-white/90">
        {synthesis}
      </h1>
    </motion.div>
  )
}
