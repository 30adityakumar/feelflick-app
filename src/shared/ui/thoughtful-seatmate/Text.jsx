import { forwardRef } from 'react'
import './text.css'

const VARIANTS = new Set([
  'display', 'title', 'section', 'body', 'body-sm', 'label', 'caption', 'metadata',
])

/**
 * Text — Inter-only typography primitive (Stage 1).
 *
 * One coherent sans-serif voice; hierarchy from the `variant` scale only. Choose the
 * semantic element with `as` (e.g. `as="h1"` for a display heading) independently of
 * the visual variant. No serif / display / editorial family is available by design.
 * (The prop is `variant`, not `role`, to avoid colliding with the HTML ARIA `role`.)
 *
 * @param {object} props
 * @param {'display'|'title'|'section'|'body'|'body-sm'|'label'|'caption'|'metadata'} [props.variant='body']
 * @param {React.ElementType} [props.as='p']
 * @param {string} [props.className]
 * @param {object} [props.style]
 */
const Text = forwardRef(function Text({
  variant = 'body',
  as: Tag = 'p',
  className = '',
  style,
  children,
  ...props
}, ref) {
  const v = VARIANTS.has(variant) ? variant : 'body'
  return (
    <Tag ref={ref} className={`ts-text ts-text--${v}${className ? ` ${className}` : ''}`} style={style} {...props}>
      {children}
    </Tag>
  )
})

export default Text
