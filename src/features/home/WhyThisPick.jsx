// src/features/home/WhyThisPick.jsx
// The Briefing's "makes its case" layer (F5). Renders the engine's grounded
// reason for a pick (`film.engineReason` = scoreMovieForUser → pickReason.label,
// e.g. "Because you loved Parasite") as a small, honest callout.
//
// NULL-SAFE BY DESIGN: when no reason exists (cold-start / no profile) it renders
// NOTHING — we never fabricate a "why". A pick without a real case simply shows
// its slot label + synopsis instead.
//
// SURFACE (F11B.4): the brand-purple accent surface now comes from the shared
// <AccentPanel tone="purple"> primitive (was an inline `${accent}0d` tint) —
// byte-identical render; the `accent` prop now only colors the eyebrow.

import AccentPanel from '@/shared/ui/AccentPanel'
import Eyebrow from '@/shared/ui/Eyebrow'
import { HP } from './data'

/**
 * @param {object} props
 * @param {string|null} props.reason  The engine's pick reason (may be null/empty).
 * @param {string} [props.accent]     Eyebrow accent hue (defaults to brand purple).
 * @param {string} [props.className]
 * @param {object} [props.style]      Merged onto the root (margins/positioning).
 * @returns {JSX.Element|null}
 */
export default function WhyThisPick({ reason, accent = HP.purple, className = '', style }) {
  const text = typeof reason === 'string' ? reason.trim() : ''
  if (!text) return null
  return (
    <AccentPanel
      tone="purple"
      radius="md"
      className={className}
      style={{ marginBottom: 14, padding: '10px 14px', ...style }}
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
    </AccentPanel>
  )
}
