import { forwardRef } from 'react'

const VARIANTS = {
  primary: 'rounded-full bg-[var(--color-action-primary-fill,#efe7d7)] text-[var(--color-action-primary-text,#221b13)] shadow-lg shadow-black/20 hover:brightness-110 motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.97]',
  secondary: 'rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white hover:border-white/20',
  ghost: 'rounded-full border border-[var(--color-border-strong,#46423d)] text-[var(--color-text-secondary,#beb8ad)] hover:border-[var(--color-text-primary,#f3ecdf)] hover:text-[var(--color-text-primary,#f3ecdf)]',
  icon: 'rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-white/80 hover:bg-white/10 hover:text-white motion-safe:hover:scale-105 motion-safe:active:scale-95 flex items-center justify-center',
  destructive: 'rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40',
}

// F12D: even, touch-comfortable height floor via min-height — sm 40 / md 44 / lg 48
// (4px steps). `lg` was already 48px, so min-h-12 is a no-op floor → the /about lg
// CTA stays render-identical (no visual-baseline change). Icon sizes match the floor.
const SIZES = {
  sm: { base: 'min-h-10 px-4 py-1.5 text-xs font-semibold', icon: 'h-10 w-10' },
  md: { base: 'min-h-11 px-6 py-2.5 text-sm font-semibold', icon: 'h-11 w-11' },
  lg: { base: 'min-h-12 px-8 py-3 text-base font-bold', icon: 'h-12 w-12' },
}

const BASE = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,#f3ecdf)]'

/**
 * Canonical button primitive — the one button system (F11B.1 pins this contract).
 *
 * Variants: `primary` (the one neutral ivory action pill), `secondary`, `ghost`, `icon`,
 * `destructive` (alias of "danger"). Sizes: `sm` | `md` | `lg`. All variants are
 * fully-rounded (`rounded-full` ≈ RADIUS.pill), share the focus-visible ivory ring,
 * the disabled (opacity) state, and the in-button micro-spinner (`loading`) — the one
 * sanctioned spinner per CLAUDE.md.
 *
 * Font: the base font is inherited Inter, which is correct under the F4 direction —
 * buttons are interface controls (Inter), not editorial voice (Newsreader). The old
 * "buttons should be Outfit" follow-up is retired with the rest of the Outfit system.
 *
 * @param {object} props
 * @param {'primary'|'secondary'|'ghost'|'icon'|'destructive'} [props.variant='secondary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.fullWidth=false]
 * @param {boolean} [props.loading=false]  Shows the in-button spinner + disables.
 * @param {boolean} [props.disabled=false]
 */
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
        <span className="inline-block h-4 w-4 rounded-full border-2 border-current/40 border-t-current animate-spin" />
      ) : children}
    </button>
  )
})

export default Button
