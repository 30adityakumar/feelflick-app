import { forwardRef } from 'react'
import './PageDepth.css'

const DEPTHS = new Set(['radial', 'linear', 'none'])

/**
 * PageDepth — the one neutral background-depth primitive.
 *
 * Paints a near-black → warm-graphite tonal transition for large page / hero /
 * immersive-modal / large-section backgrounds. This is a NEUTRAL atmospheric
 * treatment, NOT a brand gradient and NOT a replacement for the retired legacy
 * purple→pink gradient. It carries no meaning, has no animation, no glow, and no
 * rose/purple/pink/contextual color. Under forced-colors it collapses to the
 * system Canvas. It does not intercept pointer events (children interact normally).
 *
 * Do NOT use it inside cards, on buttons, chips, nav, selected/semantic states, or
 * as a decorative glow — keep contained surfaces solid (see Surface).
 *
 * @param {object} props
 * @param {'radial'|'linear'|'none'} [props.depth='radial'] radial is preferred;
 *   linear only where geometry requires it; none = solid canvas.
 * @param {React.ElementType} [props.as='div']
 * @param {string} [props.className]
 * @param {object} [props.style]
 */
const PageDepth = forwardRef(function PageDepth(
  { depth = 'radial', as: Tag = 'div', className = '', style, children, ...props },
  ref,
) {
  const d = DEPTHS.has(depth) ? depth : 'radial'
  return (
    <Tag
      ref={ref}
      className={`ts-page-depth ts-page-depth--${d}${className ? ` ${className}` : ''}`}
      style={style}
      {...props}
    >
      {children}
    </Tag>
  )
})

export default PageDepth
