import { forwardRef } from 'react'

/**
 * Canonical checkbox toggle (visually a switch). Hides the native checkbox
 * via `sr-only peer` and draws the visual track + thumb with siblings.
 *
 * Usage:
 *   <Checkbox id="x" checked={on} onChange={...} label="Public — anyone can see" />
 */
const Checkbox = forwardRef(function Checkbox(
  { id, label, className = '', ...props },
  ref,
) {
  return (
    <label htmlFor={id} className={`flex items-center gap-3 cursor-pointer group ${className}`.trim()}>
      <span className="relative">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className="sr-only peer"
          {...props}
        />
        <span className="block h-5 w-9 rounded-full bg-white/10 peer-checked:bg-[var(--color-action-primary-fill,#efe7d7)] transition-colors" />
        <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
      {label && (
        <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
          {label}
        </span>
      )}
    </label>
  )
})

export default Checkbox
