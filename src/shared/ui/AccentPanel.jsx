// src/shared/ui/AccentPanel.jsx
import './AccentPanel.css'
import { HP, RADIUS } from '@/shared/lib/tokens'

// Approved tones only — the brand hues (purple/pink) + the load-bearing semantic
// accents (amber/green/red) + a quiet neutral. NO arbitrary color props
// (design-system-guard): one of these, or nothing.
const TONES = {
  purple: HP.purple, // brand
  pink: HP.pink, // brand
  amber: HP.amber, // semantic — caution / gold
  green: HP.green, // semantic — success / watched
  red: HP.red, // semantic — destructive / error
  neutral: HP.text, // quiet near-white tint (like Card, but via the tone formula)
}

/**
 * Accent-tinted trust-surface panel (F11B.4) — the expressive sibling of <Card>.
 *
 * Where <Card> is a FLAT white-tinted surface, AccentPanel is a faint TONE tint
 * (`${tone}0d`) + a matching tone border (`${tone}26`) + a token radius. It's the
 * home for the honesty callouts (WhyThisPick, etc.) that read as brand/semantic-
 * tinted, not flat. Padding/margins stay with the consumer (the primitive owns the
 * surface only). Non-interactive by default; the opt-in `interactive` hover is
 * reduced-motion-gated. ADDITIVE — call sites migrate one at a time, proving parity.
 *
 * @param {object} props
 * @param {'purple'|'pink'|'amber'|'green'|'red'|'neutral'} [props.tone='purple']
 * @param {'xs'|'sm'|'md'|'lg'|'xl'|'pill'} [props.radius='md']  RADIUS token key.
 * @param {boolean} [props.interactive=false]  Opt-in reduced-motion-gated hover.
 * @param {React.ElementType} [props.as='div']
 * @param {string} [props.className]
 * @param {object} [props.style]   Merged onto the root (padding / margins / positioning).
 * @returns {JSX.Element}
 */
export default function AccentPanel({
  tone = 'purple',
  radius = 'md',
  interactive = false,
  as: Tag = 'div',
  className = '',
  style,
  children,
  ...props
}) {
  const c = TONES[tone] || TONES.purple
  return (
    <Tag
      className={`ff-accent-panel${interactive ? ' ff-accent-panel--interactive' : ''}${className ? ` ${className}` : ''}`}
      style={{
        background: `${c}0d`, // ~5% tone tint
        border: `1px solid ${c}26`, // ~15% tone border
        borderRadius: RADIUS[radius] ?? RADIUS.md,
        ...style,
      }}
      {...props}
    >
      {children}
    </Tag>
  )
}
