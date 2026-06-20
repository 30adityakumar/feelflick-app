import { forwardRef } from 'react'
import './PageDepth.css'

const DEPTHS = new Set(['radial', 'linear', 'none'])

/**
 * PageDepth — optional large-surface staging.
 *
 * Flat ink (`none`) is the default. Radial and linear recipes are reserved for
 * a soft introduction, one focal film, or an immersive modal. They must not be
 * used inside cards, buttons, chips, navigation, or semantic states.
 */
const PageDepth = forwardRef(function PageDepth(
  { depth = 'none', as: Tag = 'div', className = '', style, children, ...props },
  ref,
) {
  const d = DEPTHS.has(depth) ? depth : 'none'
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
