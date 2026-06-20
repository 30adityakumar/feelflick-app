import './brand-accent.css'

/**
 * Narrow cinematic coral-red signature helpers.
 *
 * Permitted roles: wordmark detail, lightweight links, small signature marks and
 * rare expressive labels. The accent is never a primary action, decision or
 * selected state, semantic status, mood identity, large atmosphere, card fill or
 * pervasive glow.
 */

export function BrandMark({ className = '', ...props }) {
  return <span className={`ts-brand-mark${className ? ` ${className}` : ''}`} aria-hidden="true" {...props} />
}

export function BrandLink({ as: Tag = 'a', className = '', children, ...props }) {
  return (
    <Tag className={`ts-brand-link${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </Tag>
  )
}

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
