import { forwardRef } from 'react'

const VARIANTS = {
  primary: 'rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20 hover:from-purple-400 hover:to-pink-400 hover:scale-[1.02] active:scale-[0.98]',
  secondary: 'rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white hover:border-white/20',
  ghost: 'rounded-full border border-purple-500/30 text-purple-400 hover:border-purple-400/50 hover:text-purple-300',
  icon: 'rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-white/80 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95 flex items-center justify-center',
  destructive: 'rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40',
}

const SIZES = {
  sm: { base: 'px-4 py-1.5 text-xs font-semibold', icon: 'h-8 w-8' },
  md: { base: 'px-6 py-2.5 text-sm font-semibold', icon: 'h-10 w-10' },
  lg: { base: 'px-8 py-3 text-base font-bold', icon: 'h-12 w-12' },
}

const BASE = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50'

const Button = forwardRef(function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  fullWidth = false,
  loading = false,
  disabled = false,
  children,
  ...props
}, ref) {
  const variantClass = VARIANTS[variant] || VARIANTS.secondary
  const sizeClass = variant === 'icon' ? SIZES[size].icon : SIZES[size].base
  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${BASE} ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim()}
      {...props}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
      ) : children}
    </button>
  )
})

export default Button
