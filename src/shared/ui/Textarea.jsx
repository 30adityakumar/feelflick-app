import { forwardRef } from 'react'

/**
 * Canonical textarea. Same styling system as Input — share border opacity,
 * background, placeholder opacity, focus ring.
 */
const BASE = 'w-full resize-none rounded-lg bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const Textarea = forwardRef(function Textarea({ className = '', ...props }, ref) {
  return <textarea ref={ref} className={`${BASE} ${className}`.trim()} {...props} />
})

export default Textarea
