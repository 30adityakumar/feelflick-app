// src/features/discover/resultPresentation.js
// Pure result-stage presentation helpers.

import { TIME_OPTIONS } from './constants'

// Map the primary mood id to the poster presentation properties still used by the
// one-pick result: a colour `cardFilter` and an `overlay` texture. (The old
// kenBurns / halo motion flags were removed in F3.8 — the poster no longer
// animates infinitely.)
export function moodFilter(moodId) {
  if (moodId === 'tense') return { cardFilter:'saturate(0.88)', overlay:'repeating-linear-gradient(0deg, rgba(239,68,68,0.04) 0px, rgba(239,68,68,0.04) 1px, transparent 1px, transparent 3px)' };
  if (moodId === 'cozy')  return { overlay:'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)' };
  if (moodId === 'mythic')return { overlay:'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.08), transparent 30%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.06), transparent 25%)' };
  if (moodId === 'bittersweet') return { cardFilter:'sepia(0.15) saturate(0.95)' };
  if (moodId === 'cerebral')    return { cardFilter:'hue-rotate(-6deg) saturate(0.95)' };
  return {};
}

// Honest runtime-fit line (F3.8). Returns a one-line claim ONLY when the film's
// runtime genuinely sits inside the user's chosen time band — no fuzzy tolerance,
// no fabricated fit. Reuses the existing TIME_OPTIONS [min, max] ranges (never a
// duplicated hardcoded band). Returns null when the time option is unknown, the
// runtime is missing / non-numeric, or it falls outside the chosen band.
//
// @param {{ time: string, runtime: number }} args
// @returns {string|null} e.g. "Within your ~ 2 hrs window." or null
export function buildRuntimeFitLine({ time, runtime }) {
  const option = TIME_OPTIONS.find(o => o.id === time)
  if (!option) return null
  if (!Number.isFinite(runtime)) return null
  const [min, max] = option.v
  if (runtime < min || runtime > max) return null
  return `Within your ${option.label} window.`
}
