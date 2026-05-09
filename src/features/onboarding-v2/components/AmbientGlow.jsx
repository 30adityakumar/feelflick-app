// src/features/onboarding-v2/components/AmbientGlow.jsx
// Two-color radial-gradient backdrop driven by the user's mood selection.
// Smoothly transitions between mood palettes as the user adds/removes selections.

import { useMemo } from 'react'

import { MOODS } from '../data'

const DEFAULT_PRIMARY = '168, 85, 247'   // purple
const DEFAULT_SECONDARY = '236, 72, 153' // pink

function rgbForKey(key) {
  return MOODS.find(m => m.key === key)?.rgb ?? DEFAULT_PRIMARY
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
