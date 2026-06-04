// src/shared/ui/Card.jsx
import './Card.css'
import { RADIUS, SURFACE, HP } from '@/shared/lib/tokens'

/**
 * Canonical surface / card primitive (F11B.1).
 *
 * FeelFlick prefers BORDERS over shadows (doctrine): a faint surface tint + a
 * hairline border + a consistent token radius. Elevation/animation is opt-in and
 * reduced-motion-safe. Use this instead of hand-rolling inline panels so callout
 * surfaces (WhyThisPick / PrimaryCaseCard / DnaConfidence-style cards) share one
 * shape. ADDITIVE in F11B.1 — existing call sites are migrated in later waves.
 *
 * @param {object} props
 * @param {React.ElementType} [props.as='div']
 * @param {'base'|'panel'|'card'|'elevated'} [props.tint='card']  Surface tint (SURFACE token).
 * @param {'xs'|'sm'|'md'|'lg'|'xl'|'pill'} [props.radius='lg']   Corner radius (RADIUS token key).
 * @param {boolean} [props.border=true]   Hairline border (HP.border).
 * @param {boolean} [props.hover=false]   Opt-in hover lift — reduced-motion-gated via CSS.
 * @param {string} [props.className]
 * @param {object} [props.style]          Merged onto the root (positioning / padding).
 * @returns {JSX.Element}
 */
export default function Card({
  as: Tag = 'div',
  tint = 'card',
  radius = 'lg',
  border = true,
  hover = false,
  className = '',
  style,
  children,
  ...props
}) {
  return (
    <Tag
      className={`ff-card${hover ? ' ff-card--hover' : ''}${className ? ` ${className}` : ''}`}
      style={{
        background: SURFACE[tint] ?? SURFACE.card,
        borderRadius: RADIUS[radius] ?? RADIUS.lg,
        border: border ? `1px solid ${HP.border}` : 'none',
        ...style,
      }}
      {...props}
    >
      {children}
    </Tag>
  )
}
