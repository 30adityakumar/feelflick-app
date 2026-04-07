import { memo } from 'react'

export const Card = memo(function Card({
  hoverPhase = 'rest',
  width = 220,
  height = 330,
  expandedWidth = width,
  expandedHeight = height,
  ghosted = false,
  dimmed = false,
  siblingOffset = 0,
  reducedMotion = false,
  expandAlign = 'center',
  className = '',
  children,
  ...props
}) {
  const isInteractive = hoverPhase !== 'rest'
  const isExpanded = hoverPhase === 'expanded'
  const widthDelta = Math.max(0, expandedWidth - width)
  const leftOffset =
    expandAlign === 'left'
      ? 0
      : expandAlign === 'right'
        ? -widthDelta
        : -Math.round(widthDelta / 2)
  const scale = ghosted ? 1 : isExpanded ? 1.02 : isInteractive ? 1.012 : dimmed ? 0.97 : 1
  const transformOrigin =
    expandAlign === 'left'
      ? 'left top'
      : expandAlign === 'right'
        ? 'right top'
        : 'center top'

  return (
    <div
      className={`flex-none snap-start px-[2px] ${className}`}
      style={{
        width,
        height: isExpanded ? Math.round(height * 1.55) : height,
        scrollSnapAlign: 'start',
        position: 'relative',
        overflow: 'visible',
        transition: reducedMotion
          ? 'height 100ms linear'
          : 'height 280ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      data-hover-phase={hoverPhase}
      data-ghosted={ghosted ? 'true' : 'false'}
      data-dimmed={dimmed ? 'true' : 'false'}
      {...props}
    >
      <article
        className="absolute left-0 top-0 isolate overflow-hidden rounded-[var(--radius-xl)] border"
        style={{
          left: isExpanded ? leftOffset : 0,
          width: isExpanded ? expandedWidth : width,
          height: isExpanded ? expandedHeight : height,
          opacity: ghosted ? 0.25 : dimmed ? 0.6 : 1,
          transformOrigin,
          transform: reducedMotion
            ? `scale(${ghosted ? 1 : dimmed ? 0.97 : 1})`
            : `translateX(${isExpanded ? 0 : siblingOffset}px) translateY(${isExpanded ? -8 : isInteractive ? -3 : 0}px) scale(${scale})`,
          boxShadow: isExpanded
            ? 'var(--shadow-hover)'
            : isInteractive
              ? 'var(--shadow-hover)'
              : 'var(--shadow-soft)',
          background: 'var(--surface)',
          borderColor: isExpanded ? 'rgba(216, 180, 254, 0.22)' : isInteractive ? 'rgba(216, 180, 254, 0.12)' : 'rgba(248, 250, 252, 0.08)',
          transition: reducedMotion
            ? 'opacity 100ms linear'
            : 'opacity 200ms ease, left 280ms cubic-bezier(0.22, 1, 0.36, 1), width 280ms cubic-bezier(0.22, 1, 0.36, 1), height 280ms cubic-bezier(0.22, 1, 0.36, 1), transform 300ms ease, box-shadow 300ms ease, border-color 300ms ease',
          zIndex: isExpanded ? 50 : isInteractive ? 20 : 1,
          willChange: 'transform,height,width,left',
        }}
      >
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/6" />
        {children}
      </article>
    </div>
  )
})

Card.displayName = 'CarouselCard'
