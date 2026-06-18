// src/features/discover/constants.js
// F3.3 — presentation constants extracted VERBATIM from Discover.jsx: the local
// HP token extension (deeper Discover purple/surface/paper) + the Stage-2 option
// tables. Values/order/ids/labels/subcopy/runtime-bands/icons unchanged.

import { HP as baseHP } from '@/shared/lib/tokens'

export const HP = { ...baseHP, purpleDeep: 'var(--color-text-muted, #9333ea)', surface: 'var(--color-surface-1, #1d1814)', paper: 'var(--color-surface-2, #241e19)' }

export const TIME_OPTIONS = [
  { id:'short', label:'~ 90 min', sub:'A quick one',  v:[60,99] },
  { id:'std',   label:'~ 2 hrs',  sub:'Just right',   v:[100,130] },
  { id:'long',  label:'~ 2.5 hrs',sub:'Settle in',    v:[131,160] },
  { id:'epic',  label:'3 hrs+',   sub:'Cinematic',    v:[161,300] },
];
export const WHO_OPTIONS = [
  { id:'alone',   label:'Alone',     sub:'My night',     icon:'○' },
  { id:'partner', label:'Partner',   sub:'Just us two',  icon:'○○' },
  { id:'friends', label:'Friends',   sub:'A few',        icon:'○○○' },
];
export const ENERGY_OPTIONS = [
  { id:'wiped',  label:'Wiped',  sub:'Comfort, please' },
  { id:'steady', label:'Steady', sub:'Open to anything' },
  { id:'wired',  label:'Wired',  sub:'Give me edges' },
];
export const INTENTIONS = [
  { id:'distract', label:'Distract me',    sub:'Take me out of my head' },
  { id:'move',     label:'Move me',        sub:'I want to feel something' },
  { id:'think',    label:'Make me think',  sub:'I want to chew on it' },
  { id:'laugh',    label:'Make me laugh',  sub:'Lift me up' },
  { id:'surprise', label:'Surprise me',    sub:'Show me something new' },
  { id:'comfort',  label:'Comfort me',     sub:'No surprises, please' },
];
