import { forwardRef } from 'react'
import { RADIUS } from '@/shared/lib/tokens'
import './Surface.css'

const LEVELS = {
  1: 'var(--ts-surface-1, #1d1814)',
  2: 'var(--ts-surface-2, #241e19)',
  raised: 'var(--ts-surface-raised, #2d2621)',
}

const BORDERS = {
  none: 'none',
  subtle: '1px solid var(--ts-border-subtle, #302c28)',
  strong: '1px solid var(--ts-border-strong, #46423d)',
}

// Minimal, warm-neutral shadow only — no colored/rose/purple glow.
const NEUTRAL_SHADOW = '0 1px 2px rgba(0, 0, 0, 0.35)'

/**
 * Surface — solid graphite contained-surface primitive (Stage 1).
 *
 * Cards and contained surfaces stay mostly solid (no page-depth gradient inside
 * them). Reuses the established restrained RADIUS scale. Borders are subtle/strong
 * graphite. Shadows are minimal and warm-neutral — no colored/rose/purple glow, no
 * glassmorphism, no gradient border, no animated hover lift by default. This is a
 * generic non-interactive surface; interactive lift belongs on the owning control.
 *
 * @param {object} props
 * @param {1|2|'raised'} [props.level=1] solid graphite fill level
 * @param {'none'|'subtle'|'strong'} [props.border='subtle']
 * @param {'xs'|'sm'|'md'|'lg'|'xl'|'pill'} [props.radius='lg'] restrained RADIUS scale
 * @param {boolean} [props.shadow=false] opt-in minimal neutral shadow
 * @param {React.ElementType} [props.as='div']
 * @param {string} [props.className]
 * @param {object} [props.style]
 */
const Surface = forwardRef(function Surface({
  level = 1,
  border = 'subtle',
  radius = 'lg',
  shadow = false,
  as: Tag = 'div',
  className = '',
  style,
  children,
  ...props
}, ref) {
  const composed = {
    background: LEVELS[level] ?? LEVELS[1],
    border: BORDERS[border] ?? BORDERS.subtle,
    borderRadius: RADIUS[radius] ?? RADIUS.lg,
    ...(shadow ? { boxShadow: NEUTRAL_SHADOW } : null),
    ...style,
  }
  return (
    <Tag ref={ref} className={`ts-surface${className ? ` ${className}` : ''}`} style={composed} {...props}>
      {children}
    </Tag>
  )
})

export default Surface
