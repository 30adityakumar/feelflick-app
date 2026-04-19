// src/app/pages/discover/questions.js
/**
 * Mood Brief question definitions.
 * Each question collects one dimension of the user's viewing intent.
 *
 * @typedef {{ value: number|string, label: string, hint?: string }} QuestionOption
 * @typedef {{ id: string, label: string, prompt: string, type: string, options: QuestionOption[] }} Question
 */

export const QUESTION_SET = [
  {
    id: 'feeling',
    label: 'FEELING',
    prompt: 'How do you want to feel?',
    type: 'single-select',
    options: [
      { value: 1,  label: 'Cozy',        hint: 'Warm and comforting' },
      { value: 2,  label: 'Adventurous', hint: 'Bold and exciting' },
      { value: 3,  label: 'Heartbroken', hint: 'Emotionally raw' },
      { value: 4,  label: 'Curious',     hint: 'Mind-expanding' },
      { value: 5,  label: 'Nostalgic',   hint: 'Classic favorites' },
      { value: 6,  label: 'Energized',   hint: 'High-energy fun' },
      { value: 7,  label: 'Anxious',     hint: 'Need something calming' },
      { value: 8,  label: 'Romantic',    hint: 'Love and connection' },
      { value: 9,  label: 'Inspired',    hint: 'Uplifting stories' },
      { value: 10, label: 'Silly',       hint: 'Light and funny' },
      { value: 11, label: 'Dark',        hint: 'Gritty and intense' },
      { value: 12, label: 'Overwhelmed', hint: 'Complete escape' },
    ],
  },
  {
    id: 'energy',
    label: 'ENERGY',
    prompt: 'What energy level are you after?',
    type: 'single-select',
    options: [
      { value: 1, label: 'Low',    hint: 'Gentle, slow pace' },
      { value: 3, label: 'Medium', hint: 'Balanced rhythm' },
      { value: 5, label: 'High',   hint: 'Fast, intense' },
    ],
  },
  {
    id: 'attention',
    label: 'ATTENTION',
    prompt: 'How much attention do you want to give?',
    type: 'single-select',
    options: [
      { value: 'lean-in',  label: 'Lean in',  hint: 'Dense, demanding' },
      { value: 'lean-back', label: 'Lean back', hint: 'Effortless' },
      { value: 'either',   label: 'Either' },
    ],
  },
  {
    id: 'tone',
    label: 'TONE',
    prompt: 'What tone fits right now?',
    type: 'single-select',
    options: [
      { value: 'warm',       label: 'Warm' },
      { value: 'sharp',      label: 'Sharp' },
      { value: 'bittersweet', label: 'Bittersweet' },
      { value: 'any',        label: 'Any' },
    ],
  },
  {
    id: 'company',
    label: 'COMPANY',
    prompt: 'Who are you watching with?',
    type: 'single-select',
    options: [
      { value: 'alone',   label: 'Alone' },
      { value: 'partner', label: 'Partner' },
      { value: 'friends', label: 'Friends' },
      { value: 'family',  label: 'Family' },
    ],
  },
  {
    id: 'time',
    label: 'TIME',
    prompt: 'How much time do you have?',
    type: 'single-select',
    options: [
      { value: 'short',    label: 'Under 90 min' },
      { value: 'standard', label: '90 \u2013 150 min' },
      { value: 'long',     label: '150+ min welcome' },
      { value: 'any',      label: 'Any' },
    ],
  },
  {
    id: 'familiarity',
    label: 'FAMILIARITY',
    prompt: 'What kind of discovery?',
    type: 'single-select',
    options: [
      { value: 'comfort',  label: 'Comfort',    hint: 'Known-feeling films' },
      { value: 'new',      label: 'New to me' },
      { value: 'surprise', label: 'Surprise me' },
    ],
  },
  {
    id: 'era',
    label: 'ERA',
    prompt: 'Any era preference?',
    type: 'single-select',
    options: [
      { value: 'modern',  label: 'Modern',  hint: '2015+' },
      { value: 'recent',  label: 'Recent',  hint: '2000+' },
      { value: 'classic', label: 'Classic', hint: 'Pre-2000' },
      { value: 'any',     label: 'Any' },
    ],
  },
]

/** Optional film-anchor step shown after all 8 questions. */
export const OPTIONAL_ANCHOR = {
  id: 'anchor',
  prompt: 'Name a film that matches your mood right now',
  type: 'film-autocomplete',
  skippable: true,
}
