import { forwardRef } from 'react'
import './foundations.css'

/**
 * ThoughtfulRoot — the Stage 1 token-activation scope.
 *
 * Wraps a subtree in `.ts-root`, which is the ONLY place the `--ts-*` foundation
 * custom properties are defined (see foundations.css). A pilot surface (later
 * Tonight / Film File stages) wraps the migrated region in `<ThoughtfulRoot>` to
 * opt into the Thoughtful Seatmate foundation locally — it never globalizes the
 * tokens. Outside a `.ts-root`, the Stage 1 primitives fall back to their literal
 * accepted values (defensive `var(--ts-*, <fallback>)`), so a stray primitive still
 * renders correctly, but `.ts-root` remains the canonical activation scope.
 *
 * Layout-only: no background, decoration, or motion of its own (compose with
 * PageDepth / Surface for visuals).
 *
 * @param {object} props
 * @param {React.ElementType} [props.as='div'] polymorphic element
 * @param {string} [props.className]
 * @param {object} [props.style]
 */
const ThoughtfulRoot = forwardRef(function ThoughtfulRoot(
  { as: Tag = 'div', className = '', style, children, ...props },
  ref,
) {
  return (
    <Tag ref={ref} className={`ts-root${className ? ` ${className}` : ''}`} style={style} {...props}>
      {children}
    </Tag>
  )
})

export default ThoughtfulRoot
