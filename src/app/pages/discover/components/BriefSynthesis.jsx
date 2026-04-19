// src/app/pages/discover/components/BriefSynthesis.jsx

const ENERGY_LABELS = { 1: 'low-energy', 3: 'medium-energy', 5: 'high-energy' }
const TONE_LABELS = { warm: 'warm', sharp: 'sharp', bittersweet: 'bittersweet' }
const TIME_LABELS = { short: 'under 90 minutes', standard: '90\u2013150 minute', long: '2.5-hour' }
const COMPANY_LABELS = { alone: 'solo viewing', partner: 'two', friends: 'friends', family: 'family' }
const ERA_LABELS = { modern: 'modern cinema', recent: '2000s and later', classic: 'pre-2000 cinema', any: 'no era preference' }

/**
 * Builds a one-sentence synthesis from brief answers.
 *
 * @param {Record<string, any>} answers
 * @param {string[]} notes
 * @returns {string}
 */
export function buildSynthesis(answers, notes = []) {
  const parts = []

  // Energy
  const energy = ENERGY_LABELS[answers.energy] ?? 'medium-energy'
  parts.push(energy)

  // Tone (omit if 'any')
  const tone = TONE_LABELS[answers.tone]
  if (tone) parts.push(tone)

  // Time (omit if 'any')
  const time = TIME_LABELS[answers.time]
  if (time) parts.push(time)

  // Assemble: "A {energy}, {tone}, {time} pick for {company}"
  const descriptor = parts.join(', ')
  const company = COMPANY_LABELS[answers.company] ?? 'solo viewing'
  const companyPhrase = answers.company === 'alone'
    ? `pick for ${company}`
    : `pick for ${company}`

  let sentence = `A ${descriptor} ${companyPhrase}`

  // Era
  const era = ERA_LABELS[answers.era]
  if (era && answers.era !== 'any') {
    sentence += `, ${era}`
  } else if (era) {
    sentence += `, ${era}`
  }

  sentence += '.'

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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-10 pb-6 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-400/60 mb-3">
        Your brief
      </p>
      <h1 className="text-xl sm:text-2xl font-light text-white/90 tracking-tight leading-snug">
        {synthesis}
      </h1>
    </div>
  )
}
