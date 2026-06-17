import './brand-accent.css'

/**
 * Bounded rose-accent helpers (Stage 1) — ONE restrained solid rose used sparingly.
 *
 * Deliberately three explicit, narrow helpers (not a single `.accent` utility that
 * would encourage leakage). Permitted uses only: wordmark detail, lightweight links,
 * small signature marks, limited expressive emphasis. Rose is NEVER a primary action,
 * decision/selected state, semantic state, navigation background, page atmosphere,
 * card fill, or pervasive glow.
 *
 * Rose-on-dark text uses `--ts-brand-rose` (#dd4e83). The deeper
 * `--ts-brand-rose-contrast` (#c0356c) is used ONLY where white text sits on rose
 * (the `solid` BrandSignature), for WCAG AA contrast — not as a second accent identity.
 */

/** A tiny rose dot/mark — e.g. a wordmark detail or signature mark. Decorative. */
export function BrandMark({ className = '', ...props }) {
  return <span className={`ts-brand-mark${className ? ` ${className}` : ''}`} aria-hidden="true" {...props} />
}

/** A lightweight rose link. Defaults to an anchor; pass `as="button"` for actions. */
export function BrandLink({ as: Tag = 'a', className = '', children, ...props }) {
  return (
    <Tag className={`ts-brand-link${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </Tag>
  )
}

/**
 * A small uppercase rose signature/kicker. `solid` renders a compact white-on-rose
 * pill using the AA contrast variant for a rare expressive moment.
 */
export function BrandSignature({ solid = false, as: Tag = 'span', className = '', children, ...props }) {
  return (
    <Tag
      className={`ts-brand-signature${solid ? ' ts-brand-signature--solid' : ''}${className ? ` ${className}` : ''}`}
      {...props}
    >
      {children}
    </Tag>
  )
}
