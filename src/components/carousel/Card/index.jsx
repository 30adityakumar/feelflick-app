// src/components/carousel/Card/index.jsx
import { memo, forwardRef } from 'react'

export const Card = memo(
  forwardRef(function Card(
    {
      item,
      index,
      isExpanded,
      onHover,
      onLeave,
      width = 220,
      height = 330,
      children,
      className = '',
      priority = false,
      ...props
    },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={`flex-none snap-start px-[2px] ${className}`}
        style={{
          width,
          height: isExpanded ? Math.round(height * 1.55) : height,
          scrollSnapAlign: 'start',
          marginRight: 'var(--gap, 1.25rem)',
          transition: 'height 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={() => onHover?.(item.id)}
        onMouseLeave={() => onLeave?.()}
        onFocus={() => onHover?.(item.id)}
        onBlur={() => onLeave?.()}
        tabIndex={-1}
        aria-expanded={isExpanded}
        {...props}
      >
        <article
          className={`
            relative w-full h-full rounded-xl overflow-hidden bg-neutral-950
            transition-all duration-300 ease-out
            ${
              isExpanded
                ? 'shadow-2xl shadow-purple-950/60 z-20 ring-1 ring-purple-500/40'
                : 'bg-neutral-900 hover:scale-[1.02] hover:-translate-y-[2px] hover:shadow-xl hover:shadow-black/60 hover:ring-1 hover:ring-purple-500/25'
            }
          `}
        >
          {children({ item, isExpanded, index, priority })}
        </article>
      </div>
    )
  })
)

Card.displayName = 'CarouselCard'
