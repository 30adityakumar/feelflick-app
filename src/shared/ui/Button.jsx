import { forwardRef } from 'react'
import './Button.css'

const VARIANTS = {
  primary: 'rounded-full bg-[var(--color-action-primary-fill,#efe7d7)] text-[var(--color-action-primary-text,#221b13)] shadow-lg shadow-black/20 hover:brightness-110 motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.97]',
  secondary: 'rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white hover:border-white/20',
  ghost: 'rounded-full border border-[var(--color-border-strong,#46423d)] text-[var(--color-text-secondary,#beb8ad)] hover:border-[var(--color-text-primary,#f3ecdf)] hover:text-[var(--color-text-primary,#f3ecdf)]',
  icon: 'rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-white/80 hover:bg-white/10 hover:text-white motion-safe:hover:scale-105 motion-safe:active:scale-95 flex items-center justify-center',
  destructive: 'rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40',
}

// F12D: even, touch-comfortable height floor via min-height — sm 40 / md 44 / lg 48
// (4px steps). The 44px small-size decision + resting visual convergence are deferred
// to a later slice; this slice keeps the 40/44/48 ramp byte-identical. Icon sizes
// match the floor.
const SIZES = {
  sm: { base: 'min-h-10 px-4 py-1.5 text-xs font-semibold', icon: 'h-10 w-10' },
  md: { base: 'min-h-11 px-6 py-2.5 text-sm font-semibold', icon: 'h-11 w-11' },
  lg: { base: 'min-h-12 px-8 py-3 text-base font-bold', icon: 'h-12 w-12' },
}

// Resting + hover/press utilities. Focus-visible, forced-colors, and the loading
// spinner are owned by the colocated `.ff-btn` rules in Button.css (an offset outline
// that survives forced-colors and a reduced-motion-safe spinner — clearer and safer
// than utility classes). NOTE: the previous tight focus RING (no offset) is removed —
// an ivory ring sitting on the ivory primary fill is low-contrast; the canonical
// treatment is the offset outline shared by every variant.
const BASE = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

/**
 * Canonical button primitive — the one app-interface button system, and the approved
 * long-term public neutral-primary API (see docs/ui/composition-system-ownership.md).
 *
 * Variants: `primary` (the one neutral ivory action pill), `secondary`, `ghost`, `icon`,
 * `destructive`. Sizes: `sm` | `md` | `lg` (40 / 44 / 48 px floors). All variants are
 * fully-rounded pills sharing the canonical offset focus outline (`--color-focus`,
 * Button.css), the disabled (opacity) state, and the reduced-motion-safe in-button
 * spinner (`loading`).
 *
 * Accessibility / semantic contract (Slice A hardening):
 *   • defaults to `type="button"` (no accidental form submit); callers may set
 *     `type="submit"` explicitly.
 *   • `loading` disables the button, sets `aria-busy="true"` + `data-loading="true"`,
 *     and overlays a decorative (`aria-hidden`) spinner over a width-reserving label —
 *     the accessible name is preserved and there is no horizontal layout shift.
 *   • the component owns `disabled` / `aria-busy` / `data-loading` while loading; a
 *     caller cannot spread props that make a loading button appear enabled or not busy.
 *   • an invalid/undefined `size` falls back to `md` (ordinary and icon) — never throws.
 *
 * Font: inherited Inter (interface voice). PrimaryAction (Thoughtful Seatmate) remains
 * frozen and standalone — not wrapped or migrated in this slice.
 *
 * @param {object} props
 * @param {'primary'|'secondary'|'ghost'|'icon'|'destructive'} [props.variant='secondary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.fullWidth=false]
 * @param {boolean} [props.loading=false]  Disables + shows the spinner; preserves the label.
 * @param {boolean} [props.disabled=false]
 * @param {'button'|'submit'|'reset'} [props.type='button']
 */
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
  // Invalid/undefined size → md contract (ordinary + icon); never throws.
  const sizeKey = SIZES[size] ? size : 'md'
  const sizeClass = variant === 'icon' ? SIZES[sizeKey].icon : SIZES[sizeKey].base
  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <button
      ref={ref}
      type={type || 'button'}
      // Caller props spread FIRST so the controlled state below always wins: a caller
      // cannot make a loading button appear enabled or not-busy.
      {...props}
      disabled={disabled || loading}
      aria-busy={loading ? true : props['aria-busy']}
      data-loading={loading ? 'true' : undefined}
      className={`ff-btn ${BASE} ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim()}
    >
      {loading ? (
        <>
          <span className="ff-btn__spinner" aria-hidden="true" />
          {/* Width-reserving label: stays in the DOM + accessibility tree (opacity
              only) so the accessible name persists and the button width is stable. */}
          <span className="ff-btn__label" data-loading-label="true">{children}</span>
        </>
      ) : children}
    </button>
  )
})

export default Button
