import { forwardRef } from 'react'
import './Button.css'

const VARIANTS = {
  primary: 'rounded-xl border border-transparent bg-[var(--color-action-primary-fill,#f0ece4)] text-[var(--color-action-primary-text,#0f1010)] shadow-sm hover:brightness-95 motion-safe:active:translate-y-px',
  secondary: 'rounded-xl border border-[var(--color-border-subtle,#3a3d41)] bg-[var(--color-surface-1,#171819)] text-[var(--color-text-secondary,#c9c5bc)] hover:border-[var(--color-border-strong,#747a82)] hover:bg-[var(--color-surface-2,#222427)] hover:text-[var(--color-text-primary,#f5f2eb)]',
  ghost: 'rounded-xl border border-transparent bg-transparent text-[var(--color-text-secondary,#c9c5bc)] hover:border-[var(--color-border-subtle,#3a3d41)] hover:bg-[var(--color-surface-1,#171819)] hover:text-[var(--color-text-primary,#f5f2eb)]',
  icon: 'rounded-full border border-[var(--color-border-subtle,#3a3d41)] bg-[var(--color-surface-1,#171819)] text-[var(--color-text-secondary,#c9c5bc)] hover:border-[var(--color-border-strong,#747a82)] hover:bg-[var(--color-surface-2,#222427)] hover:text-[var(--color-text-primary,#f5f2eb)] motion-safe:active:translate-y-px flex items-center justify-center',
  destructive: 'rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:border-red-400/60 hover:bg-red-500/20',
}

const SIZES = {
  sm: { base: 'min-h-11 px-4 py-2 text-xs font-semibold', icon: 'h-11 w-11' },
  md: { base: 'min-h-11 px-6 py-2.5 text-sm font-semibold', icon: 'h-11 w-11' },
  lg: { base: 'min-h-12 px-8 py-3 text-base font-bold', icon: 'h-12 w-12' },
}

const BASE = 'inline-flex items-center justify-center gap-2 font-semibold transition-[background-color,border-color,color,filter,transform,box-shadow] duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

const Button = forwardRef(function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  fullWidth = false,
  loading = false,
  disabled = false,
  type,
  children,
  ...props
}, ref) {
  const variantClass = VARIANTS[variant] || VARIANTS.secondary
  const sizeKey = SIZES[size] ? size : 'md'
  const sizeClass = variant === 'icon' ? SIZES[sizeKey].icon : SIZES[sizeKey].base
  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <button
      ref={ref}
      type={type || 'button'}
      {...props}
      disabled={disabled || loading}
      aria-busy={loading ? true : props['aria-busy']}
      data-loading={loading ? 'true' : undefined}
      className={`ff-btn ${BASE} ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim()}
    >
      {loading ? (
        <>
          <span className="ff-btn__spinner" aria-hidden="true" />
          <span className="ff-btn__label" data-loading-label="true">{children}</span>
        </>
      ) : children}
    </button>
  )
})

export default Button
