import { useMemo } from 'react'

import { MOODS } from '../data'

const DEFAULT_PRIMARY = '122, 126, 133'
const DEFAULT_SECONDARY = '201, 139, 146'

function rgbForKey(key) {
  return MOODS.find(mood => mood.key === key)?.rgb ?? DEFAULT_PRIMARY
}

export function deriveMoodSignature(moods = []) {
  const rgbs = moods
    .map(key => MOODS.find(mood => mood.key === key)?.rgb)
    .filter(Boolean)
    .map(value => value.split(',').map(channel => Number(channel.trim())))

  if (rgbs.length === 0) return DEFAULT_PRIMARY
  if (rgbs.length === 1) return rgbs[0].join(', ')

  return [0, 1, 2]
    .map(index => Math.round(rgbs.reduce((sum, channels) => sum + channels[index], 0) / rgbs.length))
    .join(', ')
}

export default function AmbientGlow({ moods = [] }) {
  const colors = useMemo(() => {
    if (moods.length === 0) return [DEFAULT_PRIMARY, DEFAULT_SECONDARY]
    if (moods.length === 1) {
      const color = rgbForKey(moods[0])
      return [color, color]
    }
    return [rgbForKey(moods[0]), rgbForKey(moods[1])]
  }, [moods])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        background: `radial-gradient(ellipse 82% 64% at 78% 22%, rgba(${colors[0]}, 0.13) 0%, transparent 64%), radial-gradient(ellipse 68% 54% at 12% 88%, rgba(${colors[1]}, 0.07) 0%, transparent 66%)`,
        transition: 'background 1.1s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    />
  )
}
