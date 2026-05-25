import { forwardRef } from 'react'

/**
 * Canonical select. appearance-none drops the native chevron so consumers can
 * compose their own indicator. Same focus-ring + border treatment as Input.
 */
const BASE = 'w-full appearance-none rounded-lg bg-white/5 border border-white/10 pl-4 pr-9 py-2.5 text-sm text-white/70 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

const Select = forwardRef(function Select({ className = '', children, ...props }, ref) {
  return (
    <select ref={ref} className={`${BASE} ${className}`.trim()} {...props}>
      {children}
    </select>
  )
})

export default Select
