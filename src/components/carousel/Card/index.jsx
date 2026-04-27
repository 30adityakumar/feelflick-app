import { memo } from 'react'

export const Card = memo(function Card({
  hovered = false,
  width = 220,
  height = 330,
  reducedMotion = false,
  className = '',
  children,
  ...props
}) {
  return (
    <div
      className={`relative flex-none snap-start overflow-hidden rounded-[var(--radius-xl)] border ${className}`}
      style={{
        width,
        height,
        scrollSnapAlign: 'start',
        background: 'var(--surface)',
        borderColor: hovered ? 'rgba(216, 180, 254, 0.18)' : 'rgba(248, 250, 252, 0.08)',
        boxShadow: hovered ? 'var(--shadow-hover)' : 'var(--shadow-soft)',
        transition: reducedMotion ? undefined : 'box-shadow 220ms ease, border-color 220ms ease',
      }}
      data-hovered={hovered ? 'true' : 'false'}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/6" />
      {children}
    </div>
  )
})

Card.displayName = 'CarouselCard'
