// src/shared/components/MoodPill.jsx
import { HP } from '@/shared/lib/tokens'

/**
 * Canonical mood/tone indicator — ONE source of truth for the mood-tag pill that
 * was reimplemented across browse (a tinted pill + a dark over-poster variant).
 *
 * The mood `color` stays a prop because it's the whole point — each tag carries its
 * own mood hex; it falls back to brand purple when a surface only has the label.
 * Mood tags are micro-labels, so the face is Inter (per the editorial language).
 *
 * @param {object} props
 * @param {string} props.label              The mood/tone label (e.g. "Tense").
 * @param {string} [props.color=HP.purple]  The mood's accent hex.
 * @param {'solid'|'overlay'} [props.variant='solid']
 *   • solid   — tinted pill (`${color}1a` bg / `${color}44` border / color text).
 *   • overlay — same pill on a dark blurred bg, for legibility over a poster.
 * @param {object} [props.style]            Merged onto the root (positioning / margins).
 * @returns {JSX.Element|null}
 */
export default function MoodPill({ label, color = HP.purple, variant = 'solid', style, ...props }) {
  if (!label) return null

  const overlay = variant === 'overlay'
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 9px', borderRadius: 999,
        background: overlay ? 'rgba(0,0,0,0.72)' : `${color}1a`,
        backdropFilter: overlay ? 'blur(6px)' : undefined,
        border: `1px solid ${color}44`, color,
        fontFamily: 'Inter', fontSize: 11, fontWeight: 600,
        ...style,
      }}
      {...props}
    >
      {label}
    </span>
  )
}
