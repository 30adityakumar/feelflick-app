// src/app/pages/discover/questions.js
/**
 * Mood Brief question definitions — 4-question streamlined flow.
 * Each question collects one dimension of the user's viewing intent.
 *
 * The 'vibe' question merges the old feeling + tone into a single card pick.
 * Energy is inferred from the vibe card. Era and familiarity are removed —
 * era uses the user's profile era_floor, familiarity defaults to exclude watched.
 *
 * @typedef {{ value: string, label: string, hint?: string, feeling?: string, tone?: string }} VibeOption
 * @typedef {{ value: string, label: string, hint?: string }} QuestionOption
 * @typedef {{ id: string, prompt: string, options: (VibeOption|QuestionOption)[] }} Question
 */

export const QUESTION_SET = [
  {
    id: 'vibe',
    label: 'Vibe',
    prompt: "What's the vibe?",
    options: [
      { value: 'curious_sharp',   feeling: 'curious',     tone: 'sharp',       label: 'Curious & Sharp',   hint: 'thinkers, mysteries' },
      { value: 'curious_warm',    feeling: 'curious',     tone: 'warm',        label: 'Curious & Warm',    hint: 'wonder, discovery' },
      { value: 'cozy_warm',       feeling: 'cozy',        tone: 'warm',        label: 'Cozy',              hint: 'comfort, gentle' },
      { value: 'adventurous_any', feeling: 'adventurous', tone: 'any',         label: 'Adventurous',       hint: 'big, bold, epic' },
      { value: 'dark_sharp',      feeling: 'dark',        tone: 'sharp',       label: 'Dark & Sharp',      hint: 'crime, noir, tense' },
      { value: 'heartbroken_bs',  feeling: 'heartbroken', tone: 'bittersweet', label: 'Melancholy',        hint: 'tearjerkers, drama' },
      { value: 'silly_warm',      feeling: 'silly',       tone: 'warm',        label: 'Silly & Fun',       hint: 'comedy, levity' },
      { value: 'inspired_warm',   feeling: 'inspired',    tone: 'warm',        label: 'Inspired',          hint: 'uplift, true stories' },
    ],
  },
  {
    id: 'attention',
    label: 'Attention',
    prompt: 'Lean in or lean back?',
    options: [
      { value: 'lean_in',   label: 'Lean in',   hint: 'full attention' },
      { value: 'lean_back', label: 'Lean back', hint: 'easy to follow' },
    ],
  },
  {
    id: 'time',
    label: 'Time',
    prompt: 'How long do you have?',
    options: [
      { value: 'short',  label: '~90 min' },
      { value: 'medium', label: '~2 hours' },
      { value: 'long',   label: '2.5+ hours' },
      { value: 'any',    label: 'Whatever' },
    ],
  },
  {
    id: 'company',
    label: 'Company',
    prompt: 'Watching with?',
    options: [
      { value: 'alone',   label: 'Alone' },
      { value: 'partner', label: 'Partner' },
      { value: 'friends', label: 'Friends' },
      { value: 'family',  label: 'Family' },
    ],
  },
]

/** Optional film-anchor step shown after all questions. */
export const OPTIONAL_ANCHOR = {
  id: 'anchor',
  prompt: 'Name a film that matches your mood right now',
  type: 'film-autocomplete',
  skippable: true,
}
