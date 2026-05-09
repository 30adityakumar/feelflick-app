// src/features/onboarding-v2/data.js
// Mood definitions used by Step 1 (Mood baseline) and the ambient-glow.
// Keep RGB triplets — the glow composes them as `rgba(${rgb}, alpha)`.

export const MOODS = [
  { key: 'cozy',   label: 'Cozy',   desc: 'Warm, low-stakes, comfort food', rgb: '236, 72, 153' },
  { key: 'wired',  label: 'Wired',  desc: 'Cerebral, plot-y, reward focus', rgb: '168, 85, 247' },
  { key: 'tender', label: 'Tender', desc: 'Sad in a good way',              rgb: '192, 132, 252' },
  { key: 'fun',    label: 'Fun',    desc: 'Light, plot-driven, escapist',   rgb: '244, 114, 182' },
  { key: 'tense',  label: 'Tense',  desc: 'Thrillers, slow-burn dread',     rgb: '129, 140, 248' },
  { key: 'mythic', label: 'Mythic', desc: 'Epic, big-canvas, lyrical',      rgb: '251, 191, 36' },
]

export const MIN_MOODS = 2
export const MAX_MOODS = 3

// Local-storage key — consumed downstream by the home page if you wire it up.
export const MOODS_LS_KEY = 'ff_onboarding_v2_moods'
