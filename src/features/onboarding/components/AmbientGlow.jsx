// src/features/onboarding/components/AmbientGlow.jsx
// Two-color radial-gradient backdrop driven by the user's mood selection.
// Smoothly transitions between mood palettes as the user adds/removes selections.

import { useMemo } from 'react'

import { MOODS } from '../data'

const DEFAULT_PRIMARY = '46, 49, 53'   // neutral ink (surface-raised) — no mood selected
const DEFAULT_SECONDARY = '46, 49, 53' // neutral ink — no mood selected

function rgbForKey(key) {
  return MOODS.find(m => m.key === key)?.rgb ?? DEFAULT_PRIMARY
}

/**
 * Derive a single ambient mood SIGNATURE ("r, g, b") from the selected mood keys,
 * for the onboarding wrapper's atmospheric tinting (CSS vars). This is distinct
 * from the dual-radial glow this component renders (left untouched so the shared
 * AmbientGlow — also used by CelebrationReveal — is byte-identical).
 *
 * Rules: 0 moods → neutral ink; 1 → that mood's existing rgb; ≥2 →
 * a deterministic, order-independent component-wise average. Mood keys, labels,
 * and meaning are not changed; only existing rgb data is read.
 *
 * @param {string[]} moods — onboarding mood keys
 * @returns {string}        — "r, g, b" for use in rgba()
 */
export function deriveMoodSignature(moods = []) {
  const rgbs = (moods || [])
    .map(key => MOODS.find(m => m.key === key)?.rgb)
    .filter(Boolean)
    .map(s => s.split(',').map(n => Number(n.trim())))
  if (rgbs.length === 0) return DEFAULT_PRIMARY
  if (rgbs.length === 1) return rgbs[0].join(', ')
  const avg = [0, 1, 2].map(i => Math.round(rgbs.reduce((sum, c) => sum + c[i], 0) / rgbs.length))
  return avg.join(', ')
}

export default function AmbientGlow({ moods = [] }) {
  const { primary, secondary } = useMemo(() => {
    if (moods.length === 0) return { primary: DEFAULT_PRIMARY, secondary: DEFAULT_SECONDARY }
    if (moods.length === 1) {
      const r = rgbForKey(moods[0])
      return { primary: r, secondary: r }
    }
    return { primary: rgbForKey(moods[0]), secondary: rgbForKey(moods[1]) }
  }, [moods])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 30% 20%, rgba(${primary}, 0.32) 0%, transparent 60%),
          radial-gradient(ellipse 70% 50% at 80% 80%, rgba(${secondary}, 0.22) 0%, transparent 60%)
        `,
        transition: 'background 1.4s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    />
  )
}
