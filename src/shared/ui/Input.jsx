import { forwardRef } from 'react'

/**
 * Canonical text input. Standardizes border / background / placeholder opacity
 * and the focus ring across the codebase.
 *
 * Pure styling primitive: no built-in label. Consumers compose <label>
 * separately. Pass any standard <input> prop through.
 */
const BASE = 'w-full rounded-lg bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--color-border-strong,#46423d)] focus:ring-2 focus:ring-[var(--color-focus,#f3ecdf)]/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const Input = forwardRef(function Input({ className = '', ...props }, ref) {
  return <input ref={ref} className={`${BASE} ${className}`.trim()} {...props} />
})

export default Input
