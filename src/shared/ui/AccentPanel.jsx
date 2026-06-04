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

// The two surfaces a trust callout can wear, both tone-driven (no arbitrary
// gradient/angle/stop/color props). `tint` = flat (F11B.4, WhyThisPick); `gradient`
// = the directional brand panel glow encoded from PrimaryCaseCard (F11B.5).
function surfaceFor(variant, c) {
  if (variant === 'gradient') {
    return {
      background: `linear-gradient(160deg, ${c}0f, transparent 72%)`,
      border: `1px solid ${c}33`,
    }
  }
  return {
    background: `${c}0d`, // ~5% tone tint
    border: `1px solid ${c}26`, // ~15% tone border
  }
}

/**
 * Accent-tinted trust-surface panel (F11B.4 + F11B.5) — the expressive sibling of <Card>.
 *
 * Where <Card> is a FLAT white-tinted surface, AccentPanel is a tone-driven trust
 * surface: a faint **tint** (`${tone}0d` + `${tone}26`) or, via `variant="gradient"`,
 * the **directional brand glow** encoded from PrimaryCaseCard
 * (`linear-gradient(160deg, ${tone}0f, transparent 72%)` + `${tone}33`). Both are FIXED
 * recipes driven only by the approved tone — there are NO angle/stop/color props. It's the
 * home for the honesty callouts (WhyThisPick, PrimaryCaseCard) that read as brand/semantic-
 * tinted, not flat. Padding/margins stay with the consumer (the primitive owns the surface
 * only). Non-interactive by default; the opt-in `interactive` hover is reduced-motion-gated.
 *
 * @param {object} props
 * @param {'purple'|'pink'|'amber'|'green'|'red'|'neutral'} [props.tone='purple']
 * @param {'tint'|'gradient'} [props.variant='tint']  Surface recipe (unknown → tint).
 * @param {'xs'|'sm'|'md'|'lg'|'xl'|'pill'} [props.radius='md']  RADIUS token key.
 * @param {boolean} [props.interactive=false]  Opt-in reduced-motion-gated hover.
 * @param {React.ElementType} [props.as='div']
 * @param {string} [props.className]
 * @param {object} [props.style]   Merged onto the root (padding / margins / positioning).
 * @returns {JSX.Element}
 */
export default function AccentPanel({
  tone = 'purple',
  variant = 'tint',
  radius = 'md',
  interactive = false,
  as: Tag = 'div',
  className = '',
  style,
  children,
  ...props
}) {
  const c = TONES[tone] || TONES.purple
  const isGradient = variant === 'gradient'
  return (
    <Tag
      className={`ff-accent-panel ff-accent-panel--${isGradient ? 'gradient' : 'tint'}${interactive ? ' ff-accent-panel--interactive' : ''}${className ? ` ${className}` : ''}`}
      style={{
        ...surfaceFor(variant, c),
        borderRadius: RADIUS[radius] ?? RADIUS.md,
        ...style,
      }}
      {...props}
    >
      {children}
    </Tag>
  )
}
