import { forwardRef } from 'react'
import './foundations.css'

/**
 * ThoughtfulRoot — the Thoughtful Seatmate composition scope.
 *
 * Wraps a subtree in `.ts-root`. The `--ts-*` foundation custom properties are now
 * defined globally by the canonical website theme (`.theme-thoughtful` in
 * foundations.css, applied once at the app root) AND re-asserted by `.ts-root`, which
 * inherits the canonical values. A composition-migrated surface (home, movie,
 * watchlist) wraps its region in `<ThoughtfulRoot>` to mark Thoughtful Seatmate
 * composition scope; this no longer "activates" the tokens (the global theme already
 * does) — it scopes composition and keeps the `--ts-*` names resolving. Outside a
 * `.ts-root`, the primitives still fall back to their literal accepted values
 * (defensive `var(--ts-*, <fallback>)`), so a stray primitive renders correctly.
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
