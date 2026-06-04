// src/features/home/WhyThisPick.jsx
// The Briefing's "makes its case" layer (F5). Renders the engine's grounded
// reason for a pick (`film.engineReason` = scoreMovieForUser → pickReason.label,
// e.g. "Because you loved Parasite") as a small, honest callout.
//
// NULL-SAFE BY DESIGN: when no reason exists (cold-start / no profile) it renders
// NOTHING — we never fabricate a "why". A pick without a real case simply shows
// its slot label + synopsis instead.

import Eyebrow from '@/shared/ui/Eyebrow'
import { HP } from './data'

/**
 * @param {object} props
 * @param {string|null} props.reason  The engine's pick reason (may be null/empty).
 * @param {string} [props.accent]     Accent hue (defaults to brand purple).
 * @param {string} [props.className]
 * @param {object} [props.style]      Merged onto the root (margins/positioning).
 * @returns {JSX.Element|null}
 */
export default function WhyThisPick({ reason, accent = HP.purple, className = '', style }) {
  const text = typeof reason === 'string' ? reason.trim() : ''
  if (!text) return null
  return (
    <div
      className={className}
      style={{
        marginBottom: 14,
        padding: '10px 14px',
        borderRadius: 8,
        background: `${accent}0d`,
        border: `1px solid ${accent}26`,
        ...style,
      }}
    >
      <Eyebrow color={accent} size={10} style={{ marginBottom: 5 }}>Why this pick</Eyebrow>
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 'clamp(13px, 1vw, 14.5px)',
          lineHeight: 1.5,
          color: HP.textSoft,
          margin: 0,
          textWrap: 'pretty',
        }}
      >
        {text}
      </p>
    </div>
  )
}
