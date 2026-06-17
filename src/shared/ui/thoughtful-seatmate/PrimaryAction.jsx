import { forwardRef } from 'react'
import './PrimaryAction.css'

/**
 * PrimaryAction — the neutral projection-ivory primary action (Stage 1).
 *
 * Solid ivory fill (`--ts-action-primary-fill` #efe7d7) + dark warm text
 * (`--ts-action-primary-text` #221b13). Calm, high-contrast, obvious. NO rose,
 * purple, gradient, glow, or contextual color. Follows the established Button
 * architecture (forwardRef, sm/md/lg touch-target floors 44/44/48, in-button micro-spinner
 * for `loading`, disabled state, focus-visible ring, reduced-motion-gated press) as
 * an opt-in scoped primitive — it does not fork or modify the production Button, and
 * is excluded from the production bundle until a pilot imports it.
 *
 * States carry no layout shift: hover dims via filter, press translates, loading
 * overlays a centered spinner while the label reserves its width.
 *
 * @param {object} props
 * @param {'sm'|'md'|'lg'} [props.size='md'] touch-target floors 44 / 44 / 48 px
 * @param {boolean} [props.fullWidth=false]
 * @param {boolean} [props.loading=false] shows the in-button spinner + disables
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.className]
 */
const PrimaryAction = forwardRef(function PrimaryAction({
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}, ref) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading ? 'true' : undefined}
      className={`ts-action-primary ts-action-primary--${size}${fullWidth ? ' ts-action-primary--full' : ''}${className ? ` ${className}` : ''}`}
      {...props}
    >
      {loading && <span className="ts-action-primary__spinner" aria-hidden="true" />}
      <span className="ts-action-primary__label">{children}</span>
    </button>
  )
})

export default PrimaryAction
