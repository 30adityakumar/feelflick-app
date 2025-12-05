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
        className={`
          flex-none snap-start px-[2px]
          ${className}
        `}
        style={{
          width,
          height: isExpanded ? height * 1.08 : height,
          scrollSnapAlign: 'start',
          marginRight: 'var(--gap, 1.25rem)',
          transition: 'height 180ms ease-out',
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
            relative w-full h-full rounded-xl overflow-hidden bg-black/40
            transition-transform transition-shadow duration-180 ease-out
            will-change: transform
            ${
              isExpanded
                ? 'scale-[1.06] -translate-y-[4px] shadow-2xl shadow-black/75 z-20'
                : 'hover:scale-[1.03] hover:-translate-y-[2px] shadow-xl shadow-black/60 z-10'
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
